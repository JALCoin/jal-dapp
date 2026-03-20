import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { readLevel1Access } from "../lib/access";

type RouteTo =
  | "/app/home"
  | "/app/jal-sol"
  | "/app/jal-sol/level-1"
  | "/app/nav"
  | "/app/shop";

type LevelCard = {
  id: string;
  level: string;
  title: string;
  identity: string;
  message: string;
  state: "open" | "available" | "locked";
};

type OpenModule = {
  id: string;
  title: string;
  note: string;
};

const OPEN_MODULES: OpenModule[] = [
  {
    id: "what-is-crypto",
    title: "What crypto actually is",
    note: "A simple explanation of digital value, ownership, wallets, and on-chain movement.",
  },
  {
    id: "cex-dex",
    title: "CEX vs DEX",
    note: "The difference between centralised onboarding and self-directed execution.",
  },
  {
    id: "wallets-custody",
    title: "Wallets and custody",
    note: "Why control matters, what can go wrong, and what self-custody actually means.",
  },
  {
    id: "solana-basics",
    title: "Solana basics",
    note: "Accounts, transactions, fees, speed, and how movement happens in the network.",
  },
];

export default function JalSolPage() {
  const navigate = useNavigate();
  const timerRef = useRef<number | null>(null);

  const [level1Unlocked, setLevel1Unlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const access = readLevel1Access();
    setLevel1Unlocked(Boolean(access?.sessionId));
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  function beginRoute(to: RouteTo) {
    if (loading) return;

    setLoading(true);
    timerRef.current = window.setTimeout(() => {
      navigate(to);
    }, 1200);
  }

  const primaryActionHref: RouteTo = level1Unlocked
    ? "/app/jal-sol/level-1"
    : "/app/shop";

  const primaryActionLabel = level1Unlocked
    ? "Continue Your Progress"
    : "Enter The System";

  const secondaryActionLabel = level1Unlocked
    ? "Resume Entry"
    : "View The Path";

  const levels = useMemo<LevelCard[]>(
    () => [
      {
        id: "l0",
        level: "L0",
        title: "Awareness",
        identity: "Observer",
        message: "You see the system.",
        state: "open",
      },
      {
        id: "l1",
        level: "L1",
        title: "Activation",
        identity: "Participant",
        message: "You enter through real action.",
        state: level1Unlocked ? "open" : "available",
      },
      {
        id: "l2",
        level: "L2",
        title: "Control",
        identity: "Controller",
        message: "You stop moving randomly.",
        state: "locked",
      },
      {
        id: "l3",
        level: "L3",
        title: "Market Entry",
        identity: "Operator",
        message: "You interact without fear.",
        state: "locked",
      },
      {
        id: "l4",
        level: "L4",
        title: "System Build",
        identity: "System",
        message: "Rules replace reaction.",
        state: "locked",
      },
      {
        id: "l5",
        level: "L5",
        title: "Automation",
        identity: "Machine",
        message: "The system runs without you.",
        state: "locked",
      },
      {
        id: "l6",
        level: "L6",
        title: "Identity Economy",
        identity: "Asset",
        message: "You become an economic entity.",
        state: "locked",
      },
    ],
    [level1Unlocked]
  );

  return (
    <main
      className={`home-shell jal-shell ${loading ? "jal-ground-page is-fading" : ""}`}
      aria-label="JAL/SOL"
    >
      <div className="home-wrap">
        <section className="card machine-surface panel-frame jal-window">
          <section className="jal-hero" aria-label="JAL/SOL hero">
            <div className="jal-hero-top">
              <div className="jal-kicker">JAL/SOL</div>
              <div className="jal-status" aria-label="System state">
                <span className="jal-status-dot" />
                <span className="jal-status-text">System Path Active</span>
              </div>
            </div>

            <h1 className="home-title">
              You are not entering crypto.
              <br />
              You are entering a system.
            </h1>

            <p className="home-lead">
              Most people enter markets with no structure, no controlled path,
              and no idea what state they are really in.
            </p>

            <p className="jal-sublead">
              JAL/SOL is a progression system that takes a person from awareness
              to action, from action to control, and from control to ownership.
              The endpoint is not more information. The endpoint is becoming a
              self-operating financial system with its own economic identity.
            </p>

            <div className="jal-links">
              <button
                type="button"
                className="button neon"
                onClick={() => beginRoute(primaryActionHref)}
                disabled={loading}
              >
                {primaryActionLabel}
              </button>

              <a
                className="button ghost"
                href="#jal-path-preview"
                aria-disabled={loading}
                onClick={(event) => {
                  if (loading) event.preventDefault();
                }}
              >
                {secondaryActionLabel}
              </a>

              <button
                type="button"
                className="button ghost"
                onClick={() => beginRoute("/app/nav")}
                disabled={loading}
              >
                System Nav
              </button>
            </div>

            <div className="jal-arrival-note">
              <span>CONFUSION REMOVED</span>
              <span>ORDER BEFORE OUTCOME</span>
              <span>OWNERSHIP THROUGH PROGRESSION</span>
            </div>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="System explanation">
            <div className="jal-bay-head">
              <div className="jal-bay-title">What JAL/SOL Is</div>
              <div className="jal-bay-note">Progression-based entry system</div>
            </div>

            <p className="jal-note">
              This is not a random crypto course and it is not a hype funnel.
              Each level exists to remove one human limitation at a time.
            </p>

            <div className="jal-bullets">
              <article className="jal-bullet">
                <div className="jal-bullet-k">L0 → L2</div>
                <div className="jal-bullet-v">
                  Remove confusion, inaction, and disorder. Learn what is real,
                  make your first movement, and gain control.
                </div>
              </article>

              <article className="jal-bullet">
                <div className="jal-bullet-k">L3 → L4</div>
                <div className="jal-bullet-v">
                  Remove fear and emotion. Interact with markets properly and
                  build a repeatable system instead of reacting blindly.
                </div>
              </article>

              <article className="jal-bullet">
                <div className="jal-bullet-k">L5 → L6</div>
                <div className="jal-bullet-v">
                  Remove time and dependency. Automate execution and attach
                  economic identity through token-based ownership.
                </div>
              </article>
            </div>
          </section>

          <section
            id="jal-path-preview"
            className="jal-bay jal-bay-wide"
            aria-label="Path preview"
          >
            <div className="jal-bay-head">
              <div className="jal-bay-title">The Path</div>
              <div className="jal-bay-note">Visible progression</div>
            </div>

            <p className="jal-note">
              You do not learn this system from the outside. You move through it
              level by level.
            </p>

            <div className="jal-level-rail">
              {levels.map((item) => {
                const stateClass =
                  item.state === "open"
                    ? "is-open"
                    : item.state === "available"
                    ? "is-paid"
                    : "is-locked";

                const stateLabel =
                  item.state === "open"
                    ? "Visible"
                    : item.state === "available"
                    ? "Next"
                    : "Locked";

                return (
                  <article key={item.id} className={`jal-level-card ${stateClass}`}>
                    <div className="jal-level-top">
                      <div className="jal-level-number">{item.level}</div>
                      <div className={`jal-level-state ${stateClass}`}>
                        {stateLabel}
                      </div>
                    </div>

                    <h3 className="jal-level-title">{item.title}</h3>
                    <p className="jal-level-price">{item.identity}</p>
                    <p className="jal-level-outcome">{item.message}</p>
                    <p className="jal-level-body">
                      {item.level === "L0" &&
                        "See the structure before committing to it."}
                      {item.level === "L1" &&
                        "Cross from observation into real on-chain action."}
                      {item.level === "L2" &&
                        "Gain structure over wallet flow and capital movement."}
                      {item.level === "L3" &&
                        "Learn how to operate inside the market itself."}
                      {item.level === "L4" &&
                        "Build rules so behaviour stops controlling outcomes."}
                      {item.level === "L5" &&
                        "Deploy a machine-layer built for consistent execution."}
                      {item.level === "L6" &&
                        "Attach system identity through token and ecosystem presence."}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="jal-grid" aria-label="Open modules and commitment">
            <section className="jal-bay">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Open Knowledge</div>
                <div className="jal-bay-note">Free entry material</div>
              </div>

              <p className="jal-note">
                Before anyone pays, they should understand the basics of where
                value moves, how wallets work, and why order matters.
              </p>

              <div className="jal-steps">
                {OPEN_MODULES.map((module) => (
                  <div key={module.id}>
                    <strong>{module.title}</strong>
                    <span className="jal-step-sub">{module.note}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="jal-bay">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Why Entry Exists</div>
                <div className="jal-bay-note">The first irreversible state</div>
              </div>

              <p className="jal-note">
                Entry is the first paid gate because most people never move past
                passive observation. They read, scroll, react, and stay outside.
              </p>

              <p className="jal-lock-text">
                JAL/SOL starts by forcing a real action. A wallet. A purchase. A
                first transfer. A movement that changes your relationship to the
                system.
              </p>

              <div className="jal-bay-actions">
                <button
                  type="button"
                  className="button gold"
                  onClick={() => beginRoute(primaryActionHref)}
                  disabled={loading}
                >
                  {level1Unlocked ? "Resume Entry" : "Enter The System"}
                </button>

                <button
                  type="button"
                  className="button ghost"
                  onClick={() => beginRoute("/app/shop")}
                  disabled={loading}
                >
                  View Access Layers
                </button>
              </div>
            </section>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="Final conversion">
            <div className="jal-bay-head">
              <div className="jal-bay-title">The Decision</div>
              <div className="jal-bay-note">Observer or participant</div>
            </div>

            <p className="jal-note">
              You already understand enough to know what this is. The difference
              now is whether you stay outside it, or move into it in the correct
              order.
            </p>

            <div className="jal-bay-actions">
              <button
                type="button"
                className="button neon"
                onClick={() => beginRoute(primaryActionHref)}
                disabled={loading}
              >
                {level1Unlocked ? "Continue Your Progress" : "Enter The System"}
              </button>

              <button
                type="button"
                className="button ghost"
                onClick={() => beginRoute("/app/home")}
                disabled={loading}
              >
                Return to App Home
              </button>
            </div>
          </section>
        </section>
      </div>

      {loading && (
        <div
          className="loading-screen"
          role="status"
          aria-label="Loading"
          aria-live="polite"
        >
          <img className="loading-logo" src="/JALSOL1.gif" alt="" />
        </div>
      )}
    </main>
  );
}