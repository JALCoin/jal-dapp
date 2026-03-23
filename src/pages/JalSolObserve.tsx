import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import TokenFitGame from "../components/TokenFitGame";

type RouteTo =
  | "/app/home"
  | "/app/jal-sol"
  | "/app/jal-sol/enter"
  | "/app/shop";

type LearnCardId = "wallets" | "custody" | "cex-dex" | "solana";

type LearnCard = {
  id: LearnCardId;
  title: string;
  body: string[];
  contribution: string;
};

type ObserveStepId =
  | "orientation"
  | "filter"
  | "truth"
  | "structure"
  | "transaction"
  | "stillness"
  | "test"
  | "token-fit"
  | "observer";

type ObserveStep = {
  id: ObserveStepId;
  label: string;
  note: string;
};

type TestQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
};

type ObserveAccessState = {
  passed: boolean;
  score: number;
  total: number;
  quizPassed: boolean;
  tokenFitPassed: boolean;
  tokenFitScore: number;
  tokenFitHighScore: number;
  completedAt: number;
  completedIso: string;
  gate: "observe";
  nextGate: "enter";
};

type ObserveProgressState = {
  stepIndex: number;
  openedCards: LearnCardId[];
  stillnessAccepted: boolean;
  answers: Record<string, number | null>;
  testSubmitted: boolean;
  tokenFitPassed: boolean;
  tokenFitScore: number;
  tokenFitHighScore: number;
};

const OBSERVE_STORAGE_KEY = "jal_observe_complete_v1";
const OBSERVE_PROGRESS_KEY = "jal_observe_progress_v1";
const PASS_MARK = 4;
const MIN_TOKEN_FIT_SCORE = 12;

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
    id: "test",
    label: "Test",
    note: "Confirm understanding before entry.",
  },
  {
    id: "token-fit",
    label: "Token Fit",
    note: "Prove control under movement.",
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
    contribution: "This matters because control must be understood before entry.",
  },
  {
    id: "custody",
    title: "Custody",
    body: [
      "Custody defines who carries responsibility for control.",
      "On an exchange, more of that burden sits with the platform.",
      "In self-custody, accuracy and responsibility move toward the user.",
    ],
    contribution: "This matters because responsibility changes with control.",
  },
  {
    id: "cex-dex",
    title: "CEX vs DEX",
    body: [
      "A centralised exchange gives a more guided entry path.",
      "A decentralised exchange is more direct and less forgiving.",
      "The difference is not hype. It is control, responsibility, and interaction style.",
    ],
    contribution: "This matters because entry conditions change across systems.",
  },
  {
    id: "solana",
    title: "Solana",
    body: [
      "Solana is a network that processes signed instructions.",
      "Transactions change account state on-chain.",
      "Speed lowers friction, but it can also increase the consequence of rushed action.",
    ],
    contribution: "This matters because network speed does not remove consequence.",
  },
];

const TEST_QUESTIONS: TestQuestion[] = [
  {
    id: "q1",
    prompt: "What is the purpose of Gate 01 — Observe?",
    options: [
      "To encourage quick market entry",
      "To stabilise understanding before action",
      "To help the user choose the best coin",
      "To complete the first transaction",
    ],
    correctIndex: 1,
  },
  {
    id: "q2",
    prompt: "What does a transaction represent in this system?",
    options: [
      "A harmless button press",
      "A marketing signal",
      "A signed instruction that can change state",
      "A reversible test action",
    ],
    correctIndex: 2,
  },
  {
    id: "q3",
    prompt: "What is the key difference between CEX and DEX in this context?",
    options: [
      "One is always profitable and the other is not",
      "One is guided while the other requires more direct responsibility",
      "One has wallets and the other does not",
      "There is no meaningful difference",
    ],
    correctIndex: 1,
  },
  {
    id: "q4",
    prompt: "Why is stillness required before Gate 02?",
    options: [
      "Because delays make trading more exciting",
      "Because urgency improves accuracy",
      "Because entry should begin from calm understanding, not pressure",
      "Because the system wants fewer users",
    ],
    correctIndex: 2,
  },
];

const DEFAULT_ANSWERS: Record<string, number | null> = {
  q1: null,
  q2: null,
  q3: null,
  q4: null,
};

function readProgress(): ObserveProgressState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(OBSERVE_PROGRESS_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<ObserveProgressState>;

    const safeStepIndex =
      typeof parsed.stepIndex === "number" &&
      parsed.stepIndex >= 0 &&
      parsed.stepIndex < OBSERVE_STEPS.length
        ? parsed.stepIndex
        : 0;

    const validCardIds = new Set<LearnCardId>(LEARN_CARDS.map((card) => card.id));
    const safeOpenedCards = Array.isArray(parsed.openedCards)
      ? parsed.openedCards.filter((id): id is LearnCardId => validCardIds.has(id as LearnCardId))
      : [];

    const safeAnswers =
      parsed.answers && typeof parsed.answers === "object"
        ? {
            q1:
              typeof parsed.answers.q1 === "number" || parsed.answers.q1 === null
                ? parsed.answers.q1
                : null,
            q2:
              typeof parsed.answers.q2 === "number" || parsed.answers.q2 === null
                ? parsed.answers.q2
                : null,
            q3:
              typeof parsed.answers.q3 === "number" || parsed.answers.q3 === null
                ? parsed.answers.q3
                : null,
            q4:
              typeof parsed.answers.q4 === "number" || parsed.answers.q4 === null
                ? parsed.answers.q4
                : null,
          }
        : DEFAULT_ANSWERS;

    return {
      stepIndex: safeStepIndex,
      openedCards: safeOpenedCards,
      stillnessAccepted: Boolean(parsed.stillnessAccepted),
      answers: safeAnswers,
      testSubmitted: Boolean(parsed.testSubmitted),
      tokenFitPassed: Boolean(parsed.tokenFitPassed),
      tokenFitScore:
        typeof parsed.tokenFitScore === "number" ? parsed.tokenFitScore : 0,
      tokenFitHighScore:
        typeof parsed.tokenFitHighScore === "number" ? parsed.tokenFitHighScore : 0,
    };
  } catch {
    return null;
  }
}

function readCompletedAccess(): ObserveAccessState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(OBSERVE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ObserveAccessState;
    return parsed?.passed ? parsed : null;
  } catch {
    return null;
  }
}

export default function JalSolObserve() {
  const navigate = useNavigate();
  const timerRef = useRef<number | null>(null);
  const stepDelayRef = useRef<number | null>(null);

  const [restoredProgress] = useState<ObserveProgressState | null>(() => readProgress());
  const [completedAccess] = useState<ObserveAccessState | null>(() => readCompletedAccess());
  const observerStepIndex = OBSERVE_STEPS.findIndex((step) => step.id === "observer");

  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(() => {
    if (completedAccess?.passed) return observerStepIndex;
    return restoredProgress?.stepIndex ?? 0;
  });
  const [canContinue, setCanContinue] = useState(false);
  const [openedCards, setOpenedCards] = useState<LearnCardId[]>(
    restoredProgress?.openedCards ?? []
  );
  const [stillnessAccepted, setStillnessAccepted] = useState(
    restoredProgress?.stillnessAccepted ?? false
  );
  const [answers, setAnswers] = useState<Record<string, number | null>>(
    restoredProgress?.answers ?? DEFAULT_ANSWERS
  );
  const [testSubmitted, setTestSubmitted] = useState(
    completedAccess?.quizPassed ?? restoredProgress?.testSubmitted ?? false
  );
  const [tokenFitPassed, setTokenFitPassed] = useState(
    completedAccess?.tokenFitPassed ?? restoredProgress?.tokenFitPassed ?? false
  );
  const [tokenFitScore, setTokenFitScore] = useState(
    completedAccess?.tokenFitScore ?? restoredProgress?.tokenFitScore ?? 0
  );
  const [tokenFitHighScore, setTokenFitHighScore] = useState(
    completedAccess?.tokenFitHighScore ?? restoredProgress?.tokenFitHighScore ?? 0
  );

  const currentStep = OBSERVE_STEPS[stepIndex];
  const isLastStep = stepIndex === OBSERVE_STEPS.length - 1;
  const structureComplete = openedCards.length === LEARN_CARDS.length;
  const useCompactHeader = stepIndex > 0;

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (stepDelayRef.current) window.clearTimeout(stepDelayRef.current);
      document.body.style.pointerEvents = "";
    };
  }, []);

useEffect(() => {
  if (typeof window === "undefined") return;
  if (completedAccess?.passed) return;

  const progress: ObserveProgressState = {
    stepIndex,
    openedCards,
    stillnessAccepted,
    answers,
    testSubmitted,
    tokenFitPassed,
    tokenFitScore,
    tokenFitHighScore,
  };

  window.localStorage.setItem(OBSERVE_PROGRESS_KEY, JSON.stringify(progress));
}, [
  completedAccess?.passed,
  stepIndex,
  openedCards,
  stillnessAccepted,
  answers,
  testSubmitted,
  tokenFitPassed,
  tokenFitScore,
  tokenFitHighScore,
]);

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
        : currentStep.id === "test"
        ? 800
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

  function openCard(cardId: LearnCardId) {
    setOpenedCards((prev) => (prev.includes(cardId) ? prev : [...prev, cardId]));
  }

  function selectAnswer(questionId: string, optionIndex: number) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));

    if (testSubmitted) {
      setTestSubmitted(false);
    }
  }

  function submitTest() {
    if (!allQuestionsAnswered) return;
    setTestSubmitted(true);
  }

  const testScore = useMemo(() => {
    return TEST_QUESTIONS.reduce((total, question) => {
      return total + (answers[question.id] === question.correctIndex ? 1 : 0);
    }, 0);
  }, [answers]);

  const testPassed = testSubmitted && testScore >= PASS_MARK;
  const allQuestionsAnswered = TEST_QUESTIONS.every(
    (question) => answers[question.id] !== null
  );

  const nextDisabled = useMemo(() => {
    if (!canContinue) return true;
    if (currentStep.id === "structure" && !structureComplete) return true;
    if (currentStep.id === "stillness" && !stillnessAccepted) return true;
    if (currentStep.id === "test" && !testPassed) return true;
    if (currentStep.id === "token-fit" && !tokenFitPassed) return true;
    return false;
  }, [
    canContinue,
    currentStep.id,
    structureComplete,
    stillnessAccepted,
    testPassed,
    tokenFitPassed,
  ]);

function handleNext() {
  if (loading || nextDisabled) return;

  if (isLastStep) {
    const alreadyPassed = Boolean(completedAccess?.passed);
    const quizPassedNow = alreadyPassed || testScore >= PASS_MARK;
    const tokenFitPassedNow = alreadyPassed || tokenFitPassed;
    const passed = quizPassedNow && tokenFitPassedNow;

    const payload: ObserveAccessState = {
      passed,
      score: alreadyPassed ? completedAccess?.score ?? testScore : testScore,
      total: TEST_QUESTIONS.length,
      quizPassed: quizPassedNow,
      tokenFitPassed: tokenFitPassedNow,
      tokenFitScore: alreadyPassed
        ? completedAccess?.tokenFitScore ?? tokenFitScore
        : tokenFitScore,
      tokenFitHighScore: alreadyPassed
        ? completedAccess?.tokenFitHighScore ?? tokenFitHighScore
        : tokenFitHighScore,
      completedAt: alreadyPassed
        ? completedAccess?.completedAt ?? Date.now()
        : Date.now(),
      completedIso: alreadyPassed
        ? completedAccess?.completedIso ?? new Date().toISOString()
        : new Date().toISOString(),
      gate: "observe",
      nextGate: "enter",
    };

    localStorage.setItem(OBSERVE_STORAGE_KEY, JSON.stringify(payload));

    if (passed) {
      localStorage.removeItem(OBSERVE_PROGRESS_KEY);
      beginRoute("/app/jal-sol/enter");
    }

    return;
  }

  setStepIndex((prev) => Math.min(prev + 1, OBSERVE_STEPS.length - 1));
}

  const progressText = `${stepIndex + 1} / ${OBSERVE_STEPS.length}`;

  const frameContribution =
    currentStep.id === "orientation"
      ? "Contribution to Gate 02: removes pressure before action."
      : currentStep.id === "filter"
      ? "Contribution to Gate 02: rejects unstable entry models."
      : currentStep.id === "truth"
      ? "Contribution to Gate 02: replaces hype with correct framing."
      : currentStep.id === "structure"
      ? "Contribution to Gate 02: confirms primitive contact before action."
      : currentStep.id === "transaction"
      ? "Contribution to Gate 02: confirms that signing changes state."
      : currentStep.id === "stillness"
      ? "Contribution to Gate 02: confirms calm before irreversible movement."
      : currentStep.id === "test"
      ? "Contribution to Gate 02: confirms understanding before entry."
      : currentStep.id === "token-fit"
      ? "Contribution to Gate 02: confirms control under movement."
      : "Contribution to Gate 02: observer state established.";

  return (
    <main
      className={`home-shell jal-shell jal-ground-page ${loading ? "is-fading" : ""}`}
      aria-label="JAL/SOL Observe Gate"
    >
      <div className="home-wrap">
        <section className="card machine-surface panel-frame jal-window">
          <section
            className={`jal-hero jal-world-hero ${useCompactHeader ? "jal-observe-hero--compact" : ""}`}
            aria-label="Observe gate hero"
          >
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

              {!useCompactHeader ? (
                <>
                  <p className="home-lead">
                    This gate is not for action. It is for stabilisation. The user is slowed down,
                    misinformation is removed, and the environment becomes understandable before any
                    irreversible step is introduced.
                  </p>

                  <p className="jal-sublead">
                    The goal is simple: turn an unaware visitor into an informed observer. No hype.
                    No pressure. No “buy now” behaviour.
                  </p>
                </>
              ) : (
                <p className="jal-sublead">
                  {currentStep.label} active. Gate 01 is still conditioning the user before Entry.
                </p>
              )}
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

                <p className="jal-lock-text">This is preparation, not participation.</p>

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
                    <span className="jal-step-sub">Noise is not structure.</span>
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
                            <p className="jal-lock-text">{card.contribution}</p>
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

            {currentStep.id === "test" && (
              <>
                <div className="jal-bay-head">
                  <div className="jal-bay-title">Observe comprehension test</div>
                  <div className="jal-bay-note">
                    {testSubmitted
                      ? `${testScore} / ${TEST_QUESTIONS.length}`
                      : "Required before Gate 02"}
                  </div>
                </div>

                <p className="jal-note">
                  This final step checks whether the user understood the system they are about to
                  enter. Gate 02 should not open from scrolling alone.
                </p>

                <div className="jal-steps">
                  {TEST_QUESTIONS.map((question) => {
                    const selected = answers[question.id];

                    return (
                      <div key={question.id}>
                        <strong>{question.prompt}</strong>

                        <div
                          className="jal-bay-actions"
                          style={{ marginTop: "0.85rem", flexWrap: "wrap" }}
                        >
                          {question.options.map((option, index) => {
                            const isSelected = selected === index;
                            const buttonClass = isSelected ? "button gold" : "button ghost";

                            return (
                              <button
                                key={`${question.id}-${index}`}
                                type="button"
                                className={buttonClass}
                                onClick={() => selectAnswer(question.id, index)}
                                disabled={loading}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="jal-bay-actions" style={{ marginTop: "1rem" }}>
                  <button
                    type="button"
                    className="button neon"
                    onClick={submitTest}
                    disabled={loading || !allQuestionsAnswered}
                  >
                    Submit Test
                  </button>
                </div>

                {testSubmitted && (
                  <p className="jal-lock-text" style={{ marginTop: "1rem" }}>
                    {testPassed
                      ? `Pass confirmed. You scored ${testScore}/${TEST_QUESTIONS.length}. Continue to Token Fit to complete Gate 01.`
                      : `Test not passed. You scored ${testScore}/${TEST_QUESTIONS.length}. Review the Observe sequence and try again.`}
                  </p>
                )}
              </>
            )}

            {currentStep.id === "token-fit" && (
              <>
                <div className="jal-bay-head">
                  <div className="jal-bay-title">JAL’s Trials ~ Token Fit</div>
                  <div className="jal-bay-note">
                    {tokenFitPassed
                      ? `Passed · ${tokenFitScore} score`
                      : `Minimum required: ${MIN_TOKEN_FIT_SCORE}`}
                  </div>
                </div>

                <p className="jal-note">
                  This trial checks controlled movement, not just understanding. Reach the minimum
                  score to unlock the final Observe state and continue toward Gate 02.
                </p>

                <TokenFitGame
                  minScore={MIN_TOKEN_FIT_SCORE}
                  onPass={(score, highScore) => {
                    setTokenFitPassed(true);
                    setTokenFitScore(score);
                    setTokenFitHighScore(highScore);
                  }}
                  onGameOver={(score, highScore) => {
                    setTokenFitScore(score);
                    setTokenFitHighScore(highScore);
                  }}
                  onLeaveAfterPass={() => {
                    setStepIndex(observerStepIndex);
                    window.scrollTo({ top: 0, behavior: "auto" });
                  }}
                />

                <p className="jal-lock-text" style={{ marginTop: "1rem" }}>
                  {tokenFitPassed
                    ? `Trial passed. Score: ${tokenFitScore}. High Score: ${tokenFitHighScore}.`
                    : "Gate 02 remains locked until this trial is passed."}
                </p>
              </>
            )}

            {currentStep.id === "observer" && (
              <>
                <div className="jal-bay-head">
                  <div className="jal-bay-title">Observer state confirmed</div>
                  <div className="jal-bay-note">State change</div>
                </div>

                <p className="jal-note">
                  The user has now completed the Observe sequence, passed the comprehension test,
                  and passed Token Fit. Gate 02 can open because the next movement is being entered
                  with structure and control, not guesswork.
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
                      Informed observer with tested understanding and proven control.
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

            <div className="jal-bay-actions" style={{ marginTop: "1rem" }}>
              <div className="jal-lock-text">{frameContribution}</div>
            </div>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="Observe controls">
            <div className="jal-bay-head">
              <div className="jal-bay-title">Sequence Controls</div>
              <div className="jal-bay-note">Gate 01 progression</div>
            </div>

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