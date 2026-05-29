import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DonateButton from "../components/DonateButton";
import { usePageMeta } from "../hooks/usePageMeta";

function fmtTime(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

type HomePillar = {
  id: string;
  kicker: string;
  title: string;
  desc: string;
  note: string;
  tone?: "green" | "gold" | "cyan";
  route: string;
};

type BuildStatusItem = {
  label: string;
  value: string;
  desc: string;
};

type BuildUpdate = {
  tag: string;
  title: string;
  desc: string;
  route?: string;
};

type BuildPhase = {
  stage: string;
  title: string;
  items: string[];
};

export default function Home() {
  usePageMeta(
    "Follow The Build",
    "Follow Jeremy Aaron Lugg's JALSOL build across founder identity, systems direction, legal clarity, and physical releases."
  );

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
    }, 650);
  }

  const networkLabel = "PUBLIC DOMAIN";

  const buildStatus = useMemo<BuildStatusItem[]>(
    () => [
      {
        label: "Identity",
        value: "JALSOL Live",
        desc: "Founder domain, public story, ABN visibility, and contact pathways are active.",
      },
      {
        label: "Releases",
        value: "Interest Open",
        desc: "Physical product concepts are staged for interest before fixed-price checkout.",
      },
      {
        label: "Engine",
        value: "Static Overview",
        desc: "The public route explains the system. Home only shows static mockup signals, not live feeds.",
      },
      {
        label: "Boundary",
        value: "Transparent",
        desc: "Legal pages separate current public activity from future private systems.",
      },
    ],
    []
  );

  const homePillars = useMemo<HomePillar[]>(
    () => [
      {
        id: "founder",
        kicker: "UNDERSTAND JAL",
        title: "Founder",
        desc: "Start with Jeremy Aaron Lugg, the path behind the work, and the direction shaping JALSOL.",
        note: "About Jeremy",
        tone: "gold",
        route: "/app/about",
      },
      {
        id: "engine",
        kicker: "SEE THE ENGINE",
        title: "$JAL~ENGINE",
        desc: "Read the public systems explanation without exposing private operator data or live market feeds.",
        note: "Static overview",
        tone: "green",
        route: "/app/engine",
      },
      {
        id: "shop",
        kicker: "SUPPORT GROWTH",
        title: "Store",
        desc: "Browse planned physical releases, register interest, and follow the founder-brand product direction.",
        note: "Physical releases",
        tone: "cyan",
        route: "/app/shop",
      },
      {
        id: "legal",
        kicker: "TRUST LAYER",
        title: "Business",
        desc: "Verify the ABN, public legal documents, privacy terms, and current public-site boundaries.",
        note: "Legal + Business",
        tone: "gold",
        route: "/app/legal",
      },
    ],
    []
  );

  const buildUpdates = useMemo<BuildUpdate[]>(
    () => [
      {
        tag: "DOMAIN",
        title: "Visitor orientation upgraded",
        desc: "Landing, nav, support, and legal sequencing now guide people through the JALSOL story before deeper routes.",
        route: "/app/nav",
      },
      {
        tag: "ENGINE",
        title: "Engine split clarified",
        desc: "The public Engine page is an overview, while the private operator dashboard remains gated behind engineer access.",
        route: "/app/engine",
      },
      {
        tag: "SHOP",
        title: "Shop simplified",
        desc: "Physical releases now read as planned concepts and private enquiries instead of a checkout-heavy catalogue.",
        route: "/app/shop",
      },
      {
        tag: "BACKEND",
        title: "Allocator work continues",
        desc: "The engine service has been tuned around primary and secondary rail capital priorities outside the public site.",
      },
    ],
    []
  );

  const buildPhases = useMemo<BuildPhase[]>(
    () => [
      {
        stage: "NOW",
        title: "Public foundation",
        items: ["Founder identity", "Legal trust layer", "Interest-first shop", "Static Engine overview"],
      },
      {
        stage: "NEXT",
        title: "Proof and polish",
        items: ["Product mockups", "Clearer update rhythm", "Analytics checkpoints", "Supplier-ready release paths"],
      },
      {
        stage: "LATER",
        title: "Release layer",
        items: ["Confirmed products", "Stripe checkout only when ready", "Better imagery", "Deeper infrastructure story"],
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
            <span className="terminal-auth is-ro">FOLLOW THE BUILD</span>
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
                Follow Jeremy Aaron Lugg's JALSOL build across founder identity, systems, and physical releases.
              </h1>

              <p className="home-lead">
                <strong>Built and operated under ABN 35 780 648 234.</strong> This is the public
                orientation point for the JALSOL story, the private systems layer, and planned
                physical releases.
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
                  onClick={() => beginRoute("/app/engine", "engine")}
                  disabled={loading}
                >
                  See Engine
                </button>

                <button
                  type="button"
                  className="button ghost"
                  onClick={() => beginRoute("/app/shop", "shop")}
                  disabled={loading}
                >
                  Register Interest
                </button>

                <DonateButton className="home-donate-action" />
              </div>
            </div>

            <aside className="home-console-side" aria-label="Project definition">
              <div className="home-console-side-card home-identity-card">
                <div className="home-console-side-kicker">JOIN THE PROCESS</div>
                <div className="home-console-side-title">Choose a direction</div>
                <ul className="home-identity-points">
                  <li>Understand the founder path</li>
                  <li>See the static Engine overview</li>
                  <li>Register interest in physical releases</li>
                  <li>Donate as voluntary support</li>
                </ul>
              </div>

              <div className="home-console-side-card home-static-engine-card">
                <div className="home-console-side-kicker">STATIC ENGINE MOCKUP</div>
                <div className="home-console-side-title">$JAL~ENGINE signal</div>
                <div className="home-static-engine-mockup" aria-hidden="true">
                  <div className="home-static-engine-bar">
                    <span>PRIVATE SYSTEM</span>
                    <strong>GATED</strong>
                  </div>
                  <div className="home-static-engine-grid">
                    <span>8-coin map</span>
                    <span>rail logic</span>
                    <span>capital paths</span>
                    <span>operator only</span>
                  </div>
                </div>
                <p className="home-identity-desc">
                  Static visual only. No live market feed, wallet feed, or private dashboard data is
                  shown on the public Home page.
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section
          className="card machine-surface panel-frame home-roadmap-window home-build-status-window"
          aria-label="Current build status"
        >
          <div className="home-roadmap-head">
            <div>
              <div className="home-kicker">CURRENT BUILD STATUS</div>
              <h2 className="home-modules-title">Where the public build stands now</h2>
              <p className="home-modules-lead">
                A quick orientation layer before the deeper pages: what is public, what is staged,
                and where visitors can join the process without confusion.
              </p>
            </div>
          </div>

          <div className="home-roadmap-grid" role="list" aria-label="Build status list">
            {buildStatus.map((item) => (
              <article key={item.label} className="home-roadmap-card" role="listitem">
                <div className="home-roadmap-level">{item.label}</div>
                <div className="home-roadmap-title">{item.value}</div>
                <p className="home-roadmap-desc">{item.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="card machine-surface panel-frame home-roadmap-window"
          aria-label="Latest build updates"
        >
          <div className="home-roadmap-head">
            <div>
              <div className="home-kicker">LATEST BUILD UPDATES</div>
              <h2 className="home-modules-title">Recent progress visitors can understand quickly</h2>
              <p className="home-modules-lead">
                This section gives the site a sense of movement without exposing private operator
                systems or live Engine data.
              </p>
            </div>
          </div>

          <div className="home-roadmap-grid" role="list" aria-label="Latest build update list">
            {buildUpdates.map((update) => (
              <button
                key={update.title}
                type="button"
                className="home-roadmap-card"
                onClick={() => update.route && beginRoute(update.route, update.tag.toLowerCase())}
                disabled={!update.route || loading}
                role="listitem"
                aria-label={update.route ? `Open ${update.title}` : update.title}
              >
                <div className="home-roadmap-level">{update.tag}</div>
                <div className="home-roadmap-title">{update.title}</div>
                <p className="home-roadmap-desc">{update.desc}</p>
                {update.route ? <div className="home-roadmap-open">Open</div> : null}
              </button>
            ))}
          </div>
        </section>

        <section
          className="card machine-surface panel-frame home-roadmap-window"
          aria-label="Now next later"
        >
          <div className="home-roadmap-head">
            <div>
              <div className="home-kicker">NOW / NEXT / LATER</div>
              <h2 className="home-modules-title">The build path in one scan</h2>
              <p className="home-modules-lead">
                Keep the flow simple: public foundation first, proof and polish second, release
                infrastructure after suppliers and fulfilment are clearer.
              </p>
            </div>
          </div>

          <div className="home-roadmap-grid home-roadmap-grid--three" role="list" aria-label="Build path">
            {buildPhases.map((phase) => (
              <article key={phase.stage} className="home-roadmap-card home-phase-card" role="listitem">
                <div className="home-roadmap-level">{phase.stage}</div>
                <div className="home-roadmap-title">{phase.title}</div>
                <ul className="home-phase-list">
                  {phase.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section
          className="card machine-surface panel-frame home-roadmap-window"
          aria-label="Public directions"
        >
          <div className="home-roadmap-head">
            <div>
              <div className="home-kicker">PUBLIC DIRECTIONS</div>
              <h2 className="home-modules-title">Choose the part of JALSOL you want to follow</h2>
              <p className="home-modules-lead">
                Four simple routes replace the old city-map feeling: founder, static Engine
                overview, shop interest, and legal trust proof.
              </p>
            </div>
          </div>

          <div className="home-roadmap-grid" role="list" aria-label="Public directions list">
            {homePillars.map((pillar) => (
              <button
                key={pillar.id}
                type="button"
                className={`home-roadmap-card tone-${pillar.tone ?? "cyan"} ${activeRoute === pillar.id ? "active" : ""}`}
                onClick={() => beginRoute(pillar.route, pillar.id)}
                role="listitem"
                aria-label={`Open ${pillar.title}`}
                disabled={loading}
              >
                <div className="home-roadmap-level">{pillar.kicker}</div>
                <div className="home-roadmap-title">{pillar.title}</div>
                <p className="home-roadmap-desc">{pillar.desc}</p>
                <div className="home-roadmap-open">{pillar.note}</div>
              </button>
            ))}
          </div>
        </section>

        <section
          className="card machine-surface panel-frame home-trust-strip"
          aria-label="Public trust summary"
        >
          <span>ABN visible</span>
          <span>Legal pages public</span>
          <span>Physical releases only</span>
          <span>Private systems staged</span>
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
