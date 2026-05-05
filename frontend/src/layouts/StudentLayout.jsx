import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import TopBar from "@/components/TopBar";
import { LayoutDashboard, Search, CalendarCheck, Bell, User } from "lucide-react";
import { useAppointments } from "@/context/AppointmentContext";

const StudentLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { unreadCount } = useAppointments();

  const links = [
  { label: "Dashboard", href: "/student/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Find Faculty", href: "/student/faculty", icon: <Search className="h-4 w-4" /> },
  { label: "My Appointments", href: "/student/appointments", icon: <CalendarCheck className="h-4 w-4" /> },
  { label: "Notifications", href: "/student/notifications", icon: <Bell className="h-4 w-4" />, badge: unreadCount },
  { label: "Profile", href: "/student/profile", icon: <User className="h-4 w-4" /> }];


  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar links={links} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar title="Student Portal" onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>);

};

export default StudentLayout;