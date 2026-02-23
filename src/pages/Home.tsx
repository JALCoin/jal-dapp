// src/pages/Home.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function fmtTime(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

type ModuleDef = {
  kicker: string;
  title: string;
  desc: string;
  tags: string[];
  tone?: "gold" | "cyan" | "green";
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

  const modules = useMemo<ModuleDef[]>(
    () => [
      {
        kicker: "DISCOVER",
        title: "JALSOL",
        desc:
          "Entrance into token generation and webapp creation — the on-ramp into the market through JALSOL utility.",
        tags: ["Token Generation", "ATA", "Minting", "Utility"],
        tone: "green",
        onOpen: () => navigate("/app/token"),
      },
      {
        kicker: "LIVE CONSOLE",
        title: "$JAL~Engine",
        desc: "Live market interface. Structured Jeroid deployment.",
        tags: ["Market Snapshot", "Indicators", "Deploy Jeroids", "Execution Logs"],
        tone: "cyan",
        onOpen: () => navigate("/app/engine"),
      },
      {
        kicker: "CRAFT + DIGITAL",
        title: "Shop",
        desc: "Physical + digital products — the hub for online sales and releases.",
        tags: ["Etsy", "Relics", "Digital Items"],
        onOpen: () => navigate("/app/shop"),
      },
      {
        kicker: "PACKAGED BUILD",
        title: "Inventory",
        desc: "Downloadable system modules — packaged builds, purchase access, and inventory browsing.",
        tags: ["View", "Purchase", "Downloads"],
        tone: "gold",
        onOpen: () => navigate("/app/inventory"),
      },
      {
        kicker: "CONFIG LAYER",
        title: "Settings",
        desc: "API keys, preferences, environment configuration.",
        tags: ["CoinSpot API", "RO/Full", "Session", "Risk Params (future)"],
        onOpen: () => navigate("/app/engine/settings"),
      },
    ],
    [navigate]
  );

  return (
    <main className="home-shell" aria-label="Home">
      <div className="home-wrap">
        {/* ===== Top status strip (tightened) ===== */}
        <section className="terminal-bar panel-frame machine-surface home-topbar" aria-label="Terminal status">
          <div className="terminal-left">
            <span className="terminal-pill ok">ONLINE</span>
            <span className="terminal-sep">•</span>
            <span className="terminal-pill">{networkLabel}</span>
            <span className="terminal-sep">•</span>
            <span className="terminal-dim">TIME</span>
            <span className="terminal-time">{now}</span>
          </div>

          <div className="terminal-right">
            <span className="terminal-auth is-ro">HOME: MODULES</span>
          </div>
        </section>

        {/* ===== JAL SYSTEM hero ===== */}
        <section className="card home-hero machine-surface panel-frame" aria-label="JAL System">
          <div className="home-kicker">JAL SYSTEM • ONLINE</div>

          <h1 className="home-title">jalsol.com</h1>

          <p className="home-lead">
            <strong>Terminal for Solana utility.</strong> Token generation, structured market execution, and deployable
            systems — governed by order of processing.
          </p>

          <p className="home-lead">
            Founded by <strong>Jeremy Aaron Lugg</strong> — Sol-Trader • Mechanical Metal Engineer • Digital Creator.
          </p>

          <div className="home-links" aria-label="Links">
            {links.map((l) => (
              <a key={l.label} className="chip" href={l.href} target="_blank" rel="noreferrer">
                {l.label}
              </a>
            ))}
          </div>

          <div className="home-primary" aria-label="Note">
            <div className="home-primary-note">
              <span>Nothing here is urgent.</span> This homepage is the routing console. Each bay below opens a system
              module.
            </div>
          </div>
        </section>

        {/* ===== MODULE BAYS (NO container card; full-width rows) ===== */}
        <section className="module-stage machine-surface" aria-label="Modules">
          {/* looping low-opacity logo behind bays */}
          <div className="module-bg" aria-hidden="true">
            <img className="module-bg-logo" src="/JALSOL1.gif" alt="" />
          </div>

          <div className="module-foreground">
            <div className="module-head">
              <div className="home-kicker">MODULES</div>
              <h2 className="module-head-title">System Bays</h2>
              <p className="module-head-sub">Choose a bay. Each bay is a container with a single purpose and a direct path.</p>
            </div>

            <div className="module-stack" role="list">
              {modules.map((m) => (
                <button
                  key={m.title}
                  type="button"
                  className={`module-row panel-frame ${m.tone ? `tone-${m.tone}` : ""}`}
                  onClick={m.onOpen}
                  role="listitem"
                >
                  <div className="module-row-main">
                    <div className="module-kicker">{m.kicker}</div>
                    <div className="module-name">{m.title}</div>
                    <div className="module-desc">{m.desc}</div>

                    <div className="module-tags" aria-label={`${m.title} tags`}>
                      {m.tags.map((t) => (
                        <span key={t} className="module-tag">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="module-row-cta" aria-hidden="true">
                    OPEN →
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}