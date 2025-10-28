//router.ts - COMPLETE VERSION
import { setupLayouts } from "virtual:generated-layouts";
import { createRouter, createWebHistory } from "vue-router";

import Hero from "@/pages/index.vue";
import Auth from "@/pages/Auth.vue";
import Dashboard from "@/pages/HomeView.vue";
import NotFound from "@/pages/NotFound.vue";
import ForbiddenView from "@/pages/ForbiddenView.vue";
import AdminUserRolesView from "@/pages/admin/AdminUserRolesView.vue";
import UserManagementView from "@/pages/admin/UserManagementView.vue";
import InventoryView from "@/pages/admin/InventoryView.vue";
import TableQRCodeGenerator from "@/pages/admin/components/TableQRCodeGenerator.vue";

import LandingPage from "@/pages/customer/LandingPage.vue";
import Menu from "@/pages/customer/Menu.vue";
import ReviewOrder from "@/pages/customer/ReviewOrder.vue";
import WaitingPage from "@/pages/customer/WaitingPage.vue";

// Cashier imports
import CashierOrdersView from "@/pages/cashier/CashierOrdersView.vue";
import CashierHistoryView from "@/pages/cashier/CashierHistoryView.vue";

// Kitchen imports
import KitchenOrdersView from "@/pages/kitchen/KitchenOrdersView.vue";

// Sales imports
import SalesView from "@/pages/sales/SalesView.vue";

/**
 * Route definitions for the application
 */
const routes = setupLayouts([
  // Customer routes
  {
    path: "/",
    component: LandingPage,
  },
  {
    path: "/hero",
    component: Hero,
  },
  {
    path: "/auth",
    component: Auth,
  },
  {
    path: "/customer/landing",
    redirect: "/",
  },
  {
    path: "/customer/review-order",
    component: ReviewOrder,
  },
  {
    path: "/customer/waiting",
    component: WaitingPage,
  },
  {
    path: "/customer/menu",
    component: Menu,
  },

  // Account routes
  {
    path: "/account/home",
    component: Dashboard,
    meta: { requiresAuth: true },
  },

  // Admin routes
  {
    path: "/admin/inventory-management",
    component: InventoryView,
    meta: { requiresAuth: true },
  },
  {
    path: "/admin/qr-generator",
    name: "QRCodeGenerator",
    component: TableQRCodeGenerator,
    meta: { requiresAuth: true },
  },
  {
    path: "/admin/user-roles",
    component: AdminUserRolesView,
    meta: { requiresAuth: true },
  },
  {
    path: "/admin/user-management",
    component: UserManagementView,
    meta: { requiresAuth: true },
  },

  // Cashier routes
  {
    path: "/cashier",
    name: "CashierOrders",
    component: CashierOrdersView,
    meta: {
      requiresAuth: true,
      allowedRoles: [1, 3], // Admin and Cashier
      title: "Cashier - Pending Orders",
    },
  },
  {
    path: "/cashier/history",
    name: "CashierHistory",
    component: CashierHistoryView,
    meta: {
      requiresAuth: true,
      allowedRoles: [1, 3], // Admin and Cashier
      title: "Cashier - Order History",
    },
  },

  // Kitchen routes
  {
    path: "/kitchen",
    name: "KitchenOrders",
    component: KitchenOrdersView,
    meta: {
      requiresAuth: true,
      allowedRoles: [1, 4], // Admin and Kitchen Staff
      title: "Kitchen - Order Management",
    },
  },

  // Sales routes
  {
    path: "/sales",
    name: "SalesDashboard",
    component: SalesView,
    meta: {
      requiresAuth: true,
      allowedRoles: [1, 2], // Admin and Cashier
      title: "Sales Dashboard",
    },
  },

  // Error routes
  {
    path: "/forbidden",
    component: ForbiddenView,
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: NotFound,
  },
]);

/**
 * Create and configure the router instance
 */
export const createAppRouter = () => {
  return createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
  });
};