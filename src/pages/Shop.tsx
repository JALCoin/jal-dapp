// src/pages/Shop.tsx
import { Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef } from "react";

const CATALOG = [
  { id: "hoodie", name: "JAL Hoodie", tag: "Merch" },
  { id: "cap", name: "Logo Cap", tag: "Merch" },
  { id: "stickers", name: "Sticker Pack", tag: "Merch" },
  { id: "gift25", name: "Gift Card 25", tag: "Gift Cards" },
  { id: "gift50", name: "Gift Card 50", tag: "Gift Cards" },
  { id: "wallpaper", name: "Phone Wallpaper", tag: "Digital" },
] as const;

export default function Shop() {
  const navigate = useNavigate();
  const tokenBtnRef = useRef<HTMLAnchorElement | null>(null);
  const nftBtnRef = useRef<HTMLAnchorElement | null>(null);

  // Prefetch only modules that actually exist
  const prefetchGenerator = useCallback(() => {
    import("../pages/CryptoGenerator").catch(() => {});
  }, []);

  // Idle prefetch on mount (no TS pragma needed)
  useEffect(() => {
    const ric = (window as any).requestIdleCallback as
      | ((cb: () => void) => number)
      | undefined;
    let h: number | ReturnType<typeof setTimeout>;

    const run = () => prefetchGenerator();

    if (ric) {
      h = ric(run);
      return () => { /* no standard cancel; safe to ignore */ };
    } else {
      h = setTimeout(run, 250);
      return () => clearTimeout(h as any);
    }
  }, [prefetchGenerator]);

  // Keyboard shortcuts: G (token), N (nft)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const k = e.key.toLowerCase();
      if (k === "g") { e.preventDefault(); tokenBtnRef.current?.focus(); navigate("/crypto-generator/engine#step1"); }
      if (k === "n") { e.preventDefault(); nftBtnRef.current?.focus(); navigate("/crypto-generator"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const artStyle = useMemo(
    () =>
      ({
        ["--art-img" as any]: `url('/fdfd19ca-7b20-42d8-b430-4ca75a94f0eb.png')`,
        ["--art-pos" as any]: "58% 42%",
        ["--art-zoom" as any]: "220%",
      }) as React.CSSProperties,
    []
  );

  return (
    <main className="landing-gradient" role="main">
      <div className="container" style={{ padding: 24 }}>
        <div className="card" role="region" aria-label="Shop overview">
          <h2 style={{ marginTop: 0 }}>Shop</h2>
          <p className="muted" id="shop-sub" style={{ marginTop: 6 }}>
            Payments are <strong>coming soon</strong>. Browse the preview and start creating with JAL/SOL.
          </p>

          {/* Promo: Create with JAL/SOL */}
          <section
            className="shop-promo has-art"
            style={artStyle}
            role="region"
            aria-labelledby="create-title"
            aria-describedby="shop-sub"
          >
            <div className="shop-promo-inner">
              <div className="promo-head">
                <span className="promo-badge">NEW</span>
                <h4 id="create-title" className="promo-title">Create with JAL/SOL</h4>
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
                      <Link
                        ref={tokenBtnRef}
                        className="button gold"
                        to="/crypto-generator/engine#step1"
                        aria-label="Start a fungible token (G)"
                        onMouseEnter={prefetchGenerator}
                        onFocus={prefetchGenerator}
                      >
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
                      <Link
                        ref={nftBtnRef}
                        className="button neon"
                        to="/crypto-generator"
                        aria-label="Start an NFT (N)"
                        onMouseEnter={prefetchGenerator}
                        onFocus={prefetchGenerator}
                      >
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
          <div style={{ marginTop: 16 }} role="region" aria-label="Catalog preview">
            <h3 style={{ marginTop: 0 }}>Catalog (Preview)</h3>
            <div className="product-grid" role="list" style={{ marginTop: 14 }}>
              {CATALOG.map((p) => (
                <article key={p.id} className="product-card" role="listitem" aria-label={p.name}>
                  <div className="product-media noimg">
                    <span className="badge soon" aria-live="polite">Coming&nbsp;soon</span>
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
