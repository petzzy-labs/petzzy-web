import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./lib/AuthContext";
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

function AppRouter() {
  const location = useLocation();
  // Emergent Google Auth returns to any URL with #session_id=... in the fragment.
  // Detect synchronously during render (not in useEffect) to prevent race conditions.
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/about" element={<About />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/map" element={<PublicMap />} />
      <Route path="/sponsors" element={<Sponsors />} />
      <Route path="/sponsors/:slug" element={<SponsorDetail />} />
      <Route path="*" element={<Landing />} />
    </Routes>
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
