// src/pages/Home.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function fmtTime(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

type ModuleCard = {
  id: string;
  title: string;
  kicker?: string;
  summary: string;
  to: string; // internal route
  tags?: string[];
  tone?: "green" | "gold" | "cyan";
};

export default function Home() {
  const navigate = useNavigate();

  /* ---------------- Terminal header (time) ---------------- */
  const [now, setNow] = useState(() => fmtTime(new Date()));
  useEffect(() => {
    const id = window.setInterval(() => setNow(fmtTime(new Date())), 1000);
    return () => window.clearInterval(id);
  }, []);

  const networkLabel = "MAINNET";

  // If you later wire /api/health (optional), this can become real status.
  const [statusText] = useState("ONLINE");

  const externalLinks = useMemo(
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

  /* ---------------- Modules (HOME = routing dashboard) ---------------- */
  const modules = useMemo<ModuleCard[]>(
    () => [
      {
        id: "jalsol",
        title: "JALSOL",
        kicker: "DISCOVER",
        summary:
          "Entrance into token generation and webapp creation — the on-ramp into the cryptocurrency market through JALSOL utility.",
        to: "/app/token",
        tags: ["Token Generation", "ATA", "Minting", "Utility"],
        tone: "green",
      },
      {
        id: "engine",
        title: "$JAL~Engine",
        kicker: "LIVE CONSOLE",
        summary: "Live market interface. Structured Jeroid deployment.",
        to: "/app/engine",
        tags: ["Market Snapshot", "Indicators", "Deploy Jeroids", "Execution Logs"],
        tone: "cyan",
      },
      {
        id: "shop",
        title: "Shop",
        kicker: "CRAFT + DIGITAL",
        summary: "Physical + digital products — the hub for online sales and releases.",
        to: "/app/shop",
        tags: ["Etsy", "Relics", "Digital Items"],
        tone: "gold",
      },
      {
        id: "inventory",
        title: "Inventory",
        kicker: "PACKAGED BUILD",
        summary:
          "Your downloadable system modules — packaged builds, purchase access, and inventory browsing.",
        to: "/app/inventory",
        tags: ["View", "Purchase", "Downloads"],
        tone: "gold",
      },
      {
        id: "settings",
        title: "Settings",
        kicker: "CONFIG LAYER",
        summary: "API keys, preferences, environment configuration.",
        to: "/app/settings",
        tags: ["CoinSpot API", "RO/Full", "Session", "Risk Params (future)"],
        tone: "green",
      },
    ],
    []
  );

  return (
    <main className="home-shell" aria-label="Home">
      <div className="home-wrap">
        {/* ===== Terminal Header Strip ===== */}
        <section className="terminal-bar panel-frame machine-surface" aria-label="Terminal status">
          <div className="terminal-left">
            <span className="terminal-pill ok">{statusText}</span>
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

        {/* ===== Identity / Overview ===== */}
        <section className="card home-hero machine-surface panel-frame" aria-label="Overview">
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
            {externalLinks.map((l) => (
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

        {/* ===== Module Containers (ordered) ===== */}
        <section className="card machine-surface panel-frame home-modules" aria-label="JALSOL modules">
          <div className="home-kicker">MODULES</div>
          <h2 className="home-title">System Bays</h2>
          <p className="home-lead">
            Choose a bay. Each bay is a container with a single purpose and a direct path.
          </p>

          <div className="module-grid" role="list" aria-label="Module list">
            {modules.map((m) => {
              const toneClass =
                m.tone === "gold" ? "module-card gold" : m.tone === "cyan" ? "module-card cyan" : "module-card green";

              return (
                <button
                  key={m.id}
                  type="button"
                  className={toneClass}
                  role="listitem"
                  onClick={() => navigate(m.to)}
                  aria-label={`Open ${m.title}`}
                >
                  <div className="module-top">
                    <div className="module-kicker">{m.kicker ?? "MODULE"}</div>
                    <div className="module-title">{m.title}</div>
                  </div>

                  <div className="module-summary">{m.summary}</div>

                  {m.tags?.length ? (
                    <div className="module-tags" aria-hidden="true">
                      {m.tags.slice(0, 4).map((t) => (
                        <span key={t} className="module-tag">
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="module-cta" aria-hidden="true">
                    OPEN →
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ===== Optional: “Packaged build” callout stays (but now it’s redundant with Inventory) ===== */}
        <section className="card bundle-card machine-surface panel-frame" aria-label="Packaged system">
          <h2 className="bundle-title">SYSTEM MODULE: Packaged Build</h2>

          <p className="bundle-lead">
            If you want to try the system for yourself, Inventory holds the packaged downloadable build and purchase
            access.
          </p>

          <div className="engine-controls" aria-label="Bundle actions">
            <button type="button" className="button gold" onClick={() => navigate("/app/inventory")}>
              Open Inventory
            </button>
            <button type="button" className="button" onClick={() => navigate("/app/inventory/purchase")}>
              Purchase
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}