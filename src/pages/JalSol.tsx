import { useMemo } from "react";

type Link = {
  label: string;
  href: string;
};

type Level = {
  id: string;
  number: string;
  title: string;
  state: "open" | "paid" | "locked" | "invite";
  price: string;
  outcome: string;
  body: string;
  cta: string;
};

function QuickLinks({ links }: { links: Link[] }) {
  return (
    <div className="jal-links" aria-label="JAL/SOL quick links">
      {links.map((link) => (
        <a
          key={link.href}
          className="chip"
          href={link.href}
          target="_blank"
          rel="noreferrer"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

function LevelCard({
  level,
  stripeLink,
}: {
  level: Level;
  stripeLink: string;
}) {
  const stateLabel =
    level.state === "open"
      ? "Open Access"
      : level.state === "paid"
      ? "Paid Access"
      : level.state === "invite"
      ? "Invite Only"
      : "Locked";

  const disabled = level.state === "locked" || level.state === "invite";

  return (
    <article
      className={`jal-level-card is-${level.state}`}
      aria-label={`${level.title} ${stateLabel}`}
    >
      <div className="jal-level-top">
        <div className="jal-level-number">LEVEL {level.number}</div>
        <div className={`jal-level-state is-${level.state}`}>{stateLabel}</div>
      </div>

      <h3 className="jal-level-title">{level.title}</h3>
      <div className="jal-level-price">{level.price}</div>
      <p className="jal-level-outcome">{level.outcome}</p>
      <p className="jal-level-body">{level.body}</p>

      {level.state === "open" && (
        <button
          type="button"
          className="button neon"
          onClick={() => {
            document
              .getElementById("level-0-section")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          {level.cta}
        </button>
      )}

      {level.state === "paid" && (
        <a
          className="button"
          href={stripeLink}
          target="_blank"
          rel="noreferrer"
        >
          {level.cta}
        </a>
      )}

      {disabled && (
        <button
          type="button"
          className="button ghost"
          onClick={() => window.alert("Access locked. Complete the previous level first.")}
        >
          {level.cta}
        </button>
      )}
    </article>
  );
}

export default function JalSol() {
  const JAL_MINT = "9TCwNEKKPPgZBQ3CopjdhW9j8fZNt8SH7waZJTFRgx7v";
  const STRIPE_LEVEL_1 = "https://buy.stripe.com/dRmaEW5h62JRfgX8AA0x201";

  const links = useMemo<Link[]>(
    () => [
      {
        label: "Solscan",
        href: `https://solscan.io/token/${JAL_MINT}`,
      },
      {
        label: "Birdeye",
        href: `https://birdeye.so/token/${JAL_MINT}?chain=solana`,
      },
      {
        label: "Jupiter",
        href: `https://jup.ag/tokens/${JAL_MINT}`,
      },
      {
        label: "Phantom",
        href: "https://phantom.app/",
      },
    ],
    []
  );

  const levels = useMemo<Level[]>(
    () => [
      {
        id: "lvl0",
        number: "0",
        title: "Awareness",
        state: "open",
        price: "Free",
        outcome:
          "Understand what crypto is, why most people enter wrong, and what order actually matters.",
        body:
          "This is the surface layer. CEX vs DEX, custody, basic risk, and why sequence matters before movement.",
        cta: "Enter Level 0",
      },
      {
        id: "lvl1",
        number: "1",
        title: "Entry",
        state: "paid",
        price: "$19",
        outcome:
          "Complete your first intentional move: exchange setup, wallet setup, and initial transfer flow.",
        body:
          "This is the first paid initiation. Not theory for entertainment. Structured guidance toward correct first execution.",
        cta: "Unlock Level 1",
      },
      {
        id: "lvl2",
        number: "2",
        title: "Orientation",
        state: "locked",
        price: "$49",
        outcome:
          "Understand Solana, tokens, liquidity, swaps, and how market routing actually works.",
        body:
          "This layer explains the board itself: wallets, network behaviour, token pairs, and DEX function.",
        cta: "Locked",
      },
      {
        id: "lvl3",
        number: "3",
        title: "Control",
        state: "locked",
        price: "$99",
        outcome:
          "Move from reaction to structure through sizing, rules, and emotional control.",
        body:
          "This is where gambling ends. Sequence, discipline, and system thinking begin here.",
        cta: "Locked",
      },
      {
        id: "lvl4",
        number: "4",
        title: "System Access",
        state: "invite",
        price: "Premium",
        outcome:
          "See the machine behind the market and how a system-based operator thinks.",
        body:
          "This tier introduces the deeper logic layer behind JALSOL and future engine-aligned participation.",
        cta: "Invite Only",
      },
    ],
    []
  );

  return (
    <main className="home-shell jal-shell" aria-label="JAL/SOL">
      <div className="home-wrap">
        <section className="card machine-surface panel-frame jal-window">
          <div className="jal-hero">
            <div className="jal-hero-top">
              <div className="jal-kicker">JAL / SOL</div>

              <div className="jal-status">
                <span className="jal-status-dot" aria-hidden="true" />
                <span className="jal-status-text">Initiation Layer</span>
              </div>
            </div>

            <h1 className="home-title jal-title">Enter the System</h1>

            <p className="home-lead jal-lead">
              Most people enter crypto in the wrong order.
              This is the controlled path in.
            </p>

            <p className="jal-sublead">
              JAL/SOL is the bridge layer between curiosity and structured participation.
              Not noise. Not hype. Correct order.
            </p>

            <QuickLinks links={links} />
          </div>

          <div className="jal-identity-band" aria-label="Identity statement">
            <div className="jal-identity-copy">
              <span className="jal-identity-line">This is not for everyone.</span>
              <span className="jal-identity-sub">
                Verification before movement. Structure before access.
              </span>
            </div>
          </div>

          <div className="jal-grid" aria-label="JAL/SOL initiation console">
            <section className="jal-bay jal-bay-wide" aria-label="Progression map">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Initiation Path</div>
                <div className="jal-bay-note">Structured progression</div>
              </div>

              <p className="jal-note">
                Access unlocks in sequence.
              </p>

              <div className="jal-level-rail">
                {levels.map((level) => (
                  <LevelCard
                    key={level.id}
                    level={level}
                    stripeLink={STRIPE_LEVEL_1}
                  />
                ))}
              </div>
            </section>

            <section
              id="level-0-section"
              className="jal-bay"
              aria-label="Level zero preview"
            >
              <div className="jal-bay-head">
                <div className="jal-bay-title">Level 0</div>
                <div className="jal-bay-note">Open access</div>
              </div>

              <ol className="jal-steps" aria-label="Level 0 contents">
                <li>
                  What crypto is.
                  <span className="jal-step-sub">
                    Separate noise, speculation, and actual utility.
                  </span>
                </li>
                <li>
                  Why most people lose.
                  <span className="jal-step-sub">
                    Wrong order, wrong expectations, wrong behaviour.
                  </span>
                </li>
                <li>
                  CEX vs DEX.
                  <span className="jal-step-sub">
                    Understand the difference before touching capital.
                  </span>
                </li>
                <li>
                  Sequence first.
                  <span className="jal-step-sub">
                    Move correctly, not quickly.
                  </span>
                </li>
              </ol>

              <div className="jal-bay-actions">
                <button
                  type="button"
                  className="button neon"
                  onClick={() => {
                    document
                      .getElementById("verification-section")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  Continue
                </button>
              </div>
            </section>

            <section className="jal-bay" aria-label="Level one preview">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Level 1</div>
                <div className="jal-bay-note">First paid initiation</div>
              </div>

              <ol className="jal-steps" aria-label="Level 1 contents">
                <li>
                  Create exchange account.
                  <span className="jal-step-sub">
                    Establish the fiat-to-crypto bridge properly.
                  </span>
                </li>
                <li>
                  Set up Phantom wallet.
                  <span className="jal-step-sub">
                    Secure the wallet before any transfer.
                  </span>
                </li>
                <li>
                  Understand fees and spread.
                  <span className="jal-step-sub">
                    Do not confuse movement with value.
                  </span>
                </li>
                <li>
                  Complete first controlled move.
                  <span className="jal-step-sub">
                    One intentional step into the system.
                  </span>
                </li>
              </ol>

              <p className="jal-lock-text">
                Entry into this level is intentional.
                Most people do not proceed.
              </p>

              <div className="jal-bay-actions">
                <a
                  className="button neon"
                  href={STRIPE_LEVEL_1}
                  target="_blank"
                  rel="noreferrer"
                >
                  Unlock Level 1
                </a>
              </div>
            </section>

            <section
              id="verification-section"
              className="jal-bay jal-bay-wide"
              aria-label="Verification bay"
            >
              <div className="jal-bay-head">
                <div className="jal-bay-title">Verification</div>
                <div className="jal-bay-note">Canonical references</div>
              </div>

              <div className="jal-bullets">
                <div className="jal-bullet">
                  <div className="jal-bullet-k">JAL Mint</div>
                  <div className="jal-bullet-v is-mono">{JAL_MINT}</div>
                </div>

                <div className="jal-bullet">
                  <div className="jal-bullet-k">Liquidity State</div>
                  <div className="jal-bullet-v">
                    No public pool. Controlled entry phase.
                  </div>
                </div>

                <div className="jal-bullet">
                  <div className="jal-bullet-k">Role</div>
                  <div className="jal-bullet-v">
                    This page is the public proof layer for entry, routing, and later checkout.
                  </div>
                </div>
              </div>
            </section>

            <section className="jal-bay jal-bay-wide" aria-label="Market state">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Market State</div>
                <div className="jal-bay-note">Current condition</div>
              </div>

              <p className="jal-note">
                Supply is intentionally concentrated during early phases.
                This is a controlled system, not an open market.
              </p>

              <div className="jal-bullets">
                <div className="jal-bullet">
                  <div className="jal-bullet-k">Status</div>
                  <div className="jal-bullet-v">Pre-market / low liquidity</div>
                </div>

                <div className="jal-bullet">
                  <div className="jal-bullet-k">Access</div>
                  <div className="jal-bullet-v">
                    Available via aggregator routing through Jupiter.
                  </div>
                </div>

                <div className="jal-bullet">
                  <div className="jal-bullet-k">Design</div>
                  <div className="jal-bullet-v">
                    Structured system entry, not speculative trading.
                  </div>
                </div>
              </div>

              <div className="jal-bay-actions">
                <a
                  className="button"
                  href={`https://jup.ag/tokens/${JAL_MINT}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Route via Jupiter
                </a>

                <a
                  className="button ghost"
                  href={`https://solscan.io/token/${JAL_MINT}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Verify on Solscan
                </a>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}