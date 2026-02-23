// src/App.tsx
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Engine from "./pages/Engine";

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

        {/* Center: logo opens MAIN NAV overlay */}
        <button type="button" onClick={onLogo} aria-label="Open navigation" className="logo-btn">
          <img className="logo header-logo" src="/JALSOL1.gif" alt="JAL/SOL" />
        </button>

        {/* Right: hamburger toggles SIDEBAR */}
        <button
          className={`hamburger ${isOpen ? "is-open" : ""}`}
          onClick={onMenu}
          aria-label={isOpen ? "Close menu" : "Open menu"}
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
          <NavLink
            to="/app/home"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={onClose}
          >
            Home
          </NavLink>

          <NavLink
            to="/app/about"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={onClose}
          >
            About JAL
          </NavLink>

          <NavLink
            to="/app/shop"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={onClose}
          >
            Shop
          </NavLink>

          <NavLink
            to="/app/token"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={onClose}
          >
            Token Generation
          </NavLink>

          <NavLink
            to="/app/raydium"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={onClose}
          >
            Raydium / Liquidity
          </NavLink>

          <NavLink
            to="/app/engine"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={onClose}
          >
            $JAL~Engine
          </NavLink>

          <NavLink
            to="/app/inventory"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={onClose}
          >
            Inventory
          </NavLink>

          <NavLink
            to="/app/settings"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={onClose}
          >
            Settings
          </NavLink>
        </nav>
      </aside>
    </>
  );
}

/* ------------------------ Simple pages (inline) ------------------------ */
function FeaturePage({ title }: { title: string }) {
  return (
    <main className="home-shell" aria-label={title}>
      <div className="home-wrap">
        <section className="card machine-surface panel-frame">
          <h1 className="home-title">{title}</h1>
          <p className="home-lead">This page is live-routed. Wire the feature UI here.</p>
        </section>
      </div>
    </main>
  );
}

function AboutPage() {
  return (
    <main className="home-shell" aria-label="About JAL">
      <div className="home-wrap">
        <section className="card machine-surface panel-frame">
          <h1 className="home-title">About JAL</h1>
          <p className="home-lead">
            jalsol.com is founded by <strong>Jeremy Aaron Lugg</strong> — Sol-Trader • Mechanical Metal Engineer • Digital
            Creator.
          </p>
          <p className="home-lead">
            <strong>$JAL</strong> is accessible via the <strong>JAL/SOL</strong> pool on Raydium and verifiable on Solscan.
          </p>
          <div className="home-links">
            <a className="chip" href="https://raydium.io/" target="_blank" rel="noreferrer">
              Raydium (JAL/SOL)
            </a>
            <a className="chip" href="https://solscan.io/" target="_blank" rel="noreferrer">
              Solscan ($JAL)
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

function ShopPage() {
  return (
    <main className="home-shell" aria-label="Shop">
      <div className="home-wrap">
        <section className="card machine-surface panel-frame">
          <h1 className="home-title">Shop</h1>
          <p className="home-lead">
            Sole trader activity: design + creation of physical and digital products, sold online. jalsol.com is the hub.
          </p>
          <div className="home-links">
            <a className="chip" href="https://jalrelics.etsy.com" target="_blank" rel="noreferrer">
              Etsy Shop
            </a>
            <a className="chip" href="https://jalsol.com" target="_blank" rel="noreferrer">
              jalsol.com
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ------------------------ App Shell (only for /app/*) ------------------------ */
function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // ESC closes sidebar
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

  // Lock scroll when sidebar is open
  useEffect(() => {
    document.body.setAttribute("data-nav-open", menuOpen ? "true" : "false");
    return () => document.body.removeAttribute("data-nav-open");
  }, [menuOpen]);

  return (
    <>
      <HeaderView onMenu={() => setMenuOpen((v) => !v)} onLogo={() => navigate("/app/nav")} isOpen={menuOpen} />

      <SidebarView open={menuOpen} onClose={() => setMenuOpen(false)} />

      <Routes>
        <Route path="nav" element={<Landing mode="nav" />} />

        <Route path="home" element={<Home />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="shop" element={<ShopPage />} />

        <Route path="token" element={<FeaturePage title="Token Generation" />} />
        <Route path="raydium" element={<FeaturePage title="Raydium / Liquidity" />} />

        {/* WIRED: Engine */}
        <Route path="engine" element={<Engine />} />
        <Route path="engine/settings" element={<FeaturePage title="$JAL~Engine — Settings" />} />
        <Route path="engine/logs" element={<FeaturePage title="$JAL~Engine — Log Analysis" />} />

        <Route path="inventory" element={<FeaturePage title="Inventory / Packaged System" />} />
        <Route path="inventory/purchase" element={<FeaturePage title="Inventory — Purchase" />} />

        <Route path="settings" element={<FeaturePage title="Settings" />} />

        <Route path="*" element={<Navigate to="/app/nav" replace />} />
      </Routes>
    </>
  );
}

/* ------------------------ App Root ------------------------ */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ENTRY ONLY (no header) */}
        <Route path="/" element={<Landing mode="entry" />} />

        {/* APP (header appears only here) */}
        <Route path="/app/*" element={<AppShell />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}