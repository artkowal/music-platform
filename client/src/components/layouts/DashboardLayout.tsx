import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import Navbar from "@/components/Navbar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export default function DashboardLayout() {
  return (
    <SidebarProvider>

      <AppSidebar />

      <SidebarInset className="flex min-h-svh flex-col">
        
        <Navbar /> 
        
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}