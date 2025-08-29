import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";

import Landing from "./pages/Landing";

/* ------------------------ Small pieces ------------------------ */
function DisconnectBtn() {
  const { connected, disconnect } = useWallet();
  if (!connected) return null;
  return (
    <button className="wallet-disconnect-btn" onClick={() => disconnect()}>
      Disconnect
    </button>
  );
}

function HeaderView({
  onMenu,
  isOpen,
}: {
  onMenu: () => void;
  isOpen: boolean;
}) {
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

        {/* Center: logo (acts as Home button) */}
        <NavLink to="/" aria-label="Home">
          <img className="logo header-logo" src="/JALSOL1.gif" alt="JAL/SOL" />
        </NavLink>

        {/* Right: hamburger */}
        <button
          className={`hamburger ${isOpen ? "is-open" : ""}`}
          onClick={onMenu}
          aria-label="Open menu"
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>
  );
}

function SidebarView({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
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

/* Bottom tab bar (visual + deep-links to Landing panels) */
function TabBar() {
  const location = useLocation();
  const base = location.pathname || "/";

  const link = (panel?: string) => {
    const p = new URLSearchParams(location.search);
    if (!panel) p.delete("panel");
    else p.set("panel", panel);
    const q = p.toString();
    return q ? `${base}?${q}` : base;
  };

  const isActive = (panel?: string) => {
    const p = new URLSearchParams(location.search).get("panel");
    if (!panel) return !p || p === "none";
    return p === panel;
  };

  return (
    <nav className="tabbar" aria-label="App tabs">
      <NavLink to={link("grid")} className={() => (isActive("grid") ? "active" : "")}>
        <div className="tab-icon">➕</div> HUB
      </NavLink>
      <a href={link("payments")} className={isActive("payments") ? "active" : ""}>
        <div className="tab-icon">🔁</div> PAYMENTS
      </a>
      <NavLink to={link("shop")} className={() => (isActive("shop") ? "active" : "")}>
        <div className="tab-icon">🏬</div> STORE
      </NavLink>
      <a href={link("loans")} className={isActive("loans") ? "active" : ""}>
        <div className="tab-icon">🧮</div> LOANS
      </a>
      <a href={link("support")} className={isActive("support") ? "active" : ""}>
        <div className="tab-icon">👤</div> SUPPORT
      </a>
      <NavLink to={link("jal")} className={() => (isActive("jal") ? "active" : "")}>
        <div className="tab-icon">➕</div> MONEY
      </NavLink>
    </nav>
  );
}

/* ------------------------ App Root ------------------------ */
export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <BrowserRouter>
      <HeaderView onMenu={() => setMenuOpen(true)} isOpen={menuOpen} />
      <SidebarView open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main role="main">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <TabBar />
    </BrowserRouter>
  );
}
