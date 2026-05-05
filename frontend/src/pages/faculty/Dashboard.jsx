import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAppointments } from "@/context/AppointmentContext";
import { getGreeting, formatDate, formatTimeSlot } from "@/utils/helpers";
import { CalendarCheck, CheckCircle, Users, Hourglass } from "lucide-react";
import AppointmentCard from "@/components/AppointmentCard";
import ConfirmModal from "@/components/ConfirmModal";
import MeetingGenerator from "@/components/MeetingGenerator";
import StatusBadge from "@/components/StatusBadge";
import { apiClient } from "@/services/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

const FacultyDashboard = () => {
  const { user } = useAuth();
  const { appointments, updateAppointmentStatus, fetchAppointments } = useAppointments();
  const [weeklyData, setWeeklyData] = useState([]);
  const [approveId, setApproveId] = useState(null);
  const [meetingUrl, setMeetingUrl] = useState("");

  useEffect(() => {
    // Build rolling 7-day chart: today + next 6 days
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const counts = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      return {
        day: dayLabels[d.getDay()],
        count: appointments.filter((a) => a.date?.slice(0, 10) === dateStr).length,
      };
    });
    setWeeklyData(counts);
  }, [appointments]);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayApts = appointments.filter((a) => a.date?.slice(0, 10) === todayStr && (a.status === "approved" || a.status === "completed"));
  const pending = appointments.filter((a) => a.status === "pending");
  const approvedCount = appointments.filter((a) => a.status === "approved").length;
  const studentIds = new Set(appointments.map((a) => a.studentId?._id || a.studentId));

  const stats = [
    { label: "Today's Appointments", value: todayApts.length, icon: <CalendarCheck className="h-5 w-5 text-primary" />, bg: "bg-primary/10" },
    { label: "Pending Requests", value: pending.length, icon: <Hourglass className="h-5 w-5 text-warning" />, bg: "bg-warning/10" },
    { label: "Approved Appointments", value: approvedCount, icon: <CheckCircle className="h-5 w-5 text-success" />, bg: "bg-success/10" },
    { label: "Students Served", value: studentIds.size, icon: <Users className="h-5 w-5 text-secondary" />, bg: "bg-secondary/10" },
  ];

  const confirmApprove = async () => {
    if (!approveId) return;
    const res = await updateAppointmentStatus(approveId, "approved", null, meetingUrl);
    if (res?.success) { toast.success("Appointment approved"); fetchAppointments(); }
    else toast.error("Failed to approve");
    setApproveId(null);
    setMeetingUrl("");
  };

  const handleReject = async (id) => {
    const res = await updateAppointmentStatus(id, "rejected", "Declined by faculty");
    if (res?.success) { toast.success("Appointment rejected"); fetchAppointments(); }
    else toast.error("Failed to reject");
  };

  return (
    <div className="page-fade-in space-y-6">
      <div className="rounded-xl border border-border bg-gradient-to-r from-primary/5 to-secondary/5 p-6">
        <h2 className="text-xl font-bold text-foreground">{getGreeting()}, {user?.name?.split(" ")[0] || "Faculty"}!</h2>
        <p className="text-sm text-muted-foreground">{formatDate(new Date())}</p>
      </div>

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

      {/* Today's schedule */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">Today's Schedule</h3>
        <div className="mt-3 space-y-2">
          {todayApts.length > 0 ? todayApts.map((a) => (
            <div key={a._id} className="flex items-center gap-4 rounded-lg border border-border bg-card p-3">
              <div className="text-sm font-medium text-primary min-w-[140px]">{formatTimeSlot(a.timeSlot) || "—"}</div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{a.studentId?.userId?.name || "Student"}</p>
                  <span className="text-[10px] bg-muted/60 border rounded px-1.5 py-0.5 uppercase tracking-wider font-semibold text-muted-foreground">{a.mode || 'offline'}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{a.purpose}</p>
              </div>
              <StatusBadge status={a.status} />
            </div>
          )) : <p className="text-sm text-muted-foreground">No appointments today</p>}
        </div>
      </div>

      {/* Pending requests */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">Pending Requests</h3>
        <div className="mt-3 space-y-3">
          {pending.slice(0, 5).map((a) => (
            <AppointmentCard key={a._id} appointment={a} showFaculty={false} showStudent
              actions={
                <>
                  <button onClick={() => setApproveId(a._id)} className="rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-success-foreground hover:bg-success/90">Approve</button>
                  <button onClick={() => handleReject(a._id)} className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90">Reject</button>
                </>
              }
            />
          ))}
          {pending.length === 0 && <p className="text-sm text-muted-foreground">No pending requests</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Appointments This Week</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(215 16% 47%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(215 16% 47%)" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(239 84% 67%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Meeting Generator Gatekeeper */}
        <MeetingGenerator />
      </div>

      <ConfirmModal
        open={!!approveId}
        title="Approve Appointment & Add Meeting Link"
        message="Please provide a valid Google Meet or Zoom link for this meeting. If left blank, a random placeholder link will be assigned."
        confirmLabel="Approve"
        onConfirm={confirmApprove}
        onCancel={() => { setApproveId(null); setMeetingUrl(""); }}>
        <input
          type="url"
          value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)}
          placeholder="https://meet.google.com/xxx-yyyy-zzz"
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </ConfirmModal>
    </div>
  );
};

export default FacultyDashboard;