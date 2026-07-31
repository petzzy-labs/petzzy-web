import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { PawPrint, LogOut, LayoutDashboard, ShieldCheck, Menu, X } from "lucide-react";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const NavLink = ({ to, label, testId, onClick }) => (
    <Link
      to={to}
      data-testid={testId}
      onClick={onClick}
      className={`text-sm transition-colors ${pathname === to ? "text-[#90EE90]" : "text-neutral-300 hover:text-[#90EE90]"}`}
    >
      {label}
    </Link>
  );

  return (
    <header className="pz-glass sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-2">
        <Link to="/" data-testid="nav-logo" className="flex items-center gap-2 group shrink-0">
          <span className="w-9 h-9 rounded-full bg-[#90EE90] flex items-center justify-center text-[#0A140E] shadow-[0_0_20px_rgba(144,238,144,0.4)]">
            <PawPrint size={18} strokeWidth={2.5} />
          </span>
          <span className="font-[Cabinet_Grotesk] font-extrabold tracking-tight text-xl text-white">PETZZY</span>
          <span className="hidden xl:inline-block pz-chip ml-2">Feed. Recycle. Repeat.</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <NavLink to="/" label="Home" testId="nav-home" />
          <NavLink to="/about" label="About Us" testId="nav-about" />
          <NavLink to="/map" label="Live Map" testId="nav-map" />
          <NavLink to="/sponsors" label="Sponsors" testId="nav-sponsors" />
          <a href="/#tech" data-testid="nav-tech" className="text-sm text-neutral-300 hover:text-[#90EE90]">Tech</a>
        </nav>

        <div className="hidden md:flex items-center gap-2">
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

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          data-testid="nav-menu-toggle"
          aria-label="Toggle navigation"
          className="md:hidden w-10 h-10 rounded-full border border-[#1B3324] text-white flex items-center justify-center hover:border-[#90EE90] hover:text-[#90EE90] transition-colors"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-[#1B3324] pz-glass" data-testid="nav-mobile-panel">
          <div className="px-4 py-5 flex flex-col gap-4">
            <NavLink to="/" label="Home" testId="nav-home-m" onClick={() => setOpen(false)} />
            <NavLink to="/about" label="About Us" testId="nav-about-m" onClick={() => setOpen(false)} />
            <NavLink to="/map" label="Live Map" testId="nav-map-m" onClick={() => setOpen(false)} />
            <NavLink to="/sponsors" label="Sponsors" testId="nav-sponsors-m" onClick={() => setOpen(false)} />
            <a href="/#tech" data-testid="nav-tech-m" onClick={() => setOpen(false)} className="text-sm text-neutral-300 hover:text-[#90EE90]">Tech</a>

            <div className="h-px bg-[#1B3324] my-1" />

            {user ? (
              <>
                <Link to="/dashboard" data-testid="nav-dashboard-m" onClick={() => setOpen(false)} className="pz-btn-ghost !py-2 !px-4 flex items-center gap-2 text-sm justify-center">
                  <LayoutDashboard size={15} /> Dashboard
                </Link>
                {user.role === "admin" && (
                  <Link to="/admin" data-testid="nav-admin-m" onClick={() => setOpen(false)} className="pz-btn-ghost !py-2 !px-4 flex items-center gap-2 text-sm justify-center">
                    <ShieldCheck size={15} /> Admin
                  </Link>
                )}
                <button
                  onClick={async () => { setOpen(false); await logout(); nav("/"); }}
                  data-testid="nav-logout-m"
                  className="pz-btn-ghost !py-2 !px-4 flex items-center gap-2 text-sm justify-center"
                >
                  <LogOut size={15} /> Logout
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" data-testid="nav-login-m" onClick={() => setOpen(false)} className="pz-btn-ghost !py-2 !px-4 text-sm text-center">Login</Link>
                <Link to="/register" data-testid="nav-register-m" onClick={() => setOpen(false)} className="pz-btn-primary !py-2 !px-4 text-sm text-center">Register</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
