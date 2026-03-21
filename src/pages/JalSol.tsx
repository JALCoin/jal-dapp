import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { readLevel1Access } from "../lib/access";

type RouteTo =
  | "/app/home"
  | "/app/jal-sol"
  | "/app/jal-sol/level-1"
  | "/app/nav"
  | "/app/shop"
  | "/app/create-token";

type GateCard = {
  id: string;
  eyebrow: string;
  title: string;
  line: string;
  note: string;
  route: RouteTo;
  style: "observe" | "enter" | "build";
};

type SystemStage = {
  id: string;
  level: string;
  title: string;
  state: "current" | "available" | "locked";
  description: string;
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
    note: "Digital value, wallets, ownership, and what moving on-chain really means.",
  },
  {
    id: "cex-dex",
    title: "CEX vs DEX",
    note: "The difference between guided entry points and direct self-custody interaction.",
  },
  {
    id: "wallets-custody",
    title: "Wallets and custody",
    note: "Why control matters, where people fail, and how to think about responsibility.",
  },
  {
    id: "solana-basics",
    title: "Solana basics",
    note: "Accounts, fees, transactions, speed, and how the system actually moves.",
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
    }, 950);
  }

  const primaryRoute: RouteTo = level1Unlocked
    ? "/app/jal-sol/level-1"
    : "/app/shop";

  const gateCards = useMemo<GateCard[]>(
    () => [
      {
        id: "observe",
        eyebrow: "Gate 01",
        title: "Observe",
        line: "Learn before acting.",
        note: "Start with awareness. See how wallets, exchanges, custody, and Solana fit together before risking confusion.",
        route: "/app/jal-sol",
        style: "observe",
      },
      {
        id: "enter",
        eyebrow: "Gate 02",
        title: level1Unlocked ? "Resume Entry" : "Enter",
        line: "Take your first controlled step.",
        note: level1Unlocked
          ? "Your Level 1 path is active. Continue the movement you already started."
          : "Move from passive observation into real action through the first guided progression layer.",
        route: primaryRoute,
        style: "enter",
      },
      {
        id: "build",
        eyebrow: "Gate 03",
        title: "Build",
        line: "Create your own system.",
        note: "Use the token creation pathway to move from participant to creator and form your own functional asset.",
        route: "/app/nav",
        style: "build",
      },
    ],
    [level1Unlocked, primaryRoute]
  );

  const stages = useMemo<SystemStage[]>(
    () => [
      {
        id: "world-hub",
        level: "0.5",
        title: "World Hub",
        state: "current",
        description: "First contact. Direction replaces urgency.",
      },
      {
        id: "awareness",
        level: "0",
        title: "Awareness",
        state: "current",
        description: "Understand movement before committing to it.",
      },
      {
        id: "entry",
        level: "1",
        title: "Controlled Entry",
        state: level1Unlocked ? "current" : "available",
        description: "First correct action through guided onboarding.",
      },
      {
        id: "creation",
        level: "2",
        title: "Creation",
        state: "locked",
        description: "Shift from consumer to creator.",
      },
      {
        id: "identity",
        level: "3",
        title: "Identity + Utility",
        state: "locked",
        description: "Attach meaning, structure, and use to assets.",
      },
      {
        id: "market",
        level: "4",
        title: "Market Structure",
        state: "locked",
        description: "Replace reaction with rule-based interaction.",
      },
      {
        id: "engine",
        level: "5",
        title: "Deterministic Execution",
        state: "locked",
        description: "Visible system logic replaces emotional behaviour.",
      },
      {
        id: "deployment",
        level: "6",
        title: "Deployment",
        state: "locked",
        description: "Independent user-owned systems replicate outward.",
      },
    ],
    [level1Unlocked]
  );

  return (
    <main
      className={`home-shell jal-shell jal-ground-page ${
        loading ? "is-fading" : ""
      }`}
      aria-label="JAL/SOL World Hub"
    >
      <div className="home-wrap">
        <section className="card machine-surface panel-frame jal-window">
          <section className="jal-hero jal-world-hero" aria-label="World Hub hero">
            <div className="jal-hero-top">
              <div className="jal-kicker">JAL/SOL • WORLD HUB</div>

              <div className="jal-status" aria-label="System status">
                <span className="jal-status-dot" />
                <span className="jal-status-text">Nothing Here Is Urgent</span>
              </div>
            </div>

            <div className="jal-hero-center">
              <p className="jal-world-pretitle">Entry point into controlled movement</p>

              <h1 className="home-title">
                You are not browsing a website.
                <br />
                You are stepping into a system.
              </h1>

              <p className="home-lead">
                JAL/SOL is an order-of-processing environment for digital value.
                It takes a person from awareness to action, from action to creation,
                from creation to structure, and from structure to independent systems.
              </p>

              <p className="jal-sublead">
                Start by choosing a direction. Observe the system. Enter it
                correctly. Or build inside it. Each path changes what becomes
                visible next.
              </p>
            </div>

            <div className="jal-arrival-note" aria-label="Core principles">
              <span>HOPE → WILL → FAITH → REACTION → EVALUATION → ADAPTATION</span>
              <span>ORDER BEFORE OUTCOME</span>
              <span>STRUCTURE OVER HYPE</span>
            </div>

            <div className="jal-links">
              <button
                type="button"
                className="button neon"
                onClick={() => beginRoute(primaryRoute)}
                disabled={loading}
              >
                {level1Unlocked ? "Continue Progress" : "Enter The System"}
              </button>

              <a
                className="button ghost"
                href="#jal-gates"
                aria-disabled={loading}
                onClick={(event) => {
                  if (loading) event.preventDefault();
                }}
              >
                Choose A Path
              </a>

              <button
                type="button"
                className="button ghost"
                onClick={() => beginRoute("/app/home")}
                disabled={loading}
              >
                Return To App Home
              </button>
            </div>
          </section>

          <section
            id="jal-gates"
            className="jal-bay jal-bay-wide"
            aria-label="Three entry gates"
          >
            <div className="jal-bay-head">
              <div className="jal-bay-title">Three Entry Gates</div>
              <div className="jal-bay-note">Choose your direction of movement</div>
            </div>

            <p className="jal-note">
              This system begins by removing indecision. You do not need to see
              everything at once. You need to choose the correct next movement.
            </p>

            <div className="jal-gate-grid">
              {gateCards.map((gate) => (
                <article
                  key={gate.id}
                  className={`jal-gate-card jal-gate-card--${gate.style}`}
                >
                  <div className="jal-gate-top">
                    <span className="jal-gate-eyebrow">{gate.eyebrow}</span>
                  </div>

                  <h2 className="jal-gate-title">{gate.title}</h2>
                  <p className="jal-gate-line">{gate.line}</p>
                  <p className="jal-gate-note">{gate.note}</p>

                  <div className="jal-gate-actions">
                    <button
                      type="button"
                      className={`button ${
                        gate.style === "enter" ? "gold" : "ghost"
                      }`}
                      onClick={() => beginRoute(gate.route)}
                      disabled={loading}
                    >
                      {gate.title}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="System definition">
            <div className="jal-bay-head">
              <div className="jal-bay-title">What This Actually Is</div>
              <div className="jal-bay-note">Controlled progression system</div>
            </div>

            <p className="jal-note">
              JAL/SOL is not a random course, a simple token tool, or a noisy
              trading page. It is a progression framework designed to move a user
              from observer to participant, from participant to creator, and from
              creator to structured operator.
            </p>

            <div className="jal-bullets">
              <article className="jal-bullet">
                <div className="jal-bullet-k">Observe</div>
                <div className="jal-bullet-v">
                  Learn the foundations: wallets, custody, exchanges, Solana,
                  and why movement matters more than hype.
                </div>
              </article>

              <article className="jal-bullet">
                <div className="jal-bullet-k">Enter</div>
                <div className="jal-bullet-v">
                  Execute the first correct movement through guided onboarding,
                  wallet connection, and real interaction.
                </div>
              </article>

              <article className="jal-bullet">
                <div className="jal-bullet-k">Build</div>
                <div className="jal-bullet-v">
                  Create assets, attach utility, connect identity, and progress
                  toward deterministic system execution.
                </div>
              </article>
            </div>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="Visible progression">
            <div className="jal-bay-head">
              <div className="jal-bay-title">Visible Progression</div>
              <div className="jal-bay-note">The path does not reveal itself all at once</div>
            </div>

            <p className="jal-note">
              Every layer exists to remove a different form of human weakness:
              confusion, hesitation, fear, randomness, and dependency.
            </p>

            <div className="jal-level-rail">
              {stages.map((stage) => {
                const stateClass =
                  stage.state === "current"
                    ? "is-open"
                    : stage.state === "available"
                    ? "is-paid"
                    : "is-locked";

                const stateLabel =
                  stage.state === "current"
                    ? "Visible"
                    : stage.state === "available"
                    ? "Next"
                    : "Locked";

                return (
                  <article key={stage.id} className={`jal-level-card ${stateClass}`}>
                    <div className="jal-level-top">
                      <div className="jal-level-number">L{stage.level}</div>
                      <div className={`jal-level-state ${stateClass}`}>
                        {stateLabel}
                      </div>
                    </div>

                    <h3 className="jal-level-title">{stage.title}</h3>
                    <p className="jal-level-outcome">{stage.description}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="jal-grid" aria-label="Open learning and first paid gate">
            <section className="jal-bay">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Open Knowledge</div>
                <div className="jal-bay-note">Free awareness layer</div>
              </div>

              <p className="jal-note">
                Before paid progression begins, the basics remain visible.
                Awareness is the first stabiliser in the system.
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
                <div className="jal-bay-title">First Irreversible State</div>
                <div className="jal-bay-note">Why Level 1 exists</div>
              </div>

              <p className="jal-note">
                The first paid gate is not about locking information. It is about
                creating a real movement that changes the user’s relationship to
                the system.
              </p>

              <p className="jal-lock-text">
                A wallet. A first transaction. A first controlled transfer.
                Entry exists because passive observation does not create
                ownership.
              </p>

              <div className="jal-bay-actions">
                <button
                  type="button"
                  className="button gold"
                  onClick={() => beginRoute(primaryRoute)}
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

          <section className="jal-bay jal-bay-wide" aria-label="System endpoint">
            <div className="jal-bay-head">
              <div className="jal-bay-title">Where This Leads</div>
              <div className="jal-bay-note">Engine → identity → replication</div>
            </div>

            <p className="jal-note">
              The endpoint is not endless education. The endpoint is structured
              operation: token creation, identity-linked utility, visible machine
              logic, and eventually the deployment of independent systems tied
              back to JAL/SOL.
            </p>

            <div className="jal-bullets">
              <article className="jal-bullet">
                <div className="jal-bullet-k">Layer 2</div>
                <div className="jal-bullet-v">
                  Create a functional token and move from user to builder.
                </div>
              </article>

              <article className="jal-bullet">
                <div className="jal-bullet-k">Layer 5</div>
                <div className="jal-bullet-v">
                  Access deterministic execution through visible state, rules,
                  slots, and system logic.
                </div>
              </article>

              <article className="jal-bullet">
                <div className="jal-bullet-k">Layer 6</div>
                <div className="jal-bullet-v">
                  Expand into user-owned domains and replicated structures that
                  trace back to the source system.
                </div>
              </article>
            </div>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="Final choice">
            <div className="jal-bay-head">
              <div className="jal-bay-title">Choose The Next Movement</div>
              <div className="jal-bay-note">Observer, participant, or builder</div>
            </div>

            <p className="jal-note">
              You do not need more noise. You need correct order. Start where
              your state is true, then move properly.
            </p>

            <div className="jal-bay-actions">
              <button
                type="button"
                className="button neon"
                onClick={() => beginRoute(primaryRoute)}
                disabled={loading}
              >
                {level1Unlocked ? "Continue Your Progress" : "Enter The System"}
              </button>

              <button
                type="button"
                className="button ghost"
                onClick={() => beginRoute("/app/nav")}
                disabled={loading}
              >
                Open System Nav
              </button>
            </div>
          </section>
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