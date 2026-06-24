import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { JalCoinActions } from "../components/JalCoinPanel";
import { usePageMeta } from "../hooks/usePageMeta";
import { arcadeCopy, arcadeModuleItems } from "../lib/jalArcade";
import { JAL_COIN, shortAddress } from "../lib/jalCoin";

type RouteTo =
  | "/app/home"
  | "/app/jal-sol"
  | "/app/jal-sol/observe"
  | "/app/jal-sol/enter"
  | "/app/jal-sol/build"
  | "/app/shop"
  | "/app/legal"
  | "/app/disclaimer";

type BuilderCard = {
  id: "observe" | "enter" | "build";
  eyebrow: string;
  title: string;
  summary: string;
  currentUse: string;
  route: RouteTo;
  style: "observe" | "enter" | "build";
};

type LockedGateKind = BuilderCard["id"] | "success";

const BUILDER_PATH: BuilderCard[] = [
  {
    id: "observe",
    eyebrow: "Phase 01",
    title: "Observe",
    summary: "Learn wallets, custody basics, exchange paths, and on-chain responsibility.",
    currentUse: "Held private while the public hub focuses on verified JAL Coin links.",
    route: "/app/jal-sol/observe",
    style: "observe",
  },
  {
    id: "enter",
    eyebrow: "Phase 02",
    title: "Enter",
    summary: "A future guided path for checking tools before anyone leaves the JALSOL site.",
    currentUse: "Locked so visitors are not pushed into an unfinished participation flow.",
    route: "/app/jal-sol/enter",
    style: "enter",
  },
  {
    id: "build",
    eyebrow: "Phase 03",
    title: "Build",
    summary: "A staged builder layer for identity, utility, and future public modules.",
    currentUse: "Staged privately until the public context and legal boundaries are ready.",
    route: "/app/jal-sol/build",
    style: "build",
  },
];

const LOCKED_GATE_META: Record<LockedGateKind, { eyebrow: string; title: string; body: string }> = {
  observe: {
    eyebrow: "Phase 01 | Observe",
    title: "Observe content is locked.",
    body:
      "The Observe modules remain private. The public page now only exposes official JAL Coin links and verification points.",
  },
  enter: {
    eyebrow: "Phase 02 | Enter",
    title: "Enter content is locked.",
    body:
      "The entry flow remains private. Visitors are not being moved through payment, wallet-signing, or participation steps here.",
  },
  build: {
    eyebrow: "Phase 03 | Build",
    title: "Build content is locked.",
    body:
      "The builder modules remain private. Token creation, utility, and expansion content are not public in this release.",
  },
  success: {
    eyebrow: "JAL/SOL | Success",
    title: "Success content is locked.",
    body:
      "The old success route is retained only for route continuity. It no longer grants public progression or access.",
  },
};

const EXPLORER_POINTS = [
  {
    label: "Check",
    value: "Official Links",
    copy: "Use the links on this page before you leave JALSOL.",
  },
  {
    label: "Try",
    value: "The Path",
    copy: "See the steps before opening Raydium.",
  },
  {
    label: "Follow",
    value: "The Build",
    copy: "Watch simple signals as JAL/SOL grows.",
  },
];

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
    "Locked JAL/SOL path content. The public route is retained while detailed content stays private."
  );

  return (
    <main className="home-shell jal-shell jal-ground-page" aria-label={meta.eyebrow}>
      <div className="home-wrap">
        <section className="card machine-surface panel-frame jal-window jal-explorer-window">
          <section className="jal-hero jal-world-hero jal-world-hub-minimal" aria-label="Locked path">
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
                  Back To JAL/SOL
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
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);

  usePageMeta(
    "JAL/SOL",
    "Official JAL Coin public hub with official links, a simple Raydium path, build signals, support wallet, and locked future paths."
  );

  useEffect(() => {
    if (!copiedItemId) return;

    const timer = window.setTimeout(() => setCopiedItemId(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copiedItemId]);

  async function copyValue(id: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedItemId(id);
    } catch {
      setCopiedItemId(null);
    }
  }

  return (
    <main
      className={`home-shell jal-shell jal-ground-page ${loading ? "is-fading" : ""}`}
      aria-label="JAL/SOL"
    >
      <div className="home-wrap">
        <section className="card machine-surface panel-frame jal-window jal-explorer-window">
          <section className="jal-hero jal-world-hero jal-world-hub-minimal jal-explorer-hero" aria-label="Start Here">
            <div className="jal-hero-center jal-world-hub-center">
              <p className="jal-world-pretitle">Simple JAL/SOL Start</p>
              <h1 className="home-title jal-world-hub-title">Start Here</h1>
              <p className="jal-world-hub-subtitle">JAL Coin on Solana</p>
              <p className="home-lead">
                Check the links. Try the path. Follow the build.
              </p>
              <div className="jal-links">
                <JalCoinActions />
                <a className="button ghost" href="#jal-proof-board">
                  Check Official Links
                </a>
                <Link className="button ghost" to="/app/legal">
                  Read The Details
                </Link>
              </div>
            </div>

            <div className="jal-explorer-points" aria-label="JAL/SOL explorer points">
              {EXPLORER_POINTS.map((point) => (
                <article className="jal-explorer-point" key={point.label}>
                  <div className="jal-explorer-point-label">{point.label}</div>
                  <div className="jal-explorer-point-value">{point.value}</div>
                  <p>{point.copy}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="jal-proof-board" className="jal-bay jal-bay-wide jal-proof-board" aria-label="Official Links">
            <div className="jal-bay-head">
              <div>
                <div className="jal-bay-title">Official Links</div>
                <div className="jal-bay-note">Check first</div>
              </div>
              <div className="jal-proof-timestamp">Last checked: {JAL_COIN.lastVerifiedOn}</div>
            </div>

            <div className="jal-proof-grid">
              {JAL_COIN.verificationItems.map((item) => (
                <article className={`jal-proof-card tone-${item.tone}`} key={item.id}>
                  <div className="jal-proof-card-top">
                    <span>{item.label}</span>
                    <span className="jal-proof-state">Verified</span>
                  </div>
                  <div className="jal-proof-tech">{item.technicalLabel}</div>
                  <div className="jal-proof-value">
                    {item.copyable ? shortAddress(item.value) : item.value}
                  </div>
                  <p>{item.note}</p>
                  <div className="jal-proof-actions">
                    {item.copyable ? (
                      <button
                        type="button"
                        className="jal-coin-copy-button"
                        onClick={() => copyValue(item.id, item.value)}
                      >
                        {copiedItemId === item.id ? "Copied" : "Copy"}
                      </button>
                    ) : null}
                    <a
                      className="jal-coin-explorer-link"
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.hrefLabel}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="jal-bay jal-bay-wide jal-swap-practice" aria-label="Try The Path">
            <div className="jal-bay-head">
              <div>
                <div className="jal-bay-title">Try The Path</div>
                <div className="jal-bay-note">Practice first</div>
              </div>
              <div className="jal-proof-timestamp">No wallet connection here</div>
            </div>

            <div className="jal-practice-steps">
              {JAL_COIN.swapPracticeSteps.map((step, index) => (
                <article className="jal-practice-step" key={step.id}>
                  <div className="jal-practice-number">{String(index + 1).padStart(2, "0")}</div>
                  <h2>{step.title}</h2>
                  <p>{step.body}</p>
                </article>
              ))}
            </div>

            <div className="jal-practice-footer">
              <p>Open Raydium only when you choose to leave JALSOL.</p>
              <a
                className="button gold jal-coin-action"
                href={JAL_COIN.raydiumSwapUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Raydium
              </a>
            </div>
          </section>

          <section className="jal-bay jal-bay-wide jal-signal-log" aria-label="Follow The Signals">
            <div className="jal-bay-head">
              <div>
                <div className="jal-bay-title">Follow The Signals</div>
                <div className="jal-bay-note">Simple public build updates</div>
              </div>
              <div className="jal-proof-timestamp">Public build log</div>
            </div>

            <div className="jal-signal-grid" role="list" aria-label="JAL/SOL build signals">
              {JAL_COIN.signalLogItems.map((signal) => (
                <article className="jal-signal-card" key={signal.id} role="listitem">
                  <div className="jal-signal-top">
                    <span className="jal-signal-code">{signal.id}</span>
                    <span className={`jal-signal-status is-${signal.status.toLowerCase()}`}>
                      {signal.status}
                    </span>
                  </div>
                  <h2>{signal.title}</h2>
                  <p>{signal.summary}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="jal-bay jal-bay-wide jal-support-build" aria-label="Support The Build">
            <div className="jal-support-copy">
              <div className="home-kicker">Support The Build</div>
              <h2 className="home-modules-title">{JAL_COIN.supportBoundaryCopy.title}</h2>
              <p className="home-modules-lead">{JAL_COIN.supportBoundaryCopy.lead}</p>
              <ul className="jal-support-list">
                {JAL_COIN.supportBoundaryCopy.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="jal-links">
                <JalCoinActions />
                <Link className="button ghost" to="/app/disclaimer">
                  Read The Details
                </Link>
              </div>
            </div>

            <div className="jal-support-terminal" aria-label="Support wallet">
              <div className="jal-terminal-kicker">Support Wallet</div>
              <div className="jal-terminal-address">{shortAddress(JAL_COIN.liquiditySupportWallet)}</div>
              <button
                type="button"
                className="button ghost"
                onClick={() => copyValue("support-wallet", JAL_COIN.liquiditySupportWallet)}
              >
                {copiedItemId === "support-wallet" ? "Wallet Copied" : "Copy Support Wallet"}
              </button>
            </div>
          </section>

          <section className="jal-bay jal-bay-wide jal-arcade-preview" aria-label="JALSOL Arcade">
            <div className="jal-bay-head">
              <div>
                <div className="jal-bay-title">{arcadeCopy.title}</div>
                <div className="jal-bay-note">Browser terminal</div>
              </div>
              <div className="jal-proof-timestamp">Crown Scan live</div>
            </div>

            <div className="jal-arcade-preview-copy">
              <h2>{arcadeCopy.line}</h2>
              <p>{arcadeCopy.lead}</p>
            </div>

            <div className="jal-arcade-module-grid" role="list" aria-label="JALSOL Arcade modules">
              {arcadeModuleItems.map((item) => (
                <article
                  className={`jal-arcade-module-card ${item.available ? "is-live" : "is-coming-soon"}`}
                  key={item.id}
                  role="listitem"
                >
                  <div className="jal-arcade-card-top">
                    <span>{item.eyebrow}</span>
                    <span className="jal-arcade-status">{item.status}</span>
                  </div>
                  <h2>{item.title}</h2>
                  <p>{item.summary}</p>
                  <div className="jal-arcade-command">{item.command}</div>
                  <div className="jal-arcade-card-actions">
                    <Link className={item.available ? "button gold" : "button ghost"} to={item.route}>
                      {item.available ? "Start Scan" : "Coming Soon"}
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div className="jal-practice-footer">
              <p>Enter the terminal, clear the scan, then come back to the public record.</p>
              <Link className="button gold jal-coin-action" to="/app/jal-sol/arcade">
                Enter Arcade
              </Link>
            </div>
          </section>

          <section className="jal-bay jal-bay-wide jal-builder-path" aria-label="More Coming Soon">
            <div className="jal-bay-head">
              <div>
                <div className="jal-bay-title">More Coming Soon</div>
                <div className="jal-bay-note">Future public tools stay locked until ready</div>
              </div>
              <div className="jal-proof-timestamp">Arcade Coming Soon</div>
            </div>

            <div className="jal-gate-grid">
              {BUILDER_PATH.map((gate) => (
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
                      View Coming Soon
                    </button>
                  </div>
                </article>
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
