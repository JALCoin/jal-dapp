import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type RouteTo =
  | "/app/home"
  | "/app/jal-sol"
  | "/app/jal-sol/enter"
  | "/app/shop";

type LearnCard = {
  id: "wallets" | "custody" | "cex-dex" | "solana";
  title: string;
  body: string[];
};

type StepId =
  | "orientation"
  | "filter"
  | "truth"
  | "structure"
  | "transaction"
  | "stillness"
  | "observer";

const OBSERVE_STORAGE_KEY = "jal_observe_complete_v1";

const LEARN_CARDS: LearnCard[] = [
  {
    id: "wallets",
    title: "Wallets",
    body: [
      "A wallet does not hold money in the way most people think.",
      "It holds the keys that prove control over digital assets on a network.",
      "Whoever controls the keys controls the assets.",
    ],
  },
  {
    id: "custody",
    title: "Custody",
    body: [
      "Custody defines who is responsible for control.",
      "On an exchange, the platform usually carries more of that burden.",
      "In self-custody, responsibility moves toward the user.",
    ],
  },
  {
    id: "cex-dex",
    title: "CEX vs DEX",
    body: [
      "A centralised exchange gives a more guided path.",
      "A decentralised exchange is more direct and requires more awareness.",
      "The difference is not hype. It is responsibility, control, and interaction style.",
    ],
  },
  {
    id: "solana",
    title: "Solana",
    body: [
      "Solana is a network for processing signed instructions.",
      "Transactions change state on-chain.",
      "Speed lowers friction, but it can also increase the consequence of rushed action.",
    ],
  },
];

const STEPS: { id: StepId; label: string }[] = [
  { id: "orientation", label: "Orientation" },
  { id: "filter", label: "Filter" },
  { id: "truth", label: "System Truth" },
  { id: "structure", label: "Structure" },
  { id: "transaction", label: "Transaction" },
  { id: "stillness", label: "Stillness" },
  { id: "observer", label: "Observer" },
];

export default function JalSolObserve() {
  const navigate = useNavigate();
  const timerRef = useRef<number | null>(null);
  const stepDelayRef = useRef<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [canContinue, setCanContinue] = useState(false);
  const [openedCards, setOpenedCards] = useState<string[]>([]);
  const [understoodStillness, setUnderstoodStillness] = useState(false);

  const currentStep = STEPS[stepIndex];

  useEffect(() => {
    document.body.style.pointerEvents = "";

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (stepDelayRef.current) window.clearTimeout(stepDelayRef.current);
      document.body.style.pointerEvents = "";
    };
  }, []);

  useEffect(() => {
    setCanContinue(false);

    if (stepDelayRef.current) window.clearTimeout(stepDelayRef.current);

    const delay =
      currentStep.id === "stillness"
        ? 3000
        : currentStep.id === "orientation"
        ? 2200
        : 1200;

    stepDelayRef.current = window.setTimeout(() => {
      setCanContinue(true);
    }, delay);

    window.scrollTo({ top: 0, behavior: "smooth" });

    return () => {
      if (stepDelayRef.current) window.clearTimeout(stepDelayRef.current);
    };
  }, [currentStep.id]);

  const structureComplete = openedCards.length === LEARN_CARDS.length;
  const isLastStep = stepIndex === STEPS.length - 1;

  const nextDisabled = useMemo(() => {
    if (!canContinue) return true;

    if (currentStep.id === "structure" && !structureComplete) return true;
    if (currentStep.id === "stillness" && !understoodStillness) return true;

    return false;
  }, [canContinue, currentStep.id, structureComplete, understoodStillness]);

  function beginRoute(to: RouteTo) {
    if (loading) return;

    setLoading(true);
    document.body.style.pointerEvents = "none";

    timerRef.current = window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
      navigate(to);
      document.body.style.pointerEvents = "";
    }, 900);
  }

  function handleNext() {
    if (nextDisabled) return;

    if (isLastStep) {
      localStorage.setItem(OBSERVE_STORAGE_KEY, "true");
      beginRoute("/app/jal-sol/enter");
      return;
    }

    setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
  }

  function handleBack() {
    if (loading) return;
    setStepIndex((prev) => Math.max(prev - 1, 0));
  }

  function toggleCard(cardId: string) {
    setOpenedCards((prev) =>
      prev.includes(cardId) ? prev : [...prev, cardId]
    );
  }

  const progressText = `${stepIndex + 1} / ${STEPS.length}`;

  return (
    <main
      className={`home-shell jal-shell jal-ground-page ${loading ? "is-fading" : ""}`}
      aria-label="JAL/SOL Observe Gate"
    >
      <div className="home-wrap">
        <section className="card machine-surface panel-frame jal-window" aria-label="Observe sequence">
          <section className="jal-hero jal-world-hero" aria-label="Observe gate header">
            <div className="jal-hero-top">
              <div className="jal-kicker">JAL/SOL • GATE 01 • OBSERVE</div>

              <div className="jal-status" aria-label="Observe status">
                <span className="jal-status-dot" />
                <span className="jal-status-text">Preparation, Not Action</span>
              </div>
            </div>

            <div className="jal-hero-center">
              <p className="jal-world-pretitle">Awareness gate</p>

              <h1 className="home-title">
                Stabilise first.
                <br />
                Move later.
              </h1>

              <p className="home-lead">
                Observe is not where the user acts. It is where confusion is reduced,
                pressure is removed, and the environment becomes understandable.
              </p>

              <p className="jal-sublead">
                This gate exists to turn an unaware visitor into an informed observer.
                No transaction is required here. No urgency is rewarded here.
              </p>
            </div>

            <div className="jal-arrival-note" aria-label="Observe principles">
              <span>ORDER BEFORE ACTION</span>
              <span>NO IRREVERSIBLE MOVEMENT</span>
              <span>CLARITY OVER HYPE</span>
            </div>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="Sequence rail">
            <div className="jal-bay-head">
              <div className="jal-bay-title">Observe Sequence</div>
              <div className="jal-bay-note">{progressText}</div>
            </div>

            <div className="jal-level-rail">
              {STEPS.map((step, index) => {
                const isActive = index === stepIndex;
                const isDone = index < stepIndex;

                return (
                  <article
                    key={step.id}
                    className={`jal-level-card ${isActive ? "is-open" : isDone ? "is-paid" : "is-locked"}`}
                    aria-current={isActive ? "step" : undefined}
                  >
                    <div className="jal-level-top">
                      <div className="jal-level-number">{String(index + 1).padStart(2, "0")}</div>
                      <div className={`jal-level-state ${isActive ? "is-open" : isDone ? "is-paid" : "is-locked"}`}>
                        {isActive ? "Current" : isDone ? "Complete" : "Waiting"}
                      </div>
                    </div>

                    <h3 className="jal-level-title">{step.label}</h3>
                    <p className="jal-level-outcome">
                      {step.id === "orientation" && "The user is told this is preparation, not action."}
                      {step.id === "filter" && "Bad mental models are surfaced and removed."}
                      {step.id === "truth" && "Correct system framing replaces noise."}
                      {step.id === "structure" && "Core primitives are opened intentionally."}
                      {step.id === "transaction" && "The user understands what signing actually does."}
                      {step.id === "stillness" && "Urgency is rejected before progression."}
                      {step.id === "observer" && "The observer state is confirmed and stored."}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="Current observe step">
            {currentStep.id === "orientation" && (
              <>
                <div className="jal-bay-head">
                  <div className="jal-bay-title">Nothing here requires action</div>
                  <div className="jal-bay-note">Orientation</div>
                </div>

                <p className="jal-note">
                  Most people meet markets through urgency, imitation, and fragmented advice.
                  This gate does the opposite. It slows the user down and restores order before
                  any irreversible movement is introduced.
                </p>

                <p className="jal-lock-text">
                  This is preparation, not participation.
                </p>
              </>
            )}

            {currentStep.id === "filter" && (
              <>
                <div className="jal-bay-head">
                  <div className="jal-bay-title">Remove the wrong frame</div>
                  <div className="jal-bay-note">Filter</div>
                </div>

                <div className="jal-steps">
                  <div>
                    <strong>“Crypto is fast money.”</strong>
                    <span className="jal-step-sub">That is a reaction model, not a stable one.</span>
                  </div>

                  <div>
                    <strong>“You need to move quickly.”</strong>
                    <span className="jal-step-sub">Speed without understanding increases error.</span>
                  </div>

                  <div>
                    <strong>“More movement means more opportunity.”</strong>
                    <span className="jal-step-sub">Noise is not structure.</span>
                  </div>

                  <div>
                    <strong>“If I wait, I lose.”</strong>
                    <span className="jal-step-sub">Forced urgency is one of the easiest ways to make bad decisions.</span>
                  </div>
                </div>

                <p className="jal-lock-text">
                  These are not strategies. They are unstable entry conditions.
                </p>
              </>
            )}

            {currentStep.id === "truth" && (
              <>
                <div className="jal-bay-head">
                  <div className="jal-bay-title">What this actually is</div>
                  <div className="jal-bay-note">System truth</div>
                </div>

                <div className="jal-bullets">
                  <article className="jal-bullet">
                    <div className="jal-bullet-k">Wallet</div>
                    <div className="jal-bullet-v">
                      Not a hype object. A control point.
                    </div>
                  </article>

                  <article className="jal-bullet">
                    <div className="jal-bullet-k">Transaction</div>
                    <div className="jal-bullet-v">
                      Not just a click. A signed instruction.
                    </div>
                  </article>

                  <article className="jal-bullet">
                    <div className="jal-bullet-k">Market</div>
                    <div className="jal-bullet-v">
                      Not guaranteed opportunity. A system of participants acting under uneven understanding.
                    </div>
                  </article>
                </div>

                <p className="jal-lock-text">
                  If the user does not understand the system, the system decides the outcome for them.
                </p>
              </>
            )}

            {currentStep.id === "structure" && (
              <>
                <div className="jal-bay-head">
                  <div className="jal-bay-title">Open the core structure</div>
                  <div className="jal-bay-note">
                    {structureComplete ? "All modules opened" : `${openedCards.length} / ${LEARN_CARDS.length} opened`}
                  </div>
                </div>

                <p className="jal-note">
                  Awareness here is not passive scrolling. Each block should be opened deliberately
                  before progression continues.
                </p>

                <div className="jal-grid" aria-label="Observe learning cards">
                  {LEARN_CARDS.map((card) => {
                    const isOpened = openedCards.includes(card.id);

                    return (
                      <section key={card.id} className="jal-bay">
                        <div className="jal-bay-head">
                          <div className="jal-bay-title">{card.title}</div>
                          <div className="jal-bay-note">{isOpened ? "Opened" : "Pending"}</div>
                        </div>

                        {!isOpened ? (
                          <>
                            <p className="jal-note">
                              This block should be opened before the sequence can continue.
                            </p>

                            <div className="jal-bay-actions">
                              <button
                                type="button"
                                className="button ghost"
                                onClick={() => toggleCard(card.id)}
                                disabled={loading}
                              >
                                Open {card.title}
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            {card.body.map((line, index) => (
                              <p key={index} className="jal-note">
                                {line}
                              </p>
                            ))}
                          </>
                        )}
                      </section>
                    );
                  })}
                </div>

                <p className="jal-lock-text">
                  Completion here is soft, but intentional. The user must at least touch each primitive once.
                </p>
              </>
            )}

            {currentStep.id === "transaction" && (
              <>
                <div className="jal-bay-head">
                  <div className="jal-bay-title">What a transaction actually is</div>
                  <div className="jal-bay-note">Finality matters</div>
                </div>

                <div className="jal-steps">
                  <div>
                    <strong>Create instruction</strong>
                    <span className="jal-step-sub">An action is assembled for the network.</span>
                  </div>

                  <div>
                    <strong>Sign instruction</strong>
                    <span className="jal-step-sub">The wallet proves authority through the user’s keys.</span>
                  </div>

                  <div>
                    <strong>Broadcast to network</strong>
                    <span className="jal-step-sub">The instruction is sent outward for processing.</span>
                  </div>

                  <div>
                    <strong>State changes</strong>
                    <span className="jal-step-sub">Balances, ownership, or account state can change.</span>
                  </div>
                </div>

                <p className="jal-lock-text">
                  The user is not pressing a harmless button. They are authorising a real state transition.
                </p>
              </>
            )}

            {currentStep.id === "stillness" && (
              <>
                <div className="jal-bay-head">
                  <div className="jal-bay-title">Stillness check</div>
                  <div className="jal-bay-note">No urgency enters the next gate</div>
                </div>

                <p className="jal-note">
                  If the user feels rushed, they are not ready for irreversible movement.
                  Entry should begin from calm understanding, not pressure.
                </p>

                <p className="jal-lock-text">
                  If you feel urgency, stop. If you feel clear, continue.
                </p>

                <div className="jal-bay-actions">
                  <button
                    type="button"
                    className={understoodStillness ? "button gold" : "button ghost"}
                    onClick={() => setUnderstoodStillness(true)}
                    disabled={loading}
                  >
                    I understand
                  </button>
                </div>
              </>
            )}

            {currentStep.id === "observer" && (
              <>
                <div className="jal-bay-head">
                  <div className="jal-bay-title">Observer state confirmed</div>
                  <div className="jal-bay-note">State change</div>
                </div>

                <p className="jal-note">
                  No wallet signature was required here. No buy action was pushed here.
                  The change is structural: the user now has the minimum stable framing required
                  to approach the next gate correctly.
                </p>

                <div className="jal-bullets">
                  <article className="jal-bullet">
                    <div className="jal-bullet-k">Before</div>
                    <div className="jal-bullet-v">
                      Unaware, reactive, and vulnerable to noise.
                    </div>
                  </article>

                  <article className="jal-bullet">
                    <div className="jal-bullet-k">After</div>
                    <div className="jal-bullet-v">
                      Informed observer with a better entry condition.
                    </div>
                  </article>

                  <article className="jal-bullet">
                    <div className="jal-bullet-k">Next Gate</div>
                    <div className="jal-bullet-v">
                      Enter — the first controlled irreversible movement.
                    </div>
                  </article>
                </div>
              </>
            )}
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="Observe controls">
            <div className="jal-bay-head">
              <div className="jal-bay-title">Sequence Controls</div>
              <div className="jal-bay-note">Controlled pacing</div>
            </div>

            <p className="jal-note">
              Observe should end with better condition, not excitement. The next gate opens only
              after this sequence has been completed in order.
            </p>

            <div className="jal-bay-actions">
              <button
                type="button"
                className="button ghost"
                onClick={handleBack}
                disabled={loading || stepIndex === 0}
              >
                Back
              </button>

              <button
                type="button"
                className={isLastStep ? "button gold" : "button neon"}
                onClick={handleNext}
                disabled={loading || nextDisabled}
              >
                {isLastStep ? "Proceed To Enter" : "Continue"}
              </button>

              <button
                type="button"
                className="button ghost"
                onClick={() => beginRoute("/app/jal-sol")}
                disabled={loading}
              >
                Return To World Hub
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