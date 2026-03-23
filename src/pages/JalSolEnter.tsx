import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type RouteTo =
  | "/app/home"
  | "/app/jal-sol"
  | "/app/jal-sol/observe"
  | "/app/jal-sol/enter"
  | "/app/jal-sol/build"
  | "/app/shop";

type RailStep = {
  id: string;
  title: string;
  note: string;
};

type GatePoint = {
  k: string;
  v: string;
};

type Gate2ProgressState = {
  accessGranted: boolean;
  privateHomeSeen: boolean;
  currentStage: string;
  modulesCompleted: number;
  comprehensionPassed: boolean;
  checklistPassed: boolean;
  trialPassed: boolean;
  walletConnected: boolean;
  transactionConfirmed: boolean;
  enterPassed: boolean;
  participantState: boolean;
};

const OBSERVE_STORAGE_KEY = "jal_observe_complete_v1";
const GATE2_ACCESS_KEY = "gate2_access";
const GATE2_EMAIL_KEY = "gate2_email";
const GATE2_DISPLAY_NAME_KEY = "gate2_display_name";
const GATE2_PROGRESS_KEY = "gate2_progress";
const GATE2_ADMIN_BYPASS_KEY = "gate2_admin_bypass";

const ENTRY_RAIL: RailStep[] = [
  {
    id: "learn",
    title: "Learn",
    note: "Understand wallets, custody, signing, transaction finality, and proof before movement.",
  },
  {
    id: "comprehend",
    title: "Comprehend",
    note: "Pass a short validation layer that confirms understanding before progression.",
  },
  {
    id: "checklist",
    title: "Checklist",
    note: "Acknowledge the procedural rules and confirm readiness in the correct order.",
  },
  {
    id: "trial",
    title: "Trial",
    note: "Pass the harder Token Fit threshold to prove control under pressure before consequence.",
  },
  {
    id: "wallet",
    title: "Wallet",
    note: "Connect a real wallet only after preparation and trial success.",
  },
  {
    id: "transaction",
    title: "Transaction",
    note: "Perform a first fixed minimal SOL movement as the irreversible action of entry.",
  },
  {
    id: "verify",
    title: "Verify",
    note: "Confirm the transaction on-chain with visible proof.",
  },
  {
    id: "participant",
    title: "Participant",
    note: "Cross into participant state and unlock the next layer toward Build.",
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

function readGate2Stage(): string {
  try {
    const raw = localStorage.getItem(GATE2_PROGRESS_KEY);
    if (!raw) return "home";

    const parsed = JSON.parse(raw);
    return typeof parsed?.currentStage === "string" ? parsed.currentStage : "home";
  } catch {
    return "home";
  }
}

function writeGate2Bootstrap(email: string, displayName: string) {
  localStorage.setItem(GATE2_ACCESS_KEY, "true");
  localStorage.setItem(GATE2_EMAIL_KEY, email.trim());
  localStorage.setItem(GATE2_DISPLAY_NAME_KEY, displayName.trim());

  const existingRaw = localStorage.getItem(GATE2_PROGRESS_KEY);

  if (existingRaw) {
    try {
      const existing = JSON.parse(existingRaw) as Partial<Gate2ProgressState>;
      localStorage.setItem(
        GATE2_PROGRESS_KEY,
        JSON.stringify({
          accessGranted: true,
          privateHomeSeen: true,
          currentStage:
            typeof existing.currentStage === "string" && existing.currentStage.length > 0
              ? existing.currentStage
              : "home",
          modulesCompleted:
            typeof existing.modulesCompleted === "number" ? existing.modulesCompleted : 0,
          comprehensionPassed: Boolean(existing.comprehensionPassed),
          checklistPassed: Boolean(existing.checklistPassed),
          trialPassed: Boolean(existing.trialPassed),
          walletConnected: Boolean(existing.walletConnected),
          transactionConfirmed: Boolean(existing.transactionConfirmed),
          enterPassed: Boolean(existing.enterPassed),
          participantState: Boolean(existing.participantState),
        })
      );
      return;
    } catch {
      // fall through
    }
  }

  localStorage.setItem(
    GATE2_PROGRESS_KEY,
    JSON.stringify({
      accessGranted: true,
      privateHomeSeen: true,
      currentStage: "home",
      modulesCompleted: 0,
      comprehensionPassed: false,
      checklistPassed: false,
      trialPassed: false,
      walletConnected: false,
      transactionConfirmed: false,
      enterPassed: false,
      participantState: false,
    } satisfies Gate2ProgressState)
  );
}

function ensureGate2ProgressExists() {
  const existingRaw = localStorage.getItem(GATE2_PROGRESS_KEY);
  if (existingRaw) return;

  localStorage.setItem(
    GATE2_PROGRESS_KEY,
    JSON.stringify({
      accessGranted: true,
      privateHomeSeen: true,
      currentStage: "home",
      modulesCompleted: 0,
      comprehensionPassed: false,
      checklistPassed: false,
      trialPassed: false,
      walletConnected: false,
      transactionConfirmed: false,
      enterPassed: false,
      participantState: false,
    } satisfies Gate2ProgressState)
  );
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
  const [currentStage, setCurrentStage] = useState("home");

  useEffect(() => {
    const observe = readObservePassed();
    const access = readGate2Access();
    const bypass = readGate2AdminBypass();

    setObservePassed(observe);
    setGate2Access(access);
    setAdminBypass(bypass);
    setCurrentStage(readGate2Stage());

    const savedEmail = localStorage.getItem(GATE2_EMAIL_KEY) ?? "";
    const savedDisplay = localStorage.getItem(GATE2_DISPLAY_NAME_KEY) ?? "";

    setEmail(savedEmail);
    setDisplayName(savedDisplay);

    if (bypass) {
      ensureGate2ProgressExists();
    }
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
    setCurrentStage("home");
    setFormError("");
  }

  function handleBeginSequence() {
    if (loading) return;

    const current = localStorage.getItem(GATE2_PROGRESS_KEY);
    const parsed = current ? JSON.parse(current) : {};

    const nextStage =
      parsed.currentStage && parsed.currentStage !== "home" ? parsed.currentStage : "modules";

    localStorage.setItem(
      GATE2_PROGRESS_KEY,
      JSON.stringify({
        ...parsed,
        accessGranted: true,
        privateHomeSeen: true,
        currentStage: nextStage,
      })
    );

    setCurrentStage(nextStage);
  }

  function handleReturnToGateHome() {
    if (loading) return;

    const current = localStorage.getItem(GATE2_PROGRESS_KEY);
    const parsed = current ? JSON.parse(current) : {};

    localStorage.setItem(
      GATE2_PROGRESS_KEY,
      JSON.stringify({
        ...parsed,
        currentStage: "home",
      })
    );

    setCurrentStage("home");
  }

  const canEnterGate2 = adminBypass || (observePassed && gate2Access);
  const needsPublicUnlock = !adminBypass && observePassed && !gate2Access;

  const accessLabel = adminBypass
    ? "Private Admin Access"
    : observePassed
    ? gate2Access
      ? "Entry Sequence Ready"
      : "Ready To Enter"
    : "Locked — Observe Required";

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
                      {adminBypass ? "Admin bypass active on this browser." : "Gate 02 unlocked in development mode."}
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

          {canEnterGate2 && currentStage !== "home" && (
            <section className="jal-bay jal-bay-wide" aria-label="Gate 02 sequence workspace">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Gate 02 Sequence Active</div>
                <div className="jal-bay-note">{currentStage.toUpperCase()}</div>
              </div>

              <p className="jal-note">
                The private sequence has started. The next build step is to replace this workspace
                with Module 1 — Wallet.
              </p>

              <div className="jal-bullets">
                <article className="jal-bullet">
                  <div className="jal-bullet-k">Current Stage</div>
                  <div className="jal-bullet-v">{currentStage}</div>
                </article>

                <article className="jal-bullet">
                  <div className="jal-bullet-k">Status</div>
                  <div className="jal-bullet-v">Private sequence active</div>
                </article>

                <article className="jal-bullet">
                  <div className="jal-bullet-k">Next Build</div>
                  <div className="jal-bullet-v">Module 1 — Wallet</div>
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