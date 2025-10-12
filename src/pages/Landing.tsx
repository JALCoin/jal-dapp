// src/pages/Landing.tsx
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useCallback } from "react";
import { JAL_MINT } from "../config/tokens";

export default function Landing() {
  const navigate = useNavigate();

  // Accessibility & keyboard navigation refs
  const genRef = useRef<HTMLAnchorElement | null>(null);
  const swapRef = useRef<HTMLAnchorElement | null>(null);
  const guideRef = useRef<HTMLAnchorElement | null>(null);

  const mint = String(JAL_MINT || "").trim();
  const swapUrl = mint
    ? `https://raydium.io/swap/?inputCurrency=SOL&outputCurrency=${encodeURIComponent(
        mint
      )}&fixed=in&utm_source=jalsol&utm_medium=landing`
    : "https://raydium.io/swap/?utm_source=jalsol&utm_medium=landing";

  // Prefetch key pages for instant load
  const prefetchGenerator = useCallback(() => { import("../pages/Shop").catch(() => {}); }, []);
  const prefetchGuide = useCallback(() => { import("../pages/Sell").catch(() => {}); }, []);

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
    return () => { if (typeof id === "number") clearTimeout(id); };
  }, [prefetchGenerator, prefetchGuide]);

  // Keyboard shortcuts (G, S, L)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const k = e.key.toLowerCase();
      if (k === "g" || k === "b") { e.preventDefault(); genRef.current?.focus(); navigate("/shop"); }
      if (k === "s") { e.preventDefault(); swapRef.current?.focus(); (swapRef.current as HTMLAnchorElement)?.click(); }
      if (k === "l") { e.preventDefault(); guideRef.current?.focus(); navigate("/sell"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  // Layout styles (preserve global CSS)
  const shell: React.CSSProperties = {
    position: "relative",
    minHeight: "calc(100vh - 120px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: "32px 16px",
  };

  const halo: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 50% 20%, rgba(0,255,200,0.12) 0%, transparent 60%), radial-gradient(circle at 50% 100%, rgba(255,220,120,0.08) 0%, transparent 70%)",
    filter: "blur(80px)",
    zIndex: 0,
    animation: "pulseGlow 10s ease-in-out infinite",
  };

  const content: React.CSSProperties = {
    position: "relative",
    zIndex: 1,
    textAlign: "center",
    maxWidth: 860,
    padding: "40px 24px",
    borderRadius: "20px",
    background: "rgba(10,10,10,0.5)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 0 60px rgba(0,0,0,0.45), inset 0 0 1px rgba(255,255,255,0.05)",
  };

  return (
    <main className="landing-premium" aria-label="JAL/SOL official hub">
      <div style={shell}>
        <div aria-hidden style={halo} />

        <section style={content}>
          <img
            src="/JALSOL1.gif"
            alt="JAL/SOL Logo"
            className="hero-logo"
            style={{ width: 120, marginBottom: 16, opacity: 0.95 }}
          />

          <p
            className="muted"
            style={{
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              marginBottom: 8,
              fontSize: "0.9rem",
            }}
          >
            Official Hub · JAL / SOL
          </p>

          <h1
            className="hero-title"
            style={{
              margin: "0 0 10px",
              fontSize: "2.2rem",
              fontWeight: 500,
              letterSpacing: "0.03em",
              color: "var(--glow-gold)",
            }}
          >
            Jeremy Aaron Lugg
          </h1>

          <p
            className="hero-sub"
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.5,
              opacity: 0.85,
              marginBottom: 32,
            }}
          >
            Machinist · Fitter · Crypto builder — bridging craft, currency, and creation.
            <br />
            This is where my audience connects to my generator, products, and ecosystem.
          </p>

          {/* Primary Actions */}
          <div
            className="bss-row bss-row--big"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 24,
            }}
          >
            <Link
              ref={genRef}
              className="bss-btn buy"
              to="/shop"
              onMouseEnter={prefetchGenerator}
              onFocus={prefetchGenerator}
            >
              OPEN GENERATOR
            </Link>

            <a
              ref={swapRef}
              className="bss-btn swap"
              href={swapUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              SWAP $JAL ↔ SOL
            </a>

            <Link
              ref={guideRef}
              className="bss-btn sell"
              to="/sell"
              onMouseEnter={prefetchGuide}
              onFocus={prefetchGuide}
            >
              CREATOR GUIDE
            </Link>
          </div>

          {/* Resource Links */}
          <div
            className="resource-links"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 14,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <a className="chip sm" href="https://x.com/JAL358" target="_blank" rel="noreferrer">X / Twitter</a>
            <a className="chip sm" href="https://raydium.io/swap" target="_blank" rel="noreferrer">Raydium</a>
            <a className="chip sm" href="https://t.me" target="_blank" rel="noreferrer">Telegram</a>
            <a className="chip sm" href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
          </div>

          <p className="hint" style={{ marginTop: 8, opacity: 0.8 }}>
            <strong>Shortcuts:</strong> <kbd>G</kbd> Generator · <kbd>S</kbd> Swap · <kbd>L</kbd> Guide
          </p>

          {!mint && (
            <p className="hint" aria-live="polite" style={{ opacity: 0.65 }}>
              JAL mint address not configured — swap opens Raydium home.
            </p>
          )}

          {/* Footer microtext */}
          <footer
            style={{
              marginTop: 32,
              fontSize: "0.8rem",
              opacity: 0.5,
              letterSpacing: "0.05em",
            }}
          >
            Operating on Solana Mainnet · Verified through jalsol.com
          </footer>
        </section>
      </div>
    </main>
  );
}
