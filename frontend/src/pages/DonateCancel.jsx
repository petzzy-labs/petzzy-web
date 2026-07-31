import React from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { motion } from "../lib/motion";
import { XCircle } from "lucide-react";

export default function DonateCancel() {
  return (
    <div className="pz-hero-bg min-h-screen text-white">
      <Navbar />
      <section className="max-w-3xl mx-auto px-6 lg:px-10 py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="pz-card p-10 text-center"
          data-testid="donate-cancel-panel"
        >
          <XCircle className="mx-auto text-neutral-400" size={64} />
          <h1 className="mt-4 font-[Cabinet_Grotesk] font-extrabold text-3xl">Donation cancelled.</h1>
          <p className="mt-2 text-neutral-400">No charge was made. Whenever you're ready, we'll be here.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/donate" data-testid="donate-cancel-try-again" className="pz-btn-primary">Try again</Link>
            <Link to="/" data-testid="donate-cancel-back-home" className="pz-btn-ghost">Back home</Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
