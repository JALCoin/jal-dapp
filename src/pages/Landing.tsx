import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type Panel = "none" | "nav" | "home" | "jal" | "shop";
type LandingProps = { initialPanel?: Panel };

function NavOverlay({
  onSelect,
  onClose,
}: {
  onSelect: (p: Exclude<Panel, "none" | "nav">) => void;
  onClose: () => void;
}) {
  return (
    <>
      <button
        className="nav-overlay-backdrop"
        aria-label="Close navigation"
        onClick={onClose}
      />
      <section className="nav-overlay" role="dialog" aria-modal="true" aria-label="Navigation">
        <div className="nav-overlay-top">
          <button className="nav-back" type="button" onClick={onClose}>
            Back
          </button>
        </div>

        <div className="nav-overlay-body">
          <button className="nav-pill" onClick={() => onSelect("home")}>HOME</button>
          <button className="nav-pill" onClick={() => onSelect("jal")}>ABOUT JAL</button>
          <button className="nav-pill" onClick={() => onSelect("shop")}>SHOP</button>
        </div>
      </section>
    </>
  );
}

function HomeContent() {
  return (
    <div className="home-wrap">
      <section className="card">
        <h2 className="home-title">jalsol.com</h2>
        <p className="home-lead">
          Founded by <strong>Jeremy Aaron Lugg</strong> — Sol-Trader • Mechanical Metal Engineer • Digital Creator.
          Minimal interface linked to the Solana ecosystem.
        </p>
        <p className="home-lead">
          $JAL sits in the <strong>JAL/SOL</strong> liquidity pool on Raydium and can be checked on Solscan.
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

      <section className="engine-window card">
        <div className="engine-head">
          <h3 className="engine-title">$JAL~Engine</h3>
          <div className="engine-sub">CEX connector • Jeroid deployment • logs</div>
        </div>

        <div className="engine-controls">
          <button className="button gold" type="button">Start</button>
          <button className="button" type="button">Stop</button>
          <button className="button ghost" type="button">Settings</button>
          <button className="button ghost" type="button">Log Analysis</button>
        </div>

        <div className="engine-log" aria-label="Engine log output">
          <pre>{`[engine] idle
[executor] disconnected
[deploy] awaiting config`}</pre>
        </div>
      </section>

      <section className="card gold">
        <h3>Engine Package</h3>
        <p>Packaged engine + deployment software for anyone building their own iteration of this system.</p>
        <div className="engine-controls">
          <button className="button gold" type="button">View</button>
          <button className="button" type="button">Purchase</button>
        </div>
      </section>
    </div>
  );
}

export default function Landing({ initialPanel = "none" }: LandingProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [panel, setPanel] = useState<Panel>(initialPanel);
  const [loading, setLoading] = useState(false);

  // Keep state aligned with route when inside /app/*
  useEffect(() => {
    const path = location.pathname;

    if (path === "/") {
      setPanel("none");
      return;
    }

    if (path.startsWith("/app/")) {
      const tail = path.replace("/app/", "");
      if (tail.startsWith("nav")) setPanel("nav");
      else if (tail.startsWith("home")) setPanel("home");
      else if (tail.startsWith("about")) setPanel("jal");
      else if (tail.startsWith("shop")) setPanel("shop");
    }
  }, [location.pathname]);

  // Allow header logo to open NAV overlay (only within /app/*)
  useEffect(() => {
    const onOpen = () => {
      if (!location.pathname.startsWith("/app/")) return;
      setPanel("nav");
      navigate("/app/nav", { replace: true });
    };
    window.addEventListener("JALSOL:OPEN_NAV" as any, onOpen);
    return () => window.removeEventListener("JALSOL:OPEN_NAV" as any, onOpen);
  }, [navigate, location.pathname]);

  // Lock scroll when nav open
  useEffect(() => {
    if (panel === "nav") document.body.setAttribute("data-nav-open", "true");
    else document.body.removeAttribute("data-nav-open");
    return () => document.body.removeAttribute("data-nav-open");
  }, [panel]);

  // ESC closes NAV back to home
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && panel === "nav") {
        setPanel("home");
        navigate("/app/home", { replace: true });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, navigate]);

  // ENTER: loader first, then mount app shell + NAV
  const enter = () => {
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      navigate("/app/nav", { replace: true });
      setPanel("nav");
    }, 5000);
  };

  const onNavSelect = (next: Exclude<Panel, "none" | "nav">) => {
    if (next === "home") navigate("/app/home", { replace: true });
    if (next === "jal") navigate("/app/about", { replace: true });
    if (next === "shop") navigate("/app/shop", { replace: true });
    setPanel(next);
  };

  const content = useMemo(() => {
    if (panel === "home") return <HomeContent />;

    if (panel === "jal") {
      return (
        <div className="home-wrap">
          <section className="card">
            <h2>About JAL</h2>
            <p>
              $JAL is accessible on Raydium (JAL/SOL) and verifiable on Solscan.
              jalsol.com is a minimal interface designed to work with the cryptocurrency market.
            </p>
          </section>
        </div>
      );
    }

    if (panel === "shop") {
      return (
        <div className="home-wrap">
          <section className="card">
            <h2>Shop</h2>
            <p>
              Sole trader activity: design + creation of physical and digital products, sold online.
              jalsol.com is the hub.
            </p>
            <div className="home-links" style={{ marginTop: 10 }}>
              <a className="chip" href="https://jalrelics.etsy.com" target="_blank" rel="noreferrer">
                Etsy Shop
              </a>
              <a className="chip" href="https://jalsol.com" target="_blank" rel="noreferrer">
                jalsol.com
              </a>
            </div>
          </section>
        </div>
      );
    }

    return null;
  }, [panel]);

  // ENTRY ROUTE UI (no header exists because App.tsx doesn't render it on "/")
  if (location.pathname === "/") {
    return (
      <main className={`landing-blank ${loading ? "is-fading" : ""}`} aria-label="JAL/SOL">
        {!loading && (
          <button className="center-logo-btn" onClick={enter} aria-label="Enter jalsol.com">
            <img className="center-logo" src="/JALSOL1.gif" alt="JAL/SOL" />
            <div className="center-logo-hint">ENTER</div>
          </button>
        )}

        {loading && (
          <div className="loading-screen" role="status" aria-label="Loading" aria-live="polite">
            <img className="loading-logo" src="/JALSOL1.gif" alt="" />
          </div>
        )}
      </main>
    );
  }

  // /app/* UI (header is rendered by AppShell)
  return (
    <main className="landing-blank" aria-label="JAL/SOL">
      {panel === "nav" && (
        <NavOverlay
          onSelect={onNavSelect}
          onClose={() => {
            setPanel("home");
            navigate("/app/home", { replace: true });
          }}
        />
      )}

      {panel !== "nav" && (
        <section className="home-shell">
          <div className="home-shell-top">
            <button className="home-open-nav" type="button" onClick={() => { setPanel("nav"); navigate("/app/nav", { replace: true }); }}>
              Menu
            </button>
          </div>
          {content}
        </section>
      )}
    </main>
  );
}