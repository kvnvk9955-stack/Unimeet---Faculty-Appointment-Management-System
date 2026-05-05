import { format, formatDistanceToNow } from "date-fns";

export const formatDate = (date) => {
  if (!date) return "N/A";
  try {
    return format(new Date(date), "EEE, dd MMM yyyy");
  } catch {
    return "Invalid Date";
  }
};

export const formatTimeAmPm = (timeStr) => {
  if (!timeStr) return "";
  if (timeStr.toUpperCase().includes('AM') || timeStr.toUpperCase().includes('PM')) {
    return timeStr;
  }
  const [hours, minutes] = timeStr.split(":");
  if (hours === undefined || minutes === undefined) return timeStr;
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const formattedH = h % 12 || 12;
  return `${formattedH.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

export const formatTimeSlot = (slotStr) => {
  if (!slotStr) return "";
  const parts = slotStr.split("-");
  if (parts.length === 2) {
    return `${formatTimeAmPm(parts[0].trim())} - ${formatTimeAmPm(parts[1].trim())}`;
  }
  return slotStr;
};

export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return "";
  try {
    const date = new Date(timestamp);
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return "Just now";
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "";
  }
};

export const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

export const getInitials = (name) => {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
};

export const getAvatarColor = (name) => {
  const colors = [
  "bg-primary", "bg-secondary", "bg-success", "bg-warning",
  "bg-destructive", "bg-indigo-500", "bg-violet-500", "bg-emerald-500"];

  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export const truncate = (str, len) => {
  return str.length > len ? str.slice(0, len) + "…" : str;
};

export const formatNotificationMessage = (msg) => {
  if (!msg) return "";
  // First convert time ranges like "09:00 - 09:30"
  let result = msg.replace(/\b(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\b/g, (match) => {
    return formatTimeSlot(match);
  });
  // Then convert any remaining standalone 24h times like "at 09:00" that aren't already AM/PM
  result = result.replace(/\b(\d{1,2}:\d{2})\b(?!\s*(?:AM|PM))/gi, (match) => {
    return formatTimeAmPm(match);
  });
  return result;
};