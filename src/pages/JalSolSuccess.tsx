export default function JalSolSuccess() {
  return (
    <main className="home-shell jal-shell" aria-label="JAL/SOL success">
      <div className="home-wrap">
        <section className="card machine-surface panel-frame jal-window">
          <div className="jal-hero">
            <div className="jal-hero-top">
              <div className="jal-kicker">JAL / SOL</div>

              <div className="jal-status">
                <span className="jal-status-dot" aria-hidden="true" />
                <span className="jal-status-text">Entry Confirmed</span>
              </div>
            </div>

            <h1 className="home-title jal-title">You Entered Level 1</h1>

            <p className="home-lead jal-lead">
              Entry confirmed.
              You have moved past interest and into structured participation.
            </p>

            <p className="jal-sublead">
              This is not the end of the payment flow.
              This is the beginning of the initiation path.
            </p>
          </div>

          <div className="jal-identity-band" aria-label="Success identity statement">
            <div className="jal-identity-copy">
              <span className="jal-identity-line">
                Most people stop at interest. You proceeded.
              </span>
              <span className="jal-identity-sub">
                Continue in order. Move correctly.
              </span>
            </div>
          </div>

          <div className="jal-grid" aria-label="Level 1 success layout">
            <section className="jal-bay" aria-label="Receipt guidance">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Confirmed</div>
                <div className="jal-bay-note">Payment received</div>
              </div>

              <ol className="jal-steps">
                <li>
                  Check your email.
                  <span className="jal-step-sub">
                    Keep your Stripe receipt for reference.
                  </span>
                </li>
                <li>
                  Stay inside sequence.
                  <span className="jal-step-sub">
                    Level 1 is about correct first movement, not speed.
                  </span>
                </li>
                <li>
                  Prepare your wallet path.
                  <span className="jal-step-sub">
                    Phantom and exchange setup come before routing.
                  </span>
                </li>
              </ol>
            </section>

            <section className="jal-bay" aria-label="Next step">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Next Step</div>
                <div className="jal-bay-note">Proceed correctly</div>
              </div>

              <p className="jal-note">
                Level 1 content can now begin. This page marks entry.
                Your next action should be guided wallet and exchange preparation.
              </p>

              <div className="jal-bay-actions">
                <a className="button neon" href="/app/jal-sol">
                  Return to JAL/SOL
                </a>

                <a className="button ghost" href="https://phantom.app/" target="_blank" rel="noreferrer">
                  Get Phantom
                </a>
              </div>
            </section>

            <section className="jal-bay jal-bay-wide" aria-label="Entry statement">
              <div className="jal-bay-head">
                <div className="jal-bay-title">Initiation</div>
                <div className="jal-bay-note">Level 1 active</div>
              </div>

              <div className="jal-bullets">
                <div className="jal-bullet">
                  <div className="jal-bullet-k">State</div>
                  <div className="jal-bullet-v">Level 1 entered</div>
                </div>

                <div className="jal-bullet">
                  <div className="jal-bullet-k">Meaning</div>
                  <div className="jal-bullet-v">
                    You are no longer browsing. You are participating.
                  </div>
                </div>

                <div className="jal-bullet">
                  <div className="jal-bullet-k">Rule</div>
                  <div className="jal-bullet-v">
                    Structure before movement. Verification before action.
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}