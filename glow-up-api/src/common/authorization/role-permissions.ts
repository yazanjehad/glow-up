
import { PermissionType } from '../enum/permission.enum';
import { RoleType } from '../enum/roletype.enum';
 
export const ROLE_PERMISSIONS: Record<RoleType, PermissionType[]> = {
  
  [RoleType.SUPER_ADMIN]: [],

 
  [RoleType.PROVIDER]: [],

  
  [RoleType.ADMIN]: [
    
  ],

 
  [RoleType.EMPLOYEE]: [],

  
  [RoleType.CUSTOMER]: [],
};
