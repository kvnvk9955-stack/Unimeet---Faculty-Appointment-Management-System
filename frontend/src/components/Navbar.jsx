import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { GraduationCap, Menu, X } from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
  { label: "Home", href: "/" },
  { label: "Sign In", href: "/login" },
  { label: "Register", href: "/register" }];


  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold text-primary">Unimeet</span>
        </Link>

        <div className="hidden items-center gap-1 sm:flex">
          {links.map((l) =>
          <Link
            key={l.href}
            to={l.href}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            location.pathname === l.href ?
            "bg-primary/10 text-primary" :
            "text-muted-foreground hover:bg-muted hover:text-foreground"}`
            }>
            
              {l.label}
            </Link>
          )}
        </div>

        <button onClick={() => setOpen(!open)} className="sm:hidden text-foreground" aria-label="Toggle menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open &&
      <div className="border-t border-border bg-card px-4 pb-4 sm:hidden page-fade-in">
          {links.map((l) =>
        <Link
          key={l.href}
          to={l.href}
          onClick={() => setOpen(false)}
          className="block rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
          
              {l.label}
            </Link>
        )}
        </div>
      }
    </nav>);

};

export default Navbar;