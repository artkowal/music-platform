"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { DashboardNavMain } from "./components/DashboardNavMain"
import { SidebarLogo } from "./components/SidebarLogo"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      
      <SidebarHeader>
        <SidebarLogo />
      </SidebarHeader>

      <SidebarContent>
        <DashboardNavMain />
      </SidebarContent>

    </Sidebar>
  )
}