import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import Navbar from "../navbar/Navbar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { WorkplaceProvider } from "@/context/WorkplaceContext";

export default function DashboardLayout() {
  return (
    <WorkplaceProvider>
    <SidebarProvider>

      <AppSidebar />

      <SidebarInset className="flex min-h-svh flex-col">
        
        <Navbar /> 
        
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
    </WorkplaceProvider>
  );
}