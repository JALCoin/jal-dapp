// src/pages/Landing.tsx
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useCallback } from "react";
import { JAL_MINT } from "../config/tokens";

export default function Landing() {
  const navigate = useNavigate();

  // Focus refs for a11y + keyboard shortcuts
  const genRef = useRef<HTMLAnchorElement | null>(null);
  const swapRef = useRef<HTMLAnchorElement | null>(null);
  const guideRef = useRef<HTMLAnchorElement | null>(null);

  const mint = String(JAL_MINT || "").trim();
  const swapUrl = mint
    ? `https://raydium.io/swap/?inputCurrency=SOL&outputCurrency=${encodeURIComponent(
        mint
      )}&fixed=in&utm_source=jalsol&utm_medium=landing`
    : "https://raydium.io/swap/?utm_source=jalsol&utm_medium=landing";

  // Prefetch the generator (Shop) and the guide (Sell)
  const prefetchGenerator = useCallback(() => {
    import("../pages/Shop").catch(() => {});
  }, []);
  const prefetchGuide = useCallback(() => {
    import("../pages/Sell").catch(() => {});
  }, []);

  // Gentle prefetch on idle
  useEffect(() => {
    const id =
      (window as any).requestIdleCallback
        ? (window as any).requestIdleCallback(() => {
            prefetchGenerator();
            prefetchGuide();
          })
        : setTimeout(() => {
            prefetchGenerator();
            prefetchGuide();
          }, 250);
    return () => {
      if (typeof id === "number") clearTimeout(id);
    };
  }, [prefetchGenerator, prefetchGuide]);

  /**
   * Keyboard shortcuts
   * G = open Generator (/shop)
   * S = open Swap (Raydium)
   * L = open Guide (/sell)
   * (Legacy B/S/L still work: B -> generator, S -> swap, L -> guide)
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const k = e.key.toLowerCase();
      // Generator
      if (k === "g" || k === "b") {
        e.preventDefault();
        genRef.current?.focus();
        navigate("/shop");
      }
      // Swap
      if (k === "s") {
        e.preventDefault();
        swapRef.current?.focus();
        (swapRef.current as HTMLAnchorElement)?.click();
      }
      // Guide (creator ops)
      if (k === "l") {
        e.preventDefault();
        guideRef.current?.focus();
        navigate("/sell");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  return (
    <main className="landing-simple">
      <div className="landing-simple-inner" role="region" aria-label="JAL/SOL quick start">
        <h1 className="hero-title">Currency of Identity</h1>
        <p className="hero-sub">
          One generator. Mint your brand, add liquidity, attach products, and loop fiat back into crypto.
        </p>

        <div className="bss-row bss-row--big" data-section="bss">
          {/* GENERATOR → /shop (single source of truth) */}
          <Link
            ref={genRef}
            className="bss-btn buy"
            to="/shop"
            aria-label="Open Generator (G or B)"
            onMouseEnter={prefetchGenerator}
            onFocus={prefetchGenerator}
          >
            OPEN GENERATOR
          </Link>

          {/* SWAP → Raydium (new tab) */}
          <a
            ref={swapRef}
            className="bss-btn swap"
            href={swapUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Swap on Raydium (S) — opens in new tab"
          >
            SWAP FOR $JAL
          </a>

          {/* GUIDE → /sell (use this as your Creator Guide / Ops space) */}
          <Link
            ref={guideRef}
            className="bss-btn sell"
            to="/sell"
            aria-label="Open Creator Guide (L)"
            onMouseEnter={prefetchGuide}
            onFocus={prefetchGuide}
          >
            CREATOR&nbsp;GUIDE
          </Link>
        </div>

        <p className="hint" style={{ marginTop: "1rem" }}>
          <strong>Shortcuts:</strong> <kbd>G</kbd> Open Generator · <kbd>S</kbd> Swap · <kbd>L</kbd> Guide
        </p>

        {!mint && (
          <p className="hint" aria-live="polite" style={{ opacity: 0.8 }}>
            Heads up: JAL mint address not set — swap will open Raydium home.
          </p>
        )}

        {/* Micro-roadmap preview to set expectations */}
        <section className="mt-8 text-white/75">
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li><strong>Identity</strong> — set name, symbol, image (IPFS).</li>
            <li><strong>Mint</strong> — create mint, ATA, initial supply.</li>
            <li><strong>Liquidity</strong> — pair with SOL on Raydium.</li>
            <li><strong>Product</strong> — attach token to a shippable item.</li>
            <li><strong>Reinvest</strong> — route a slice of fiat back to LP or burns.</li>
          </ol>
        </section>
      </div>
    </main>
  );
}
