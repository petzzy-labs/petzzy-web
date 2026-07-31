import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./lib/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import Landing from "./pages/Landing";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import AuthCallback from "./pages/AuthCallback";
import PublicMap from "./pages/PublicMap";
import Sponsors from "./pages/Sponsors";
import SponsorDetail from "./pages/SponsorDetail";
import Donate from "./pages/Donate";
import DonateSuccess from "./pages/DonateSuccess";
import DonateCancel from "./pages/DonateCancel";

// Wraps the whole matched route with a fade-out + slide-in-from-right transition.
const RouteFrame = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, x: 24 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -16 }}
    transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

function AppRouter() {
  const location = useLocation();
  // Emergent Google Auth returns to any URL with #session_id=... in the fragment.
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<RouteFrame><Landing /></RouteFrame>} />
        <Route path="/about" element={<RouteFrame><About /></RouteFrame>} />
        <Route path="/login" element={<RouteFrame><Login /></RouteFrame>} />
        <Route path="/register" element={<RouteFrame><Register /></RouteFrame>} />
        <Route path="/dashboard" element={<RouteFrame><Dashboard /></RouteFrame>} />
        <Route path="/admin" element={<RouteFrame><Admin /></RouteFrame>} />
        <Route path="/map" element={<RouteFrame><PublicMap /></RouteFrame>} />
        <Route path="/sponsors" element={<RouteFrame><Sponsors /></RouteFrame>} />
        <Route path="/sponsors/:slug" element={<RouteFrame><SponsorDetail /></RouteFrame>} />
        <Route path="/donate" element={<RouteFrame><Donate /></RouteFrame>} />
        <Route path="/donate/success" element={<RouteFrame><DonateSuccess /></RouteFrame>} />
        <Route path="/donate/cancel" element={<RouteFrame><DonateCancel /></RouteFrame>} />
        <Route path="*" element={<RouteFrame><Landing /></RouteFrame>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}
