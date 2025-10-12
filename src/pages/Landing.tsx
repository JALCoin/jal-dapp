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
  const prefetchGenerator = useCallback(() => { import("../pages/Shop").catch(() => {}); }, []);
  const prefetchGuide = useCallback(() => { import("../pages/Sell").catch(() => {}); }, []);

  // Gentle prefetch on idle
  useEffect(() => {
    const id =
      (window as any).requestIdleCallback
        ? (window as any).requestIdleCallback(() => { prefetchGenerator(); prefetchGuide(); })
        : setTimeout(() => { prefetchGenerator(); prefetchGuide(); }, 250);
    return () => { if (typeof id === "number") clearTimeout(id); };
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
      if (k === "g" || k === "b") { e.preventDefault(); genRef.current?.focus(); navigate("/shop"); }
      if (k === "s")           { e.preventDefault(); swapRef.current?.focus(); (swapRef.current as HTMLAnchorElement)?.click(); }
      if (k === "l")           { e.preventDefault(); guideRef.current?.focus(); navigate("/sell"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  // Local visuals (keeps your global CSS untouched)
  const shell: React.CSSProperties = {
    position: "relative",
    minHeight: "calc(100vh - 140px)",
    display: "grid",
    placeItems: "center",
    padding: "32px 16px",
    overflow: "hidden",
  };
  const panel: React.CSSProperties = {
    width: "min(880px, 96vw)",
    borderRadius: 20,
    padding: "42px 28px",
    textAlign: "center",
    background:
      "radial-gradient(120% 120% at 50% 0%, rgba(255,255,255,0.06), rgba(0,0,0,0.4) 55%), linear-gradient(180deg, rgba(10,10,10,0.6), rgba(10,10,10,0.2))",
    boxShadow: "0 20px 80px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.05)",
    backdropFilter: "blur(6px)",
  };
  const halo: React.CSSProperties = {
    position: "absolute",
    inset: "-25% -25% auto -25%",
    height: 560,
    borderRadius: "50%",
    background:
      "conic-gradient(from 160deg at 60% 40%, rgba(0,255,200,.22), rgba(255,220,120,.22), rgba(160,120,255,.22), rgba(0,255,200,.22))",
    filter: "blur(120px)",
    opacity: 0.75,
    pointerEvents: "none",
  };

  return (
    <main className="landing-simple" aria-label="JAL/SOL landing hub">
      <div style={shell}>
        <div aria-hidden style={halo} />

        <section style={panel}>
          {/* Brand intro */}
          <p className="muted" style={{ letterSpacing: ".12em", textTransform: "uppercase", margin: 0 }}>
            Official Hub · JAL / SOL
          </p>
          <h1 className="hero-title" style={{ margin: "6px 0 10px" }}>Jeremy Aaron Lugg</h1>
          <p className="hero-sub" style={{ maxWidth: 720, margin: "0 auto 26px" }}>
            Machinist · Fitter · Crypto builder. This is where my followers land to access my tools,
            products, and resources.
          </p>

          {/* Primary actions */}
          <div className="bss-row bss-row--big" style={{ gap: 14, justifyContent: "center", marginBottom: 16 }}>
            <Link
              ref={genRef}
              className="bss-btn buy"
              to="/shop"
              aria-label="Open Generator (G or B)"
              onMouseEnter={prefetchGenerator}
              onFocus={prefetchGenerator}
              style={{ boxShadow: "0 0 26px rgba(0,255,200,.25)" }}
            >
              OPEN GENERATOR
            </Link>

            <a
              ref={swapRef}
              className="bss-btn swap"
              href={swapUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Swap on Raydium (S) — opens in new tab"
              style={{ boxShadow: "0 0 26px rgba(120,220,255,.25)" }}
            >
              SWAP $JAL ↔ SOL
            </a>

            <Link
              ref={guideRef}
              className="bss-btn sell"
              to="/sell"
              aria-label="Open Creator Guide (L)"
              onMouseEnter={prefetchGuide}
              onFocus={prefetchGuide}
              style={{ boxShadow: "0 0 26px rgba(255,210,120,.25)" }}
            >
              CREATOR GUIDE
            </Link>
          </div>

          {/* Social / resources strip */}
          <div
            className="resource-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0,1fr))",
              gap: 10,
              margin: "8px auto 18px",
              maxWidth: 720,
            }}
          >
            <a className="chip sm" href="https://x.com/JAL358" target="_blank" rel="noreferrer">X / Twitter</a>
            <a className="chip sm" href="https://raydium.io/swap" target="_blank" rel="noreferrer">Raydium</a>
            <a className="chip sm" href="https://t.me" target="_blank" rel="noreferrer">Telegram</a>
            <a className="chip sm" href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
          </div>

          <p className="hint" style={{ marginTop: 0 }}>
            <strong>Shortcuts:</strong> <kbd>G</kbd> Generator · <kbd>S</kbd> Swap · <kbd>L</kbd> Guide
          </p>

          {!mint && (
            <p className="hint" aria-live="polite" style={{ opacity: 0.8 }}>
              Heads up: JAL mint address not set — swap opens Raydium home.
            </p>
          )}

          {/* Micro-roadmap for context */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", marginTop: 18, paddingTop: 16 }}>
            <ol
              className="list-decimal list-inside text-sm"
              style={{ maxWidth: 520, margin: "0 auto", textAlign: "left", color: "rgba(255,255,255,0.75)" }}
            >
              <li><strong>Identity</strong> — set name, symbol, image (IPFS).</li>
              <li><strong>Mint</strong> — create mint, ATA, initial supply.</li>
              <li><strong>Liquidity</strong> — pair with SOL on Raydium.</li>
              <li><strong>Product</strong> — attach token to a shippable item.</li>
              <li><strong>Reinvest</strong> — route a slice of fiat back to LP or burns.</li>
            </ol>
          </div>
        </section>
      </div>
    </main>
  );
}
