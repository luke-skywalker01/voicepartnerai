"""
Workspace Management API Endpoints
Handles CRUD operations for workspaces and member management
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from pydantic import BaseModel, EmailStr, validator
from datetime import datetime, timezone
import uuid

from database import get_db
from models import User, Workspace, WorkspaceMember, WorkspaceRole
from workspace_permissions import (
    WorkspacePermissions, 
    require_workspace_owner, 
    require_workspace_admin,
    require_workspace_membership
)
from auth import get_current_user  # Assuming this exists

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])


# Pydantic Schemas
class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    plan: str = "free"
    
    @validator('name')
    def validate_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Workspace name must be at least 2 characters')
        if len(v.strip()) > 100:
            raise ValueError('Workspace name must be less than 100 characters')
        return v.strip()


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    member_limit: Optional[int] = None
    credits_limit: Optional[float] = None


class WorkspaceResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str]
    plan: str
    member_count: int
    current_credits: float
    credits_limit: float
    member_limit: int
    created_at: datetime
    user_role: str
    
    class Config:
        from_attributes = True


class MemberInvite(BaseModel):
    email: EmailStr
    role: WorkspaceRole = WorkspaceRole.MEMBER
    message: Optional[str] = None


class MemberUpdate(BaseModel):
    role: WorkspaceRole


class MemberResponse(BaseModel):
    id: int
    user_id: int
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    role: str
    joined_at: datetime
    invited_at: Optional[datetime]
    invited_by_email: Optional[str]
    is_active: bool
    
    class Config:
        from_attributes = True


class WorkspaceStats(BaseModel):
    total_assistants: int
    total_phone_numbers: int
    total_calls_this_month: int
    credits_used_this_month: float
    active_members: int


# Helper Functions
def generate_unique_slug(db: Session, name: str) -> str:
    """Generiert einen eindeutigen Slug für einen Workspace."""
    base_slug = name.lower().replace(' ', '-').replace('_', '-')
    # Remove special characters
    import re
    base_slug = re.sub(r'[^a-z0-9-]', '', base_slug)
    
    slug = base_slug
    counter = 1
    
    while db.query(Workspace).filter(Workspace.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    return slug


# API Endpoints

@router.get("/", response_model=List[WorkspaceResponse])
async def get_user_workspaces(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Gibt alle Workspaces zurück, in denen der User Mitglied ist."""
    workspaces_data = []
    
    # Get all workspace memberships
    memberships = db.query(WorkspaceMember, Workspace).join(
        Workspace, WorkspaceMember.workspace_id == Workspace.id
    ).filter(
        WorkspaceMember.user_id == current_user.id,
        WorkspaceMember.is_active == True
    ).all()
    
    for membership, workspace in memberships:
        # Count active members
        member_count = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == workspace.id,
            WorkspaceMember.is_active == True
        ).count()
        
        workspaces_data.append(WorkspaceResponse(
            id=workspace.id,
            name=workspace.name,
            slug=workspace.slug,
            description=workspace.description,
            plan=workspace.plan,
            member_count=member_count,
            current_credits=workspace.current_credits,
            credits_limit=workspace.credits_limit,
            member_limit=workspace.member_limit,
            created_at=workspace.created_at,
            user_role=membership.role.value
        ))
    
    return workspaces_data


@router.post("/", response_model=WorkspaceResponse)
async def create_workspace(
    workspace_data: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Erstellt einen neuen Workspace."""
    
    # Generate unique slug
    slug = generate_unique_slug(db, workspace_data.name)
    
    # Create workspace
    workspace = Workspace(
        name=workspace_data.name,
        slug=slug,
        description=workspace_data.description,
        plan=workspace_data.plan,
        billing_email=current_user.email,
        member_limit=5 if workspace_data.plan == "free" else 50,
        credits_limit=100.0 if workspace_data.plan == "free" else 1000.0,
        current_credits=100.0 if workspace_data.plan == "free" else 1000.0
    )
    
    db.add(workspace)
    db.flush()  # Get workspace.id
    
    # Add creator as owner
    membership = WorkspaceMember(
        user_id=current_user.id,
        workspace_id=workspace.id,
        role=WorkspaceRole.OWNER,
        is_active=True
    )
    db.add(membership)
    
    # Set as current workspace if user has none
    if not current_user.current_workspace_id:
        current_user.current_workspace_id = workspace.id
    
    db.commit()
    db.refresh(workspace)
    
    return WorkspaceResponse(
        id=workspace.id,
        name=workspace.name,
        slug=workspace.slug,
        description=workspace.description,
        plan=workspace.plan,
        member_count=1,
        current_credits=workspace.current_credits,
        credits_limit=workspace.credits_limit,
        member_limit=workspace.member_limit,
        created_at=workspace.created_at,
        user_role="owner"
    )


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: int,
    membership: WorkspaceMember = Depends(require_workspace_membership),
    db: Session = Depends(get_db)
):
    """Gibt Details zu einem spezifischen Workspace zurück."""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    # Count active members
    member_count = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.is_active == True
    ).count()
    
    return WorkspaceResponse(
        id=workspace.id,
        name=workspace.name,
        slug=workspace.slug,
        description=workspace.description,
        plan=workspace.plan,
        member_count=member_count,
        current_credits=workspace.current_credits,
        credits_limit=workspace.credits_limit,
        member_limit=workspace.member_limit,
        created_at=workspace.created_at,
        user_role=membership.role.value
    )


@router.put("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: int,
    workspace_data: WorkspaceUpdate,
    membership: WorkspaceMember = Depends(require_workspace_owner),
    db: Session = Depends(get_db)
):
    """Aktualisiert Workspace-Einstellungen (nur Owner)."""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    # Update fields
    if workspace_data.name is not None:
        workspace.name = workspace_data.name.strip()
        workspace.slug = generate_unique_slug(db, workspace.name)
    
    if workspace_data.description is not None:
        workspace.description = workspace_data.description
    
    if workspace_data.settings is not None:
        workspace.settings = workspace_data.settings
    
    if workspace_data.member_limit is not None:
        workspace.member_limit = workspace_data.member_limit
    
    if workspace_data.credits_limit is not None:
        workspace.credits_limit = workspace_data.credits_limit
    
    workspace.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(workspace)
    
    # Count members for response
    member_count = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.is_active == True
    ).count()
    
    return WorkspaceResponse(
        id=workspace.id,
        name=workspace.name,
        slug=workspace.slug,
        description=workspace.description,
        plan=workspace.plan,
        member_count=member_count,
        current_credits=workspace.current_credits,
        credits_limit=workspace.credits_limit,
        member_limit=workspace.member_limit,
        created_at=workspace.created_at,
        user_role=membership.role.value
    )


@router.delete("/{workspace_id}")
async def delete_workspace(
    workspace_id: int,
    membership: WorkspaceMember = Depends(require_workspace_owner),
    db: Session = Depends(get_db)
):
    """Löscht einen Workspace (nur Owner)."""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    # Check if workspace has resources (prevent deletion if has active resources)
    from models import Project, Assistant, PhoneNumber
    
    has_resources = (
        db.query(Project).filter(Project.workspace_id == workspace_id).first() or
        db.query(Assistant).filter(Assistant.workspace_id == workspace_id).first() or
        db.query(PhoneNumber).filter(PhoneNumber.workspace_id == workspace_id).first()
    )
    
    if has_resources:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete workspace with active resources. Please delete all resources first."
        )
    
    # Delete all memberships first
    db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == workspace_id).delete()
    
    # Delete workspace
    db.delete(workspace)
    db.commit()
    
    return {"message": "Workspace deleted successfully"}


# Member Management Endpoints

@router.get("/{workspace_id}/members", response_model=List[MemberResponse])
async def get_workspace_members(
    workspace_id: int,
    membership: WorkspaceMember = Depends(require_workspace_membership),
    db: Session = Depends(get_db)
):
    """Gibt alle Mitglieder eines Workspace zurück."""
    members_data = []
    
    members = db.query(WorkspaceMember, User).join(
        User, WorkspaceMember.user_id == User.id
    ).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.is_active == True
    ).all()
    
    for member, user in members:
        # Get inviter info if available
        invited_by_email = None
        if member.invited_by_user_id:
            inviter = db.query(User).filter(User.id == member.invited_by_user_id).first()
            if inviter:
                invited_by_email = inviter.email
        
        members_data.append(MemberResponse(
            id=member.id,
            user_id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=member.role.value,
            joined_at=member.joined_at,
            invited_at=member.invited_at,
            invited_by_email=invited_by_email,
            is_active=member.is_active
        ))
    
    return members_data


@router.post("/{workspace_id}/members/invite")
async def invite_member(
    workspace_id: int,
    invite_data: MemberInvite,
    membership: WorkspaceMember = Depends(require_workspace_admin),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lädt ein neues Mitglied in den Workspace ein."""
    
    # Check if user exists
    invited_user = db.query(User).filter(User.email == invite_data.email).first()
    if not invited_user:
        raise HTTPException(status_code=404, detail="User with this email not found")
    
    # Check if already member
    existing_membership = db.query(WorkspaceMember).filter(
        WorkspaceMember.user_id == invited_user.id,
        WorkspaceMember.workspace_id == workspace_id
    ).first()
    
    if existing_membership:
        if existing_membership.is_active:
            raise HTTPException(status_code=400, detail="User is already a member")
        else:
            # Reactivate membership
            existing_membership.is_active = True
            existing_membership.role = invite_data.role
            existing_membership.invited_by_user_id = current_user.id
            existing_membership.invited_at = datetime.now(timezone.utc)
            db.commit()
            return {"message": f"User {invite_data.email} re-invited successfully"}
    
    # Check member limit
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    current_member_count = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.is_active == True
    ).count()
    
    if current_member_count >= workspace.member_limit:
        raise HTTPException(status_code=400, detail="Workspace member limit reached")
    
    # Create membership
    new_membership = WorkspaceMember(
        user_id=invited_user.id,
        workspace_id=workspace_id,
        role=invite_data.role,
        invited_by_user_id=current_user.id,
        invited_at=datetime.now(timezone.utc),
        is_active=True
    )
    
    db.add(new_membership)
    db.commit()
    
    # TODO: Send invitation email
    
    return {"message": f"User {invite_data.email} invited successfully as {invite_data.role.value}"}


@router.put("/{workspace_id}/members/{member_id}")
async def update_member_role(
    workspace_id: int,
    member_id: int,
    update_data: MemberUpdate,
    membership: WorkspaceMember = Depends(require_workspace_owner),
    db: Session = Depends(get_db)
):
    """Ändert die Rolle eines Mitglieds (nur Owner)."""
    
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.id == member_id,
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.is_active == True
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Prevent changing own role
    if member.user_id == membership.user_id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    
    member.role = update_data.role
    member.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    
    return {"message": f"Member role updated to {update_data.role.value}"}


@router.delete("/{workspace_id}/members/{member_id}")
async def remove_member(
    workspace_id: int,
    member_id: int,
    membership: WorkspaceMember = Depends(require_workspace_admin),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Entfernt ein Mitglied aus dem Workspace."""
    
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.id == member_id,
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.is_active == True
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Prevent removing self
    if member.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself")
    
    # Prevent removing owner (unless requester is also owner)
    if member.role == WorkspaceRole.OWNER and membership.role != WorkspaceRole.OWNER:
        raise HTTPException(status_code=403, detail="Cannot remove workspace owner")
    
    member.is_active = False
    member.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    
    return {"message": "Member removed successfully"}


@router.get("/{workspace_id}/stats", response_model=WorkspaceStats)
async def get_workspace_stats(
    workspace_id: int,
    membership: WorkspaceMember = Depends(require_workspace_membership),
    db: Session = Depends(get_db)
):
    """Gibt Statistiken für einen Workspace zurück."""
    from models import Assistant, PhoneNumber, CallLog
    from datetime import datetime, timezone
    
    # Current month start
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Count resources
    total_assistants = db.query(Assistant).filter(Assistant.workspace_id == workspace_id).count()
    total_phone_numbers = db.query(PhoneNumber).filter(PhoneNumber.workspace_id == workspace_id).count()
    
    # Count calls this month
    total_calls_this_month = db.query(CallLog).filter(
        CallLog.workspace_id == workspace_id,
        CallLog.start_time >= month_start
    ).count()
    
    # Sum credits used this month
    credits_used_this_month = db.query(func.sum(CallLog.credits_consumed)).filter(
        CallLog.workspace_id == workspace_id,
        CallLog.start_time >= month_start
    ).scalar() or 0.0
    
    # Count active members
    active_members = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.is_active == True
    ).count()
    
    return WorkspaceStats(
        total_assistants=total_assistants,
        total_phone_numbers=total_phone_numbers,
        total_calls_this_month=total_calls_this_month,
        credits_used_this_month=credits_used_this_month,
        active_members=active_members
    )


@router.post("/{workspace_id}/switch")
async def switch_workspace(
    workspace_id: int,
    membership: WorkspaceMember = Depends(require_workspace_membership),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Wechselt den aktuellen Workspace des Users."""
    
    current_user.current_workspace_id = workspace_id
    db.commit()
    
    return {"message": "Workspace switched successfully", "current_workspace_id": workspace_id}