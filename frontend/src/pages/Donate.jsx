import React, { useState } from "react";
import { Navbar } from "../components/Navbar";
import { api } from "../lib/api";
import { toast, Toaster } from "sonner";
import { StaggerList, StaggerItem, motion } from "../lib/motion";
import { HandCoins, PawPrint, ChevronRight, Package, Loader2 } from "lucide-react";

const HERO_IMG = "https://images.unsplash.com/photo-1721902187342-ab4e59f36d9b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNDR8MHwxfHNlYXJjaHwyfHxzdHJheSUyMGRvZ3MlMjBzdHJlZXR8ZW58MHx8fHwxNzg1NDc1NjIzfDA&ixlib=rb-4.1.0&q=85";

export default function Donate() {
  const [packages, setPackages] = useState([]);
  const [stats, setStats] = useState({ donations_count: 0, total_amount: 0, total_pellets_kg: 0 });
  const [selected, setSelected] = useState("pellet_5kg");
  const [donor, setDonor] = useState({ name: "", email: "" });
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    api.get("/donations/packages").then((r) => setPackages(r.data)).catch(() => {});
    api.get("/donations/stats").then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const handleDonate = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/donations/checkout", {
        package_id: selected,
        origin_url: window.location.origin,
        donor_name: donor.name,
        donor_email: donor.email,
      });
      window.location.href = data.checkout_url;
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not start checkout");
      setBusy(false);
    }
  };

  return (
    <div className="pz-hero-bg min-h-screen text-white">
      <Toaster theme="dark" position="top-right" />
      <Navbar />

      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-14 pb-24 grid lg:grid-cols-5 gap-10">
        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="pz-chip"><HandCoins size={12} /> DONATE PELLETS</span>
          <h1 className="mt-4 font-[Cabinet_Grotesk] font-extrabold text-5xl md:text-6xl tracking-tight">
            ₹50 = <span className="text-[#90EE90]">1 kg</span> of pellets. <br/>
            ~4 strays fed.
          </h1>
          <p className="mt-5 text-neutral-300 max-w-xl leading-relaxed">
            Every rupee you donate is converted into shelf-stable pellets and dispensed by a PETZZY bin to a street animal in Chennai. Choose a pack:
          </p>

          <StaggerList className="mt-8 grid sm:grid-cols-2 gap-4" gap={0.08} testId="donate-packages" immediate>
            {packages.map((p, i) => (
              <StaggerItem
                key={p.package_id}
                i={i}
                onClick={() => setSelected(p.package_id)}
                className={`pz-card pz-card-hoverable p-6 cursor-pointer relative ${selected === p.package_id ? "!border-[#90EE90] shadow-[0_0_0_2px_rgba(144,238,144,0.35)]" : ""}`}
                data-testid={`donate-pkg-${p.package_id}`}
                role="button"
              >
                <div className="flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-neutral-400">
                  <Package size={12} className="text-[#90EE90]" /> {p.label}
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-[Cabinet_Grotesk] font-extrabold text-4xl text-[#90EE90]">₹{p.amount.toLocaleString('en-IN')}</span>
                  <span className="text-sm text-neutral-500 font-mono">/ {p.kg} kg</span>
                </div>
                <div className="mt-1 text-sm text-neutral-400">Feeds ~{p.kg * 4} strays</div>
                {selected === p.package_id && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#90EE90] text-[#0A140E] flex items-center justify-center text-xs font-bold">✓</div>
                )}
              </StaggerItem>
            ))}
          </StaggerList>

          <div className="mt-8 pz-card p-6">
            <div className="text-[11px] tracking-[0.2em] uppercase text-neutral-400 mb-3">Your details (optional)</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input data-testid="donor-name" placeholder="Your name" value={donor.name} onChange={(e) => setDonor({ ...donor, name: e.target.value })}
                className="w-full bg-[#0A140E] border border-[#1B3324] rounded-xl px-4 py-3 focus:border-[#90EE90] focus:outline-none transition-colors" />
              <input data-testid="donor-email" type="email" placeholder="Email for receipt" value={donor.email} onChange={(e) => setDonor({ ...donor, email: e.target.value })}
                className="w-full bg-[#0A140E] border border-[#1B3324] rounded-xl px-4 py-3 focus:border-[#90EE90] focus:outline-none transition-colors" />
            </div>
          </div>

          <button
            onClick={handleDonate}
            disabled={busy}
            data-testid="donate-checkout"
            className="mt-6 pz-btn-primary w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy ? <><Loader2 className="animate-spin" size={16} /> Redirecting to Stripe...</> : <>Continue to Stripe <ChevronRight size={18} /></>}
          </button>
          <div className="mt-2 text-xs text-neutral-500 font-mono">Test card: 4242 4242 4242 4242 · any future expiry · any CVC</div>
        </motion.div>

        <motion.aside
          className="lg:col-span-2 space-y-5"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="pz-card overflow-hidden">
            <img src={HERO_IMG} alt="Strays fed" className="w-full h-56 object-cover" />
            <div className="p-6">
              <span className="pz-chip"><PawPrint size={12} /> LIVE IMPACT</span>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <ImpactMini label="Donations" value={stats.donations_count} />
                <ImpactMini label="Raised" value={`₹${(stats.total_amount || 0).toLocaleString('en-IN')}`} />
                <ImpactMini label="Pellets" value={`${stats.total_pellets_kg} kg`} />
              </div>
            </div>
          </div>

          <div className="pz-card p-6">
            <div className="text-[11px] tracking-[0.2em] uppercase text-neutral-400">Where your money goes</div>
            <ul className="mt-3 space-y-2 text-neutral-300 text-sm">
              <li className="flex justify-between"><span>Pellet raw material</span><span className="font-mono text-[#90EE90]">70%</span></li>
              <li className="flex justify-between"><span>Bin maintenance</span><span className="font-mono text-[#90EE90]">20%</span></li>
              <li className="flex justify-between"><span>Platform + audit</span><span className="font-mono text-[#90EE90]">10%</span></li>
            </ul>
          </div>
        </motion.aside>
      </section>
    </div>
  );
}

const ImpactMini = ({ label, value }) => (
  <div>
    <div className="text-[10px] tracking-[0.2em] uppercase text-neutral-500">{label}</div>
    <div className="mt-1 font-[Cabinet_Grotesk] text-xl font-extrabold text-[#90EE90]">{value}</div>
  </div>
);
