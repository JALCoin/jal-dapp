// src/pages/Landing.tsx
import { Link } from "react-router-dom";
import { JAL_MINT } from "../config/tokens";

export default function Landing() {
  const mint = String(JAL_MINT);

  const swapUrl =
    `https://raydium.io/swap/?inputCurrency=SOL&outputCurrency=${encodeURIComponent(mint)}&fixed=in`;

  // Light route prefetch for faster transitions
  const prefetchShop = () => { import("../pages/Shop").catch(() => {}); };
  const prefetchSell = () => { import("../pages/Sell").catch(() => {}); };

  return (
    <main className="landing-simple">
      <div className="landing-simple-inner" role="region" aria-label="Quick actions">
        <p className="hero-sub">Choose an action to get started.</p>

        <div className="bss-row bss-row--big">
          {/* BUY → /shop (SPA route) */}
          <Link
            className="bss-btn buy"
            to="/shop"
            aria-label="Open Shop"
            onMouseEnter={prefetchShop}
            onFocus={prefetchShop}
          >
            BUY
          </Link>

          {/* SWAP → Raydium (new tab) */}
          <a
            className="bss-btn swap"
            href={swapUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Swap on Raydium (opens in new tab)"
          >
            SWAP
          </a>

          {/* SELL → /sell */}
          <Link
            className="bss-btn sell"
            to="/sell"
            aria-label="Open Sell Space"
            onMouseEnter={prefetchSell}
            onFocus={prefetchSell}
          >
            SELL
          </Link>
        </div>

        <p className="hint" style={{ marginTop: "1rem" }}>
          <strong>SWAP</strong> opens Raydium in a new tab.
        </p>
      </div>
    </main>
  );
}
