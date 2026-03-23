import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type RouteTo =
  | "/app/home"
  | "/app/jal-sol"
  | "/app/jal-sol/observe"
  | "/app/jal-sol/enter"
  | "/app/jal-sol/build"
  | "/app/shop";

type GatePoint = {
  k: string;
  v: string;
};

type Gate2Stage =
  | "home"
  | "module-1-wallet"
  | "module-2-custody"
  | "module-3-finality"
  | "module-4-connection"
  | "module-5-action-path"
  | "module-6-verification"
  | "test"
  | "checklist"
  | "trial-brief"
  | "trial"
  | "wallet"
  | "transaction"
  | "verify"
  | "passed";

type Gate2ProgressState = {
  accessGranted: boolean;
  privateHomeSeen: boolean;
  currentStage: Gate2Stage;

  modulesCompleted: string[];
  acknowledgements: {
    wallet: boolean;
    custody: boolean;
    finality: boolean;
    connection: boolean;
    actionPath: boolean;
    verification: boolean;
  };

  test: {
    answers: Record<string, number | null>;
    submitted: boolean;
    score: number;
    passed: boolean;
  };

  checklist: {
    walletControlsAssets: boolean;
    transactionsMayBeIrreversible: boolean;
    custodyIsMyResponsibility: boolean;
    verifyBeforeSigning: boolean;
    followGate2Order: boolean;
    completed: boolean;
  };

  trial: {
    unlocked: boolean;
    acknowledged: boolean;
    successfulRuns: number;
    bestScore: number;
    passed: boolean;
    endlessUnlocked: boolean;
  };

  wallet: {
    connected: boolean;
    address: string;
  };

  transaction: {
    initiated: boolean;
    signature: string;
    confirmed: boolean;
    explorerUrl: string;
  };

  completion: {
    enterPassed: boolean;
    participantState: boolean;
    completedAt: number | null;
  };
};

const OBSERVE_STORAGE_KEY = "jal_observe_complete_v1";
const GATE2_ACCESS_KEY = "gate2_access";
const GATE2_EMAIL_KEY = "gate2_email";
const GATE2_DISPLAY_NAME_KEY = "gate2_display_name";
const GATE2_PROGRESS_KEY = "gate2_progress";
const GATE2_ADMIN_BYPASS_KEY = "gate2_admin_bypass";

const ENTRY_RAIL: { id: Gate2Stage; title: string; note: string }[] = [
  {
    id: "module-1-wallet",
    title: "Learn — Wallet",
    note: "Understand that a wallet is a control point, not a decorative login.",
  },
  {
    id: "module-2-custody",
    title: "Learn — Custody",
    note: "Understand who carries responsibility for control and error.",
  },
  {
    id: "module-3-finality",
    title: "Learn — Finality",
    note: "Understand that transactions may be irreversible once signed and confirmed.",
  },
  {
    id: "module-4-connection",
    title: "Learn — Connection",
    note: "Understand what wallet connection and signing authority actually mean.",
  },
  {
    id: "module-5-action-path",
    title: "Learn — Action Path",
    note: "Understand what the first real transaction phase will require.",
  },
  {
    id: "module-6-verification",
    title: "Learn — Verification",
    note: "Understand how proof is shown and how confirmation is validated.",
  },
  {
    id: "test",
    title: "Comprehend",
    note: "Pass the comprehension test before procedural progression opens.",
  },
  {
    id: "checklist",
    title: "Checklist",
    note: "Confirm readiness and required order before the trial unlocks.",
  },
  {
    id: "trial-brief",
    title: "Trial Brief",
    note: "Read the rules and acknowledge the pressure simulation.",
  },
  {
    id: "trial",
    title: "Trial",
    note: "Pass the harder Token Fit threshold before wallet execution.",
  },
  {
    id: "wallet",
    title: "Wallet",
    note: "Connect a real wallet only after preparation and trial success.",
  },
  {
    id: "transaction",
    title: "Transaction",
    note: "Perform a fixed minimal SOL transfer as the first irreversible action.",
  },
  {
    id: "verify",
    title: "Verify",
    note: "Confirm transaction proof on-chain.",
  },
  {
    id: "passed",
    title: "Participant",
    note: "State change confirmed and Build path opened.",
  },
];

const PRIVATE_RULES: string[] = [
  "Complete every stage in order.",
  "No wallet connection before the trial phase.",
  "No skipping comprehension or readiness steps.",
  "No completion without real verification.",
  "The first real action must be intentional, reviewed, and confirmed.",
];

const PRIVATE_OUTCOMES: GatePoint[] = [
  {
    k: "Participant State",
    v: "You leave Gate 02 with proof of real movement, not just understanding.",
  },
  {
    k: "Endless Mode",
    v: "Post-pass score extension and continued trial competition unlock after completion.",
  },
  {
    k: "Leaderboard",
    v: "Display name continuity is preserved for verified progression and later rankings.",
  },
  {
    k: "Build Readiness",
    v: "Gate 03 opens as the next step: creation, ownership, token identity, and utility.",
  },
];

const DEFAULT_GATE2_PROGRESS: Gate2ProgressState = {
  accessGranted: false,
  privateHomeSeen: false,
  currentStage: "home",

  modulesCompleted: [],
  acknowledgements: {
    wallet: false,
    custody: false,
    finality: false,
    connection: false,
    actionPath: false,
    verification: false,
  },

  test: {
    answers: {},
    submitted: false,
    score: 0,
    passed: false,
  },

  checklist: {
    walletControlsAssets: false,
    transactionsMayBeIrreversible: false,
    custodyIsMyResponsibility: false,
    verifyBeforeSigning: false,
    followGate2Order: false,
    completed: false,
  },

  trial: {
    unlocked: false,
    acknowledged: false,
    successfulRuns: 0,
    bestScore: 0,
    passed: false,
    endlessUnlocked: false,
  },

  wallet: {
    connected: false,
    address: "",
  },

  transaction: {
    initiated: false,
    signature: "",
    confirmed: false,
    explorerUrl: "",
  },

  completion: {
    enterPassed: false,
    participantState: false,
    completedAt: null,
  },
};

function readObservePassed(): boolean {
  try {
    const raw = localStorage.getItem(OBSERVE_STORAGE_KEY);
    if (!raw) return false;

    const parsed = JSON.parse(raw);
    return Boolean(parsed?.passed && parsed?.gate === "observe" && parsed?.nextGate === "enter");
  } catch {
    return false;
  }
}

function readGate2Access(): boolean {
  return localStorage.getItem(GATE2_ACCESS_KEY) === "true";
}

function readGate2AdminBypass(): boolean {
  return localStorage.getItem(GATE2_ADMIN_BYPASS_KEY) === "true";
}

function readGate2Progress(): Gate2ProgressState {
  try {
    const raw = localStorage.getItem(GATE2_PROGRESS_KEY);
    if (!raw) return DEFAULT_GATE2_PROGRESS;

    const parsed = JSON.parse(raw) as Partial<Gate2ProgressState>;

    return {
      accessGranted: Boolean(parsed.accessGranted),
      privateHomeSeen: Boolean(parsed.privateHomeSeen),
      currentStage:
        typeof parsed.currentStage === "string"
          ? (parsed.currentStage as Gate2Stage)
          : "home",

      modulesCompleted: Array.isArray(parsed.modulesCompleted)
        ? parsed.modulesCompleted.filter((item): item is string => typeof item === "string")
        : [],

      acknowledgements: {
        wallet: Boolean(parsed.acknowledgements?.wallet),
        custody: Boolean(parsed.acknowledgements?.custody),
        finality: Boolean(parsed.acknowledgements?.finality),
        connection: Boolean(parsed.acknowledgements?.connection),
        actionPath: Boolean(parsed.acknowledgements?.actionPath),
        verification: Boolean(parsed.acknowledgements?.verification),
      },

      test: {
        answers:
          parsed.test?.answers && typeof parsed.test.answers === "object"
            ? parsed.test.answers
            : {},
        submitted: Boolean(parsed.test?.submitted),
        score: typeof parsed.test?.score === "number" ? parsed.test.score : 0,
        passed: Boolean(parsed.test?.passed),
      },

      checklist: {
        walletControlsAssets: Boolean(parsed.checklist?.walletControlsAssets),
        transactionsMayBeIrreversible: Boolean(parsed.checklist?.transactionsMayBeIrreversible),
        custodyIsMyResponsibility: Boolean(parsed.checklist?.custodyIsMyResponsibility),
        verifyBeforeSigning: Boolean(parsed.checklist?.verifyBeforeSigning),
        followGate2Order: Boolean(parsed.checklist?.followGate2Order),
        completed: Boolean(parsed.checklist?.completed),
      },

      trial: {
        unlocked: Boolean(parsed.trial?.unlocked),
        acknowledged: Boolean(parsed.trial?.acknowledged),
        successfulRuns:
          typeof parsed.trial?.successfulRuns === "number" ? parsed.trial.successfulRuns : 0,
        bestScore: typeof parsed.trial?.bestScore === "number" ? parsed.trial.bestScore : 0,
        passed: Boolean(parsed.trial?.passed),
        endlessUnlocked: Boolean(parsed.trial?.endlessUnlocked),
      },

      wallet: {
        connected: Boolean(parsed.wallet?.connected),
        address: typeof parsed.wallet?.address === "string" ? parsed.wallet.address : "",
      },

      transaction: {
        initiated: Boolean(parsed.transaction?.initiated),
        signature:
          typeof parsed.transaction?.signature === "string" ? parsed.transaction.signature : "",
        confirmed: Boolean(parsed.transaction?.confirmed),
        explorerUrl:
          typeof parsed.transaction?.explorerUrl === "string"
            ? parsed.transaction.explorerUrl
            : "",
      },

      completion: {
        enterPassed: Boolean(parsed.completion?.enterPassed),
        participantState: Boolean(parsed.completion?.participantState),
        completedAt:
          typeof parsed.completion?.completedAt === "number"
            ? parsed.completion.completedAt
            : null,
      },
    };
  } catch {
    return DEFAULT_GATE2_PROGRESS;
  }
}

function writeGate2Progress(progress: Gate2ProgressState) {
  localStorage.setItem(GATE2_PROGRESS_KEY, JSON.stringify(progress));
}

function ensureGate2ProgressExists() {
  const raw = localStorage.getItem(GATE2_PROGRESS_KEY);
  if (raw) return;
  writeGate2Progress(DEFAULT_GATE2_PROGRESS);
}

function writeGate2Bootstrap(email: string, displayName: string) {
  localStorage.setItem(GATE2_ACCESS_KEY, "true");
  localStorage.setItem(GATE2_EMAIL_KEY, email.trim());
  localStorage.setItem(GATE2_DISPLAY_NAME_KEY, displayName.trim());

  const current = readGate2Progress();

  writeGate2Progress({
    ...current,
    accessGranted: true,
    privateHomeSeen: true,
    currentStage: current.currentStage || "home",
  });
}

export default function JalSolEnter() {
  const navigate = useNavigate();
  const timerRef = useRef<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [observePassed, setObservePassed] = useState(false);
  const [gate2Access, setGate2Access] = useState(false);
  const [adminBypass, setAdminBypass] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [formError, setFormError] = useState("");
  const [progress, setProgress] = useState<Gate2ProgressState>(DEFAULT_GATE2_PROGRESS);

  useEffect(() => {
    const observe = readObservePassed();
    const access = readGate2Access();
    const bypass = readGate2AdminBypass();
    const savedEmail = localStorage.getItem(GATE2_EMAIL_KEY) ?? "";
    const savedDisplay = localStorage.getItem(GATE2_DISPLAY_NAME_KEY) ?? "";

    if (bypass) {
      ensureGate2ProgressExists();
    }

    setObservePassed(observe);
    setGate2Access(access);
    setAdminBypass(bypass);
    setProgress(readGate2Progress());
    setEmail(savedEmail);
    setDisplayName(savedDisplay);
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

  function updateProgress(patch: Partial<Gate2ProgressState>) {
    setProgress((prev) => {
      const next = { ...prev, ...patch };
      writeGate2Progress(next);
      return next;
    });
  }

  function updateAcknowledgements(
    patch: Partial<Gate2ProgressState["acknowledgements"]>
  ) {
    setProgress((prev) => {
      const next = {
        ...prev,
        acknowledgements: {
          ...prev.acknowledgements,
          ...patch,
        },
      };
      writeGate2Progress(next);
      return next;
    });
  }

  function markModuleCompleted(moduleId: string) {
    setProgress((prev) => {
      const already = prev.modulesCompleted.includes(moduleId);
      const next = {
        ...prev,
        modulesCompleted: already
          ? prev.modulesCompleted
          : [...prev.modulesCompleted, moduleId],
      };
      writeGate2Progress(next);
      return next;
    });
  }

  function goToStage(stage: Gate2Stage) {
    setProgress((prev) => {
      const next = {
        ...prev,
        currentStage: stage,
      };
      writeGate2Progress(next);
      return next;
    });
  }

  function handleDevUnlock() {
    if ((!observePassed && !adminBypass) || loading) return;

    const cleanEmail = email.trim();
    const cleanDisplayName = displayName.trim();

    if (!cleanEmail || !cleanDisplayName) {
      setFormError("Email and display name are required before Gate 02 can be unlocked.");
      return;
    }

    writeGate2Bootstrap(cleanEmail, cleanDisplayName);
    setGate2Access(true);
    setProgress(readGate2Progress());
    setFormError("");
  }

  function handleBeginSequence() {
    if (loading) return;

    const nextStage: Gate2Stage =
      progress.currentStage && progress.currentStage !== "home"
        ? progress.currentStage
        : "module-1-wallet";

    updateProgress({
      accessGranted: true,
      privateHomeSeen: true,
      currentStage: nextStage,
    });
  }

  function handleReturnToGateHome() {
    if (loading) return;
    goToStage("home");
  }

  function handleWalletModuleContinue() {
    if (!progress.acknowledgements.wallet || loading) return;

    markModuleCompleted("module-1-wallet");
    goToStage("module-2-custody");
  }

  const canEnterGate2 = adminBypass || (observePassed && gate2Access);
  const needsPublicUnlock = !adminBypass && observePassed && !gate2Access;

  const accessLabel = adminBypass
    ? "Private Admin Access"
    : observePassed
    ? gate2Access
      ? progress.currentStage === "home"
        ? "Entry Sequence Ready"
        : "Sequence Active"
      : "Ready To Enter"
    : "Locked — Observe Required";

  const currentStage = progress.currentStage;
  const walletAckChecked = progress.acknowledgements.wallet;

  return (
    <main
      className={`home-shell jal-shell jal-ground-page ${loading ? "is-fading" : ""}`}
      aria-label="JAL/SOL Gate 02 Enter"
    >
      <div className="home-wrap">
        <section className="card machine-surface panel-frame jal-window">
          <section className="jal-hero jal-world-hero" aria-label="Enter gate hero">
            <div className="jal-hero-top">
              <div className="jal-kicker">JAL/SOL • GATE 02</div>

              <div className="jal-status" aria-label="Gate 02 state">
                <span className="jal-status-dot" />
                <span className="jal-status-text">{accessLabel}</span>
              </div>
            </div>

            <div className="jal-hero-center">
              <p className="jal-world-pretitle">Participation gate</p>

              <h1 className="home-title">
                You are now
                <br />
                entering movement.
              </h1>

              <p className="home-lead">
                Gate 02 is the threshold where understanding must become correct action. This is
                the first irreversible layer in JAL/SOL. The user stops observing from a safe
                distance and begins preparing for real participation.
              </p>

              <p className="jal-sublead">
                This gate is not about speed or hype. It is about sequence, control, proof, and the
                first verified movement that changes system state.
              </p>
            </div>

            <div className="jal-arrival-note" aria-label="Enter principles">
              <span>CONTROLLED ENTRY</span>
              <span>UNDERSTANDING → CONTROL → EXECUTION</span>
              <span>PARTICIPATION BEGINS WITH VERIFIED MOVEMENT</span>
            </div>

            <div className="jal-links">
              {!canEnterGate2 && !observePassed ? (
                <button
                  type="button"
                  className="button gold"
                  onClick={() => beginRoute("/app/jal-sol/observe")}
                  disabled={loading}
                >
                  Go To Observe
                </button>
              ) : needsPublicUnlock ? (
                <button
                  type="button"
                  className="button gold"
                  onClick={handleDevUnlock}
                  disabled={loading}
                >
                  Begin Entry
                </button>
              ) : currentStage === "home" ? (
                <button
                  type="button"
                  className="button gold"
                  onClick={handleBeginSequence}
                  disabled={loading}
                >
                  Enter Gate 02
                </button>
              ) : (
                <button
                  type="button"
                  className="button gold"
                  onClick={handleReturnToGateHome}
                  disabled={loading}
                >
                  Return To Gate 02 Home
                </button>
              )}

              <button
                type="button"
                className="button ghost"
                onClick={() => beginRoute("/app/jal-sol/observe")}
                disabled={loading}
              >
                Return To Observe
              </button>

              <button
                type="button"
                className="button ghost"
                onClick={() => beginRoute("/app/jal-sol")}
                disabled={loading}
              >
                Return To World Hub
              </button>
            </div>
          </section>

          {!adminBypass && !observePassed && (
            <section className="jal-bay jal-bay-wide" aria-label="Gate blocked">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Gate 02 Locked</div>
                <div className="jal-bay-note">Observe required first</div>
              </div>

              <p className="jal-note">
                Gate 02 requires completion of Observe before controlled entry can begin. The
                system does not allow real participation to open before awareness has been
                established.
              </p>

              <div className="jal-bullets">
                <article className="jal-bullet">
                  <div className="jal-bullet-k">Requirement</div>
                  <div className="jal-bullet-v">Observe must be completed first.</div>
                </article>

                <article className="jal-bullet">
                  <div className="jal-bullet-k">Reason</div>
                  <div className="jal-bullet-v">
                    Entry without understanding creates avoidable error and weakens system trust.
                  </div>
                </article>

                <article className="jal-bullet">
                  <div className="jal-bullet-k">Path</div>
                  <div className="jal-bullet-v">
                    Complete Observe, return here, then unlock Gate 02 access.
                  </div>
                </article>
              </div>

              <div className="jal-bay-actions">
                <button
                  type="button"
                  className="button gold"
                  onClick={() => beginRoute("/app/jal-sol/observe")}
                  disabled={loading}
                >
                  Go To Observe
                </button>

                <button
                  type="button"
                  className="button ghost"
                  onClick={() => beginRoute("/app/jal-sol")}
                  disabled={loading}
                >
                  Return To World Hub
                </button>
              </div>
            </section>
          )}

          {needsPublicUnlock && (
            <>
              <section className="jal-bay jal-bay-wide" aria-label="Observe complete handoff">
                <div className="jal-bay-head">
                  <div className="jal-bay-title">Observe Complete</div>
                  <div className="jal-bay-note">You may now enter</div>
                </div>

                <p className="jal-note">
                  You completed Gate 01 correctly. You now move from understanding into controlled
                  participation.
                </p>

                <p className="jal-lock-text">
                  This next gate will require preparation, validation, and a real irreversible
                  action.
                </p>
              </section>

              <section className="jal-bay jal-bay-wide" aria-label="Begin entry">
                <div className="jal-bay-head">
                  <div className="jal-bay-title">Begin Entry</div>
                  <div className="jal-bay-note">Identity required</div>
                </div>

                <p className="jal-note">
                  This step creates your Gate 02 progression identity. It is required before the
                  private sequence can open.
                </p>

                <div className="jal-grid" aria-label="Gate 02 access bootstrap">
                  <section className="jal-bay">
                    <div className="jal-bay-head">
                      <div className="jal-bay-title">Access Bootstrap</div>
                      <div className="jal-bay-note">Dev mode identity</div>
                    </div>

                    <label className="jal-field">
                      <span className="jal-field-label">Email</span>
                      <input
                        className="jal-input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                      />
                    </label>

                    <label className="jal-field">
                      <span className="jal-field-label">Display name</span>
                      <input
                        className="jal-input"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="How you appear in Gate 02"
                        autoComplete="nickname"
                      />
                    </label>

                    {formError ? <p className="jal-error-text">{formError}</p> : null}

                    <p className="jal-lock-text">
                      This display name becomes the visible identity for progression continuity and
                      later leaderboard placement.
                    </p>

                    <div className="jal-bay-actions">
                      <button
                        type="button"
                        className="button gold"
                        onClick={handleDevUnlock}
                        disabled={loading}
                      >
                        Begin Entry
                      </button>
                    </div>
                  </section>

                  <section className="jal-bay">
                    <div className="jal-bay-head">
                      <div className="jal-bay-title">Entry Condition</div>
                      <div className="jal-bay-note">Locked by intent</div>
                    </div>

                    <p className="jal-note">
                      Gate 02 is not open by default. Even in development mode, entry should still
                      feel intentional and controlled.
                    </p>

                    <div className="jal-bullets">
                      <article className="jal-bullet">
                        <div className="jal-bullet-k">Observe Complete</div>
                        <div className="jal-bullet-v">
                          Awareness is already established before entry begins.
                        </div>
                      </article>

                      <article className="jal-bullet">
                        <div className="jal-bullet-k">Identity Required</div>
                        <div className="jal-bullet-v">
                          Email and display name are used to preserve continuity inside Gate 02.
                        </div>
                      </article>

                      <article className="jal-bullet">
                        <div className="jal-bullet-k">Next</div>
                        <div className="jal-bullet-v">
                          After entry is created, the private Gate 02 sequence becomes available.
                        </div>
                      </article>
                    </div>
                  </section>
                </div>
              </section>
            </>
          )}

          {canEnterGate2 && currentStage === "home" && (
            <>
              <section className="jal-bay jal-bay-wide" aria-label="Private Gate 02 home">
                <div className="jal-bay-head">
                  <div className="jal-bay-title">Gate 02 Private Workspace</div>
                  <div className="jal-bay-note">
                    {adminBypass ? "Private bypass active" : "Controlled progression environment"}
                  </div>
                </div>

                <p className="jal-note">
                  Gate 02 access is active. This is now the internal progression environment. From
                  here onward, the user is no longer being sold the gate. They are being processed
                  through it.
                </p>

                <div className="jal-bullets">
                  <article className="jal-bullet">
                    <div className="jal-bullet-k">Identity</div>
                    <div className="jal-bullet-v">
                      {displayName || (adminBypass ? "Private admin" : "Unnamed entrant")}
                    </div>
                  </article>

                  <article className="jal-bullet">
                    <div className="jal-bullet-k">Access</div>
                    <div className="jal-bullet-v">
                      {adminBypass
                        ? "Admin bypass active on this browser."
                        : "Gate 02 unlocked in development mode."}
                    </div>
                  </article>

                  <article className="jal-bullet">
                    <div className="jal-bullet-k">Stage</div>
                    <div className="jal-bullet-v">Home</div>
                  </article>
                </div>
              </section>

              <section className="jal-bay jal-bay-wide" aria-label="Before you proceed">
                <div className="jal-bay-head">
                  <div className="jal-bay-title">Before You Proceed</div>
                  <div className="jal-bay-note">Irreversible layer</div>
                </div>

                <p className="jal-note">
                  The next sequence leads toward a real wallet interaction and a real transaction.
                </p>

                <p className="jal-lock-text">
                  Transactions are not decorative. Entry must be intentional.
                </p>
              </section>

              <section className="jal-grid" aria-label="Private rules and outcomes">
                <section className="jal-bay">
                  <div className="jal-bay-head">
                    <div className="jal-bay-title">Rules And Requirements</div>
                    <div className="jal-bay-note">Strict path enforcement</div>
                  </div>

                  <p className="jal-note">
                    Gate 02 only works if sequence integrity is preserved. The user must not be
                    allowed to bypass early preparation and jump straight to real wallet friction.
                  </p>

                  <div className="jal-steps">
                    {PRIVATE_RULES.map((rule, index) => (
                      <div key={`${rule}-${index}`}>
                        <strong>{index + 1}.</strong>
                        <span className="jal-step-sub">{rule}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="jal-bay">
                  <div className="jal-bay-head">
                    <div className="jal-bay-title">What Unlocks After Pass</div>
                    <div className="jal-bay-note">Post-verification outcomes</div>
                  </div>

                  <p className="jal-note">
                    The point of Gate 02 is not only to complete a sequence. It is to leave the
                    user with a changed relationship to the system and a prepared transition toward
                    Build.
                  </p>

                  <div className="jal-bullets">
                    {PRIVATE_OUTCOMES.map((point) => (
                      <article key={point.k} className="jal-bullet">
                        <div className="jal-bullet-k">{point.k}</div>
                        <div className="jal-bullet-v">{point.v}</div>
                      </article>
                    ))}
                  </div>
                </section>
              </section>

              <section className="jal-bay jal-bay-wide" aria-label="Full progression preview">
                <div className="jal-bay-head">
                  <div className="jal-bay-title">Full Progression Preview</div>
                  <div className="jal-bay-note">One active stage at a time</div>
                </div>

                <p className="jal-note">
                  The private Gate 02 sequence must unfold one stage at a time. The full path is
                  visible here for orientation, but no stage should open ahead of the one currently
                  being processed.
                </p>

                <div className="jal-steps">
                  {ENTRY_RAIL.map((step) => (
                    <div key={`private-${step.id}`}>
                      <strong>{step.title}</strong>
                      <span className="jal-step-sub">{step.note}</span>
                    </div>
                  ))}
                </div>

                <div className="jal-bay-actions">
                  <button
                    type="button"
                    className="button gold"
                    onClick={handleBeginSequence}
                    disabled={loading}
                  >
                    Enter Gate 02
                  </button>

                  <button
                    type="button"
                    className="button ghost"
                    onClick={() => beginRoute("/app/jal-sol/build")}
                    disabled={loading}
                  >
                    View Build Gate
                  </button>

                  <button
                    type="button"
                    className="button ghost"
                    onClick={() => beginRoute("/app/jal-sol")}
                    disabled={loading}
                  >
                    Return To World Hub
                  </button>
                </div>
              </section>
            </>
          )}

          {canEnterGate2 && currentStage === "module-1-wallet" && (
            <>
              <section className="jal-bay jal-bay-wide" aria-label="Module 1 wallet">
                <div className="jal-bay-head">
                  <div className="jal-bay-title">Module 1 — Wallet</div>
                  <div className="jal-bay-note">Control point</div>
                </div>

                <p className="jal-note">
                  A wallet is not decoration and it is not only a login. Inside Gate 02, the wallet
                  is the point of control that gives authority to sign real actions.
                </p>

                <div className="jal-grid" aria-label="Wallet module structure">
                  <section className="jal-bay">
                    <div className="jal-bay-head">
                      <div className="jal-bay-title">What this means</div>
                      <div className="jal-bay-note">Definition</div>
                    </div>

                    <p className="jal-note">
                      The wallet is where the user moves from observation toward authority. Once a
                      wallet is connected and used, actions stop being theoretical.
                    </p>

                    <p className="jal-lock-text">
                      A wallet controls access and signing authority.
                    </p>
                  </section>

                  <section className="jal-bay">
                    <div className="jal-bay-head">
                      <div className="jal-bay-title">What you must do</div>
                      <div className="jal-bay-note">Requirement</div>
                    </div>

                    <p className="jal-note">
                      Understand that wallet connection is not a cosmetic step. It prepares the user
                      to approve real instructions that can affect assets and state.
                    </p>

                    <p className="jal-lock-text">
                      Connection is the threshold between explanation and consequence.
                    </p>
                  </section>
                </div>

                <section className="jal-bay jal-bay-wide" aria-label="Wallet risk">
                  <div className="jal-bay-head">
                    <div className="jal-bay-title">What can go wrong</div>
                    <div className="jal-bay-note">Risk</div>
                  </div>

                  <p className="jal-note">
                    If the user treats wallet connection like a harmless login, they may approve an
                    action without understanding what they are authorising.
                  </p>

                  <p className="jal-lock-text">
                    Gate 02 exists to stop that kind of careless movement before it happens.
                  </p>
                </section>

                <section className="jal-bay jal-bay-wide" aria-label="Wallet acknowledgement">
                  <div className="jal-bay-head">
                    <div className="jal-bay-title">Required acknowledgement</div>
                    <div className="jal-bay-note">Must confirm</div>
                  </div>

                  <label className="jal-check">
                    <input
                      type="checkbox"
                      checked={walletAckChecked}
                      onChange={(e) =>
                        updateAcknowledgements({
                          wallet: e.target.checked,
                        })
                      }
                    />
                    <span>
                      I understand that a wallet controls access and signing authority.
                    </span>
                  </label>

                  <div className="jal-bay-actions">
                    <button
                      type="button"
                      className="button ghost"
                      onClick={handleReturnToGateHome}
                      disabled={loading}
                    >
                      Return To Gate 02 Home
                    </button>

                    <button
                      type="button"
                      className="button gold"
                      onClick={handleWalletModuleContinue}
                      disabled={loading || !walletAckChecked}
                    >
                      Continue
                    </button>
                  </div>
                </section>
              </section>
            </>
          )}

          {canEnterGate2 && currentStage === "module-2-custody" && (
            <section className="jal-bay jal-bay-wide" aria-label="Module 2 custody placeholder">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Module 2 — Custody</div>
                <div className="jal-bay-note">Next active stage</div>
              </div>

              <p className="jal-note">
                Module 1 is now complete and the sequence engine is working. The next step is to
                replace this stage with the full Custody module.
              </p>

              <div className="jal-bullets">
                <article className="jal-bullet">
                  <div className="jal-bullet-k">Previous</div>
                  <div className="jal-bullet-v">Module 1 — Wallet completed.</div>
                </article>

                <article className="jal-bullet">
                  <div className="jal-bullet-k">Current</div>
                  <div className="jal-bullet-v">Module 2 — Custody placeholder active.</div>
                </article>

                <article className="jal-bullet">
                  <div className="jal-bullet-k">Next Build</div>
                  <div className="jal-bullet-v">Write the full Custody module.</div>
                </article>
              </div>

              <div className="jal-bay-actions">
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => goToStage("module-1-wallet")}
                  disabled={loading}
                >
                  Return To Module 1
                </button>

                <button
                  type="button"
                  className="button ghost"
                  onClick={handleReturnToGateHome}
                  disabled={loading}
                >
                  Return To Gate 02 Home
                </button>
              </div>
            </section>
          )}

          {canEnterGate2 &&
            currentStage !== "home" &&
            currentStage !== "module-1-wallet" &&
            currentStage !== "module-2-custody" && (
              <section className="jal-bay jal-bay-wide" aria-label="Gate 02 sequence workspace">
                <div className="jal-bay-head">
                  <div className="jal-bay-title">Gate 02 Sequence Active</div>
                  <div className="jal-bay-note">{currentStage.toUpperCase()}</div>
                </div>

                <p className="jal-note">
                  The private sequence is active. This stage has not been fully built yet.
                </p>

                <div className="jal-bullets">
                  <article className="jal-bullet">
                    <div className="jal-bullet-k">Current Stage</div>
                    <div className="jal-bullet-v">{currentStage}</div>
                  </article>

                  <article className="jal-bullet">
                    <div className="jal-bullet-k">Status</div>
                    <div className="jal-bullet-v">Sequence stage reserved</div>
                  </article>

                  <article className="jal-bullet">
                    <div className="jal-bullet-k">Next Build</div>
                    <div className="jal-bullet-v">Implement this stage directly.</div>
                  </article>
                </div>

                <div className="jal-bay-actions">
                  <button
                    type="button"
                    className="button ghost"
                    onClick={handleReturnToGateHome}
                    disabled={loading}
                  >
                    Return To Gate 02 Home
                  </button>
                </div>
              </section>
            )}
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