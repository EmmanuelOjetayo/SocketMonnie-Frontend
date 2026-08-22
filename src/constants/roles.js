// User roles per PRD and Figma.

export const ROLES = {
  MEMBER: "member",
  SUPER_ADMIN: "super_admin",
  FINANCE_MANAGER: "finance_manager",
  CUSTOMER_SUPPORT: "customer_support",
};

// Which base route each role lands on after login.
export const ROLE_HOME = {
  [ROLES.MEMBER]: "/dashboard",
  [ROLES.SUPER_ADMIN]: "/admin",
  [ROLES.FINANCE_MANAGER]: "/finance",
  [ROLES.CUSTOMER_SUPPORT]: "/support",
};