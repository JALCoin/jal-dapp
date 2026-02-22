import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Panel = "none" | "nav" | "home" | "jal" | "shop";
type LandingProps = { initialPanel?: Exclude<Panel, "nav"> };

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
          Minimal interface linked to Solana.
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
        <p>
          Packaged engine + deployment software for anyone building their own iteration of this system.
        </p>
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
  const [panel, setPanel] = useState<Panel>(initialPanel);

  // 5s loading pulse after ENTER, then show NAV
  const [loading, setLoading] = useState(false);

  const entered = panel !== "none";

  // allow header-logo to open nav overlay
  useEffect(() => {
    const onOpen = () => setPanel("nav");
    window.addEventListener("JALSOL:OPEN_NAV" as any, onOpen);
    return () => window.removeEventListener("JALSOL:OPEN_NAV" as any, onOpen);
  }, []);

  // lock scroll when nav open
  useEffect(() => {
    if (panel === "nav") document.body.setAttribute("data-nav-open", "true");
    else document.body.removeAttribute("data-nav-open");
    return () => document.body.removeAttribute("data-nav-open");
  }, [panel]);

  // ESC closes NAV
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && panel === "nav") setPanel("home");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel]);

  const enter = () => {
    setLoading(true);
    setPanel("home"); // immediately route into entered state (header appears), then nav after load
    navigate("/home", { replace: true });

    window.setTimeout(() => {
      setLoading(false);
      setPanel("nav");
    }, 5000);
  };

  const onNavSelect = (next: Exclude<Panel, "none" | "nav">) => {
    if (next === "home") navigate("/home", { replace: true });
    if (next === "jal") navigate("/about", { replace: true });
    if (next === "shop") navigate("/shop", { replace: true });
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
              This app is a minimal interface connected to Solana.
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
              Sole trader work: design + creation of physical and digital products sold online.
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

  return (
    <main className={`landing-blank ${loading ? "is-fading" : ""}`} aria-label="JAL/SOL">
      {/* ENTRY (blank + logo button) */}
      {!entered && (
        <button className="center-logo-btn" onClick={enter} aria-label="Enter jalsol.com">
          <img className="center-logo" src="/JALSOL1.gif" alt="JAL/SOL" />
          <div className="center-logo-hint">ENTER</div>
        </button>
      )}

      {/* 5s LOADING (logo pulse) */}
      {entered && loading && (
        <div className="loading-screen" role="status" aria-label="Loading">
          <img className="loading-logo" src="/JALSOL1.gif" alt="" />
        </div>
      )}

      {/* NAV overlay */}
      {panel === "nav" && !loading && (
        <NavOverlay
          onSelect={onNavSelect}
          onClose={() => setPanel("home")}
        />
      )}

      {/* PAGE content */}
      {entered && !loading && panel !== "nav" && (
        <section className="home-shell">
          <div className="home-shell-top">
            <button className="home-open-nav" type="button" onClick={() => setPanel("nav")}>
              Menu
            </button>
          </div>
          {content}
        </section>
      )}
    </main>
  );
}