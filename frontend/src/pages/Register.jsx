import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../lib/AuthContext";
import { formatApiErrorDetail } from "../lib/api";
import { toast, Toaster } from "sonner";
import { PawPrint } from "lucide-react";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", city: "Chennai" });
  const [busy, setBusy] = useState(false);
  const { register } = useAuth();
  const nav = useNavigate();

  const setField = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await register(form);
      toast.success(`Welcome, ${u.name}! Your account is live.`);
      nav("/dashboard");
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
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-14 grid lg:grid-cols-2 gap-10 items-center">
        <div className="pz-card p-8 md:p-10 max-w-lg mx-auto w-full">
          <span className="pz-chip">SIGN UP</span>
          <h1 className="mt-4 font-[Cabinet_Grotesk] font-extrabold text-4xl">Join Petzzy.</h1>
          <p className="mt-2 text-neutral-400">Every signup is stored on our secure roster (admins can export as Excel).</p>

          <button
            onClick={handleGoogle}
            data-testid="register-google-btn"
            className="mt-6 w-full flex items-center justify-center gap-3 bg-white text-[#0A140E] rounded-full py-3 font-semibold hover:scale-[1.01] transition-transform"
          >
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3 text-neutral-500 text-xs">
            <div className="h-px bg-[#1B3324] flex-1" />OR<div className="h-px bg-[#1B3324] flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input data-testid="reg-name" required placeholder="Full name" value={form.name} onChange={setField("name")}
              className="w-full bg-[#0A140E] border border-[#1B3324] rounded-xl px-4 py-3 focus:border-[#90EE90] focus:outline-none" />
            <input data-testid="reg-email" required type="email" placeholder="Email" value={form.email} onChange={setField("email")}
              className="w-full bg-[#0A140E] border border-[#1B3324] rounded-xl px-4 py-3 focus:border-[#90EE90] focus:outline-none" />
            <input data-testid="reg-password" required type="password" minLength={6} placeholder="Password (min 6 chars)" value={form.password} onChange={setField("password")}
              className="w-full bg-[#0A140E] border border-[#1B3324] rounded-xl px-4 py-3 focus:border-[#90EE90] focus:outline-none" />
            <div className="grid grid-cols-2 gap-3">
              <input data-testid="reg-phone" placeholder="Phone" value={form.phone} onChange={setField("phone")}
                className="w-full bg-[#0A140E] border border-[#1B3324] rounded-xl px-4 py-3 focus:border-[#90EE90] focus:outline-none" />
              <input data-testid="reg-city" placeholder="City" value={form.city} onChange={setField("city")}
                className="w-full bg-[#0A140E] border border-[#1B3324] rounded-xl px-4 py-3 focus:border-[#90EE90] focus:outline-none" />
            </div>
            <button type="submit" disabled={busy} data-testid="register-submit" className="pz-btn-primary w-full disabled:opacity-60">
              {busy ? "Creating..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-sm text-neutral-400 text-center">
            Already registered? <Link to="/login" data-testid="register-goto-login" className="text-[#90EE90] hover:underline">Sign in</Link>
          </p>
        </div>

        <div className="pz-card overflow-hidden hidden lg:block">
          <img src="https://images.unsplash.com/photo-1721902187342-ab4e59f36d9b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNDR8MHwxfHNlYXJjaHwyfHxzdHJheSUyMGRvZ3MlMjBzdHJlZXR8ZW58MHx8fHwxNzg1NDc1NjIzfDA&ixlib=rb-4.1.0&q=85" alt="Strays" className="w-full h-[560px] object-cover" />
          <div className="p-6 border-t border-[#1B3324]">
            <PawPrint className="text-[#90EE90]" />
            <div className="mt-2 font-[Cabinet_Grotesk] text-2xl font-bold">Every account helps a paw.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
