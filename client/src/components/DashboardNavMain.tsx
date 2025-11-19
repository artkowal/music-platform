"use client"

import { Home, Settings, Info, Briefcase, GraduationCap, Users, Library, CalendarDays, type LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NavLink } from "react-router-dom";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

// Komponent renderujący link
const NavItemLink = ({ item }: { item: NavItem }) => {
  const { title, url, icon: Icon } = item;

  // Funkcja do stylowania NavLink
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
    );

  return (
    <SidebarMenuItem key={title} className="p-0">
      <SidebarMenuButton asChild tooltip={title}>
        <NavLink 
          to={url} 
          end={url === "/dashboard"} 
          className={getNavLinkClass}
        >
          <Icon className="h-4 w-4" />
          <span className="group-data-[collapsible=icon]/sidebar-wrapper:hidden">
            {title}
          </span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

export function DashboardNavMain() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const teacherNavItems: NavItem[] = [
    { title: "Przegląd", url: "/dashboard", icon: Home },
    { title: "Kalendarz", url: "/dashboard/calendar", icon: CalendarDays },
    { title: "Kursy", url: "/dashboard/courses", icon: Briefcase },
    { title: "Uczniowie", url: "/dashboard/students", icon: Users },
    { title: "Zarządzaj Placówkami", url: "/dashboard/workplaces", icon: Library },
  ];
  
  const studentNavItems: NavItem[] = [
    { title: "Przegląd", url: "/dashboard", icon: Home },
    { title: "Mój Kalendarz", url: "/dashboard/calendar", icon: CalendarDays },
    { title: "Moje Kursy", url: "/dashboard/courses", icon: GraduationCap },
  ];

  const accountNavItems: NavItem[] = [
    { title: "Ustawienia", url: "/dashboard/settings", icon: Settings },
    { title:"O Projekcie", url: "/dashboard/about", icon: Info },
  ];

  const mainNavItems = isTeacher ? teacherNavItems : studentNavItems;

  return (
    <SidebarGroup>
      
      {/* Linki Główne */}
      <SidebarGroupLabel className="group-data-[collapsible=icon]/sidebar-wrapper:hidden">
        {isTeacher ? "Zarządzanie" : "Platforma"}
      </SidebarGroupLabel>
      <SidebarMenu>
        {mainNavItems.map((item) => (
          <NavItemLink key={item.url} item={item} />
        ))}
      </SidebarMenu>

      {/* Linki Ustawień */}
      <SidebarGroupLabel className="mt-4 group-data-[collapsible=icon]/sidebar-wrapper:hidden">
        Konto
      </SidebarGroupLabel>
      <SidebarMenu>
        {accountNavItems.map((item) => (
          <NavItemLink key={item.url} item={item} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}