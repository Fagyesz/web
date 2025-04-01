/**
 * User role enum representing different permission levels in the application
 */
export enum UserRole {
  GUEST = 'guest',
  STAFF = 'staff',
  ADMIN = 'admin',
  DEV = 'dev'
}

/**
 * User interface extending Firebase User with additional properties
 */
export interface UserModel {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  emailVerified: boolean;
  role: UserRole;
  createdAt?: number;
  lastLoginAt?: number;
}

/**
 * User profile as stored in Firestore
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  createdAt: number;
  lastLoginAt?: number;
  loginCount?: number;
  provider?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
}

/**
 * Role permissions map defining what each role is allowed to do
 */
export const ROLE_PERMISSIONS = {
  [UserRole.GUEST]: {
    canViewPublicContent: true
  },
  [UserRole.STAFF]: {
    canViewPublicContent: true,
    canManageEvents: true,
    canManageNews: true,
    canViewMessages: true
  },
  [UserRole.ADMIN]: {
    canViewPublicContent: true,
    canManageEvents: true,
    canManageNews: true,
    canViewMessages: true,
    canManageUsers: true,
    canAssignRoles: [UserRole.GUEST, UserRole.STAFF]
  },
  [UserRole.DEV]: {
    canViewPublicContent: true,
    canManageEvents: true,
    canManageNews: true,
    canViewMessages: true,
    canManageUsers: true,
    canAssignRoles: [UserRole.GUEST, UserRole.STAFF, UserRole.ADMIN],
    canAccessDebugFeatures: true,
    canModifyAppSettings: true
  }
};

/**
 * Check if a role has higher privileges than another role
 * @param role1 The role to check
 * @param role2 The role to compare against
 * @returns Whether role1 has higher or equal privileges to role2
 */
export function isRoleHigherOrEqual(role1: UserRole, role2: UserRole): boolean {
  const hierarchy = [UserRole.GUEST, UserRole.STAFF, UserRole.ADMIN, UserRole.DEV];
  return hierarchy.indexOf(role1) >= hierarchy.indexOf(role2);
}

/**
 * Get role display name for UI presentation
 * @param role The role to get the display name for
 * @returns A user-friendly role name
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case UserRole.DEV:
      return 'Developer';
    case UserRole.ADMIN:
      return 'Administrator';
    case UserRole.STAFF:
      return 'Staff Member';
    case UserRole.GUEST:
      return 'Guest';
    default:
      return 'Unknown Role';
  }
} 