"use client"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import logo from "@/assets/logo.png";
import { useAuth } from "@/hooks/useAuth";
import { ChevronsUpDown } from "lucide-react";

// Header dla uczniów
const StudentHeader = () => (
  <SidebarMenuButton size="lg" className="group cursor-default">
    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
      <img src={logo} alt="MusicDesk Logo" className="h-5 w-5" />
    </div>
    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]/sidebar-wrapper:hidden">
      <span className="truncate font-medium">MusicDesk</span>
      <span className="truncate text-xs text-muted-foreground">Platforma</span>
    </div>
  </SidebarMenuButton>
);

// Header dla nauczycieli
// TODO: komponent otworzy Dropdown z placówkami
const TeacherHeader = () => (
  <SidebarMenuButton
    size="lg"
    className="group" // Po kliknięciu otworzy się Dropdown
  >
    {/* TODO: ikona/kolor wybranej placówki */}
    <div className="bg-blue-500 text-white flex aspect-square size-8 items-center justify-center rounded-lg">
      <img src={logo} alt="Logo Placówki" className="h-5 w-5" />
    </div>
    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]/sidebar-wrapper:hidden">
      {/* TODO: nazwa wybranej placówki */}
      <span className="truncate font-medium">Szkoła Muzyczna</span>
      <span className="truncate text-xs text-muted-foreground">Radom</span>
    </div>
    <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground group-data-[collapsible=icon]/sidebar-wrapper:hidden" />
  </SidebarMenuButton>
);

export function DashboardTeamSwitcher() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {/* Warunkowe renderowanie nagłówka w zależności od roli */}
        {isTeacher ? <TeacherHeader /> : <StudentHeader />}
      </SidebarMenuItem>
    </SidebarMenu>
  )
}