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
import AuthPage from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import JalSolPage from "./pages/JalSol";
import JalSolSuccess from "./pages/JalSolSuccess";
import JalSolObserve from "./pages/JalSolObserve";
import JalSolEnter from "./pages/JalSolEnter";
import JalSolBuild from "./pages/JalSolBuild";
import Footer from "./components/Footer";
import RequireAuth from "./components/RequireAuth";
import { useAuth } from "./context/AuthProvider";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Disclaimer from "./pages/Disclaimer";
import TrackPage from "./pages/TrackPage";

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
        <div className="social-links" aria-label="Social Links">
          <a href="https://x.com/JAL358" target="_blank" rel="noopener noreferrer" aria-label="X">
            <img src="/icons/X.png" alt="" />
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

        <button type="button" onClick={onLogo} aria-label="Open navigation" className="logo-btn">
          <img className="logo header-logo" src="/JALSOL1.gif" alt="JAL/SOL" />
        </button>

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

function EngineerModePanel({
  isEngineerAccount,
  isEngineer,
  isTestingAsMember,
  switchingMode,
  modeError,
  onToggleMode,
}: {
  isEngineerAccount: boolean;
  isEngineer: boolean;
  isTestingAsMember: boolean;
  switchingMode: boolean;
  modeError: string | null;
  onToggleMode: () => void;
}) {
  if (!isEngineerAccount) return null;

  return (
    <section className="sidebar-engineer-panel" aria-label="Engineer testing controls">
      <div className="sidebar-engineer-head">
        <div className="sidebar-engineer-kicker">Engineer Control</div>
        <span
          className={`sidebar-engineer-mode ${isTestingAsMember ? "is-member" : "is-engineer"}`}
        >
          {isEngineer ? "Engineer Mode" : "Test as Member"}
        </span>
      </div>

      <p className="sidebar-engineer-copy">
        Keep your Engineer account, then switch into member test mode to restore paywalls and gate
        restrictions while you trial each step.
      </p>

      <button
        type="button"
        className={`button ${isTestingAsMember ? "neon" : "gold"} sidebar-engineer-toggle`}
        onClick={onToggleMode}
        disabled={switchingMode}
      >
        {switchingMode
          ? "Switching..."
          : isTestingAsMember
            ? "Return To Engineer"
            : "Switch To Member Test"}
      </button>

      <div className="sidebar-engineer-status">
        <span className="chip">
          Effective Access: {isEngineer ? "Engineer" : "Member"}
        </span>
        <span className="chip">Paywalls: {isTestingAsMember ? "On" : "Bypassed"}</span>
      </div>

      {modeError ? <p className="sidebar-engineer-error">{modeError}</p> : null}
    </section>
  );
}

function AccountAccessPanel({
  session,
  identity,
  roleLabel,
  signingOut,
  authError,
  onOpenAuth,
  onSignOut,
}: {
  session: boolean;
  identity: string;
  roleLabel: string;
  signingOut: boolean;
  authError: string | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
}) {
  return (
    <section className="sidebar-account-panel" aria-label="Account access">
      <div className="sidebar-engineer-head">
        <div className="sidebar-engineer-kicker">Account Access</div>
        <span className={`sidebar-engineer-mode ${session ? "is-engineer" : "is-member"}`}>
          {session ? "Signed In" : "Signed Out"}
        </span>
      </div>

      <p className="sidebar-account-copy">
        {session
          ? `Signed in as ${identity}.`
          : "No password needed. Use your email or chosen handle to request a magic sign-in link."}
      </p>

      {session ? (
        <div className="sidebar-engineer-status">
          <span className="chip">Identity: {identity}</span>
          <span className="chip">Role: {roleLabel}</span>
        </div>
      ) : null}

      <div className="sidebar-account-actions">
        <button type="button" className="button ghost" onClick={onOpenAuth}>
          {session ? "Open Access Terminal" : "Sign In / Sign Up"}
        </button>

        {session ? (
          <button
            type="button"
            className="button gold"
            onClick={onSignOut}
            disabled={signingOut}
          >
            {signingOut ? "Signing Out..." : "Sign Out"}
          </button>
        ) : null}
      </div>

      {authError ? <p className="sidebar-account-error">{authError}</p> : null}
    </section>
  );
}

function SidebarView({
  open,
  onClose,
  session,
  accountIdentity,
  roleLabel,
  signingOut,
  authError,
  onOpenAuth,
  onSignOut,
  isEngineerAccount,
  isEngineer,
  isTestingAsMember,
  switchingMode,
  modeError,
  onToggleMode,
}: {
  open: boolean;
  onClose: () => void;
  session: boolean;
  accountIdentity: string;
  roleLabel: string;
  signingOut: boolean;
  authError: string | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  isEngineerAccount: boolean;
  isEngineer: boolean;
  isTestingAsMember: boolean;
  switchingMode: boolean;
  modeError: string | null;
  onToggleMode: () => void;
}) {
  if (!open) return null;

  return (
    <>
      <button className="sidebar-overlay" aria-label="Close menu overlay" onClick={onClose} />

      <aside className="sidebar-nav" aria-label="Sidebar navigation">
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
              background: "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,0))",
            }}
          >
            ×
          </button>
        </div>

        <nav aria-label="Primary routes" style={{ display: "grid", gap: 14 }}>
          <AccountAccessPanel
            session={session}
            identity={accountIdentity}
            roleLabel={roleLabel}
            signingOut={signingOut}
            authError={authError}
            onOpenAuth={onOpenAuth}
            onSignOut={onSignOut}
          />

          <EngineerModePanel
            isEngineerAccount={isEngineerAccount}
            isEngineer={isEngineer}
            isTestingAsMember={isTestingAsMember}
            switchingMode={switchingMode}
            modeError={modeError}
            onToggleMode={onToggleMode}
          />

          <SidebarSection
            title="Core"
            onClose={onClose}
            items={[
              { to: "/app/home", label: "Home" },
              { to: "/app/engine", label: "$JAL~Engine" },
            ]}
          />

          <SidebarSection
            title="JAL/SOL"
            onClose={onClose}
            items={[
              { to: "/app/jal-sol", label: "World Hub" },
              { to: "/app/jal-sol/observe", label: "Gate 1 — Observe" },
              { to: "/app/jal-sol/enter", label: "Gate 2 — Enter" },
              { to: "/app/jal-sol/build", label: "Gate 3 — Build" },
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
              { to: "/app/track", label: "Track Order" },
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
            jalsol.com is founded by <strong>Jeremy Aaron Lugg</strong> — Sol-Trader • Mechanical
            Metal Engineer • Digital Creator.
          </p>
          <p className="home-lead">
            <strong>$JAL</strong> is accessible via the <strong>JAL/SOL</strong> pool on Raydium and
            verifiable on Solscan.
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
  const {
    session,
    user,
    profile,
    isEngineer,
    isEngineerAccount,
    isTestingAsMember,
    setTestingAsMember,
    signOut,
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [switchingMode, setSwitchingMode] = useState(false);
  const [modeError, setModeError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const navOverlayOpen = useMemo(() => location.pathname === "/app/nav", [location.pathname]);
  const accountIdentity = useMemo(() => {
    if (profile?.display_name?.trim()) return profile.display_name.trim();
    if (user?.email?.trim()) return user.email.trim();
    return "Guest";
  }, [profile?.display_name, user?.email]);
  const roleLabel = useMemo(() => {
    if (!profile) return "Pending";
    return isEngineer ? "Engineer" : "Member";
  }, [isEngineer, profile]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;

      if (menuOpen) {
        setMenuOpen(false);
        return;
      }

      if (navOverlayOpen) navigate("/app/home", { replace: true });
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, navOverlayOpen, navigate]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const locked = menuOpen || navOverlayOpen;
    document.body.setAttribute("data-nav-open", locked ? "true" : "false");
    return () => document.body.removeAttribute("data-nav-open");
  }, [menuOpen, navOverlayOpen]);

  async function handleToggleMode() {
    if (!isEngineerAccount || switchingMode) return;

    setSwitchingMode(true);
    setModeError(null);

    try {
      await setTestingAsMember(!isTestingAsMember);
    } catch (error) {
      console.error("Failed to switch engineer testing mode", error);
      setModeError("Mode switch failed. Try again.");
    } finally {
      setSwitchingMode(false);
    }
  }

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);
    setAuthError(null);

    try {
      await signOut();
      setMenuOpen(false);
      navigate("/auth", { replace: true });
    } catch (error) {
      console.error("Failed to sign out", error);
      setAuthError("Sign out failed. Try again.");
    } finally {
      setSigningOut(false);
    }
  }

  function handleOpenAuth() {
    setMenuOpen(false);
    navigate("/auth");
  }

  return (
    <>
      <HeaderView
        onMenu={() => setMenuOpen((v) => !v)}
        onLogo={() => navigate("/app/nav")}
        isOpen={menuOpen}
      />

      <SidebarView
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        session={Boolean(session)}
        accountIdentity={accountIdentity}
        roleLabel={roleLabel}
        signingOut={signingOut}
        authError={authError}
        onOpenAuth={handleOpenAuth}
        onSignOut={() => void handleSignOut()}
        isEngineerAccount={isEngineerAccount}
        isEngineer={isEngineer}
        isTestingAsMember={isTestingAsMember}
        switchingMode={switchingMode}
        modeError={modeError}
        onToggleMode={handleToggleMode}
      />

      <Routes>
        <Route path="nav" element={<Landing mode="nav" />} />

        <Route path="home" element={<Home />} />
        <Route path="about" element={<AboutPage />} />

        <Route path="shop" element={<ShopPage />} />
        <Route path="track" element={<TrackPage />} />

        <Route path="jal-sol" element={<JalSolPage />} />
        <Route
          path="jal-sol/observe"
          element={
            <RequireAuth>
              <JalSolObserve />
            </RequireAuth>
          }
        />
        <Route
          path="jal-sol/enter"
          element={
            <RequireAuth>
              <JalSolEnter />
            </RequireAuth>
          }
        />
        <Route
          path="jal-sol/build"
          element={
            <RequireAuth>
              <JalSolBuild />
            </RequireAuth>
          }
        />
        <Route path="jal-sol/success" element={<JalSolSuccess />} />

        <Route
          path="token"
          element={
            <RequireAuth>
              <FeaturePage title="Token Generation" />
            </RequireAuth>
          }
        />
        <Route path="raydium" element={<FeaturePage title="Raydium / Liquidity" />} />

        <Route path="engine" element={<Engine />} />
        <Route path="engine/settings" element={<FeaturePage title="$JAL~Engine — Settings" />} />
        <Route path="engine/logs" element={<FeaturePage title="$JAL~Engine — Log Analysis" />} />

        <Route path="inventory" element={<FeaturePage title="Inventory / Packaged System" />} />
        <Route path="inventory/purchase" element={<FeaturePage title="Inventory — Purchase" />} />

        <Route path="settings" element={<FeaturePage title="Settings" />} />

        <Route path="*" element={<Navigate to="/app/nav" replace />} />
      </Routes>

      <Footer />
    </>
  );
}

/* ------------------------ App Root ------------------------ */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing mode="entry" />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/app/*" element={<AppShell />} />

        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/disclaimer" element={<Disclaimer />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
