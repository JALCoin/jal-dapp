// src/pages/Hub.tsx
import { useEffect, useMemo, useRef, useState, useCallback, type CSSProperties } from "react";
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

  useEffect(() => {
    if (!connected) navigate("/", { replace: true });
  }, [connected, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }, [reducedMotion]);

  useEffect(() => {
    if (!connected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement | null;
      if (t && /input|textarea|select/.test(t.tagName.toLowerCase())) return;
      if (e.key === "1") navigate("/jal");
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

  const firstActionRef = useRef<HTMLAnchorElement | null>(null);
  useEffect(() => {
    firstActionRef.current?.focus();
  }, []);

  // NEW: mount flag so the pop-in only plays once
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
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
      sub?: string;
      delayMs?: number;
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
            : ({ animation: "fadeInUp .35s ease-out both", animationDelay: `${delayMs ?? 0}ms` } as CSSProperties)
        }
      >
        {title}
        {sub && <span className="sub">{sub}</span>}
      </Link>
    ),
    [reducedMotion]
  );

  return (
    <div className="hub-overlay" role="dialog" aria-modal="true" aria-label="JAL Hub">
      <div className="hub-backdrop" aria-hidden="true">
        <div className="landing-gradient hub-ghost" />
      </div>

      <section
        className={`hub-panel${mounted ? "" : " is-pre"}`}   {/* <- only animate after mount */}
      >
        <div className="hub-panel-top">
          <div className="hub-connection">
            <span>Connected</span>
            {shortPk && <span className="pill">{shortPk}</span>}
          </div>
          <WalletDisconnectButton className="hub-disconnect-btn" />
        </div>

        <div className="hub-panel-body">
          <h1 className="hub-title">Welcome</h1>

          <nav className="hub-stack" aria-label="Main actions">
            <Action
              innerRef={firstActionRef}
              to="/jal"
              title="START"
              sub="Enter JAL — info + SOL ⇄ JAL swap"
              delayMs={40}
              ariaLabel="Open JAL page"
            />
            <Action
              to="/utility"
              title="UTILITY"
              sub="Tools and live utilities"
              delayMs={90}
              ariaLabel="Open utilities"
            />
            <Action
              to="/terms"
              title="TERMS"
              sub="Read before using the dapp"
              delayMs={140}
              ariaLabel="Read terms of use"
            />
          </nav>
        </div>
      </section>
    </div>
  );
}
