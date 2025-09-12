import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Logo from "./ui/factory/brand/Logo";
import { hasPermission } from "@/lib/authorization";

// This is sample data.
const data = {
  navMain: [
    {
      title: "Manage Products",
      url: "#",
      items: [
        {
          title: "All Products",
          permission: { action: "read", resource: "products" },
          url: "/dashboard/products",
        },
        {
          title: "Product Colors",
          permission: { action: "read", resource: "colors" },
          url: "/dashboard/products/colors",
        },
        {
          title: "Product Designs",
          permission: { action: "read", resource: "designs" },
          url: "/dashboard/products/designs",
        },
        {
          title: "Product Sizes",
          permission: { action: "read", resource: "sizes" },
          url: "/dashboard/products/sizes",
        },
        {
          title: "Shop Types",
          permission: { action: "read", resource: "types" },
          url: "/dashboard/products/types",
        },
        {
          title: "Shop Brands",
          permission: { action: "read", resource: "brands" },
          url: "/dashboard/products/brands",
        },
      ],
    },
    {
      title: "Manage Orders",
      url: "#",
      items: [
        {
          title: "View Orders",
          permission: { action: "read", resource: "orders" },
          url: "/dashboard/orders",
        },
        {
          title: "Returns",
          permission: { action: "read", resource: "returns" },
          url: "#",
        },
        {
          title: "Reviews",
          permission: { action: "read", resource: "reviews" },
          url: "#",
        },
      ],
    },
    {
      title: "Manage Users",
      url: "#",
      items: [
        {
          title: "View Users",
          permission: { action: "read", resource: "users" },
          url: "/dashboard/users",
        },
        {
          title: "Roles",
          permission: { action: "read", resource: "roles" },
          url: "/dashboard/users/roles",
        },
        {
          title: "Permissions",
          permission: { action: "read", resource: "permissions" },
          url: "/dashboard/users/permissions",
        },
        {
          title: "Resources",
          permission: { action: "read", resource: "resources" },
          url: "/dashboard/users/resources",
        },
      ],
    },
  ],
};

// Helper function to check if user has any permission for a section
const checkSectionPermission = async (items) => {
  for (const item of items) {
    if (await hasPermission(item.permission.action, item.permission.resource)) {
      return true;
    }
  }
  return false;
};

export async function AppSidebar({ ...props }) {
  // Pre-check all permissions
  const sectionsWithPermissions = await Promise.all(
    data.navMain.map(async (section) => {
      const hasAnyPermission = await checkSectionPermission(section.items);
      if (!hasAnyPermission) return null;

      const filteredItems = await Promise.all(
        section.items.map(async (item) => {
          const isAuthorized = await hasPermission(item.permission.action, item.permission.resource);
          return isAuthorized ? item : null;
        })
      );

      return {
        ...section,
        items: filteredItems.filter(Boolean),
      };
    })
  );

  const authorizedSections = sectionsWithPermissions.filter(Boolean);

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <Logo className="px-2" />
      </SidebarHeader>
      <SidebarContent>
        {authorizedSections.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      <a href={item.url}>{item.title}</a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
