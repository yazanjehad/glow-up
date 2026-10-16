// Permission types enum
export enum PermissionType {
  APPOINTMENT_VIEW = "APPOINTMENT_VIEW",
  PROVIDER_VIEW = "PROVIDER_VIEW",
  USER_MANAGE = "USER_MANAGE",
  PROVIDER_APPROVE = "PROVIDER_APPROVE",
  TICKET_VIEW = "TICKET_VIEW",
  TICKET_REPLY = "TICKET_REPLY",
  VIEW_CUSTOMERS = "VIEW_CUSTOMERS",
  VIEW_EMPLOYEES = "VIEW_EMPLOYEES",
  VIEW_RATINGS = "VIEW_RATINGS",
  DELETE_RATING = "DELETE_RATING",
  VIEW_COUPONS = "VIEW_COUPONS",
  VIEW_LOOKUPS = "VIEW_LOOKUPS",
  ADD_LOOKUPS = "ADD_LOOKUPS",
  VIEW_ADS = "VIEW_ADS",
  ADD_ADS = "ADD_ADS",
  PLAN_MANAGE = "PLAN_MANAGE",
  SUBSCRIPTION_MANAGE = "SUBSCRIPTION_MANAGE",
}

// User roles
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  PROVIDER = "PROVIDER",
  EMPLOYEE = "EMPLOYEE",
  CUSTOMER = "CUSTOMER",
}

// Permission to route mapping for super-admin portal
// User can access route if they have ANY of the listed permissions
export const ROUTE_PERMISSIONS: Record<string, PermissionType[]> = {
  // Salons management - view OR approve
  "/super-admin-dashboard/salons": [PermissionType.PROVIDER_VIEW, PermissionType.PROVIDER_APPROVE],
  "/super-admin-dashboard/services": [PermissionType.PROVIDER_VIEW, PermissionType.PROVIDER_APPROVE],

  // Bookings management
  "/super-admin-dashboard/bookings": [PermissionType.APPOINTMENT_VIEW],

  // Tickets management - view OR reply
  "/super-admin-dashboard/tickets": [PermissionType.TICKET_VIEW, PermissionType.TICKET_REPLY],

  // Lookups management - view OR add
  "/super-admin-dashboard/lookups": [PermissionType.VIEW_LOOKUPS, PermissionType.ADD_LOOKUPS],

  // Ads management - view OR add
  "/super-admin-dashboard/ads": [PermissionType.VIEW_ADS, PermissionType.ADD_ADS],

  // Users management
  "/super-admin-dashboard/users": [PermissionType.USER_MANAGE],

  // Coupons management
  "/super-admin-dashboard/coupons": [PermissionType.VIEW_COUPONS],

  // Plans management - manage plans OR manage subscriptions
  "/super-admin-dashboard/plans": [PermissionType.PLAN_MANAGE, PermissionType.SUBSCRIPTION_MANAGE],
};

// Get user from localStorage
export function getCurrentUser(): { role: UserRole; permissions: PermissionType[] } | null {
  if (typeof window === "undefined") return null;

  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;

    const user = JSON.parse(userStr);
    return {
      role: user.role as UserRole,
      permissions: (user.permissions || []) as PermissionType[],
    };
  } catch {
    return null;
  }
}

// Check if user has a specific role
export function hasRole(requiredRoles: UserRole[]): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return requiredRoles.includes(user.role);
}

// Check if user has specific permission(s)
export function hasPermission(requiredPermissions: PermissionType[]): boolean {
  const user = getCurrentUser();
  if (!user) return false;

  // SUPER_ADMIN has all permissions
  if (user.role === UserRole.SUPER_ADMIN) return true;

  // Check if user has at least one of the required permissions
  return requiredPermissions.some((perm) => user.permissions.includes(perm));
}

// Check if user can access a specific route
export function canAccessRoute(pathname: string): boolean {
  const user = getCurrentUser();
  if (!user) return false;

  // SUPER_ADMIN can access all routes
  if (user.role === UserRole.SUPER_ADMIN) return true;

  // Find the matching route permissions
  const routePermissions = ROUTE_PERMISSIONS[pathname];

  // If no specific permissions required, allow access
  if (!routePermissions || routePermissions.length === 0) return true;

  // Check if user has required permissions
  return hasPermission(routePermissions);
}

export interface EmployeeCapabilities {
  canLogin: boolean;
  canViewOwnBookings: boolean;
  canViewStatistics: boolean;
  canManageBreakTime: boolean;
}

export function getEmployeeCapabilities(): EmployeeCapabilities | null {
  if (typeof window === "undefined") return null;

  try {
    return {
      canLogin: true,
      canViewOwnBookings: true,
      canViewStatistics: true,
      canManageBreakTime: true,
    };
  } catch {
    return null;
  }
}

// Check if employee has a specific capability
export function hasEmployeeCapability(capability: keyof EmployeeCapabilities): boolean {
  const capabilities = getEmployeeCapabilities();
  if (!capabilities) return false;
  return capabilities[capability] === true;
}

// Check if user can access provider portal (PROVIDER or EMPLOYEE with canLogin)
export function canAccessProviderPortal(): boolean {
  const user = getCurrentUser();
  if (!user) return false;

  if (user.role === UserRole.PROVIDER) return true;

  if (user.role === UserRole.EMPLOYEE) {
    const capabilities = getEmployeeCapabilities();
    return capabilities?.canLogin === true;
  }

  return false;
}

// Check if user can access super-admin portal (ADMIN or SUPER_ADMIN only)
export function canAccessSuperAdminPortal(): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN;
}

// Check if user is SUPER_ADMIN (has all permissions)
export function isSuperAdmin(): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return user.role === UserRole.SUPER_ADMIN;
}
