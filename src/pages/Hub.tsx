// src/pages/Hub.tsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useId,
} from "react";
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

  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  // Redirect if disconnected
  useEffect(() => {
    if (!connected) navigate("/", { replace: true });
  }, [connected, navigate]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }, [reducedMotion]);

  // Short PK
  const shortPk = useMemo(() => {
    if (!publicKey) return "";
    const s = publicKey.toBase58();
    return `${s.slice(0, 4)}…${s.slice(-4)}`;
  }, [publicKey]);

  // Animate in after mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Keyboard shortcuts (1=JAL, 2=Utility, 3=Vault, 4=How It Works)
  useEffect(() => {
    if (!connected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement | null;
      if (t && /input|textarea|select/.test(t.tagName.toLowerCase())) return;

      if (e.key === "1") navigate("/jal");
      if (e.key === "2") navigate("/utility");
      if (e.key === "3") navigate("/vault");
      if (e.key === "4") navigate("/how-it-works");
      if (e.key === "Escape") startClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [connected, navigate]);

  // Focus trap
  const panelRef = useRef<HTMLElement | null>(null);
  const firstActionRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    firstActionRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const root = panelRef.current;
      if (!root) return;
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter(
        (el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden")
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Smooth close
  const startClose = () => {
    setClosing(true);
    setTimeout(() => {
      navigate("/", { replace: true });
    }, reducedMotion ? 0 : 300);
  };

  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) startClose();
  };

  // Image Action link (uses /public asset paths)
  const ImgAction = useCallback(
    ({
      to,
      src,
      alt,
      delayMs,
      innerRef,
    }: {
      to: string;
      src: string;
      alt: string;
      delayMs?: number;
      innerRef?: React.Ref<HTMLAnchorElement>;
    }) => (
      <Link
        ref={innerRef}
        to={to}
        className="hub-btn img-btn"
        aria-label={alt}
        style={
          reducedMotion
            ? undefined
            : {
                animation: "fadeInUp .35s ease-out both",
                animationDelay: `${delayMs ?? 0}ms`,
              }
        }
      >
        <img
          className="hub-gif"
          src={src}
          alt={alt}
          loading="eager"
          draggable={false}
        />
      </Link>
    ),
    [reducedMotion]
  );

  const titleId = useId();
  const dialogId = useId();

  return (
    <div
      className={`hub-overlay${closing ? " is-closing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      id={dialogId}
      onClick={onBackdropClick}
    >
      <div className="hub-backdrop" aria-hidden="true">
        <div className="landing-gradient hub-ghost" />
      </div>

      <section
        ref={panelRef}
        className={`hub-panel${mounted ? "" : " is-pre"}`}
      >
        <div className="hub-panel-top">
          <div className="hub-connection" role="status" aria-live="polite">
            <span>Connected</span>
            {shortPk && <span className="pill">{shortPk}</span>}
          </div>
          <WalletDisconnectButton className="hub-disconnect-btn" />
        </div>

        <div className="hub-panel-body">
          <h1 className="hub-title" id={titleId}>
            Welcome
          </h1>

          <nav className="hub-stack" aria-label="Main actions">
            <ImgAction
              innerRef={firstActionRef}
              to="/jal"
              src="/JAL.gif"
              alt="Swap SOL to JAL tokens"
              delayMs={40}
            />
            <ImgAction
              to="/utility"
              src="/JALSOL.gif"
              alt="Use JAL/SOL — create tokens, tools, and utilities"
              delayMs={90}
            />
            <ImgAction
              to="/vault"
              src="/VAULT.gif"
              alt="My Vault — track your creations and holdings"
              delayMs={140}
            />
            <ImgAction
              to="/how-it-works"
              src="/HOW-IT-WORKS.gif"
              alt="How It Works — guides, terms, and resources"
              delayMs={190}
            />
          </nav>
        </div>
      </section>
    </div>
  );
}
