import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/services/api";
import { toast } from "sonner";

const AdminProfile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: ""
  });
  const [pw, setPw] = useState({ old: "", new: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get("/auth/me");
        if (res.success) {
          const d = res.data;
          setForm({
            name: d.user?.name || user?.name || "",
            email: d.user?.email || user?.email || "",
            role: d.user?.role || user?.role || ""
          });
        }
      } catch {}
      setFetching(false);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || form.name.trim().length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.put("/admin/profile", {
        name: form.name,
      });
      if (res.success) {
        updateUser({ name: form.name });
        toast.success("Profile updated successfully");
      } else {
        toast.error(res.message || "Failed to update profile");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handlePwChange = async (e) => {
    e.preventDefault();
    if (!pw.old) { toast.error("Current password is required"); return; }
    if (!pw.new) { toast.error("New password is required"); return; }
    if (pw.new.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (!/\d/.test(pw.new)) { toast.error("Password must contain at least 1 number"); return; }
    if (!/[a-zA-Z]/.test(pw.new)) { toast.error("Password must contain at least 1 letter"); return; }
    if (pw.new !== pw.confirm) { toast.error("Passwords do not match"); return; }
    setPwLoading(true);
    try {
      const res = await apiClient.patch("/auth/change-password", {
        oldPassword: pw.old,
        newPassword: pw.new,
        confirmPassword: pw.confirm,
      });
      if (res.success) {
        toast.success("Password changed successfully");
        setPw({ old: "", new: "", confirm: "" });
      } else {
        toast.error(res.message || "Failed to change password");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setPwLoading(false);
    }
  };

  const inputCls = "mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

  if (fetching) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="page-fade-in space-y-6 max-w-2xl">
      <h2 className="text-xl font-bold text-foreground">Admin Profile</h2>

      <form onSubmit={handleSave} className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground">Full Name</label>
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">Email</label>
          <input type="email" value={form.email} readOnly className={`${inputCls} bg-muted cursor-not-allowed`} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">Role</label>
          <input value={form.role} readOnly className={`${inputCls} bg-muted cursor-not-allowed capitalize`} />
        </div>
        <button type="submit" disabled={loading} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {loading ? "Saving…" : "Save Changes"}
        </button>
      </form>

      <form onSubmit={handlePwChange} className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Change Password</h3>
        <div>
          <label className="block text-sm font-medium text-foreground">Current Password</label>
          <input type="password" value={pw.old} onChange={(e) => setPw((p) => ({ ...p, old: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">New Password</label>
          <input type="password" value={pw.new} onChange={(e) => setPw((p) => ({ ...p, new: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">Confirm New Password</label>
          <input type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} className={inputCls} />
        </div>
        <button type="submit" disabled={pwLoading} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {pwLoading ? "Changing…" : "Change Password"}
        </button>
      </form>
    </div>);

};

export default AdminProfile;
