import { ROLE_PERMISSIONS } from './role-permissions';
 
import { RoleType } from '../enum/roletype.enum';
import { PermissionType } from '../enum/permission.enum';

export function resolveUserPermissions(user: any): PermissionType[] {
  // SUPER_ADMIN bypass
  if (user.role === RoleType.SUPER_ADMIN) {
    return Object.values(PermissionType);
  }

  // just ADMIN used permission system
  if (user.role !== RoleType.ADMIN) {
    return [];
  }

  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  const userPermissions = user.permissions || [];

  return [...new Set([...rolePermissions, ...userPermissions])];
}
