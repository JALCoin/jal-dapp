import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { readLevel1Access } from "../lib/access";

type RouteTo =
  | "/app/home"
  | "/app/jal-sol"
  | "/app/jal-sol/observe"
  | "/app/jal-sol/build"
  | "/app/jal-sol/level-1"
  | "/app/shop";

type EntryStep = {
  id: string;
  title: string;
  note: string;
};

const ENTRY_STEPS: EntryStep[] = [
  {
    id: "exchange",
    title: "Exchange setup",
    note: "Choose a reliable fiat entry point and understand that guided exchange entry is often the cleanest first bridge into the market.",
  },
  {
    id: "wallet",
    title: "Wallet setup",
    note: "Install, secure, and understand the wallet before using it. A wallet is not decoration — it is your point of control.",
  },
  {
    id: "connect",
    title: "Wallet connection",
    note: "The wallet must connect correctly before on-chain action becomes real. Connection is the threshold between theory and participation.",
  },
  {
    id: "first-action",
    title: "First irreversible action",
    note: "A transfer, swap, or other signed transaction proves movement. This is where the user becomes a participant.",
  },
];

const ENTER_POINTS = [
  {
    k: "Purpose",
    v: "Move from awareness into real controlled participation.",
  },
  {
    k: "State",
    v: "Participant",
  },
  {
    k: "Proof",
    v: "Wallet connection + first real transaction.",
  },
];

export default function JalSolEnter() {
  const navigate = useNavigate();
  const timerRef = useRef<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [level1Unlocked, setLevel1Unlocked] = useState(false);

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

  const primaryRoute: RouteTo = level1Unlocked ? "/app/jal-sol/level-1" : "/app/shop";

  return (
    <main
      className={`home-shell jal-shell jal-ground-page ${loading ? "is-fading" : ""}`}
      aria-label="JAL/SOL Enter Gate"
    >
      <div className="home-wrap">
        <section className="card machine-surface panel-frame jal-window">
          <section className="jal-hero jal-world-hero" aria-label="Enter gate hero">
            <div className="jal-hero-top">
              <div className="jal-kicker">JAL/SOL • GATE 02</div>

              <div className="jal-status" aria-label="Enter state">
                <span className="jal-status-dot" />
                <span className="jal-status-text">Controlled Entry</span>
              </div>
            </div>

            <div className="jal-hero-center">
              <p className="jal-world-pretitle">Participation gate</p>

              <h1 className="home-title">
                Complete the first
                <br />
                irreversible action.
              </h1>

              <p className="home-lead">
                Enter is the transition gate. This is where the user stops observing from a safe
                distance and starts participating through a real action that changes their position
                inside the system.
              </p>

              <p className="jal-sublead">
                Awareness alone does not create ownership. A connected wallet, a signed movement,
                and a first controlled transaction are what convert the user from observer into
                participant.
              </p>
            </div>

            <div className="jal-arrival-note" aria-label="Enter principles">
              <span>CONTROLLED ENTRY</span>
              <span>WALLET → CONNECTION → TRANSACTION</span>
              <span>OWNERSHIP BEGINS WITH MOVEMENT</span>
            </div>

            <div className="jal-links">
              <button
                type="button"
                className="button gold"
                onClick={() => beginRoute(primaryRoute)}
                disabled={loading}
              >
                {level1Unlocked ? "Resume Level 1" : "Open Level 1 Access"}
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

          <section className="jal-bay jal-bay-wide" aria-label="Enter definition">
            <div className="jal-bay-head">
              <div className="jal-bay-title">What This Gate Is</div>
              <div className="jal-bay-note">From observer to participant</div>
            </div>

            <p className="jal-note">
              Enter is the first real commitment layer. It exists so the user can move correctly,
              not impulsively. The system does not reward random action. It rewards structured
              movement backed by verification.
            </p>

            <div className="jal-bullets">
              {ENTER_POINTS.map((point) => (
                <article key={point.k} className="jal-bullet">
                  <div className="jal-bullet-k">{point.k}</div>
                  <div className="jal-bullet-v">{point.v}</div>
                </article>
              ))}
            </div>
          </section>

          <section className="jal-grid" aria-label="Controlled entry meaning">
            <section className="jal-bay">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Why Entry Matters</div>
                <div className="jal-bay-note">State change, not theory</div>
              </div>

              <p className="jal-note">
                This gate matters because it creates the first verifiable state change. The user is
                no longer just reading, watching, or agreeing. They are now connected to the system
                through action.
              </p>

              <p className="jal-lock-text">
                A first controlled transaction is important because it is irreversible. That is what
                makes it meaningful.
              </p>
            </section>

            <section className="jal-bay">
              <div className="jal-bay-head">
                <div className="jal-bay-title">What Changes Here</div>
                <div className="jal-bay-note">Participation established</div>
              </div>

              <p className="jal-note">
                The user crosses from awareness into exposure. Their choices now affect capital,
                custody, and system position. This is the first layer where action has real
                consequence.
              </p>

              <p className="jal-lock-text">
                This gate turns the user from an informed observer into a controlled participant.
              </p>
            </section>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="Entry sequence">
            <div className="jal-bay-head">
              <div className="jal-bay-title">Controlled Entry Sequence</div>
              <div className="jal-bay-note">The first movement path</div>
            </div>

            <p className="jal-note">
              The system should not throw the user into market behaviour without structure. These
              are the correct early steps that prepare and verify first participation.
            </p>

            <div className="jal-steps">
              {ENTRY_STEPS.map((step) => (
                <div key={step.id}>
                  <strong>{step.title}</strong>
                  <span className="jal-step-sub">{step.note}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="jal-grid" aria-label="Exchange and wallet preparation">
            <section className="jal-bay">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Exchange Setup</div>
                <div className="jal-bay-note">Fiat bridge</div>
              </div>

              <p className="jal-note">
                For many users, a centralised exchange is the first practical bridge between fiat
                and digital assets. That is acceptable when used correctly. The point is not to
                glorify convenience. The point is to establish correct movement into the market.
              </p>

              <p className="jal-lock-text">
                Guided entry is often cleaner than trying to jump straight into direct self-custody
                without understanding what is happening.
              </p>
            </section>

            <section className="jal-bay">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Wallet Setup + Connection</div>
                <div className="jal-bay-note">Control threshold</div>
              </div>

              <p className="jal-note">
                A wallet is where the user begins to take responsibility for digital movement.
                Installing it is not enough. The user must understand what it means to connect it,
                sign with it, and use it correctly.
              </p>

              <p className="jal-lock-text">
                Connection is the threshold. Once the wallet is involved, movement becomes personal.
              </p>
            </section>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="First real action">
            <div className="jal-bay-head">
              <div className="jal-bay-title">First Irreversible Action</div>
              <div className="jal-bay-note">Why Level 1 exists</div>
            </div>

            <p className="jal-note">
              The first signed movement is where the system stops being conceptual. A transaction,
              transfer, or other verified action proves that the user has crossed from explanation
              into participation.
            </p>

            <div className="jal-bullets">
              <article className="jal-bullet">
                <div className="jal-bullet-k">Wallet Connected</div>
                <div className="jal-bullet-v">
                  The user is now attached to the system through a real control point.
                </div>
              </article>

              <article className="jal-bullet">
                <div className="jal-bullet-k">Transaction Signed</div>
                <div className="jal-bullet-v">
                  The user has performed a verifiable movement with consequence.
                </div>
              </article>

              <article className="jal-bullet">
                <div className="jal-bullet-k">State Change</div>
                <div className="jal-bullet-v">
                  The user becomes a participant, not just a viewer.
                </div>
              </article>
            </div>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="Entry output">
            <div className="jal-bay-head">
              <div className="jal-bay-title">Output Of This Gate</div>
              <div className="jal-bay-note">Participant established</div>
            </div>

            <p className="jal-note">
              The result of Enter is not just “having access.” The result is a different
              relationship to the system. The user now has proof of movement and a verified basis
              for deeper layers such as creation and ownership.
            </p>

            <div className="jal-bullets">
              <article className="jal-bullet">
                <div className="jal-bullet-k">Before</div>
                <div className="jal-bullet-v">
                  Aware of the system, but not yet participating in it.
                </div>
              </article>

              <article className="jal-bullet">
                <div className="jal-bullet-k">After</div>
                <div className="jal-bullet-v">
                  Participant with the first controlled action completed or underway.
                </div>
              </article>

              <article className="jal-bullet">
                <div className="jal-bullet-k">Next</div>
                <div className="jal-bullet-v">
                  Build — creation, ownership, utility, and system expansion.
                </div>
              </article>
            </div>

            <div className="jal-bay-actions">
              <button
                type="button"
                className="button gold"
                onClick={() => beginRoute(primaryRoute)}
                disabled={loading}
              >
                {level1Unlocked ? "Resume Level 1" : "Open Level 1 Access"}
              </button>

              <button
                type="button"
                className="button ghost"
                onClick={() => beginRoute("/app/jal-sol/build")}
                disabled={loading}
              >
                Continue To Build
              </button>

              <button
                type="button"
                className="button ghost"
                onClick={() => beginRoute("/app/jal-sol/observe")}
                disabled={loading}
              >
                Return To Observe
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