import React, { useState } from "react";
import { useAppointments } from "@/context/AppointmentContext";
import { formatRelativeTime, formatNotificationMessage } from "@/utils/helpers";
import { Bell, CalendarCheck, CalendarX, AlertCircle, Clock, Trash2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";

import ConfirmModal from "@/components/ConfirmModal";
import { useNavigate } from "react-router-dom";

const iconMap = {
  confirmed: <CalendarCheck className="h-4 w-4 text-success" />,
  appointment_approved: <CalendarCheck className="h-4 w-4 text-success" />,
  rejected: <CalendarX className="h-4 w-4 text-destructive" />,
  appointment_rejected: <CalendarX className="h-4 w-4 text-destructive" />,
  cancelled: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
  appointment_cancelled: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
  reminder: <Clock className="h-4 w-4 text-warning" />,
  new_request: <Bell className="h-4 w-4 text-primary" />,
  new_booking: <Bell className="h-4 w-4 text-primary" />,
  account_approved: <CalendarCheck className="h-4 w-4 text-success" />
};

const FacultyNotifications = () => {
  const { notifications, markAllNotificationsRead, markNotificationRead, deleteNotification, clearAllNotifications } = useAppointments();
  const navigate = useNavigate();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const myNotifs = [...notifications].sort((a, b) => new Date(b.createdAt || b.timestamp).getTime() - new Date(a.createdAt || a.timestamp).getTime());

  const handleNotificationClick = (n) => {
    markNotificationRead(n._id || n.id);
    const type = n.type || "";
    if (type.includes("new_request") || type.includes("new_booking") || type.includes("cancelled") || type.includes("appointment")) {
      navigate("/faculty/requests");
    } else {
      navigate("/faculty/dashboard");
    }
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  const handleClearAll = () => {
    clearAllNotifications();
    setShowClearConfirm(false);
  };

  return (
    <div className="page-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">
          Notifications <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-success animate-pulse" title="Live Polling Active"></span>
        </h2>
        <div className="flex gap-2">
          <button onClick={markAllNotificationsRead} className="text-sm font-medium text-primary hover:underline">Mark all as read</button>
          {myNotifs.length > 0 && (
            <button onClick={() => setShowClearConfirm(true)} className="text-sm font-medium text-destructive hover:underline">Clear All</button>
          )}
        </div>
      </div>

      {myNotifs.length === 0 ?
      <EmptyState title="No notifications" description="You're all caught up!" icon={<Bell className="h-8 w-8 text-muted-foreground" />} /> :

      <div className="space-y-2">
          {myNotifs.map((n) =>
        <div
          key={n._id || n.id}
          onClick={() => handleNotificationClick(n)}
          className={`flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer transition-colors hover:bg-muted/50 ${n.isRead ? "bg-card" : "bg-primary/5 border-primary/20"}`}>
          
              <div className="mt-0.5">{iconMap[n.type] || <Bell className="h-4 w-4" />}</div>
              <div className="flex-1 min-w-0">
                 <p className={`text-sm ${n.isRead ? "text-foreground" : "font-semibold text-foreground"}`}>{formatNotificationMessage(n.message || n.title)}</p>
                 <p className="mt-1 text-xs text-muted-foreground">{formatRelativeTime(n.createdAt || n.timestamp)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!n.isRead && <div className="h-2 w-2 rounded-full bg-primary" />}
                <button onClick={(e) => handleDelete(e, n._id || n.id)} className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Delete notification">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
        )}
        </div>
      }

      <ConfirmModal open={showClearConfirm} title="Clear All Notifications" message="Are you sure you want to delete all notifications? This cannot be undone." confirmLabel="Clear All" onConfirm={handleClearAll} onCancel={() => setShowClearConfirm(false)} />
    </div>);

};

export default FacultyNotifications;