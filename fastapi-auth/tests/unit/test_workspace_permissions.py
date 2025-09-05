"""
Unit tests for Workspace Permissions System
Tests role-based access control and permission checking logic
"""

import pytest
from unittest.mock import Mock, patch
from sqlalchemy.orm import Session

from workspace_permissions import WorkspacePermissions, ResourcePermissions
from models import User, Workspace, WorkspaceMember, WorkspaceRole

class TestWorkspacePermissions:
    """Test suite for WorkspacePermissions functionality."""

    def test_get_user_workspace_role_owner(self, db_session: Session, test_user: User, test_workspace: Workspace):
        """Test getting user role when user is workspace owner."""
        # The test_workspace fixture already creates the user as owner
        role = WorkspacePermissions.get_user_workspace_role(
            db_session, test_user.id, test_workspace.id
        )
        
        assert role == WorkspaceRole.OWNER

    def test_get_user_workspace_role_no_membership(self, db_session: Session, test_workspace: Workspace):
        """Test getting user role when user is not a member."""
        # Create a user who is not a member
        non_member = User(
            email="nonmember@example.com",
            hashed_password="hashed"
        )
        db_session.add(non_member)
        db_session.commit()
        
        role = WorkspacePermissions.get_user_workspace_role(
            db_session, non_member.id, test_workspace.id
        )
        
        assert role is None

    def test_get_user_workspace_role_inactive_membership(self, db_session: Session, test_user: User, test_workspace: Workspace):
        """Test getting user role when membership is inactive."""
        # Deactivate the membership
        membership = db_session.query(WorkspaceMember).filter(
            WorkspaceMember.user_id == test_user.id,
            WorkspaceMember.workspace_id == test_workspace.id
        ).first()
        membership.is_active = False
        db_session.commit()
        
        role = WorkspacePermissions.get_user_workspace_role(
            db_session, test_user.id, test_workspace.id
        )
        
        assert role is None

    def test_user_has_permission_owner_all_permissions(self, db_session: Session, test_user: User, test_workspace: Workspace):
        """Test that workspace owner has all permissions."""
        permissions_to_test = [
            'workspace_manage',
            'workspace_delete', 
            'member_invite',
            'member_remove',
            'member_role_change',
            'billing_manage',
            'resource_create',
            'resource_edit_all',
            'resource_delete_all',
            'analytics_view_all'
        ]
        
        for permission in permissions_to_test:
            has_permission = WorkspacePermissions.user_has_permission(
                db_session, test_user.id, test_workspace.id, permission
            )
            assert has_permission, f"Owner should have {permission} permission"

    def test_user_has_permission_admin_limited_permissions(self, db_session: Session, test_workspace: Workspace):
        """Test that workspace admin has limited permissions."""
        # Create admin user
        admin_user = User(email="admin@example.com", hashed_password="hashed")
        db_session.add(admin_user)
        db_session.commit()
        
        # Add as admin
        membership = WorkspaceMember(
            user_id=admin_user.id,
            workspace_id=test_workspace.id,
            role=WorkspaceRole.ADMIN,
            is_active=True
        )
        db_session.add(membership)
        db_session.commit()
        
        # Test permissions admin should have
        should_have = [
            'member_invite',
            'member_remove', 
            'resource_create',
            'resource_edit_all',
            'resource_delete_all',
            'analytics_view_all'
        ]
        
        for permission in should_have:
            has_permission = WorkspacePermissions.user_has_permission(
                db_session, admin_user.id, test_workspace.id, permission
            )
            assert has_permission, f"Admin should have {permission} permission"
        
        # Test permissions admin should NOT have
        should_not_have = [
            'workspace_manage',
            'workspace_delete',
            'member_role_change',
            'billing_manage'
        ]
        
        for permission in should_not_have:
            has_permission = WorkspacePermissions.user_has_permission(
                db_session, admin_user.id, test_workspace.id, permission
            )
            assert not has_permission, f"Admin should NOT have {permission} permission"

    def test_user_has_permission_member_basic_permissions(self, db_session: Session, test_workspace: Workspace):
        """Test that workspace member has basic permissions."""
        # Create member user
        member_user = User(email="member@example.com", hashed_password="hashed")
        db_session.add(member_user)
        db_session.commit()
        
        # Add as member
        membership = WorkspaceMember(
            user_id=member_user.id,
            workspace_id=test_workspace.id,
            role=WorkspaceRole.MEMBER,
            is_active=True
        )
        db_session.add(membership)
        db_session.commit()
        
        # Test permissions member should have
        should_have = ['resource_create']
        
        for permission in should_have:
            has_permission = WorkspacePermissions.user_has_permission(
                db_session, member_user.id, test_workspace.id, permission
            )
            assert has_permission, f"Member should have {permission} permission"
        
        # Test permissions member should NOT have
        should_not_have = [
            'workspace_manage',
            'workspace_delete',
            'member_invite',
            'member_remove',
            'member_role_change',
            'billing_manage',
            'resource_edit_all',
            'resource_delete_all',
            'analytics_view_all'
        ]
        
        for permission in should_not_have:
            has_permission = WorkspacePermissions.user_has_permission(
                db_session, member_user.id, test_workspace.id, permission
            )
            assert not has_permission, f"Member should NOT have {permission} permission"

    def test_user_has_permission_viewer_no_permissions(self, db_session: Session, test_workspace: Workspace):
        """Test that workspace viewer has no permissions."""
        # Create viewer user
        viewer_user = User(email="viewer@example.com", hashed_password="hashed")
        db_session.add(viewer_user)
        db_session.commit()
        
        # Add as viewer
        membership = WorkspaceMember(
            user_id=viewer_user.id,
            workspace_id=test_workspace.id,
            role=WorkspaceRole.VIEWER,
            is_active=True
        )
        db_session.add(membership)
        db_session.commit()
        
        # Test that viewer has no permissions
        permissions_to_test = [
            'workspace_manage',
            'workspace_delete',
            'member_invite',
            'member_remove',
            'member_role_change',
            'billing_manage',
            'resource_create',
            'resource_edit_all',
            'resource_delete_all',
            'analytics_view_all'
        ]
        
        for permission in permissions_to_test:
            has_permission = WorkspacePermissions.user_has_permission(
                db_session, viewer_user.id, test_workspace.id, permission
            )
            assert not has_permission, f"Viewer should NOT have {permission} permission"

    def test_user_has_permission_resource_owner_can_edit_own(self, db_session: Session, test_workspace: Workspace):
        """Test that users can edit/delete their own resources even with limited permissions."""
        # Create member user
        member_user = User(email="member@example.com", hashed_password="hashed")
        db_session.add(member_user)
        db_session.commit()
        
        # Add as member
        membership = WorkspaceMember(
            user_id=member_user.id,
            workspace_id=test_workspace.id,
            role=WorkspaceRole.MEMBER,
            is_active=True
        )
        db_session.add(membership)
        db_session.commit()
        
        # Member normally can't edit all resources
        can_edit_all = WorkspacePermissions.user_has_permission(
            db_session, member_user.id, test_workspace.id, 'resource_edit_all'
        )
        assert not can_edit_all
        
        # But member can edit their own resources
        can_edit_own = WorkspacePermissions.user_has_permission(
            db_session, member_user.id, test_workspace.id, 'resource_edit_all', member_user.id
        )
        assert can_edit_own
        
        # Member cannot edit others' resources
        can_edit_others = WorkspacePermissions.user_has_permission(
            db_session, member_user.id, test_workspace.id, 'resource_edit_all', 999  # Different user ID
        )
        assert not can_edit_others

    def test_get_user_workspaces(self, db_session: Session, test_user: User, test_workspace: Workspace):
        """Test getting all workspaces for a user."""
        # Create another workspace and add user as member
        workspace2 = Workspace(
            name="Second Workspace",
            slug="second-workspace",
            plan="pro"
        )
        db_session.add(workspace2)
        db_session.commit()
        
        membership2 = WorkspaceMember(
            user_id=test_user.id,
            workspace_id=workspace2.id,
            role=WorkspaceRole.MEMBER,
            is_active=True
        )
        db_session.add(membership2)
        db_session.commit()
        
        workspaces = WorkspacePermissions.get_user_workspaces(db_session, test_user.id)
        
        assert len(workspaces) == 2
        workspace_names = [w['name'] for w in workspaces]
        assert 'Test Workspace' in workspace_names
        assert 'Second Workspace' in workspace_names
        
        # Check roles are correctly returned
        for workspace in workspaces:
            if workspace['name'] == 'Test Workspace':
                assert workspace['role'] == 'owner'
            elif workspace['name'] == 'Second Workspace':
                assert workspace['role'] == 'member'

    def test_validate_workspace_access_success(self, db_session: Session, test_user: User, test_workspace: Workspace):
        """Test successful workspace access validation."""
        membership = WorkspacePermissions.validate_workspace_access(
            db_session, test_user.id, test_workspace.id
        )
        
        assert membership is not None
        assert membership.user_id == test_user.id
        assert membership.workspace_id == test_workspace.id
        assert membership.role == WorkspaceRole.OWNER

    def test_validate_workspace_access_no_access(self, db_session: Session, test_workspace: Workspace):
        """Test workspace access validation when user has no access."""
        # Create user without workspace access
        non_member = User(email="nonmember@example.com", hashed_password="hashed")
        db_session.add(non_member)
        db_session.commit()
        
        with pytest.raises(Exception):  # Should raise HTTPException
            WorkspacePermissions.validate_workspace_access(
                db_session, non_member.id, test_workspace.id
            )

class TestResourcePermissions:
    """Test suite for ResourcePermissions utility functions."""

    def test_can_create_assistant_owner(self, db_session: Session, test_user: User, test_workspace: Workspace):
        """Test that owner can create assistants."""
        can_create = ResourcePermissions.can_create_assistant(
            db_session, test_user.id, test_workspace.id
        )
        assert can_create

    def test_can_create_assistant_member(self, db_session: Session, test_workspace: Workspace):
        """Test that member can create assistants."""
        # Create member user
        member_user = User(email="member@example.com", hashed_password="hashed")
        db_session.add(member_user)
        db_session.commit()
        
        membership = WorkspaceMember(
            user_id=member_user.id,
            workspace_id=test_workspace.id,
            role=WorkspaceRole.MEMBER,
            is_active=True
        )
        db_session.add(membership)
        db_session.commit()
        
        can_create = ResourcePermissions.can_create_assistant(
            db_session, member_user.id, test_workspace.id
        )
        assert can_create

    def test_can_create_assistant_viewer(self, db_session: Session, test_workspace: Workspace):
        """Test that viewer cannot create assistants."""
        # Create viewer user
        viewer_user = User(email="viewer@example.com", hashed_password="hashed")
        db_session.add(viewer_user)
        db_session.commit()
        
        membership = WorkspaceMember(
            user_id=viewer_user.id,
            workspace_id=test_workspace.id,
            role=WorkspaceRole.VIEWER,
            is_active=True
        )
        db_session.add(membership)
        db_session.commit()
        
        can_create = ResourcePermissions.can_create_assistant(
            db_session, viewer_user.id, test_workspace.id
        )
        assert not can_create

    def test_can_edit_assistant_owner_all(self, db_session: Session, test_user: User, test_workspace: Workspace):
        """Test that owner can edit any assistant."""
        can_edit = ResourcePermissions.can_edit_assistant(
            db_session, test_user.id, test_workspace.id, 999  # Any assistant owner ID
        )
        assert can_edit

    def test_can_edit_assistant_member_own_only(self, db_session: Session, test_workspace: Workspace):
        """Test that member can only edit their own assistants."""
        # Create member user
        member_user = User(email="member@example.com", hashed_password="hashed")
        db_session.add(member_user)
        db_session.commit()
        
        membership = WorkspaceMember(
            user_id=member_user.id,
            workspace_id=test_workspace.id,
            role=WorkspaceRole.MEMBER,
            is_active=True
        )
        db_session.add(membership)
        db_session.commit()
        
        # Can edit own assistant
        can_edit_own = ResourcePermissions.can_edit_assistant(
            db_session, member_user.id, test_workspace.id, member_user.id
        )
        assert can_edit_own
        
        # Cannot edit others' assistants
        can_edit_others = ResourcePermissions.can_edit_assistant(
            db_session, member_user.id, test_workspace.id, 999  # Different user ID
        )
        assert not can_edit_others

    def test_can_invite_members_admin(self, db_session: Session, test_workspace: Workspace):
        """Test that admin can invite members."""
        # Create admin user
        admin_user = User(email="admin@example.com", hashed_password="hashed")
        db_session.add(admin_user)
        db_session.commit()
        
        membership = WorkspaceMember(
            user_id=admin_user.id,
            workspace_id=test_workspace.id,
            role=WorkspaceRole.ADMIN,
            is_active=True
        )
        db_session.add(membership)
        db_session.commit()
        
        can_invite = ResourcePermissions.can_invite_members(
            db_session, admin_user.id, test_workspace.id
        )
        assert can_invite

    def test_can_invite_members_member_cannot(self, db_session: Session, test_workspace: Workspace):
        """Test that regular member cannot invite members."""
        # Create member user
        member_user = User(email="member@example.com", hashed_password="hashed")
        db_session.add(member_user)
        db_session.commit()
        
        membership = WorkspaceMember(
            user_id=member_user.id,
            workspace_id=test_workspace.id,
            role=WorkspaceRole.MEMBER,
            is_active=True
        )
        db_session.add(membership)
        db_session.commit()
        
        can_invite = ResourcePermissions.can_invite_members(
            db_session, member_user.id, test_workspace.id
        )
        assert not can_invite

    def test_can_change_member_roles_owner_only(self, db_session: Session, test_user: User, test_workspace: Workspace):
        """Test that only owner can change member roles."""
        # Owner can change roles
        can_change = ResourcePermissions.can_change_member_roles(
            db_session, test_user.id, test_workspace.id
        )
        assert can_change
        
        # Create admin user
        admin_user = User(email="admin@example.com", hashed_password="hashed")
        db_session.add(admin_user)
        db_session.commit()
        
        membership = WorkspaceMember(
            user_id=admin_user.id,
            workspace_id=test_workspace.id,
            role=WorkspaceRole.ADMIN,
            is_active=True
        )
        db_session.add(membership)
        db_session.commit()
        
        # Admin cannot change roles
        can_change_admin = ResourcePermissions.can_change_member_roles(
            db_session, admin_user.id, test_workspace.id
        )
        assert not can_change_admin

    def test_can_manage_billing_owner_only(self, db_session: Session, test_user: User, test_workspace: Workspace):
        """Test that only owner can manage billing."""
        can_manage = ResourcePermissions.can_manage_billing(
            db_session, test_user.id, test_workspace.id
        )
        assert can_manage
        
        # Create admin user
        admin_user = User(email="admin@example.com", hashed_password="hashed")
        db_session.add(admin_user)
        db_session.commit()
        
        membership = WorkspaceMember(
            user_id=admin_user.id,
            workspace_id=test_workspace.id,
            role=WorkspaceRole.ADMIN,
            is_active=True
        )
        db_session.add(membership)
        db_session.commit()
        
        # Admin cannot manage billing
        can_manage_admin = ResourcePermissions.can_manage_billing(
            db_session, admin_user.id, test_workspace.id
        )
        assert not can_manage_admin

    def test_can_view_analytics_owner_and_admin(self, db_session: Session, test_user: User, test_workspace: Workspace):
        """Test that owner and admin can view analytics."""
        # Owner can view analytics
        can_view = ResourcePermissions.can_view_analytics(
            db_session, test_user.id, test_workspace.id
        )
        assert can_view
        
        # Create admin user
        admin_user = User(email="admin@example.com", hashed_password="hashed")
        db_session.add(admin_user)
        db_session.commit()
        
        membership = WorkspaceMember(
            user_id=admin_user.id,
            workspace_id=test_workspace.id,
            role=WorkspaceRole.ADMIN,
            is_active=True
        )
        db_session.add(membership)
        db_session.commit()
        
        # Admin can view analytics
        can_view_admin = ResourcePermissions.can_view_analytics(
            db_session, admin_user.id, test_workspace.id
        )
        assert can_view_admin
        
        # Create member user
        member_user = User(email="member@example.com", hashed_password="hashed")
        db_session.add(member_user)
        db_session.commit()
        
        membership_member = WorkspaceMember(
            user_id=member_user.id,
            workspace_id=test_workspace.id,
            role=WorkspaceRole.MEMBER,
            is_active=True
        )
        db_session.add(membership_member)
        db_session.commit()
        
        # Member cannot view analytics
        can_view_member = ResourcePermissions.can_view_analytics(
            db_session, member_user.id, test_workspace.id
        )
        assert not can_view_member