import { useEffect, useState } from "react";
import { clearLevel1Access, readLevel1Access } from "../lib/access";

export default function JalSolLevel1() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const access = readLevel1Access();

    if (!access?.sessionId) {
      window.location.href = "/app/jal-sol";
      return;
    }

    setReady(true);
  }, []);

  if (!ready) {
    return (
      <main className="home-shell jal-shell" aria-label="JAL/SOL Level 1">
        <div className="home-wrap">
          <section className="card machine-surface panel-frame jal-window">
            <div className="jal-hero">
              <div className="jal-kicker">LEVEL 1</div>
              <h1 className="home-title">Verifying Access</h1>
              <p className="home-lead">Checking your passage from Level 0...</p>
              <p className="jal-sublead">Hold position. Correct order comes first.</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="home-shell jal-shell" aria-label="JAL/SOL Level 1">
      <div className="home-wrap">
        <section className="card machine-surface panel-frame jal-window">
          <div className="jal-hero">
            <div className="jal-kicker">LEVEL 1</div>
            <h1 className="home-title">Entry</h1>

            <p className="home-lead">
              This is your first controlled movement into the market.
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
                You need a centralised entry point to convert fiat into crypto.
                This is not the final destination. It is only the bridge.
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
                If it stays on an exchange, it is not fully under your control.
                Your wallet is where responsibility begins.
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
                Move a small amount first. Do not test confidence with size.
                Test the process with precision.
              </p>
            </section>

            <section className="jal-bay jal-bay-wide">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Step 4 — First Move</div>
                <div className="jal-bay-note">Controlled action</div>
              </div>

              <p className="jal-note">
                Your first move is not about winning. It is about proving you
                can move correctly without confusion.
              </p>
            </section>

            <section className="jal-bay jal-bay-wide">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Step 5 — Position</div>
                <div className="jal-bay-note">Awareness</div>
              </div>

              <p className="jal-note">
                Once you understand exchange, wallet, and transfer, you stop
                behaving like a spectator. You begin acting with structure.
              </p>
            </section>

            <section className="jal-bay">
              <div className="jal-bay-actions">
                <a className="button ghost" href="/app/jal-sol">
                  Back to Level 0
                </a>

                <button
                  type="button"
                  className="button ghost"
                  onClick={() => {
                    clearLevel1Access();
                    window.location.href = "/app/jal-sol";
                  }}
                >
                  Clear Access
                </button>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}