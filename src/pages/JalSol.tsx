// src/pages/JalSol.tsx
export default function JalSolPage() {
  return (
    <main className="home-shell" aria-label="JAL/SOL">
      <div className="home-wrap">
        <section className="card machine-surface panel-frame">

          <div className="home-kicker">LIQUIDITY CONSOLE</div>

          <h1 className="home-title">JAL/SOL</h1>

          <p className="home-lead">
            Industrial console showroom for the JAL/SOL pool.
            Verify → route → deploy with order.
          </p>

          <div className="home-links">
            <a className="chip" href="https://raydium.io/" target="_blank" rel="noreferrer">
              Raydium
            </a>
            <a className="chip" href="https://solscan.io/" target="_blank" rel="noreferrer">
              Solscan
            </a>
            <a className="chip" href="https://dexscreener.com/" target="_blank" rel="noreferrer">
              Dexscreener
            </a>
          </div>

          <div className="module-grid" style={{ marginTop: 20 }}>
            <div className="module-card gold">
              <div className="module-kicker">POOL</div>
              <div className="module-title">JAL / SOL Liquidity</div>
              <div className="module-summary">
                Primary swap and LP surface.
              </div>
            </div>

            <div className="module-card cyan">
              <div className="module-kicker">VERIFY</div>
              <div className="module-title">Token Explorer</div>
              <div className="module-summary">
                Confirm mint, holders and transfers.
              </div>
            </div>

            <div className="module-card">
              <div className="module-kicker">MARKET</div>
              <div className="module-title">Price & Chart</div>
              <div className="module-summary">
                External market context.
              </div>
            </div>
          </div>

        </section>
      </div>
    </main>
  );
}