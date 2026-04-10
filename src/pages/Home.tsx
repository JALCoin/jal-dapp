import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function fmtTime(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

type HomePillar = {
  id: string;
  title: string;
  subtitle: string;
  desc: string;
  note: string;
  tone?: "green" | "gold" | "cyan";
  route: string;
};

type BoundaryItem = {
  title: string;
  desc: string;
};

type LegalGroup = {
  title: string;
  desc: string;
  points: string[];
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
  note: string;
  route: string;
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

  const homePillars = useMemo<HomePillar[]>(
    () => [
      {
        id: "learn",
        title: "Learn",
        subtitle: "JAL/SOL onboarding and self-custody guidance",
        desc: "The public education layer explains wallets, signing, token basics, and how to move carefully before taking any irreversible action.",
        note: "Public onboarding only",
        tone: "gold",
        route: "/app/jal-sol",
      },
      {
        id: "observe",
        title: "Observe",
        subtitle: "Read-only engine telemetry",
        desc: "The engine page exposes Jeremy Aaron Lugg's own automated trading dashboard as a public viewing surface without handing trading control to site visitors.",
        note: "Read-only for visitors",
        tone: "green",
        route: "/app/engine",
      },
      {
        id: "collect",
        title: "Collect",
        subtitle: "Physical merch and branded objects",
        desc: "The storefront is now limited to physical releases so the commercial layer reads as ordinary merch rather than digital access or managed financial packaging.",
        note: "Physical merch only",
        tone: "cyan",
        route: "/app/shop",
      },
    ],
    []
  );

  const boundaryItems = useMemo<BoundaryItem[]>(
    () => [
      {
        title: "Not a decentralised exchange",
        desc: "jalsol.com does not run an on-chain swap venue, order book, or peer-to-peer execution layer for the public in its current live form.",
      },
      {
        title: "No customer custody",
        desc: "The site does not hold client wallets, private keys, or pooled balances as part of the current public offer.",
      },
      {
        title: "No managed trading for users",
        desc: "The engine shown on-site is Jeremy's own operator-controlled system, not a customer trading service or copy-trading product.",
      },
      {
        title: "No digital access products in the shop",
        desc: "The public storefront is limited to physical merch so the business activity is clearer and less likely to be read as financial access packaging.",
      },
    ],
    []
  );

  const legalGroups = useMemo<LegalGroup[]>(
    () => [
      {
        title: "What JALSOL is",
        desc: "The current public version is structured as a software, education, and merch site with a read-only engine dashboard.",
        points: [
          "A public onboarding and self-custody learning surface",
          "A public read-only dashboard for Jeremy Aaron Lugg's own engine",
          "A physical merch storefront",
        ],
      },
      {
        title: "What JALSOL is not",
        desc: "The site is intentionally not positioned as an exchange or managed investment product.",
        points: [
          "No public DEX or exchange is operated through the live site",
          "No user funds are pooled for a common strategy",
          "No trade execution is offered on behalf of site visitors",
        ],
      },
      {
        title: "Why this is lower-risk",
        desc: "These boundaries make the public offer closer to ordinary software, content, and merch than to a regulated trading venue.",
        points: [
          "Visitors can observe the engine without receiving trading control",
          "Commercial activity is tied to physical products instead of access promises",
          "Self-custody actions remain user-directed rather than site-custodied",
        ],
      },
      {
        title: "What would change the analysis",
        desc: "These features would need fresh Australian legal review before launch.",
        points: [
          "Trading for customers or copy-trading from the engine",
          "Customer custody, shared wallets, or pooled capital",
          "Brokerage, exchange, or token-investment style marketing claims",
        ],
      },
    ],
    []
  );

  const routeBands = useMemo<RouteBand[]>(
    () => [
      {
        id: "jalsol",
        kicker: "PUBLIC ONBOARDING",
        title: "JAL/SOL",
        desc: "Use the JAL/SOL layer to explain the project, wallet flow, self-custody steps, and token-building context without selling a trading product.",
        tone: "gold",
        previewTitle: "Onboarding surface",
        previewDesc: "Education first, self-custody next, with the irreversible steps kept in the user's own hands.",
        previewImage: "/JALSOL1.gif",
        tags: ["Education", "Wallet basics", "Self-custody", "Token building"],
        note: "Best public label: onboarding and builder surface",
        route: "/app/jal-sol",
      },
      {
        id: "engine",
        kicker: "PERSONAL ENGINE",
        title: "JAL Engine",
        desc: "The engine is best framed as Jeremy's own automated trading software with a public read-only dashboard, not as a user-facing exchange or managed platform.",
        tone: "green",
        previewTitle: "Read-only telemetry",
        previewDesc: "Machine state, lifecycle data, and public logs without handing visitors trading permissions.",
        previewImage: "/JALSOL1.gif",
        tags: ["Read-only", "Telemetry", "Operator dashboard", "Personal software"],
        note: "Best public label: personal automated engine with public telemetry",
        route: "/app/engine",
      },
      {
        id: "shop",
        kicker: "PHYSICAL STORE",
        title: "Shop",
        desc: "The storefront now works as a clean merch surface for apparel, collectibles, and physical branded items tied to the JALSOL identity.",
        tone: "cyan",
        previewTitle: "Physical releases",
        previewDesc: "A simpler commerce layer built around physical products instead of digital access packages.",
        previewImage: "/JALSOL1.gif",
        tags: ["Physical merch", "Collectibles", "Apparel", "Brand objects"],
        note: "Best public label: physical merch storefront",
        route: "/app/shop",
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
            <span className="terminal-sep">-</span>
            <span className="terminal-pill">{networkLabel}</span>
            <span className="terminal-sep">-</span>
            <span className="terminal-dim">TIME</span>
            <span className="terminal-time">{now}</span>
          </div>

          <div className="terminal-right">
            <span className="terminal-auth is-ro">COMMAND HOME</span>
          </div>
        </section>

        <section
          className="card machine-surface panel-frame home-console-hero jal-command-surface"
          aria-label="JALSOL overview"
        >
          <div className="home-console-hero-bg" aria-hidden="true">
            <img className="home-console-hero-logo" src="/JALSOL1.gif" alt="" />
          </div>

          <div className="home-console-hero-foreground home-console-hero-foreground--identity">
            <div className="home-console-copy">
              <div className="home-kicker">JALSOL - PUBLIC SOFTWARE SURFACE</div>

              <h1 className="home-title">
                Personal trading engine, public onboarding, and physical merch.
              </h1>

              <p className="home-lead">
                <strong>Built and operated by Jeremy Aaron Lugg.</strong> The current public site is
                best described as a crypto onboarding and builder surface, a read-only dashboard for
                Jeremy's own automated engine, and a physical merch storefront.
              </p>

              <p className="home-console-sublead">
                The live site does not present itself as a decentralised exchange, brokerage, or
                managed trading platform. The safer public framing is software, education,
                self-custody guidance, and physical commerce around a personal operator-run engine.
              </p>

              <div className="jal-links">
                <button
                  type="button"
                  className="button gold"
                  onClick={() => beginRoute("/app/jal-sol", "jalsol")}
                  disabled={loading}
                >
                  Open JAL/SOL
                </button>

                <button
                  type="button"
                  className="button ghost"
                  onClick={() => beginRoute("/app/engine", "engine")}
                  disabled={loading}
                >
                  View Engine
                </button>

                <button
                  type="button"
                  className="button ghost"
                  onClick={() => beginRoute("/app/shop", "shop")}
                  disabled={loading}
                >
                  Browse Merch
                </button>
              </div>
            </div>

            <aside className="home-console-side" aria-label="Project definition">
              <div className="home-console-side-card home-identity-card">
                <div className="home-console-side-kicker">CURRENT STRUCTURE</div>
                <div className="home-console-side-title">What the live site includes</div>
                <ul className="home-identity-points">
                  <li>Public onboarding and self-custody guidance</li>
                  <li>Read-only visibility into Jeremy's engine</li>
                  <li>Physical merch only in the storefront</li>
                </ul>
              </div>

              <div className="home-console-side-card home-vision-card">
                <div className="home-console-side-kicker">IF SOMEONE ASKS</div>
                <div className="home-console-side-title">How to describe JALSOL</div>
                <p className="home-identity-desc">
                  JALSOL is a crypto education, self-custody onboarding, and physical merch site
                  with a public read-only dashboard for Jeremy Aaron Lugg's own automated trading
                  engine.
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section
          className="card machine-surface panel-frame home-roadmap-window"
          aria-label="Current public pillars"
        >
          <div className="home-roadmap-head">
            <div>
              <div className="home-kicker">CURRENT PUBLIC PILLARS</div>
              <h2 className="home-modules-title">Three clearer ways to understand the site</h2>
              <p className="home-modules-lead">
                The homepage now separates JALSOL into its real public layers so the project reads
                as software, onboarding, and merch rather than a public trading venue.
              </p>
            </div>
          </div>

          <div className="home-roadmap-grid home-roadmap-grid--three" role="list" aria-label="Public pillars">
            {homePillars.map((pillar) => (
              <button
                key={pillar.id}
                type="button"
                className={`home-roadmap-card tone-${pillar.tone ?? "cyan"}`}
                onClick={() => beginRoute(pillar.route, pillar.id)}
                role="listitem"
                aria-label={`Open ${pillar.title}`}
              >
                <div className="home-roadmap-level">{pillar.title.toUpperCase()}</div>
                <div className="home-roadmap-title">{pillar.subtitle}</div>
                <p className="home-roadmap-desc">{pillar.desc}</p>
                <div className="home-roadmap-open">{pillar.note}</div>
              </button>
            ))}
          </div>
        </section>

        <section
          className="card machine-surface panel-frame home-roadmap-window"
          aria-label="Operating boundaries"
        >
          <div className="home-roadmap-head">
            <div>
              <div className="home-kicker">OPERATING BOUNDARIES</div>
              <h2 className="home-modules-title">What keeps the current public version in a safer lane</h2>
              <p className="home-modules-lead">
                These are the boundaries that matter most if you want the site to stay closer to a
                personal software project and a normal merch business than to a regulated exchange.
              </p>
            </div>
          </div>

          <div className="home-roadmap-grid" role="list" aria-label="Operating boundaries list">
            {boundaryItems.map((item) => (
              <article key={item.title} className="home-roadmap-card" role="listitem">
                <div className="home-roadmap-level">BOUNDARY</div>
                <div className="home-roadmap-title">{item.title}</div>
                <p className="home-roadmap-desc">{item.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="card machine-surface panel-frame home-roadmap-window home-legal-window"
          aria-label="Legal boundary summary"
        >
          <details className="home-legal-details">
            <summary className="home-legal-summary">
              <div className="home-legal-summary-copy">
                <div className="home-legal-summary-kicker">LEGAL BOUNDARY SUMMARY</div>
                <h2 className="home-modules-title">Open the plain-language explanation for why the current structure is lower-risk</h2>
                <p className="home-modules-lead">
                  This dropdown explains the present setup in practical terms. It is not legal
                  advice, not a licence, and not a guarantee for future features.
                </p>
              </div>

              <div className="home-legal-summary-note">Open disclosure</div>
            </summary>

            <div className="home-legal-grid">
              {legalGroups.map((group) => (
                <article key={group.title} className="home-legal-card">
                  <div className="home-legal-title">{group.title}</div>
                  <p className="home-roadmap-desc">{group.desc}</p>
                  <ul className="home-legal-list">
                    {group.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <p className="home-legal-note">
              If JALSOL ever adds trading for customers, pooled capital, custody, copy-trading, or
              exchange-style execution, the homepage copy and the legal position both need to be
              reworked before launch.
            </p>
          </details>
        </section>

        <div className="home-flow-divider" aria-hidden="true" />

        <section
          className="card machine-surface panel-frame home-route-window"
          aria-label="Primary public surfaces"
        >
          <div className="home-modules-head">
            <div>
              <div className="home-kicker">PRIMARY PUBLIC SURFACES</div>
              <h2 className="home-modules-title">Where each part of the project should live</h2>
              <p className="home-modules-lead">
                These are the three surfaces worth leading with on the public site: onboarding,
                read-only engine visibility, and physical merch.
              </p>
            </div>
          </div>

          <div className="home-route-stack" role="list" aria-label="Primary route list">
            {routeBands.map((band) => {
              const bandTone = band.tone ? `tone-${band.tone}` : "";
              const activeClass = activeRoute === band.id ? "active" : "";

              return (
                <button
                  key={band.id}
                  type="button"
                  className={`home-route-band ${bandTone} ${activeClass}`}
                  onClick={() => beginRoute(band.route, band.id)}
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
                    <div className="home-route-note">{band.note}</div>
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

                  <div className="home-route-open">Open</div>
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
