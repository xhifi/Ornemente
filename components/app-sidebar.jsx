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
import { hasAnyPermission } from "@/lib/authorization";

// This is sample data.
const data = {
  navMain: [
    {
      title: "Manage Products",
      url: "#",
      items: [
        {
          title: "All Products",
          permissions: [{ scopes: ["read"], resource: "products" }],
          url: "/dashboard/products",
        },
        {
          title: "Product Colors",
          permissions: [{ scopes: ["read"], resource: "colors" }],
          url: "/dashboard/products/colors",
        },
        {
          title: "Product Designs",
          permissions: [{ scopes: ["read"], resource: "designs" }],
          url: "/dashboard/products/designs",
        },
        {
          title: "Product Sizes",
          permissions: [{ scopes: ["read"], resource: "sizes" }],
          url: "/dashboard/products/sizes",
        },
        {
          title: "Shop Types",
          permissions: [{ scopes: ["read"], resource: "types" }],
          url: "/dashboard/products/types",
        },
        {
          title: "Shop Brands",
          permissions: [{ scopes: ["read"], resource: "brands" }],
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
          permissions: [{ scopes: ["read"], resource: "orders" }],
          url: "/dashboard/orders",
        },
        {
          title: "Returns",
          permissions: [{ scopes: ["read"], resource: "returns" }],
          url: "#",
        },
        {
          title: "Reviews",
          permissions: [{ scopes: ["read"], resource: "reviews" }],
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
          permissions: [{ scopes: ["read"], resource: "users" }],
          url: "/dashboard/users",
        },
        {
          title: "Roles",
          permissions: [{ scopes: ["read"], resource: "roles" }],
          url: "/dashboard/users/roles",
        },
        {
          title: "Permissions",
          permissions: [{ scopes: ["read"], resource: "permissions" }],
          url: "/dashboard/users/permissions",
        },
        {
          title: "Resources",
          permissions: [{ scopes: ["read"], resource: "resources" }],
          url: "/dashboard/users/resources",
        },
      ],
    },
  ],
};

const aggregatePermissions = (items) => {
  const permissionMap = new Map();

  items.forEach((subItem) => {
    subItem.permissions.forEach((permission) => {
      const { resource, scopes } = permission;

      if (permissionMap.has(resource)) {
        // Merge scopes for the same resource, avoiding duplicates
        const existingScopes = permissionMap.get(resource);
        const newScopes = [...new Set([...existingScopes, ...scopes])];
        permissionMap.set(resource, newScopes);
      } else {
        // Add new resource with its scopes
        permissionMap.set(resource, [...scopes]);
      }
    });
  });

  // Convert map to array of objects with the desired structure
  return Array.from(permissionMap.entries()).map(([resource, scopes]) => ({
    scopes,
    resource,
  }));
};

export function AppSidebar({ ...props }) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <Logo className="px-2" />
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map(async (item) => {
          const isAuthorized = await hasAnyPermission(aggregatePermissions(item.items));
          if (!isAuthorized) {
            return null;
          }

          return (
            <SidebarGroup key={item.title}>
              <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {item.items.map(async (item) => {
                    const isAuthorized = await hasAnyPermission(item.permissions);
                    if (!isAuthorized) {
                      return null;
                    }

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={item.isActive}>
                          <a href={item.url}>{item.title}</a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
