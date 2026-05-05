import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { validateEmail, validatePassword, validateName, validateConfirmPassword, getPasswordStrength } from "@/utils/validators";
import { toast } from "sonner";

const DEPARTMENTS = [
  "Computer Science", "Information Technology", "Electronics & Communication",
  "Electrical Engineering", "Mechanical Engineering", "Civil Engineering",
  "MBA", "MCA", "Mathematics", "Physics", "Chemistry", "English"
];

const Register = () => {
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "", phone: "",
    role: "student", department: "", employeeId: "", studentId: "", designation: ""
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (key, val) => {
    if (key === 'role') {
      // Reset role-specific fields when switching roles
      setForm((p) => ({ ...p, role: val, studentId: "", employeeId: "", designation: "" }));
      setErrors((p) => ({ ...p, role: "", studentId: "", employeeId: "", designation: "" }));
    } else {
      setForm((p) => ({ ...p, [key]: val }));
      setErrors((p) => ({ ...p, [key]: "" }));
    }
  };

  const strength = getPasswordStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    const nameErr = validateName(form.name); if (nameErr) errs.name = nameErr;
    const emailErr = validateEmail(form.email); if (emailErr) errs.email = emailErr;
    const pwErr = validatePassword(form.password); if (pwErr) errs.password = pwErr;
    const cpErr = validateConfirmPassword(form.password, form.confirmPassword); if (cpErr) errs.confirmPassword = cpErr;
    if (form.role === "faculty" && !form.department) errs.department = "Department is required";
    if (form.role === "faculty" && !form.employeeId) errs.employeeId = "Employee ID is required";
    if (form.role === "faculty" && !form.designation) errs.designation = "Designation is required";
    if (form.role === "student" && !form.studentId) errs.studentId = "Student ID is required";
    if (form.role === "student" && !form.department) errs.department = "Department is required";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        department: form.department,
        phone: form.phone,
        ...(form.role === "student" && { studentId: form.studentId }),
        ...(form.role === "faculty" && { employeeId: form.employeeId, designation: form.designation }),
      };
      const result = await register(payload);
      if (result.success) {
        toast.success("Registration successful! Please login.");
        navigate("/login");
      } else {
        toast.error(result.message || "Registration failed");
      }
    } catch {
      toast.error("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md page-fade-in">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">Unimeet</span>
          </Link>
          <h2 className="mt-4 text-2xl font-bold text-foreground">Create your account</h2>
          <p className="mt-1 text-sm text-muted-foreground">Join Unimeet to manage your appointments</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">Full Name</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Enter your full name" />
            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Email</label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="you@university.edu" />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Password</label>
            <div className="relative mt-1">
              <input type={showPw ? "text" : "password"} value={form.password} onChange={(e) => set("password", e.target.value)} className="w-full rounded-lg border border-input bg-card px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Min 8 characters" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.password && (
              <div className="mt-2">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${strength.color}`} style={{ width: `${strength.percent}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{strength.label}</p>
              </div>
            )}
            {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Confirm Password</label>
            <input type="password" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Re-enter password" />
            {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Phone Number (Optional)</label>
            <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. +1234567890" />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Role</label>
            <select value={form.role} onChange={(e) => set("role", e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>

          {/* Department - shown for both roles */}
          <div>
            <label className="block text-sm font-medium text-foreground">Department</label>
            <select value={form.department} onChange={(e) => set("department", e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
            {errors.department && <p className="mt-1 text-xs text-destructive">{errors.department}</p>}
          </div>

          {/* Faculty-only fields */}
          {form.role === "faculty" && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground">Employee ID</label>
                <input value={form.employeeId} onChange={(e) => set("employeeId", e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. EMP001" />
                {errors.employeeId && <p className="mt-1 text-xs text-destructive">{errors.employeeId}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Designation</label>
                <select value={form.designation} onChange={(e) => set("designation", e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">Select designation</option>
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Professor">Professor</option>
                  <option value="HOD">HOD</option>
                  <option value="Dean">Dean</option>
                </select>
                {errors.designation && <p className="mt-1 text-xs text-destructive">{errors.designation}</p>}
              </div>
            </>
          )}

          {/* Student-only fields */}
          {form.role === "student" && (
            <div>
              <label className="block text-sm font-medium text-foreground">Student ID</label>
              <input value={form.studentId} onChange={(e) => set("studentId", e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. STU2024001" />
              {errors.studentId && <p className="mt-1 text-xs text-destructive">{errors.studentId}</p>}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;