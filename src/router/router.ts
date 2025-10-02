import { setupLayouts } from "virtual:generated-layouts";
import { createRouter, createWebHistory } from "vue-router";

import Hero from "@/pages/index.vue";
import Auth from "@/pages/Auth.vue";
import Dashboard from "@/pages/HomeView.vue";
import NotFound from "@/pages/NotFound.vue";
import ForbiddenView from "@/pages/ForbiddenView.vue";
import AdminUserRolesView from "@/pages/admin/AdminUserRolesView.vue";
import UserManagementView from "@/pages/admin/UserManagementView.vue";

import LandingPage from "@/pages/customer/LandingPage.vue";
import Menu from "@/pages/customer/Menu.vue";
// NOTE: Import the QR Code Generator component
import TableQRCodeGenerator from "@/pages/admin/components/TableQRCodeGenerator.vue";


/**
 * Route definitions for the application
 */
const routes = setupLayouts([
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
		path: "/customer/menu",
		component: Menu,
	},

	{
		path: "/account/home",
		component: Dashboard,
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
