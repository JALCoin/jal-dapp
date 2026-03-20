import { useEffect, useMemo, useState } from "react";
import { readLevel1Access } from "../lib/access";

type FreeModule = {
  id: string;
  title: string;
  note: string;
  cta: string;
  href?: string;
};

type Sector = {
  id: string;
  level: string;
  title: string;
  state: "free" | "available" | "locked" | "active";
  note: string;
  description: string;
  actionLabel: string;
  href?: string;
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

export default function JalSolPage() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletLabel, setWalletLabel] = useState("Not connected");
  const [level1Unlocked, setLevel1Unlocked] = useState(false);

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

  function connectWallet() {
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
    window.localStorage.removeItem("jal_wallet_label");
    setWalletConnected(false);
    setWalletLabel("Not connected");
  }

  const sectors = useMemo<Sector[]>(
    () => [
      {
        id: "ground-zero",
        level: "LEVEL 0",
        title: "Ground Zero",
        state: "active",
        note: "Current hub",
        description:
          "The main terminal. Orientation, free learning, access control, and system return point.",
        actionLabel: "Current Sector",
        featured: true,
      },
      {
        id: "level-1",
        level: "LEVEL 1",
        title: "Entry",
        state: level1Unlocked ? "active" : "available",
        note: level1Unlocked ? "Access granted" : "Paid unlock",
        description:
          "Your first controlled movement into the system. Exchange, wallet, custody, and first correct actions.",
        actionLabel: level1Unlocked ? "Resume Level 1" : "Unlock Level 1",
        href: level1Unlocked ? "/app/jal-sol/level-1" : "/app/shop",
        featured: true,
      },
      {
        id: "level-2",
        level: "LEVEL 2",
        title: "Movement",
        state: "locked",
        note: "Locked sector",
        description:
          "Transfer routes, wallet behavior, and asset movement between points of control.",
        actionLabel: "Locked",
      },
      {
        id: "level-3",
        level: "LEVEL 3",
        title: "Execution",
        state: "locked",
        note: "Locked sector",
        description:
          "DEX behavior, swaps, slippage awareness, and execution without chaos.",
        actionLabel: "Locked",
      },
      {
        id: "level-4",
        level: "LEVEL 4",
        title: "Structure",
        state: "locked",
        note: "Locked sector",
        description:
          "System intent, value accumulation, and identity formed through repeated correct action.",
        actionLabel: "Locked",
      },
    ],
    [level1Unlocked]
  );

  const nextGateLabel = level1Unlocked ? "Resume Entry" : "Unlock Level 1";
  const groundStatus = walletConnected ? "Identity recognised" : "Awaiting link";
  const sessionState = level1Unlocked ? "Level 1 session stored" : "Ground Zero session only";

  return (
    <main className="home-shell jal-shell" aria-label="JAL/SOL Ground Zero">
      <div className="home-wrap">
        <section className="card machine-surface panel-frame jal-window jal-ground-zero">
          <header className="jal-ground-terminal">
            <div className="jal-ground-terminal-bar">
              <div className="jal-kicker">GROUND ZERO</div>
              <div className="jal-ground-terminal-state">SYSTEM ONLINE</div>
            </div>

            <div className="jal-ground-terminal-core">
              <section className="jal-ground-terminal-copy">
                <div className="jal-ground-mini-label">WORLD HUB</div>
                <h1 className="home-title">JAL/SOL</h1>

                <div className="jal-ground-center-band">
                  <div className="jal-ground-band-line" />
                  <div className="jal-ground-band-text">CENTRAL TERMINAL</div>
                  <div className="jal-ground-band-line" />
                </div>

                <p className="home-lead">
                  The entrance terminal to a digital open world where identity,
                  access, and value begin to take form.
                </p>

                <p className="jal-sublead">
                  Learn the rules for free. Unlock each level to proceed.
                  Return here to re-orient, resume access, and move correctly.
                </p>

                <div className="jal-ground-actions">
                  <button
                    type="button"
                    className="button neon"
                    onClick={() => {
                      if (level1Unlocked) {
                        window.location.href = "/app/jal-sol/level-1";
                        return;
                      }
                      window.location.href = "/app/shop";
                    }}
                  >
                    {level1Unlocked ? "Resume Level 1" : "Unlock Level 1"}
                  </button>

                  {!walletConnected ? (
                    <button
                      type="button"
                      className="button ghost"
                      onClick={connectWallet}
                    >
                      Connect Wallet
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="button ghost"
                      onClick={disconnectWallet}
                    >
                      Disconnect Wallet
                    </button>
                  )}

                  <a className="button ghost" href="#free-learning-district">
                    Free Learning
                  </a>

                  <a className="button ghost" href="/app/nav">
                    System Nav
                  </a>
                </div>
              </section>

              <aside className="jal-ground-identity-panel" aria-label="Identity Node">
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
                    <span className="jal-status-value">
                      {level1Unlocked ? "Level 1 unlocked" : "Ground Zero only"}
                    </span>
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

                <div className="jal-ground-node-actions">
                  <a className="button ghost" href="/app/shop">
                    Access Store
                  </a>
                </div>
              </aside>
            </div>
          </header>

          <section className="jal-ground-progress-rail" aria-label="Progress Rail">
            <div className="jal-ground-progress-head">
              <div className="jal-bay-title">Progress Rail</div>
              <div className="jal-bay-note">District progression</div>
            </div>

            <div className="jal-progress-track">
              <div className="jal-progress-stop state-active">
                <span className="jal-progress-step">L0</span>
                <span className="jal-progress-name">Ground Zero</span>
                <span className="jal-progress-note">Active</span>
              </div>

              <div className={`jal-progress-stop ${level1Unlocked ? "state-active" : "state-available"}`}>
                <span className="jal-progress-step">L1</span>
                <span className="jal-progress-name">Entry</span>
                <span className="jal-progress-note">
                  {level1Unlocked ? "Unlocked" : "Available"}
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

          <div className="jal-grid jal-ground-layout">
            <section className="jal-bay jal-bay-wide jal-world-map">
              <div className="jal-bay-head">
                <div className="jal-bay-title">World Map</div>
                <div className="jal-bay-note">Sector access grid</div>
              </div>

              <div className="jal-sector-grid">
                {sectors.map((sector) => (
                  <article
                    key={sector.id}
                    className={`jal-sector-card state-${sector.state}${sector.featured ? " featured-sector" : ""}`}
                  >
                    <div className="jal-sector-top">
                      <div>
                        <div className="jal-sector-level">{sector.level}</div>
                        <h3 className="jal-sector-title">{sector.title}</h3>
                      </div>
                      <div className="jal-sector-state">{sector.note}</div>
                    </div>

                    <p className="jal-sector-copy">{sector.description}</p>

                    <div className="jal-sector-actions">
                      {sector.href ? (
                        <a className="button ghost" href={sector.href}>
                          {sector.actionLabel}
                        </a>
                      ) : (
                        <button type="button" className="button ghost" disabled>
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
              className="jal-bay jal-bay-wide jal-learning-district"
            >
              <div className="jal-bay-head">
                <div className="jal-bay-title">Free Learning District</div>
                <div className="jal-bay-note">Training zone</div>
              </div>

              <p className="jal-note">
                Ground Zero stays open. Anyone can learn the basics here before
                deciding whether to move deeper into the system.
              </p>

              <div className="jal-learning-grid">
                {FREE_MODULES.map((module) => (
                  <article key={module.id} className="jal-learning-card">
                    <div className="jal-learning-meta">OPEN MODULE</div>
                    <h3 className="jal-learning-title">{module.title}</h3>
                    <p className="jal-learning-note">{module.note}</p>

                    <div className="jal-learning-actions">
                      {module.href ? (
                        <a className="button ghost" href={module.href}>
                          {module.cta}
                        </a>
                      ) : (
                        <button type="button" className="button ghost">
                          {module.cta}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="jal-bay jal-philosophy-panel">
              <div className="jal-bay-head">
                <div className="jal-bay-title">System Intent</div>
                <div className="jal-bay-note">Order before outcome</div>
              </div>

              <p className="jal-note">
                JAL/SOL is a path of structured progression. People do not lose
                because they never move. They lose because they move without
                order. Here, identity is shaped through correct action and value
                is accumulated through repeated alignment.
              </p>
            </section>

            <section className="jal-bay jal-return-hub">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Return Hub</div>
                <div className="jal-bay-note">Resume point</div>
              </div>

              <p className="jal-note">
                Ground Zero is the persistent zone you return to when you need
                to reconnect, check access, and decide your next move.
              </p>

              <div className="jal-bay-actions">
                <a className="button ghost" href="/app/home">
                  Return to App Home
                </a>
                <a className="button ghost" href="/app/shop">
                  View Paid Access Layers
                </a>
              </div>
            </section>
          </div>

          <div className="jal-terminal-strip" aria-hidden="true">
            <span>GROUND ZERO ACTIVE</span>
            <span>IDENTITY {walletConnected ? "LINKED" : "OFFLINE"}</span>
            <span>ACCESS {level1Unlocked ? "L1 UNLOCKED" : "L0 ONLY"}</span>
          </div>
        </section>
      </div>
    </main>
  );
}