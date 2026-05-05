import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, LogOut, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getInitials, getAvatarColor } from "@/utils/helpers";

const AppSidebar = ({ links, open, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      {/* Overlay for mobile */}
      {open &&
      <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={onClose} />
      }

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sidebar-border p-4">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            <span className="text-lg font-bold">Unimeet</span>
          </Link>
          <button onClick={onClose} className="lg:hidden" aria-label="Close sidebar">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User info */}
        {user &&
        <div className="border-b border-sidebar-border p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${getAvatarColor(user.name)} text-card`}>
                {getInitials(user.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <span className="inline-block rounded-full bg-sidebar-accent px-2 py-0.5 text-xs capitalize">{user.role}</span>
              </div>
            </div>
          </div>
        }

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {links.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ?
                "bg-sidebar-primary text-sidebar-primary-foreground" :
                "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`
                }>
                
                {link.icon}
                <span className="flex-1">{link.label}</span>
                {link.badge !== undefined && link.badge > 0 &&
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground">
                    {link.badge}
                  </span>
                }
              </Link>);

          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
            
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
    </>);

};

export default AppSidebar;