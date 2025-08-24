// src/App.tsx
import {
  useState,
  useEffect,
  useMemo,
  memo,
  useRef,
  type ReactElement,
} from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";

import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletDisconnectButton,
} from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletConnectWalletAdapter } from "@solana/wallet-adapter-walletconnect";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import "@solana/wallet-adapter-react-ui/styles.css";

import {
  SolanaMobileWalletAdapter,
  createDefaultAuthorizationResultCache,
  createDefaultAddressSelector,
  createDefaultWalletNotFoundHandler,
} from "@solana-mobile/wallet-adapter-mobile";

import { AnimatePresence } from "framer-motion";

/* Pages */
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import CryptoGenerator from "./pages/CryptoGenerator";
import Dashboard from "./pages/Dashboard";
import Vault from "./pages/Vault";
import About from "./pages/About";
import Manifesto from "./pages/Manifesto";
import Learn from "./pages/Learn";
import Content from "./pages/Content";
import Jal from "./pages/Jal";

/* ---------------- Guard ---------------- */
// Remember where the user wanted to go, then bounce to "/" if disconnected.
function Protected({ children }: { children: ReactElement }) {
  const { connected } = useWallet();
  const location = useLocation();

  if (!connected) {
    try {
      sessionStorage.setItem(
        "returnTo",
        location.pathname + location.search + location.hash
      );
    } catch {}
    return <Navigate to="/" replace />;
  }
  return children;
}

/* ---------------- Header ---------------- */
type HeaderProps = {
  isLanding: boolean;
  links: { to: string; label: string }[];
  menuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
  publicKey: string | null | undefined;
};

function HeaderView({
  isLanding,
  links,
  menuOpen,
  toggleMenu,
  closeMenu,
  publicKey,
}: HeaderProps): ReactElement | null {
  if (isLanding) return null;

  return (
    <header className="site-header">
      <div className="header-inner">
        <NavLink to="/" onClick={closeMenu} aria-label="JAL/SOL Home">
          <img
            src="/JALSOL1.gif"
            alt="JAL/SOL Logo"
            className="logo header-logo"
          />
        </NavLink>

        <nav className="main-nav" aria-label="Primary">
          {links.map(({ to, label }) => (
            <NavLink
              key={`${to}-${label}`}
              to={to}
              onClick={closeMenu}
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              {label}
            </NavLink>
          ))}
          {publicKey && (
            <WalletDisconnectButton className="wallet-disconnect-btn" />
          )}
        </nav>

        <div className="social-links" aria-label="Social links">
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

        <button
          className={`hamburger ${menuOpen ? "is-open" : ""}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          aria-controls="sidebar-nav"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
const Header = memo(HeaderView);

/* ---------------- Sidebar ---------------- */
function SidebarView({
  open,
  isLanding,
  links,
  closeMenu,
  publicKey,
}: {
  open: boolean;
  isLanding: boolean;
  links: { to: string; label: string }[];
  closeMenu: () => void;
  publicKey: string | null | undefined;
}): ReactElement | null {
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open || isLanding) return;

    // Remember the opener to restore focus later
    lastFocusedRef.current = (document.activeElement as HTMLElement) ?? null;

    // Focus first actionable
    const toFocus =
      firstLinkRef.current ??
      sidebarRef.current?.querySelector<HTMLElement>(
        'a, button, [tabindex]:not([tabindex="-1"])'
      );
    toFocus?.focus?.();

    // Lock scroll under the drawer
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMenu();
        return;
      }
      if (e.key !== "Tab") return;

      const root = sidebarRef.current;
      if (!root) return;

      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(
          'a, button, [role="button"], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter(
        (el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden")
      );

      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      lastFocusedRef.current?.focus?.();
    };
  }, [open, isLanding, closeMenu]);

  if (!open || isLanding) return null;

  return (
    <>
      <div className="sidebar-overlay" onClick={closeMenu} />
      <div
        id="sidebar-nav"
        className="sidebar-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        ref={sidebarRef}
      >
        {links.map(({ to, label }, idx) => (
          <NavLink
            key={`${to}-${label}`}
            to={to}
            onClick={closeMenu}
            className={({ isActive }) =>
              `nav-link${isActive ? " active" : ""}`
            }
            ref={idx === 0 ? firstLinkRef : undefined}
          >
            {label}
          </NavLink>
        ))}
        {publicKey && (
          <WalletDisconnectButton className="wallet-disconnect-btn" />
        )}
      </div>
    </>
  );
}
const Sidebar = memo(SidebarView);

/* ---------------- App Shell (routes, header, sidebar) ---------------- */
function Shell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userSymbol, setUserSymbol] = useState<string | null>(null);

  // Pull select/connect so we can eagerly reconnect on mobile resume
  const { publicKey, wallet, connected, connecting, select, connect } = useWallet();

  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLElement | null>(null);

  const isLanding = location.pathname === "/" || location.pathname === "/shop";

  // Reconnect nudge for iOS/Safari when returning from wallet
  useEffect(() => {
    const onVisible = () => {
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  // 🔁 Eager reconnect after coming back from wallet app (mobile)
  useEffect(() => {
    let busy = false;

    const getStoredWalletName = () =>
      localStorage.getItem("walletAdapter") || localStorage.getItem("walletName");

    const maybeReconnect = async () => {
      if (document.hidden) return;
      if (busy) return;
      if (connected || connecting) return;

      const stored = getStoredWalletName();
      if (!stored) return;

      busy = true;
      try {
        if (!wallet || wallet.adapter?.name !== stored) {
          // @ts-ignore: wallet name string is fine here
          await select?.(stored);
        }
        await connect?.();
      } catch {
        // swallow; user can open modal manually
      } finally {
        busy = false;
      }
    };

    const onFocusOrVisible = () => void maybeReconnect();

    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);
    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
  }, [connected, connecting, wallet, select, connect]);

  // Basic diagnostics in dev
  useEffect(() => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info("[wallet]", {
        connected,
        connecting,
        pubkey: publicKey?.toString(),
        wallet: wallet?.adapter?.name,
      });
    }
  }, [connected, connecting, publicKey, wallet]);

  useEffect(() => {
    const stored = localStorage.getItem("vaultSymbol");
    if (stored) setUserSymbol(stored.toUpperCase());
  }, []);

  // Close menu when route changes
  useEffect(() => setMenuOpen(false), [location.pathname]);

  // Move focus to main content after route change or menu close
  useEffect(() => {
    if (!menuOpen) {
      requestAnimationFrame(() => mainRef.current?.focus?.());
    }
  }, [menuOpen, location.pathname]);

  // Redirect back to intended route once connected
  useEffect(() => {
    if (!connected) return;

    let target: string | null = null;
    try {
      target = sessionStorage.getItem("returnTo");
    } catch {}

    const here = location.pathname + location.search + location.hash;
    if (target && target !== here) {
      try {
        sessionStorage.removeItem("returnTo");
      } catch {}
      navigate(target, { replace: true });
    }
  }, [connected, location.pathname, location.search, location.hash, navigate]);

  const toggleMenu = () => setMenuOpen((s) => !s);
  const closeMenu = () => setMenuOpen(false);

  const vaultPath = useMemo(
    () => (userSymbol ? `/vault/${encodeURIComponent(userSymbol)}` : "/dashboard"),
    [userSymbol]
  );
  const vaultLabel = useMemo(
    () => (userSymbol ? `VAULT / ${userSymbol}` : "VAULT / JAL"),
    [userSymbol]
  );

  const links = useMemo(
    () => [
      { to: "/", label: "JAL/SOL" },
      { to: "/jal", label: "JAL" },
      { to: vaultPath, label: vaultLabel },
      { to: "/shop", label: "SHOP" },
      { to: "/learn", label: "LEARN/SOL" },
      { to: "/about", label: "About JAL" },
    ],
    [vaultLabel, vaultPath]
  );

  return (
    <>
      <Header
        isLanding={isLanding}
        links={links}
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
        closeMenu={closeMenu}
        publicKey={publicKey?.toBase58?.() ?? publicKey?.toString?.() ?? null}
      />
      <Sidebar
        open={menuOpen}
        isLanding={isLanding}
        links={links}
        closeMenu={closeMenu}
        publicKey={publicKey?.toBase58?.() ?? publicKey?.toString?.() ?? null}
      />

      <main
        ref={mainRef}
        role="main"
        tabIndex={-1}
        aria-live="polite"
        aria-label="JAL/SOL content"
      >
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Landing: default panel (none), /shop opens shop panel inside Landing */}
            <Route path="/" element={<Landing />} />
            <Route path="/shop" element={<Landing initialPanel="shop" />} />

            {/* Other routes */}
            <Route path="/home" element={<Home />} />
            <Route path="/crypto-generator" element={<CryptoGenerator />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vault/:symbol" element={<Vault />} />
            <Route
              path="/jal"
              element={
                <Protected>
                  <Jal inHub={false} />
                </Protected>
              }
            />
            <Route path="/about" element={<About />} />
            <Route path="/manifesto" element={<Manifesto />} />
            <Route path="/content" element={<Content />} />
            <Route path="/learn" element={<Learn />} />
            <Route
              path="/start"
              element={
                <Protected>
                  <div style={{ padding: 24 }}>Start flow…</div>
                </Protected>
              }
            />
            <Route
              path="/terms"
              element={
                <Protected>
                  <div style={{ padding: 24 }}>Terms…</div>
                </Protected>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
    </>
  );
}

/* ---------------- Root Providers ---------------- */
export default function App() {
  // Absolute origin/URLs for wallet deep-link metadata
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://jalsol.com";

  // RPC endpoint selection
  const endpoint = useMemo(() => {
    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
      return "http://localhost:3001/api/solana";
    }
    return "https://solana-proxy-production.up.railway.app";
  }, []);

  // Cluster config
  const network =
    (import.meta as any).env?.VITE_SOLANA_NETWORK === "devnet"
      ? WalletAdapterNetwork.Devnet
      : WalletAdapterNetwork.Mainnet;
  const clusterStr = network === WalletAdapterNetwork.Devnet ? "devnet" : "mainnet-beta";

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new WalletConnectWalletAdapter({
        network,
        options: {
          projectId: "1bb9e8b5e5b18eafdd0cef6047b67773",
          relayUrl: "wss://relay.walletconnect.com",
          metadata: {
            name: "JAL/SOL Dapp",
            description: "Swap SOL→JAL and use utilities",
            url: origin, // absolute
            icons: [`${origin}/icons/icon-512.png`], // absolute
          },
        },
      }),
      new SolanaMobileWalletAdapter({
        addressSelector: createDefaultAddressSelector(),
        appIdentity: {
          name: "JAL/SOL",
          uri: origin, // absolute
          icon: `${origin}/icons/icon-512.png`, // absolute
        },
        authorizationResultCache: createDefaultAuthorizationResultCache(),
        cluster: clusterStr,
        onWalletNotFound: createDefaultWalletNotFoundHandler(),
      }),
    ],
    [network, origin, clusterStr]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        wallets={wallets}
        autoConnect
        onError={(e) => console.error("[wallet-adapter] error:", e)}
      >
        <WalletModalProvider>
          <Router>
            <Shell />
          </Router>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
