import React, { useState } from "react";
import { useAppointments } from "@/context/AppointmentContext";
import { Eye, X as XIcon, Calendar, Download, RefreshCw } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import StatusBadge from "@/components/StatusBadge";
import ConfirmModal from "@/components/ConfirmModal";
import EmptyState from "@/components/EmptyState";
import RescheduleFacultyModal from "@/components/RescheduleFacultyModal";
import { formatDate, truncate, formatTimeSlot } from "@/utils/helpers";
import { toast } from "sonner";

const tabs = ["pending", "approved", "rejected", "completed", "missed", "rescheduled", "all"];

// Check if appointment starts within 2 hours
const isWithin2Hours = (appt) => {
  if (!appt?.date || !appt?.timeSlot) return false;
  try {
    const d = new Date(appt.date);
    const timeStr = appt.timeSlot.split('-')[0].trim();
    let hours, minutes;
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      const [time, mod] = timeStr.split(' ');
      [hours, minutes] = time.split(':').map(Number);
      if (mod === 'PM' && hours !== 12) hours += 12;
      if (mod === 'AM' && hours === 12) hours = 0;
    } else {
      [hours, minutes] = timeStr.split(':').map(Number);
    }
    d.setHours(hours, minutes, 0, 0);
    return (d.getTime() - Date.now()) < 2 * 60 * 60 * 1000;
  } catch { return false; }
};

const FacultyRequests = () => {
  const { appointments, updateAppointmentStatus, addMeetingLink, fetchAppointments } = useAppointments();
  const [tab, setTab] = useState("pending");
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approveId, setApproveId] = useState(null);
  const [linkAppointmentId, setLinkAppointmentId] = useState(null);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [rescheduleAppt, setRescheduleAppt] = useState(null);

  // appointments from context are already scoped to the logged-in faculty via the backend
  const filtered = tab === "all" ? appointments : appointments.filter((a) => a.status === tab);
  const pendingCount = appointments.filter((a) => a.status === "pending").length;

  const confirmApprove = async () => {
    if (!approveId) return;
    setLoading(true);
    const res = await updateAppointmentStatus(approveId, "approved");
    if (res?.success) {
      toast.success("Appointment approved");
      fetchAppointments();
    } else {
      toast.error(res?.message || "Failed to approve");
    }
    setApproveId(null);
    setLoading(false);
  };

  const confirmAddLink = async () => {
    if (!linkAppointmentId) return;
    if (!meetingUrl || !meetingUrl.startsWith('http')) {
      toast.error("Please enter a valid URL starting with http/https");
      return;
    }
    setLoading(true);
    const res = await addMeetingLink(linkAppointmentId, meetingUrl);
    if (res?.success) {
      toast.success("Meeting link added and sent to student");
      fetchAppointments();
    } else {
      toast.error(res?.message || "Failed to add link");
    }
    setLinkAppointmentId(null);
    setMeetingUrl("");
    setLoading(false);
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) { toast.error("Reason required"); return; }
    setLoading(true);
    const res = await updateAppointmentStatus(rejectId, "rejected", rejectReason);
    if (res?.success) { toast.success("Request rejected"); fetchAppointments(); }
    else toast.error("Failed to reject");
    setRejectId(null); setRejectReason(""); setLoading(false);
  };

  const exportPDF = () => {
    if (isExporting || filtered.length === 0) return;
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      doc.text("Faculty Appointment Requests", 14, 15);
      
      const getStudentName = (a) => a.studentId?.userId?.name || "Student";
      const getStudentEmail = (a) => a.studentId?.userId?.email || "—";

      const tableData = filtered.map(a => [
        getStudentName(a),
        getStudentEmail(a),
        formatDate(a.date),
        formatTimeSlot(a.timeSlot) || "—",
        a.mode?.toUpperCase() || "OFFLINE",
        a.status.toUpperCase()
      ]);

      autoTable(doc, {
        startY: 25,
        head: [["Student", "Email", "Date", "Time", "Mode", "Status"]],
        body: tableData,
      });

      doc.save(`Requests_${tab}.pdf`);
      toast.success("PDF Downloaded");
    } catch (e) {
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const handleMarkStatus = async (id, status) => {
    setLoading(true);
    const res = await updateAppointmentStatus(id, status);
    if (res?.success) {
      toast.success(`Appointment marked as ${status}`);
      fetchAppointments();
    } else {
      toast.error(res?.message || `Failed to mark as ${status}`);
    }
    setLoading(false);
  };

  return (
    <div className="page-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Appointment Requests</h2>
        <button onClick={exportPDF} disabled={isExporting || filtered.length === 0} className={`flex items-center gap-2 text-sm font-medium transition ${isExporting || filtered.length === 0 ? "opacity-50 cursor-not-allowed text-muted-foreground" : "text-primary hover:underline"}`}>
          <Download className="h-4 w-4" /> {isExporting ? "Exporting..." : "Export"}
        </button>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t} {t === "pending" && `(${pendingCount})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No requests" description={`No ${tab} requests found`} icon={<Calendar className="h-8 w-8 text-muted-foreground" />} />
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Student</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Time</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Purpose</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{a.studentId?.userId?.name || "Student"}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{a.studentId?.userId?.email || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(a.date)}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{formatTimeSlot(a.timeSlot) || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{truncate(a.purpose, 30)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} />
                    <div className="mt-1 text-[10px] uppercase font-semibold text-muted-foreground">{a.mode || 'offline'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 items-center flex-wrap">
                      <button onClick={() => setDetail(a)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="View Details">
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {a.status === "pending" && (
                        <div className="flex gap-1">
                          <button onClick={() => setApproveId(a._id)} disabled={loading} className="rounded-lg bg-success px-3 py-1 text-xs font-medium text-success-foreground hover:bg-success/90 disabled:opacity-50">Approve</button>
                          <button onClick={() => setRejectId(a._id)} disabled={loading} className="rounded-lg bg-destructive px-3 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50">Reject</button>
                        </div>
                      )}
                      {(a.status === "pending" || a.status === "approved") && new Date(a.date) >= new Date() && (
                        isWithin2Hours(a) ? (
                          <span className="rounded border border-muted bg-muted px-2 py-1 text-[10px] text-muted-foreground cursor-not-allowed" title="Cannot reschedule within 2 hours of start">Reschedule</span>
                        ) : (
                          <button onClick={() => setRescheduleAppt(a)} className="rounded border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-xs font-medium text-violet-600 hover:bg-violet-500/20 flex items-center gap-1"><RefreshCw className="h-3 w-3" />Reschedule</button>
                        )
                      )}
                    {a.status === "approved" && (
                      <div className="flex flex-col gap-1 sm:flex-row items-start sm:items-center">
                        {a.mode === 'online' && !a.meetingLink && (
                          <button onClick={() => setLinkAppointmentId(a._id)} disabled={loading} className="rounded border border-primary/40 bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20 sm:mr-2">Add Link</button>
                        )}
                        {a.meetingLink && <a href={a.meetingLink} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline sm:mr-2">Join Meeting</a>}
                        <button onClick={() => handleMarkStatus(a._id, "completed")} disabled={loading} className="rounded border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20">Mark Complete</button>
                        <button onClick={() => handleMarkStatus(a._id, "missed")} disabled={loading} className="rounded border border-destructive/20 bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/20 mt-1 sm:mt-0">Mark Missed</button>
                      </div>
                    )}
                    {a.status === "completed" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">✓ Done</span>
                    )}
                    {a.status === "rejected" && (
                      <span className="text-xs text-muted-foreground italic" title={a.rejectionReason || "No reason"}>
                        {a.rejectionReason ? truncate(a.rejectionReason, 25) : "No reason given"}
                      </span>
                    )}
                    {a.status === "missed" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">⚠ Missed</span>
                    )}
                    {a.status === "cancelled" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">Cancelled</span>
                    )}
                    {a.status === "rescheduled" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-600">↻ Rescheduled</span>
                    )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={!!approveId}
        title="Approve Appointment request"
        message="Are you sure you want to approve this appointment? For online meetings, you will need to provide a meeting link separately."
        confirmLabel="Approve"
        onConfirm={confirmApprove}
        onCancel={() => setApproveId(null)} />

      <ConfirmModal
        open={!!linkAppointmentId}
        title="Add Meeting Link"
        message="Provide the meeting link (Zoom, Google Meet, etc.) for this approved online appointment. We will email the student."
        confirmLabel="Add Link"
        onConfirm={confirmAddLink}
        onCancel={() => { setLinkAppointmentId(null); setMeetingUrl(""); }}>
        <input
          type="url"
          value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)}
          placeholder="https://meet.google.com/xxx-yyyy-zzz"
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </ConfirmModal>

      <ConfirmModal
        open={!!rejectId}
        title="Reject Appointment"
        message="Are you sure you want to reject this appointment?"
        confirmLabel="Reject"
        onConfirm={handleReject}
        onCancel={() => { setRejectId(null); setRejectReason(""); }}>
        <textarea
          value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Reason for rejection (optional)"
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          rows={3} />
      </ConfirmModal>

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setDetail(null)}>
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
          <div className="relative z-10 mx-4 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg page-fade-in" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDetail(null)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><XIcon className="h-4 w-4" /></button>
            <h3 className="text-lg font-semibold text-foreground">Appointment Details</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Student</span><span className="font-medium text-foreground">{detail.studentId?.userId?.name || "Student"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="text-foreground">{detail.studentId?.userId?.email || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="text-foreground">{formatDate(detail.date)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="text-foreground">{formatTimeSlot(detail.timeSlot) || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={detail.status} /></div>
              {detail.meetingLink && (
                <div className="flex justify-between"><span className="text-muted-foreground">Meeting Link</span><a href={detail.meetingLink} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs">Join Meeting</a></div>
              )}
              <div>
                <span className="text-muted-foreground">Purpose</span>
                <p className="mt-1 text-foreground whitespace-pre-wrap">{detail.purpose}</p>
              </div>
              {detail.rejectionReason && (
                <div>
                  <span className="text-muted-foreground">Rejection Reason</span>
                  <p className="mt-1 text-destructive whitespace-pre-wrap">{detail.rejectionReason}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setDetail(null)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Close</button>
            </div>
          </div>
        </div>
      )}

      <RescheduleFacultyModal open={!!rescheduleAppt} appointment={rescheduleAppt} onClose={() => setRescheduleAppt(null)} />
    </div>
  );
};

export default FacultyRequests;