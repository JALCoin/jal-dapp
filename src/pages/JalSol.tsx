import { useEffect, useMemo, useState } from "react";
import { readLevel1Access } from "../lib/access";

type FreeModule = {
  id: string;
  title: string;
  note: string;
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
};

const FREE_MODULES: FreeModule[] = [
  {
    id: "what-is-crypto",
    title: "What Is Crypto?",
    note: "Digital value, ownership, and transfer basics.",
  },
  {
    id: "cex-vs-dex",
    title: "CEX vs DEX",
    note: "Centralised bridges versus self-directed execution.",
  },
  {
    id: "wallet-custody",
    title: "Wallets & Custody",
    note: "Why control matters more than convenience.",
  },
  {
    id: "seed-phrases",
    title: "Seed Phrases",
    note: "The line between access and permanent loss.",
  },
  {
    id: "solana-basics",
    title: "Solana Basics",
    note: "Accounts, transactions, fees, and movement.",
  },
  {
    id: "first-transfer",
    title: "First Transfer",
    note: "Why small controlled movement beats blind size.",
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
        state: "free",
        note: "Main hub",
        description:
          "The central terminal. Learn the rules, orient yourself, and return here whenever you need structure.",
        actionLabel: "You Are Here",
      },
      {
        id: "level-1",
        level: "LEVEL 1",
        title: "Entry",
        state: level1Unlocked ? "active" : "available",
        note: level1Unlocked ? "Access granted" : "Paid unlock",
        description:
          "Your first controlled movement into the system. Exchange, wallet, custody, and the first correct steps.",
        actionLabel: level1Unlocked ? "Enter Level 1" : "Unlock Level 1",
        href: level1Unlocked ? "/app/jal-sol/level-1" : "/app/shop",
      },
      {
        id: "level-2",
        level: "LEVEL 2",
        title: "Movement",
        state: "locked",
        note: "Future sector",
        description:
          "Transfer routes, wallet behavior, and correct asset movement between points of control.",
        actionLabel: "Locked",
      },
      {
        id: "level-3",
        level: "LEVEL 3",
        title: "Execution",
        state: "locked",
        note: "Future sector",
        description:
          "DEX behavior, swaps, slippage awareness, and execution without chaos.",
        actionLabel: "Locked",
      },
      {
        id: "level-4",
        level: "LEVEL 4",
        title: "Structure",
        state: "locked",
        note: "Future sector",
        description:
          "System intent, value accumulation logic, and the development of digital identity through repeated correct action.",
        actionLabel: "Locked",
      },
    ],
    [level1Unlocked]
  );

  return (
    <main className="home-shell jal-shell" aria-label="JAL/SOL Ground Zero">
      <div className="home-wrap">
        <section className="card machine-surface panel-frame jal-window jal-ground-zero">
          <div className="jal-hero jal-ground-zero-hero">
            <div className="jal-kicker">GROUND ZERO</div>
            <h1 className="home-title">JAL/SOL</h1>

            <p className="home-lead">
              The entrance terminal to a digital open world where identity,
              access, and value begin to take form.
            </p>

            <p className="jal-sublead">
              Learn the rules for free. Unlock each level to proceed. Return
              here to navigate the system, resume access, and move correctly.
            </p>
          </div>

          <div className="jal-grid">
            <section className="jal-bay jal-bay-wide jal-terminal-panel">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Arrival Terminal</div>
                <div className="jal-bay-note">System online</div>
              </div>

              <p className="jal-note">
                This is not a generic crypto page. This is the main world hub.
                Digital signals meet real-world value here through access,
                structure, and controlled movement.
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
                  {level1Unlocked ? "Resume Level 1" : "Unlock Next Level"}
                </button>

                <button
                  type="button"
                  className="button ghost"
                  onClick={() => {
                    window.location.href = "/app/shop";
                  }}
                >
                  Open Access Store
                </button>

                <button
                  type="button"
                  className="button ghost"
                  onClick={() => {
                    window.location.href = "/app/nav";
                  }}
                >
                  Open System Nav
                </button>
              </div>
            </section>

            <section className="jal-bay jal-terminal-status">
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
                  <span className="jal-status-value">
                    {walletConnected ? "Identity recognised" : "Awaiting link"}
                  </span>
                </div>

                <div className="jal-status-row">
                  <span className="jal-status-label">Current Access</span>
                  <span className="jal-status-value">
                    {level1Unlocked ? "Level 1 unlocked" : "Ground Zero only"}
                  </span>
                </div>

                <div className="jal-status-row">
                  <span className="jal-status-label">Next Gate</span>
                  <span className="jal-status-value">
                    {level1Unlocked ? "Resume Entry" : "Unlock Level 1"}
                  </span>
                </div>
              </div>

              <div className="jal-bay-actions">
                {!walletConnected ? (
                  <button
                    type="button"
                    className="button neon"
                    onClick={connectWallet}
                  >
                    Connect Wallet Identity
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
              </div>
            </section>

            <section className="jal-bay jal-bay-wide jal-world-map">
              <div className="jal-bay-head">
                <div className="jal-bay-title">World Map</div>
                <div className="jal-bay-note">Access sectors</div>
              </div>

              <div className="jal-sector-grid">
                {sectors.map((sector) => (
                  <article
                    key={sector.id}
                    className={`jal-sector-card state-${sector.state}`}
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
                        <button
                          type="button"
                          className="button ghost"
                          disabled
                        >
                          {sector.actionLabel}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="jal-bay jal-bay-wide jal-learning-district">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Free Learning District</div>
                <div className="jal-bay-note">Open access</div>
              </div>

              <p className="jal-note">
                Ground Zero stays open. Anyone can learn the basics here before
                they decide whether to move deeper into the system.
              </p>

              <div className="jal-learning-grid">
                {FREE_MODULES.map((module) => (
                  <article key={module.id} className="jal-learning-card">
                    <h3 className="jal-learning-title">{module.title}</h3>
                    <p className="jal-learning-note">{module.note}</p>
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
                Ground Zero is where you come back to re-orient, reconnect, and
                decide your next move.
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
        </section>
      </div>
    </main>
  );
}