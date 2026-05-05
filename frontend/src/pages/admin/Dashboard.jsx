import React, { useState, useEffect, useCallback } from "react";
import { useAppointments } from "@/context/AppointmentContext";
import { apiClient } from "@/services/api";
import { Users, GraduationCap, CalendarCheck, Clock, CheckCircle, XCircle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";
import StatusBadge from "@/components/StatusBadge";
import { formatDate, formatTimeSlot } from "@/utils/helpers";

const COLORS = ["hsl(239 84% 67%)", "hsl(263 70% 58%)", "hsl(160 84% 39%)", "hsl(38 92% 50%)", "hsl(0 84% 60%)"];

const AdminDashboard = () => {
  const [summary, setSummary] = useState({
    totalStudents: 0, totalFaculty: 0, totalAppointments: 0, pendingToday: 0,
    completedThisMonth: 0, rejectedThisMonth: 0, pendingFacultyCount: 0
  });
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [topFaculty, setTopFaculty] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);

  const fetchStats = useCallback(async () => {
    const res = await apiClient.get(`/admin/stats?_t=${Date.now()}`);
    if (res.success) {
      setSummary({
        totalStudents: res.data.totalStudents || 0,
        totalFaculty: res.data.totalFaculty || 0,
        totalAppointments: res.data.totalAppointments || 0,
        pendingToday: res.data.pendingToday || 0,
        completedThisMonth: res.data.completedThisMonth || 0,
        rejectedThisMonth: res.data.rejectedThisMonth || 0,
        pendingFacultyCount: res.data.pendingFacultyCount || 0
      });
      setMonthlyTrend(res.data.appointmentsLast30Days || []);
      setDeptStats(res.data.departmentStats || []);
      setTopFaculty(res.data.topFacultyByBookings || []);
      setRecentAppointments(res.data.recentAppointments || []);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Refetch stats when page regains focus (e.g. after approving faculty)
    const handleVisibility = () => {
      if (!document.hidden) fetchStats();
    };
    
    // Listen for custom event from ManageFaculty
    const handleStatsRefresh = () => {
      fetchStats();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("admin-stats-refresh", handleStatsRefresh);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("admin-stats-refresh", handleStatsRefresh);
    };
  }, [fetchStats]);

  const stats = [
    { label: "Total Students", value: summary.totalStudents, icon: <GraduationCap className="h-5 w-5 text-primary" />, bg: "bg-primary/10" },
    { label: "Total Faculty", value: summary.totalFaculty, icon: <Users className="h-5 w-5 text-secondary" />, bg: "bg-secondary/10" },
    { label: "Total Bookings", value: summary.totalAppointments, icon: <CalendarCheck className="h-5 w-5 text-info" />, bg: "bg-info/10" },
    { label: "Pending Today", value: summary.pendingToday, icon: <Clock className="h-5 w-5 text-warning" />, bg: "bg-warning/10" },
    { label: "Completed (Month)", value: summary.completedThisMonth, icon: <CheckCircle className="h-5 w-5 text-success" />, bg: "bg-success/10" },
    { label: "Rejected (Month)", value: summary.rejectedThisMonth, icon: <XCircle className="h-5 w-5 text-destructive" />, bg: "bg-destructive/10" },
  ];

  return (
    <div className="page-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Admin Dashboard</h2>
      </div>

      {summary.pendingFacultyCount > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-warning/10 border border-warning/20 p-4 text-warning-foreground">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-warning" />
            <span className="text-sm font-medium">There are {summary.pendingFacultyCount} faculty members waiting for approval.</span>
          </div>
          <Link to="/admin/faculty" className="text-sm font-semibold hover:underline text-warning">Review Faculty →</Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Line chart - monthly trend */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Appointment Trends (30 days)</h3>
          {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" vertical={false} />
                <XAxis dataKey="shortLabel" tick={{ fontSize: 10 }} stroke="hsl(215 16% 47%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(215 16% 47%)" allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" name="Bookings" stroke="hsl(239 84% 67%)" strokeWidth={3} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground py-20 text-center">No data yet</p>}
        </div>

        {/* Pie chart - by department */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Appointments by Department</h3>
          {deptStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={deptStats} cx="50%" cy="50%" outerRadius={90} dataKey="count" nameKey="department"
                  label={({ department, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {deptStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n, p) => [v, p.payload.department]} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground py-20 text-center">No data yet</p>}
        </div>

        {/* Bar chart - top faculty */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Top Faculty by Bookings</h3>
          {topFaculty.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topFaculty} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(215 16% 47%)" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10 }} stroke="hsl(215 16% 47%)" axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="bookings" name="Appointments" fill="hsl(263 70% 58%)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground py-20 text-center">No data yet</p>}
        </div>

        {/* Recent activity */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
            {recentAppointments.map((a) => (
              <div key={a._id} className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm hover:bg-muted/30 transition-colors">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {a.studentId?.userId?.name || "Student"} → {a.facultyId?.userId?.name || "Faculty"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(a.date)} • {formatTimeSlot(a.timeSlot)}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
            {recentAppointments.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No appointments yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;