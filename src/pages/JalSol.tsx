import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type RouteTo =
  | "/app/home"
  | "/app/jal-sol"
  | "/app/jal-sol/observe"
  | "/app/jal-sol/enter"
  | "/app/jal-sol/build"
  | "/app/shop";

type GateCard = {
  id: "observe" | "enter" | "build";
  eyebrow: string;
  title: string;
  summary: string;
  expect: string[];
  route: RouteTo;
  buttonLabel: string;
  style: "observe" | "enter" | "build";
};

const GATES: GateCard[] = [
  {
    id: "observe",
    eyebrow: "Module 01",
    title: "Observe",
    summary:
      "Observe is the awareness module. It slows the user down and explains wallets, custody, and basic crypto pathways before any irreversible step begins.",
    expect: [
      "What cryptocurrency actually is",
      "CEX vs DEX",
      "Wallets, custody, and responsibility",
      "The awareness layer before action",
    ],
    route: "/app/jal-sol/observe",
    buttonLabel: "Open Observe Module",
    style: "observe",
  },
  {
    id: "enter",
    eyebrow: "Module 02",
    title: "Onboarding",
    summary:
      "Onboarding is the paid module. It turns understanding into guided setup and prepares the user for a first self-custody workflow with verification steps.",
    expect: [
      "Payment verification and identity matching",
      "Wallet connection and message signing",
      "Guided wallet and transaction review",
      "Verification before the module is marked complete",
    ],
    route: "/app/jal-sol/enter",
    buttonLabel: "Open Onboarding Module",
    style: "enter",
  },
  {
    id: "build",
    eyebrow: "Module 03",
    title: "Build",
    summary:
      "Build is the builder workspace. It moves the user from onboarding into project setup, structure, and technical tooling.",
    expect: [
      "Project setup and identity",
      "Technical tooling and metadata planning",
      "System structure over random creation",
      "Launch planning and documentation",
    ],
    route: "/app/jal-sol/build",
    buttonLabel: "Open Builder Workspace",
    style: "build",
  },
];

export default function JalSolPage() {
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
      aria-label="JAL/SOL Onboarding Hub"
    >
      <div className="home-wrap">
        <section className="card machine-surface panel-frame jal-window">
          <section
            className="jal-hero jal-world-hero jal-world-hub-minimal"
            aria-label="Onboarding hub hero"
          >
            <div className="jal-hero-center jal-world-hub-center">
              <h1 className="home-title jal-world-hub-title">JAL/SOL</h1>
              <p className="jal-world-hub-subtitle" aria-label="Onboarding hub">
                ONBOARDING HUB
              </p>
            </div>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="Onboarding modules">
            <div className="jal-bay-head">
              <div className="jal-bay-title">Onboarding Modules</div>
              <div className="jal-bay-note">Choose the current stage of the workspace</div>
            </div>

            <div className="jal-gate-grid">
              {GATES.map((gate) => (
                <article
                  key={gate.id}
                  className={`jal-gate-card jal-gate-card--${gate.style}`}
                >
                  <div className="jal-gate-top">
                    <span className="jal-gate-eyebrow">{gate.eyebrow}</span>
                  </div>

                  <h2 className="jal-gate-title">{gate.title}</h2>
                  <p className="jal-gate-note">{gate.summary}</p>

                  <div className="jal-gate-actions">
                    <button
                      type="button"
                      className={`button ${
                        gate.style === "enter"
                          ? "gold"
                          : gate.style === "build"
                          ? "neon"
                          : "ghost"
                      }`}
                      onClick={() => beginRoute(gate.route)}
                      disabled={loading}
                    >
                      {gate.buttonLabel}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="Module summary">
            <div className="jal-bay-head">
              <div className="jal-bay-title">Module Summary</div>
              <div className="jal-bay-note">Purpose and expectation</div>
            </div>

            <div className="jal-grid">
              {GATES.map((gate) => (
                <section key={`${gate.id}-summary`} className="jal-bay">
                  <div className="jal-bay-head">
                    <div className="jal-bay-title">
                      {gate.eyebrow} - {gate.title}
                    </div>
                    <div className="jal-bay-note">What to expect</div>
                  </div>

                  <p className="jal-note">{gate.summary}</p>

                  <div className="jal-steps">
                    {gate.expect.map((item) => (
                      <div key={item}>
                        <strong>{item}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
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
