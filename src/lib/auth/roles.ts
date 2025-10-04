// src/lib/auth/roles.ts
// Enhanced role-based access control utilities
export type UserRole = "user" | "admin" | "customer" | "tradesperson" | "business_owner" | "manager";

export const ROLES = {
  USER: "user" as const,
  ADMIN: "admin" as const,
  CUSTOMER: "customer" as const,
  TRADESPERSON: "tradesperson" as const,
  BUSINESS_OWNER: "business_owner" as const,
  MANAGER: "manager" as const
} as const;

// Role hierarchy - higher number = more permissions
export const ROLE_HIERARCHY = {
  [ROLES.USER]: 1,
  [ROLES.CUSTOMER]: 2,
  [ROLES.TRADESPERSON]: 5,
  [ROLES.MANAGER]: 7,
  [ROLES.BUSINESS_OWNER]: 8,
  [ROLES.ADMIN]: 10
} as const;

// Role categories for easier management
export const ROLE_CATEGORIES = {
  BASIC: [ROLES.USER, ROLES.CUSTOMER],
  SERVICE_PROVIDER: [ROLES.TRADESPERSON, ROLES.BUSINESS_OWNER],
  MANAGEMENT: [ROLES.MANAGER, ROLES.ADMIN]
} as const;

export function hasRole(userRole: string | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;

  // Admin has access to everything
  if (userRole === ROLES.ADMIN) return true;

  // Check specific role
  return userRole === requiredRole;
}

export function hasAnyRole(userRole: string | undefined, requiredRoles: readonly UserRole[]): boolean {
  if (!userRole) return false;

  // Admin has access to everything
  if (userRole === ROLES.ADMIN) return true;

  return requiredRoles.includes(userRole as UserRole);
}

export function hasMinimumRole(userRole: string | undefined, minimumRole: UserRole): boolean {
  if (!userRole) return false;

  const userLevel = ROLE_HIERARCHY[userRole as UserRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;

  return userLevel >= requiredLevel;
}

export function isAdmin(userRole: string | undefined): boolean {
  return userRole === ROLES.ADMIN;
}

export function isCustomer(userRole: string | undefined): boolean {
  return userRole === ROLES.CUSTOMER;
}

export function isTradesperson(userRole: string | undefined): boolean {
  return userRole === ROLES.TRADESPERSON;
}

export function isBusinessOwner(userRole: string | undefined): boolean {
  return userRole === ROLES.BUSINESS_OWNER;
}

export function isServiceProvider(userRole: string | undefined): boolean {
  return hasAnyRole(userRole, ROLE_CATEGORIES.SERVICE_PROVIDER);
}

export function isManagement(userRole: string | undefined): boolean {
  return hasAnyRole(userRole, ROLE_CATEGORIES.MANAGEMENT);
}

// Get user permissions based on role
export function getUserPermissions(userRole: string | undefined): string[] {
  if (!userRole) return [];

  const basePermissions = ["read_profile", "update_profile"];

  switch (userRole) {
    case ROLES.ADMIN:
      return [
        ...basePermissions,
        "manage_users",
        "manage_system",
        "view_analytics",
        "manage_billing",
        "manage_content",
        "moderate_reviews",
        "access_admin_panel"
      ];

    case ROLES.BUSINESS_OWNER:
      return [
        ...basePermissions,
        "manage_team",
        "view_business_analytics",
        "manage_services",
        "manage_pricing",
        "view_bookings",
        "manage_schedule"
      ];

    case ROLES.MANAGER:
      return [...basePermissions, "view_team_analytics", "manage_bookings", "view_customer_data", "moderate_content"];

    case ROLES.TRADESPERSON:
      return [
        ...basePermissions,
        "manage_services",
        "view_bookings",
        "update_availability",
        "communicate_customers",
        "upload_work_photos"
      ];

    case ROLES.CUSTOMER:
      return [
        ...basePermissions,
        "book_services",
        "view_bookings",
        "leave_reviews",
        "message_tradespeople",
        "request_quotes"
      ];

    case ROLES.USER:
    default:
      return basePermissions;
  }
}

// Check if user has specific permission
export function hasPermission(userRole: string | undefined, permission: string): boolean {
  const permissions = getUserPermissions(userRole);
  return permissions.includes(permission);
}

// Role display names for UI
export const ROLE_DISPLAY_NAMES = {
  [ROLES.USER]: "User",
  [ROLES.ADMIN]: "Administrator",
  [ROLES.CUSTOMER]: "Customer",
  [ROLES.TRADESPERSON]: "Tradesperson",
  [ROLES.BUSINESS_OWNER]: "Business Owner",
  [ROLES.MANAGER]: "Manager"
} as const;

// Role descriptions
export const ROLE_DESCRIPTIONS = {
  [ROLES.USER]: "Basic user with limited access",
  [ROLES.ADMIN]: "Full system administrator with all permissions",
  [ROLES.CUSTOMER]: "Customer who can book services and leave reviews",
  [ROLES.TRADESPERSON]: "Service provider who can offer services and manage bookings",
  [ROLES.BUSINESS_OWNER]: "Business owner who can manage team and business operations",
  [ROLES.MANAGER]: "Manager with oversight of operations and team"
} as const;

// Default role for new users
export const DEFAULT_ROLE = ROLES.CUSTOMER;

// Roles that can be assigned during registration
// export const REGISTERABLE_ROLES = [ROLES.CUSTOMER, ROLES.TRADESPERSON, ROLES.BUSINESS_OWNER] as const;
export const REGISTERABLE_ROLES = [ROLES.CUSTOMER, ROLES.TRADESPERSON, ROLES.BUSINESS_OWNER] as const;
