import React, { useState, useEffect } from "react";
import { apiClient } from "@/services/api";
import { format, addDays } from "date-fns";
import { X } from "lucide-react";
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

const RescheduleFacultyModal = ({ open, appointment, onClose }) => {
  const { rescheduleFaculty, fetchAppointments } = useAppointments();
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const studentName = appointment?.studentId?.userId?.name || "Student";

  useEffect(() => {
    if (!open) return;
    setSelectedSlot(null);
    setMessage("");
    const fetchMySlots = async () => {
      setLoading(true);
      const res = await apiClient.get("/slots/my?limit=200");
      if (res.success) {
        // Filter available slots for next 14 days
        const now = new Date();
        const cutoff = addDays(now, 14);
        const available = (res.data || []).filter(s => {
          if (s.status !== "available") return false;
          const slotDate = new Date(s.date);
          return slotDate >= new Date(now.toDateString()) && slotDate <= cutoff;
        });
        setSlots(available);
      } else {
        setSlots([]);
      }
      setLoading(false);
    };
    fetchMySlots();
  }, [open]);

  const handleConfirm = async () => {
    if (!selectedSlot) { toast.error("Please select a time slot"); return; }
    setSubmitting(true);
    const res = await rescheduleFaculty(appointment._id, selectedSlot, message.trim());
    if (res?.success) {
      toast.success("Reschedule sent! Student will be notified.");
      fetchAppointments();
      onClose();
    } else {
      toast.error(res?.message || "Failed to reschedule");
    }
    setSubmitting(false);
  };

  if (!open) return null;

  // Group slots by date
  const grouped = {};
  slots.forEach(s => {
    const dateKey = s.date?.slice(0, 10);
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(s);
  });
  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
      <div className="relative z-10 mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg page-fade-in" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        <h3 className="text-lg font-semibold text-foreground">Reschedule Appointment</h3>
        <p className="mt-1 text-sm text-muted-foreground">Suggest a new time for <strong>{studentName}</strong>. The slot will be reserved for 24 hours.</p>

        {/* Slots grouped by date */}
        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="flex flex-wrap gap-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-8 w-24 animate-pulse rounded-lg bg-muted" />)}
            </div>
          ) : sortedDates.length > 0 ? (
            sortedDates.map(dateKey => (
              <div key={dateKey}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {format(new Date(dateKey + "T00:00:00"), "EEE, dd MMM yyyy")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {grouped[dateKey].map(s => {
                    const isSelected = s._id === selectedSlot;
                    return (
                      <button key={s._id} onClick={() => setSelectedSlot(s._id)}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                          isSelected ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-success/40 bg-success/10 text-success hover:bg-success/20"
                        }`}>
                        <div>{to12h(s.startTime)}</div>
                        <div className="text-[10px] opacity-75">to {to12h(s.endTime)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No available slots in the next 14 days. Create new slots first.</p>
          )}
        </div>

        {/* Optional message */}
        {selectedSlot && (
          <div className="mt-4 page-fade-in">
            <label className="block text-sm font-medium text-foreground">Message to Student (optional)</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} rows={2}
              className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              placeholder="e.g. I have a meeting conflict, this time works better…" />
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex gap-3 justify-end">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Cancel</button>
          <button onClick={handleConfirm} disabled={submitting || !selectedSlot}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {submitting ? "Sending…" : "Suggest New Time"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RescheduleFacultyModal;
