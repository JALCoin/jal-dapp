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

  const networkLabel = "PUBLIC DOMAIN";

  const homePillars = useMemo<HomePillar[]>(
    () => [
      {
        id: "founder",
        title: "Founder",
        subtitle: "Jeremy Aaron Lugg and the JALSOL direction",
        desc: "Start with the person, background, and mindset shaping the business before you move into products, legal pages, or market-facing material.",
        note: "Identity and story",
        tone: "gold",
        route: "/app/about",
      },
      {
        id: "legal",
        title: "Business",
        subtitle: "Legal, business, and public-site details",
        desc: "Review the public documents, business identity, and current site settings that make the domain feel accountable and professionally grounded.",
        note: "Verify the public details",
        tone: "green",
        route: "/app/legal",
      },
      {
        id: "shop",
        title: "Store",
        subtitle: "Physical releases and branded objects",
        desc: "Browse a cleaner commercial layer focused on physical JALSOL releases presented as a founder-brand storefront rather than a crowded product catalogue.",
        note: "Physical releases",
        tone: "cyan",
        route: "/app/shop",
      },
    ],
    []
  );

  const boundaryItems = useMemo<BoundaryItem[]>(
    () => [
      {
        title: "Founder-led and attributable",
        desc: "The site is built around a named operator, visible business details, and a public-facing identity rather than an anonymous project shell.",
      },
      {
        title: "Crypto-aware without reading like hype",
        desc: "Cryptocurrency remains part of the market context and direction of the brand, but it does not overwhelm the business identity or replace substance.",
      },
      {
        title: "Public offer stays understandable",
        desc: "Visitors can quickly see what the site is for now: founder identity, legal visibility, public contact points, and physical releases.",
      },
      {
        title: "Trust signals remain visible",
        desc: "ABN details, legal pages, and official business contact points stay easy to verify so the site feels more like a real business domain than a landing page experiment.",
      },
    ],
    []
  );

  const legalGroups = useMemo<LegalGroup[]>(
    () => [
      {
        title: "What this site represents",
        desc: "The public version is designed to represent Jeremy Aaron Lugg as a real operator with a real business domain.",
        points: [
          "A founder-led public business domain",
          "A named operator with visible ABN and contact details",
          "A brand environment where physical releases and market-aware positioning can live together",
        ],
      },
      {
        title: "How crypto fits",
        desc: "Crypto belongs here as market context and technical direction, not as empty theatre.",
        points: [
          "It informs the tone, audience, and long-term direction of the site",
          "It supports the identity of the brand without needing to dominate every message",
          "It stays secondary to clarity, trust, and a coherent public offer",
        ],
      },
      {
        title: "Why the public site feels safer and clearer",
        desc: "The site works better when visitors can understand the operator, the offer, and the current boundaries without friction.",
        points: [
          "The operator is named clearly",
          "The legal pages are public and readable",
          "The public commercial layer is limited to physical merch and supportable business activity",
        ],
      },
      {
        title: "What remains under review",
        desc: "Some interactive features are still held back while legal settings are reviewed, and that boundary remains visible through the sitewide notice and legal pages.",
        points: [
          "Interactive routes that go beyond the current public business surface",
          "Any future financial-services style functionality or regulated market claims",
          "Any expansion that changes the present legal or commercial reading of the site",
        ],
      },
    ],
    []
  );

  const routeBands = useMemo<RouteBand[]>(
    () => [
      {
        id: "founder",
        kicker: "FOUNDER PROFILE",
        title: "About Jeremy",
        desc: "The personal and professional background behind JALSOL, including the practical work, systems thinking, and market interest shaping the direction of the site.",
        tone: "gold",
        previewTitle: "Founder-led identity",
        previewDesc: "A clearer story about the operator, the path behind the work, and why the site exists.",
        previewImage: "/JALSOL1.gif",
        tags: ["Founder", "Identity", "Background", "Direction"],
        note: "Start here if you want the human context",
        route: "/app/about",
      },
      {
        id: "legal",
        kicker: "BUSINESS CLARITY",
        title: "Legal Hub",
        desc: "Use the document hub to verify the operator, read the public legal pages, and understand how the business-facing side of the site is currently presented.",
        tone: "green",
        previewTitle: "Public business details",
        previewDesc: "Legal pages, ABN visibility, contact points, and the current public-site settings in one place.",
        previewImage: "/JALSOL1.gif",
        tags: ["ABN", "Legal", "Privacy", "Terms"],
        note: "Use this to verify the business-facing details",
        route: "/app/legal",
      },
      {
        id: "shop",
        kicker: "PHYSICAL STORE",
        title: "Shop",
        desc: "The storefront works as a clean founder-brand merch surface for apparel, collectibles, and physical branded items sold through Jeremy Aaron Lugg's public site.",
        tone: "cyan",
        previewTitle: "Physical releases",
        previewDesc: "A simpler commerce layer built around physical products, clearer presentation, and a more premium brand signal.",
        previewImage: "/JALSOL1.gif",
        tags: ["Physical merch", "Collectibles", "Apparel", "Brand objects"],
        note: "Best public label: founder-brand storefront",
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
              <div className="home-kicker">JEREMY AARON LUGG | FOUNDER SITE</div>

              <h1 className="home-title">
                A founder-led business domain built around crypto markets, product thinking, and
                physical releases.
              </h1>

              <p className="home-lead">
                <strong>Built and operated by Jeremy Aaron Lugg under ABN 35 780 648 234.</strong>{" "}
                JALSOL brings together founder identity, business clarity, market-aware branding,
                and a growing catalogue of physical releases.
              </p>

              <p className="home-console-sublead">
                This site is designed to feel personal and accountable: one operator, one public
                identity, one place to understand the business, the story, and the current offer.
              </p>

              <div className="jal-links">
                <button
                  type="button"
                  className="button gold"
                  onClick={() => beginRoute("/app/about", "founder")}
                  disabled={loading}
                >
                  About Jeremy
                </button>

                <button
                  type="button"
                  className="button ghost"
                  onClick={() => beginRoute("/app/legal", "legal")}
                  disabled={loading}
                >
                  Legal + Business
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
                <div className="home-console-side-title">What lives inside the public site</div>
                <ul className="home-identity-points">
                  <li>Founder identity and business details</li>
                  <li>Public legal and business documents</li>
                  <li>Physical JALSOL releases</li>
                </ul>
              </div>

              <div className="home-console-side-card home-vision-card">
                <div className="home-console-side-kicker">SITE SIGNAL</div>
                <div className="home-console-side-title">How the brand should read</div>
                <p className="home-identity-desc">
                  Founder-led, market-aware, and professionally grounded. Personal enough to carry
                  your identity, but structured enough to read like a real business domain.
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
                The homepage should lead with identity, business clarity, and a coherent
                commercial layer so the site feels complete before a visitor ever reaches the legal
                pages.
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
              <h2 className="home-modules-title">What keeps the public version professional</h2>
              <p className="home-modules-lead">
                These are the principles that make the public site feel more like a strong
                founder-business domain and less like an unfinished crypto landing page.
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
                <div className="home-legal-summary-kicker">PUBLIC SITE SUMMARY</div>
                <h2 className="home-modules-title">Open the plain-language explanation for how the site is meant to read</h2>
                <p className="home-modules-lead">
                  This dropdown explains the current public setup in practical terms. It is not
                  legal advice, not a licence, and not a promise about future features.
                </p>
              </div>

              <div className="home-legal-summary-note">Open summary</div>
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
              If the site later expands into new interactive or regulated activity, the public
              positioning and legal framing should be reviewed together before launch.
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
              <h2 className="home-modules-title">Where each part of the public site should live</h2>
              <p className="home-modules-lead">
                These are the three routes worth leading with right now: founder profile, legal and
                business clarity, and the physical storefront.
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
