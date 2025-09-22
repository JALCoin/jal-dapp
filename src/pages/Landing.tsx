import type React from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { lazy, Suspense, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal, WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const Jal = lazy(() => import("./Jal")); // optional: can be removed if unused on Landing

/*
  Landing.tsx (lightweight)
  - No internal overlay logic. Hub/Shop/Vault open via `?panel=...` handled globally by App's HubOverlay.
  - Clean hero with CTAs. Prefetches generator routes on intent.
  - Uses CSS hooks from index.css: .landing, .bg-layer/.tv-bg (mounted by App), .hero, .cta-grid, .btn, etc.
*/

export default function Landing(): JSX.Element {
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();

  const openPanel = useCallback((panel: "hub" | "shop" | "support") => {
    const next = new URLSearchParams(params);
    next.set("panel", panel);
    setParams(next, { replace: false });
  }, [params, setParams]);

  const openVault = useCallback(() => {
    if (!connected) {
      setVisible(true);
      return;
    }
    const next = new URLSearchParams(params);
    next.set("panel", "hub"); // open hub first
    setParams(next, { replace: false });
    // Optionally deep-link inside Hub body later (e.g., #vault) if you wire it
  }, [connected, params, setParams, setVisible]);

  // Prefetch heavy generator routes on intent
  const prefetchGenerator = useCallback(() => {
    import("./CryptoGeneratorIntro");
    import("./CryptoGenerator");
  }, []);

  return (
    <div className="landing">
      {/* Background layers are mounted by <BackgroundLayers /> in App */}
      <section className="hero">
        <h1 className="brand">JAL / SOL</h1>
        <p className="tag">Turn belief into currency.</p>

        <div className="cta-grid" style={{ marginTop: 14 }}>
          <button className="btn primary" onClick={() => openPanel("hub")}>Open Hub</button>
          <Link
            to="/crypto-generator"
            className="btn hollow"
            onMouseEnter={prefetchGenerator}
            onFocus={prefetchGenerator}
          >Create Token</Link>
          <button className="btn hollow" onClick={() => openPanel("shop")}>Shop</button>
          <button className="btn hollow" onClick={openVault}>Vault</button>
        </div>

        <div style={{ marginTop: 16 }}>
          <WalletMultiButton />
        </div>
      </section>

      {/* Optional: light content teaser; safe to remove */}
      <section className="container" style={{ marginTop: 28 }}>
        <div className="card" style={{ textAlign: "left" }}>
          <h3 style={{ marginTop: 0 }}>Create in minutes</h3>
          <p className="muted" style={{ marginTop: 6 }}>
            Launch an SPL token or a small NFT set, then add liquidity with JAL on your favorite DEX.
          </p>
          <div className="chip-row">
            <Link
              to="/crypto-generator/engine#step1"
              className="chip"
              onMouseEnter={prefetchGenerator}
              onFocus={prefetchGenerator}
            >Start Token</Link>
            <Link
              to="/crypto-generator"
              className="chip"
              onMouseEnter={prefetchGenerator}
              onFocus={prefetchGenerator}
            >Start NFT</Link>
            <button className="chip" onClick={() => openPanel("support")}>Get Support</button>
          </div>
        </div>
      </section>

      {/* If you want a tiny JAL teaser embedded on Landing */}
      <section className="container" style={{ marginTop: 16 }}>
        <Suspense fallback={<div className="card">Loading…</div>}>
          <div className="card">
            <h4 style={{ marginTop: 0 }}>What is JAL?</h4>
            <p className="muted" style={{ marginTop: 6 }}>A unit of value for creators and communities. Learn and trade in the Hub.</p>
            {/* Keep this small to avoid heavy mount cost; the full JAL view lives in the Hub */}
            <Jal inHub={false as any} />
          </div>
        </Suspense>
      </section>
    </div>
  );
}
