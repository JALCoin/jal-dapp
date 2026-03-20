import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { readLevel1Access } from "../lib/access";

type FreeModule = {
  id: string;
  title: string;
  note: string;
  cta: string;
  href?: string;
};

type SectorState = "active" | "available" | "locked";

type RouteTo =
  | "/app/home"
  | "/app/jal-sol"
  | "/app/jal-sol/level-1"
  | "/app/nav"
  | "/app/shop";

type Sector = {
  id: string;
  level: string;
  title: string;
  state: SectorState;
  shortState: string;
  description: string;
  actionLabel: string;
  href?: RouteTo;
  featured?: boolean;
};

const FREE_MODULES: FreeModule[] = [
  {
    id: "what-is-crypto",
    title: "What Is Crypto?",
    note: "Digital value, ownership, and transfer basics.",
    cta: "Read Module",
  },
  {
    id: "cex-vs-dex",
    title: "CEX vs DEX",
    note: "Centralised bridges versus self-directed execution.",
    cta: "Enter Lesson",
  },
  {
    id: "wallet-custody",
    title: "Wallets & Custody",
    note: "Why control matters more than convenience.",
    cta: "Learn Control",
  },
  {
    id: "seed-phrases",
    title: "Seed Phrases",
    note: "The line between access and permanent loss.",
    cta: "Study Access",
  },
  {
    id: "solana-basics",
    title: "Solana Basics",
    note: "Accounts, transactions, fees, and movement.",
    cta: "Open Basics",
  },
  {
    id: "first-transfer",
    title: "First Transfer",
    note: "Why small controlled movement beats blind size.",
    cta: "View Drill",
  },
];

function getSectorButtonClass(_: SectorState) {
  return "button ghost";
}

export default function JalSolPage() {
  const navigate = useNavigate();
  const timerRef = useRef<number | null>(null);

  const [walletConnected, setWalletConnected] = useState(false);
  const [walletLabel, setWalletLabel] = useState("Not connected");
  const [level1Unlocked, setLevel1Unlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const access = readLevel1Access();
    setLevel1Unlocked(Boolean(access?.sessionId));

    const rememberedWallet =
      window.localStorage.getItem("jal_wallet_label")?.trim() || "";

    if (rememberedWallet) {
      setWalletConnected(true);
      setWalletLabel(rememberedWallet);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  function connectWallet() {
    if (loading) return;

    const existing = window.localStorage.getItem("jal_wallet_label")?.trim();

    if (existing) {
      setWalletConnected(true);
      setWalletLabel(existing);
      return;
    }

    const input = window.prompt(
      "Enter a wallet name or short public label for Ground Zero access."
    );

    if (!input?.trim()) return;

    const label = input.trim();
    window.localStorage.setItem("jal_wallet_label", label);
    setWalletConnected(true);
    setWalletLabel(label);
  }

  function disconnectWallet() {
    if (loading) return;

    window.localStorage.removeItem("jal_wallet_label");
    setWalletConnected(false);
    setWalletLabel("Not connected");
  }

  function beginRoute(to: RouteTo) {
    if (loading) return;

    setLoading(true);

    timerRef.current = window.setTimeout(() => {
      navigate(to);
    }, 5000);
  }

  const sectors = useMemo<Sector[]>(
    () => [
      {
        id: "ground-zero",
        level: "L0",
        title: "Ground Zero",
        state: "active",
        shortState: "Active hub",
        description:
          "Arrival, recognition, orientation, and return-point clarity.",
        actionLabel: "Current Position",
        featured: true,
      },
      {
        id: "level-1",
        level: "L1",
        title: "Entry",
        state: level1Unlocked ? "active" : "available",
        shortState: level1Unlocked ? "Unlocked" : "Next gate",
        description:
          "Exchange, custody, wallet order, and first controlled movement.",
        actionLabel: level1Unlocked ? "Resume Entry" : "Unlock Level 1",
        href: level1Unlocked ? "/app/jal-sol/level-1" : "/app/shop",
        featured: true,
      },
      {
        id: "level-2",
        level: "L2",
        title: "Movement",
        state: "locked",
        shortState: "Distant",
        description:
          "Transfer routes, wallet behaviour, and movement between points of control.",
        actionLabel: "Locked",
      },
      {
        id: "level-3",
        level: "L3",
        title: "Execution",
        state: "locked",
        shortState: "Distant",
        description:
          "DEX behaviour, swaps, slippage awareness, and action without chaos.",
        actionLabel: "Locked",
      },
      {
        id: "level-4",
        level: "L4",
        title: "Structure",
        state: "locked",
        shortState: "Distant",
        description:
          "Identity, value accumulation, and repeated alignment over time.",
        actionLabel: "Locked",
      },
    ],
    [level1Unlocked]
  );

  const primaryActionHref: RouteTo = level1Unlocked
    ? "/app/jal-sol/level-1"
    : "/app/shop";

  const primaryActionLabel = level1Unlocked
    ? "Resume Level 1"
    : "Unlock Level 1";

  const nextGateLabel = level1Unlocked ? "Resume Entry" : "Unlock Level 1";
  const currentAccess = level1Unlocked ? "Level 1 unlocked" : "Ground Zero only";
  const groundStatus = walletConnected ? "Identity recognised" : "Awaiting link";
  const sessionState = level1Unlocked
    ? "Entry session stored"
    : "Ground Zero session only";

  return (
    <main
      className={`home-shell jal-shell jal-ground-page ${
        loading ? "is-fading" : ""
      }`}
      aria-label="JAL/SOL Ground Zero"
    >
      <div className="home-wrap">
        <section className="card machine-surface panel-frame jal-window jal-ground-zero">
          <header className="jal-arrival-chamber" aria-label="Arrival Chamber">
            <div className="jal-ground-terminal-bar">
              <div className="jal-kicker">GROUND ZERO</div>
              <div className="jal-ground-terminal-state">SYSTEM ONLINE</div>
            </div>

            <div className="jal-arrival-grid">
              <section
                className="jal-arrival-copy"
                aria-label="Ground Zero terminal"
              >
                <div className="jal-ground-mini-label">WORLD HUB</div>
                <h1 className="home-title">JAL/SOL</h1>

                <div className="jal-ground-center-band" aria-hidden="true">
                  <div className="jal-ground-band-line" />
                  <div className="jal-ground-band-text">CENTRAL TERMINAL</div>
                  <div className="jal-ground-band-line" />
                </div>

                <p className="home-lead">
                  Enter in order. Identity first. Movement second.
                </p>

                <p className="jal-sublead">
                  Ground Zero is the chamber of recognition. Confirm your
                  position, view the next gate, and proceed only when the route
                  is clear.
                </p>

                <div className="jal-arrival-actions">
                  <button
                    type="button"
                    className="button neon"
                    onClick={() => beginRoute(primaryActionHref)}
                    disabled={loading}
                  >
                    {primaryActionLabel}
                  </button>

                  {!walletConnected ? (
                    <button
                      type="button"
                      className="button ghost"
                      onClick={connectWallet}
                      disabled={loading}
                    >
                      Connect Wallet
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="button ghost"
                      onClick={disconnectWallet}
                      disabled={loading}
                    >
                      Disconnect Wallet
                    </button>
                  )}

                  <a
                    className="button ghost"
                    href="#free-learning-district"
                    aria-disabled={loading}
                    onClick={(event) => {
                      if (loading) event.preventDefault();
                    }}
                  >
                    Free Learning
                  </a>

                  <button
                    type="button"
                    className="button ghost"
                    onClick={() => beginRoute("/app/nav")}
                    disabled={loading}
                  >
                    System Nav
                  </button>
                </div>

                <div className="jal-arrival-note">
                  <span>INTEGRITY UNDER PRESSURE</span>
                  <span>AWARENESS BEFORE MOVEMENT</span>
                  <span>IDENTITY THROUGH TIME</span>
                </div>
              </section>

              <aside
                className="jal-ground-identity-panel jal-identity-console"
                aria-label="Identity Node"
              >
                <div className="jal-bay-head">
                  <div className="jal-bay-title">Identity Node</div>
                  <div className="jal-bay-note">
                    {walletConnected ? "Linked" : "Offline"}
                  </div>
                </div>

                <div className="jal-status-stack">
                  <div className="jal-status-row">
                    <span className="jal-status-label">Wallet</span>
                    <span className="jal-status-value">{walletLabel}</span>
                  </div>

                  <div className="jal-status-row">
                    <span className="jal-status-label">Ground Status</span>
                    <span className="jal-status-value">{groundStatus}</span>
                  </div>

                  <div className="jal-status-row">
                    <span className="jal-status-label">Current Access</span>
                    <span className="jal-status-value">{currentAccess}</span>
                  </div>

                  <div className="jal-status-row">
                    <span className="jal-status-label">Next Gate</span>
                    <span className="jal-status-value">{nextGateLabel}</span>
                  </div>

                  <div className="jal-status-row">
                    <span className="jal-status-label">Session State</span>
                    <span className="jal-status-value">{sessionState}</span>
                  </div>
                </div>

                <div className="jal-identity-focus">
                  <div className="jal-identity-focus-label">
                    Current Position
                  </div>
                  <div className="jal-identity-focus-value">
                    {level1Unlocked
                      ? "Ground Zero / Entry Open"
                      : "Ground Zero / Entry Awaiting Unlock"}
                  </div>
                </div>

                <div className="jal-ground-node-actions">
                  <button
                    type="button"
                    className="button ghost"
                    onClick={() => beginRoute("/app/shop")}
                    disabled={loading}
                  >
                    Access Store
                  </button>
                </div>
              </aside>
            </div>

            <section
              className="jal-ground-progress-rail jal-progress-spine"
              aria-label="Progress Rail"
            >
              <div className="jal-ground-progress-head">
                <div className="jal-bay-title">Progress Spine</div>
                <div className="jal-bay-note">Visible route</div>
              </div>

              <div className="jal-progress-track">
                <div className="jal-progress-stop state-active">
                  <span className="jal-progress-step">L0</span>
                  <span className="jal-progress-name">Ground Zero</span>
                  <span className="jal-progress-note">Active</span>
                </div>

                <div
                  className={`jal-progress-stop ${
                    level1Unlocked ? "state-active" : "state-available"
                  }`}
                >
                  <span className="jal-progress-step">L1</span>
                  <span className="jal-progress-name">Entry</span>
                  <span className="jal-progress-note">
                    {level1Unlocked ? "Unlocked" : "Next"}
                  </span>
                </div>

                <div className="jal-progress-stop state-locked">
                  <span className="jal-progress-step">L2</span>
                  <span className="jal-progress-name">Movement</span>
                  <span className="jal-progress-note">Locked</span>
                </div>

                <div className="jal-progress-stop state-locked">
                  <span className="jal-progress-step">L3</span>
                  <span className="jal-progress-name">Execution</span>
                  <span className="jal-progress-note">Locked</span>
                </div>

                <div className="jal-progress-stop state-locked">
                  <span className="jal-progress-step">L4</span>
                  <span className="jal-progress-name">Structure</span>
                  <span className="jal-progress-note">Locked</span>
                </div>
              </div>
            </section>
          </header>

          <section
            className="jal-route-field jal-bay jal-bay-wide"
            aria-label="Route Field"
          >
            <div className="jal-bay-head">
              <div className="jal-bay-title">Route Field</div>
              <div className="jal-bay-note">
                Visible world / gated distance
              </div>
            </div>

            <p className="jal-note">
              Ground Zero is near. Entry is the next accessible gate. All later
              sectors remain visible, but distant.
            </p>

            <div className="jal-route-map">
              {sectors.map((sector) => (
                <article
                  key={sector.id}
                  className={`jal-route-sector state-${sector.state}${
                    sector.featured ? " featured-sector" : ""
                  }`}
                >
                  <div className="jal-route-sector-head">
                    <div className="jal-route-sector-level">{sector.level}</div>
                    <div className="jal-route-sector-state">
                      {sector.shortState}
                    </div>
                  </div>

                  <h3 className="jal-route-sector-title">{sector.title}</h3>
                  <p className="jal-route-sector-copy">{sector.description}</p>

                  <div className="jal-route-sector-actions">
                    {sector.href ? (
                      <button
                        type="button"
                        className={getSectorButtonClass(sector.state)}
                        onClick={() => beginRoute(sector.href!)}
                        disabled={loading}
                      >
                        {sector.actionLabel}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="button ghost"
                        disabled
                        aria-disabled="true"
                      >
                        {sector.actionLabel}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section
            id="free-learning-district"
            className="jal-learning-district jal-bay jal-bay-wide"
            aria-label="Free Learning District"
          >
            <div className="jal-bay-head">
              <div className="jal-bay-title">Stillness District</div>
              <div className="jal-bay-note">Open training zone</div>
            </div>

            <p className="jal-note">
              Learning remains open. Read before movement. Understand before
              action.
            </p>

            <div className="jal-learning-grid">
              {FREE_MODULES.map((module) => (
                <article key={module.id} className="jal-learning-card">
                  <div className="jal-learning-meta">OPEN MODULE</div>
                  <h3 className="jal-learning-title">{module.title}</h3>
                  <p className="jal-learning-note">{module.note}</p>

                  <div className="jal-learning-actions">
                    {module.href ? (
                      <button
                        type="button"
                        className="button ghost"
                        onClick={() => beginRoute(module.href as RouteTo)}
                        disabled={loading}
                      >
                        {module.cta}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="button ghost"
                        disabled={loading}
                      >
                        {module.cta}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="jal-ground-support">
            <section className="jal-bay jal-philosophy-panel">
              <div className="jal-bay-head">
                <div className="jal-bay-title">System Intent</div>
                <div className="jal-bay-note">Order before outcome</div>
              </div>

              <p className="jal-note">
                JAL/SOL is not random access. It is progression under pressure.
                Awareness produces correct movement. Repeated correct movement
                produces value and identity over time.
              </p>
            </section>

            <section className="jal-bay jal-return-hub">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Return Hub</div>
                <div className="jal-bay-note">Persistent zone</div>
              </div>

              <p className="jal-note">
                Return here whenever clarity is needed. Reconnect, review state,
                confirm access, and choose the next correct move.
              </p>

              <div className="jal-bay-actions">
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => beginRoute("/app/home")}
                  disabled={loading}
                >
                  Return to App Home
                </button>

                <button
                  type="button"
                  className="button ghost"
                  onClick={() => beginRoute("/app/shop")}
                  disabled={loading}
                >
                  View Paid Access Layers
                </button>
              </div>
            </section>
          </section>

          <div className="jal-terminal-strip" aria-hidden="true">
            <span>GROUND ZERO ACTIVE</span>
            <span>IDENTITY {walletConnected ? "LINKED" : "OFFLINE"}</span>
            <span>ACCESS {level1Unlocked ? "L1 UNLOCKED" : "L0 ONLY"}</span>
          </div>
        </section>
      </div>

      {loading && (
        <div
          className="loading-screen"
          role="status"
          aria-label="Loading"
          aria-live="polite"
        >
          <img className="loading-logo" src="/JALSOL1.gif" alt="" />
        </div>
      )}
    </main>
  );
}