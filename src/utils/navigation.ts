//navigation.ts
export interface NavigationItem {
  title: string;
  icon: string;
  route: string;
  selected?: boolean;
  permission?: string; // Optional permission key for role-based access
}

export interface NavigationGroup {
  title: string;
  icon: string;
  permission?: string; // Optional permission key for the entire group
  children: NavigationItem[];
}

export const navigationConfig: NavigationGroup[] = [
  {
    title: "My Account",
    icon: "mdi-account",
    children: [
      {
        title: "Home",
        icon: "mdi-home",
        route: "/account/home",
        permission: "admin.dashboard.view",
      },
    ],
  },
  {
    title: "Admin Controls",
    icon: "mdi-cog",
    permission: "admin.access",
    children: [
      {
        title: "Inventory Management",
        icon: "mdi-warehouse",
        route: "/admin/inventory-management",
        permission: "admin.inventory.manage",
      },
      {
        title: "User Management",
        icon: "mdi-account-multiple",
        route: "/admin/user-management",
        permission: "admin.users.manage",
      },
      {
        title: "User Roles",
        icon: "mdi-account-key",
        route: "/admin/user-roles",
        permission: "admin.roles.manage",
      },
      {
        title: "QR Code Generator",
        icon: "mdi-qrcode-scan",
        route: "/admin/qr-generator",
        permission: "admin.qr.generate",
      },
    ],
  },
  {
    title: "Cashier Operations",
    icon: "mdi-cash-register",
    permission: "cashier.access",
    children: [
      {
        title: "Pending Orders",
        icon: "mdi-clock-outline",
        route: "/cashier",
        permission: "cashier.orders.view",
      },
      {
        title: "Order History",
        icon: "mdi-history",
        route: "/cashier/history",
        permission: "cashier.orders.history",
      },
    ],
  },
  {
    title: "Kitchen Operations",
    icon: "mdi-chef-hat",
    permission: "kitchen.access",
    children: [
      {
        title: "Kitchen Orders",
        icon: "mdi-silverware-fork-knife",
        route: "/kitchen",
        permission: "kitchen.orders.view",
      },
    ],
  },
  {
    title: "Sales & Analytics",
    icon: "mdi-chart-line",
    permission: "sales.access",
    children: [
      {
        title: "Sales Dashboard",
        icon: "mdi-chart-bar",
        route: "/sales",
        permission: "sales.dashboard.view",
      },
    ],
  },
];

// Helper function to get all permissions from navigation config
export const getAllPermissions = (): string[] => {
  const permissions: string[] = [];

  navigationConfig.forEach((group) => {
    if (group.permission) {
      permissions.push(group.permission);
    }

    group.children.forEach((item) => {
      if (item.permission) {
        permissions.push(item.permission);
      }
    });
  });

  return [...new Set(permissions)]; // Remove duplicates
};

// Helper function to get navigation items with selected state
export const getNavigationWithSelection = (
  selectedPermissions: string[] = []
): NavigationGroup[] => {
  return navigationConfig.map((group) => ({
    ...group,
    children: group.children.map((item) => ({
      ...item,
      // Checks if the user has the required permission OR if the route itself is used as the permission key
      selected: selectedPermissions.includes(item.permission || item.route),
    })),
  }));
};

// Helper function to filter navigation based on user permissions
export const getFilteredNavigation = (
  userPermissions: string[] = []
): NavigationGroup[] => {
  return navigationConfig
    .filter((group) => {
      // If group has permission requirement, check if user has it
      if (group.permission && !userPermissions.includes(group.permission)) {
        return false;
      }
      // Keep groups that have at least one accessible child
      return group.children.some(
        (item) =>
          !item.permission || userPermissions.includes(item.permission)
      );
    })
    .map((group) => ({
      ...group,
      children: group.children.filter(
        (item) =>
          !item.permission || userPermissions.includes(item.permission)
      ),
    }));
};

// Helper function to filter navigation based on user role ID
export const getNavigationByRole = (roleId: number): NavigationGroup[] => {
  // Define role-based access
  const rolePermissions: Record<number, string[]> = {
    1: [
      // Admin - Full access
      "admin.dashboard.view",
      "admin.access",
      "admin.inventory.manage",
      "admin.users.manage",
      "admin.roles.manage",
      "admin.qr.generate",
      "cashier.access",
      "cashier.orders.view",
      "cashier.orders.history",
      "kitchen.access",
      "kitchen.orders.view",
    ],
    2: [
      // Student - Limited access
      "admin.dashboard.view",
    ],
    3: [
      // Cashier - Cashier operations only
      "admin.dashboard.view",
      "cashier.access",
      "cashier.orders.view",
      "cashier.orders.history",
    ],
    4: [
      // Kitchen Staff - Kitchen operations only
      "admin.dashboard.view",
      "kitchen.access",
      "kitchen.orders.view",
    ],
  };

  const permissions = rolePermissions[roleId] || [];
  return getFilteredNavigation(permissions);
};

// Helper function to get cashier-specific navigation
export const getCashierNavigation = (): NavigationGroup[] => {
  return navigationConfig.filter(
    (group) => group.title === "Cashier Operations"
  );
};

// Helper function to get kitchen-specific navigation
export const getKitchenNavigation = (): NavigationGroup[] => {
  return navigationConfig.filter(
    (group) => group.title === "Kitchen Operations"
  );
};

// Helper function to get admin-specific navigation
export const getAdminNavigation = (): NavigationGroup[] => {
  return navigationConfig.filter(
    (group) => group.title === "Admin Controls" || group.title === "My Account"
  );
};

// Helper function to check if a route requires permission
export const requiresPermission = (route: string): string | undefined => {
  for (const group of navigationConfig) {
    const item = group.children.find((child) => child.route === route);
    if (item) {
      return item.permission;
    }
  }
  return undefined;
};

// Helper function to get breadcrumb trail
export const getBreadcrumbs = (
  currentRoute: string
): Array<{ title: string; route: string }> => {
  const breadcrumbs: Array<{ title: string; route: string }> = [];

  for (const group of navigationConfig) {
    const item = group.children.find((child) => child.route === currentRoute);
    if (item) {
      breadcrumbs.push(
        { title: group.title, route: "#" },
        { title: item.title, route: item.route }
      );
      break;
    }
  }

  return breadcrumbs;
};

// Helper function to check if user has access to a specific route
export const canAccessRoute = (route: string, roleId: number): boolean => {
  const rolePermissions: Record<number, string[]> = {
    1: [
      "admin.dashboard.view",
      "admin.access",
      "admin.inventory.manage",
      "admin.users.manage",
      "admin.roles.manage",
      "admin.qr.generate",
      "cashier.access",
      "cashier.orders.view",
      "cashier.orders.history",
      "kitchen.access",
      "kitchen.orders.view",
    ],
    2: ["admin.dashboard.view"],
    3: [
      "admin.dashboard.view",
      "cashier.access",
      "cashier.orders.view",
      "cashier.orders.history",
    ],
    4: [
      "admin.dashboard.view",
      "kitchen.access",
      "kitchen.orders.view",
    ],
  };

  const userPermissions = rolePermissions[roleId] || [];
  const requiredPermission = requiresPermission(route);

  // If no permission required, allow access
  if (!requiredPermission) return true;

  // Check if user has the required permission
  return userPermissions.includes(requiredPermission);
};

// Helper to get user's default landing page based on role
export const getDefaultLandingPage = (roleId: number): string => {
  switch (roleId) {
    case 1: // Admin
      return "/account/home";
    case 2: // Student
      return "/account/home";
    case 3: // Cashier
      return "/cashier";
    case 4: // Kitchen Staff
      return "/kitchen";
    case 5: // Sales
      return "/sales";
    default:
      return "/account/home";
  }
};