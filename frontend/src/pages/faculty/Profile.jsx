import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/services/api";
import { toast } from "sonner";

const FacultyProfile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    employeeId: "",
    department: "",
    designation: "",
    bio: "",
    officeRoom: "",
    phone: ""
  });
  const [pw, setPw] = useState({ old: "", new: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const inputCls = "mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await apiClient.get("/faculty/profile/me");
      if (res.success) {
        const d = res.data;
        setForm({
          name: d.userId?.name || user?.name || "",
          email: d.userId?.email || user?.email || "",
          employeeId: d.employeeId || "",
          department: d.department || "",
          designation: d.designation || "",
          bio: d.bio || "",
          officeRoom: d.officeRoom || "",
          phone: d.phone || ""
        });
      }
      setFetching(false);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClient.put("/faculty/profile/me", {
        name: form.name,
        designation: form.designation,
        bio: form.bio,
        officeRoom: form.officeRoom,
        phone: form.phone,
      });
      if (res.success) {
        toast.success("Profile updated successfully");
        updateUser({ name: form.name });
      } else {
        toast.error(res.message || "Failed to update profile");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const [pwLoading, setPwLoading] = useState(false);

  const handlePwChange = async (e) => {
    e.preventDefault();
    if (pw.new !== pw.confirm) { toast.error("Passwords do not match"); return; }
    if (pw.new.length < 8) { toast.error("Password must be at least 8 characters"); return; }
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

  if (fetching) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="page-fade-in space-y-6 max-w-2xl">
      <h2 className="text-xl font-bold text-foreground">My Profile</h2>

      <form onSubmit={handleSave} className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground">Full Name</label>
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Email</label>
            <input type="email" value={form.email} readOnly className={`${inputCls} bg-muted cursor-not-allowed`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Employee ID</label>
            <input value={form.employeeId} readOnly className={`${inputCls} bg-muted cursor-not-allowed`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Department</label>
            <input value={form.department} readOnly className={`${inputCls} bg-muted cursor-not-allowed`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Designation</label>
            <input value={form.designation} readOnly className={`${inputCls} bg-muted cursor-not-allowed`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Office Room</label>
            <input value={form.officeRoom} onChange={(e) => setForm((p) => ({ ...p, officeRoom: e.target.value }))} className={inputCls} placeholder="e.g. CS-301" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">Phone Number</label>
          <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className={inputCls} placeholder="+91 98765 43210" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">Bio</label>
          <textarea value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} rows={4} className={`${inputCls} resize-none`} placeholder="Tell students about your expertise and research interests…" />
        </div>
        <button type="submit" disabled={loading} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {loading ? "Saving…" : "Save Changes"}
        </button>
      </form>

      <form onSubmit={handlePwChange} className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Change Password</h3>
        <div><label className="block text-sm font-medium text-foreground">Current Password</label><input type="password" value={pw.old} onChange={(e) => setPw((p) => ({ ...p, old: e.target.value }))} className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-foreground">New Password</label><input type="password" value={pw.new} onChange={(e) => setPw((p) => ({ ...p, new: e.target.value }))} className={inputCls} /></div>
        <div><label className="block text-sm font-medium text-foreground">Confirm New Password</label><input type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} className={inputCls} /></div>
        <button type="submit" disabled={pwLoading} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">{pwLoading ? "Changing…" : "Change Password"}</button>
      </form>
    </div>
  );
};

export default FacultyProfile;