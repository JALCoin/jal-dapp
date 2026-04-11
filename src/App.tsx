// src/App.tsx
import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import Footer from "./components/Footer";
import RequireAuth from "./components/RequireAuth";
import { useAuth } from "./context/AuthProvider";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Disclaimer from "./pages/Disclaimer";
import TrackPage from "./pages/TrackPage";
import { LEGAL_CONTACT_MAILTO, LEGAL_OPERATOR_NAME } from "./lib/legal";

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
          <img className="logo header-logo" src="/JALSOL1.gif" alt={LEGAL_OPERATOR_NAME} />
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
            items={[{ to: "/app/home", label: "Home" }]}
          />

          {isEngineerAccount ? (
            <SidebarSection
              title="Operator"
              onClose={onClose}
              items={[{ to: "/app/engine", label: "JAL Engine (Private)" }]}
            />
          ) : null}

          <SidebarSection
            title="Store"
            onClose={onClose}
            items={[
              { to: "/app/shop", label: "Shop" },
              { to: "/app/track", label: "Track Order" },
            ]}
          />

          <SidebarSection
            title="System"
            onClose={onClose}
            items={[
              { to: "/app/compliance", label: "Compliance Notice" },
              { to: "/app/about", label: "About Jeremy Aaron Lugg" },
              { to: "/app/legal", label: "Legal Pages" },
            ]}
          />
        </nav>
      </aside>
    </>
  );
}

function AboutPage() {
  return (
    <main className="home-shell" aria-label="About Jeremy Aaron Lugg">
      <div className="home-wrap">
        <section className="card machine-surface panel-frame">
          <h1 className="home-title">About Jeremy Aaron Lugg</h1>
          <p className="home-lead">
            <strong>Jeremy Aaron Lugg operates this public site under ABN 35 780 648 234.</strong>{" "}
            I have always been drawn to building, process, design, and the way structure turns
            ideas into something real.
          </p>
          <p className="home-lead">
            My background is hands-on. I spent years learning through construction, workshop
            environments, machining, and practical trade work. Those experiences shaped the way I
            think: start with the foundations, understand the system, respect the tools, and build
            carefully.
          </p>
          <p className="home-lead">
            Over time, that same mindset pulled me deeper into computers, digital tools, online
            products, and eventually blockchain systems. What began as curiosity about how markets,
            software, and infrastructure work evolved into a long-term effort to build something of
            my own.
          </p>
          <div className="home-links">
            <a className="chip" href="/app/compliance">
              Compliance Notice
            </a>
            <a className="chip" href="/app/shop">
              Shop
            </a>
            <a className="chip" href={LEGAL_CONTACT_MAILTO}>
              Contact
            </a>
          </div>
        </section>

        <section className="card machine-surface panel-frame">
          <h2 className="home-title" style={{ fontSize: "clamp(1.3rem, 2.2vw, 2rem)" }}>
            My Story
          </h2>
          <p className="home-lead">
            I did not come into this through a conventional tech path. I came into it through work,
            observation, and persistence. I learned from builders, tradesmen, workshop teams, and
            people willing to give me a chance to develop real skills. I also learned through hard
            changes in family life, responsibility, and the need to create stability for the people
            closest to me.
          </p>
          <p className="home-lead">
            That combination of hands-on trade experience and deep curiosity about systems pushed me
            toward entrepreneurship. I became interested in how products are built, how value moves,
            how technology can be shaped into something useful, and how digital and physical work
            can exist together under one business.
          </p>
          <p className="home-lead">
            The JAL identity comes from my initials, and the JALSOL project grew out of years of
            research into software, online sales, cryptocurrency infrastructure, and blockchain
            tools. For me, it represents experimentation, discipline, and the ongoing effort to
            turn skill, process, and lived experience into something practical.
          </p>
        </section>

        <section className="card machine-surface panel-frame">
          <h2 className="home-title" style={{ fontSize: "clamp(1.3rem, 2.2vw, 2rem)" }}>
            What Shaped This Site
          </h2>
          <ul className="home-identity-points">
            <li>Construction and trade work taught me to respect structure, detail, and process.</li>
            <li>Mechanical fitting and machining taught me precision, systems thinking, and repeatability.</li>
            <li>Entrepreneurship taught me that products, money, and public offers must be simple, compliant, and accountable.</li>
            <li>Research into blockchain and developer tooling showed me how technical systems can be turned into products and tools.</li>
          </ul>
        </section>

        <section className="card machine-surface panel-frame">
          <h2 className="home-title" style={{ fontSize: "clamp(1.3rem, 2.2vw, 2rem)" }}>
            What This Site Is Today
          </h2>
          <p className="home-lead">
            Today, this public site is the business-facing surface for Jeremy Aaron Lugg. It
            currently focuses on operator identity, legal clarity, and physical merch while public
            interactive features remain paused for review.
          </p>
          <p className="home-lead">
            Internal development, including private operator tooling such as JAL Engine, remains a
            separate matter from the current public offer. The public site is not presented as a
            live trading platform, public exchange, or managed financial service.
          </p>
          <p className="home-lead">
            The goal from here is straightforward: build carefully, stay compliant, and create
            something real that reflects both the practical skills I have developed and the long
            path that led me here.
          </p>
        </section>
      </div>
    </main>
  );
}

function LegalHubPage() {
  return (
    <main className="home-shell" aria-label="Legal pages">
      <div className="home-wrap">
        <section className="card machine-surface panel-frame">
          <h1 className="home-title">Legal Pages</h1>
          <p className="home-lead">
            This page is the document hub for the site. Use it for the formal pages that set out
            the current public boundary, operator details, customer rights, privacy handling, and
            compliance posture.
          </p>
          <p className="home-lead">
            If About is the plain-language story, Legal is the place for the documents and source
            links that support that story.
          </p>
          <div className="home-links">
            <a className="chip" href="/terms">
              Terms
            </a>
            <a className="chip" href="/privacy">
              Privacy
            </a>
            <a className="chip" href="/disclaimer">
              Disclaimer
            </a>
            <a className="chip" href="/app/compliance">
              Compliance Notice
            </a>
            <a
              className="chip"
              href="https://abr.business.gov.au/ABN/View?id=35780648234"
              target="_blank"
              rel="noreferrer"
            >
              ABN Lookup
            </a>
          </div>
        </section>

        <section className="card machine-surface panel-frame">
          <h2 className="home-title" style={{ fontSize: "clamp(1.3rem, 2.2vw, 2rem)" }}>
            What Legal Should Cover
          </h2>
          <ul className="home-identity-points">
            <li>Terms of use and consumer-law boundaries</li>
            <li>Privacy practices and contact points</li>
            <li>Disclaimer language around current site activity</li>
            <li>ABN identity and current compliance status</li>
          </ul>
        </section>
      </div>
    </main>
  );
}

function ComplianceNoticePage() {
  return (
    <main className="home-shell" aria-label="Compliance notice">
      <div className="home-wrap">
        <section className="card machine-surface panel-frame">
          <h1 className="home-title">Temporary Compliance Pause</h1>
          <p className="home-lead">
            Interactive site features are temporarily unavailable while registrations and legal
            settings are reviewed.
          </p>
          <p className="home-lead">
            Physical merch, operator identity, and legal information remain available. Orders and
            site activity continue to be supplied by Jeremy Aaron Lugg under ABN 35 780 648 234.
          </p>
          <p className="home-lead">
            Internal operator tools may remain available to authenticated engineer accounts and are
            not part of the current public site offer.
          </p>
          <div className="home-links">
            <a className="chip" href="/terms">
              Terms
            </a>
            <a className="chip" href="/privacy">
              Privacy
            </a>
            <a className="chip" href="/disclaimer">
              Disclaimer
            </a>
            <a className="chip" href="/app/shop">
              Shop
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

function RequireEngineerAccount({ children }: { children: ReactNode }) {
  const { isEngineerAccount } = useAuth();

  if (!isEngineerAccount) {
    return <Navigate to="/app/compliance" replace />;
  }

  return <>{children}</>;
}

function SitewideNoticeBar() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1200,
        padding: "12px 18px",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
        background:
          "linear-gradient(90deg, rgba(110,26,26,0.96), rgba(83,33,17,0.96), rgba(42,34,17,0.96))",
        color: "#f6ead9",
        fontSize: "0.92rem",
        letterSpacing: "0.02em",
      }}
    >
      Interactive features are temporarily paused while registrations and legal settings are
      reviewed. Visit{" "}
      <a href="/app/compliance" style={{ color: "#fff4d6" }}>
        the compliance notice
      </a>{" "}
      for the current public site status.
    </div>
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
        <Route path="legal" element={<LegalHubPage />} />
        <Route path="compliance" element={<ComplianceNoticePage />} />

        <Route path="shop" element={<ShopPage />} />
        <Route path="track" element={<TrackPage />} />

        <Route path="jal-sol" element={<Navigate to="/app/compliance" replace />} />
        <Route path="jal-sol/observe" element={<Navigate to="/app/compliance" replace />} />
        <Route path="jal-sol/enter" element={<Navigate to="/app/compliance" replace />} />
        <Route path="jal-sol/build" element={<Navigate to="/app/compliance" replace />} />
        <Route path="jal-sol/success" element={<Navigate to="/app/compliance" replace />} />

        <Route path="token" element={<Navigate to="/app/compliance" replace />} />
        <Route path="raydium" element={<Navigate to="/app/compliance" replace />} />

        <Route
          path="engine"
          element={
            <RequireAuth>
              <RequireEngineerAccount>
                <Engine />
              </RequireEngineerAccount>
            </RequireAuth>
          }
        />
        <Route path="engine/settings" element={<Navigate to="/app/compliance" replace />} />
        <Route path="engine/logs" element={<Navigate to="/app/compliance" replace />} />

        <Route path="inventory" element={<Navigate to="/app/compliance" replace />} />
        <Route path="inventory/purchase" element={<Navigate to="/app/compliance" replace />} />

        <Route path="settings" element={<Navigate to="/app/compliance" replace />} />

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
      <SitewideNoticeBar />
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
