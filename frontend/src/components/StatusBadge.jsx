import React from "react";
const statusStyles = {
  pending: "bg-warning/10 text-warning border-warning/20",
  approved: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-muted text-muted-foreground border-border",
  completed: "bg-primary/10 text-primary border-primary/20",
  missed: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  rescheduled: "bg-violet-500/10 text-violet-600 border-violet-500/20"
};

const StatusBadge = ({ status }) => {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[status] || ""}`}>
      {status}
    </span>);

};

export default StatusBadge;