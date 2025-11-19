"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { DashboardNavMain } from "./DashboardNavMain"
import { DashboardTeamSwitcher } from "./DashboardTeamSwitcher"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      
      {/* Przełącznik Placówek */}
      <SidebarHeader>
        <DashboardTeamSwitcher />
      </SidebarHeader>


      <SidebarContent>
        <DashboardNavMain />
      </SidebarContent>

    </Sidebar>
  )
}