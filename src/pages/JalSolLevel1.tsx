export default function JalSolLevel1() {
  return (
    <main className="home-shell jal-shell" aria-label="JAL/SOL Level 1">
      <div className="home-wrap">
        <section className="card machine-surface panel-frame jal-window">
          <div className="jal-hero">
            <div className="jal-kicker">LEVEL 1</div>
            <h1 className="home-title">Entry</h1>

            <p className="home-lead">
              This is your first controlled movement into the system.
            </p>

            <p className="jal-sublead">
              Not speed. Not hype. Correct order.
            </p>
          </div>

          <div className="jal-grid">
            <section className="jal-bay jal-bay-wide">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Step 1 — Exchange</div>
                <div className="jal-bay-note">Fiat bridge</div>
              </div>

              <p className="jal-note">
                You need a fiat → crypto entry point.
              </p>

              <div className="jal-bay-actions">
                <a
                  className="button neon"
                  href="https://www.coinspot.com.au/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open CoinSpot
                </a>
              </div>
            </section>

            <section className="jal-bay jal-bay-wide">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Step 2 — Wallet</div>
                <div className="jal-bay-note">Custody</div>
              </div>

              <p className="jal-note">
                You do not control assets until they are in your wallet.
              </p>

              <div className="jal-bay-actions">
                <a
                  className="button neon"
                  href="https://phantom.app/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Install Phantom
                </a>
              </div>
            </section>

            <section className="jal-bay jal-bay-wide">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Step 3 — Transfer</div>
                <div className="jal-bay-note">Execution</div>
              </div>

              <p className="jal-note">
                Move a small amount first. Learn the process, not the size.
              </p>
            </section>

            <section className="jal-bay jal-bay-wide">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Step 4 — First Move</div>
                <div className="jal-bay-note">Controlled action</div>
              </div>

              <p className="jal-note">
                Your first move is not about profit. It is about correctness.
              </p>
            </section>

            <section className="jal-bay">
              <div className="jal-bay-actions">
                <a className="button ghost" href="/app/jal-sol">
                  Back to JAL/SOL
                </a>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}