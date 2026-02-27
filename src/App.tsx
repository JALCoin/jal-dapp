// src/App.tsx
import { useEffect, useMemo, useState } from "react";
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
import ShopPage from "./pages/Shop";

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
          <a
            href="https://x.com/JAL358"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X"
          >
            <img src="/icons/X.png" alt="" />
          </a>
          <a
            href="https://t.me/jalsolcommute"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
          >
            <img src="/icons/Telegram.png" alt="" />
          </a>
          <a
            href="https://www.tiktok.com/@358jalsol"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
          >
            <img src="/icons/TikTok.png" alt="" />
          </a>
        </div>

        {/* Center: logo opens MAIN NAV overlay */}
        <button
          type="button"
          onClick={onLogo}
          aria-label="Open navigation"
          className="logo-btn"
        >
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
type NavItem = { to: string; label: string };

function SidebarSection({
  title,
  items,
  onClose,
}: {
  title: string;
  items: NavItem[];
  onClose: () => void;
}) {
  return (
    <section aria-label={title}>
      <div
        style={{
          opacity: 0.78,
          fontSize: "0.72rem",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          margin: "8px 0 10px",
        }}
      >
        {title}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={onClose}
          >
            {it.label}
          </NavLink>
        ))}
      </div>
    </section>
  );
}

function SidebarView({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <>
      {/* Overlay click closes */}
      <button
        className="sidebar-overlay"
        aria-label="Close menu overlay"
        onClick={onClose}
      />

      <aside className="sidebar-nav" aria-label="Sidebar navigation">
        {/* Top row inside panel: title + close */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div
            style={{
              fontWeight: 900,
              letterSpacing: ".10em",
              textTransform: "uppercase",
              opacity: 0.9,
            }}
          >
            Menu
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,.12)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,0))",
            }}
          >
            ×
          </button>
        </div>

        <nav aria-label="Primary routes" style={{ display: "grid", gap: 14 }}>
          <SidebarSection
            title="Core"
            onClose={onClose}
            items={[
              { to: "/app/home", label: "Home" },
              { to: "/app/engine", label: "$JAL~Engine" },
            ]}
          />

          <SidebarSection
            title="Utility"
            onClose={onClose}
            items={[
              { to: "/app/token", label: "Token Generation" },
              { to: "/app/raydium", label: "Raydium / Liquidity" },
            ]}
          />

          <SidebarSection
            title="Store"
            onClose={onClose}
            items={[
              { to: "/app/shop", label: "Shop" },
              { to: "/app/inventory", label: "Inventory" },
            ]}
          />

          <SidebarSection
            title="System"
            onClose={onClose}
            items={[
              { to: "/app/about", label: "About JAL" },
              { to: "/app/settings", label: "Settings" },
            ]}
          />
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
            jalsol.com is founded by <strong>Jeremy Aaron Lugg</strong> — Sol-Trader •
            Mechanical Metal Engineer • Digital Creator.
          </p>
          <p className="home-lead">
            <strong>$JAL</strong> is accessible via the <strong>JAL/SOL</strong> pool on
            Raydium and verifiable on Solscan.
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

/* ------------------------ App Shell (only for /app/*) ------------------------ */
function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navOverlayOpen = useMemo(() => {
    return location.pathname === "/app/nav";
  }, [location.pathname]);

  // ESC closes sidebar; if nav overlay is up, ESC returns to home
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;

      if (menuOpen) {
        setMenuOpen(false);
        return;
      }

      if (navOverlayOpen) {
        navigate("/app/home", { replace: true });
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, navOverlayOpen, navigate]);

  // Close sidebar on route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Lock scroll when sidebar OR nav overlay is open
  useEffect(() => {
    const locked = menuOpen || navOverlayOpen;
    document.body.setAttribute("data-nav-open", locked ? "true" : "false");
    return () => {
      document.body.removeAttribute("data-nav-open");
    };
  }, [menuOpen, navOverlayOpen]);

  return (
    <>
      <HeaderView
        onMenu={() => setMenuOpen((v) => !v)}
        onLogo={() => navigate("/app/nav")}
        isOpen={menuOpen}
      />

      <SidebarView open={menuOpen} onClose={() => setMenuOpen(false)} />

      <Routes>
        {/* NAV overlay */}
        <Route path="nav" element={<Landing mode="nav" />} />

        <Route path="home" element={<Home />} />
        <Route path="about" element={<AboutPage />} />

        {/* REAL shop page */}
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