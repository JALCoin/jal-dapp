import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { readLevel1Access } from "../lib/access";

type RouteTo =
  | "/app/home"
  | "/app/jal-sol"
  | "/app/jal-sol/level-1"
  | "/app/nav"
  | "/app/shop"
  | "/app/create-token"
  | "/app/engine";

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
    note: "Digital value, ownership, wallets, and what it means to move on-chain without relying on noise.",
  },
  {
    id: "cex-dex",
    title: "CEX vs DEX",
    note: "The difference between guided exchange entry and direct self-custody interaction.",
  },
  {
    id: "wallets-custody",
    title: "Wallets and custody",
    note: "Why control matters, where people fail, and what responsibility really means in digital value.",
  },
  {
    id: "solana-basics",
    title: "Solana basics",
    note: "Accounts, transactions, fees, speed, and how the network actually behaves.",
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
      if (timerRef.current) window.clearTimeout(timerRef.current);
      document.body.style.pointerEvents = "";
    };
  }, []);

  function beginRoute(to: RouteTo) {
    if (loading) return;

    setLoading(true);
    document.body.style.pointerEvents = "none";

    timerRef.current = window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
      navigate(to);
      document.body.style.pointerEvents = "";
    }, 1200);
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
        note: "Begin with awareness. Understand exchanges, custody, wallets, and Solana before confusing movement with progress.",
        route: "/app/jal-sol",
        style: "observe",
      },
      {
        id: "enter",
        eyebrow: "Gate 02",
        title: level1Unlocked ? "Resume Entry" : "Enter",
        line: "Take your first controlled step.",
        note: level1Unlocked
          ? "Your Level 1 path is already active. Return to the exact movement you previously unlocked."
          : "Move from passive understanding into a real first action through guided progression and structured entry.",
        route: primaryRoute,
        style: "enter",
      },
      {
        id: "build",
        eyebrow: "Gate 03",
        title: "Build",
        line: "Create your own system.",
        note: "Creation is not the first step, but it is where this path ultimately points: token creation, identity, and functional ownership.",
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
        description: "First contact. Urgency is removed and direction becomes visible.",
      },
      {
        id: "awareness",
        level: "0",
        title: "Awareness",
        state: "current",
        description: "The user learns how digital movement works before committing to it.",
      },
      {
        id: "entry",
        level: "1",
        title: "Controlled Entry",
        state: level1Unlocked ? "current" : "available",
        description: "The first real step. Ownership begins when action becomes irreversible.",
      },
      {
        id: "creation",
        level: "2",
        title: "Creation",
        state: "locked",
        description: "The user moves from participant to builder.",
      },
      {
        id: "identity",
        level: "3",
        title: "Identity + Utility",
        state: "locked",
        description: "Assets become tied to meaning, structure, and use.",
      },
      {
        id: "market",
        level: "4",
        title: "Market Structure",
        state: "locked",
        description: "Reaction is replaced by rule-based interaction.",
      },
      {
        id: "engine",
        level: "5",
        title: "Deterministic Execution",
        state: "locked",
        description: "Visible machine logic replaces emotional behaviour.",
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
                Home shows the system.
                <br />
                JAL/SOL begins it.
              </h1>

              <p className="home-lead">
                JAL/SOL is the first real state of the wider environment. This is
                where a person stops passively browsing and starts understanding
                how the system is meant to be entered.
              </p>

              <p className="jal-sublead">
                The purpose of this page is simple: remove noise, give direction,
                and let the user choose the correct next movement. Observe first.
                Enter correctly. Build later.
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
                Return To Home
              </button>
            </div>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="System relationship">
            <div className="jal-bay-head">
              <div className="jal-bay-title">Where This Sits</div>
              <div className="jal-bay-note">Home → JAL/SOL → Engine</div>
            </div>

            <p className="jal-note">
              The wider experience now has a clearer order. <strong>Home</strong> is
              the command overview. <strong>JAL/SOL</strong> is the first controlled
              movement layer. <strong>$JAL~Engine</strong> is the execution layer where
              visible machine truth takes over.
            </p>

            <div className="jal-bullets">
              <article className="jal-bullet">
                <div className="jal-bullet-k">Home</div>
                <div className="jal-bullet-v">
                  Explains the architecture and lets the user select a state.
                </div>
              </article>

              <article className="jal-bullet">
                <div className="jal-bullet-k">JAL/SOL</div>
                <div className="jal-bullet-v">
                  Removes confusion and begins the correct order of entry.
                </div>
              </article>

              <article className="jal-bullet">
                <div className="jal-bullet-k">Engine</div>
                <div className="jal-bullet-v">
                  Displays deterministic execution, public state, and machine logic.
                </div>
              </article>
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
              This layer does not try to make the user consume everything. It
              exists to remove indecision and expose the correct next state.
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
              <div className="jal-bay-note">Controlled progression layer</div>
            </div>

            <p className="jal-note">
              JAL/SOL is not just content, and it is not just a token utility.
              It is the first structured environment where a user is taught how
              to move correctly inside the broader JALSOL system.
            </p>

            <div className="jal-bullets">
              <article className="jal-bullet">
                <div className="jal-bullet-k">Observe</div>
                <div className="jal-bullet-v">
                  Learn the foundations first: exchanges, wallets, custody,
                  Solana, and why correct movement matters.
                </div>
              </article>

              <article className="jal-bullet">
                <div className="jal-bullet-k">Enter</div>
                <div className="jal-bullet-v">
                  Make the first controlled action through wallet connection,
                  guided entry, and real interaction.
                </div>
              </article>

              <article className="jal-bullet">
                <div className="jal-bullet-k">Build</div>
                <div className="jal-bullet-v">
                  Progress toward creation, identity, utility, and eventual
                  deterministic execution.
                </div>
              </article>
            </div>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="Visible progression">
            <div className="jal-bay-head">
              <div className="jal-bay-title">Visible Progression</div>
              <div className="jal-bay-note">The path reveals itself in order</div>
            </div>

            <p className="jal-note">
              Every level exists to remove a different weakness: confusion,
              hesitation, randomness, dependency, and unstructured reaction.
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
                Not everything should be locked. Awareness remains visible because
                it stabilises the user before the first paid movement begins.
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
                <div className="jal-bay-note">Why Level 1 matters</div>
              </div>

              <p className="jal-note">
                Level 1 is not important because it is “paid.” It matters because
                it creates a real movement that changes the user’s relationship
                to the system.
              </p>

              <p className="jal-lock-text">
                A wallet connected. A first transaction. A first controlled
                transfer. Entry exists because observation alone does not create
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
              <div className="jal-bay-note">Creation → Engine → Replication</div>
            </div>

            <p className="jal-note">
              The endpoint is not endless learning. The endpoint is structured
              operation: create assets, attach identity and utility, understand
              market structure, and eventually access visible machine execution.
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
                  Access deterministic execution through state, rules, slots, and
                  public machine logic.
                </div>
              </article>

              <article className="jal-bullet">
                <div className="jal-bullet-k">Layer 6</div>
                <div className="jal-bullet-v">
                  Expand into independent systems tied back to the source
                  architecture.
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
              This page should end with clarity, not clutter. Choose the next
              true state and move properly.
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
                onClick={() => beginRoute("/app/engine")}
                disabled={loading}
              >
                View Engine Layer
              </button>

              <button
                type="button"
                className="button ghost"
                onClick={() => beginRoute("/app/home")}
                disabled={loading}
              >
                Return To Home
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