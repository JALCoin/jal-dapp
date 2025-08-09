// src/pages/Hub.tsx
import { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const update = () => setReduced(!!mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

export default function Hub() {
  const { connected, publicKey } = useWallet();
  const navigate = useNavigate();
  const reducedMotion = usePrefersReducedMotion();

  // Redirect to landing if wallet disconnects
  useEffect(() => {
    if (!connected) navigate("/", { replace: true });
  }, [connected, navigate]);

  // Smoothly scroll to top when Hub mounts (after landing animation)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }, [reducedMotion]);

  // Keyboard shortcuts (only while Hub is mounted)
  useEffect(() => {
    if (!connected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      // Don’t hijack typing in inputs
      const target = e.target as HTMLElement | null;
      if (target && /input|textarea|select/.test(target.tagName.toLowerCase())) return;

      if (e.key === "1") navigate("/start");
      if (e.key === "2") navigate("/utility");
      if (e.key === "3") navigate("/terms");
      if (e.key === "Escape") (document.activeElement as HTMLElement | null)?.blur();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [connected, navigate]);

  const shortPk = useMemo(() => {
    if (!publicKey) return "";
    const s = publicKey.toBase58();
    return `${s.slice(0, 4)}…${s.slice(-4)}`;
  }, [publicKey]);

  // Focus first action on mount for quick keyboard nav
  const firstActionRef = useRef<HTMLAnchorElement | null>(null);
  useEffect(() => {
    firstActionRef.current?.focus();
  }, []);

  const Action = useCallback(
    ({
      to,
      title,
      sub,
      delayMs,
      ariaLabel,
      innerRef,
    }: {
      to: string;
      title: string;
      sub: string;
      delayMs: number;
      ariaLabel: string;
      innerRef?: React.Ref<HTMLAnchorElement>;
    }) => (
      <Link
        ref={innerRef}
        to={to}
        className="hub-btn"
        aria-label={ariaLabel}
        style={
          reducedMotion
            ? undefined
            : ({ animation: "fadeIn .35s ease-out", animationDelay: `${delayMs}ms` } as React.CSSProperties)
        }
      >
        {title}
        <span className="sub">{sub}</span>
      </Link>
    ),
    [reducedMotion]
  );

  return (
    <main className="hub" role="main" style={{ position: "relative" }}>
      {/* Top-right disconnect (kept on Hub since header nav is hidden) */}
      <div style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 10 }}>
        <WalletDisconnectButton className="hub-disconnect-btn" title="Disconnect wallet" />
      </div>

      <div
        className="hub-inner"
        style={reducedMotion ? undefined : ({ animation: "fadeIn .4s ease-out" } as React.CSSProperties)}
      >
        <h1 className="hub-title">Welcome</h1>

        {shortPk && (
          <p className="hub-connection" aria-live="polite">
            <span>Connected</span> <span className="pill">{shortPk}</span>
          </p>
        )}

        <nav className="hub-stack" aria-label="Main actions">
          <Action
            innerRef={firstActionRef}
            to="/start"
            title="START"
            sub="Swap JAL ⇄ SOL & provide liquidity on Raydium"
            delayMs={40}
            ariaLabel="Start: swap JAL and SOL and provide liquidity on Raydium"
          />
          <Action
            to="/utility"
            title="JAL / SOL (Utility)"
            sub="Tools, docs, and live utilities"
            delayMs={90}
            ariaLabel="Open JAL / SOL utilities"
          />
          <Action
            to="/terms"
            title="Terms of Use"
            sub="Read before using the dapp"
            delayMs={140}
            ariaLabel="Read the Terms of Use"
          />
        </nav>
      </div>
    </main>
  );
}
