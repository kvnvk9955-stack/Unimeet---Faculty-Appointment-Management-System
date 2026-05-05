import React, { useState } from "react";
import { useAppointments } from "@/context/AppointmentContext";
import StatusBadge from "@/components/StatusBadge";
import ConfirmModal from "@/components/ConfirmModal";
import EmptyState from "@/components/EmptyState";
import RescheduleStudentModal from "@/components/RescheduleStudentModal";
import { formatDate, truncate, formatTimeSlot } from "@/utils/helpers";
import { Calendar, Eye, X as XIcon, RefreshCw, Download, Check, XCircle } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const tabs = ["all", "pending", "approved", "rejected", "cancelled", "completed", "missed", "rescheduled"];

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

const MyAppointments = () => {
  const { appointments, updateAppointmentStatus, fetchAppointments, rescheduleConfirmAction, rescheduleDeclineAction } = useAppointments();
  const [tab, setTab] = useState("all");
  const [cancelId, setCancelId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);

  // Faculty-suggested reschedules needing student response
  const pendingReschedules = appointments.filter(a => a.status === 'rescheduled' && a.rescheduleStatus === 'pending_student');

  const handleRescheduleConfirm = async (id) => {
    setConfirmingId(id);
    const res = await rescheduleConfirmAction(id);
    if (res?.success) toast.success("Reschedule confirmed! New appointment created.");
    else toast.error(res?.message || "Failed to confirm");
    setConfirmingId(null);
  };

  const handleRescheduleDecline = async (id) => {
    setConfirmingId(id);
    const res = await rescheduleDeclineAction(id);
    if (res?.success) toast.success("Reschedule declined. You can book a new slot.");
    else toast.error(res?.message || "Failed to decline");
    setConfirmingId(null);
  };

  // appointments from context are already scoped to the logged-in student via the backend
  const filtered = tab === "all" ? appointments : appointments.filter((a) => a.status === tab);

  const handleCancel = async () => {
    if (!cancelId) return;
    setCancelling(true);
    const res = await updateAppointmentStatus(cancelId, "cancelled");
    if (res?.success) {
      toast.success("Appointment cancelled");
      fetchAppointments();
    } else {
      toast.error(res?.message || "Failed to cancel appointment");
    }
    setCancelId(null);
    setCancelling(false);
  };

  const getFacultyName = (a) => a.facultyId?.userId?.name || "Faculty";
  const getFacultyDept = (a) => a.facultyId?.department || "—";

  const exportPDF = () => {
    if (isExporting || filtered.length === 0) return;
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      doc.text("My Appointments", 14, 15);
      
      const tableData = filtered.map(a => [
        getFacultyName(a),
        getFacultyDept(a),
        formatDate(a.date),
        formatTimeSlot(a.timeSlot) || "—",
        a.status.toUpperCase()
      ]);

      autoTable(doc, {
        startY: 25,
        head: [["Faculty", "Department", "Date", "Time", "Status"]],
        body: tableData,
      });

      doc.save(`Appointments_${tab}.pdf`);
      toast.success("PDF Downloaded");
    } catch (e) {
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="page-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">My Appointments</h2>
        <button onClick={exportPDF} disabled={isExporting || filtered.length === 0} className={`flex items-center gap-2 text-sm font-medium transition ${isExporting || filtered.length === 0 ? "opacity-50 cursor-not-allowed text-muted-foreground" : "text-primary hover:underline"}`}>
          <Download className="h-4 w-4" /> {isExporting ? "Exporting..." : "Export"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No appointments" description={`No ${tab} appointments found`} icon={<Calendar className="h-8 w-8 text-muted-foreground" />} />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden rounded-xl border border-border bg-card shadow-sm sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Faculty</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Department</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Purpose</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{getFacultyName(a)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{getFacultyDept(a)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(a.date)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatTimeSlot(a.timeSlot) || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{truncate(a.purpose, 30)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} />
                      <div className="mt-1 text-[10px] uppercase font-semibold text-muted-foreground">{a.mode || 'offline'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 items-center flex-wrap">
                        <button onClick={() => setDetail(a)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><Eye className="h-4 w-4" /></button>
                        {(a.status === "pending" || a.status === "approved") && new Date(a.date) >= new Date() && (
                          <button onClick={() => setCancelId(a._id)} className="rounded p-1 text-destructive hover:bg-destructive/10"><XIcon className="h-4 w-4" /></button>
                        )}
                        {(a.status === "pending" || a.status === "approved") && new Date(a.date) >= new Date() && (
                          isWithin2Hours(a) ? (
                            <span className="rounded border border-muted bg-muted px-2 py-1 text-[10px] text-muted-foreground cursor-not-allowed" title="Cannot reschedule within 2 hours of start">Reschedule</span>
                          ) : (
                            <button onClick={() => setRescheduleAppt(a)} className="rounded border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-xs font-medium text-violet-600 hover:bg-violet-500/20 flex items-center gap-1"><RefreshCw className="h-3 w-3" />Reschedule</button>
                          )
                        )}
                        {a.status === "approved" && a.mode === "online" && (a.meetingLink ? <a href={a.meetingLink} target="_blank" rel="noreferrer" className="rounded border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20">Join</a> : <span className="rounded border border-warning/20 bg-warning/10 px-2 py-1 text-[10px] font-medium text-warning text-nowrap">Wait for Link</span>)}
                        {a.status === "approved" && (!a.mode || a.mode === "offline") && <span className="rounded border border-border bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">Offline</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 sm:hidden">
            {filtered.map((a) => (
              <div key={a._id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{getFacultyName(a)}</p>
                    <p className="text-xs text-muted-foreground">{getFacultyDept(a)}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={a.status} />
                    <div className="mt-1 text-[10px] uppercase font-semibold text-muted-foreground">{a.mode || 'offline'}</div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{formatDate(a.date)} • {formatTimeSlot(a.timeSlot) || "—"}</p>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{a.purpose}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => setDetail(a)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">View Details</button>
                  {(a.status === "pending" || a.status === "approved") && new Date(a.date) >= new Date() && (
                    <button onClick={() => setCancelId(a._id)} className="rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10">Cancel</button>
                  )}
                  {(a.status === "pending" || a.status === "approved") && new Date(a.date) >= new Date() && !isWithin2Hours(a) && (
                    <button onClick={() => setRescheduleAppt(a)} className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-600 hover:bg-violet-500/20 flex items-center gap-1"><RefreshCw className="h-3 w-3" />Reschedule</button>
                  )}
                  {a.status === "approved" && a.mode === "online" && (a.meetingLink ? <a href={a.meetingLink} target="_blank" rel="noreferrer" className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20">Join Meeting</a> : <span className="rounded-lg border border-warning/20 bg-warning/10 px-3 py-1.5 text-[10px] font-medium text-warning max-w-[100px] text-center">Waiting For Link</span>)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Faculty-suggested reschedule cards */}
      {pendingReschedules.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Action Required — Faculty Reschedule Suggestions</h3>
          {pendingReschedules.map(a => (
            <div key={a._id + '-resched'} className="rounded-xl border-2 border-amber-500/40 bg-amber-500/5 p-4 shadow-sm page-fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{a.facultyId?.userId?.name || 'Faculty'} suggested a new time</p>
                  <p className="text-xs text-muted-foreground mt-1">Original: {formatDate(a.date)} • {formatTimeSlot(a.timeSlot)}</p>
                  {a.rescheduleMessage && <p className="text-sm text-foreground mt-1 italic">"{a.rescheduleMessage}"</p>}
                </div>
                <StatusBadge status="rescheduled" />
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => handleRescheduleConfirm(a._id)} disabled={!!confirmingId}
                  className="rounded-lg bg-success px-4 py-1.5 text-xs font-semibold text-success-foreground hover:bg-success/90 disabled:opacity-50 flex items-center gap-1">
                  <Check className="h-3 w-3" />Confirm New Time
                </button>
                <button onClick={() => handleRescheduleDecline(a._id)} disabled={!!confirmingId}
                  className="rounded-lg border border-destructive/30 px-4 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!cancelId}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment? This action cannot be undone."
        confirmLabel={cancelling ? "Cancelling…" : "Cancel Appointment"}
        onConfirm={handleCancel}
        onCancel={() => setCancelId(null)} />

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setDetail(null)}>
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
          <div className="relative z-10 mx-4 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg page-fade-in" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDetail(null)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><XIcon className="h-4 w-4" /></button>
            <h3 className="text-lg font-semibold text-foreground">Appointment Details</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Faculty</span><span className="font-medium text-foreground">{getFacultyName(detail)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span className="text-foreground">{getFacultyDept(detail)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="text-foreground">{formatDate(detail.date)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="text-foreground">{formatTimeSlot(detail.timeSlot) || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Mode</span><span className="text-foreground uppercase tracking-wider font-semibold text-xs mt-0.5">{detail.mode || 'offline'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={detail.status} /></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Booked On</span><span className="text-foreground">{formatDate(detail.createdAt)}</span></div>
              {detail.mode === 'online' && (
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Meeting Link</span>
                {detail.meetingLink ? <a href={detail.meetingLink} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs">Join Here</a> : <span className="text-warning text-xs font-medium bg-warning/10 px-2 py-1 rounded">Pending link from faculty</span>}
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Purpose</span>
                <p className="mt-1 text-foreground">{detail.purpose}</p>
              </div>
              {detail.rejectionReason && (
                <div>
                  <span className="text-muted-foreground">Rejection Reason</span>
                  <p className="mt-1 text-destructive">{detail.rejectionReason}</p>
                </div>
              )}
            </div>
            <div className="mt-6">
              <p className="text-sm font-medium text-foreground mb-3">Status Timeline</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-sm text-foreground">Requested</span>
                </div>
                <div className="ml-1.5 h-4 border-l border-border" />
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${detail.status === "rejected" ? "bg-destructive" : detail.status === "pending" ? "bg-muted" : "bg-success"}`} />
                  <span className="text-sm text-foreground">{detail.status === "rejected" ? "Rejected" : detail.status === "pending" ? "Awaiting Approval" : "Approved"}</span>
                </div>
                {detail.status === "completed" && (
                  <>
                    <div className="ml-1.5 h-4 border-l border-border" />
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-primary" />
                      <span className="text-sm text-foreground">Meeting Completed</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <RescheduleStudentModal open={!!rescheduleAppt} appointment={rescheduleAppt} onClose={() => setRescheduleAppt(null)} />
    </div>
  );
};

export default MyAppointments;