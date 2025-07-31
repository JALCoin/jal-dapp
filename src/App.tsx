// src/App.tsx
import type { FC } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import CryptoGeneratorIntro from './pages/CryptoGeneratorIntro';
import CryptoGenerator from './pages/CryptoGenerator';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import About from './pages/About';
import Manifesto from './pages/Manifesto';
import Content from './pages/Content';
import Learn from './pages/Learn';

const App: FC = () => {
  return (
    <Router>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/crypto-generator" element={<CryptoGeneratorIntro />} />
          <Route path="/crypto-generator/engine" element={<CryptoGenerator />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/about" element={<About />} />
          <Route path="/manifesto" element={<Manifesto />} />
          <Route path="/content" element={<Content />} />
          <Route path="/learn" element={<Learn />} />
        </Routes>
      </main>
    </Router>
  );
};

const Header: FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSidebar();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="jal-header">
      <div className="social-links">
        <a href="https://x.com/JAL358" target="_blank" rel="noopener noreferrer" aria-label="X">
          <img src="/icons/X.png" alt="X" />
        </a>
        <a href="https://www.instagram.com/358jal/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
          <img src="/icons/Instagram.png" alt="Instagram" />
        </a>
        <a href="https://t.me/jalsolcommute" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
          <img src="/icons/Telegram.png" alt="Telegram" />
        </a>
        <a href="https://www.tiktok.com/@358jal" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
          <img src="/icons/TikTok.png" alt="TikTok" />
        </a>
      </div>

      <button
        className={`hamburger ${isOpen ? 'hidden' : ''}`}
        onClick={toggleSidebar}
        aria-label="Menu"
      >
        ☰
      </button>

      <div className="header-inner">
        <Link to="/" aria-label="JAL/SOL Home">
          <img src="/JALSOL1.gif" alt="JAL Vault Logo" className="logo" />
        </Link>
      </div>

      {isOpen && (
        <>
          <div className="sidebar-overlay" onClick={closeSidebar}></div>
          <nav className="sidebar-nav">
            <Link to="/" onClick={closeSidebar}>Home</Link>
            <Link to="/crypto-generator" onClick={closeSidebar}>Crypto Generator</Link>
            <Link to="/dashboard" onClick={closeSidebar}>Dashboard</Link>
            <Link to="/about" onClick={closeSidebar}>About</Link>
            <Link to="/manifesto" onClick={closeSidebar}>Manifesto</Link>
            <Link to="/content" onClick={closeSidebar}>Content</Link>
            <Link to="/learn" onClick={closeSidebar}>Learn</Link>
          </nav>
        </>
      )}
    </header>
  );
};

export default App;
