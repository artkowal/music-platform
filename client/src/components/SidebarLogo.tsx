"use client"

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import logo from "@/assets/logo.png";
import { useAuth } from "@/hooks/useAuth";

export function SidebarLogo() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-default hover:bg-transparent">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <img src={logo} alt="MusicDesk Logo" className="size-5" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-bold">MusicDesk</span>
            <span className="truncate text-xs text-muted-foreground">
              {isTeacher ? "Panel Nauczyciela" : "Panel Ucznia"}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}