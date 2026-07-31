import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { api } from "../lib/api";
import { motion } from "../lib/motion";
import { CheckCircle2, Loader2, XCircle, Sparkles, PawPrint } from "lucide-react";

const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 8;

export default function DonateSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [state, setState] = useState({ status: "polling", data: null, attempts: 0 });
  const timerRef = useRef(null);

  useEffect(() => {
    if (!sessionId) { setState({ status: "error", data: null }); return; }
    let attempts = 0;

    const poll = async () => {
      attempts += 1;
      try {
        const { data } = await api.get(`/donations/status/${sessionId}`);
        if (data.payment_status === "paid") {
          setState({ status: "paid", data, attempts });
          return;
        }
        if (data.payment_status === "expired" || data.payment_status === "failed") {
          setState({ status: "failed", data, attempts });
          return;
        }
        if (attempts >= MAX_ATTEMPTS) {
          setState({ status: "timeout", data, attempts });
          return;
        }
        setState({ status: "polling", data, attempts });
        timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      } catch (e) {
        setState({ status: "error", data: null, attempts });
      }
    };
    poll();
    return () => timerRef.current && clearTimeout(timerRef.current);
  }, [sessionId]);

  return (
    <div className="pz-hero-bg min-h-screen text-white">
      <Navbar />
      <section className="max-w-3xl mx-auto px-6 lg:px-10 py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="pz-card p-10 text-center"
          data-testid="donate-success-panel"
        >
          {state.status === "polling" && (
            <>
              <Loader2 className="mx-auto text-[#90EE90] animate-spin" size={48} />
              <h1 className="mt-4 font-[Cabinet_Grotesk] font-extrabold text-3xl">Confirming your donation...</h1>
              <p className="mt-2 text-neutral-400">Talking to Stripe · attempt {state.attempts}/{MAX_ATTEMPTS}</p>
            </>
          )}
          {state.status === "paid" && (
            <>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }}>
                <CheckCircle2 className="mx-auto text-[#90EE90]" size={72} />
              </motion.div>
              <h1 className="mt-4 font-[Cabinet_Grotesk] font-extrabold text-4xl">Thank you!</h1>
              <p className="mt-3 text-neutral-300">
                Your ₹{state.data?.amount?.toLocaleString('en-IN')} funds <b>{state.data?.pellets_kg} kg</b> of pellets — that's about {state.data?.pellets_kg * 4} street animals fed.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 pz-chip"><Sparkles size={12} /> Session {sessionId?.slice(0, 14)}...</div>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/" data-testid="donate-success-back-home" className="pz-btn-ghost">Back home</Link>
                <Link to="/map" data-testid="donate-success-map" className="pz-btn-primary flex items-center gap-2"><PawPrint size={16} /> See the live map</Link>
              </div>
            </>
          )}
          {(state.status === "failed" || state.status === "error") && (
            <>
              <XCircle className="mx-auto text-[#FF453A]" size={64} />
              <h1 className="mt-4 font-[Cabinet_Grotesk] font-extrabold text-3xl">Payment didn't go through.</h1>
              <p className="mt-2 text-neutral-400">No charge was made. Please try again.</p>
              <Link to="/donate" data-testid="donate-success-try-again" className="mt-6 inline-block pz-btn-primary">Try again</Link>
            </>
          )}
          {state.status === "timeout" && (
            <>
              <Loader2 className="mx-auto text-neutral-400" size={48} />
              <h1 className="mt-4 font-[Cabinet_Grotesk] font-extrabold text-3xl">Still processing...</h1>
              <p className="mt-2 text-neutral-400">Stripe is taking a moment. Refresh in a minute to see your confirmation.</p>
              <Link to="/" data-testid="donate-success-timeout-home" className="mt-6 inline-block pz-btn-ghost">Back home</Link>
            </>
          )}
        </motion.div>
      </section>
    </div>
  );
}
