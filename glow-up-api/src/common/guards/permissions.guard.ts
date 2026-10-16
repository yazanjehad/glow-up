import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import { RoleType } from "../enum/roletype.enum";
import { ROLE_PERMISSIONS } from "../authorization/role-permissions";
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions =
      this.reflector.get<string[]>(
        PERMISSIONS_KEY,
        context.getHandler(),
      );

    if (!requiredPermissions) return true;

    const { user } = context.switchToHttp().getRequest();

    // SUPER_ADMIN bypass 
    if (user.role === RoleType.SUPER_ADMIN) {
      return true;
    }

    //  ADMIN USED permission system
    if (user.role !== RoleType.ADMIN) {
      return false;
    }

    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    const userPermissions = user.permissions || [];

    const finalPermissions = [
      ...new Set([...rolePermissions, ...userPermissions]),
    ];
    
    return requiredPermissions.every((p) =>
      finalPermissions.includes(p),
    );
  }
}
