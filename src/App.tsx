import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation,
} from "react-router-dom";

import Landing from "./pages/Landing";

/* ------------------------ Header ------------------------ */
function HeaderView({
  onMenu,
  onLogo,
  isOpen,
}: {
  onMenu: () => void;
  onLogo: () => void;
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

        {/* Center: logo opens NAV overlay */}
        <button type="button" onClick={onLogo} aria-label="Open navigation" className="logo-btn">
          <img className="logo header-logo" src="/JALSOL1.gif" alt="JAL/SOL" />
        </button>

        {/* Right: hamburger */}
        <button
          className={`hamburger ${isOpen ? "is-open" : ""}`}
          onClick={onMenu}
          aria-label="Open menu"
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}

/* ------------------------ Sidebar ------------------------ */
function SidebarView({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <>
      <button className="sidebar-overlay" aria-label="Close menu overlay" onClick={onClose} />
      <aside className="sidebar-nav" aria-label="Sidebar navigation">
        <nav>
          <NavLink to="/app/home" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={onClose}>
            Home
          </NavLink>
          <NavLink to="/app/about" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={onClose}>
            About JAL
          </NavLink>
          <NavLink to="/app/shop" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={onClose}>
            Shop
          </NavLink>
        </nav>
      </aside>
    </>
  );
}

/* ------------------------ App Shell (only for /app/*) ------------------------ */
function AppShell() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close sidebar on route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <HeaderView
        onMenu={() => setMenuOpen(true)}
        onLogo={() => window.dispatchEvent(new CustomEvent("JALSOL:OPEN_NAV"))}
        isOpen={menuOpen}
      />
      <SidebarView open={menuOpen} onClose={() => setMenuOpen(false)} />

      <main role="main">
        <Routes>
          {/* First screen inside app is NAV */}
          <Route path="nav" element={<Landing initialPanel="nav" />} />
          <Route path="home" element={<Landing initialPanel="home" />} />
          <Route path="about" element={<Landing initialPanel="jal" />} />
          <Route path="shop" element={<Landing initialPanel="shop" />} />

          <Route path="*" element={<Navigate to="/app/nav" replace />} />
        </Routes>
      </main>
    </>
  );
}

/* ------------------------ App Root ------------------------ */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ENTRY ONLY (no header) */}
        <Route path="/" element={<Landing initialPanel="none" />} />

        {/* APP (header appears only here) */}
        <Route path="/app/*" element={<AppShell />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}