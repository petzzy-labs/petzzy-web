import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../lib/AuthContext";
import { formatApiErrorDetail } from "../lib/api";
import { toast, Toaster } from "sonner";
import { PawPrint, Mail, Lock } from "lucide-react";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.8 32.9 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.9 2.9l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.6 18.9 12 24 12c3 0 5.7 1.1 7.9 2.9l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 34.7 26.7 36 24 36c-5.4 0-9.8-3.1-11.3-7.9l-6.5 5C9.4 39.6 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.7 2-2 3.7-3.7 4.9l6.2 5.2C41.6 34.6 44 29.8 44 24c0-1.2-.1-2.4-.4-3.5z"/>
  </svg>
);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(email, password);
      toast.success(`Welcome back, ${u.name || u.email}!`);
      nav(u.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="pz-hero-bg min-h-screen text-white">
      <Toaster theme="dark" position="top-right" />
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-16 grid lg:grid-cols-2 gap-10 items-center">
        <div className="pz-card overflow-hidden hidden lg:block">
          <img src="https://images.unsplash.com/photo-1760210042929-70a2f7706363?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzV8MHwxfHNlYXJjaHw0fHxwdXBwaWVzJTIwcGxheWluZyUyMG91dGRvb3JzfGVufDB8fHx8MTc4NTQ3NTYyM3ww&ixlib=rb-4.1.0&q=85" alt="Puppies" className="w-full h-[560px] object-cover" />
          <div className="p-6 border-t border-[#1B3324]">
            <PawPrint className="text-[#90EE90]" />
            <div className="mt-2 font-[Cabinet_Grotesk] text-2xl font-bold">Every login feeds a paw.</div>
            <div className="mt-1 text-neutral-400 text-sm">Signing in helps us count real people behind the mission.</div>
          </div>
        </div>

        <div className="pz-card p-8 md:p-10 max-w-md mx-auto w-full">
          <span className="pz-chip">SIGN IN</span>
          <h1 className="mt-4 font-[Cabinet_Grotesk] font-extrabold text-4xl">Welcome back.</h1>
          <p className="mt-2 text-neutral-400">Log in to see live bins and camera feeds.</p>

          <button
            onClick={handleGoogle}
            data-testid="login-google-btn"
            className="mt-6 w-full flex items-center justify-center gap-3 bg-white text-[#0A140E] rounded-full py-3 font-semibold hover:scale-[1.01] transition-transform"
          >
            <GoogleIcon /> Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3 text-neutral-500 text-xs">
            <div className="h-px bg-[#1B3324] flex-1" />
            OR
            <div className="h-px bg-[#1B3324] flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-400 flex items-center gap-2"><Mail size={12} /> Email</span>
              <input
                data-testid="login-email"
                type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full bg-[#0A140E] border border-[#1B3324] rounded-xl px-4 py-3 text-white focus:border-[#90EE90] focus:outline-none"
                placeholder="you@example.com"
              />
            </label>
            <label className="block">
              <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-400 flex items-center gap-2"><Lock size={12} /> Password</span>
              <input
                data-testid="login-password"
                type="password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full bg-[#0A140E] border border-[#1B3324] rounded-xl px-4 py-3 text-white focus:border-[#90EE90] focus:outline-none"
                placeholder="••••••••"
              />
            </label>
            <button
              type="submit" disabled={busy}
              data-testid="login-submit"
              className="pz-btn-primary w-full disabled:opacity-60"
            >
              {busy ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-sm text-neutral-400 text-center">
            New user?{" "}
            <Link to="/register" data-testid="login-goto-register" className="text-[#90EE90] hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
