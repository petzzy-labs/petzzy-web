import React, { useEffect, useMemo, useState } from "react";
import { Navbar } from "../components/Navbar";
import { api, API_BASE } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { Navigate } from "react-router-dom";
import { toast, Toaster } from "sonner";
import { Download, RefreshCw, Users, Trash2, ShieldCheck, BatteryCharging, Bell } from "lucide-react";

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [bins, setBins] = useState([]);
  const [tab, setTab] = useState("bins");

  const loadAll = () => {
    api.get("/admin/users").then((r) => setUsers(r.data)).catch(() => {});
    api.get("/admin/bins").then((r) => setBins(r.data)).catch(() => {});
  };

  useEffect(() => {
    if (user?.role === "admin") loadAll();
  }, [user]);

  const stats = useMemo(() => {
    const full = bins.filter((b) => b.fill_percent > 80).length;
    const pellets = bins.reduce((s, b) => s + (b.pellets_kg || 0), 0);
    const fed = bins.reduce((s, b) => s + (b.animals_fed_today || 0), 0);
    return { full, pellets: pellets.toFixed(1), fed, users: users.length };
  }, [bins, users]);

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("petzzy_token");
      const res = await fetch(`${API_BASE}/admin/users/export`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "petzzy_users.xlsx"; a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Excel downloaded");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const refill = async (bin_id) => {
    try {
      await api.post(`/admin/bins/${bin_id}/refill`, { pellets_added_kg: 20 });
      toast.success(`Bin ${bin_id} scheduled for refill`);
      loadAll();
    } catch (e) {
      toast.error("Refill failed");
    }
  };

  const runAlerts = async () => {
    try {
      const { data } = await api.post("/admin/alerts/check");
      const count = data.alerted?.length || 0;
      const skipped = data.skipped_already_alerted?.length || 0;
      const sim = !data.email_key_configured;
      if (count === 0 && skipped === 0) {
        toast.info("No bins over 90% right now. All calm.");
      } else if (count === 0 && skipped > 0) {
        toast.info(`${skipped} bin(s) over 90% already alerted since last refill.`);
      } else {
        toast.success(`${count} new alert(s) ${sim ? "SIMULATED (set EMERGENT_EMAIL_KEY)" : "sent"} to ${data.recipients.join(", ")}${skipped ? ` · ${skipped} already-alerted skipped` : ""}`);
      }
    } catch (e) {
      toast.error("Alert check failed");
    }
  };

  if (user === undefined) return <div className="pz-hero-bg min-h-screen" />;
  if (user === null || user.role !== "admin") return <Navigate to="/login" replace />;

  return (
    <div className="pz-hero-bg min-h-screen text-white">
      <Toaster theme="dark" position="top-right" />
      <Navbar />
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <span className="pz-chip"><ShieldCheck size={12} /> MANAGEMENT PORTAL</span>
            <h1 className="mt-3 font-[Cabinet_Grotesk] font-extrabold text-4xl md:text-5xl tracking-tight">
              Ops Console
            </h1>
            <p className="mt-2 text-neutral-400">Fleet health, roster of signups, and Excel exports for CSR reports.</p>
          </div>
          <div className="flex gap-2">
            <button data-testid="admin-run-alerts" onClick={runAlerts} className="pz-btn-ghost flex items-center gap-2 text-sm"><Bell size={14} /> Run Alerts (&gt;90%)</button>
            <button data-testid="admin-refresh" onClick={loadAll} className="pz-btn-ghost flex items-center gap-2 text-sm"><RefreshCw size={14} /> Refresh</button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Registered users" value={stats.users} Icon={Users} />
          <StatCard label="Bins full" value={stats.full} Icon={Trash2} accent="#FF453A" />
          <StatCard label="Pellets ready" value={`${stats.pellets} kg`} Icon={BatteryCharging} />
          <StatCard label="Animals fed today" value={stats.fed} Icon={ShieldCheck} />
        </div>

        <div className="mt-8 flex gap-2">
          <TabBtn active={tab === "bins"} onClick={() => setTab("bins")} testId="admin-tab-bins">Bins</TabBtn>
          <TabBtn active={tab === "users"} onClick={() => setTab("users")} testId="admin-tab-users">Users</TabBtn>
        </div>

        {tab === "bins" && (
          <div className="mt-5 pz-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#0F1F16] text-neutral-400 text-[11px] uppercase tracking-[0.15em]">
                  <tr>
                    <th className="text-left px-5 py-3">Bin</th>
                    <th className="text-left px-5 py-3">Location · GPS</th>
                    <th className="text-left px-5 py-3">Fill %</th>
                    <th className="text-left px-5 py-3">Pellets</th>
                    <th className="text-left px-5 py-3">Battery</th>
                    <th className="text-left px-5 py-3">Fed</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-left px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bins.map((b) => {
                    const color = b.fill_percent > 80 ? "#FF453A" : b.fill_percent > 55 ? "#F5C542" : "#90EE90";
                    return (
                      <tr key={b.bin_id} className="border-t border-[#1B3324] hover:bg-[#0F1F16]" data-testid={`admin-bin-${b.bin_id}`}>
                        <td className="px-5 py-3 font-mono text-[#90EE90]">{b.bin_id}</td>
                        <td className="px-5 py-3">
                          <div className="text-white">{b.name}</div>
                          <div className="text-neutral-500 text-xs font-mono">{b.lat.toFixed(4)}, {b.lng.toFixed(4)}</div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 rounded-full bg-[#0A140E] overflow-hidden">
                              <div className="h-full" style={{ width: `${b.fill_percent}%`, background: color }} />
                            </div>
                            <span className="font-mono text-white">{b.fill_percent}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-mono">{b.pellets_kg} kg</td>
                        <td className="px-5 py-3 font-mono">{b.battery_percent}%</td>
                        <td className="px-5 py-3">{b.animals_fed_today}</td>
                        <td className="px-5 py-3">
                          {b.fill_percent > 80
                            ? <span className="text-[#FF453A] text-xs">DISPATCH</span>
                            : <span className="text-[#90EE90] text-xs">HEALTHY</span>}
                        </td>
                        <td className="px-5 py-3">
                          <button data-testid={`admin-refill-${b.bin_id}`} onClick={() => refill(b.bin_id)} className="pz-btn-ghost !py-1.5 !px-3 text-xs">Refill pellets</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <div className="text-neutral-400 text-sm">{users.length} registered users · downloadable roster for CSR reporting</div>
              <button data-testid="admin-export-excel" onClick={handleExport} className="pz-btn-primary flex items-center gap-2">
                <Download size={16} /> Download Excel
              </button>
            </div>
            <div className="mt-4 pz-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#0F1F16] text-neutral-400 text-[11px] uppercase tracking-[0.15em]">
                    <tr>
                      <th className="text-left px-5 py-3">Name</th>
                      <th className="text-left px-5 py-3">Email</th>
                      <th className="text-left px-5 py-3">Phone</th>
                      <th className="text-left px-5 py-3">City</th>
                      <th className="text-left px-5 py-3">Auth</th>
                      <th className="text-left px-5 py-3">Role</th>
                      <th className="text-left px-5 py-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.user_id} className="border-t border-[#1B3324] hover:bg-[#0F1F16]" data-testid={`admin-user-${u.user_id}`}>
                        <td className="px-5 py-3 text-white">{u.name || "—"}</td>
                        <td className="px-5 py-3 font-mono text-[#90EE90]">{u.email}</td>
                        <td className="px-5 py-3 text-neutral-400">{u.phone || "—"}</td>
                        <td className="px-5 py-3 text-neutral-400">{u.city || "—"}</td>
                        <td className="px-5 py-3 text-neutral-400">{u.auth_provider}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-1 rounded ${u.role === "admin" ? "bg-[#90EE90]/20 text-[#90EE90]" : "bg-[#1B3324] text-neutral-300"}`}>{u.role}</span>
                        </td>
                        <td className="px-5 py-3 text-neutral-500 font-mono text-xs">{(u.created_at || "").slice(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

const TabBtn = ({ active, onClick, children, testId }) => (
  <button data-testid={testId} onClick={onClick} className={`px-4 py-2 rounded-full text-sm border transition-colors ${active ? "bg-[#90EE90] text-[#0A140E] border-[#90EE90]" : "bg-transparent text-neutral-300 border-[#1B3324] hover:border-[#90EE90]"}`}>{children}</button>
);

const StatCard = ({ label, value, Icon, accent = "#90EE90" }) => (
  <div className="pz-card p-5">
    <div className="flex items-center justify-between">
      <div className="text-[11px] tracking-[0.2em] uppercase text-neutral-400">{label}</div>
      <Icon size={16} style={{ color: accent }} />
    </div>
    <div className="mt-2 font-[Cabinet_Grotesk] font-extrabold text-3xl" style={{ color: accent }}>{value}</div>
  </div>
);
