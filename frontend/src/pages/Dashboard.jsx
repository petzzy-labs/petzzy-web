import React, { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Navbar } from "../components/Navbar";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { Navigate } from "react-router-dom";
import { PawPrint, Battery, Sun, Thermometer, Cpu, ChevronRight, MapPin } from "lucide-react";

const binIcon = (fill) => {
  const cls = fill > 80 ? "full" : fill > 55 ? "warn" : "";
  return L.divIcon({
    className: "",
    html: `<div class="pz-bin-marker ${cls}">${Math.round(fill)}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const CameraFeed = ({ cam }) => (
  <div className="pz-card overflow-hidden relative pz-scanline" data-testid={`camera-${cam.camera_id}`}>
    <div className="relative">
      <video
        src={cam.video_url}
        poster={cam.poster}
        autoPlay muted loop playsInline
        className="w-full h-56 object-cover bg-black"
      />
      {/* Bounding boxes */}
      <div className="pz-bbox" style={{ left: "22%", top: "38%", width: "34%", height: "44%" }}>{cam.detected[0]} · {cam.confidence}%</div>
      {cam.detected[1] && (
        <div className="pz-bbox" style={{ left: "62%", top: "48%", width: "26%", height: "36%", background: "rgba(144,238,144,0.75)" }}>{cam.detected[1]}</div>
      )}
      <div className="absolute top-3 left-3 flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-white bg-[#0A140E]/70 border border-[#1B3324] px-2.5 py-1 rounded-full">
        <span className="pz-live-dot" /> LIVE · {cam.camera_id}
      </div>
      <div className="absolute top-3 right-3 text-[10px] font-mono text-[#90EE90] bg-[#0A140E]/70 border border-[#1B3324] px-2 py-1 rounded">
        REC {new Date().toLocaleTimeString()}
      </div>
    </div>
    <div className="p-4 flex items-center justify-between">
      <div>
        <div className="text-white font-semibold">{cam.location}</div>
        <div className="text-[11px] tracking-[0.15em] uppercase text-neutral-500">Bin {cam.bin_id}</div>
      </div>
      <div className="text-[#90EE90] font-mono text-sm">dispensing</div>
    </div>
  </div>
);

const BinCard = ({ b }) => {
  const status = b.fill_percent > 80 ? "FULL · needs pickup" : b.fill_percent > 55 ? "Filling up" : "Healthy";
  const color = b.fill_percent > 80 ? "#FF453A" : b.fill_percent > 55 ? "#F5C542" : "#90EE90";
  return (
    <div className="pz-card p-5" data-testid={`bin-card-${b.bin_id}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1B3324] border border-[#264A34] flex items-center justify-center text-[#90EE90] font-mono text-xs">{b.bin_id.split("-")[1]}</div>
          <div>
            <div className="text-white font-semibold">{b.name}</div>
            <div className="text-[11px] tracking-[0.15em] uppercase text-neutral-500 flex items-center gap-1">
              <MapPin size={10} /> {b.lat.toFixed(4)}, {b.lng.toFixed(4)}
            </div>
          </div>
        </div>
        <div className="text-[10px] font-mono px-2 py-1 rounded" style={{ background: `${color}22`, color }}>{status}</div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.15em] text-neutral-400">
          <span>Fill %</span><span className="font-mono text-white">{b.fill_percent}%</span>
        </div>
        <div className="h-1.5 bg-[#0A140E] rounded-full mt-1.5 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${b.fill_percent}%`, background: color }} />
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.15em] text-neutral-400">
          <span>Pellets ready</span><span className="font-mono text-white">{b.pellets_kg} kg</span>
        </div>
        <div className="h-1.5 bg-[#0A140E] rounded-full mt-1.5 overflow-hidden">
          <div className="h-full rounded-full bg-[#90EE90]" style={{ width: `${b.pellet_dispenser_percent}%` }} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 text-[11px]">
        <div className="text-neutral-400 flex items-center gap-1"><Battery size={12} /> {b.battery_percent}%</div>
        <div className="text-neutral-400 flex items-center gap-1"><Sun size={12} /> {b.solar_charging ? "on" : "idle"}</div>
        <div className="text-neutral-400 flex items-center gap-1"><Thermometer size={12} /> {b.temperature_c}°</div>
        <div className="text-neutral-400 flex items-center gap-1"><Cpu size={12} /> ok</div>
      </div>
      <div className="mt-3 text-[11px] text-neutral-500 flex items-center gap-2">
        <PawPrint size={12} className="text-[#90EE90]" /> fed <span className="text-white font-mono">{b.animals_fed_today}</span> animals today
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [bins, setBins] = useState([]);
  const [cams, setCams] = useState([]);

  useEffect(() => {
    const load = () => { api.get("/bins").then((r) => setBins(r.data)).catch(() => {}); };
    load();
    api.get("/cameras").then((r) => setCams(r.data)).catch(() => {});
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, []);

  const stats = useMemo(() => {
    const totalPellets = bins.reduce((s, b) => s + (b.pellets_kg || 0), 0);
    const fedToday = bins.reduce((s, b) => s + (b.animals_fed_today || 0), 0);
    const full = bins.filter((b) => b.fill_percent > 80).length;
    return { totalPellets: totalPellets.toFixed(1), fedToday, full, total: bins.length };
  }, [bins]);

  if (user === undefined) return <div className="pz-hero-bg min-h-screen" />;
  if (user === null) return <Navigate to="/login" replace />;

  return (
    <div className="pz-hero-bg min-h-screen text-white">
      <Toaster />
      <Navbar />
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <span className="pz-chip">USER DASHBOARD</span>
            <h1 className="mt-3 font-[Cabinet_Grotesk] font-extrabold text-4xl md:text-5xl tracking-tight">
              Hey {user.name?.split(" ")[0] || "friend"}. <span className="text-[#90EE90]">Here's your city.</span>
            </h1>
          </div>
          <div className="grid grid-cols-4 gap-3 min-w-[420px]">
            <StatSmall label="Bins" value={stats.total} />
            <StatSmall label="Full" value={stats.full} accent="#FF453A" />
            <StatSmall label="Pellets kg" value={stats.totalPellets} />
            <StatSmall label="Fed today" value={stats.fedToday} />
          </div>
        </div>

        <div className="mt-8 grid lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 pz-card overflow-hidden h-[520px]" data-testid="bin-map">
            <MapContainer center={[13.045, 80.24]} zoom={12} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
              {bins.map((b) => (
                <Marker key={b.bin_id} position={[b.lat, b.lng]} icon={binIcon(b.fill_percent)}>
                  <Popup>
                    <div style={{ color: "#F9F9F6" }}>
                      <div style={{ fontWeight: 700 }}>{b.name}</div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>{b.bin_id}</div>
                      <div style={{ marginTop: 8, fontSize: 13 }}>Fill: {b.fill_percent}%</div>
                      <div style={{ fontSize: 13 }}>Pellets: {b.pellets_kg} kg</div>
                      <div style={{ fontSize: 13 }}>Fed today: {b.animals_fed_today}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="lg:col-span-2 space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {bins.map((b) => <BinCard key={b.bin_id} b={b} />)}
          </div>
        </div>

        <div className="mt-12">
          <div className="flex items-end justify-between">
            <div>
              <span className="pz-chip"><span className="pz-live-dot" /> LIVE AI CAMERAS</span>
              <h2 className="mt-3 font-[Cabinet_Grotesk] font-extrabold text-3xl">Animals eating, right now.</h2>
            </div>
            <div className="text-neutral-400 text-sm flex items-center gap-1">Neural detection · YOLOv8n <ChevronRight size={14} /></div>
          </div>
          <div className="mt-6 grid md:grid-cols-2 xl:grid-cols-4 gap-5">
            {cams.map((c) => <CameraFeed key={c.camera_id} cam={c} />)}
          </div>
        </div>
      </section>
    </div>
  );
}

const StatSmall = ({ label, value, accent = "#90EE90" }) => (
  <div className="pz-card p-3">
    <div className="text-[10px] tracking-[0.2em] uppercase text-neutral-500">{label}</div>
    <div className="font-[Cabinet_Grotesk] text-2xl font-extrabold" style={{ color: accent }}>{value}</div>
  </div>
);

// Placeholder to satisfy Toaster import (added late)
const Toaster = () => null;
