import React from "react";
import StatusBadge from "./StatusBadge";
import { Calendar, Clock } from "lucide-react";
import { formatDate, formatTimeSlot } from "@/utils/helpers";
const AppointmentCard = ({ appointment, showFaculty = true, showStudent = false, actions }) =>
  <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        {showFaculty && <p className="font-semibold text-foreground">{appointment.facultyName}</p>}
        {showStudent && <p className="font-semibold text-foreground">{appointment.studentName}</p>}
        <p className="text-sm text-muted-foreground">{appointment.department}</p>
      </div>
      <StatusBadge status={appointment.status} />
    </div>
    <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(appointment.date)}</span>
      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatTimeSlot(appointment.timeSlot) || "—"}</span>
    </div>
    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{appointment.purpose}</p>
    {actions && <div className="mt-3 flex gap-2">{actions}</div>}
  </div>;


export default AppointmentCard;