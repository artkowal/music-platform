"use client"

import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Home, Settings, Info, Briefcase, GraduationCap, 
  CalendarDays, Plus, Settings2, TrendingUp, School, type LucideIcon 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkplace } from "@/context/WorkplaceContext";
import { coursesApi } from "@/api/courses"; 
import type { Course } from "@/types/Course";
import { CreateWorkplaceDialog } from "@/components/dialogs/CreateWorkplaceDialog";
import { JoinCourseDialog } from "@/components/dialogs/JoinCourseDialog";
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
  
  const [isCreateWorkplaceOpen, setIsCreateWorkplaceOpen] = useState(false);
  const [isJoinCourseOpen, setIsJoinCourseOpen] = useState(false);
  
  const [studentCourses, setStudentCourses] = useState<Course[]>([]);

  const isTeacher = user?.role === 'teacher';

  const fetchStudentCourses = useCallback(async () => {
    if (!isTeacher && user) {
      try {
        const data = await coursesApi.getAll();
        setStudentCourses(data);
      } catch (error) {
        console.error("Błąd pobierania kursów do sidebara", error);
      }
    }
  }, [isTeacher, user]);

  useEffect(() => {
    fetchStudentCourses();
  }, [fetchStudentCourses]);

  const isLinkActive = (url: string) => {
    if (url === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(url);
  };

  const mainNavItems: NavItem[] = isTeacher ? [
    { title: "Pulpit", url: "/dashboard", icon: Home },
    { title: "Wszystkie Kursy", url: "/dashboard/courses", icon: Briefcase },
    { title: "Kalendarz", url: "/dashboard/calendar", icon: CalendarDays },
  ] : [
    { title: "Pulpit", url: "/dashboard", icon: Home },
    { title: "Wszystkie Kursy", url: "/dashboard/courses", icon: GraduationCap },
    { title: "Mój Kalendarz", url: "/dashboard/calendar", icon: CalendarDays },
  ];

  const accountNavItems: NavItem[] = [
    ...(isTeacher ? [{ title: "Rozliczenia", url: "/dashboard/finances", icon: TrendingUp }] : []),
    { title: "Ustawienia", url: "/dashboard/settings", icon: Settings },
    { title: "O Projekcie", url: "/dashboard/about", icon: Info },
  ];

  return (
    <>
      <CreateWorkplaceDialog 
        open={isCreateWorkplaceOpen} 
        onOpenChange={setIsCreateWorkplaceOpen} 
      />

      <JoinCourseDialog 
        open={isJoinCourseOpen} 
        onOpenChange={setIsJoinCourseOpen} 
        onSuccess={fetchStudentCourses}
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

      {/* SEKCJA DLA NAUCZYCIELA (PLACÓWKI) */}
      {isTeacher && (
        <SidebarGroup>
          <div className="absolute right-2 top-3.5 flex items-center gap-1 group-data-[collapsible=icon]:hidden">
             <Tooltip>
               <TooltipTrigger asChild>
                 <button 
                   onClick={() => setIsCreateWorkplaceOpen(true)}
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

      {/* SEKCJA DLA UCZNIA */}
      {!isTeacher && (
        <SidebarGroup>
          <div className="absolute right-2 top-3.5 flex items-center gap-1 group-data-[collapsible=icon]:hidden">
             <Tooltip>
               <TooltipTrigger asChild>
                 <button 
                   onClick={() => setIsJoinCourseOpen(true)}
                   className="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-sidebar-accent transition-colors"
                 >
                     <Plus className="size-4" />
                 </button>
               </TooltipTrigger>
               <TooltipContent>Dołącz do kursu</TooltipContent>
             </Tooltip>
          </div>

          <SidebarGroupLabel>Moje Kursy</SidebarGroupLabel>
          <SidebarMenu>
            {studentCourses.length === 0 && (
                <div className="px-2 py-4 text-xs text-center text-muted-foreground border border-dashed rounded-md m-2 group-data-[collapsible=icon]:hidden">
                    Brak kursów. <br/> Kliknij "+" aby dołączyć.
                </div>
            )}
            
            {studentCourses.map((course) => {
              const courseUrl = `/dashboard/courses/${course.course_id}`;
              const active = location.pathname.startsWith(courseUrl);
              const courseColor = course.color_hex || "hsl(var(--primary))";

              return (
                <SidebarMenuItem key={course.course_id}>
                  <SidebarMenuButton 
                    asChild
                    isActive={active}
                    tooltip={course.title}
                    className="group/course group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!justify-center"
                  >
                    <Link 
                      to={courseUrl}
                      className="flex items-center gap-3"
                    >
                      <div 
                        className="flex size-6 shrink-0 items-center justify-center rounded-md border text-white shadow-sm transition-transform group-hover/course:scale-105"
                        style={{ 
                            backgroundColor: courseColor, 
                            borderColor: courseColor 
                        }}
                      >
                          <GraduationCap className="size-3.5" />
                      </div>
                      
                      <span className="truncate group-data-[collapsible=icon]:hidden">
                        {course.title}
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