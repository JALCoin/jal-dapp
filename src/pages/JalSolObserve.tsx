import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type RouteTo =
  | "/app/home"
  | "/app/jal-sol"
  | "/app/jal-sol/enter"
  | "/app/shop";

type LearnModule = {
  id: string;
  title: string;
  note: string;
};

const LEARN_MODULES: LearnModule[] = [
  {
    id: "crypto",
    title: "What crypto actually is",
    note: "Digital ownership, transferable value, and network-based systems that do not depend on a single central operator.",
  },
  {
    id: "cex-vs-dex",
    title: "CEX vs DEX",
    note: "Centralised exchange entry is guided and familiar. Decentralised exchange interaction is direct, self-managed, and less forgiving.",
  },
  {
    id: "wallets",
    title: "Wallets and custody",
    note: "A wallet is not just an app. It is the user’s point of control. Responsibility increases when custody becomes personal.",
  },
  {
    id: "solana",
    title: "Solana basics",
    note: "Accounts, transactions, signatures, fees, speed, and why Solana behaves differently from slower or more expensive networks.",
  },
  {
    id: "movement",
    title: "Movement before hype",
    note: "The market punishes confusion. Awareness is about recognising process before chasing outcomes.",
  },
];

const OBSERVE_POINTS = [
  {
    k: "Purpose",
    v: "Build awareness before irreversible movement.",
  },
  {
    k: "State",
    v: "Observer",
  },
  {
    k: "Risk",
    v: "Low — no forced action.",
  },
];

export default function JalSolObserve() {
  const navigate = useNavigate();
  const timerRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(false);

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
                <span className="jal-status-text">Observe Before Movement</span>
              </div>
            </div>

            <div className="jal-hero-center">
              <p className="jal-world-pretitle">Awareness gate</p>

              <h1 className="home-title">
                Understand the system
                <br />
                before irreversible action.
              </h1>

              <p className="home-lead">
                Observe is the awareness path. This gate exists to remove confusion, explain the
                environment, and stabilise the user before any real commitment takes place.
              </p>

              <p className="jal-sublead">
                This is not delay for the sake of delay. It is controlled preparation. Correct
                entry begins with clear understanding of wallets, exchanges, custody, Solana, and
                why movement must come before hype.
              </p>
            </div>

            <div className="jal-arrival-note" aria-label="Observe principles">
              <span>DISCLOSURE → AWARENESS</span>
              <span>NO IRREVERSIBLE ACTION YET</span>
              <span>UNDERSTAND BEFORE ENTRY</span>
            </div>

            <div className="jal-links">
              <button
                type="button"
                className="button gold"
                onClick={() => beginRoute("/app/jal-sol/enter")}
                disabled={loading}
              >
                Continue To Enter
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

          <section className="jal-bay jal-bay-wide" aria-label="Observe definition">
            <div className="jal-bay-head">
              <div className="jal-bay-title">What This Gate Is</div>
              <div className="jal-bay-note">Awareness before commitment</div>
            </div>

            <p className="jal-note">
              Observe is the first controlled gate because users should not be pushed into action
              before they understand what they are interacting with. This is the layer where
              terminology becomes clear, movement becomes visible, and emotional pressure is
              removed.
            </p>

            <div className="jal-bullets">
              {OBSERVE_POINTS.map((point) => (
                <article key={point.k} className="jal-bullet">
                  <div className="jal-bullet-k">{point.k}</div>
                  <div className="jal-bullet-v">{point.v}</div>
                </article>
              ))}
            </div>
          </section>

          <section className="jal-grid" aria-label="Observe foundations">
            <section className="jal-bay">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Why Awareness Comes First</div>
                <div className="jal-bay-note">Order before action</div>
              </div>

              <p className="jal-note">
                Most people encounter crypto through noise, urgency, or imitation. That creates
                weak entry behaviour. JAL/SOL corrects this by forcing the user to see structure
                first.
              </p>

              <p className="jal-lock-text">
                Awareness does not mean passivity forever. It means the user becomes an informed
                observer before becoming an exposed participant.
              </p>
            </section>

            <section className="jal-bay">
              <div className="jal-bay-head">
                <div className="jal-bay-title">What Changes Here</div>
                <div className="jal-bay-note">Observer state</div>
              </div>

              <p className="jal-note">
                The user does not yet create a wallet signature or perform a transaction. The state
                change here is cognitive: confusion is reduced, terminology is understood, and the
                path toward controlled entry becomes intelligible.
              </p>

              <p className="jal-lock-text">
                This gate turns the user from a passive browser into an informed observer.
              </p>
            </section>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="Open awareness modules">
            <div className="jal-bay-head">
              <div className="jal-bay-title">Open Awareness Modules</div>
              <div className="jal-bay-note">What the user should understand here</div>
            </div>

            <p className="jal-note">
              These modules represent the minimum awareness required before correct entry begins.
              They are visible because the system should not hide foundational understanding behind
              pressure.
            </p>

            <div className="jal-steps">
              {LEARN_MODULES.map((module) => (
                <div key={module.id}>
                  <strong>{module.title}</strong>
                  <span className="jal-step-sub">{module.note}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="jal-grid" aria-label="CEX DEX and custody">
            <section className="jal-bay">
              <div className="jal-bay-head">
                <div className="jal-bay-title">CEX vs DEX</div>
                <div className="jal-bay-note">Guided entry vs direct interaction</div>
              </div>

              <p className="jal-note">
                A centralised exchange gives the user a familiar and simplified entry path. A
                decentralised exchange demands more awareness because interaction becomes more
                direct and the user carries more responsibility.
              </p>

              <p className="jal-lock-text">
                Neither is automatically “better.” The question is whether the user understands the
                trade-off between convenience and direct control.
              </p>
            </section>

            <section className="jal-bay">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Wallets and Custody</div>
                <div className="jal-bay-note">Control changes responsibility</div>
              </div>

              <p className="jal-note">
                Wallets are the bridge between identity and digital movement. The moment custody
                becomes personal, so does the burden of accuracy. Wrong addresses, poor storage,
                and rushed decisions become the user’s problem.
              </p>

              <p className="jal-lock-text">
                This is why awareness matters before the first real transaction takes place.
              </p>
            </section>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="Solana orientation">
            <div className="jal-bay-head">
              <div className="jal-bay-title">Solana Orientation</div>
              <div className="jal-bay-note">Why this system uses Solana</div>
            </div>

            <p className="jal-note">
              Solana is suited to JAL/SOL because it allows fast, low-cost interaction and gives
              the user an environment where asset creation, wallet behaviour, and on-chain movement
              can be experienced directly.
            </p>

            <div className="jal-bullets">
              <article className="jal-bullet">
                <div className="jal-bullet-k">Transactions</div>
                <div className="jal-bullet-v">
                  Signed movement is visible and verifiable.
                </div>
              </article>

              <article className="jal-bullet">
                <div className="jal-bullet-k">Fees</div>
                <div className="jal-bullet-v">
                  Low enough to support guided first actions and experimentation.
                </div>
              </article>

              <article className="jal-bullet">
                <div className="jal-bullet-k">Creation</div>
                <div className="jal-bullet-v">
                  Token creation and utility expansion can grow naturally from entry.
                </div>
              </article>
            </div>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="Observe outcome">
            <div className="jal-bay-head">
              <div className="jal-bay-title">State Change From This Gate</div>
              <div className="jal-bay-note">Observer established</div>
            </div>

            <p className="jal-note">
              The output of Observe is not a transaction. It is a better starting condition. The
              user now understands the environment enough to move toward controlled entry without
              relying on hype, imitation, or panic.
            </p>

            <div className="jal-bullets">
              <article className="jal-bullet">
                <div className="jal-bullet-k">Before</div>
                <div className="jal-bullet-v">
                  Browsing without structure or clear understanding.
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

            <div className="jal-bay-actions">
              <button
                type="button"
                className="button gold"
                onClick={() => beginRoute("/app/jal-sol/enter")}
                disabled={loading}
              >
                Continue To Enter
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
                onClick={() => beginRoute("/app/shop")}
                disabled={loading}
              >
                View Access Layer
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