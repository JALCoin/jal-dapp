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

/* ---------------- Prefers-reduced-motion ---------------- */
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

/* ---------------- Real viewport height (mobile-safe) ---------------- */
function useViewportVar() {
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    setVH();
    window.addEventListener("resize", setVH);
    window.addEventListener("orientationchange", setVH);
    return () => {
      window.removeEventListener("resize", setVH);
      window.removeEventListener("orientationchange", setVH);
    };
  }, []);
}

/* ---------------- Animate Hub leaving, then navigate ---------------- */
function runLeaveTransition({
  selector = ".hub-overlay",
  leaveClass = "route-leave-hub",
  durationMs = 380,
  onDone,
}: {
  selector?: string;
  leaveClass?: string;
  durationMs?: number;
  onDone: () => void;
}) {
  const node = document.querySelector<HTMLElement>(selector);
  if (!node) return onDone();
  node.classList.add(leaveClass);

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    node.classList.remove(leaveClass);
    onDone();
  };

  node.addEventListener("animationend", cleanup, { once: true });
  setTimeout(cleanup, durationMs + 80); // safety
}

export default function Hub() {
  const { connected, publicKey } = useWallet();
  const navigate = useNavigate();
  const reducedMotion = usePrefersReducedMotion();
  useViewportVar();

  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  // Guard: if wallet disconnects, bounce to landing
  useEffect(() => {
    if (!connected) navigate("/", { replace: true });
  }, [connected, navigate]);

  // Scroll to top on mount (for desktop)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }, [reducedMotion]);

  // Short display of PK
  const shortPk = useMemo(() => {
    if (!publicKey) return "";
    const s = publicKey.toBase58();
    return `${s.slice(0, 4)}…${s.slice(-4)}`;
  }, [publicKey]);

  // Fade/scale in once
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Close back to landing
  const startClose = useCallback(() => {
    setClosing(true);
    const go = () => navigate("/", { replace: true });
    if (reducedMotion) go();
    else setTimeout(go, 300);
  }, [navigate, reducedMotion]);

  // Background click -> close (only if truly the overlay)
  const onOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) startClose();
  };

  // Focus trap inside the panel
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
      if (focusables.length < 2) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Keyboard shortcuts with leaving animation
  useEffect(() => {
    if (!connected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement | null;
      if (t && /input|textarea|select/.test(t.tagName.toLowerCase())) return;

      const go = (path: string) => {
        if (reducedMotion) navigate(path);
        else runLeaveTransition({ onDone: () => navigate(path) });
      };

      if (e.key === "1") { e.preventDefault(); go("/jal"); }
      if (e.key === "2") { e.preventDefault(); go("/utility"); }
      if (e.key === "3") { e.preventDefault(); go("/vault"); }
      if (e.key === "4") { e.preventDefault(); go("/how-it-works"); }
      if (e.key === "Escape") startClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [connected, navigate, reducedMotion, startClose]);

  /* ---------------- Image Action link ---------------- */
  const ImgAction = useCallback(
    ({
      to,
      src,
      alt,
      delayMs,
      innerRef,
      float,
      onClick,
    }: {
      to: string;
      src: string;
      alt: string;
      delayMs?: number;
      innerRef?: React.Ref<HTMLAnchorElement>;
      float?: boolean;
      onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
    }) => (
      <Link
        ref={innerRef}
        to={to}
        className="hub-btn img-btn"
        aria-label={alt}
        onClick={(e) => {
          if (onClick) return onClick(e);
          if (reducedMotion) return; // default Link behavior
          e.preventDefault();
          runLeaveTransition({ onDone: () => navigate(to) });
        }}
        style={
          reducedMotion
            ? undefined
            : { animation: "fadeInUp .35s ease-out both", animationDelay: `${delayMs ?? 0}ms` }
        }
      >
        <img
          className={`hub-gif${float ? " float" : ""}`}
          src={src}
          alt={alt}
          loading="eager"
          decoding="async"
          draggable={false}
        />
      </Link>
    ),
    [navigate, reducedMotion]
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
      onClick={onOverlayClick}
      // lock to true viewport height even on mobile address-bar resize
      style={{
        minHeight: "calc(var(--vh, 1vh) * 100)",
        overscrollBehavior: "contain",
      }}
    >
      {/* keep backdrop light + non-interactive */}
      <div className="hub-backdrop" aria-hidden="true">
        <div className="landing-gradient hub-ghost" style={{ height: "100%" }} />
      </div>

      <section
        ref={panelRef}
        className={`hub-panel hub-panel--fit${mounted ? "" : " is-pre"}`}
        onClick={(e) => e.stopPropagation()} // prevent overlay close when clicking inside
      >
        <div className="hub-panel-top">
          <div className="hub-connection" role="status" aria-live="polite">
            <span>Connected</span>
            {shortPk && <span className="pill">{shortPk}</span>}
          </div>
          <WalletDisconnectButton className="hub-disconnect-btn" />
        </div>

        <div className="hub-panel-body">
          <h1 className="hub-title" id={titleId}>Welcome</h1>

          <nav className="hub-stack hub-stack--responsive" aria-label="Main actions">
            <ImgAction
              innerRef={firstActionRef}
              to="/jal"
              src="/JAL.gif"
              alt="Swap SOL to JAL tokens"
              delayMs={40}
              float
            />
            <ImgAction
              to="/utility"
              src="/JALSOL.gif"
              alt="Use JAL/SOL — create tokens, tools, and utilities"
              delayMs={90}
              float
            />
            <ImgAction
              to="/vault"
              src="/VAULT.gif"
              alt="My Vault — track your creations and holdings"
              delayMs={140}
              float
            />
            <ImgAction
              to="/how-it-works"
              src="/HOW-IT-WORKS.gif"
              alt="How It Works — guides, terms, and resources"
              delayMs={190}
              float
            />
          </nav>
        </div>
      </section>
    </div>
  );
}
