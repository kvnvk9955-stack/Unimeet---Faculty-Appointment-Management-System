import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "@/services/api";
import { useAppointments } from "@/context/AppointmentContext";
import { getInitials, getAvatarColor, formatDate } from "@/utils/helpers";
import { Mail, MapPin, Phone, BookOpen, Star, Calendar } from "lucide-react";
import { format, addDays } from "date-fns";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";

// Convert 24h "09:00" -> "09:00 AM" for display
const to12h = (time24) => {
  if (!time24 || !time24.includes(":")) return time24 || "";
  let [hours, minutes] = time24.split(":");
  const h = parseInt(hours, 10);
  const modifier = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${minutes} ${modifier}`;
};

const FacultyProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchAppointments } = useAppointments();
  const [faculty, setFaculty] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      const res = await apiClient.get(`/faculty/${id}`);
      if (res.success) setFaculty(res.data);
      else toast.error("Faculty not found");
      setLoadingProfile(false);
    };
    fetchProfile();
  }, [id]);

  useEffect(() => {
    const fetchSlots = async () => {
      setLoadingSlots(true);
      const res = await apiClient.get(`/faculty/${id}/slots?date=${selectedDate}`);
      if (res.success) setSlots(res.data || []);
      else setSlots([]);
      setLoadingSlots(false);
    };
    fetchSlots();
    setSelectedSlot(null);
  }, [selectedDate, id]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      toast.error("Please select a time slot");
      return;
    }
    if (!purpose.trim() || purpose.trim().length < 10) {
      toast.error("Please describe the purpose (at least 10 characters)");
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post("/appointments", { slotId: selectedSlot, purpose: purpose.trim() });
      if (res.success) {
        toast.success("Appointment request submitted successfully!");
        fetchAppointments();
        navigate("/student/appointments");
      } else {
        toast.error(res.message || "Failed to book appointment");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  if (!faculty) return <EmptyState title="Faculty not found" description="The faculty member you're looking for doesn't exist." />;

  const dates = Array.from({ length: 7 }, (_, i) => format(addDays(new Date(), i), "yyyy-MM-dd"));

  // Faculty profile data — backend returns flattened from getFacultyById
  const name = faculty.name || faculty.userId?.name || "Faculty Member";
  const email = faculty.email || faculty.userId?.email || "";
  const selectedSlotData = slots.find((s) => s._id === selectedSlot);

  return (
    <div className="page-fade-in">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className={`flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white ${getAvatarColor(name)}`}>
              {getInitials(name)}
            </div>
            <h2 className="mt-4 text-xl font-bold text-foreground">{name}</h2>
            <p className="text-sm text-muted-foreground">{faculty.designation || "Faculty Member"}</p>
            <p className="text-sm font-medium text-primary">{faculty.department || ""}</p>
          </div>

          <div className="mt-6 space-y-3 text-sm">
            {email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{email}</span>
              </div>
            )}
            {faculty.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span>{faculty.phone}</span>
              </div>
            )}
            {faculty.officeRoom && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span>{faculty.officeRoom}</span>
              </div>
            )}
            {faculty.totalAppointments !== undefined && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0 text-primary" />
                <span>{faculty.totalAppointments} appointments taken</span>
              </div>
            )}
          </div>

          {faculty.bio && (
            <div className="mt-4 rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <BookOpen className="h-4 w-4 text-primary" />
                About
              </div>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{faculty.bio}</p>
            </div>
          )}
        </div>

        {/* Slots & Booking */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">Available Time Slots</h3>

            {/* Date picker */}
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {dates.map((d) => (
                <button key={d} onClick={() => setSelectedDate(d)}
                  className={`flex min-w-[72px] flex-col items-center rounded-lg border px-2 py-2 text-xs transition-colors ${d === selectedDate ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted"}`}>
                  <span className="font-medium">{format(new Date(d + "T00:00:00"), "EEE")}</span>
                  <span className="text-base font-bold">{format(new Date(d + "T00:00:00"), "dd")}</span>
                  <span>{format(new Date(d + "T00:00:00"), "MMM")}</span>
                </button>
              ))}
            </div>

            {/* Slots grid */}
            <div className="mt-4">
              {loadingSlots ? (
                <div className="flex flex-wrap gap-2">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-8 w-24 animate-pulse rounded-lg bg-muted" />)}
                </div>
              ) : slots.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {slots.map((s) => {
                    const startDisplay = to12h(s.startTime);
                    const endDisplay = to12h(s.endTime);
                    const isSelected = s._id === selectedSlot;
                    return (
                      <button
                        key={s._id}
                        disabled={s.status !== "available"}
                        onClick={() => setSelectedSlot(s._id)}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors leading-tight ${
                          s.status !== "available"
                            ? "border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                            : isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-success/40 bg-success/10 text-success hover:bg-success/20"
                        }`}>
                        <div>{startDisplay}</div>
                        <div className="text-[10px] opacity-75">to {endDisplay}</div>
                        <div className="mt-0.5 inline-block rounded bg-background/20 px-1 py-0.5 text-[9px] uppercase tracking-wider">{s.mode || 'offline'}</div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">No available slots for this date. Try another day.</p>
              )}
            </div>
          </div>

          {/* Booking form */}
          {selectedSlot && selectedSlotData && (
            <form onSubmit={handleBook} className="rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-sm page-fade-in">
              <h3 className="text-lg font-semibold text-foreground">Book Appointment</h3>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                <span>
                  {format(new Date(selectedDate + "T00:00:00"), "EEE, dd MMM yyyy")} &nbsp;•&nbsp;
                  {to12h(selectedSlotData.startTime)} – {to12h(selectedSlotData.endTime)} &nbsp;•&nbsp;
                  <strong className="uppercase">{selectedSlotData.mode || 'offline'}</strong>
                </span>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-foreground">
                  Purpose of Meeting <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  maxLength={500}
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder="Briefly describe the purpose of your meeting (minimum 10 characters)…"
                  required />
                <p className={`mt-1 text-xs text-right ${purpose.length < 10 && purpose.length > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {purpose.length}/500 {purpose.length > 0 && purpose.length < 10 && "(min 10 characters)"}
                </p>
              </div>
              <button
                type="submit"
                disabled={loading || purpose.trim().length < 10}
                className="mt-4 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {loading ? "Submitting…" : "Request Appointment"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyProfile;