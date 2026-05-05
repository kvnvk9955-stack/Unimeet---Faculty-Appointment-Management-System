import React, { useState } from "react";
import { useAppointments } from "@/context/AppointmentContext";
import StatusBadge from "@/components/StatusBadge";
import ConfirmModal from "@/components/ConfirmModal";
import EmptyState from "@/components/EmptyState";
import { formatDate, formatTimeSlot } from "@/utils/helpers";
import { Download, Calendar, Eye, X } from "lucide-react";
import { toast } from "sonner";


const AllAppointments = () => {
  const { appointments, updateAppointmentStatus } = useAppointments();
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [cancelId, setCancelId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [detail, setDetail] = useState(null);

  const filtered = appointments.filter((a) => {
    const filterDept = a.facultyId?.department || "Unknown";
    return (statusFilter === "all" || a.status === statusFilter) && (deptFilter === "all" || filterDept === deptFilter);
  });

  const csvEscape = (val) => {
    const str = String(val ?? "");
    return '"' + str.replace(/"/g, '""') + '"';
  };

  const exportCSV = () => {
    try {
      const headers = "Student,Faculty,Department,Date,Time,Status,Purpose\n";
      const rows = filtered.map((a) => {
        return [
          csvEscape(a.studentId?.userId?.name || "Unknown"),
          csvEscape(a.facultyId?.userId?.name || "Unknown"),
          csvEscape(a.facultyId?.department || "Unknown"),
          csvEscape(formatDate(a.date)),
          csvEscape(formatTimeSlot(a.timeSlot) || ""),
          csvEscape(a.status),
          csvEscape(a.purpose),
        ].join(",");
      }).join("\n");
      const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "appointments.csv";
      link.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported");
    } catch (e) {
      toast.error("Failed to export CSV");
    }
  };

  const handleForceCancel = () => {
    if (cancelId) {
      updateAppointmentStatus(cancelId, "cancelled");
      toast.success("Appointment force-cancelled");
      setCancelId(null);setCancelReason("");
    }
  };

  return (
    <div className="page-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">All Appointments</h2>
        <button onClick={exportCSV} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="all">All Departments</option>
          <option>Computer Science</option>
          <option>Electronics & Communication</option>
          <option>Mechanical Engineering</option>
          <option>MBA</option>
        </select>
      </div>

      {filtered.length === 0 ?
      <EmptyState title="No appointments" description="No appointments match your filters" icon={<Calendar className="h-8 w-8 text-muted-foreground" />} /> :

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Student</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Faculty</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Department</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Time</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) =>
            <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{a.studentId?.userId?.name || "Unknown"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.facultyId?.userId?.name || "Unknown"}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{a.facultyId?.department || ""}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(a.date)}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{formatTimeSlot(a.timeSlot) || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setDetail(a)} className="rounded p-1 text-muted-foreground hover:bg-muted"><Eye className="h-4 w-4" /></button>
                      {a.status !== "cancelled" && a.status !== "completed" &&
                  <button onClick={() => setCancelId(a.id)} className="rounded p-1 text-destructive hover:bg-destructive/10"><X className="h-4 w-4" /></button>
                  }
                    </div>
                  </td>
                </tr>
            )}
            </tbody>
          </table>
        </div>
      }

      <ConfirmModal open={!!cancelId} title="Force Cancel Appointment" message="This will cancel the appointment regardless of its current status." confirmLabel="Force Cancel" onConfirm={handleForceCancel} onCancel={() => {setCancelId(null);setCancelReason("");}}>
        <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Reason for cancellation" className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" rows={2} />
      </ConfirmModal>

      {detail &&
      <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setDetail(null)}>
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
          <div className="relative z-10 mx-4 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg page-fade-in" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDetail(null)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            <h3 className="text-lg font-semibold text-foreground">Appointment Details</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Student</span><span className="font-medium text-foreground">{detail.studentId?.userId?.name || "Unknown"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Faculty</span><span className="text-foreground">{detail.facultyId?.userId?.name || "Unknown"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span className="text-foreground">{detail.facultyId?.department || ""}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="text-foreground">{formatDate(detail.date)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="text-foreground">{formatTimeSlot(detail.timeSlot) || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={detail.status} /></div>
              <div><span className="text-muted-foreground">Purpose</span><p className="mt-1 text-foreground">{detail.purpose}</p></div>
            </div>
          </div>
        </div>
      }
    </div>);

};

export default AllAppointments;