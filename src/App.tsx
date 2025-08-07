import { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
} from 'react-router-dom';

import Home from './pages/Home';
import CryptoGenerator from './pages/CryptoGenerator';
import Dashboard from './pages/Dashboard';
import Vault from './pages/Vault';

import About from './pages/About';
import Manifesto from './pages/Manifesto';
import Learn from './pages/Learn';
import Content from './pages/Content';

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userSymbol, setUserSymbol] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('vaultSymbol');
    if (stored) setUserSymbol(stored.toUpperCase());
  }, []);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  const vaultPath = userSymbol ? `/vault/${userSymbol}` : '/dashboard';
  const vaultLabel = userSymbol ? `VAULT / ${userSymbol}` : 'VAULT / JAL';

  return (
    <Router>
      <header className="w-full bg-black border-b-2 border-[var(--jal-gold)] backdrop-blur z-50 relative px-6 py-4">
        <div className="header-inner max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 relative">
          <NavLink to="/" onClick={closeMenu}>
            <img
              src="/JALSOL1.gif"
              alt="JALSOL Logo"
              className="logo w-44 md:w-52 drop-shadow-glow"
            />
          </NavLink>

          <nav className="main-nav flex gap-6 text-white text-sm md:text-base uppercase tracking-widest">
            <NavLink to="/" onClick={closeMenu} className="nav-link">
              JAL/SOL
            </NavLink>
            <NavLink to={vaultPath} onClick={closeMenu} className="nav-link">
              {vaultLabel}
            </NavLink>
            <NavLink to="/learn" onClick={closeMenu} className="nav-link">
              Learn/SOL
            </NavLink>
            <NavLink to="/about" onClick={closeMenu} className="nav-link">
              About JAL
            </NavLink>
          </nav>

          <div className="social-links absolute top-3 left-4 flex gap-4">
            <a href="https://x.com/JAL358" target="_blank" rel="noopener noreferrer">
              <img src="/icons/X.png" alt="X" className="w-6 h-6" />
            </a>
            <a href="https://t.me/JALSOL" target="_blank" rel="noopener noreferrer">
              <img src="/icons/Telegram.png" alt="Telegram" className="w-6 h-6" />
            </a>
            <a href="https://tiktok.com/@jalcoin" target="_blank" rel="noopener noreferrer">
              <img src="/icons/TikTok.png" alt="TikTok" className="w-6 h-6" />
            </a>
          </div>

          <button className="hamburger absolute top-3 right-4 md:hidden" onClick={toggleMenu}>
            {menuOpen ? '✕' : '☰'}
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
              Learn/SOL
            </NavLink>
            <NavLink to="/about" onClick={closeMenu} className="nav-link">
              About JAL
            </NavLink>
          </div>
        </>
      )}

      <main className="w-full min-h-screen flex flex-col justify-center items-center px-4 relative overflow-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/crypto-generator" element={<CryptoGenerator />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vault/:symbol" element={<Vault />} />
          <Route path="/about" element={<About />} />
          <Route path="/manifesto" element={<Manifesto />} />
          <Route path="/content" element={<Content />} />
          <Route path="/learn" element={<Learn />} />
        </Routes>

        {/* Divider Animation */}
        <div className="scroll-divider absolute bottom-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--jal-glow)] to-transparent animate-pulse" />
      </main>
    </Router>
  );
}

export default App;
