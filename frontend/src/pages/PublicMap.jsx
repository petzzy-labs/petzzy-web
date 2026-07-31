import React, { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Navbar } from "../components/Navbar";
import { api } from "../lib/api";
import { PawPrint, MapPin, Package } from "lucide-react";

const binIcon = (fill) => {
  const cls = fill > 80 ? "full" : fill > 55 ? "warn" : "";
  return L.divIcon({
    className: "",
    html: `<div class="pz-bin-marker ${cls}">${Math.round(fill)}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export default function PublicMap() {
  const [bins, setBins] = useState([]);

  useEffect(() => {
    const load = () => api.get("/bins").then((r) => setBins(r.data)).catch(() => {});
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  const healthy = bins.filter((b) => b.fill_percent <= 55).length;
  const warn = bins.filter((b) => b.fill_percent > 55 && b.fill_percent <= 80).length;
  const full = bins.filter((b) => b.fill_percent > 80).length;

  return (
    <div className="pz-hero-bg min-h-screen text-white">
      <Navbar />
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div className="max-w-2xl">
            <span className="pz-chip"><span className="pz-live-dot" /> PUBLIC MAP · CHENNAI</span>
            <h1 className="mt-3 font-[Cabinet_Grotesk] font-extrabold text-4xl md:text-5xl tracking-tight">
              Find a bin. <span className="text-[#90EE90]">Feed a friend.</span>
            </h1>
            <p className="mt-3 text-neutral-400 leading-relaxed">
              Every green dot is a PETZZY bin ready to dispense pellets. Drop your leftovers, watch a stray get fed.
              No login needed.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Healthy" value={healthy} color="#90EE90" />
            <MiniStat label="Filling" value={warn} color="#F5C542" />
            <MiniStat label="Full" value={full} color="#FF453A" />
          </div>
        </div>

        <div className="mt-8 grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 pz-card overflow-hidden h-[600px]" data-testid="public-bin-map">
            <MapContainer center={[13.045, 80.24]} zoom={12} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
              {bins.map((b) => (
                <Marker key={b.bin_id} position={[b.lat, b.lng]} icon={binIcon(b.fill_percent)}>
                  <Popup>
                    <div style={{ color: "#F9F9F6" }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{b.name}</div>
                      <div style={{ fontSize: 11, opacity: 0.6, fontFamily: "monospace" }}>{b.bin_id}</div>
                      <div style={{ marginTop: 8, fontSize: 13 }}>Pellets: <b>{b.pellets_kg} kg</b></div>
                      <div style={{ fontSize: 13 }}>Fill: {b.fill_percent}%</div>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`}
                        target="_blank" rel="noreferrer"
                        style={{ color: "#90EE90", fontSize: 12, marginTop: 8, display: "inline-block" }}
                      >
                        Directions →
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="pz-card p-6 h-[600px] overflow-y-auto">
            <div className="text-[11px] tracking-[0.2em] uppercase text-neutral-400">Live bins</div>
            <div className="space-y-3 mt-3">
              {bins.map((b) => {
                const color = b.fill_percent > 80 ? "#FF453A" : b.fill_percent > 55 ? "#F5C542" : "#90EE90";
                return (
                  <div key={b.bin_id} className="border border-[#1B3324] rounded-xl p-4 hover:border-[#90EE90] transition-colors" data-testid={`public-bin-${b.bin_id}`}>
                    <div className="flex items-center justify-between">
                      <div className="text-white font-semibold">{b.name}</div>
                      <div className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: `${color}22`, color }}>
                        {b.fill_percent > 80 ? "FULL" : b.fill_percent > 55 ? "FILLING" : "READY"}
                      </div>
                    </div>
                    <div className="text-[11px] text-neutral-500 flex items-center gap-1 mt-1"><MapPin size={10} /> {b.lat.toFixed(4)}, {b.lng.toFixed(4)}</div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-neutral-400"><Package size={12} className="text-[#90EE90]" /> {b.pellets_kg} kg pellets</div>
                      <div className="flex items-center gap-1 text-neutral-400"><PawPrint size={12} className="text-[#90EE90]" /> {b.animals_fed_today} fed today</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const MiniStat = ({ label, value, color }) => (
  <div className="pz-card p-3 min-w-[110px]">
    <div className="text-[10px] tracking-[0.2em] uppercase text-neutral-500">{label}</div>
    <div className="font-[Cabinet_Grotesk] text-2xl font-extrabold" style={{ color }}>{value}</div>
  </div>
);
