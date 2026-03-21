import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function fmtTime(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

type RoadmapStep = {
  level: string;
  title: string;
  desc: string;
  route?: string;
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

  const networkLabel = "MAINNET";

  const roadmap = useMemo<RoadmapStep[]>(
    () => [
      {
        level: "L0",
        title: "Awareness",
        desc: "Learn how wallets, exchanges, Solana, and custody actually work before movement begins.",
        route: "/app/jal-sol",
      },
      {
        level: "L1",
        title: "Entry",
        desc: "Move from observer to participant through a guided first step and controlled transaction flow.",
        route: "/app/shop",
      },
      {
        level: "L2",
        title: "Creation",
        desc: "Build a token, attach direction, and move from user into builder.",
        route: "/app/jal-sol",
      },
      {
        level: "L3+",
        title: "Execution",
        desc: "Structured visibility, machine logic, identity, and deterministic operation.",
        route: "/app/engine",
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
          "This is the beginning of the path. It explains the system, frames the user correctly, and removes noise before action.",
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
          "Slots, state changes, machine progression, and event visibility sit here. This is where system logic becomes observable.",
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
          "A stored layer for what has been obtained, released, or unlocked inside the JALSOL environment.",
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
          "Preferences, future machine parameters, and operational adjustments live here.",
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
          "This route stays selective. It points toward featured access instead of trying to explain the entire system at once.",
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

              <h1 className="home-title">This is the system home.</h1>

              <p className="home-lead">
                <strong>Home is not the onboarding layer.</strong> It is the
                command layer. This page exists to show the full structure of
                JALSOL at a higher altitude before the user steps into a more
                specific state.
              </p>

              <p className="home-console-sublead">
                From here, the path becomes clear: JAL/SOL is the world hub and
                controlled entry layer, the Engine is deterministic execution,
                and the remaining surfaces support access, storage, and future
                configuration.
              </p>
            </div>

            <aside
              className="home-console-side"
              aria-label="System identity and intent"
            >
              <div className="home-console-side-card home-identity-card">
                <div className="home-console-side-kicker">SYSTEM AUTHOR</div>
                <div className="home-console-side-title">Jeremy Aaron Lugg</div>
                <div className="home-console-side-copy">
                  Mechanical Engineer • Digital Creator
                </div>
                <p className="home-identity-desc">
                  Builder of JALSOL — a progression environment designed to move
                  people from awareness into ownership, then into structure,
                  execution, and independent systems.
                </p>
              </div>

              <div className="home-console-side-card home-vision-card">
                <div className="home-console-side-kicker">SYSTEM POSITION</div>
                <div className="home-console-side-copy">
                  Home explains the total architecture.
                  <br />
                  JAL/SOL begins the journey.
                  <br />
                  $JAL~Engine proves structured behaviour.
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section
          className="card machine-surface panel-frame home-roadmap-window"
          aria-label="JALSOL roadmap"
        >
          <div className="home-roadmap-head">
            <div>
              <div className="home-kicker">SYSTEM ROADMAP</div>
              <h2 className="home-modules-title">Order of movement</h2>
              <p className="home-modules-lead">
                The point here is not to show everything at once. The point is to
                show where each layer sits and what it changes.
              </p>
            </div>
          </div>

          <div className="home-roadmap-grid" role="list" aria-label="Roadmap steps">
            {roadmap.map((step) => {
              const content = (
                <>
                  <div className="home-roadmap-level">{step.level}</div>
                  <div className="home-roadmap-title">{step.title}</div>
                  <p className="home-roadmap-desc">{step.desc}</p>
                  <div className="home-roadmap-open">OPEN →</div>
                </>
              );

              return step.route ? (
                <button
                  key={step.level}
                  type="button"
                  className="home-roadmap-card"
                  onClick={() => beginRoute(step.route!, step.level)}
                  role="listitem"
                  aria-label={`Open ${step.title}`}
                >
                  {content}
                </button>
              ) : (
                <article key={step.level} className="home-roadmap-card" role="listitem">
                  {content}
                </article>
              );
            })}
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

        <div className="home-flow-divider" aria-hidden="true" />

        <section
          className="card machine-surface panel-frame home-route-window"
          aria-label="System routes"
        >
          <div className="home-modules-head">
            <div>
              <div className="home-kicker">ROUTE ARRAY</div>
              <h2 className="home-modules-title">Choose a system state</h2>
              <p className="home-modules-lead">
                Each route should feel like a different state of the same system,
                not a disconnected page.
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
                          <div className="home-route-preview-title">
                            {band.previewTitle}
                          </div>
                          <p className="home-route-preview-desc">
                            {band.previewDesc}
                          </p>
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