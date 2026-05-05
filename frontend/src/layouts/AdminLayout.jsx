import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import TopBar from "@/components/TopBar";
import { LayoutDashboard, Users, GraduationCap, CalendarCheck, BarChart3, Bell, User } from "lucide-react";
import { useAppointments } from "@/context/AppointmentContext";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { unreadCount } = useAppointments();

  const links = [
  { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Manage Users", href: "/admin/users", icon: <Users className="h-4 w-4" /> },
  { label: "Manage Faculty", href: "/admin/faculty", icon: <GraduationCap className="h-4 w-4" /> },
  { label: "All Appointments", href: "/admin/appointments", icon: <CalendarCheck className="h-4 w-4" /> },
  { label: "Reports", href: "/admin/reports", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Notifications", href: "/admin/notifications", icon: <Bell className="h-4 w-4" />, badge: unreadCount },
  { label: "Profile", href: "/admin/profile", icon: <User className="h-4 w-4" /> }];


  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar links={links} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar title="Admin Portal" onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>);

};

export default AdminLayout;