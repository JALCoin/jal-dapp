// src/pages/Shop.tsx
import { Link } from "react-router-dom";

export default function Shop() {
  return (
    <main className="landing-gradient">
      <div className="container" style={{ padding: 24 }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Shop</h2>
          <p className="muted" style={{ marginTop: 6 }}>
            Payments are <strong>coming soon</strong>. Browse the preview and start creating with JAL/SOL.
          </p>

          {/* Promo: Create with JAL/SOL */}
          <section
            className="shop-promo has-art"
            style={
              {
                ["--art-img" as any]: `url('/fdfd19ca-7b20-42d8-b430-4ca75a94f0eb.png')`,
                ["--art-pos" as any]: "58% 42%",
                ["--art-zoom" as any]: "220%",
              } as React.CSSProperties
            }
            role="region"
            aria-label="Create with JAL/SOL"
          >
            <div className="shop-promo-inner">
              <div className="promo-head">
                <span className="promo-badge">NEW</span>
                <h4 className="promo-title">Create with JAL/SOL</h4>
              </div>
              <p className="promo-sub">Pick what you’re launching. We’ll guide you, step by step.</p>

              <div className="product-grid" style={{ marginTop: 8 }}>
                {/* ===== Fungible Token ===== */}
                <article className="product-card" aria-labelledby="tok-title">
                  <div className="product-body">
                    <h4 id="tok-title" className="product-title">Currency / Token (Fungible)</h4>

                    <div className="product-blurb">
                      <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                        <li><strong>What it is:</strong> interchangeable units — every token is equal (1 JAL = 1 JAL).</li>
                        <li><strong>Best for:</strong> points &amp; rewards, community/memecoins, governance voting.</li>
                        <li><strong>You control:</strong> total supply, mint authority, and distribution.</li>
                      </ul>
                      <div className="muted" style={{ marginTop: 8 }}>
                        <em>JAL/SOL:</em> Create your own digital economy — mint value people can hold, trade, and align with.
                      </div>
                    </div>

                    <div className="muted" style={{ marginTop: 8 }}>
                      Creates: <strong>SPL Mint</strong> + <strong>Associated Token Account</strong> + <strong>Metadata</strong>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <Link className="button gold" to="/crypto-generator/engine#step1" aria-label="Start a fungible token">
                        Start Token
                      </Link>
                    </div>

                    <div className="chip-row" style={{ marginTop: 10 }}>
                      <span className="chip">Loyalty</span>
                      <span className="chip">Governance</span>
                      <span className="chip">Memecoin</span>
                    </div>
                  </div>
                </article>

                {/* ===== NFT ===== */}
                <article className="product-card" aria-labelledby="nft-title">
                  <div className="product-body">
                    <h4 id="nft-title" className="product-title">NFT / Asset (Non-Fungible)</h4>

                    <div className="product-blurb">
                      <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                        <li><strong>What it is:</strong> unique items or passes (1/1 or limited series), not interchangeable.</li>
                        <li><strong>Best for:</strong> art drops, membership &amp; access, collectibles.</li>
                        <li><strong>You control:</strong> artwork &amp; metadata stored on-chain via Lighthouse/IPFS.</li>
                      </ul>
                      <div className="muted" style={{ marginTop: 8 }}>
                        <em>JAL/SOL:</em> Turn moments into ownership — a signed digital artifact the network remembers.
                      </div>
                    </div>

                    <div className="muted" style={{ marginTop: 8 }}>
                      Creates: <strong>NFT Mint(s)</strong> + <strong>Collection Metadata</strong>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <Link className="button neon" to="/crypto-generator" aria-label="Start an NFT">
                        Start NFT
                      </Link>
                    </div>

                    <div className="chip-row" style={{ marginTop: 10 }}>
                      <span className="chip">Art</span>
                      <span className="chip">Membership</span>
                      <span className="chip">Access Pass</span>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </section>

          {/* Catalog preview */}
          <div style={{ marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Catalog (Preview)</h3>
            <div className="product-grid" role="list" style={{ marginTop: 14 }}>
              {[
                { id: "hoodie", name: "JAL Hoodie", tag: "Merch" },
                { id: "cap", name: "Logo Cap", tag: "Merch" },
                { id: "stickers", name: "Sticker Pack", tag: "Merch" },
                { id: "gift25", name: "Gift Card 25", tag: "Gift Cards" },
                { id: "gift50", name: "Gift Card 50", tag: "Gift Cards" },
                { id: "wallpaper", name: "Phone Wallpaper", tag: "Digital" },
              ].map((p) => (
                <article key={p.id} className="product-card" role="listitem" aria-label={p.name}>
                  <div className="product-media noimg">
                    <span className="badge soon">Coming&nbsp;soon</span>
                  </div>
                  <div className="product-body">
                    <h4 className="product-title">{p.name}</h4>
                    <div className="product-price">
                      <span className="muted">• {p.tag}</span>
                    </div>
                    <button
                      type="button"
                      className="button"
                      aria-disabled="true"
                      title="Checkout not available yet"
                    >
                      Pay with JAL
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
