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
        title: "Notice",
        subtitle: "Interactive features are temporarily paused",
        desc: "Public interactive routes are unavailable while registrations and legal settings are reviewed.",
        note: "Compliance review in progress",
        tone: "gold",
        route: "/app/compliance",
      },
      {
        id: "observe",
        title: "Review",
        subtitle: "Operator identity and legal pages",
        desc: "The public site currently prioritises operator identity, legal disclosures, and a clearer boundary around what is and is not being offered.",
        note: "Static information only",
        tone: "green",
        route: "/app/about",
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
        title: "Interactive features are paused",
        desc: "Public interactive routes are temporarily redirected to a compliance notice while registrations and legal settings are reviewed.",
      },
      {
        title: "Operator identity stays visible",
        desc: "The public site continues to show who operates the business, the ABN details, and the legal pages that explain the current site boundary.",
      },
      {
        title: "Physical merch remains available",
        desc: "The commercial layer is narrowed to ordinary physical merch and related support while other features are paused.",
      },
      {
        title: "Legal pages remain public",
        desc: "Terms, privacy, and disclaimer pages remain available so visitors can see the current operator, boundaries, and contact points.",
      },
    ],
    []
  );

  const legalGroups = useMemo<LegalGroup[]>(
    () => [
      {
        title: "What this site is",
        desc: "The current public version is structured as a paused business site with legal information and physical merch.",
        points: [
          "A site operated by Jeremy Aaron Lugg under ABN 35 780 648 234",
          "A temporary compliance notice for paused interactive features",
          "A physical merch storefront",
        ],
      },
      {
        title: "What this site is not",
        desc: "The site is intentionally not positioned as a live interactive product during the pause.",
        points: [
          "No live interactive workflow is being offered publicly",
          "No transaction flow is being offered through the paused public routes",
          "No public managed-service workflow is being offered through the site",
        ],
      },
      {
        title: "Why this is lower-risk",
        desc: "These boundaries make the public offer closer to ordinary business information and merch while the review is underway.",
        points: [
          "Visitors are directed to notice and legal pages instead of interactive workflows",
          "Commercial activity is tied to physical products instead of access promises",
          "The site clearly identifies the operator and current public boundary",
        ],
      },
      {
        title: "What would change the analysis",
        desc: "These features would need fresh Australian legal review before any future relaunch.",
        points: [
          "Returning paused interactive flows to the public site",
          "Adding customer transactions, managed services, or pooled-capital features",
          "Making new financial or platform claims without updated legal review",
        ],
      },
    ],
    []
  );

  const routeBands = useMemo<RouteBand[]>(
    () => [
      {
        id: "jalsol",
        kicker: "TEMPORARY NOTICE",
        title: "Compliance Pause",
        desc: "Interactive site features are paused while registrations and legal settings are reviewed.",
        tone: "gold",
        previewTitle: "Paused route",
        previewDesc: "Visitors are redirected to a temporary compliance notice instead of live interactive workflows.",
        previewImage: "/JALSOL1.gif",
        tags: ["Paused", "Compliance", "Registration", "Review"],
        note: "Temporary route while registration is reviewed",
        route: "/app/compliance",
      },
      {
        id: "engine",
        kicker: "LEGAL CLARITY",
        title: "About And Terms",
        desc: "Use the public site to identify the legal operator, current business activity, and the present limits of the offer while interactive features are paused.",
        tone: "green",
        previewTitle: "Current boundaries",
        previewDesc: "The public offer is reduced to identity, legal disclosures, and ordinary commerce pages.",
        previewImage: "/JALSOL1.gif",
        tags: ["ABN", "Terms", "Disclaimer", "Operator"],
        note: "Best public label: site and business information",
        route: "/app/about",
      },
      {
        id: "shop",
        kicker: "PHYSICAL STORE",
        title: "Shop",
        desc: "The storefront now works as a clean merch surface for apparel, collectibles, and physical branded items sold through Jeremy Aaron Lugg's public site.",
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
          aria-label="Jeremy Aaron Lugg site overview"
        >
          <div className="home-console-hero-bg" aria-hidden="true">
            <img className="home-console-hero-logo" src="/JALSOL1.gif" alt="" />
          </div>

          <div className="home-console-hero-foreground home-console-hero-foreground--identity">
            <div className="home-console-copy">
              <div className="home-kicker">JEREMY AARON LUGG - PUBLIC SITE</div>

              <h1 className="home-title">
                Operator identity, legal clarity, and physical merch.
              </h1>

              <p className="home-lead">
                <strong>Built and operated by Jeremy Aaron Lugg.</strong> Interactive site
                features are temporarily paused
                while registrations and legal settings are reviewed.
              </p>

              <p className="home-console-sublead">
                The public site currently focuses on operator identity, legal disclosures, and
                physical merch while the interactive surface is unavailable.
              </p>

              <div className="jal-links">
                <button
                  type="button"
                  className="button gold"
                  onClick={() => beginRoute("/app/compliance", "jalsol")}
                  disabled={loading}
                >
                  Read Notice
                </button>

                <button
                  type="button"
                  className="button ghost"
                  onClick={() => beginRoute("/app/about", "engine")}
                  disabled={loading}
                >
                  About Jeremy
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
                  <li>Operator identity and business details</li>
                  <li>Terms, privacy, and disclaimer pages</li>
                  <li>Physical merch only in the storefront</li>
                </ul>
              </div>

              <div className="home-console-side-card home-vision-card">
                <div className="home-console-side-kicker">IF SOMEONE ASKS</div>
                <div className="home-console-side-title">How to describe the site</div>
                <p className="home-identity-desc">
                  This is Jeremy Aaron Lugg's public business site, operated under ABN 35 780 648
                  234 and currently focused on legal information and physical merch while
                  interactive features are paused for review.
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
                The homepage now separates what is still public from what has been temporarily
                paused so the site does not continue presenting live interactive workflows.
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
                paused information site and a normal merch business than to a regulated platform.
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
              If this site later restores paused interactive features or adds new regulated
              service activity, the homepage copy and the legal position both need to be
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
                These are the three public surfaces worth leading with during the compliance pause:
                notice, legal information, and physical merch.
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
