import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import CreateToken from "./pages/CreateToken";
import CryptoGenerator from "./pages/CryptoGenerator";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  return (
    <Router>
      {/* === Header === */}
      <header>
        <div className="header-inner">
          <Link to="/" onClick={closeMenu}>
            <img src="/logo-glow-gold.svg" alt="JALSOL" className="logo" />
          </Link>

          <nav className="social-links">
            <a href="https://x.com/JAL358" target="_blank" rel="noopener noreferrer">
              <img src="/x.svg" alt="X" />
            </a>
            <a href="https://t.me/JALSOL" target="_blank" rel="noopener noreferrer">
              <img src="/telegram.svg" alt="Telegram" />
            </a>
            <a href="https://tiktok.com/@jalcoin" target="_blank" rel="noopener noreferrer">
              <img src="/tiktok.svg" alt="TikTok" />
            </a>
          </nav>

          <button className="hamburger" onClick={toggleMenu}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </header>

      {/* === Sidebar Menu === */}
      {menuOpen && (
        <>
          <div className="sidebar-overlay" onClick={closeMenu} />
          <div className="sidebar-nav">
            <Link to="/" onClick={closeMenu}>Home</Link>
            <Link to="/crypto-generator" onClick={closeMenu}>Crypto Generator</Link>
            <Link to="/dashboard" onClick={closeMenu}>Dashboard</Link>
            <Link to="/about" onClick={closeMenu}>About</Link>
            <a href="#manifesto" onClick={closeMenu}>Manifesto</a>
            <a href="#content" onClick={closeMenu}>Content</a>
            <a href="#learn" onClick={closeMenu}>Learn</a>
          </div>
        </>
      )}

      {/* === Pages === */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create-token" element={<CreateToken />} />
        <Route path="/crypto-generator" element={<CryptoGenerator />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}
