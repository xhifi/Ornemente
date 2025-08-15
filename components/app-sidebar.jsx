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

// This is sample data.
const data = {
  navMain: [
    {
      title: "Manage Products",
      url: "#",
      items: [
        {
          title: "All Products",
          url: "/dashboard/products",
        },
        {
          title: "Product Colors",
          url: "/dashboard/products/colors",
        },
        {
          title: "Product Designs",
          url: "/dashboard/products/designs",
        },
        {
          title: "Product Sizes",
          url: "/dashboard/products/sizes",
        },
        {
          title: "Shop Types",
          url: "/dashboard/products/types",
        },
        {
          title: "Shop Brands",
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
          url: "/dashboard/orders",
        },
        {
          title: "Returns",
          url: "#",
        },
        {
          title: "Reviews",
          url: "#",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <Logo className="px-2" />
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
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
