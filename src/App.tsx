// src/App.tsx
import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
} from "react-router-dom";

import Home from "./pages/Home";
import CryptoGenerator from "./pages/CryptoGenerator";
import Dashboard from "./pages/Dashboard";
import Vault from "./pages/Vault";

import About from "./pages/About";
import Manifesto from "./pages/Manifesto";
import Learn from "./pages/Learn";
import Content from "./pages/Content";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userSymbol, setUserSymbol] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("vaultSymbol");
    if (stored) setUserSymbol(stored.toUpperCase());
  }, []);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  const vaultPath = userSymbol ? `/vault/${userSymbol}` : "/dashboard";
  const vaultLabel = userSymbol ? `VAULT / ${userSymbol}` : "VAULT / JAL";

  return (
    <Router>
      <header>
        <div className="header-inner">
          <NavLink to="/" onClick={closeMenu}>
            <img src="/JALSOL1.gif" alt="JALSOL Logo" className="logo header-logo" />
          </NavLink>

          <nav className="main-nav">
            <NavLink to="/" onClick={closeMenu} className="nav-link">
              JAL/SOL
            </NavLink>
            <NavLink to={vaultPath} onClick={closeMenu} className="nav-link">
              {vaultLabel}
            </NavLink>
            <NavLink to="/learn" onClick={closeMenu} className="nav-link">
              LEARN/SOL
            </NavLink>
            <NavLink to="/about" onClick={closeMenu} className="nav-link">
              About JAL
            </NavLink>
          </nav>

          <div className="social-links">
            <a href="https://x.com/JAL358" target="_blank" rel="noopener noreferrer">
              <img src="/icons/X.png" alt="X" />
            </a>
            <a href="https://t.me/JALSOL" target="_blank" rel="noopener noreferrer">
              <img src="/icons/Telegram.png" alt="Telegram" />
            </a>
            <a href="https://tiktok.com/@jalcoin" target="_blank" rel="noopener noreferrer">
              <img src="/icons/TikTok.png" alt="TikTok" />
            </a>
          </div>

          <button className="hamburger" onClick={toggleMenu}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </header>

      {menuOpen && (
        <>
          <div className="sidebar-overlay" onClick={closeMenu} />
          <div className="sidebar-nav">
            <NavLink to="/" onClick={closeMenu} className="nav-link">
              JAL/SOL
            </NavLink>
            <NavLink to={vaultPath} onClick={closeMenu} className="nav-link">
              {vaultLabel}
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

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/crypto-generator" element={<CryptoGenerator />} />
          <Route path="/dashboard" element={<Vault />} />
          <Route path="/vault/:symbol" element={<Vault />} />
          <Route path="/about" element={<About />} />
          <Route path="/manifesto" element={<Manifesto />} />
          <Route path="/content" element={<Content />} />
          <Route path="/learn" element={<Learn />} />
        </Routes>

        {/* Divider Animation */}
        <div className="scroll-divider"></div>
      </main>
    </Router>
  );
}

export default App;
