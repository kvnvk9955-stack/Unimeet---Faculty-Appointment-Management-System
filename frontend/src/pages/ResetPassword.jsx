import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { apiClient } from "@/services/api";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { getPasswordStrength } from "@/utils/validators";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const strength = getPasswordStrength(form.newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.newPassword) { toast.error("New password is required"); return; }
    if (form.newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (!/\d/.test(form.newPassword)) { toast.error("Password must contain at least 1 number"); return; }
    if (!/[a-zA-Z]/.test(form.newPassword)) { toast.error("Password must contain at least 1 letter"); return; }
    if (form.newPassword !== form.confirmPassword) { toast.error("Passwords do not match"); return; }

    setLoading(true);
    try {
      const res = await apiClient.patch("/auth/reset-password", {
        token,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      if (res.success) {
        setDone(true);
        toast.success("Password reset successfully!");
      } else {
        toast.error(res.message || "Reset failed. Token may be expired.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Invalid Reset Link</h1>
          <p className="text-sm text-muted-foreground">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <ShieldCheck className="h-8 w-8 text-success" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Password Reset Successful</h3>
          <p className="text-sm text-muted-foreground">Your password has been reset. You can now sign in with your new password.</p>
          <Link to="/login" className="inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">New Password</label>
            <div className="relative mt-1">
              <input
                type={showPw ? "text" : "password"}
                value={form.newPassword}
                onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
                className={inputCls}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.newPassword && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${strength.color} transition-all`} style={{ width: `${strength.percent}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{strength.label}</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Confirm Password</label>
            <div className="relative mt-1">
              <input
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                className={inputCls}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Resetting…" : "Reset Password"}
          </button>

          <div className="text-center">
            <Link to="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
