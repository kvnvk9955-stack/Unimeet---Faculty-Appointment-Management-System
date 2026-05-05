import React, { useState, useEffect } from "react";
import { apiClient } from "@/services/api";
import { format, addDays } from "date-fns";
import { X, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useAppointments } from "@/context/AppointmentContext";

const to12h = (time24) => {
  if (!time24 || !time24.includes(":")) return time24 || "";
  let [hours, minutes] = time24.split(":");
  const h = parseInt(hours, 10);
  const modifier = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${minutes} ${modifier}`;
};

const RescheduleStudentModal = ({ open, appointment, onClose }) => {
  const { rescheduleStudent, fetchAppointments } = useAppointments();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [purpose, setPurpose] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const facultyId = appointment?.facultyId?._id || appointment?.facultyId;
  const facultyName = appointment?.facultyId?.userId?.name || "Faculty";

  useEffect(() => {
    if (!open || !facultyId) return;
    setPurpose(appointment?.purpose || "");
    setSelectedSlot(null);
  }, [open, facultyId, appointment]);

  useEffect(() => {
    if (!open || !facultyId) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot(null);
      // Use the same endpoint as FacultyProfile for fetching available slots
      const res = await apiClient.get(`/faculty/${facultyId}/slots?date=${selectedDate}`);
      if (res.success) setSlots(res.data || []);
      else setSlots([]);
      setLoadingSlots(false);
    };
    fetchSlots();
  }, [selectedDate, open, facultyId]);

  const handleConfirm = async () => {
    if (!selectedSlot) { toast.error("Please select a time slot"); return; }
    if (!purpose.trim() || purpose.trim().length < 10) { toast.error("Purpose must be at least 10 characters"); return; }
    setSubmitting(true);
    const res = await rescheduleStudent(appointment._id, selectedSlot, purpose.trim());
    if (res?.success) {
      toast.success("Appointment rescheduled successfully!");
      fetchAppointments();
      onClose();
    } else {
      toast.error(res?.message || "Failed to reschedule. The slot may have been taken.");
    }
    setSubmitting(false);
  };

  if (!open) return null;

  const dates = Array.from({ length: 7 }, (_, i) => format(addDays(new Date(), i), "yyyy-MM-dd"));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
      <div className="relative z-10 mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg page-fade-in" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        <h3 className="text-lg font-semibold text-foreground">Reschedule Appointment</h3>
        <p className="mt-1 text-sm text-muted-foreground">Choose a new time slot with <strong>{facultyName}</strong></p>

        {/* Date picker */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {dates.map((d) => (
            <button key={d} onClick={() => setSelectedDate(d)}
              className={`flex min-w-[64px] flex-col items-center rounded-lg border px-2 py-2 text-xs transition-colors ${d === selectedDate ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted"}`}>
              <span className="font-medium">{format(new Date(d + "T00:00:00"), "EEE")}</span>
              <span className="text-base font-bold">{format(new Date(d + "T00:00:00"), "dd")}</span>
              <span>{format(new Date(d + "T00:00:00"), "MMM")}</span>
            </button>
          ))}
        </div>

        {/* Slots */}
        <div className="mt-4">
          {loadingSlots ? (
            <div className="flex flex-wrap gap-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-8 w-24 animate-pulse rounded-lg bg-muted" />)}
            </div>
          ) : slots.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => {
                const isSelected = s._id === selectedSlot;
                return (
                  <button key={s._id} disabled={s.status !== "available"}
                    onClick={() => setSelectedSlot(s._id)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                      s.status !== "available" ? "border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                      : isSelected ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-success/40 bg-success/10 text-success hover:bg-success/20"
                    }`}>
                    <div>{to12h(s.startTime)}</div>
                    <div className="text-[10px] opacity-75">to {to12h(s.endTime)}</div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No available slots for this date.</p>
          )}
        </div>

        {/* Purpose */}
        {selectedSlot && (
          <div className="mt-4 page-fade-in">
            <label className="block text-sm font-medium text-foreground">Purpose <span className="text-destructive">*</span></label>
            <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} maxLength={500} rows={3}
              className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              placeholder="Briefly describe the purpose…" />
            <p className={`mt-1 text-xs text-right ${purpose.length < 10 && purpose.length > 0 ? "text-destructive" : "text-muted-foreground"}`}>
              {purpose.length}/500
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex gap-3 justify-end">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Cancel</button>
          <button onClick={handleConfirm} disabled={submitting || !selectedSlot || purpose.trim().length < 10}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {submitting ? "Rescheduling…" : "Confirm Reschedule"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RescheduleStudentModal;
