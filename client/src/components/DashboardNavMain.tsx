"use client"

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Home, Settings, Info, Briefcase, GraduationCap, 
  Users, CalendarDays, Plus, Settings2, School, type LucideIcon 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkplace } from "@/context/WorkplaceContext";
import { CreateWorkplaceDialog } from "@/components/dialogs/CreateWorkplaceDialog";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

export function DashboardNavMain() {
  const { user } = useAuth();
  const { workplaces, setActiveWorkplace } = useWorkplace();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const isTeacher = user?.role === 'teacher';

  const isLinkActive = (url: string) => {
    if (url === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(url);
  };

  const mainNavItems: NavItem[] = isTeacher ? [
    { title: "Przegląd", url: "/dashboard", icon: Home },
    { title: "Wszystkie Kursy", url: "/dashboard/courses", icon: Briefcase },
    { title: "Kalendarz", url: "/dashboard/calendar", icon: CalendarDays },
    { title: "Wszyscy Uczniowie", url: "/dashboard/students", icon: Users },
  ] : [
    { title: "Przegląd", url: "/dashboard", icon: Home },
    { title: "Moje Kursy", url: "/dashboard/courses", icon: GraduationCap },
    { title: "Mój Kalendarz", url: "/dashboard/calendar", icon: CalendarDays },
  ];

  const accountNavItems: NavItem[] = [
    { title: "Ustawienia", url: "/dashboard/settings", icon: Settings },
    { title:"O Projekcie", url: "/dashboard/about", icon: Info },
  ];

  return (
    <>
      <CreateWorkplaceDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
      />

      <SidebarGroup>
        <SidebarGroupLabel>Platforma</SidebarGroupLabel>
        <SidebarMenu>
          {mainNavItems.map((item) => {
            const active = isLinkActive(item.url);
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                  <Link to={item.url}>
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>

      <SidebarSeparator className="mx-0" />

      {isTeacher && (
        <SidebarGroup>
          <div className="absolute right-2 top-3.5 flex items-center gap-1 group-data-[collapsible=icon]:hidden">
             <Tooltip>
               <TooltipTrigger asChild>
                 <button 
                   onClick={() => setIsCreateDialogOpen(true)}
                   className="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-sidebar-accent transition-colors"
                 >
                     <Plus className="size-4" />
                 </button>
               </TooltipTrigger>
               <TooltipContent>Dodaj nową placówkę</TooltipContent>
             </Tooltip>

             <Tooltip>
                <TooltipTrigger asChild>
                   <button 
                      onClick={() => navigate('/dashboard/workplaces')}
                      className="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-sidebar-accent transition-colors"
                   >
                      <Settings2 className="size-4" />
                   </button>
                </TooltipTrigger>
                <TooltipContent>Zarządzaj placówkami</TooltipContent>
             </Tooltip>
          </div>

          <SidebarGroupLabel>Placówki</SidebarGroupLabel>

          <SidebarMenu>
            {workplaces.length === 0 && (
                <div className="px-2 py-4 text-xs text-center text-muted-foreground border border-dashed rounded-md m-2 group-data-[collapsible=icon]:hidden">
                    Brak placówek. <br/> Kliknij "+" aby dodać.
                </div>
            )}

            {workplaces.map((wp) => {
              const wpUrl = `/dashboard/workplace/${wp.workplace_id}`;
              const active = location.pathname === wpUrl;
              
              return (
                <SidebarMenuItem key={wp.workplace_id}>
                  <SidebarMenuButton 
                    asChild
                    isActive={active}
                    tooltip={wp.name}
                    className="group/workplace group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!justify-center"
                  >
                    <Link 
                      to={wpUrl}
                      onClick={() => setActiveWorkplace(wp)}
                      className="flex items-center gap-3"
                    >
                      <div 
                        className="flex size-6 shrink-0 items-center justify-center rounded-md border text-white shadow-sm transition-transform group-hover/workplace:scale-105"
                        style={{ 
                            backgroundColor: wp.color_hex, 
                            borderColor: wp.color_hex 
                        }}
                      >
                         <School className="size-3.5" />
                      </div>
                      
                      <span className="truncate group-data-[collapsible=icon]:hidden">
                        {wp.name}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      )}

      <SidebarGroup className="mt-auto">
        <SidebarGroupLabel>Konto</SidebarGroupLabel>
        <SidebarMenu>
          {accountNavItems.map((item) => {
            const active = isLinkActive(item.url);
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                  <Link to={item.url}>
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}