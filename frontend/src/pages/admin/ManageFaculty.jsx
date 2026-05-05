import React, { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/services/api";
import { Ban, CheckCircle, Download } from "lucide-react";
import { toast } from "sonner";

const ManageFaculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  const fetchFaculty = useCallback(async () => {
    setLoading(true);
    const res = await apiClient.get("/admin/faculty");
    if (res.success) setFaculty(res.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchFaculty(); }, [fetchFaculty]);

  const toggleApproval = async (id, current) => {
    const res = await apiClient.patch(`/admin/faculty/${id}/approve`, {});
    if (res.success) {
      toast.success(current ? "Faculty approval revoked" : "Faculty approved successfully");
      // Refetch the full list from backend to ensure state is accurate
      await fetchFaculty();
      // Notify AdminDashboard to refresh the pending count banner immediately
      window.dispatchEvent(new Event("admin-stats-refresh"));
    } else toast.error("Failed to update faculty");
  };

  if (loading) return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-lg bg-card animate-pulse" />)}
    </div>
  );

  const displayedFaculty = faculty.filter(f => filter === "all" ? true : !f.isApproved);

  const exportCSV = () => {
    if (displayedFaculty.length === 0) { toast.error("No data to export"); return; }
    const headers = ["Name", "Department", "Designation", "Employee ID", "Appointments", "Status"];
    const rows = displayedFaculty.map((f) => [
      f.userId?.name || "",
      f.department || "",
      f.designation || "",
      f.employeeId || "",
      f.totalAppointments ?? 0,
      f.isApproved ? "Approved" : "Pending Approval"
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "manage_faculty.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  return (
    <div className="page-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-foreground">Manage Faculty</h2>
        <div className="flex gap-2">
           <button onClick={exportCSV} className="flex items-center gap-1.5 rounded-lg border border-input bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors" title="Export CSV">
             <Download className="h-4 w-4" /> Export CSV
           </button>
           <button onClick={() => setFilter("pending")} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${filter === "pending" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
             Pending
           </button>
           <button onClick={() => setFilter("all")} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
             All Faculty
           </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Department</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Designation</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Employee ID</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Appointments</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedFaculty.map((f) => (
              <tr key={f._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium text-foreground">{f.userId?.name || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{f.department}</td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{f.designation || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{f.employeeId || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{f.totalAppointments ?? 0}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${f.isApproved ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                    {f.isApproved ? "Approved" : "Pending Approval"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleApproval(f._id, f.isApproved)}
                    className={`rounded p-1 hover:bg-muted ${f.isApproved ? "text-muted-foreground hover:text-foreground" : "text-success"}`}
                    title={f.isApproved ? "Revoke Approval" : "Approve"}>
                    {f.isApproved ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  </button>
                </td>
              </tr>
            ))}
            {displayedFaculty.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                {filter === "pending" ? "No pending faculty requests." : "No faculty registered yet."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageFaculty;