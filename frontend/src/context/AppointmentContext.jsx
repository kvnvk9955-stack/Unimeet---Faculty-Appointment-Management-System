import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { apiClient } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const AppointmentContext = createContext(undefined);

export const useAppointments = () => {
  const ctx = useContext(AppointmentContext);
  if (!ctx) throw new Error("useAppointments must be used within AppointmentProvider");
  return ctx;
};

export const AppointmentProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAppointments = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      let endpoint = "/appointments/student?limit=100";
      if (user?.role === "faculty") endpoint = "/appointments/faculty?limit=100";
      else if (user?.role === "admin") endpoint = "/appointments/admin?limit=100";
      const res = await apiClient.get(endpoint);
      if (res.success) setAppointments(res.data || []);
    } catch {}
  }, [isAuthenticated, user?.role]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await apiClient.get("/notifications?limit=100");
      if (res.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {}
  }, [isAuthenticated]);

  useEffect(() => {
    let intervalId;
    
    if (isAuthenticated) {
      fetchAppointments();
      fetchNotifications();
      
      intervalId = setInterval(fetchNotifications, 30000);
      
      const handleVisibility = () => {
        if (!document.hidden) {
          fetchNotifications();
          fetchAppointments();
        }
      };
      document.addEventListener("visibilitychange", handleVisibility);
      
      return () => {
        clearInterval(intervalId);
        document.removeEventListener("visibilitychange", handleVisibility);
      };
    } else {
      setAppointments([]);
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, fetchAppointments, fetchNotifications]);

  const addAppointment = (apt) => {
    setAppointments((prev) => [apt, ...prev]);
  };

  const updateAppointmentStatus = async (id, status, reason) => {
    try {
      let res;
      if (status === "approved") res = await apiClient.patch(`/appointments/${id}/approve`, {});
      else if (status === "rejected") res = await apiClient.patch(`/appointments/${id}/reject`, { rejectionReason: reason });
      else if (status === "cancelled") res = await apiClient.patch(`/appointments/${id}/cancel`, {});
      else if (status === "completed") res = await apiClient.patch(`/appointments/${id}/complete`, {});
      else if (status === "missed") res = await apiClient.patch(`/appointments/${id}/missed`, {});
      if (res?.success) {
        setAppointments((prev) => prev.map((a) => a._id === id ? { ...a, status, rejectionReason: reason || a.rejectionReason } : a));
      }
      return res;
    } catch {}
  };

  const addMeetingLink = async (id, meetingLink) => {
    try {
      const res = await apiClient.patch(`/appointments/${id}/link`, { meetingLink });
      if (res.success) {
        setAppointments((prev) => prev.map((a) => a._id === id ? { ...a, meetingLink } : a));
      }
      return res;
    } catch {}
  };

  const markAllNotificationsRead = async () => {
    try {
      const res = await apiClient.patch("/notifications/mark-all-read");
      if (res.success) fetchNotifications();
    } catch {}
  };

  const markNotificationRead = async (id) => {
    try {
      await apiClient.patch(`/notifications/${id}/mark-read`, {});
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const deleteNotification = async (id) => {
    try {
      const n = notifications.find((n) => n._id === id);
      const res = await apiClient.delete(`/notifications/${id}`);
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        if (n && !n.isRead) setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {}
  };

  const clearAllNotifications = async () => {
    try {
      const res = await apiClient.delete("/notifications/clear");
      if (res.success) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch {}
  };

  const rescheduleStudent = async (id, newSlotId, purpose) => {
    try {
      const res = await apiClient.post(`/appointments/${id}/reschedule-student`, { newSlotId, purpose });
      if (res?.success) fetchAppointments();
      return res;
    } catch {}
  };

  const rescheduleFaculty = async (id, suggestedSlotId, message) => {
    try {
      const res = await apiClient.post(`/appointments/${id}/reschedule-faculty`, { suggestedSlotId, message });
      if (res?.success) fetchAppointments();
      return res;
    } catch {}
  };

  const rescheduleConfirmAction = async (id) => {
    try {
      const res = await apiClient.patch(`/appointments/${id}/reschedule-confirm`, {});
      if (res?.success) fetchAppointments();
      return res;
    } catch {}
  };

  const rescheduleDeclineAction = async (id) => {
    try {
      const res = await apiClient.patch(`/appointments/${id}/reschedule-decline`, {});
      if (res?.success) fetchAppointments();
      return res;
    } catch {}
  };

  return (
    <AppointmentContext.Provider value={{
      appointments, notifications, unreadCount,
      fetchAppointments, fetchNotifications, addAppointment,
      updateAppointmentStatus, addMeetingLink, markAllNotificationsRead, markNotificationRead,
      deleteNotification, clearAllNotifications,
      rescheduleStudent, rescheduleFaculty, rescheduleConfirmAction, rescheduleDeclineAction
    }}>
      {children}
    </AppointmentContext.Provider>
  );
};