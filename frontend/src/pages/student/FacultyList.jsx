import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "@/services/api";
import { Search, MapPin, BookOpen } from "lucide-react";

const FacultyList = () => {
  const [faculty, setFaculty] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("");
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      const res = await apiClient.get(`/faculty?_t=${Date.now()}`);
      if (res.success) {
        const list = res.data || [];
        setFaculty(list);
        setFiltered(list);
        const depts = [...new Set(list.map((f) => f.department).filter(Boolean))];
        setDepartments(depts);
      }
      setLoading(false);
    };
    fetch_();
  }, []);

  useEffect(() => {
    let list = faculty;
    if (search) list = list.filter((f) =>
      f.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.department?.toLowerCase().includes(search.toLowerCase()) ||
      f.designation?.toLowerCase().includes(search.toLowerCase())
    );
    if (dept) list = list.filter((f) => f.department === dept);
    setFiltered(list);
  }, [search, dept, faculty]);

  return (
    <div className="page-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Faculty Directory</h2>
        <p className="text-sm text-muted-foreground">Browse and book appointments with faculty members</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-card pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Search by name, department…" />
        </div>
        <select value={dept} onChange={(e) => setDept(e.target.value)}
          className="rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 rounded-xl border border-border bg-card animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No faculty found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((f) => (
            <div key={f.id} className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                  {f.name?.[0]?.toUpperCase() || "F"}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{f.name || "Faculty"}</h3>
                  <p className="text-xs text-muted-foreground">{f.designation || "Faculty Member"}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <BookOpen className="h-3 w-3" />
                    <span className="truncate">{f.department}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${f.isAvailable ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                  {f.isAvailable ? "Available" : "Unavailable"}
                </span>
                <Link to={`/student/faculty/${f.id}`}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FacultyList;