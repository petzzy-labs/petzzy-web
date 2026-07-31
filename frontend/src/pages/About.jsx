import React from "react";
import { Navbar } from "../components/Navbar";
import { Heart, Target, Leaf, Users } from "lucide-react";

export default function About() {
  return (
    <div className="pz-hero-bg min-h-screen text-white">
      <Navbar />
      <section className="max-w-6xl mx-auto px-6 lg:px-10 pt-20 pb-24">
        <span className="pz-chip">ABOUT US</span>
        <h1 className="mt-5 font-[Cabinet_Grotesk] font-extrabold text-5xl md:text-6xl tracking-tight">
          We're feeding <span className="text-[#90EE90]">62 million</span> street animals — <br/>
          one leftover at a time.
        </h1>
        <p className="mt-6 text-lg text-neutral-300 max-w-3xl leading-relaxed">
          PETZZY started as a college project that wouldn't leave us alone. India throws out an
          entire dinner every second, and yet stray dogs sift through toxic garbage every night.
          We built a bin smart enough to solve both.
        </p>

        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { Icon: Target, title: "Our Mission", body: "Close the loop between food waste and animal hunger in every Indian city." },
            { Icon: Heart, title: "Our Values", body: "Compassion, engineering rigor, and a bias for measurable impact." },
            { Icon: Leaf, title: "Sustainability", body: "Solar powered, low water, zero landfill — designed for a 10-year lifespan." },
            { Icon: Users, title: "Our Team", body: "Engineers, veterinarians, urban planners and one very good dog." },
          ].map(({ Icon, title, body }, i) => (
            <div key={i} className="pz-card p-7" data-testid={`about-card-${i}`}>
              <div className="w-11 h-11 rounded-2xl bg-[#1B3324] flex items-center justify-center text-[#90EE90] border border-[#264A34]"><Icon size={20} /></div>
              <div className="mt-5 text-white text-lg font-semibold">{title}</div>
              <div className="mt-2 text-neutral-400 leading-relaxed">{body}</div>
            </div>
          ))}
        </div>

        <div className="mt-16 pz-card p-10 grid lg:grid-cols-2 gap-10 items-center">
          <img src="https://images.unsplash.com/photo-1777571051052-6ad3c7031811?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzV8MHwxfHNlYXJjaHw0fHxzb2xhciUyMHBhbmVsJTIwZ3JlZW4lMjB0ZWNofGVufDB8fHx8MTc4NTQ3NTYyM3ww&ixlib=rb-4.1.0&q=85" alt="Solar" className="rounded-xl w-full h-[340px] object-cover" />
          <div>
            <h3 className="font-[Cabinet_Grotesk] font-bold text-3xl">Built for Indian streets.</h3>
            <p className="mt-4 text-neutral-400 leading-relaxed">
              Rain-proof, monkey-proof, tamper resistant. Every unit runs on solar, connects over 4G/LoRa,
              and reports live to the PETZZY cloud so municipal teams know exactly when to refill or service.
            </p>
            <ul className="mt-6 space-y-2 text-neutral-300 text-sm">
              <li>• 20 kg pellet storage · 30 kg waste hopper</li>
              <li>• 5 MP AI camera · pH + temperature sensors</li>
              <li>• 100 W solar · 48 hr battery backup</li>
              <li>• GSM + LoRa dual-comms</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
