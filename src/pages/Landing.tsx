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

  // Inline visual helpers so this looks premium without touching global CSS
  const bgWrapStyle: React.CSSProperties = {
    position: "relative",
    minHeight: "calc(100vh - 140px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  };
  const ringStyle: React.CSSProperties = {
    position: "absolute",
    width: 900,
    height: 900,
    borderRadius: "50%",
    filter: "blur(120px)",
    opacity: 0.18,
    pointerEvents: "none",
  };

  return (
    <main className="landing-simple" aria-label="JAL/SOL quick start">
      <div style={bgWrapStyle}>
        {/* Soft conic glow + radial rings */}
        <div
          aria-hidden
          style={{
            ...ringStyle,
            background:
              "conic-gradient(from 180deg at 50% 50%, rgba(0,255,200,.6), rgba(255,220,120,.6), rgba(180,120,255,.6), rgba(0,255,200,.6))",
          }}
        />
        <div
          aria-hidden
          style={{
            ...ringStyle,
            width: 1200,
            height: 1200,
            background: "radial-gradient(closest-side, rgba(255,255,255,.08), transparent 70%)",
            opacity: 0.25,
          }}
        />

        <div className="landing-simple-inner" style={{ textAlign: "center", position: "relative", zIndex: 2 }}>
          <h1 className="hero-title" style={{ marginBottom: 8 }}>
            Currency of Identity
          </h1>
          <p className="hero-sub" style={{ maxWidth: 680, margin: "0 auto 28px" }}>
            One generator. Mint your brand, add liquidity, attach products, and loop fiat back into crypto.
          </p>

          <div className="bss-row bss-row--big" data-section="bss" style={{ gap: 16, justifyContent: "center" }}>
            {/* GENERATOR → /shop (single source of truth) */}
            <Link
              ref={genRef}
              className="bss-btn buy"
              to="/shop"
              aria-label="Open Generator (G or B)"
              onMouseEnter={prefetchGenerator}
              onFocus={prefetchGenerator}
              style={{ boxShadow: "0 0 28px rgba(0,255,200,.25)" }}
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
              style={{ boxShadow: "0 0 28px rgba(120,220,255,.25)" }}
            >
              SWAP FOR $JAL
            </a>

            {/* GUIDE → /sell */}
            <Link
              ref={guideRef}
              className="bss-btn sell"
              to="/sell"
              aria-label="Open Creator Guide (L)"
              onMouseEnter={prefetchGuide}
              onFocus={prefetchGuide}
              style={{ boxShadow: "0 0 28px rgba(255,210,120,.25)" }}
            >
              CREATOR&nbsp;GUIDE
            </Link>
          </div>

          <p className="hint" style={{ marginTop: 14 }}>
            <strong>Shortcuts:</strong> <kbd>G</kbd> Open Generator · <kbd>S</kbd> Swap · <kbd>L</kbd> Guide
          </p>

          {!mint && (
            <p className="hint" aria-live="polite" style={{ opacity: 0.8 }}>
              Heads up: JAL mint address not set — swap will open Raydium home.
            </p>
          )}

          {/* Micro-roadmap preview */}
          <section className="mt-8 text-white/75" style={{ marginTop: 28 }}>
            <ol className="list-decimal list-inside space-y-1 text-sm" style={{ maxWidth: 420, margin: "0 auto" }}>
              <li>
                <strong>Identity</strong> — set name, symbol, image (IPFS).
              </li>
              <li>
                <strong>Mint</strong> — create mint, ATA, initial supply.
              </li>
              <li>
                <strong>Liquidity</strong> — pair with SOL on Raydium.
              </li>
              <li>
                <strong>Product</strong> — attach token to a shippable item.
              </li>
              <li>
                <strong>Reinvest</strong> — route a slice of fiat back to LP or burns.
              </li>
            </ol>
          </section>
        </div>
      </div>
    </main>
  );
}
