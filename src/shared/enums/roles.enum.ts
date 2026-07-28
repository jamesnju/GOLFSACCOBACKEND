export enum UserRole {
  ADMIN = 'ADMIN',
  PLAYER = 'PLAYER',
  PRO = 'PRO',
  CADDY = 'CADDY',
}

export const RoleHierarchy = {
  [UserRole.ADMIN]: 4,
  [UserRole.PRO]: 3,
  [UserRole.PLAYER]: 2,
  [UserRole.CADDY]: 1,
};

export const RolePermissions = {
  [UserRole.ADMIN]: ['*'],
  [UserRole.PRO]: ['view_dashboard', 'view_savings', 'apply_loans', 'view_reports'],
  [UserRole.PLAYER]: ['view_dashboard', 'view_savings', 'apply_loans'],
  [UserRole.CADDY]: ['view_dashboard', 'view_savings', 'apply_loans'],
};