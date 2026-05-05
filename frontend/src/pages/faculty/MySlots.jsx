import React, { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/services/api";
import { format, addDays, startOfWeek } from "date-fns";
import { Plus, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { isPastDateTime } from "@/utils/dateHelpers";

const TIME_OPTIONS = [
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM",
];

// Convert 12h "09:00 AM" -> 24h "09:00" for the backend
const to24h = (time12) => {
  const [time, modifier] = time12.split(" ");
  let [hours, minutes] = time.split(":");
  if (hours === "12") hours = "00";
  if (modifier === "PM") hours = String(parseInt(hours, 10) + 12);
  return `${hours.padStart(2, "0")}:${minutes}`;
};

// Convert 24h "09:00" -> "09:00 AM" for display
const to12h = (time24) => {
  if (!time24 || !time24.includes(":")) return time24;
  let [hours, minutes] = time24.split(":");
  const h = parseInt(hours, 10);
  const modifier = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${minutes} ${modifier}`;
};

const MySlots = () => {
  const [slots, setSlots] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newSlot, setNewSlot] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00 AM",
    endTime: "09:30 AM",
    duration: 30,
    mode: "offline"
  });
  const [adding, setAdding] = useState(false);

  const fetchSlots = useCallback(async () => {
    const res = await apiClient.get("/slots/my");
    if (res.success) setSlots(res.data || []);
  }, []);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const handleAdd = async () => {
    const start24 = to24h(newSlot.startTime);
    const end24 = to24h(newSlot.endTime);
    if (start24 >= end24) {
      toast.error("Start time must be before end time");
      return;
    }
    setAdding(true);
    try {
      const res = await apiClient.post("/slots", {
        date: newSlot.date,
        startTime: start24,
        endTime: end24,
        duration: newSlot.duration,
        mode: newSlot.mode
      });
      if (res.success) {
        await fetchSlots(); // refresh to get accurate data
        setShowModal(false);
        toast.success("Slot added successfully");
      } else {
        toast.error(res.message || "Failed to add slot");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    const res = await apiClient.delete(`/slots/${id}`);
    if (res.success) {
      setSlots((prev) => prev.filter((s) => s._id !== id));
      toast.success("Slot deleted");
    } else {
      toast.error(res.message || "Failed to delete slot");
    }
  };

  return (
    <div className="page-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">My Slots</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> Add Slot
        </button>
      </div>

      {/* Week view */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-7">
        {weekDays.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const daySlots = slots.filter((s) => s.date?.slice(0, 10) === dateStr && !isPastDateTime(s.date, s.startTime));

          return (
            <div key={dateStr} className="rounded-xl border border-border bg-card p-3 shadow-sm">
              <p className="text-xs font-medium text-muted-foreground">{format(day, "EEE")}</p>
              <p className="text-lg font-bold text-foreground">{format(day, "dd")}</p>
              <div className="mt-2 space-y-1">
                {daySlots.length > 0 ? daySlots.map((s) => (
                  <div key={s._id} className={`group flex items-center justify-between rounded-md px-2 py-1 text-xs font-medium ${s.status === "booked" ? "bg-primary/10 text-primary" : "bg-success/10 text-success"}`}>
                    <div className="flex items-center gap-1.5">
                      <span>{to12h(s.startTime)} - {to12h(s.endTime)}</span>
                      <span className="text-[10px] uppercase opacity-70 border rounded px-1">{s.mode || 'offline'}</span>
                    </div>
                    {s.status === "available" && (
                      <button onClick={() => handleDelete(s._id)} className="hidden group-hover:block">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )) : <p className="text-xs text-muted-foreground">No slots</p>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><div className="h-3 w-3 rounded bg-success/30" />Available</span>
        <span className="flex items-center gap-1"><div className="h-3 w-3 rounded bg-primary/30" />Booked</span>
      </div>

      {/* Add modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
          <div className="relative z-10 mx-4 w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg page-fade-in" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            <h3 className="text-lg font-semibold text-foreground">Add New Slot</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">Date</label>
                <input type="date" value={newSlot.date} min={format(new Date(), "yyyy-MM-dd")}
                  onChange={(e) => setNewSlot((p) => ({ ...p, date: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Mode</label>
                <div className="mt-1 flex gap-2">
                  <button onClick={() => setNewSlot(p => ({ ...p, mode: 'offline' }))} className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${newSlot.mode === 'offline' ? 'bg-primary/10 border-primary text-primary' : 'border-input bg-card text-muted-foreground hover:bg-muted'}`}>Offline</button>
                  <button onClick={() => setNewSlot(p => ({ ...p, mode: 'online' }))} className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${newSlot.mode === 'online' ? 'bg-primary/10 border-primary text-primary' : 'border-input bg-card text-muted-foreground hover:bg-muted'}`}>Online</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground">Start Time</label>
                  <select value={newSlot.startTime} onChange={(e) => setNewSlot((p) => ({ ...p, startTime: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                    {TIME_OPTIONS.map((t) => <option key={t} disabled={isPastDateTime(newSlot.date, t)}>{t} {isPastDateTime(newSlot.date, t) && "(Past)"}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">End Time</label>
                  <select value={newSlot.endTime} onChange={(e) => setNewSlot((p) => ({ ...p, endTime: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                    {TIME_OPTIONS.map((t) => <option key={t} disabled={isPastDateTime(newSlot.date, t)}>{t} {isPastDateTime(newSlot.date, t) && "(Past)"}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Duration</label>
                <select value={newSlot.duration} onChange={(e) => setNewSlot((p) => ({ ...p, duration: parseInt(e.target.value) }))}
                  className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                </select>
              </div>
              <button onClick={handleAdd} disabled={adding} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {adding ? "Saving…" : "Save Slot"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MySlots;