// src/App.tsx
import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
} from "react-router-dom";

import Home from "./pages/Home";
import CryptoGenerator from "./pages/CryptoGenerator";
import Dashboard from "./pages/Dashboard";

// Optional future modules (can be safely removed/commented)
import About from "./pages/About";
import Manifesto from "./pages/Manifesto";
import Learn from "./pages/Learn";
import Content from "./pages/Content";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  return (
    <Router>
      <header>
        <div className="header-inner">
          <NavLink to="/" onClick={closeMenu}>
            <img src="/logo-glow-gold.svg" alt="JALSOL Logo" className="logo" />
          </NavLink>

          {/* 🌐 Desktop Navigation */}
          <nav className="main-nav">
            <NavLink to="/" onClick={closeMenu} className="nav-link">
              JAL/SOL
            </NavLink>
            <NavLink to="/dashboard" onClick={closeMenu} className="nav-link">
              VAULT / JAL
            </NavLink>
            <NavLink to="/learn" onClick={closeMenu} className="nav-link">
              LEARN/SOL
            </NavLink>
            <NavLink to="/about" onClick={closeMenu} className="nav-link">
              About JAL
            </NavLink>
          </nav>

          {/* 📡 Social Links */}
          <div className="social-links">
            <a href="https://x.com/JAL358" target="_blank" rel="noopener noreferrer">
              <img src="/x.svg" alt="X" />
            </a>
            <a href="https://t.me/JALSOL" target="_blank" rel="noopener noreferrer">
              <img src="/telegram.svg" alt="Telegram" />
            </a>
            <a href="https://tiktok.com/@jalcoin" target="_blank" rel="noopener noreferrer">
              <img src="/tiktok.svg" alt="TikTok" />
            </a>
          </div>

          {/* 🍔 Hamburger */}
          <button className="hamburger" onClick={toggleMenu}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </header>

      {/* 📱 Sidebar Navigation */}
      {menuOpen && (
        <>
          <div className="sidebar-overlay" onClick={closeMenu} />
          <div className="sidebar-nav">
            <NavLink to="/" onClick={closeMenu} className="nav-link">
              JAL/SOL
            </NavLink>
            <NavLink to="/dashboard" onClick={closeMenu} className="nav-link">
              VAULT / JAL
            </NavLink>
            <NavLink to="/learn" onClick={closeMenu} className="nav-link">
              LEARN/SOL
            </NavLink>
            <NavLink to="/about" onClick={closeMenu} className="nav-link">
              About JAL
            </NavLink>
          </div>
        </>
      )}

      {/* 🧭 Route Views */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/crypto-generator" element={<CryptoGenerator />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/about" element={<About />} />
        <Route path="/manifesto" element={<Manifesto />} />
        <Route path="/content" element={<Content />} />
        <Route path="/learn" element={<Learn />} />
      </Routes>
    </Router>
  );
}

export default App;
