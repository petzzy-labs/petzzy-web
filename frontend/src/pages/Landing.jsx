import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { api } from "../lib/api";
import { PawPrint, Recycle, Bot, MapPin, Sun, Cpu, Cctv, Package, Building2, Mail, Phone, Sparkles, ChevronRight } from "lucide-react";

const Stat = ({ label, value, unit }) => (
  <div className="pz-card p-6" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
    <div className="text-[11px] tracking-[0.2em] uppercase text-neutral-400">{label}</div>
    <div className="mt-2 flex items-baseline gap-1.5">
      <span className="font-[Cabinet_Grotesk] font-extrabold text-4xl text-[#90EE90]">{value}</span>
      {unit && <span className="text-sm text-neutral-400 font-mono">{unit}</span>}
    </div>
  </div>
);

const Feature = ({ Icon, title, desc, testId }) => (
  <div className="pz-card p-7 relative overflow-hidden group" data-testid={testId}>
    <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-[#90EE90]/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="w-11 h-11 rounded-2xl bg-[#1B3324] flex items-center justify-center text-[#90EE90] border border-[#264A34]">
      <Icon size={20} />
    </div>
    <h3 className="mt-5 text-xl font-bold text-white">{title}</h3>
    <p className="mt-2 text-neutral-400 text-[15px] leading-relaxed">{desc}</p>
  </div>
);

export default function Landing() {
  const [stats, setStats] = useState({ total_bins: 10, animals_fed_today: 132, waste_recycled_kg: 780, total_pellets_kg: 96 });
  useEffect(() => { api.get("/stats").then((r) => setStats(r.data)).catch(() => {}); }, []);

  return (
    <div className="pz-hero-bg min-h-screen text-white">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pz-grid-bg absolute inset-0 opacity-40 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-24 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <span className="pz-chip"><span className="pz-live-dot" /> LIVE IN CHENNAI · {stats.total_bins} BINS</span>
            <h1 className="mt-6 font-[Cabinet_Grotesk] font-extrabold text-5xl md:text-6xl lg:text-7xl leading-[1.02] tracking-tighter">
              Turning food waste <br/>
              into <span className="text-[#90EE90]">wagging tails.</span>
            </h1>
            <p className="mt-6 text-lg text-neutral-300 max-w-xl leading-relaxed">
              PETZZY is an AI + IoT smart bin that recycles edible leftovers into safe pellets and
              dispenses them to street dogs, cats and birds — while your city stays cleaner.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" data-testid="hero-get-started" className="pz-btn-primary flex items-center gap-2">
                Get Started <ChevronRight size={18} />
              </Link>
              <a href="#tech" data-testid="hero-learn-more" className="pz-btn-ghost">See the tech</a>
            </div>

            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Bins live" value={stats.total_bins} />
              <Stat label="Fed today" value={stats.animals_fed_today} />
              <Stat label="Recycled" value={stats.waste_recycled_kg} unit="kg" />
              <Stat label="Pellets" value={stats.total_pellets_kg} unit="kg" />
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="pz-card overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1760210042929-70a2f7706363?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzV8MHwxfHNlYXJjaHw0fHxwdXBwaWVzJTIwcGxheWluZyUyMG91dGRvb3JzfGVufDB8fHx8MTc4NTQ3NTYyM3ww&ixlib=rb-4.1.0&q=85"
                alt="Puppies playing outdoors"
                className="w-full h-[440px] object-cover"
              />
              <div className="p-5 border-t border-[#1B3324] flex items-center justify-between">
                <div>
                  <div className="text-[11px] tracking-[0.2em] uppercase text-neutral-400">Meet the mission</div>
                  <div className="text-white font-semibold mt-1">62M kids on 4 legs. One clean city.</div>
                </div>
                <PawPrint className="text-[#90EE90]" />
              </div>
            </div>

            <div className="pz-card absolute -bottom-8 -left-6 hidden md:block p-4 w-64">
              <div className="flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-neutral-400">
                <span className="pz-live-dot" /> AI CAM · MYLAPORE
              </div>
              <div className="mt-2 text-sm text-white">Puppy detected · 98%</div>
              <div className="mt-1 font-mono text-xs text-[#90EE90]">dispensing 120g pellets</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES / TECH */}
      <section id="tech" className="border-t border-[#1B3324]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
          <div className="max-w-2xl">
            <span className="pz-chip">HOW IT WORKS</span>
            <h2 className="mt-4 font-[Cabinet_Grotesk] font-extrabold text-4xl md:text-5xl tracking-tight">
              A bin that <span className="text-[#90EE90]">thinks, sorts, and feeds.</span>
            </h2>
            <p className="mt-4 text-neutral-400 leading-relaxed">
              Every PETZZY unit is a small food-waste micro-factory. It inspects, decides, processes,
              and dispenses — powered by the sun and monitored from the cloud.
            </p>
          </div>

          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            <Feature testId="feat-ai" Icon={Bot} title="AI Food Safety" desc="Cameras and pH sensors check each drop to separate edible food from anything unsafe or spoiled." />
            <Feature testId="feat-pellet" Icon={Package} title="Grind → Dry → Pellet" desc="Safe scraps get shredded, dried and pressed into shelf-stable pellets ready to dispense." />
            <Feature testId="feat-cam" Icon={Cctv} title="Animal Detection Cam" desc="An on-device AI recognises dogs, cats and birds and triggers dispensing when they arrive." />
            <Feature testId="feat-gps" Icon={MapPin} title="GPS Fleet Tracking" desc="Every bin reports its location live — smart maintenance routes are auto-planned." />
            <Feature testId="feat-solar" Icon={Sun} title="Solar Powered" desc="Rooftop solar keeps the bin, camera and IoT alive with near-zero electricity cost." />
            <Feature testId="feat-iot" Icon={Cpu} title="IoT Dashboard" desc="Bin fill, pellet level, battery, sensor health and animals-fed count stream to the cloud." />
          </div>
        </div>
      </section>

      {/* MID CTA / IMAGERY */}
      <section className="border-t border-[#1B3324]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="pz-card overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1721902187342-ab4e59f36d9b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNDR8MHwxfHNlYXJjaHwyfHxzdHJheSUyMGRvZ3MlMjBzdHJlZXR8ZW58MHx8fHwxNzg1NDc1NjIzfDA&ixlib=rb-4.1.0&q=85"
              alt="Street dogs" className="w-full h-[420px] object-cover" />
          </div>
          <div>
            <span className="pz-chip"><Sparkles size={12} /> Dual impact</span>
            <h2 className="mt-4 font-[Cabinet_Grotesk] font-extrabold text-4xl md:text-5xl tracking-tight">
              A cleaner city. <br/>A kinder street.
            </h2>
            <p className="mt-5 text-neutral-400 leading-relaxed">
              India throws out 160,000 tonnes of biodegradable food waste every day — while millions
              of stray animals go hungry. PETZZY is the smart bin that closes the loop, one leftover at a time.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              <Stat label="Cities live" value={1} />
              <Stat label="RWAs onboard" value={4} />
              <Stat label="CSR partners" value={2} />
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="border-t border-[#1B3324]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <span className="pz-chip">GET IN TOUCH</span>
            <h2 className="mt-4 font-[Cabinet_Grotesk] font-extrabold text-3xl">Bring PETZZY to your city.</h2>
            <p className="mt-3 text-neutral-400">Municipal, CSR, hostel or apartment — talk to us.</p>
          </div>
          <div className="lg:col-span-2 grid md:grid-cols-3 gap-4">
            <div className="pz-card p-6"><Building2 className="text-[#90EE90]" /> <div className="mt-3 text-neutral-400 text-sm">HQ</div><div className="text-white">Chennai, India</div></div>
            <div className="pz-card p-6"><Mail className="text-[#90EE90]" /><div className="mt-3 text-neutral-400 text-sm">Email</div><div className="text-white">hello@petzzy.com</div></div>
            <div className="pz-card p-6"><Phone className="text-[#90EE90]" /><div className="mt-3 text-neutral-400 text-sm">Phone</div><div className="text-white">+91 900 000 0000</div></div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#1B3324]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 flex items-center justify-between text-neutral-500 text-sm">
          <div className="flex items-center gap-2"><Recycle size={14} /> PETZZY · Feed. Recycle. Repeat.</div>
          <div className="font-mono">© {new Date().getFullYear()} Petzzy Labs</div>
        </div>
      </footer>
    </div>
  );
}
