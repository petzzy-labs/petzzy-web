import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { api } from "../lib/api";
import { StaggerList, StaggerItem, RevealImage, featureFadeUp, fadeUp, motion } from "../lib/motion";
import { PawPrint, Recycle, Bot, MapPin, Sun, Cpu, Cctv, Package, Building2, Mail, Phone, Sparkles, ChevronRight, HandCoins } from "lucide-react";

const Stat = ({ label, value, unit, i = 0 }) => (
  <StaggerItem i={i} className="pz-card p-6" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
    <div className="text-[11px] tracking-[0.2em] uppercase text-neutral-400">{label}</div>
    <div className="mt-2 flex items-baseline gap-1.5">
      <span className="font-[Cabinet_Grotesk] font-extrabold text-4xl text-[#90EE90]">{value}</span>
      {unit && <span className="text-sm text-neutral-400 font-mono">{unit}</span>}
    </div>
  </StaggerItem>
);

const Feature = ({ Icon, title, desc, testId, i = 0 }) => (
  <StaggerItem
    i={i}
    variants={featureFadeUp}
    className="pz-card pz-card-hoverable p-7 relative overflow-hidden group cursor-default"
    data-testid={testId}
  >
    <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-[#90EE90]/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="w-11 h-11 rounded-2xl bg-[#1B3324] flex items-center justify-center text-[#90EE90] border border-[#264A34] group-hover:scale-110 group-hover:bg-[#264A34] transition-all duration-300">
      <Icon size={20} />
    </div>
    <h3 className="mt-5 text-xl font-bold text-white">{title}</h3>
    <p className="mt-2 text-neutral-400 text-[15px] leading-relaxed">{desc}</p>
  </StaggerItem>
);

export default function Landing() {
  const [stats, setStats] = useState({ total_bins: 10, animals_fed_today: 132, waste_recycled_kg: 780, total_pellets_kg: 96 });
  const [donations, setDonations] = useState({ donations_count: 0, total_amount: 0, total_pellets_kg: 0 });
  useEffect(() => {
    api.get("/stats").then((r) => setStats(r.data)).catch(() => {});
    api.get("/donations/stats").then((r) => setDonations(r.data)).catch(() => {});
  }, []);

  return (
    <div className="pz-hero-bg min-h-screen text-white">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pz-grid-bg absolute inset-0 opacity-40 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-24 grid lg:grid-cols-12 gap-12 items-center">
          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
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
              <Link to="/donate" data-testid="hero-donate" className="pz-btn-ghost flex items-center gap-2">
                <HandCoins size={16} /> Donate pellets
              </Link>
            </div>

            <StaggerList className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3" gap={0.05} testId="hero-stats" immediate>
              <Stat label="Bins live" value={stats.total_bins} i={0} />
              <Stat label="Fed today" value={stats.animals_fed_today} i={1} />
              <Stat label="Recycled" value={stats.waste_recycled_kg} unit="kg" i={2} />
              <Stat label="Pellets" value={stats.total_pellets_kg} unit="kg" i={3} />
            </StaggerList>
          </motion.div>

          <motion.div
            className="lg:col-span-5 relative"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="pz-card overflow-hidden">
              <RevealImage
                src="https://images.unsplash.com/photo-1760210042929-70a2f7706363?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzV8MHwxfHNlYXJjaHw0fHxwdXBwaWVzJTIwcGxheWluZyUyMG91dGRvb3JzfGVufDB8fHx8MTc4NTQ3NTYyM3ww&ixlib=rb-4.1.0&q=85"
                alt="Puppies playing outdoors"
                className="w-full h-[440px]"
                testId="hero-image"
              />
              <div className="p-5 border-t border-[#1B3324] flex items-center justify-between">
                <div>
                  <div className="text-[11px] tracking-[0.2em] uppercase text-neutral-400">Meet the mission</div>
                  <div className="text-white font-semibold mt-1">62M kids on 4 legs. One clean city.</div>
                </div>
                <PawPrint className="text-[#90EE90]" />
              </div>
            </div>

            <motion.div
              className="pz-card absolute -bottom-8 -left-6 hidden md:block p-4 w-64"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <div className="flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-neutral-400">
                <span className="pz-live-dot" /> AI CAM · MYLAPORE
              </div>
              <div className="mt-2 text-sm text-white">Puppy detected · 98%</div>
              <div className="mt-1 font-mono text-xs text-[#90EE90]">dispensing 120g pellets</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES / TECH */}
      <section id="tech" className="border-t border-[#1B3324]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <span className="pz-chip">HOW IT WORKS</span>
            <h2 className="mt-4 font-[Cabinet_Grotesk] font-extrabold text-4xl md:text-5xl tracking-tight">
              A bin that <span className="text-[#90EE90]">thinks, sorts, and feeds.</span>
            </h2>
            <p className="mt-4 text-neutral-400 leading-relaxed">
              Every PETZZY unit is a small food-waste micro-factory. It inspects, decides, processes,
              and dispenses — powered by the sun and monitored from the cloud.
            </p>
          </motion.div>

          <StaggerList className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-5" gap={0.1} testId="features-grid">
            <Feature testId="feat-ai" Icon={Bot} title="AI Food Safety" desc="Cameras and pH sensors check each drop to separate edible food from anything unsafe or spoiled." i={0} />
            <Feature testId="feat-pellet" Icon={Package} title="Grind → Dry → Pellet" desc="Safe scraps get shredded, dried and pressed into shelf-stable pellets ready to dispense." i={1} />
            <Feature testId="feat-cam" Icon={Cctv} title="Animal Detection Cam" desc="An on-device AI recognises dogs, cats and birds and triggers dispensing when they arrive." i={2} />
            <Feature testId="feat-gps" Icon={MapPin} title="GPS Fleet Tracking" desc="Every bin reports its location live — smart maintenance routes are auto-planned." i={3} />
            <Feature testId="feat-solar" Icon={Sun} title="Solar Powered" desc="Rooftop solar keeps the bin, camera and IoT alive with near-zero electricity cost." i={4} />
            <Feature testId="feat-iot" Icon={Cpu} title="IoT Dashboard" desc="Bin fill, pellet level, battery, sensor health and animals-fed count stream to the cloud." i={5} />
          </StaggerList>
        </div>
      </section>

      {/* DUAL IMPACT */}
      <section className="border-t border-[#1B3324]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="pz-card overflow-hidden">
            <RevealImage
              src="https://images.unsplash.com/photo-1721902187342-ab4e59f36d9b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNDR8MHwxfHNlYXJjaHwyfHxzdHJheSUyMGRvZ3MlMjBzdHJlZXR8ZW58MHx8fHwxNzg1NDc1NjIzfDA&ixlib=rb-4.1.0&q=85"
              alt="Street dogs"
              className="w-full h-[420px]"
              testId="dual-impact-image"
            />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <span className="pz-chip"><Sparkles size={12} /> Dual impact</span>
            <h2 className="mt-4 font-[Cabinet_Grotesk] font-extrabold text-4xl md:text-5xl tracking-tight">
              A cleaner city. <br/>A kinder street.
            </h2>
            <p className="mt-5 text-neutral-400 leading-relaxed">
              India throws out 160,000 tonnes of biodegradable food waste every day — while millions
              of stray animals go hungry. PETZZY is the smart bin that closes the loop, one leftover at a time.
            </p>
            <StaggerList className="mt-8 grid grid-cols-3 gap-3" gap={0.06}>
              <Stat label="Cities live" value={1} i={0} />
              <Stat label="RWAs onboard" value={4} i={1} />
              <Stat label="CSR partners" value={2} i={2} />
            </StaggerList>
          </motion.div>
        </div>
      </section>

      {/* DONATION CTA STRIP */}
      <section className="border-t border-[#1B3324]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="pz-card p-8 md:p-12 grid md:grid-cols-3 gap-8 items-center relative overflow-hidden"
          >
            <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-[#90EE90]/10 blur-3xl" />
            <div className="md:col-span-2 relative">
              <span className="pz-chip"><HandCoins size={12} /> DONATE PELLETS</span>
              <h3 className="mt-3 font-[Cabinet_Grotesk] font-extrabold text-3xl md:text-4xl tracking-tight">
                <span className="text-[#90EE90]">₹{donations.total_amount.toLocaleString('en-IN')}</span> raised · {donations.total_pellets_kg} kg of pellets funded
              </h3>
              <p className="mt-3 text-neutral-400">₹50 = 1 kg of pellets. Every donation feeds ~4 strays.</p>
            </div>
            <div className="flex md:justify-end relative">
              <Link to="/donate" data-testid="cta-donate" className="pz-btn-primary flex items-center gap-2">
                Donate now <ChevronRight size={18} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="border-t border-[#1B3324]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 grid lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-1"
          >
            <span className="pz-chip">GET IN TOUCH</span>
            <h2 className="mt-4 font-[Cabinet_Grotesk] font-extrabold text-3xl">Bring PETZZY to your city.</h2>
            <p className="mt-3 text-neutral-400">Municipal, CSR, hostel or apartment — talk to us.</p>
          </motion.div>
          <StaggerList className="lg:col-span-2 grid md:grid-cols-3 gap-4" gap={0.08}>
            <StaggerItem i={0} className="pz-card pz-card-hoverable p-6"><Building2 className="text-[#90EE90]" /><div className="mt-3 text-neutral-400 text-sm">HQ</div><div className="text-white">Chennai, India</div></StaggerItem>
            <StaggerItem i={1} className="pz-card pz-card-hoverable p-6"><Mail className="text-[#90EE90]" /><div className="mt-3 text-neutral-400 text-sm">Email</div><div className="text-white">hello@petzzy.com</div></StaggerItem>
            <StaggerItem i={2} className="pz-card pz-card-hoverable p-6"><Phone className="text-[#90EE90]" /><div className="mt-3 text-neutral-400 text-sm">Phone</div><div className="text-white">+91 900 000 0000</div></StaggerItem>
          </StaggerList>
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
