import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { PawPrint, LogOut, LayoutDashboard, ShieldCheck } from "lucide-react";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();

  const NavLink = ({ to, label, testId }) => (
    <Link
      to={to}
      data-testid={testId}
      className={`text-sm transition-colors ${pathname === to ? "text-[#90EE90]" : "text-neutral-300 hover:text-[#90EE90]"}`}
    >
      {label}
    </Link>
  );

  return (
    <header className="pz-glass sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" data-testid="nav-logo" className="flex items-center gap-2.5 group">
          <span className="w-9 h-9 rounded-full bg-[#90EE90] flex items-center justify-center text-[#0A140E] shadow-[0_0_20px_rgba(144,238,144,0.4)]">
            <PawPrint size={18} strokeWidth={2.5} />
          </span>
          <span className="font-[Cabinet_Grotesk] font-extrabold tracking-tight text-xl text-white">
            PETZZY
          </span>
          <span className="hidden md:inline-block pz-chip ml-2">Feed. Recycle. Repeat.</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <NavLink to="/" label="Home" testId="nav-home" />
          <NavLink to="/about" label="About Us" testId="nav-about" />
          <NavLink to="/map" label="Live Map" testId="nav-map" />
          <NavLink to="/sponsors" label="Sponsors" testId="nav-sponsors" />
          <a href="/#tech" data-testid="nav-tech" className="text-sm text-neutral-300 hover:text-[#90EE90]">Tech</a>
        </nav>

        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              <Link to="/dashboard" data-testid="nav-dashboard" className="pz-btn-ghost !py-2 !px-4 flex items-center gap-2 text-sm">
                <LayoutDashboard size={15} /> Dashboard
              </Link>
              {user.role === "admin" && (
                <Link to="/admin" data-testid="nav-admin" className="pz-btn-ghost !py-2 !px-4 flex items-center gap-2 text-sm">
                  <ShieldCheck size={15} /> Admin
                </Link>
              )}
              <button
                onClick={async () => { await logout(); nav("/"); }}
                data-testid="nav-logout"
                className="pz-btn-ghost !py-2 !px-4 flex items-center gap-2 text-sm"
              >
                <LogOut size={15} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" data-testid="nav-login" className="pz-btn-ghost !py-2 !px-4 text-sm">Login</Link>
              <Link to="/register" data-testid="nav-register" className="pz-btn-primary !py-2 !px-4 text-sm">Register</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
