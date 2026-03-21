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
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  function beginRoute(route: string, id?: string) {
    if (loading) return;
    if (id) setActiveRoute(id);
    setLoading(true);

    timerRef.current = window.setTimeout(() => {
      navigate(route);
    }, 900);
  }

  const networkLabel = "MAINNET";

  const roadmap = useMemo<RoadmapStep[]>(
    () => [
      {
        level: "L0",
        title: "Awareness",
        desc: "Understand wallets, exchanges, Solana, and movement before action.",
        route: "/app/jal-sol",
      },
      {
        level: "L1",
        title: "Entry",
        desc: "Take the first controlled step into the system through guided progression.",
        route: "/app/shop",
      },
      {
        level: "L2",
        title: "Creation",
        desc: "Create your own token, attach utility, and move from participant to builder.",
        route: "/app/jal-sol",
      },
      {
        level: "L3+",
        title: "Execution",
        desc: "Operate structured systems, machine logic, and market visibility with discipline.",
        route: "/app/engine",
      },
    ],
    []
  );

  const routeBands = useMemo<RouteBand[]>(
    () => [
      {
        id: "jalsol",
        kicker: "DISCOVER + BUILD",
        title: "JALSOL",
        desc: "Entry into awareness, onboarding, token creation, and the first layers of digital ownership.",
        tone: "gold",
        previewTitle: "World Hub → Entry → Creation",
        previewDesc:
          "Hover reveals the pathway into the JALSOL system. This is where a user moves from understanding into controlled build capability.",
        previewImage: "/JALSOL1.gif",
        tags: ["Awareness", "Entry", "Token Creation", "Utility"],
        route: "/app/jal-sol",
      },
      {
        id: "engine",
        kicker: "LIVE EXECUTION",
        title: "$JAL~Engine",
        desc: "Market interface, structured deployment, public state visibility, and deterministic machine logic.",
        tone: "green",
        previewTitle: "Execution Surface",
        previewDesc:
          "Visible state, slots, events, tracking, and machine behaviour. This is the execution layer of the wider JALSOL system.",
        previewImage: "/JALSOL1.gif",
        tags: ["Market Snapshot", "Jeroids", "Machine State", "Events"],
        route: "/app/engine",
      },
      {
        id: "inventory",
        kicker: "PACKAGED ACCESS",
        title: "Inventory",
        desc: "Downloadable modules, acquired releases, access layers, and stored system outputs.",
        tone: "cyan",
        previewTitle: "Owned System Assets",
        previewDesc:
          "A structured access bay for what has been acquired, unlocked, or packaged for controlled use.",
        previewImage: "/JALSOL1.gif",
        tags: ["Downloads", "Access", "Inventory", "Releases"],
        route: "/app/inventory",
      },
      {
        id: "settings",
        kicker: "CONFIG LAYER",
        title: "Settings",
        desc: "Environment controls, future machine parameters, and configuration logic for controlled operation.",
        tone: "cyan",
        previewTitle: "Configuration Surface",
        previewDesc:
          "Session controls, API intent, preferences, and deeper system parameters live here.",
        previewImage: "/JALSOL1.gif",
        tags: ["Session", "Preferences", "Config", "Control"],
        route: "/app/settings",
      },
      {
        id: "shop",
        kicker: "FEATURED SHOP",
        title: "Shop",
        desc: "A dropdown-only layer for featured releases, support items, and selected access products.",
        tone: "gold",
        previewTitle: "Featured Releases",
        previewDesc:
          "This band stays lightweight. On interaction it reveals selected featured items only, not the full storefront grid.",
        previewImage: "/JALSOL1.gif",
        tags: ["Featured", "Support", "Drops", "Access"],
        dropdown: {
          label: "Featured items",
          items: [
            { title: "Featured Item 01", note: "Undecided placeholder." },
            { title: "Featured Item 02", note: "Undecided placeholder." },
            { title: "Featured Item 03", note: "Undecided placeholder." },
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

          <div className="home-console-hero-foreground home-console-hero-foreground--identity">
            <div className="home-console-copy">
              <div className="home-kicker">JAL SYSTEM • ONLINE</div>

              <h1 className="home-title">Command Home</h1>

              <p className="home-lead">
                <strong>Central routing console for JALSOL.</strong> This is the
                internal point of clarity for the system — who built it, what it
                is for, and where each layer leads next.
              </p>

              <p className="home-console-sublead">
                JALSOL is a structured progression environment for digital value.
                It begins with awareness, moves through controlled entry, expands
                into creation, and advances toward execution, identity, and
                independent systems.
              </p>
            </div>

            <aside className="home-console-side" aria-label="System identity and intent">
              <div className="home-console-side-card home-identity-card">
                <div className="home-console-side-kicker">SYSTEM AUTHOR</div>
                <div className="home-console-side-title">Jeremy Aaron Lugg</div>
                <div className="home-console-side-copy">
                  Mechanical Engineer • Digital Creator
                </div>
                <p className="home-identity-desc">
                  Builder of JALSOL — a system designed to move people from
                  awareness into ownership, then into structure and execution.
                </p>
              </div>

              <div className="home-console-side-card home-vision-card">
                <div className="home-console-side-kicker">SYSTEM INTENT</div>
                <div className="home-console-side-copy">
                  JALSOL is not just a website or utility surface.
                  <br />
                  It is a roadmap for entering digital value correctly.
                  <br />
                  Every layer reduces noise and increases controlled movement.
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
              <h2 className="home-modules-title">Clarity of movement</h2>
              <p className="home-modules-lead">
                Static enough to explain the path, clickable enough to move
                through it.
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
              <h2 className="home-modules-title">Select a system layer</h2>
              <p className="home-modules-lead">
                Full-width route bands now replace the card grid. Each band
                carries a clearer decision and reveals more of its layer on hover.
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

                      <div className="home-route-open">
                        {band.dropdown.label} ↓
                      </div>
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
                      <div className="home-route-preview-title">
                        {band.previewTitle}
                      </div>
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