// src/pages/Landing.tsx
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { JAL_MINT } from "../config/tokens";

export default function Landing() {
  const navigate = useNavigate();

  // Refs for keyboard shortcuts
  const buyRef = useRef<HTMLAnchorElement | null>(null);
  const swapRef = useRef<HTMLAnchorElement | null>(null);
  const sellRef = useRef<HTMLAnchorElement | null>(null);

  // Mint + URLs
  const mint = String(JAL_MINT || "").trim();
  const shortMint =
    mint && mint.length > 10 ? `${mint.slice(0, 4)}…${mint.slice(-3)}` : mint;

  const swapUrl = mint
    ? `https://raydium.io/swap/?inputCurrency=SOL&outputCurrency=${encodeURIComponent(
        mint
      )}&fixed=in&utm_source=jalsol&utm_medium=landing`
    : `https://raydium.io/swap/?utm_source=jalsol&utm_medium=landing`;

  const explorerUrl = useMemo(
    () =>
      mint
        ? `https://solscan.io/account/${encodeURIComponent(mint)}`
        : "https://solscan.io/",
    [mint]
  );

  // Prefetch lightweight routes for snappy nav
  const prefetchShop = useCallback(() => {
    import("../pages/Shop").catch(() => {});
  }, []);
  const prefetchSell = useCallback(() => {
    import("../pages/Sell").catch(() => {});
  }, []);

  // Idle prefetch on mount
  useEffect(() => {
    const idle =
      (window as any).requestIdleCallback ||
      ((cb: Function) => setTimeout(cb, 200));
    const cancel =
      (window as any).cancelIdleCallback || ((id: number) => clearTimeout(id));

    const id = idle(() => {
      prefetchShop();
      prefetchSell();
    });

    return () => cancel(id as number);
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
        (swapRef.current as HTMLAnchorElement | null)?.click();
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

  // Copy mint helper
  const [copied, setCopied] = useState(false);
  const onCopyMint = async () => {
    try {
      if (!mint) return;
      await navigator.clipboard.writeText(mint);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // no-op: clipboard can be blocked
    }
  };

  return (
    <main className="landing-simple" role="main">
      <div className="landing-simple-inner" style={{ gap: 18 }}>
        {/* Identity / profile card */}
        <section className="id-card" aria-label="Project identity">
          <div className="id-card__inner">
            <img
              src="/logo/jalsol-mark.svg"
              alt="JAL/SOL"
              className="id-card__logo"
              loading="eager"
              decoding="async"
            />
            <h1 className="id-card__title">JAL / SOL</h1>
            <p className="id-card__sub">Foundation Utility Network</p>

            <div className="id-card__chips" role="group" aria-label="Quick links">
              <a
                className="chip sm mono"
                href={explorerUrl}
                target="_blank"
                rel="noreferrer"
                title={mint || "Mint not set"}
                aria-label="Open mint in Solscan"
              >
                Mint: {shortMint || "—"}
              </a>
              {mint && (
                <button
                  type="button"
                  className="chip sm mono"
                  onClick={onCopyMint}
                  aria-live="polite"
                >
                  {copied ? "Copied ✓" : "Copy Mint"}
                </button>
              )}
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

            <div className="id-card__status" aria-live="polite">
              <span aria-hidden className="dot ok" /> Mainnet • RPC: Healthy •
              512ms
            </div>
          </div>
        </section>

        {/* Actions */}
        <p className="hero-sub">Choose an action to get started.</p>

        <div className="bss-row bss-row--big" data-section="bss">
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

          <a
            className="bss-btn swap"
            href={swapUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Swap on Raydium (opens in new tab) (S)"
          >
            SWAP
          </a>

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

        <p className="hint">
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
