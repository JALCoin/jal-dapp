// src/pages/Home.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function fmtTime(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

type HomeModule = {
  kicker: string;
  title: string;
  desc: string;
  tags: string[];
  featured?: boolean;
  tone?: "green" | "gold" | "cyan";
  onOpen: () => void;
};

export default function Home() {
  const navigate = useNavigate();

  const [now, setNow] = useState(() => fmtTime(new Date()));

  useEffect(() => {
    const id = window.setInterval(() => setNow(fmtTime(new Date())), 1000);
    return () => window.clearInterval(id);
  }, []);

  const networkLabel = "MAINNET";

  const links = useMemo(
    () => [
      { label: "Raydium (JAL/SOL)", href: "https://raydium.io/" },
      {
        label: "Solscan ($JAL)",
        href: "https://solscan.io/token/9TCwNEKKPPgZBQ3CopjdhW9j8fZNt8SH7waZJTFRgx7v",
      },
      { label: "X (@JAL358)", href: "https://x.com/JAL358" },
      { label: "Etsy (JALRelics)", href: "https://jalrelics.etsy.com" },
    ],
    []
  );

  const modules = useMemo<HomeModule[]>(
    () => [
      {
        kicker: "DISCOVER",
        title: "JALSOL",
        desc:
          "Entrance into token generation and webapp creation — the on-ramp into cryptocurrency utility through JALSOL.",
        tags: ["Token Generation", "ATA", "Minting", "Utility"],
        featured: true,
        tone: "gold",
        onOpen: () => navigate("/app/jal-sol"),
      },
      {
        kicker: "LIVE CONSOLE",
        title: "$JAL~Engine",
        desc: "Live market interface, structured Jeroid deployment, and machine-state visibility.",
        tags: ["Market Snapshot", "Deploy Jeroids", "Execution Logs"],
        tone: "green",
        onOpen: () => navigate("/app/engine"),
      },
      {
        kicker: "CRAFT + DIGITAL",
        title: "Shop",
        desc: "Physical and digital releases — the storefront for acquisition, support, and access.",
        tags: ["Relics", "Digital Items", "Access"],
        tone: "cyan",
        onOpen: () => navigate("/app/shop"),
      },
      {
        kicker: "PACKAGED BUILD",
        title: "Inventory",
        desc: "Your downloadable system modules, purchases, and release inventory.",
        tags: ["View", "Purchase", "Downloads"],
        onOpen: () => navigate("/app/inventory"),
      },
      {
        kicker: "CONFIG LAYER",
        title: "Settings",
        desc: "Environment controls, API configuration, preferences, and future machine parameters.",
        tags: ["CoinSpot API", "RO / Full", "Session", "Risk Params"],
        onOpen: () => navigate("/app/settings"),
      },
    ],
    [navigate]
  );

  return (
    <main className="home-shell home-console-shell" aria-label="Home">
      <div className="home-wrap">
        <section
          className="terminal-bar panel-frame machine-surface home-topbar"
          aria-label="Terminal status"
        >
          <div className="terminal-left">
            <span className="terminal-pill ok">ONLINE</span>
            <span className="terminal-sep">•</span>
            <span className="terminal-pill">{networkLabel}</span>
            <span className="terminal-sep">•</span>
            <span className="terminal-dim">TIME</span>
            <span className="terminal-time">{now}</span>
          </div>

          <div className="terminal-right">
            <span className="terminal-auth is-ro">ROUTING CONSOLE</span>
          </div>
        </section>

        <section
          className="card machine-surface panel-frame home-console-hero"
          aria-label="JALSOL command hub"
        >
          <div className="home-console-hero-bg" aria-hidden="true">
            <img className="home-console-hero-logo" src="/JALSOL1.gif" alt="" />
          </div>

          <div className="home-console-hero-foreground">
            <div className="home-console-copy">
              <div className="home-kicker">JAL SYSTEM • ONLINE</div>

              <h1 className="home-title">Command Home</h1>

              <p className="home-lead">
                <strong>Central routing console for JALSOL.</strong> Navigate utility,
                market execution, shop access, inventory, and system configuration from one
                controlled surface.
              </p>

              <p className="home-console-sublead">
                This is not the sales layer. This is the internal command hub. Choose the
                correct module, move in order, and return here whenever direction is needed.
              </p>

              <div className="home-links" aria-label="External links">
                {links.map((l) => (
                  <a
                    key={l.label}
                    className="chip"
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>

            <aside className="home-console-side" aria-label="System identity">
              <div className="home-console-side-card">
                <div className="home-console-side-kicker">SYSTEM ID</div>
                <div className="home-console-side-title">jalsol.com</div>
                <div className="home-console-side-copy">
                  Founded by <strong>Jeremy Aaron Lugg</strong>
                  <br />
                  Sol-Trader • Mechanical Metal Engineer • Digital Creator
                </div>
              </div>

              <div className="home-console-side-card">
                <div className="home-console-side-kicker">OPERATING NOTE</div>
                <div className="home-console-side-copy">
                  Nothing here is urgent.
                  <br />
                  This page is the module hub.
                  <br />
                  Each bay below opens a system layer.
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section
          className="card machine-surface panel-frame home-donate-bar"
          aria-label="Donate SOL"
        >
          <div className="home-donate-copy">
            Donate SOL and support the project:{" "}
            <strong>3R2X8VDPwLDTMXdBLemXTmduRnKyFg6Go8hJHBayPUY2</strong>
          </div>
        </section>

        <section
          className="card machine-surface panel-frame home-modules-window"
          aria-label="System modules"
        >
          <div className="home-modules-head">
            <div>
              <div className="home-kicker">MODULE ARRAY</div>
              <h2 className="home-modules-title">Select a route</h2>
              <p className="home-modules-lead">
                Each module opens a different operational layer of the JALSOL system.
              </p>
            </div>
          </div>

          <div className="home-modules-grid" role="list" aria-label="System module list">
            {modules.map((m) => (
              <button
                key={m.title}
                type="button"
                className={`home-module-card ${m.featured ? "is-featured" : ""} ${
                  m.tone ? `tone-${m.tone}` : ""
                }`}
                onClick={m.onOpen}
                role="listitem"
                aria-label={`Open ${m.title}`}
              >
                <div className="home-module-top">
                  <div className="home-module-kicker">{m.kicker}</div>
                  <div className="home-module-title">{m.title}</div>
                </div>

                <p className="home-module-desc">{m.desc}</p>

                <div className="home-module-tags" aria-label={`${m.title} tags`}>
                  {m.tags.map((t) => (
                    <span key={t} className="home-module-tag">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="home-module-open">OPEN →</div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}