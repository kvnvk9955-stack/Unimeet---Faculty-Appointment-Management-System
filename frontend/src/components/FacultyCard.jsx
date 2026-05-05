import React from "react";
import { getInitials, getAvatarColor } from "@/utils/helpers";
import { Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";


const FacultyCard = ({ faculty }) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-card ${getAvatarColor(faculty.name)}`}>
          {getInitials(faculty.name)}
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{faculty.name}</h3>
          <p className="text-sm text-muted-foreground">{faculty.designation}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{faculty.department}</p>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Mail className="h-3.5 w-3.5" />
        <span>{faculty.email}</span>
      </div>
      <button
        onClick={() => navigate(`/student/faculty/${faculty.id}`)}
        className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
        
        View Profile & Book
      </button>
    </div>);

};

export default FacultyCard;