// src/App.tsx
import { useState } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";

import Landing from "./pages/Landing";

function DisconnectBtn() {
  const { connected, disconnect } = useWallet();
  if (!connected) return null;
  return (
    <button className="wallet-disconnect-btn" onClick={() => disconnect()}>
      Disconnect
    </button>
  );
}

function HeaderView({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        {/* Left: socials */}
        <div className="social-links" aria-label="Social Links">
          <a href="https://x.com/JAL358" target="_blank" rel="noopener noreferrer" aria-label="X">
            <img src="/icons/X.png" alt="" />
          </a>
          <a href="https://t.me/jalsolcommute" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
            <img src="/icons/Telegram.png" alt="" />
          </a>
          <a href="https://www.tiktok.com/@358jalsol" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
            <img src="/icons/TikTok.png" alt="" />
          </a>
        </div>

        {/* Center: logo (GIF ok) */}
        <img className="logo header-logo" src="/JALSOL1.gif" alt="JAL/SOL" />

        {/* Right: hamburger */}
        <button className="hamburger" onClick={onMenu} aria-label="Open menu" aria-haspopup="true">
          <span></span><span></span><span></span>
        </button>

        {/* Optional center nav (desktop only) */}
        <nav className="main-nav" aria-label="Primary">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            Home
          </NavLink>
          {/* More routes later if you want */}
        </nav>
      </div>
    </header>
  );
}

function SidebarView({ open, onClose }: { open: boolean; onClose: () => void }) {
  return !open ? null : (
    <>
      <button className="sidebar-overlay" aria-label="Close menu overlay" onClick={onClose} />
      <aside className="sidebar-nav" aria-label="Sidebar navigation">
        <nav>
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={onClose}>
            Home
          </NavLink>
        </nav>
        <div style={{ marginTop: 8 }} />
        <WalletMultiButton />
        <DisconnectBtn />
      </aside>
    </>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <BrowserRouter>
      <HeaderView onMenu={() => setMenuOpen(true)} />
      <SidebarView open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main role="main">
        <Routes>
          <Route path="/" element={<Landing />} />
        </Routes>
      </main>
      {/* optional footer */}
      {/* <footer className="site-footer">© {new Date().getFullYear()} JAL/SOL</footer> */}
    </BrowserRouter>
  );
}
