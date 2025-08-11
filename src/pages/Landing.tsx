// src/pages/Landing.tsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletMultiButton,
  WalletDisconnectButton,
  useWalletModal,
} from "@solana/wallet-adapter-react-ui";

export default function Landing() {
  const { publicKey, connected, select, connect } = useWallet();
  const { setVisible } = useWalletModal(); // optional: open modal programmatically
  const navigate = useNavigate();

  const [merging, setMerging] = useState(false);
  const timerRef = useRef<number | null>(null);

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Detect mobile + Phantom in-app browser
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  const inPhantomBrowser = /Phantom/i.test(ua);

  // Auto-redirect to hub when connected (desktop + mobile)
  useEffect(() => {
    if (!connected || !publicKey) return;

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

  // Reset merge state if disconnected
  useEffect(() => {
    if (!connected || !publicKey) {
      setMerging(false);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [connected, publicKey]);

  // Deep-link to Phantom in-app browser (preserve current URL)
  const openInPhantom = useCallback(() => {
    const target = typeof window !== "undefined" ? encodeURIComponent(window.location.href) : "https://jalsol.com";
    window.location.href = `https://phantom.app/ul/browse/${target}`;
  }, []);

  // Mobile one-tap: programmatically select WalletConnect, then connect
  const connectWithWalletConnect = useCallback(async () => {
    try {
      // Adapter name must match the one registered in AppProviders
      await select?.("WalletConnect");
      await connect?.();
    } catch (e) {
      console.error("WalletConnect mobile connect failed:", e);
      // Fallback: open modal so the user can pick manually
      setVisible(true);
    }
  }, [select, connect, setVisible]);

  return (
    <main className={`landing-gradient ${merging ? "landing-merge" : ""}`} aria-live="polite">
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

      {merging && (
        <div className="landing-disconnect">
          <WalletDisconnectButton className="wallet-disconnect-btn" />
        </div>
      )}

      <div className="landing-inner">
        <div className={`landing-logo-wrapper ${connected ? "wallet-connected" : ""}`}>
          <img src="/JALSOL1.gif" alt="JAL/SOL" className="landing-logo" />
        </div>

        {!connected && (
          <>
            {/* Desktop / injected wallets / in-app browsers */}
            <WalletMultiButton className={`landing-wallet ${merging ? "fade-out" : ""}`} />

            {/* Mobile enhancements */}
            {isMobile && !inPhantomBrowser && (
              <>
                <button className="landing-wallet" onClick={connectWithWalletConnect}>
                  Connect (WalletConnect)
                </button>
                <button className="landing-wallet" onClick={openInPhantom}>
                  Open in Phantom
                </button>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
