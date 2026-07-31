import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Navbar } from "../components/Navbar";
import { api } from "../lib/api";
import { ArrowLeft, ExternalLink, PawPrint, Recycle, Package, MapPin } from "lucide-react";

export default function SponsorDetail() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.get(`/sponsors/${slug}`)
      .then((r) => setData(r.data))
      .catch((e) => setErr(e.response?.data?.detail || "Not found"));
  }, [slug]);

  if (err) return (
    <div className="pz-hero-bg min-h-screen text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h1 className="font-[Cabinet_Grotesk] text-4xl font-bold">Sponsor not found.</h1>
        <Link to="/sponsors" className="mt-4 inline-block pz-btn-ghost">Back to sponsors</Link>
      </div>
    </div>
  );
  if (!data) return <div className="pz-hero-bg min-h-screen" />;

  const { sponsor, bins, impact } = data;
  const center = bins.length ? [bins[0].lat, bins[0].lng] : [13.045, 80.24];

  return (
    <div className="pz-hero-bg min-h-screen text-white">
      <Navbar />

      <section className="relative">
        <div className="h-64 md:h-96 overflow-hidden relative">
          <img src={sponsor.hero_url} alt={sponsor.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A140E] via-[#0A140E]/60 to-transparent" />
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 -mt-20 relative z-10">
          <Link to="/sponsors" className="pz-chip inline-flex" data-testid="sponsor-back"><ArrowLeft size={12} /> ALL SPONSORS</Link>
          <div className="mt-4 flex items-end justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-[Cabinet_Grotesk] font-extrabold text-5xl md:text-6xl tracking-tight" data-testid="sponsor-name">{sponsor.name}</h1>
              <p className="mt-2 text-[#90EE90] text-lg">{sponsor.tagline}</p>
            </div>
            {sponsor.website && (
              <a href={sponsor.website} target="_blank" rel="noreferrer" className="pz-btn-ghost flex items-center gap-2 text-sm" data-testid="sponsor-website">
                Visit website <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-14 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <span className="pz-chip">ABOUT THE PARTNERSHIP</span>
          <p className="mt-4 text-neutral-300 text-lg leading-relaxed">{sponsor.description}</p>

          <h3 className="mt-12 font-[Cabinet_Grotesk] text-2xl font-bold">Bins funded ({bins.length})</h3>
          <div className="mt-4 pz-card overflow-hidden h-[400px]">
            <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />
              {bins.map((b) => (
                <Marker key={b.bin_id} position={[b.lat, b.lng]} icon={L.divIcon({ className: "", html: `<div class="pz-bin-marker">${b.bin_id.split("-")[1]}</div>`, iconSize: [32, 32], iconAnchor: [16, 16] })}>
                  <Popup>
                    <div style={{ color: "#F9F9F6", fontWeight: 700 }}>{b.name}</div>
                    <div style={{ color: "#F9F9F6", fontSize: 12 }}>{b.pellets_kg} kg pellets · {b.animals_fed_today} fed today</div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="mt-4 grid md:grid-cols-2 gap-3">
            {bins.map((b) => (
              <div key={b.bin_id} className="pz-card p-4" data-testid={`sponsor-bin-${b.bin_id}`}>
                <div className="flex items-center justify-between">
                  <div className="text-white font-semibold">{b.name}</div>
                  <div className="font-mono text-[#90EE90] text-xs">{b.bin_id}</div>
                </div>
                <div className="text-[11px] text-neutral-500 flex items-center gap-1 mt-1"><MapPin size={10} /> {b.lat.toFixed(4)}, {b.lng.toFixed(4)}</div>
                <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
                  <span><Package size={12} className="inline text-[#90EE90]" /> {b.pellets_kg} kg</span>
                  <span><PawPrint size={12} className="inline text-[#90EE90]" /> {b.animals_fed_today} fed</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <span className="pz-chip">IMPACT · LIVE</span>
          <ImpactCard label="Bins funded" value={impact.bins_funded} unit="units" testId="impact-bins" />
          <ImpactCard label="Waste recycled" value={impact.waste_recycled_kg} unit="kg (30 days)" testId="impact-waste" />
          <ImpactCard label="Pellets ready" value={impact.pellets_ready_kg} unit="kg" testId="impact-pellets" />
          <ImpactCard label="Est. animals fed" value={impact.animals_fed_total} unit="per month" testId="impact-fed" />

          <div className="pz-card p-6 mt-6">
            <Recycle className="text-[#90EE90]" />
            <div className="mt-3 text-lg font-semibold">Feed. Recycle. Repeat.</div>
            <div className="text-sm text-neutral-400 mt-1">Impact numbers update in real time from bin telemetry.</div>
          </div>
        </aside>
      </section>
    </div>
  );
}

const ImpactCard = ({ label, value, unit, testId }) => (
  <div className="pz-card p-5" data-testid={testId}>
    <div className="text-[11px] tracking-[0.2em] uppercase text-neutral-400">{label}</div>
    <div className="mt-1 flex items-baseline gap-2">
      <span className="font-[Cabinet_Grotesk] font-extrabold text-3xl text-[#90EE90]">{value}</span>
      <span className="text-xs font-mono text-neutral-500">{unit}</span>
    </div>
  </div>
);
