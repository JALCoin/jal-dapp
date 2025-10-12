// src/pages/Landing.tsx
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useCallback, useMemo } from "react";
import { JAL_MINT } from "../config/tokens";

/**
 * Landing – Identity-first header panel + quick actions (BUY / SWAP / SELL)
 * - Centers a glass "identity panel" under the logo with Mint / Explorer / Swap / Status
 * - Keeps your quick-action row and prefetch/shortcuts
 */

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

  const explorerUrl = useMemo(
    () =>
      mint
        ? `https://solscan.io/account/${encodeURIComponent(mint)}`
        : "https://solscan.io/",
    [mint]
  );

  // Light route prefetch for faster transitions
  const prefetchShop = useCallback(() => {
    import("../pages/Shop").catch(() => {});
  }, []);
  const prefetchSell = useCallback(() => {
    import("../pages/Sell").catch(() => {});
  }, []);

  // Gentle prefetch on mount (no layout work)
  useEffect(() => {
    const id =
      (window as any).requestIdleCallback
        ? (window as any).requestIdleCallback(() => {
            prefetchShop();
            prefetchSell();
          })
        : setTimeout(() => {
            prefetchShop();
            prefetchSell();
          }, 250);
    return () => {
      if (typeof id === "number") clearTimeout(id);
    };
  }, [prefetchShop, prefetchSell]);

  // Keyboard shortcuts: B / S / L
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const k = e.key.toLowerCase();
      if (k === "b") {
        e.preventDefault();
        buyRef.current?.focus();
        navigate("/shop");
      }
      if (k === "s") {
        e.preventDefault();
        swapRef.current?.focus();
        (swapRef.current as HTMLAnchorElement)?.click();
      }
      if (k === "l") {
        e.preventDefault();
        sellRef.current?.focus();
        navigate("/sell");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const shortMint =
    mint && mint.length > 10 ? `${mint.slice(0, 4)}…${mint.slice(-3)}` : mint;

  return (
    <main className="landing-simple">
      <div className="landing-simple-inner" role="region" aria-label="JAL/SOL entry">
        {/* --- Identity Panel (centered under logo) ---------------------- */}
        <section className="identity-panel text-center">
          <div className="inline-block rounded-2xl border border-[var(--stroke-2)] bg-[var(--glass)] backdrop-blur px-5 py-4 shadow-[0_0_40px_rgba(0,255,200,0.12)]">
            <h1 className="font-semibold text-lg tracking-wide">JAL / SOL</h1>
            <p className="text-sm opacity-80">Foundation Utility Network</p>

            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {/* Mint */}
              <a
                className="chip sm mono"
                href={explorerUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Open mint in Solscan"
                title={mint || "Mint not set"}
              >
                Mint: {shortMint || "—"}
              </a>

              {/* Swap */}
              <a
                ref={swapRef}
                className="chip sm"
                href={swapUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Swap on Raydium (opens in new tab)"
              >
                Swap on Raydium
              </a>

              {/* Explorer */}
              <a
                className="chip sm"
                href={explorerUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Open Explorer"
              >
                Explorer
              </a>
            </div>

            <div className="mt-3 text-xs opacity-80 flex justify-center items-center gap-2">
              <span
                aria-hidden
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: "var(--green)" }}
              />
              <span>Mainnet</span>
              <span>•</span>
              <span>RPC: Healthy</span>
              <span>•</span>
              <span>{(window as any).__RPC_MS || "512ms"}</span>
            </div>
          </div>
        </section>

        {/* --- Quick actions -------------------------------------------- */}
        <p className="hero-sub" style={{ marginTop: 14 }}>
          Choose an action to get started.
        </p>

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

          {/* SWAP → (duplicate action for large buttons) */}
          <a
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
