import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import JalCoinPanel, { JalCoinActions } from "../components/JalCoinPanel";
import { usePageMeta } from "../hooks/usePageMeta";
import { JAL_COIN, shortAddress } from "../lib/jalCoin";

type RouteTo =
  | "/app/home"
  | "/app/jal-sol"
  | "/app/jal-sol/observe"
  | "/app/jal-sol/enter"
  | "/app/jal-sol/build"
  | "/app/shop"
  | "/app/legal";

type GateCard = {
  id: "observe" | "enter" | "build";
  eyebrow: string;
  title: string;
  summary: string;
  currentUse: string;
  route: RouteTo;
  style: "observe" | "enter" | "build";
};

type LockedGateKind = GateCard["id"] | "success";

const GATES: GateCard[] = [
  {
    id: "observe",
    eyebrow: "Gate 01",
    title: "Observe",
    summary:
      "The old awareness layer covered wallets, custody, exchange paths, and on-chain responsibility.",
    currentUse:
      "Now held as private educational content while the public site focuses on verified JAL Coin links.",
    route: "/app/jal-sol/observe",
    style: "observe",
  },
  {
    id: "enter",
    eyebrow: "Gate 02",
    title: "Enter",
    summary:
      "The old participation layer covered payment truth, wallet control, signing, and first movement.",
    currentUse:
      "Now locked so visitors are not pushed into an unfinished participation flow.",
    route: "/app/jal-sol/enter",
    style: "enter",
  },
  {
    id: "build",
    eyebrow: "Gate 03",
    title: "Build",
    summary:
      "The old builder layer covered token creation, identity, utility, and ownership structure.",
    currentUse:
      "Now staged privately until the public context and legal boundaries are ready.",
    route: "/app/jal-sol/build",
    style: "build",
  },
];

const LOCKED_GATE_META: Record<LockedGateKind, { eyebrow: string; title: string; body: string }> = {
  observe: {
    eyebrow: "Gate 01 | Observe",
    title: "Observe content is locked.",
    body:
      "The old Observe modules remain private. The public page now only exposes official JAL Coin links and verification points.",
  },
  enter: {
    eyebrow: "Gate 02 | Enter",
    title: "Enter content is locked.",
    body:
      "The old entry flow remains private. Visitors are not being moved through payment, wallet-signing, or participation gates here.",
  },
  build: {
    eyebrow: "Gate 03 | Build",
    title: "Build content is locked.",
    body:
      "The old builder modules remain private. Token creation, utility, and expansion content are not public in this release.",
  },
  success: {
    eyebrow: "JAL/SOL | Success",
    title: "Success content is locked.",
    body:
      "The old success route is retained only for route continuity. It no longer grants public progression or access.",
  },
};

function useDelayedNavigate() {
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
    }, 700);
  }

  return { beginRoute, loading };
}

export function JalSolLockedGate({ gate }: { gate: LockedGateKind }) {
  const meta = LOCKED_GATE_META[gate];

  usePageMeta(
    `${meta.eyebrow} Locked`,
    "Locked JAL/SOL gate content. The public route is retained while detailed content stays private."
  );

  return (
    <main className="home-shell jal-shell jal-ground-page" aria-label={meta.eyebrow}>
      <div className="home-wrap">
        <section className="card machine-surface panel-frame jal-window">
          <section className="jal-hero jal-world-hero jal-world-hub-minimal" aria-label="Locked gate">
            <div className="jal-hero-center jal-world-hub-center">
              <p className="jal-world-pretitle">{meta.eyebrow}</p>
              <h1 className="home-title jal-world-hub-title">{meta.title}</h1>
              <p className="home-lead">{meta.body}</p>
              <p className="jal-sublead">
                Current public access is limited to JAL Coin verification, Raydium discovery, and
                the official liquidity support wallet.
              </p>
              <div className="jal-links">
                <Link className="button gold" to="/app/jal-sol">
                  Return To JAL/SOL
                </Link>
                <Link className="button ghost" to="/app/legal">
                  Legal + Business
                </Link>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

export default function JalSolPage() {
  const { beginRoute, loading } = useDelayedNavigate();

  usePageMeta(
    "JAL/SOL",
    "Official JAL Coin public hub with Raydium buy route, liquidity support wallet, Solscan verification, and locked historical gate structure."
  );

  return (
    <main
      className={`home-shell jal-shell jal-ground-page ${loading ? "is-fading" : ""}`}
      aria-label="JAL/SOL"
    >
      <div className="home-wrap">
        <section className="card machine-surface panel-frame jal-window">
          <section className="jal-hero jal-world-hero jal-world-hub-minimal" aria-label="JAL/SOL hero">
            <div className="jal-hero-center jal-world-hub-center">
              <p className="jal-world-pretitle">Official JAL Coin hub</p>
              <h1 className="home-title jal-world-hub-title">JAL/SOL</h1>
              <p className="jal-world-hub-subtitle">JAL Coin on Solana</p>
              <p className="home-lead">
                Use this page to find the official JAL Coin mint, Raydium route, and liquidity
                support wallet. Historical JAL/SOL gate content is present only as a locked
                structure.
              </p>
              <div className="jal-links">
                <JalCoinActions />
              </div>
            </div>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="JAL Coin public summary">
            <div className="jal-bay-head">
              <div className="jal-bay-title">Public JAL Coin Details</div>
              <div className="jal-bay-note">Verify before acting</div>
            </div>

            <div className="jal-bullets">
              <article className="jal-bullet">
                <div className="jal-bullet-k">Mint</div>
                <div className="jal-bullet-v">{shortAddress(JAL_COIN.mintAddress)}</div>
              </article>
              <article className="jal-bullet">
                <div className="jal-bullet-k">Raydium Pool</div>
                <div className="jal-bullet-v">{shortAddress(JAL_COIN.raydiumPoolAddress)}</div>
              </article>
              <article className="jal-bullet">
                <div className="jal-bullet-k">Liquidity Wallet</div>
                <div className="jal-bullet-v">{shortAddress(JAL_COIN.liquiditySupportWallet)}</div>
              </article>
              <article className="jal-bullet">
                <div className="jal-bullet-k">Freeze Authority</div>
                <div className="jal-bullet-v">{JAL_COIN.freezeAuthorityStatus}</div>
              </article>
            </div>
          </section>

          <section className="jal-bay jal-bay-wide" aria-label="Locked JAL/SOL gates">
            <div className="jal-bay-head">
              <div className="jal-bay-title">Locked Gate Structure</div>
              <div className="jal-bay-note">Restored for continuity, content not public</div>
            </div>

            <div className="jal-gate-grid">
              {GATES.map((gate) => (
                <article key={gate.id} className={`jal-gate-card jal-gate-card--${gate.style}`}>
                  <div className="jal-gate-top">
                    <span className="jal-gate-eyebrow">{gate.eyebrow}</span>
                    <span className="jal-status-text">Locked</span>
                  </div>
                  <h2 className="jal-gate-title">{gate.title}</h2>
                  <p className="jal-gate-note">{gate.summary}</p>
                  <p className="jal-lock-text">{gate.currentUse}</p>
                  <div className="jal-gate-actions">
                    <button
                      type="button"
                      className={gate.style === "enter" ? "button gold" : "button ghost"}
                      onClick={() => beginRoute(gate.route)}
                      disabled={loading}
                    >
                      View Locked Gate
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>

        <JalCoinPanel />
      </div>

      {loading && (
        <div className="loading-screen" role="status" aria-live="polite" aria-label="Loading">
          <img className="loading-logo" src="/JALSOL1.gif" alt="" />
        </div>
      )}
    </main>
  );
}
