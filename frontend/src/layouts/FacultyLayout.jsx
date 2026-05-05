import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import TopBar from "@/components/TopBar";
import { LayoutDashboard, Calendar, CalendarCheck, Bell, User } from "lucide-react";
import { useAppointments } from "@/context/AppointmentContext";

const FacultyLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { appointments, unreadCount } = useAppointments();
  const pendingCount = appointments.filter((a) => a.facultyId === "f1" && a.status === "pending").length;

  const links = [
  { label: "Dashboard", href: "/faculty/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "My Schedule", href: "/faculty/slots", icon: <Calendar className="h-4 w-4" /> },
  { label: "Requests", href: "/faculty/requests", icon: <CalendarCheck className="h-4 w-4" />, badge: pendingCount },
  { label: "Notifications", href: "/faculty/notifications", icon: <Bell className="h-4 w-4" />, badge: unreadCount },
  { label: "Profile", href: "/faculty/profile", icon: <User className="h-4 w-4" /> }];


  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar links={links} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar title="Faculty Portal" onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>);

};

export default FacultyLayout;