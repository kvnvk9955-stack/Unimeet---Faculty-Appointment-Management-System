import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAppointments } from "@/context/AppointmentContext";
import { getGreeting, formatDate, formatRelativeTime, formatNotificationMessage } from "@/utils/helpers";
import { CalendarPlus, CalendarCheck, Clock, CheckCircle, Hourglass } from "lucide-react";
import AppointmentCard from "@/components/AppointmentCard";

const StudentDashboard = () => {
  const { user } = useAuth();
  const { appointments, notifications } = useAppointments();

  const pending = appointments.filter((a) => a.status === "pending").length;
  const todayStr = new Date().toISOString().split("T")[0];
  const today = appointments.filter((a) => a.date?.slice(0, 10) === todayStr && a.status === "approved").length;
  const completed = appointments.filter((a) => a.status === "completed").length;
  const upcoming = appointments.filter((a) => a.status === "approved" && new Date(a.date) >= new Date()).slice(0, 3);

  const stats = [
    { label: "Total Appointments", value: appointments.length, icon: <CalendarCheck className="h-5 w-5 text-primary" />, bg: "bg-primary/10" },
    { label: "Pending Approvals", value: pending, icon: <Hourglass className="h-5 w-5 text-warning" />, bg: "bg-warning/10" },
    { label: "Upcoming Today", value: today, icon: <Clock className="h-5 w-5 text-secondary" />, bg: "bg-secondary/10" },
    { label: "Completed", value: completed, icon: <CheckCircle className="h-5 w-5 text-success" />, bg: "bg-success/10" },
  ];

  const recentNotifs = notifications.slice(0, 3);

  return (
    <div className="page-fade-in space-y-6">
      {/* Welcome */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-primary/5 to-secondary/5 p-6">
        <h2 className="text-xl font-bold text-foreground">{getGreeting()}, {user?.name?.split(" ")[0] || "Student"}!</h2>
        <p className="text-sm text-muted-foreground">{formatDate(new Date())}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className={`rounded-lg p-2 ${s.bg}`}>{s.icon}</div>
              <span className="text-2xl font-bold text-foreground">{s.value}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Upcoming Appointments</h3>
          <Link to="/student/appointments" className="text-sm font-medium text-primary hover:underline">View all</Link>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.length > 0 ? upcoming.map((a) => (
            <AppointmentCard key={a._id} appointment={a} />
          )) : (
            <p className="text-sm text-muted-foreground col-span-full">No upcoming appointments. <Link to="/student/faculty" className="text-primary hover:underline">Book one now!</Link></p>
          )}
        </div>
      </div>

      {/* Notifications */}
      {recentNotifs.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Recent Notifications</h3>
            <Link to="/student/notifications" className="text-sm font-medium text-primary hover:underline">View all</Link>
          </div>
          <div className="mt-3 space-y-2">
            {recentNotifs.map((n) => (
              <div key={n._id} className={`rounded-lg border border-border p-3 text-sm ${n.isRead ? "bg-card" : "bg-primary/5 font-medium"}`}>
                <p className="text-foreground">{formatNotificationMessage(n.message)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatRelativeTime(n.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick action */}
      <Link to="/student/faculty" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
        <CalendarPlus className="h-4 w-4" /> Book New Appointment
      </Link>
    </div>
  );
};

export default StudentDashboard;