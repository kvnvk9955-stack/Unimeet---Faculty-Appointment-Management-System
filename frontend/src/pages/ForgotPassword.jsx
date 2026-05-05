import React, { useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "@/services/api";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const [resetLink, setResetLink] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { toast.error("Please enter your email"); return; }
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/forgot-password", { email });
      if (res.success) {
        setSent(true);
        if (res.data?.resetURL) setResetLink(res.data.resetURL);
        toast.success("If your email is registered, you will receive a reset link shortly");
      } else {
        toast.error(res.message || "Something went wrong");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Forgot Password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl border border-border bg-card p-8 shadow-sm text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <Mail className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Check your email</h3>
            <p className="text-sm text-muted-foreground">
              If an account exists with <span className="font-medium text-foreground">{email}</span>, you'll receive a password reset link shortly.
            </p>
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </Link>
            {resetLink && (
              <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 p-3 text-left">
                <p className="text-xs font-semibold text-warning mb-1">⚠ Dev Mode — Reset Link:</p>
                <a href={resetLink} className="text-xs text-primary break-all hover:underline">{resetLink}</a>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                placeholder="you@university.edu"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
            <div className="text-center">
              <Link to="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
