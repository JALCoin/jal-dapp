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

const OBSERVE_STORAGE_KEY = "jal_observe_complete_v1";
const GATE2_ACCESS_KEY = "gate2_access";
const GATE2_EMAIL_KEY = "gate2_email";
const GATE2_DISPLAY_NAME_KEY = "gate2_display_name";
const GATE2_PROGRESS_KEY = "gate2_progress";

const PUBLIC_POINTS: GatePoint[] = [
  {
    k: "Purpose",
    v: "Convert understanding into correct first participation.",
  },
  {
    k: "State Change",
    v: "Observer → Participant",
  },
  {
    k: "Proof",
    v: "Wallet connection + real transaction + verification.",
  },
];

const INCLUDED_POINTS: GatePoint[] = [
  {
    k: "Guided Preparation",
    v: "Step-by-step modules covering wallets, custody, signing, consequence, and verification.",
  },
  {
    k: "Validation",
    v: "Comprehension check, readiness checklist, and locked sequence enforcement.",
  },
  {
    k: "Pressure Layer",
    v: "A harder Token Fit trial before real wallet execution begins.",
  },
  {
    k: "Execution",
    v: "Controlled wallet connection, first real transaction, and confirmation proof.",
  },
];

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
    return Boolean(
      parsed?.passed &&
      parsed?.gate === "observe" &&
      parsed?.nextGate === "enter"
    );
  } catch {
    return false;
  }
}

function readGate2Access(): boolean {
  return localStorage.getItem(GATE2_ACCESS_KEY) === "true";
}

function writeGate2Bootstrap(email: string, displayName: string) {
  localStorage.setItem(GATE2_ACCESS_KEY, "true");
  localStorage.setItem(GATE2_EMAIL_KEY, email.trim());
  localStorage.setItem(GATE2_DISPLAY_NAME_KEY, displayName.trim());

  if (!localStorage.getItem(GATE2_PROGRESS_KEY)) {
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
      })
    );
  }
}

export default function JalSolEnter() {
  const navigate = useNavigate();
  const timerRef = useRef<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [observePassed, setObservePassed] = useState(false);
  const [gate2Access, setGate2Access] = useState(false);

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setObservePassed(readObservePassed());
    setGate2Access(readGate2Access());

    const savedEmail = localStorage.getItem(GATE2_EMAIL_KEY) ?? "";
    const savedDisplay = localStorage.getItem(GATE2_DISPLAY_NAME_KEY) ?? "";

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

  function handleDevUnlock() {
    if (!observePassed || loading) return;

    const cleanEmail = email.trim();
    const cleanDisplayName = displayName.trim();

    if (!cleanEmail || !cleanDisplayName) {
      setFormError("Email and display name are required before Gate 02 can be unlocked.");
      return;
    }

    writeGate2Bootstrap(cleanEmail, cleanDisplayName);
    setGate2Access(true);
    setFormError("");
  }

  function handleBeginSequence() {
    if (loading) return;

    const current = localStorage.getItem(GATE2_PROGRESS_KEY);
    const parsed = current ? JSON.parse(current) : {};

    localStorage.setItem(
      GATE2_PROGRESS_KEY,
      JSON.stringify({
        ...parsed,
        privateHomeSeen: true,
        currentStage: parsed.currentStage && parsed.currentStage !== "home"
          ? parsed.currentStage
          : "modules",
      })
    );

    beginRoute("/app/jal-sol/enter");
  }

  const accessLabel = gate2Access ? "Gate 02 Access Active" : "Controlled Entry Locked";

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
              {!gate2Access ? (
                <button
                  type="button"
                  className="button gold"
                  onClick={handleDevUnlock}
                  disabled={loading || !observePassed}
                >
                  Unlock Gate 02
                </button>
              ) : (
                <button
                  type="button"
                  className="button gold"
                  onClick={handleBeginSequence}
                  disabled={loading}
                >
                  Begin Gate 02 Sequence
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

          {!observePassed && (
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

{observePassed && !gate2Access && (
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
        This next gate will require preparation, validation, and a real irreversible action.
      </p>
    </section>

    <section className="jal-bay jal-bay-wide" aria-label="Gate 02 definition">
      <div className="jal-bay-head">
        <div className="jal-bay-title">What This Gate Is</div>
        <div className="jal-bay-note">Observer to participant</div>
      </div>

      <p className="jal-note">
        Gate 02 is a controlled-entry threshold. It exists to move the user from safe
        understanding into correct first participation. The user is not rewarded for
        random movement. They are advanced only after preparation, validation, pressure,
        execution, and proof.
      </p>

      <div className="jal-bullets">
        {PUBLIC_POINTS.map((point) => (
          <article key={point.k} className="jal-bullet">
            <div className="jal-bullet-k">{point.k}</div>
            <div className="jal-bullet-v">{point.v}</div>
          </article>
        ))}
      </div>
    </section>

    <section className="jal-grid" aria-label="Why Gate 02 matters">
      <section className="jal-bay">
        <div className="jal-bay-head">
          <div className="jal-bay-title">Why Entry Matters</div>
          <div className="jal-bay-note">State change, not theory</div>
        </div>

        <p className="jal-note">
          This is the first layer where the system expects real consequence. The user is
          no longer only learning or agreeing. They are preparing to connect control,
          sign movement, and verify proof.
        </p>

        <p className="jal-lock-text">
          A first controlled transaction matters because it changes the user’s
          relationship to the system.
        </p>
      </section>

      <section className="jal-bay">
        <div className="jal-bay-head">
          <div className="jal-bay-title">What Changes Here</div>
          <div className="jal-bay-note">Participation established</div>
        </div>

        <p className="jal-note">
          Gate 02 converts awareness into exposure. Once a wallet is connected and a real
          transaction is confirmed, the user is no longer outside the system. They have
          entered it.
        </p>

        <p className="jal-lock-text">
          This gate turns an informed observer into a verified participant.
        </p>
      </section>
    </section>

    <section className="jal-bay jal-bay-wide" aria-label="What Gate 02 includes">
      <div className="jal-bay-head">
        <div className="jal-bay-title">What This Gate Includes</div>
        <div className="jal-bay-note">Controlled entry package</div>
      </div>

      <p className="jal-note">
        Gate 02 is structured as a locked progression path. It does not begin with wallet
        friction. It begins with preparation and builds toward real irreversible action.
      </p>

      <div className="jal-bullets">
        {INCLUDED_POINTS.map((point) => (
          <article key={point.k} className="jal-bullet">
            <div className="jal-bullet-k">{point.k}</div>
            <div className="jal-bullet-v">{point.v}</div>
          </article>
        ))}
      </div>
    </section>

    <section className="jal-bay jal-bay-wide" aria-label="Gate 02 sequence rail">
      <div className="jal-bay-head">
        <div className="jal-bay-title">Controlled Entry Rail</div>
        <div className="jal-bay-note">The required order</div>
      </div>

      <p className="jal-note">
        Gate 02 must unfold in sequence. The user should see the full rail, but only one
        live stage is active at a time once the private workspace begins.
      </p>

      <div className="jal-steps">
        {ENTRY_RAIL.map((step) => (
          <div key={step.id}>
            <strong>{step.title}</strong>
            <span className="jal-step-sub">{step.note}</span>
          </div>
        ))}
      </div>
    </section>

    <section className="jal-grid" aria-label="Gate 02 requirements and access">
      <section className="jal-bay">
        <div className="jal-bay-head">
          <div className="jal-bay-title">Entry Requirements</div>
          <div className="jal-bay-note">Locked by intent</div>
        </div>

        <p className="jal-note">
          Gate 02 must be unlocked intentionally. Observe has already been completed. The
          next requirement is local access continuity so identity and progression can be
          preserved during development.
        </p>

        <div className="jal-bullets">
          <article className="jal-bullet">
            <div className="jal-bullet-k">Observe Complete</div>
            <div className="jal-bullet-v">
              Awareness is already established before entry begins.
            </div>
          </article>

          <article className="jal-bullet">
            <div className="jal-bullet-k">Access Required</div>
            <div className="jal-bullet-v">
              Gate 02 remains locked until a local bootstrap identity is created.
            </div>
          </article>

          <article className="jal-bullet">
            <div className="jal-bullet-k">No Skipping</div>
            <div className="jal-bullet-v">
              Wallet execution and transaction proof happen only after the earlier stages.
            </div>
          </article>
        </div>
      </section>

      <section className="jal-bay" aria-label="Dev access setup">
        <div className="jal-bay-head">
          <div className="jal-bay-title">Access Bootstrap</div>
          <div className="jal-bay-note">Dev mode identity</div>
        </div>

        <p className="jal-note">
          Payments are temporarily disabled while Gate 02 is finalised. Access is still
          intentionally gated so the system behaves like a locked threshold rather than an
          open page.
        </p>

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
            Unlock Gate 02
          </button>
        </div>
      </section>
    </section>
  </>
)}

          {observePassed && gate2Access && (
            <>
              <section className="jal-bay jal-bay-wide" aria-label="Private Gate 02 home">
                <div className="jal-bay-head">
                  <div className="jal-bay-title">Gate 02 Private Workspace</div>
                  <div className="jal-bay-note">Controlled progression environment</div>
                </div>

                <p className="jal-note">
                  Gate 02 access is active. This is now the internal progression environment. From
                  here onward, the user is no longer being sold the gate. They are being processed
                  through it.
                </p>

                <div className="jal-bullets">
                  <article className="jal-bullet">
                    <div className="jal-bullet-k">Identity</div>
                    <div className="jal-bullet-v">{displayName || "Unnamed entrant"}</div>
                  </article>

                  <article className="jal-bullet">
                    <div className="jal-bullet-k">Access</div>
                    <div className="jal-bullet-v">Gate 02 unlocked in development mode.</div>
                  </article>

                  <article className="jal-bullet">
                    <div className="jal-bullet-k">Next Objective</div>
                    <div className="jal-bullet-v">
                      Begin the sequence that leads toward verified first participation.
                    </div>
                  </article>
                </div>
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
                    Begin Gate 02 Sequence
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