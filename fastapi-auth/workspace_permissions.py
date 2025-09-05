"""
Workspace Permission System for VoicePartnerAI
Handles role-based access control and workspace membership validation
"""

from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, Depends, status
from functools import wraps

from models import User, Workspace, WorkspaceMember, WorkspaceRole
from database import get_db
from auth import get_current_user


class WorkspacePermissions:
    """Central class for workspace permission management."""
    
    # Permission matrices für verschiedene Rollen
    ROLE_PERMISSIONS = {
        WorkspaceRole.OWNER: {
            'workspace_manage': True,      # Workspace settings ändern
            'workspace_delete': True,      # Workspace löschen
            'member_invite': True,         # Mitglieder einladen
            'member_remove': True,         # Mitglieder entfernen
            'member_role_change': True,    # Rollen ändern
            'billing_manage': True,        # Billing verwalten
            'resource_create': True,       # Ressourcen erstellen
            'resource_edit_all': True,     # Alle Ressourcen bearbeiten
            'resource_delete_all': True,   # Alle Ressourcen löschen
            'analytics_view_all': True,    # Alle Analytics einsehen
        },
        WorkspaceRole.ADMIN: {
            'workspace_manage': False,
            'workspace_delete': False,
            'member_invite': True,
            'member_remove': True,
            'member_role_change': False,   # Kann keine Rollen ändern
            'billing_manage': False,
            'resource_create': True,
            'resource_edit_all': True,
            'resource_delete_all': True,
            'analytics_view_all': True,
        },
        WorkspaceRole.MEMBER: {
            'workspace_manage': False,
            'workspace_delete': False,
            'member_invite': False,
            'member_remove': False,
            'member_role_change': False,
            'billing_manage': False,
            'resource_create': True,
            'resource_edit_all': False,    # Nur eigene Ressourcen
            'resource_delete_all': False,  # Nur eigene Ressourcen
            'analytics_view_all': False,   # Nur eigene Analytics
        },
        WorkspaceRole.VIEWER: {
            'workspace_manage': False,
            'workspace_delete': False,
            'member_invite': False,
            'member_remove': False,
            'member_role_change': False,
            'billing_manage': False,
            'resource_create': False,
            'resource_edit_all': False,
            'resource_delete_all': False,
            'analytics_view_all': False,
        }
    }
    
    @staticmethod
    def get_user_workspace_role(db: Session, user_id: int, workspace_id: int) -> Optional[WorkspaceRole]:
        """Gibt die Rolle eines Users in einem Workspace zurück."""
        membership = db.query(WorkspaceMember).filter(
            WorkspaceMember.user_id == user_id,
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.is_active == True
        ).first()
        
        return membership.role if membership else None
    
    @staticmethod
    def user_has_permission(db: Session, user_id: int, workspace_id: int, 
                          permission: str, resource_owner_id: Optional[int] = None) -> bool:
        """
        Prüft ob ein User eine bestimmte Berechtigung in einem Workspace hat.
        
        Args:
            db: Database session
            user_id: ID des Users
            workspace_id: ID des Workspace
            permission: Berechtigung (z.B. 'resource_create')
            resource_owner_id: Optional - ID des Ressourcen-Erstellers für Own-Only Permissions
        """
        role = WorkspacePermissions.get_user_workspace_role(db, user_id, workspace_id)
        if not role:
            return False
        
        permissions = WorkspacePermissions.ROLE_PERMISSIONS.get(role, {})
        has_permission = permissions.get(permission, False)
        
        # Special handling für resource permissions
        if permission in ['resource_edit_all', 'resource_delete_all']:
            if has_permission:
                return True
            # Falls nicht "all" permission, prüfe ob es die eigene Ressource ist
            if resource_owner_id and resource_owner_id == user_id:
                return True
            return False
        
        return has_permission
    
    @staticmethod
    def get_user_workspaces(db: Session, user_id: int) -> List[Dict[str, Any]]:
        """Gibt alle Workspaces zurück, in denen der User Mitglied ist."""
        memberships = db.query(WorkspaceMember, Workspace).join(
            Workspace, WorkspaceMember.workspace_id == Workspace.id
        ).filter(
            WorkspaceMember.user_id == user_id,
            WorkspaceMember.is_active == True
        ).all()
        
        workspaces = []
        for membership, workspace in memberships:
            workspaces.append({
                'id': workspace.id,
                'name': workspace.name,
                'slug': workspace.slug,
                'role': membership.role.value,
                'joined_at': membership.joined_at,
                'is_current': user_id == workspace.id  # TODO: Implement current workspace logic
            })
        
        return workspaces
    
    @staticmethod
    def validate_workspace_access(db: Session, user_id: int, workspace_id: int) -> WorkspaceMember:
        """
        Validiert dass ein User Zugriff auf einen Workspace hat.
        Wirft HTTPException wenn kein Zugriff.
        """
        membership = db.query(WorkspaceMember).filter(
            WorkspaceMember.user_id == user_id,
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.is_active == True
        ).first()
        
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No access to this workspace"
            )
        
        return membership
    
    @staticmethod
    def require_workspace_permission(permission: str, allow_resource_owner: bool = False):
        """
        Decorator für API-Endpunkte die Workspace-Permissions benötigen.
        
        Args:
            permission: Required permission (z.B. 'resource_create')
            allow_resource_owner: Falls True, erlaubt Zugriff auf eigene Ressourcen
        """
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Extract parameters - assumes standard FastAPI pattern
                db = kwargs.get('db')
                user_id = kwargs.get('current_user_id') or kwargs.get('user_id')
                workspace_id = kwargs.get('workspace_id')
                resource_owner_id = kwargs.get('resource_owner_id') if allow_resource_owner else None
                
                if not all([db, user_id, workspace_id]):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Missing required parameters for permission check"
                    )
                
                if not WorkspacePermissions.user_has_permission(
                    db, user_id, workspace_id, permission, resource_owner_id
                ):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Insufficient permissions: {permission} required"
                    )
                
                return await func(*args, **kwargs)
            return wrapper
        return decorator


# FastAPI Dependency Functions
def get_current_workspace_id(workspace_id: int) -> int:
    """FastAPI dependency to extract workspace_id from path."""
    return workspace_id


def require_workspace_membership(
    workspace_id: int = Depends(get_current_workspace_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # This should be imported from your auth
) -> WorkspaceMember:
    """FastAPI dependency that validates workspace membership."""
    return WorkspacePermissions.validate_workspace_access(db, current_user.id, workspace_id)


def require_workspace_owner(
    workspace_id: int = Depends(get_current_workspace_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> WorkspaceMember:
    """FastAPI dependency that requires OWNER role."""
    membership = WorkspacePermissions.validate_workspace_access(db, current_user.id, workspace_id)
    
    if membership.role != WorkspaceRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner role required"
        )
    
    return membership


def require_workspace_admin(
    workspace_id: int = Depends(get_current_workspace_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> WorkspaceMember:
    """FastAPI dependency that requires ADMIN or OWNER role."""
    membership = WorkspacePermissions.validate_workspace_access(db, current_user.id, workspace_id)
    
    if membership.role not in [WorkspaceRole.OWNER, WorkspaceRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required"
        )
    
    return membership


# Utility Functions
def filter_resources_by_permission(db: Session, user_id: int, workspace_id: int, 
                                 query, resource_owner_field: str) -> Any:
    """
    Filtert eine Query basierend auf User-Permissions.
    Falls User nicht "view_all" Permission hat, zeigt nur eigene Ressourcen.
    """
    role = WorkspacePermissions.get_user_workspace_role(db, user_id, workspace_id)
    
    if role in [WorkspaceRole.OWNER, WorkspaceRole.ADMIN]:
        # Owners und Admins sehen alles
        return query
    else:
        # Members und Viewers sehen nur eigene Ressourcen
        return query.filter(getattr(query.column_descriptions[0]['type'], resource_owner_field) == user_id)


# Permission Check Functions für verschiedene Ressourcen
class ResourcePermissions:
    """Spezifische Permission-Checks für verschiedene Ressourcen."""
    
    @staticmethod
    def can_create_assistant(db: Session, user_id: int, workspace_id: int) -> bool:
        return WorkspacePermissions.user_has_permission(db, user_id, workspace_id, 'resource_create')
    
    @staticmethod
    def can_edit_assistant(db: Session, user_id: int, workspace_id: int, assistant_owner_id: int) -> bool:
        return WorkspacePermissions.user_has_permission(
            db, user_id, workspace_id, 'resource_edit_all', assistant_owner_id
        )
    
    @staticmethod
    def can_delete_assistant(db: Session, user_id: int, workspace_id: int, assistant_owner_id: int) -> bool:
        return WorkspacePermissions.user_has_permission(
            db, user_id, workspace_id, 'resource_delete_all', assistant_owner_id
        )
    
    @staticmethod
    def can_manage_phone_numbers(db: Session, user_id: int, workspace_id: int) -> bool:
        return WorkspacePermissions.user_has_permission(db, user_id, workspace_id, 'resource_create')
    
    @staticmethod
    def can_invite_members(db: Session, user_id: int, workspace_id: int) -> bool:
        return WorkspacePermissions.user_has_permission(db, user_id, workspace_id, 'member_invite')
    
    @staticmethod
    def can_remove_members(db: Session, user_id: int, workspace_id: int) -> bool:
        return WorkspacePermissions.user_has_permission(db, user_id, workspace_id, 'member_remove')
    
    @staticmethod
    def can_change_member_roles(db: Session, user_id: int, workspace_id: int) -> bool:
        return WorkspacePermissions.user_has_permission(db, user_id, workspace_id, 'member_role_change')
    
    @staticmethod
    def can_view_analytics(db: Session, user_id: int, workspace_id: int) -> bool:
        return WorkspacePermissions.user_has_permission(db, user_id, workspace_id, 'analytics_view_all')
    
    @staticmethod
    def can_manage_billing(db: Session, user_id: int, workspace_id: int) -> bool:
        return WorkspacePermissions.user_has_permission(db, user_id, workspace_id, 'billing_manage')


# Migration Helper
def create_default_workspace_for_existing_users(db: Session):
    """
    Migration helper: Erstellt Default-Workspaces für bestehende User.
    Sollte einmalig nach der Implementierung ausgeführt werden.
    """
    from models import User, Workspace, WorkspaceMember, WorkspaceRole
    import uuid
    
    users_without_workspace = db.query(User).filter(
        ~User.id.in_(db.query(WorkspaceMember.user_id))
    ).all()
    
    for user in users_without_workspace:
        # Erstelle persönlichen Workspace
        workspace = Workspace(
            name=f"{user.email.split('@')[0]}'s Workspace",
            slug=f"user-{user.id}-{uuid.uuid4().hex[:8]}",
            description="Personal workspace (auto-created)",
            plan="free",
            member_limit=1,
            credits_limit=100.0,
            current_credits=100.0
        )
        db.add(workspace)
        db.flush()  # Get workspace.id
        
        # User als Owner hinzufügen
        membership = WorkspaceMember(
            user_id=user.id,
            workspace_id=workspace.id,
            role=WorkspaceRole.OWNER,
            is_active=True
        )
        db.add(membership)
        
        # Set als current workspace
        user.current_workspace_id = workspace.id
    
    db.commit()
    print(f"Created default workspaces for {len(users_without_workspace)} users")