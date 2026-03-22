import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { readLevel1Access } from "../lib/access";

type RouteTo =
  | "/app/home"
  | "/app/jal-sol"
  | "/app/jal-sol/observe"
  | "/app/jal-sol/enter"
  | "/app/jal-sol/build"
  | "/app/jal-sol/level-1"
  | "/app/shop"
  | "/app/token"
  | "/app/engine";

type GateId = "observe" | "enter" | "build";

type GateCard = {
  id: GateId;
  eyebrow: string;
  title: string;
  line: string;
  note: string;
  outcome: string;
  route: RouteTo;
  style: "observe" | "enter" | "build";
};

type SystemStage = {
  id: string;
  level: string;
  title: string;
  description: string;
  gates: GateId[];
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
  const [activeGate, setActiveGate] = useState<GateId>("observe");

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

  const observeRoute: RouteTo = "/app/jal-sol/observe";
  const enterRoute: RouteTo = "/app/jal-sol/enter";
  const buildRoute: RouteTo = "/app/jal-sol/build";

  const gateCards = useMemo<GateCard[]>(
    () => [
      {
        id: "observe",
        eyebrow: "Gate 01",
        title: "Observe",
        line: "Understand the system before irreversible movement.",
        note: "Start with disclosure, awareness, exchanges, wallets, custody, and system logic before confusing motion with progress.",
        outcome: "Leads into Awareness (no irreversible action)",
        route: observeRoute,
        style: "observe",
      },
      {
        id: "enter",
        eyebrow: "Gate 02",
        title: "Enter",
        line: "Complete the first irreversible action.",
        note: level1Unlocked
          ? "Your Level 1 path is already active. Return directly to the guided entry state you previously unlocked."
          : "Move from passive understanding into guided participation and first controlled action through structured entry.",
        outcome: "Leads into Controlled Entry (first real transaction)",
        route: enterRoute,
        style: "enter",
      },
      {
        id: "build",
        eyebrow: "Gate 03",
        title: "Build",
        line: "Move into ownership, creation, and execution.",
        note: level1Unlocked
          ? "Progress beyond entry into token creation, identity, utility, and eventual deterministic execution."
          : "Creation is downstream of correct entry. Unlock controlled entry first, then move into ownership and system building.",
        outcome: level1Unlocked
          ? "Leads into Creation and System Ownership"
          : "Requires Controlled Entry before Creation",
        route: buildRoute,
        style: "build",
      },
    ],
    [level1Unlocked]
  );

  const stages = useMemo<SystemStage[]>(
    () => [
      {
        id: "world-hub",
        level: "0.5",
        title: "World Hub",
        description: "First contact. Urgency is removed and direction becomes visible.",
        gates: ["observe"],
      },
      {
        id: "awareness",
        level: "0",
        title: "Awareness",
        description: "The user learns how digital movement works before committing to it.",
        gates: ["observe"],
      },
      {
        id: "entry",
        level: "1",
        title: "Controlled Entry",
        description: "The first real step. Ownership begins when action becomes irreversible.",
        gates: ["enter"],
      },
      {
        id: "creation",
        level: "2",
        title: "Creation",
        description: "The user moves from participant to builder.",
        gates: ["build"],
      },
      {
        id: "identity",
        level: "3",
        title: "Identity + Utility",
        description: "Assets become tied to meaning, structure, and use.",
        gates: ["build"],
      },
      {
        id: "market",
        level: "4",
        title: "Market Structure",
        description: "Reaction is replaced by rule-based interaction.",
        gates: ["build"],
      },
      {
        id: "engine",
        level: "5",
        title: "Deterministic Execution",
        description: "Visible machine logic replaces emotional behaviour.",
        gates: ["build"],
      },
      {
        id: "deployment",
        level: "6",
        title: "Deployment",
        description: "Independent user-owned systems replicate outward.",
        gates: ["build"],
      },
    ],
    []
  );

  const activeGateCard = gateCards.find((gate) => gate.id === activeGate)!;

  const gateHeadline =
    activeGate === "observe"
      ? "Observe reveals the awareness path."
      : activeGate === "enter"
      ? "Enter reveals the first irreversible path."
      : "Build reveals the ownership and execution path.";

  const gateSubline =
    activeGate === "observe"
      ? "This path is for understanding before commitment."
      : activeGate === "enter"
      ? "This path is where the user stops observing and starts participating."
      : "This path expands from creation into utility, structure, and system ownership.";

  const activeGateRoute = activeGateCard.route;

  const activeGateButtonLabel =
    activeGate === "observe"
      ? "Open Observe Gate"
      : activeGate === "enter"
      ? "Open Enter Gate"
      : "Open Build Gate";

  return (
    <main
      className={`home-shell jal-shell jal-ground-page ${loading ? "is-fading" : ""}`}
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
                JAL/SOL is the first real state of the wider environment. This is where a person
                stops passively browsing and starts understanding how the system is meant to be
                entered.
              </p>

              <p className="jal-sublead">
                The purpose of this page is simple: remove noise, give direction, and let the user
                choose the correct next movement. Observe first. Enter correctly. Build later.
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
                onClick={() => beginRoute(activeGateRoute)}
                disabled={loading}
              >
                {activeGateButtonLabel}
              </button>

              <a
                className="button ghost"
                href="#jal-gates"
                aria-disabled={loading}
                onClick={(event) => {
                  if (loading) event.preventDefault();
                }}
              >
                Choose A Gate
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
              The wider experience now has a clearer order. <strong>Home</strong> is the command
              overview. <strong>JAL/SOL</strong> is the first controlled movement layer.{" "}
              <strong>$JAL~Engine</strong> is the execution layer where visible machine truth takes
              over.
            </p>

            <div className="jal-bullets">
              <article className="jal-bullet">
                <div className="jal-bullet-k">Home</div>
                <div className="jal-bullet-v">
                  Explains the architecture and sends the user toward the correct gate.
                </div>
              </article>

              <article className="jal-bullet">
                <div className="jal-bullet-k">JAL/SOL</div>
                <div className="jal-bullet-v">
                  Converts direction into movement and reveals the corresponding path.
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
              Gates are not levels. They are directional controls that reveal which part of the
              visible progression belongs to the user’s chosen path.
            </p>

            <div className="jal-gate-grid">
              {gateCards.map((gate) => {
                const isActive = activeGate === gate.id;

                return (
                  <article
                    key={gate.id}
                    className={`jal-gate-card jal-gate-card--${gate.style} ${
                      isActive ? "is-active" : ""
                    }`}
                  >
                    <div className="jal-gate-top">
                      <span className="jal-gate-eyebrow">{gate.eyebrow}</span>
                    </div>

                    <h2 className="jal-gate-title">{gate.title}</h2>
                    <p className="jal-gate-line">{gate.line}</p>
                    <p className="jal-gate-note">{gate.note}</p>
                    <p className="jal-lock-text">{gate.outcome}</p>

                    <div className="jal-gate-actions">
                      <button
                        type="button"
                        className={`button ${
                          gate.style === "enter" ? "gold" : isActive ? "neon" : "ghost"
                        }`}
                        onClick={() => setActiveGate(gate.id)}
                        disabled={loading}
                      >
                        {isActive ? "Selected" : `Select ${gate.title}`}
                      </button>

                      <button
                        type="button"
                        className="button ghost"
                        onClick={() => beginRoute(gate.route)}
                        disabled={loading}
                      >
                        Open Gate
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="Gate interpretation">
            <div className="jal-bay-head">
              <div className="jal-bay-title">Current Gate Focus</div>
              <div className="jal-bay-note">Selection changes progression visibility</div>
            </div>

            <p className="jal-note">
              <strong>{gateHeadline}</strong> {gateSubline}
            </p>

            <div className="jal-bullets">
              <article className="jal-bullet">
                <div className="jal-bullet-k">Selected Gate</div>
                <div className="jal-bullet-v">{activeGateCard.title}</div>
              </article>

              <article className="jal-bullet">
                <div className="jal-bullet-k">Path Meaning</div>
                <div className="jal-bullet-v">{activeGateCard.line}</div>
              </article>

              <article className="jal-bullet">
                <div className="jal-bullet-k">Immediate Outcome</div>
                <div className="jal-bullet-v">{activeGateCard.outcome}</div>
              </article>
            </div>

            <div className="jal-bay-actions">
              <button
                type="button"
                className="button gold"
                onClick={() => beginRoute(activeGateRoute)}
                disabled={loading}
              >
                {activeGateButtonLabel}
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

          <section className="jal-bay jal-bay-wide" aria-label="Visible progression">
            <div className="jal-bay-head">
              <div className="jal-bay-title">Visible Progression</div>
              <div className="jal-bay-note">The rail now follows the selected gate</div>
            </div>

            <p className="jal-note">
              The progression rail below is no longer generic. It responds to the selected gate and
              shows which stages belong to the current direction of movement.
            </p>

            <div className="jal-level-rail">
              {stages.map((stage) => {
                const belongsToGate = stage.gates.includes(activeGate);

                let stateClass = "is-locked";
                let stateLabel = "Hidden";

                if (belongsToGate) {
                  if (stage.level === "1") {
                    stateClass = "is-paid";
                    stateLabel = "Gate 02";
                  } else if (activeGate === "observe") {
                    stateClass = "is-open";
                    stateLabel = "Visible";
                  } else if (activeGate === "build" && !level1Unlocked) {
                    stateClass = "is-paid";
                    stateLabel = "After Entry";
                  } else {
                    stateClass = "is-open";
                    stateLabel = "Visible";
                  }
                }

                return (
                  <article key={stage.id} className={`jal-level-card ${stateClass}`}>
                    <div className="jal-level-top">
                      <div className="jal-level-number">L{stage.level}</div>
                      <div className={`jal-level-state ${stateClass}`}>{stateLabel}</div>
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
                Not everything should be locked. Awareness remains visible because it stabilises
                the user before the first paid movement begins.
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
                Level 1 is not important because it is “paid.” It matters because it creates a real
                movement that changes the user’s relationship to the system.
              </p>

              <p className="jal-lock-text">
                A wallet connected. A first transaction. A first controlled transfer. Entry exists
                because observation alone does not create ownership.
              </p>

              <div className="jal-bay-actions">
                <button
                  type="button"
                  className="button gold"
                  onClick={() => beginRoute("/app/jal-sol/enter")}
                  disabled={loading}
                >
                  Open Enter Gate
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
              The endpoint is not endless learning. The endpoint is structured operation: create
              assets, attach identity and utility, understand market structure, and eventually
              access visible machine execution.
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
                  Access deterministic execution through state, rules, slots, and public machine
                  logic.
                </div>
              </article>

              <article className="jal-bullet">
                <div className="jal-bullet-k">Layer 6</div>
                <div className="jal-bullet-v">
                  Expand into independent systems tied back to the source architecture.
                </div>
              </article>
            </div>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="Final choice">
            <div className="jal-bay-head">
              <div className="jal-bay-title">Choose The Next Movement</div>
              <div className="jal-bay-note">Gate-driven routing is now active</div>
            </div>

            <p className="jal-note">
              This page should end with clarity, not clutter. Select the gate, observe the path it
              reveals, then move into the next true state.
            </p>

            <div className="jal-bay-actions">
              <button
                type="button"
                className="button neon"
                onClick={() => beginRoute(activeGateRoute)}
                disabled={loading}
              >
                {activeGateButtonLabel}
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
        <div className="loading-screen" role="status" aria-live="polite" aria-label="Loading">
          <img className="loading-logo" src="/JALSOL1.gif" alt="" />
        </div>
      )}
    </main>
  );
}