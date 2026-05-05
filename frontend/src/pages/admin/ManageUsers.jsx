import React, { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { Search, Ban, Trash2, Download } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import EmptyState from "@/components/EmptyState";
import { toast } from "sonner";

const ManageUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deleteId, setDeleteId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await apiClient.get("/admin/users");
    if (res.success) setUsers(res.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter((u) => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const exportCSV = () => {
    if (filtered.length === 0) { toast.error("No data to export"); return; }
    const headers = ["Name", "Email", "Role", "Department", "Status"];
    const rows = filtered.map((u) => [
      u.name || "",
      u.email || "",
      u.role || "",
      u.profile?.department || "",
      u.isActive ? "Active" : "Suspended"
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "manage_users.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  const toggleStatus = async (id, currentStatus) => {
    const res = await apiClient.patch(`/admin/users/${id}/toggle-status`, {});
    if (res.success) {
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isActive: !u.isActive } : u));
      toast.success("User status updated");
    } else toast.error("Failed to update status");
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await apiClient.delete(`/admin/users/${deleteId}`);
    if (res.success) {
      setUsers((prev) => prev.filter((u) => u._id !== deleteId));
      toast.success("User deleted");
    } else toast.error("Failed to delete user");
    setDeleteId(null);
  };

  return (
    <div className="page-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Manage Users</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{users.length} total users</span>
          <button onClick={exportCSV} className="flex items-center gap-1.5 rounded-lg border border-input bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors" title="Export CSV">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-input bg-card py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Search users…" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="all">All Roles</option>
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-card animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No users found" description="Try a different search or filter" />
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Department</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u._id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">{u.role}</span></td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{u.profile?.department || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.isActive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                      {u.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u._id === currentUser?.id ? (
                      <span className="text-xs font-medium text-muted-foreground italic">This is you</span>
                    ) : u.role === 'admin' ? (
                      <span className="text-xs font-medium text-muted-foreground italic">Admin</span>
                    ) : (
                      <div className="flex gap-1">
                        <button onClick={() => toggleStatus(u._id, u.isActive)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title={u.isActive ? "Suspend" : "Activate"}><Ban className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteId(u._id)} className="rounded p-1 text-destructive hover:bg-destructive/10" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal open={!!deleteId} title="Delete User" message="This action cannot be undone. Are you sure?" confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
};

export default ManageUsers;