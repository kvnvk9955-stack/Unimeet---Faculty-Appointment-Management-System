import React from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { GraduationCap, Search, CalendarCheck, CheckCircle, Shield, Clock, Bell, History, UserCheck, BarChart3 } from "lucide-react";

const features = [
{ icon: <Shield className="h-6 w-6" />, title: "Role-Based Access", desc: "Separate dashboards and permissions for students, faculty, and administrators." },
{ icon: <Clock className="h-6 w-6" />, title: "Conflict-Free Scheduling", desc: "Smart slot management prevents double bookings and scheduling conflicts." },
{ icon: <Bell className="h-6 w-6" />, title: "Real-Time Notifications", desc: "Instant updates on appointment approvals, rejections, and reminders." },
{ icon: <History className="h-6 w-6" />, title: "Appointment History", desc: "Complete record of all past and upcoming appointments for easy reference." },
{ icon: <UserCheck className="h-6 w-6" />, title: "Approval Workflow", desc: "Faculty can review, approve, or reschedule appointment requests efficiently." },
{ icon: <BarChart3 className="h-6 w-6" />, title: "Admin Analytics", desc: "Comprehensive reports and insights on appointment trends and faculty utilization." }];


const steps = [
{ icon: <Search className="h-8 w-8" />, title: "Search Faculty", desc: "Browse faculty by department or search by name" },
{ icon: <CalendarCheck className="h-8 w-8" />, title: "Pick a Slot", desc: "Choose from available time slots that work for you" },
{ icon: <CheckCircle className="h-8 w-8" />, title: "Confirm Booking", desc: "Submit your request and get notified on approval" }];


const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <GraduationCap className="h-9 w-9 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Uni<span className="text-primary">meet</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Smart Faculty Appointments for Smarter Campuses
          </p>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Streamline appointment scheduling between students and faculty with an intuitive, conflict-free booking system.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/login" className="rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
              Sign In
            </Link>
            <Link to="/register" className="rounded-lg border border-border bg-card px-8 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted">
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-card py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">How It Works</h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-muted-foreground">Book a faculty appointment in three simple steps</p>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {steps.map((step, i) =>
            <div key={i} className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  {step.icon}
                </div>
                <div className="mt-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</div>
                <h3 className="mt-3 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">Everything You Need</h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-muted-foreground">A complete appointment management solution for your campus</p>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) =>
            <div key={i} className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {f.icon}
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Unimeet</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">© {new Date().getFullYear()} Unimeet. Simplifying campus appointments.</p>
        </div>
      </footer>
    </div>);

};

export default Landing;