import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Video, ShieldAlert, CheckCircle2, User, Loader2 } from "lucide-react";

const JoinMeeting = () => {
  const { meetingId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [meetingError, setMeetingError] = useState("");
  const [meeting, setMeeting] = useState(null);
  
  const [joinName, setJoinName] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    // If student is logged in, auto-fill their name
    if (isAuthenticated && user?.name) {
      setJoinName(user.name);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const fetchMeetingInfo = async () => {
      try {
        const res = await apiClient.get(`/meetings/${meetingId}`);
        if (res.success) {
          setMeeting(res.data);
        } else {
          setMeetingError(res.message || "Invalid meeting link");
        }
      } catch (err) {
        setMeetingError("Unable to fetch meeting details. The link may exist no more.");
      } finally {
        setLoading(false);
      }
    };
    fetchMeetingInfo();
  }, [meetingId]);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinName.trim()) {
      toast.error("Please enter your display name");
      return;
    }

    setJoining(true);
    try {
      const res = await apiClient.post(`/meetings/${meetingId}/join`, { studentName: joinName });
      if (res.success && res.data?.externalUrl) {
        toast.success("Connecting securely...");
        // Redirect completely to the real Google Meet / Zoom link
        window.location.href = res.data.externalUrl;
      } else {
        toast.error(res.message || "Failed to join meeting");
        setJoining(false);
      }
    } catch (err) {
      toast.error("Connection failed. Please try again.");
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (meetingError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-foreground">Invalid Link</h2>
          <p className="mt-2 text-sm text-muted-foreground">{meetingError}</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-8 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary p-3 text-primary-foreground shadow-lg">
              <Video className="h-8 w-8" />
            </div>
          </div>
          <h1 className="mt-6 text-center text-2xl font-bold tracking-tight text-foreground">
            {meeting?.title || "Secure Video Meeting"}
          </h1>
          <p className="mt-2 text-center text-sm font-medium text-muted-foreground flex items-center justify-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-success" /> Hosted by {meeting?.hostName || "Faculty"}
          </p>
        </div>

        {/* Join Form */}
        <div className="p-6">
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="joinName" className="text-sm font-medium text-foreground">
                Your Display Name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  id="joinName"
                  type="text"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  disabled={joining}
                  className="w-full rounded-xl border border-input bg-background py-3 pl-10 pr-4 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={joining || !joinName.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {joining ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Joining...
                </>
              ) : (
                "Join Meeting securely"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Protected by Unimeet Gatekeeper Security. <br />
            Your IP and join request will be logged with the host.
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinMeeting;
