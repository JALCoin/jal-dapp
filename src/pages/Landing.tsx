import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletMultiButton,
  WalletDisconnectButton,
} from "@solana/wallet-adapter-react-ui";

export default function Landing() {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();

  const [merging, setMerging] = useState(false);
  const timerRef = useRef<number | null>(null);

  const reducedMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Preload Hub images (prevents flash later)
  useEffect(() => {
    const imgs = ["/JAL.gif", "/JALSOL.gif", "/VAULT.gif", "/HOW-IT-WORKS.gif"];
    const elms: HTMLImageElement[] = [];
    imgs.forEach((src) => {
      const img = new Image();
      img.src = src;
      elms.push(img);
    });
    return () => { elms.forEach((img) => (img.src = "")); };
  }, []);

  // Auto-redirect when connected (nice merge)
  useEffect(() => {
    if (!connected || !publicKey) return;

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setMerging(true);
    const delay = reducedMotion ? 0 : 450;

    timerRef.current = window.setTimeout(() => {
      navigate("/hub", { replace: true });
    }, delay);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [connected, publicKey, navigate, reducedMotion]);

  // Reset if disconnected
  useEffect(() => {
    if (!connected || !publicKey) {
      setMerging(false);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [connected, publicKey]);

  return (
    <main className={`landing-gradient ${merging ? "landing-merge" : ""}`} aria-live="polite">
      {/* Socials */}
      <div className="landing-social" aria-hidden={merging}>
        <a href="https://x.com/JAL358" target="_blank" rel="noopener noreferrer" aria-label="X">
          <img src="/icons/X.png" alt="" />
        </a>
        <a href="https://t.me/jalsolcommute" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
          <img src="/icons/Telegram.png" alt="" />
        </a>
        <a href="https://www.tiktok.com/@358jalsol" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
          <img src="/icons/TikTok.png" alt="" />
        </a>
      </div>

      {/* Quick disconnect while merging */}
      {merging && (
        <div className="landing-disconnect">
          <WalletDisconnectButton className="wallet-disconnect-btn" />
        </div>
      )}

      {/* Logo + CTA */}
      <div className="landing-inner">
        <div className={`landing-logo-wrapper ${connected ? "wallet-connected" : ""}`}>
          <img src="/JALSOL1.gif" alt="JAL/SOL" className="landing-logo" />
        </div>

        {!connected ? (
          <WalletMultiButton className={`landing-wallet ${merging ? "fade-out" : ""}`} />
        ) : (
          <button
            className="landing-wallet"
            onClick={() => navigate("/hub")}
            disabled={merging}
            aria-label="Enter Hub"
          >
            Enter Hub
          </button>
        )}
      </div>

      {/* ▼ Transparent Hub preview panel (non-interactive) */}
      <section
        className={`landing-panel ${merging ? "fade-out" : ""}`}
        aria-label="Preview of Hub actions"
      >
        <h2 className="hub-title" aria-hidden="true">Welcome</h2>

        <nav className="hub-stack hub-stack--responsive preview-grid" aria-hidden="true">
          <div className="img-btn preview-btn">
            <img className="hub-gif float" src="/JAL.gif" alt="" draggable={false} />
          </div>
          <div className="img-btn preview-btn">
            <img className="hub-gif float" src="/JALSOL.gif" alt="" draggable={false} />
          </div>
          <div className="img-btn preview-btn">
            <img className="hub-gif float" src="/VAULT.gif" alt="" draggable={false} />
          </div>
          <div className="img-btn preview-btn">
            <img className="hub-gif float" src="/HOW-IT-WORKS.gif" alt="" draggable={false} />
          </div>
        </nav>
      </section>
    </main>
  );
}
