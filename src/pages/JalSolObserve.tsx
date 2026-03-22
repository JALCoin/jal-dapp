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

type ObserveStepId =
  | "orientation"
  | "filter"
  | "truth"
  | "structure"
  | "transaction"
  | "stillness"
  | "observer";

type ObserveStep = {
  id: ObserveStepId;
  label: string;
  note: string;
};

const OBSERVE_STORAGE_KEY = "jal_observe_complete_v1";

const OBSERVE_STEPS: ObserveStep[] = [
  {
    id: "orientation",
    label: "Orientation",
    note: "Preparation, not action.",
  },
  {
    id: "filter",
    label: "Filter",
    note: "Remove bad mental models.",
  },
  {
    id: "truth",
    label: "System Truth",
    note: "Replace noise with structure.",
  },
  {
    id: "structure",
    label: "Structure",
    note: "Open the core primitives.",
  },
  {
    id: "transaction",
    label: "Transaction",
    note: "Understand what signing does.",
  },
  {
    id: "stillness",
    label: "Stillness",
    note: "No urgency enters Gate 02.",
  },
  {
    id: "observer",
    label: "Observer",
    note: "State confirmed.",
  },
];

const LEARN_CARDS: LearnCard[] = [
  {
    id: "wallets",
    title: "Wallets",
    body: [
      "A wallet does not store money in the ordinary sense.",
      "It controls the keys that authorise movement on a network.",
      "Whoever controls the keys controls the assets.",
    ],
  },
  {
    id: "custody",
    title: "Custody",
    body: [
      "Custody defines who carries responsibility for control.",
      "On an exchange, more of that burden sits with the platform.",
      "In self-custody, accuracy and responsibility move toward the user.",
    ],
  },
  {
    id: "cex-dex",
    title: "CEX vs DEX",
    body: [
      "A centralised exchange gives a more guided entry path.",
      "A decentralised exchange is more direct and less forgiving.",
      "The difference is not hype. It is control, responsibility, and interaction style.",
    ],
  },
  {
    id: "solana",
    title: "Solana",
    body: [
      "Solana is a network that processes signed instructions.",
      "Transactions change account state on-chain.",
      "Speed lowers friction, but it can also increase the consequence of rushed action.",
    ],
  },
];

export default function JalSolObserve() {
  const navigate = useNavigate();
  const timerRef = useRef<number | null>(null);
  const stepDelayRef = useRef<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [canContinue, setCanContinue] = useState(false);
  const [openedCards, setOpenedCards] = useState<string[]>([]);
  const [stillnessAccepted, setStillnessAccepted] = useState(false);

  const currentStep = OBSERVE_STEPS[stepIndex];
  const isLastStep = stepIndex === OBSERVE_STEPS.length - 1;
  const structureComplete = openedCards.length === LEARN_CARDS.length;

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (stepDelayRef.current) window.clearTimeout(stepDelayRef.current);
      document.body.style.pointerEvents = "";
    };
  }, []);

  useEffect(() => {
    setCanContinue(false);

    if (stepDelayRef.current) {
      window.clearTimeout(stepDelayRef.current);
    }

    const delayMs =
      currentStep.id === "orientation"
        ? 1800
        : currentStep.id === "stillness"
        ? 2500
        : 900;

    stepDelayRef.current = window.setTimeout(() => {
      setCanContinue(true);
    }, delayMs);

    window.scrollTo({ top: 0, behavior: "auto" });

    return () => {
      if (stepDelayRef.current) window.clearTimeout(stepDelayRef.current);
    };
  }, [currentStep.id]);

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

  function handleBack() {
    if (loading || stepIndex === 0) return;
    setStepIndex((prev) => Math.max(prev - 1, 0));
  }

  function handleNext() {
    if (loading || nextDisabled) return;

    if (isLastStep) {
      localStorage.setItem(OBSERVE_STORAGE_KEY, "true");
      beginRoute("/app/jal-sol/enter");
      return;
    }

    setStepIndex((prev) => Math.min(prev + 1, OBSERVE_STEPS.length - 1));
  }

  function openCard(cardId: string) {
    setOpenedCards((prev) => (prev.includes(cardId) ? prev : [...prev, cardId]));
  }

  const nextDisabled = useMemo(() => {
    if (!canContinue) return true;
    if (currentStep.id === "structure" && !structureComplete) return true;
    if (currentStep.id === "stillness" && !stillnessAccepted) return true;
    return false;
  }, [canContinue, currentStep.id, structureComplete, stillnessAccepted]);

  const progressText = `${stepIndex + 1} / ${OBSERVE_STEPS.length}`;

  return (
    <main
      className={`home-shell jal-shell jal-ground-page ${loading ? "is-fading" : ""}`}
      aria-label="JAL/SOL Observe Gate"
    >
      <div className="home-wrap">
        <section className="card machine-surface panel-frame jal-window">
          <section className="jal-hero jal-world-hero" aria-label="Observe gate hero">
            <div className="jal-hero-top">
              <div className="jal-kicker">JAL/SOL • GATE 01</div>

              <div className="jal-status" aria-label="Observe state">
                <span className="jal-status-dot" />
                <span className="jal-status-text">Preparation Before Movement</span>
              </div>
            </div>

            <div className="jal-hero-center">
              <p className="jal-world-pretitle">Awareness gate</p>

              <h1 className="home-title">
                Observe first.
                <br />
                Move later.
              </h1>

              <p className="home-lead">
                This gate is not for action. It is for stabilisation. The user is slowed down,
                misinformation is removed, and the environment becomes understandable before any
                irreversible step is introduced.
              </p>

              <p className="jal-sublead">
                The goal is simple: turn an unaware visitor into an informed observer. No hype. No
                pressure. No “buy now” behaviour.
              </p>
            </div>

            <div className="jal-arrival-note" aria-label="Observe principles">
              <span>ORDER BEFORE ACTION</span>
              <span>NO IRREVERSIBLE MOVEMENT</span>
              <span>CLARITY OVER HYPE</span>
            </div>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="Observe progress tracker">
            <div className="jal-bay-head">
              <div className="jal-bay-title">Observe Sequence</div>
              <div className="jal-bay-note">{progressText}</div>
            </div>

            <p className="jal-note">
              This gate is completed in order. One frame is active at a time. Progression is paced
              so the user slows down before entering the next state.
            </p>

            <div className="jal-level-rail">
              {OBSERVE_STEPS.map((step, index) => {
                const isActive = index === stepIndex;
                const isComplete = index < stepIndex;

                return (
                  <article
                    key={step.id}
                    className={`jal-level-card ${
                      isActive ? "is-open" : isComplete ? "is-paid" : "is-locked"
                    }`}
                    aria-current={isActive ? "step" : undefined}
                  >
                    <div className="jal-level-top">
                      <div className="jal-level-number">{String(index + 1).padStart(2, "0")}</div>
                      <div
                        className={`jal-level-state ${
                          isActive ? "is-open" : isComplete ? "is-paid" : "is-locked"
                        }`}
                      >
                        {isActive ? "Current" : isComplete ? "Complete" : "Waiting"}
                      </div>
                    </div>

                    <h3 className="jal-level-title">{step.label}</h3>
                    <p className="jal-level-outcome">{step.note}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="Observe current frame">
            {currentStep.id === "orientation" && (
              <>
                <div className="jal-bay-head">
                  <div className="jal-bay-title">Nothing here requires action</div>
                  <div className="jal-bay-note">Orientation</div>
                </div>

                <p className="jal-note">
                  Most people enter markets through urgency, imitation, or fragmented information.
                  This gate does the opposite. It slows the user down and restores order before
                  action is even considered.
                </p>

                <p className="jal-lock-text">
                  This is preparation, not participation.
                </p>

                <div className="jal-bullets">
                  <article className="jal-bullet">
                    <div className="jal-bullet-k">Purpose</div>
                    <div className="jal-bullet-v">
                      Build awareness before irreversible movement.
                    </div>
                  </article>

                  <article className="jal-bullet">
                    <div className="jal-bullet-k">State</div>
                    <div className="jal-bullet-v">Observer</div>
                  </article>

                  <article className="jal-bullet">
                    <div className="jal-bullet-k">Risk</div>
                    <div className="jal-bullet-v">Low — no forced action.</div>
                  </article>
                </div>
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
                    <span className="jal-step-sub">
                      That is not a stable model. It is a reactive one.
                    </span>
                  </div>

                  <div>
                    <strong>“You need to move quickly.”</strong>
                    <span className="jal-step-sub">
                      Speed without understanding multiplies error.
                    </span>
                  </div>

                  <div>
                    <strong>“More movement means more opportunity.”</strong>
                    <span className="jal-step-sub">
                      Noise is not structure.
                    </span>
                  </div>

                  <div>
                    <strong>“If I wait, I lose.”</strong>
                    <span className="jal-step-sub">
                      Forced urgency is one of the easiest paths into bad decisions.
                    </span>
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
                    <div className="jal-bullet-v">Not hype. Control.</div>
                  </article>

                  <article className="jal-bullet">
                    <div className="jal-bullet-k">Transaction</div>
                    <div className="jal-bullet-v">Not a casual click. A signed instruction.</div>
                  </article>

                  <article className="jal-bullet">
                    <div className="jal-bullet-k">Market</div>
                    <div className="jal-bullet-v">
                      Not guaranteed opportunity. A system of participants with uneven understanding.
                    </div>
                  </article>
                </div>

                <p className="jal-note">
                  If the user does not understand the system, the system decides the outcome for
                  them.
                </p>
              </>
            )}

            {currentStep.id === "structure" && (
              <>
                <div className="jal-bay-head">
                  <div className="jal-bay-title">Open the core structure</div>
                  <div className="jal-bay-note">
                    {structureComplete
                      ? "All modules opened"
                      : `${openedCards.length} / ${LEARN_CARDS.length} opened`}
                  </div>
                </div>

                <p className="jal-note">
                  Awareness here is intentional. Each block must be opened before progression
                  continues.
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
                              Open this module to reveal the minimum structure required before
                              entry.
                            </p>

                            <div className="jal-bay-actions">
                              <button
                                type="button"
                                className="button ghost"
                                onClick={() => openCard(card.id)}
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
                  Completion here is soft, but intentional. The user must at least touch each
                  primitive once.
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
                    <span className="jal-step-sub">
                      The user prepares an action for the network.
                    </span>
                  </div>

                  <div>
                    <strong>Sign instruction</strong>
                    <span className="jal-step-sub">
                      The wallet proves authority through the user’s keys.
                    </span>
                  </div>

                  <div>
                    <strong>Broadcast to network</strong>
                    <span className="jal-step-sub">
                      The instruction is sent outward for processing.
                    </span>
                  </div>

                  <div>
                    <strong>State changes</strong>
                    <span className="jal-step-sub">
                      Balances, ownership, or account conditions can change.
                    </span>
                  </div>
                </div>

                <p className="jal-lock-text">
                  The user is not pressing a harmless button. They are authorising a real state
                  transition.
                </p>
              </>
            )}

            {currentStep.id === "stillness" && (
              <>
                <div className="jal-bay-head">
                  <div className="jal-bay-title">Stillness check</div>
                  <div className="jal-bay-note">No urgency enters Gate 02</div>
                </div>

                <p className="jal-note">
                  If the user feels rushed, they are not ready for irreversible movement. Entry
                  should begin from calm understanding, not pressure.
                </p>

                <p className="jal-lock-text">
                  If you feel urgency, stop. If you feel clear, continue.
                </p>

                <div className="jal-bay-actions">
                  <button
                    type="button"
                    className={stillnessAccepted ? "button gold" : "button ghost"}
                    onClick={() => setStillnessAccepted(true)}
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
                  No wallet signature was required here. No buy action was pushed here. The change
                  is structural: the user now has the minimum stable framing required to approach
                  the next gate correctly.
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
                      Informed observer with correct framing for entry.
                    </div>
                  </article>

                  <article className="jal-bullet">
                    <div className="jal-bullet-k">Next</div>
                    <div className="jal-bullet-v">
                      Controlled Entry — the first irreversible action.
                    </div>
                  </article>
                </div>
              </>
            )}
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="Observe controls">
            <div className="jal-bay-head">
              <div className="jal-bay-title">Sequence Controls</div>
              <div className="jal-bay-note">Gate 01 progression</div>
            </div>

            <p className="jal-note">
              This page should feel like a controlled slide sequence. One frame at a time. Calm
              pacing. Clear transition into the next state.
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