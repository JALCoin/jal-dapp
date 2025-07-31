// src/App.tsx
import type { FC } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CryptoGeneratorIntro from './pages/CryptoGeneratorIntro';
import CryptoGenerator from './pages/CryptoGenerator';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';

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
        </Routes>
      </main>
    </Router>
  );
};

const Header: FC = () => (
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

    <div className="header-inner">
      <Link to="/" aria-label="JAL/SOL Home">
        <img src="/JALSOL1.gif" alt="JAL Vault Logo" className="logo" />
      </Link>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/crypto-generator">Crypto Generator</Link>
        <Link to="/dashboard">Dashboard</Link>
      </nav>
    </div>
  </header>
);

export default App;
