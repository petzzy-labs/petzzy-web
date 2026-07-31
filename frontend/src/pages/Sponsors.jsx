import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { api } from "../lib/api";
import { Sparkles, ChevronRight, HandCoins } from "lucide-react";

export default function Sponsors() {
  const [sponsors, setSponsors] = useState([]);
  useEffect(() => { api.get("/sponsors").then((r) => setSponsors(r.data)).catch(() => {}); }, []);

  return (
    <div className="pz-hero-bg min-h-screen text-white">
      <Navbar />
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
        <span className="pz-chip"><HandCoins size={12} /> CSR SPONSORS</span>
        <h1 className="mt-3 font-[Cabinet_Grotesk] font-extrabold text-4xl md:text-6xl tracking-tight">
          Powered by <span className="text-[#90EE90]">good companies.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-neutral-400 leading-relaxed">
          These teams put their CSR rupees behind live PETZZY bins across Chennai. Click any partner to see the exact bins they fund and the impact those bins have created.
        </p>

        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sponsors.map((s) => (
            <Link key={s.slug} to={`/sponsors/${s.slug}`} data-testid={`sponsor-card-${s.slug}`} className="pz-card p-0 overflow-hidden group">
              <div className="h-44 overflow-hidden relative">
                <img src={s.hero_url} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A140E] to-transparent" />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-[#90EE90]">
                  <Sparkles size={12} /> {s.bin_ids.length} BINS FUNDED
                </div>
                <div className="mt-3 text-2xl font-[Cabinet_Grotesk] font-bold text-white">{s.name}</div>
                <div className="mt-1 text-neutral-400 text-sm">{s.tagline}</div>
                <div className="mt-4 text-[#90EE90] text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  View impact <ChevronRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 pz-card p-10 grid lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2">
            <h3 className="font-[Cabinet_Grotesk] text-3xl font-bold">Want your logo on the map?</h3>
            <p className="mt-3 text-neutral-400 leading-relaxed">
              Sponsor a PETZZY bin as part of your CSR mandate. Every unit shows your brand, comes with a live impact
              dashboard, and gets a public sponsor page like the ones above.
            </p>
          </div>
          <a href="mailto:hello@petzzy.com" data-testid="sponsors-cta" className="pz-btn-primary text-center">Become a sponsor</a>
        </div>
      </section>
    </div>
  );
}
