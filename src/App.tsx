// src/App.tsx
import { useState, useEffect, useMemo, type ReactElement } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  useLocation,
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

/* Mobile deep-link handoff */
import {
  SolanaMobileWalletAdapter,
  createDefaultAuthorizationResultCache,
  createDefaultAddressSelector,
  createDefaultWalletNotFoundHandler,
} from "@solana-mobile/wallet-adapter-mobile";

/* Page transitions */
import { AnimatePresence, motion } from "framer-motion";

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
import Hub from "./pages/Hub";
import Jal from "./pages/Jal";

/* -------- Guard -------- */
function Protected({ children }: { children: ReactElement }) {
  const { connected } = useWallet();
  if (!connected) return <Navigate to="/" replace />;
  return children;
}

/* -------- App Shell -------- */
function Shell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userSymbol, setUserSymbol] = useState<string | null>(null);
  const location = useLocation();
  const { publicKey } = useWallet();

  const isLanding = location.pathname === "/";
  const isHub = location.pathname.startsWith("/hub");

  useEffect(() => {
    const stored = localStorage.getItem("vaultSymbol");
    if (stored) setUserSymbol(stored.toUpperCase());
  }, []);

  // Close menu when navigating
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Lock page scroll when sidebar is open OR when Hub overlay is active.
  // This prevents the "double scrollbar" (page + overlay) situation.
  useEffect(() => {
    const lock = menuOpen || isHub;
    const root = document.documentElement;
    if (lock) {
      root.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      root.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      root.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [menuOpen, isHub]);

  const toggleMenu = () => setMenuOpen(s => !s);
  const closeMenu = () => setMenuOpen(false);

  const vaultPath = useMemo(
    () => (userSymbol ? `/vault/${encodeURIComponent(userSymbol)}` : "/dashboard"),
    [userSymbol]
  );
  const vaultLabel = useMemo(
    () => (userSymbol ? `VAULT / ${userSymbol}` : "VAULT / JAL"),
    [userSymbol]
  );

  const links = [
    { to: "/", label: "JAL/SOL" },
    { to: "/hub", label: "HUB" },
    { to: vaultPath, label: vaultLabel },
    { to: "/learn", label: "LEARN/SOL" },
    { to: "/about", label: "About JAL" },
  ];

  const renderNavLink = (to: string, label: string) => (
    <NavLink
      key={`${to}-${label}`}
      to={to}
      onClick={closeMenu}
      className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
    >
      {label}
    </NavLink>
  );

  /* Framer variants — TS-friendly (no invalid ease types) */
  const hubIdle  = { opacity: 1, y: 0,   scale: 1 };
  const hubExit  = { opacity: 0, y: -36, scale: 0.99 };
  const hubTx    = { duration: 0.35 };

  const jalInit  = { opacity: 0, y: 18 };
  const jalIn    = { opacity: 1, y: 0 };
  const jalOut   = { opacity: 0, y: 12 };
  const jalTx    = { duration: 0.35, delay: 0.06 };

  return (
    <>
      {/* Keep header mounted ALWAYS so Hub slides UNDER it */}
      {!isLanding && (
        <header style={{ position: "relative", zIndex: 90 }}>
          <div className="header-inner">
            <NavLink to="/" onClick={closeMenu} aria-label="Go to Landing">
              <img src="/JALSOL1.gif" alt="JAL/SOL Logo" className="logo header-logo" />
            </NavLink>

            <nav className="main-nav" aria-label="Primary">
              {links.map((l) => renderNavLink(l.to, l.label))}
              {publicKey && <WalletDisconnectButton className="wallet-disconnect-btn" />}
            </nav>

            <div className="social-links" aria-label="Social links">
              <a href="https://x.com/JAL358" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter">
                <img src="/icons/X.png" alt="" />
              </a>
              <a href="https://t.me/jalsolcommute" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                <img src="/icons/Telegram.png" alt="" />
              </a>
              <a href="https://www.tiktok.com/@358jalsol" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <img src="/icons/TikTok.png" alt="" />
              </a>
            </div>

            {/* Animated hamburger */}
            <button
              className={`hamburger ${menuOpen ? "is-open" : ""}`}
              onClick={toggleMenu}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              aria-controls="sidebar-nav"
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>
          </div>

          <div className="header-rule" aria-hidden="true" />
        </header>
      )}

      {/* Sidebar now allowed on /hub as well */}
      {menuOpen && !isLanding && (
        <>
          <div className="sidebar-overlay" onClick={closeMenu} />
          <div id="sidebar-nav" className="sidebar-nav" role="dialog" aria-modal="true">
            {links.map((l) => renderNavLink(l.to, l.label))}
            {publicKey && <WalletDisconnectButton className="wallet-disconnect-btn" />}
          </div>
        </>
      )}

      {/* Animated routes */}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Landing />} />

          <Route
            path="/hub"
            element={
              <Protected>
                <motion.div
                  initial={hubIdle}
                  animate={hubIdle}
                  exit={hubExit}
                  transition={hubTx}
                  style={{
                    zIndex: 50, // below header
                    position: "relative",
                    willChange: "transform, opacity",
                  }}
                >
                  <Hub />
                </motion.div>
              </Protected>
            }
          />

          <Route path="/home" element={<Home />} />
          <Route path="/crypto-generator" element={<CryptoGenerator />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vault/:symbol" element={<Vault />} />
          <Route path="/about" element={<About />} />
          <Route path="/manifesto" element={<Manifesto />} />
          <Route path="/content" element={<Content />} />
          <Route path="/learn" element={<Learn />} />

          <Route
            path="/jal"
            element={
              <Protected>
                <motion.div
                  initial={jalInit}
                  animate={jalIn}
                  exit={jalOut}
                  transition={jalTx}
                  style={{
                    zIndex: 20,
                    position: "relative",
                    willChange: "transform, opacity",
                  }}
                >
                  <Jal />
                </motion.div>
              </Protected>
            }
          />

          <Route path="/start"   element={<Protected><div style={{ padding: 24 }}>Start flow…</div></Protected>} />
          <Route path="/utility" element={<Protected><div style={{ padding: 24 }}>Utility…</div></Protected>} />
          <Route path="/terms"   element={<Protected><div style={{ padding: 24 }}>Terms…</div></Protected>} />
          <Route path="*"        element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

/* -------- Root Providers -------- */
export default function App() {
  const endpoint = useMemo(() => {
    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
      return "http://localhost:3001/api/solana";
    }
    return "https://solana-proxy-production.up.railway.app";
  }, []);

  const network =
    (import.meta as any).env?.VITE_SOLANA_NETWORK === "devnet"
      ? WalletAdapterNetwork.Devnet
      : WalletAdapterNetwork.Mainnet;

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
            url: typeof window !== "undefined" ? window.location.origin : "https://jalsol.com",
            icons: ["https://jalsol.com/icons/icon-512.png"],
          },
        },
      }),
      new SolanaMobileWalletAdapter({
        addressSelector: createDefaultAddressSelector(),
        appIdentity: {
          name: "JAL/SOL",
          uri: "https://jalsol.com",
          icon: "/icons/icon-512.png",
        },
        authorizationResultCache: createDefaultAuthorizationResultCache(),
        cluster: "mainnet-beta",
        onWalletNotFound: createDefaultWalletNotFoundHandler(),
      }),
    ],
    [network]
  );

  const onError = (e: any) => console.error("Wallet error:", e);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect onError={onError}>
        <WalletModalProvider>
          <Router>
            <Shell />
          </Router>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
