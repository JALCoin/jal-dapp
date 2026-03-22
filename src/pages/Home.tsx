import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function fmtTime(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

type EntryGate = {
  id: string;
  title: string;
  subtitle: string;
  desc: string;
  mapsTo: string;
  tone?: "green" | "gold" | "cyan";
  route: string;
};

type ProgressStep = {
  level: string;
  title: string;
  desc: string;
};

type RouteBand = {
  id: string;
  kicker: string;
  title: string;
  desc: string;
  tone?: "green" | "gold" | "cyan";
  previewTitle: string;
  previewDesc: string;
  previewImage?: string;
  tags: string[];
  route?: string;
  dropdown?: {
    label: string;
    items: { title: string; note: string }[];
  };
};

export default function Home() {
  const navigate = useNavigate();
  const timerRef = useRef<number | null>(null);

  const [now, setNow] = useState(() => fmtTime(new Date()));
  const [loading, setLoading] = useState(false);
  const [activeRoute, setActiveRoute] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(fmtTime(new Date())), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      document.body.style.pointerEvents = "";
    };
  }, []);

  function beginRoute(route: string, id?: string) {
    if (loading) return;

    if (id) setActiveRoute(id);
    setLoading(true);
    document.body.style.pointerEvents = "none";

    timerRef.current = window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
      navigate(route);
      document.body.style.pointerEvents = "";
    }, 1200);
  }

  const solAddress = "3R2X8VDPwLDTMXdBLemXTmduRnKyFg6Go8hJHBayPUY2";

  function copyAddress() {
    navigator.clipboard.writeText(solAddress);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const networkLabel = "MAINNET";

  const entryGates = useMemo<EntryGate[]>(
    () => [
      {
        id: "observe",
        title: "Observe",
        subtitle: "Learn before acting",
        desc: "Start with disclosure, awareness, exchanges, wallets, custody, and foundational system logic before confusing motion with progress.",
        mapsTo: "Maps to Disclosure + Awareness",
        tone: "cyan",
        route: "/app/jal-sol",
      },
      {
        id: "enter",
        title: "Enter",
        subtitle: "Take the first controlled step",
        desc: "Move from passive understanding into guided participation and the first irreversible action inside the system.",
        mapsTo: "Maps to Controlled Entry",
        tone: "gold",
        route: "/app/jal-sol",
      },
      {
        id: "build",
        title: "Build",
        subtitle: "Create your own system",
        desc: "Progress beyond entry into ownership, token creation, utility, identity, execution, and eventual outward deployment.",
        mapsTo: "Maps to Creation → Execution",
        tone: "green",
        route: "/app/jal-sol",
      },
    ],
    []
  );

  const progressSteps = useMemo<ProgressStep[]>(
    () => [
      {
        level: "L0",
        title: "Disclosure",
        desc: "Identity, authorship, intent, and system direction are revealed before movement begins.",
      },
      {
        level: "L1",
        title: "Controlled Entry",
        desc: "The first irreversible movement changes the user from observer into participant.",
      },
      {
        level: "L2",
        title: "Creation",
        desc: "The system expands from use into owned assets, token creation, and utility formation.",
      },
      {
        level: "L3+",
        title: "Execution & Expansion",
        desc: "Machine structure, public visibility, and future domain deployment extend the system outward.",
      },
    ],
    []
  );

  const routeBands = useMemo<RouteBand[]>(
    () => [
      {
        id: "jalsol",
        kicker: "OBSERVE • ENTER • BUILD",
        title: "JAL/SOL World Hub",
        desc: "The onboarding world of the wider system. This is where curiosity is converted into direction, and direction becomes controlled movement.",
        tone: "gold",
        previewTitle: "World Hub → Awareness → Controlled Entry",
        previewDesc:
          "This is the visible entry layer: framing, disclosure, awareness, and the first controlled step into the system.",
        previewImage: "/JALSOL1.gif",
        tags: ["Awareness", "Entry", "Progression", "Build Path"],
        route: "/app/jal-sol",
      },
      {
        id: "engine",
        kicker: "DETERMINISTIC EXECUTION",
        title: "$JAL~Engine",
        desc: "Visible state, slot lifecycle, event logs, telemetry, and machine truth. This is not theory. This is system behaviour made public.",
        tone: "green",
        previewTitle: "Execution Layer",
        previewDesc:
          "Slots, machine state, public behaviour, and proof of structure sit here. This is where system logic becomes observable.",
        previewImage: "/JALSOL1.gif",
        tags: ["Jeroids", "Lifecycle", "Event Log", "Public State"],
        route: "/app/engine",
      },
      {
        id: "inventory",
        kicker: "PACKAGED SYSTEM OUTPUTS",
        title: "Inventory",
        desc: "A future storage layer for acquired releases, downloads, unlocked modules, and controlled system assets.",
        tone: "cyan",
        previewTitle: "Owned Access Surface",
        previewDesc:
          "A stored layer for what has been obtained, released, or unlocked inside the wider JALSOL environment.",
        previewImage: "/JALSOL1.gif",
        tags: ["Downloads", "Access", "Releases", "Modules"],
        route: "/app/inventory",
      },
      {
        id: "settings",
        kicker: "CONFIGURATION LAYER",
        title: "Settings",
        desc: "Environment controls, future system preferences, and deeper configuration for personalised operation.",
        tone: "cyan",
        previewTitle: "System Control Surface",
        previewDesc:
          "Preferences, environment controls, and future operational adjustments live here.",
        previewImage: "/JALSOL1.gif",
        tags: ["Preferences", "Control", "Environment", "Config"],
        route: "/app/settings",
      },
      {
        id: "shop",
        kicker: "FEATURED ACCESS",
        title: "Shop",
        desc: "A lightweight featured layer for selected releases, access products, and support items tied to the wider system.",
        tone: "gold",
        previewTitle: "Featured Releases",
        previewDesc:
          "Selected access paths, support releases, and future packaged outputs tied to the wider JALSOL build.",
        previewImage: "/JALSOL1.gif",
        tags: ["Access", "Support", "Featured", "Drops"],
        dropdown: {
          label: "Featured items",
          items: [
            {
              title: "Level 1 Access",
              note: "The first guided movement into the system.",
            },
            {
              title: "Support Releases",
              note: "Selected items that help fund expansion of JALSOL.",
            },
            {
              title: "Future System Packs",
              note: "Packaged modules, downloads, and guided releases.",
            },
          ],
        },
      },
    ],
    []
  );

  return (
    <main
      className={`home-shell home-console-shell ${loading ? "is-fading" : ""}`}
      aria-label="Home"
    >
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
            <span className="terminal-auth is-ro">COMMAND HOME</span>
          </div>
        </section>

        <section
          className="card machine-surface panel-frame home-console-hero jal-command-surface"
          aria-label="JALSOL command home"
        >
          <div className="home-console-hero-bg" aria-hidden="true">
            <img className="home-console-hero-logo" src="/JALSOL1.gif" alt="" />
          </div>

          <div className="home-console-hero-foreground home-console-hero-foreground--identity">
            <div className="home-console-copy">
              <div className="home-kicker">JAL SYSTEM • COMMAND SURFACE</div>

              <h1 className="home-title">
                This domain discloses the source and visible architecture of JALSOL.
              </h1>

              <p className="home-lead">
                <strong>Built and operated by Jeremy Aaron Lugg.</strong> This is not a generic
                brand page. It is the identity, direction, and visible system layer of a digital
                environment designed to appreciate through structure.
              </p>

              <p className="home-console-sublead">
                What is shown here is intentional: authorship, movement, and system vision. What
                remains protected sits beneath the visible layer. JAL/SOL begins controlled entry.
                The Engine proves structured behaviour. The remaining surfaces expand access,
                storage, and future deployment.
              </p>

              <div className="jal-links">
                <button
                  type="button"
                  className="button gold"
                  onClick={() => beginRoute("/app/jal-sol", "jalsol-entry")}
                  disabled={loading}
                >
                  Enter JAL/SOL
                </button>

                <button
                  type="button"
                  className="button ghost"
                  onClick={() => beginRoute("/app/engine", "engine")}
                  disabled={loading}
                >
                  View Engine
                </button>
              </div>
            </div>

            <aside className="home-console-side" aria-label="System identity and intent">
              <div className="home-console-side-card home-identity-card">
                <div className="home-console-side-kicker">SOURCE</div>
                <div className="home-console-side-title">Jeremy Aaron Lugg</div>
                <div className="home-console-side-copy">Mechanical Engineer • Digital Creator</div>
                <p className="home-identity-desc">
                  The visible operator and originating source of JALSOL — a layered digital system
                  built to move from awareness into ownership, then into structure, execution, and
                  expansion.
                </p>
              </div>

              <div className="home-console-side-card home-vision-card">
                <div className="home-console-side-kicker">INTENT</div>
                <div className="home-console-side-copy">
                  To build a domain that appreciates through order, reveals its direction in
                  layers, and becomes a source structure for future custom systems built from the
                  same foundation.
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section
          className="card machine-surface panel-frame home-roadmap-window"
          aria-label="Visible entry structure"
        >
          <div className="home-roadmap-head">
            <div>
              <div className="home-kicker">VISIBLE ENTRY STRUCTURE</div>
              <h2 className="home-modules-title">Three gates, one progression path</h2>
              <p className="home-modules-lead">
                Home does not ask the user to choose a level. It reveals the structure first, then
                routes that person into JAL/SOL where the three gates define direction of movement.
              </p>
            </div>
          </div>

          <div className="home-roadmap-grid" role="list" aria-label="Entry gates">
            {entryGates.map((gate) => (
              <button
                key={gate.id}
                type="button"
                className={`home-roadmap-card tone-${gate.tone ?? "cyan"}`}
                onClick={() => beginRoute(gate.route, gate.id)}
                role="listitem"
                aria-label={`Open ${gate.title}`}
              >
                <div className="home-roadmap-level">{gate.title.toUpperCase()}</div>
                <div className="home-roadmap-title">{gate.subtitle}</div>
                <p className="home-roadmap-desc">{gate.desc}</p>
                <div className="home-roadmap-open">{gate.mapsTo}</div>
              </button>
            ))}
          </div>
        </section>

        <section
          className="card machine-surface panel-frame home-roadmap-window"
          aria-label="Visible progression architecture"
        >
          <div className="home-roadmap-head">
            <div>
              <div className="home-kicker">VISIBLE PROGRESSION</div>
              <h2 className="home-modules-title">State progression in public view</h2>
              <p className="home-modules-lead">
                These are not primary choices on Home. They are the visible progression positions
                the wider system moves through once direction has been selected.
              </p>
            </div>
          </div>

          <div className="home-roadmap-grid" role="list" aria-label="Progression steps">
            {progressSteps.map((step) => (
              <article key={step.level} className="home-roadmap-card" role="listitem">
                <div className="home-roadmap-level">{step.level}</div>
                <div className="home-roadmap-title">{step.title}</div>
                <p className="home-roadmap-desc">{step.desc}</p>
                <div className="home-roadmap-open">VISIBLE →</div>
              </article>
            ))}
          </div>
        </section>

        <section
          className="card machine-surface panel-frame home-support-window"
          aria-label="Support the source"
        >
          <div className="home-support-head">
            <div>
              <div className="home-kicker">SUPPORT THE SOURCE</div>
              <h2 className="home-modules-title">Fuel the system as it expands</h2>
              <p className="home-modules-lead">
                JALSOL is a live, authored system. What is visible here is actively being built and
                extended. Support feeds directly into its progression — from interface refinement to
                infrastructure, releases, and future system deployment.
              </p>
            </div>
          </div>

          <div className="home-support-grid">
            <article className="home-support-card">
              <div className="home-support-card-kicker">STRUCTURED SUPPORT</div>
              <h3 className="home-support-card-title">Contribute through the system</h3>
              <p className="home-support-card-copy">
                Use the Shop to access support releases, guided entry layers, and future system
                modules. This path feeds directly into the structured expansion of JALSOL.
              </p>

              <div className="home-support-actions">
                <button
                  type="button"
                  className="button gold"
                  onClick={() => beginRoute("/app/shop", "shop")}
                  disabled={loading}
                >
                  Open Support Layer
                </button>
              </div>
            </article>

            <article className="home-support-card">
              <div className="home-support-card-kicker">DIRECT INPUT</div>
              <h3 className="home-support-card-title">Support the source on-chain</h3>
              <p className="home-support-card-copy">
                Direct SOL contributions act as raw input into development, infrastructure, and
                expansion across future JALSOL domains built from this source.
              </p>

              <div className="home-support-wallet">
                <span className="home-support-wallet-label">SOL ADDRESS</span>
                <button
                  type="button"
                  className={`home-support-wallet-code ${copied ? "is-copied" : ""}`}
                  onClick={copyAddress}
                >
                  {copied ? "Copied ✓" : solAddress}
                </button>
              </div>
            </article>
          </div>
        </section>

        <div className="home-flow-divider" aria-hidden="true" />

        <section
          className="card machine-surface panel-frame home-route-window"
          aria-label="Visible system surfaces"
        >
          <div className="home-modules-head">
            <div>
              <div className="home-kicker">VISIBLE SURFACES</div>
              <h2 className="home-modules-title">Access the visible layers</h2>
              <p className="home-modules-lead">
                These are not disconnected pages. They are active surfaces of the same authored
                system: entry, execution, storage, configuration, and selected releases.
              </p>
            </div>
          </div>

          <div className="home-route-stack" role="list" aria-label="System route list">
            {routeBands.map((band) => {
              const bandTone = band.tone ? `tone-${band.tone}` : "";
              const activeClass = activeRoute === band.id ? "active" : "";

              if (band.dropdown) {
                return (
                  <details
                    key={band.id}
                    className={`home-route-band home-route-band--dropdown ${bandTone} ${activeClass}`}
                    role="listitem"
                  >
                    <summary className="home-route-summary">
                      <div className="home-route-main">
                        <div className="home-route-kicker">{band.kicker}</div>
                        <div className="home-route-title">{band.title}</div>
                        <p className="home-route-desc">{band.desc}</p>
                        <div className="home-route-tags">
                          {band.tags.map((tag) => (
                            <span key={tag} className="home-route-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div
                        className="home-route-preview has-image"
                        aria-hidden="true"
                        style={
                          band.previewImage
                            ? {
                                ["--preview-image" as string]: `url("${band.previewImage}")`,
                              }
                            : undefined
                        }
                      >
                        <div className="home-route-preview-overlay">
                          <div className="home-route-preview-kicker">Preview</div>
                          <div className="home-route-preview-title">{band.previewTitle}</div>
                          <p className="home-route-preview-desc">{band.previewDesc}</p>
                        </div>
                      </div>

                      <div className="home-route-open">{band.dropdown.label} ↓</div>
                    </summary>

                    <div className="home-route-dropdown">
                      {band.dropdown.items.map((item) => (
                        <div key={item.title} className="home-route-dropdown-item">
                          <div className="home-route-dropdown-title">{item.title}</div>
                          <div className="home-route-dropdown-note">{item.note}</div>
                        </div>
                      ))}
                    </div>
                  </details>
                );
              }

              return (
                <button
                  key={band.id}
                  type="button"
                  className={`home-route-band ${bandTone} ${activeClass}`}
                  onClick={() => band.route && beginRoute(band.route, band.id)}
                  role="listitem"
                  aria-label={`Open ${band.title}`}
                >
                  <div className="home-route-main">
                    <div className="home-route-kicker">{band.kicker}</div>
                    <div className="home-route-title">{band.title}</div>
                    <p className="home-route-desc">{band.desc}</p>
                    <div className="home-route-tags">
                      {band.tags.map((tag) => (
                        <span key={tag} className="home-route-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div
                    className="home-route-preview has-image"
                    aria-hidden="true"
                    style={
                      band.previewImage
                        ? {
                            ["--preview-image" as string]: `url("${band.previewImage}")`,
                          }
                        : undefined
                    }
                  >
                    <div className="home-route-preview-overlay">
                      <div className="home-route-preview-kicker">Preview</div>
                      <div className="home-route-preview-title">{band.previewTitle}</div>
                      <p className="home-route-preview-desc">{band.previewDesc}</p>
                    </div>
                  </div>

                  <div className="home-route-open">OPEN →</div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {loading && (
        <div
          className="loading-screen"
          role="status"
          aria-live="polite"
          aria-label="Loading"
        >
          <img className="loading-logo" src="/JALSOL1.gif" alt="" />
        </div>
      )}
    </main>
  );
}