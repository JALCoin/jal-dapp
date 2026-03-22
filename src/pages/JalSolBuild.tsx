import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { readLevel1Access } from "../lib/access";

type RouteTo =
  | "/app/home"
  | "/app/jal-sol"
  | "/app/jal-sol/observe"
  | "/app/jal-sol/enter"
  | "/app/token"
  | "/app/shop"
  | "/app/engine";

type BuildModule = {
  id: string;
  title: string;
  note: string;
};

const BUILD_MODULES: BuildModule[] = [
  {
    id: "creation",
    title: "Token creation",
    note: "Move from participation into authorship by creating a functional on-chain asset rather than only interacting with one.",
  },
  {
    id: "metadata",
    title: "Metadata + identity",
    note: "A created asset becomes more than supply when it has naming, image, description, and visible identity structure.",
  },
  {
    id: "utility",
    title: "Utility definition",
    note: "A token without declared function is weak. Utility begins when use, meaning, and direction are attached to what was created.",
  },
  {
    id: "ownership",
    title: "Ownership expansion",
    note: "Creation changes the user from participant into builder by moving them into control over what exists.",
  },
  {
    id: "execution",
    title: "Path toward execution",
    note: "Build is not the endpoint. It leads toward market structure, machine logic, and deterministic execution later.",
  },
];

const BUILD_POINTS = [
  {
    k: "Purpose",
    v: "Move from participation into creation, ownership, and system authorship.",
  },
  {
    k: "State",
    v: "Builder",
  },
  {
    k: "Condition",
    v: "Build comes after correct entry, not before it.",
  },
];

export default function JalSolBuild() {
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

  const primaryRoute: RouteTo = level1Unlocked ? "/app/token" : "/app/shop";

  return (
    <main
      className={`home-shell jal-shell jal-ground-page ${loading ? "is-fading" : ""}`}
      aria-label="JAL/SOL Build Gate"
    >
      <div className="home-wrap">
        <section className="card machine-surface panel-frame jal-window">
          <section className="jal-hero jal-world-hero" aria-label="Build gate hero">
            <div className="jal-hero-top">
              <div className="jal-kicker">JAL/SOL • GATE 03</div>

              <div className="jal-status" aria-label="Build state">
                <span className="jal-status-dot" />
                <span className="jal-status-text">Creation + Ownership</span>
              </div>
            </div>

            <div className="jal-hero-center">
              <p className="jal-world-pretitle">Builder gate</p>

              <h1 className="home-title">
                Move into ownership,
                <br />
                creation, and execution.
              </h1>

              <p className="home-lead">
                Build is the creation gate. This is where the user stops only interacting with
                existing systems and begins producing assets, structure, and identity of their own.
              </p>

              <p className="jal-sublead">
                Creation is not the first step. It follows correct entry. Once a user has crossed
                into participation, they can move toward authorship through token creation, utility
                definition, identity, and eventual expansion toward machine logic and execution.
              </p>
            </div>

            <div className="jal-arrival-note" aria-label="Build principles">
              <span>ENTRY BEFORE CREATION</span>
              <span>OWNERSHIP BEFORE EXPANSION</span>
              <span>BUILD TOWARD EXECUTION</span>
            </div>

            <div className="jal-links">
              <button
                type="button"
                className="button gold"
                onClick={() => beginRoute(primaryRoute)}
                disabled={loading}
              >
                {level1Unlocked ? "Open Creation Path" : "Unlock Entry First"}
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
                onClick={() => beginRoute("/app/jal-sol")}
                disabled={loading}
              >
                Return To World Hub
              </button>
            </div>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="Build definition">
            <div className="jal-bay-head">
              <div className="jal-bay-title">What This Gate Is</div>
              <div className="jal-bay-note">From participant to builder</div>
            </div>

            <p className="jal-note">
              Build exists so the user can move from using existing systems into shaping one.
              Creation changes the relationship entirely. The user is no longer only reacting to
              markets or tools. They begin to define assets, meaning, and structure.
            </p>

            <div className="jal-bullets">
              {BUILD_POINTS.map((point) => (
                <article key={point.k} className="jal-bullet">
                  <div className="jal-bullet-k">{point.k}</div>
                  <div className="jal-bullet-v">{point.v}</div>
                </article>
              ))}
            </div>
          </section>

          <section className="jal-grid" aria-label="Why build comes later">
            <section className="jal-bay">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Why Build Comes After Entry</div>
                <div className="jal-bay-note">Correct order</div>
              </div>

              <p className="jal-note">
                Creation without correct entry produces weak builders. A person who does not
                understand wallets, custody, signatures, transactions, and real movement is not
                ready to create assets with structure.
              </p>

              <p className="jal-lock-text">
                This is why Build is downstream. It depends on participation already being real.
              </p>
            </section>

            <section className="jal-bay">
              <div className="jal-bay-head">
                <div className="jal-bay-title">What Changes Here</div>
                <div className="jal-bay-note">Builder state</div>
              </div>

              <p className="jal-note">
                The user begins to move from interaction into authorship. The system is no longer
                just something they step into. It becomes something they can extend, shape, and
                attach identity to.
              </p>

              <p className="jal-lock-text">
                This gate turns the participant into a builder with direction.
              </p>
            </section>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="Build modules">
            <div className="jal-bay-head">
              <div className="jal-bay-title">Builder Modules</div>
              <div className="jal-bay-note">What this gate expands into</div>
            </div>

            <p className="jal-note">
              Build is not one single action. It is a progression layer made of authorship,
              identity, utility, and eventual structure. These are the core areas this gate opens.
            </p>

            <div className="jal-steps">
              {BUILD_MODULES.map((module) => (
                <div key={module.id}>
                  <strong>{module.title}</strong>
                  <span className="jal-step-sub">{module.note}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="jal-grid" aria-label="Creation and utility">
            <section className="jal-bay">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Token Creation</div>
                <div className="jal-bay-note">Functional asset authorship</div>
              </div>

              <p className="jal-note">
                This is where the user can begin creating an on-chain asset rather than only holding
                or transferring one. Creation is the first major ownership expansion step in the
                wider JAL/SOL system.
              </p>

              <p className="jal-lock-text">
                Mint creation, supply definition, metadata attachment, and presentation all begin to
                matter here.
              </p>
            </section>

            <section className="jal-bay">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Utility + Identity</div>
                <div className="jal-bay-note">Meaning attached to assets</div>
              </div>

              <p className="jal-note">
                A created token becomes stronger when it is attached to declared purpose, visible
                identity, and usable direction. Build is where an asset starts becoming part of a
                system instead of remaining isolated supply.
              </p>

              <p className="jal-lock-text">
                Naming, imagery, use, and structure are what turn creation into real identity.
              </p>
            </section>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="Path toward execution">
            <div className="jal-bay-head">
              <div className="jal-bay-title">Build Leads Toward Execution</div>
              <div className="jal-bay-note">Creation is not the endpoint</div>
            </div>

            <p className="jal-note">
              The path does not end at token creation. Build opens the way toward market structure,
              deterministic execution, and the later machine layers where behaviour becomes rule
              based, visible, and systematised.
            </p>

            <div className="jal-bullets">
              <article className="jal-bullet">
                <div className="jal-bullet-k">Creation</div>
                <div className="jal-bullet-v">
                  Produce an owned asset and establish authorship.
                </div>
              </article>

              <article className="jal-bullet">
                <div className="jal-bullet-k">Identity</div>
                <div className="jal-bullet-v">
                  Attach branding, purpose, and structure to what was created.
                </div>
              </article>

              <article className="jal-bullet">
                <div className="jal-bullet-k">Execution</div>
                <div className="jal-bullet-v">
                  Move later toward visible system logic and deterministic behaviour.
                </div>
              </article>
            </div>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="Build outcome">
            <div className="jal-bay-head">
              <div className="jal-bay-title">Output Of This Gate</div>
              <div className="jal-bay-note">Builder established</div>
            </div>

            <p className="jal-note">
              The result of Build is not merely access to tools. The result is authorship. The user
              now has a path toward creating assets, attaching identity, defining utility, and
              eventually extending outward into structured execution systems.
            </p>

            <div className="jal-bullets">
              <article className="jal-bullet">
                <div className="jal-bullet-k">Before</div>
                <div className="jal-bullet-v">
                  Participating in systems created by others.
                </div>
              </article>

              <article className="jal-bullet">
                <div className="jal-bullet-k">After</div>
                <div className="jal-bullet-v">
                  Moving toward owned assets, utility, and authored structure.
                </div>
              </article>

              <article className="jal-bullet">
                <div className="jal-bullet-k">Next</div>
                <div className="jal-bullet-v">
                  Creation tools, identity systems, market structure, and engine logic.
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
                {level1Unlocked ? "Open Creation Path" : "Unlock Entry First"}
              </button>

              <button
                type="button"
                className="button ghost"
                onClick={() => beginRoute("/app/jal-sol/enter")}
                disabled={loading}
              >
                Return To Enter
              </button>

              <button
                type="button"
                className="button ghost"
                onClick={() => beginRoute("/app/engine")}
                disabled={loading}
              >
                View Engine Layer
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