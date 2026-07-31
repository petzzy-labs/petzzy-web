import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { toast, Toaster } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";

export default function AuthCallback() {
  const { exchangeGoogleSession } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("Processing Google login...");
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const hash = location.hash || window.location.hash || "";
    const match = hash.match(/session_id=([^&]+)/);
    if (!match) { nav("/login"); return; }
    const sid = decodeURIComponent(match[1]);
    // clear hash
    if (window.history?.replaceState) {
      window.history.replaceState(null, "", window.location.pathname);
    }
    exchangeGoogleSession(sid)
      .then((u) => {
        toast.success(`Welcome, ${u.name || u.email}!`);
        nav(u.role === "admin" ? "/admin" : "/dashboard");
      })
      .catch((e) => {
        setStatus("Google sign-in failed. Redirecting...");
        setTimeout(() => nav("/login"), 1500);
      });
  }, [exchangeGoogleSession, nav, location.hash]);

  return (
    <div className="pz-hero-bg min-h-screen text-white flex items-center justify-center">
      <Toaster theme="dark" />
      <div className="pz-card p-10 text-center">
        <div className="pz-live-dot mx-auto" />
        <div className="mt-4 text-lg">{status}</div>
      </div>
    </div>
  );
}
