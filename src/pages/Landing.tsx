p// src/pages/Landing.tsx
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useCallback } from "react";
import { JAL_MINT } from "../config/tokens";

export default function Landing() {
  const navigate = useNavigate();
  const buyRef = useRef<HTMLAnchorElement | null>(null);
  const swapRef = useRef<HTMLAnchorElement | null>(null);
  const sellRef = useRef<HTMLAnchorElement | null>(null);

  const mint = String(JAL_MINT || "").trim();
  const swapUrl = mint
    ? `https://raydium.io/swap/?inputCurrency=SOL&outputCurrency=${encodeURIComponent(
        mint
      )}&fixed=in&utm_source=jalsol&utm_medium=landing`
    : "https://raydium.io/swap/?utm_source=jalsol&utm_medium=landing";

  // Light route prefetch for faster transitions
  const prefetchShop = useCallback(() => { import("../pages/Shop").catch(() => {}); }, []);
  const prefetchSell = useCallback(() => { import("../pages/Sell").catch(() => {}); }, []);

  // Gentle prefetch on mount (no layout work)
  useEffect(() => {
    const id = window.requestIdleCallback
      ? window.requestIdleCallback(() => { prefetchShop(); prefetchSell(); })
      : setTimeout(() => { prefetchShop(); prefetchSell(); }, 250);
    return () => {
      if (typeof id === "number") clearTimeout(id);
      // requestIdleCallback cancel not needed in most browsers
    };
  }, [prefetchShop, prefetchSell]);

  // Keyboard shortcuts: B / S / L
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const k = e.key.toLowerCase();
      if (k === "b") { e.preventDefault(); buyRef.current?.focus(); navigate("/shop"); }
      if (k === "s") { e.preventDefault(); swapRef.current?.focus(); (swapRef.current as HTMLAnchorElement)?.click(); }
      if (k === "l") { e.preventDefault(); sellRef.current?.focus(); navigate("/sell"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  return (
    <main className="landing-simple">
      <div className="landing-simple-inner" role="region" aria-label="Quick actions">
        <p className="hero-sub">Choose an action to get started.</p>

        <div className="bss-row bss-row--big" data-section="bss">
          {/* BUY → /shop (SPA route) */}
          <Link
            ref={buyRef}
            className="bss-btn buy"
            to="/shop"
            aria-label="Open Shop (B)"
            onMouseEnter={prefetchShop}
            onFocus={prefetchShop}
          >
            BUY
          </Link>

          {/* SWAP → Raydium (new tab) */}
          <a
            ref={swapRef}
            className="bss-btn swap"
            href={swapUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Swap on Raydium (opens in new tab) (S)"
          >
            SWAP
          </a>

          {/* SELL → /sell */}
          <Link
            ref={sellRef}
            className="bss-btn sell"
            to="/sell"
            aria-label="Open Sell Space (L)"
            onMouseEnter={prefetchSell}
            onFocus={prefetchSell}
          >
            SELL
          </Link>
        </div>

        <p className="hint" style={{ marginTop: "1rem" }}>
          <strong>SWAP</strong> opens Raydium in a new tab.
        </p>

        {!mint && (
          <p className="hint" aria-live="polite" style={{ opacity: 0.8 }}>
            Heads up: JAL mint address not set — swap will open Raydium home.
          </p>
        )}
      </div>
    </main>
  );
}
