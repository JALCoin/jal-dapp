// src/pages/Jal.tsx
import { useEffect, useMemo, useRef, useState, useId } from "react";
import { createPortal } from "react-dom";

type Props = { inHub?: boolean };

const JAL_MINT = "9TCwNEKKPPgZBQ3CopjdhW9j8fZNt8SH7waZJTFRgx7v";
const RAYDIUM_URL =
  "https://raydium.io/swap/?inputMint=sol&outputMint=9TCwNEKKPPgZBQ3CopjdhW9j8fZNt8SH7waZJTFRgx7v";

export default function Jal({ inHub = false }: Props) {
  const [swapOpen, setSwapOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Unique IDs for a11y
  const jalTitleId = useId();
  const swapDialogId = useId();
  const swapTitleId = useId();

  // Shorten mint for chip display
  const shortMint = useMemo(
    () =>
      JAL_MINT.length > 12
        ? `${JAL_MINT.slice(0, 6)}...${JAL_MINT.slice(-6)}`
        : JAL_MINT,
    []
  );

  // Copy mint address
  const copyMint = async () => {
    try {
      await navigator.clipboard.writeText(JAL_MINT);
      setCopied(true);
      setTimeout(() => setCopied(false), 900);
    } catch {
      // no-op
    }
  };

  // ----- Modal a11y / focus management -----
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!swapOpen) return;

    // Focus first interactive element
    closeBtnRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSwapOpen(false);
      if (e.key !== "Tab") return;

      const root = modalRef.current;
      if (!root) return;

      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button, textarea, input, select, iframe, [tabindex]:not([tabindex="-1"])'
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

    document.addEventListener("keydown", onKeyDown);

    // lock body scroll under modal
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [swapOpen]);

  // Close on backdrop click
  const onOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setSwapOpen(false);
  };

  // ---------- Shared content ----------
  const Content = (
    <>
      <h1 id={jalTitleId} className="jal-title">JAL</h1>
      <p className="jal-subtitle">
        About JAL — story, mission, and how SOL ⇄ JAL works.
      </p>

      {/* Mint actions */}
      <div className="jal-actions" role="group" aria-label="Token address and actions">
        <code
          className="jal-chip"
          title={JAL_MINT}
          aria-label={`Mint address ${JAL_MINT}`}
        >
          {shortMint}
        </code>

        <button
          type="button"
          className="jal-btn"
          onClick={copyMint}
          aria-live="polite"
        >
          {copied ? "Copied!" : "Copy Mint"}
        </button>

        <a
          className="jal-link"
          href={`https://explorer.solana.com/address/${JAL_MINT}`}
          target="_blank"
          rel="noreferrer"
        >
          View on Explorer
        </a>
      </div>

      {/* CTA */}
      <div className="jal-cta">
        <button
          type="button"
          className="jal-btn jal-btn--primary"
          onClick={() => setSwapOpen(true)}
          aria-haspopup="dialog"
          aria-controls={swapDialogId}
        >
          Open SOL ⇄ JAL Swap
        </button>
      </div>
    </>
  );

  // ---------- Modal ----------
  const Modal = swapOpen
    ? createPortal(
        <>
          <div className="modal-overlay" onClick={onOverlayClick} />
          <div
            className="modal-host"
            role="dialog"
            aria-modal="true"
            aria-labelledby={swapTitleId}
            id={swapDialogId}
          >
            <div ref={modalRef} className="modal">
              {/* Header */}
              <div className="modal-header">
                <div className="modal-spacer" />
                <div className="modal-title" id={swapTitleId}>
                  <div className="modal-title-main">SOL ⇄ JAL Swap</div>
                  <div className="modal-title-sub">Powered by Raydium</div>
                </div>
                <button
                  ref={closeBtnRef}
                  type="button"
                  className="modal-close"
                  onClick={() => setSwapOpen(false)}
                  aria-label="Close swap dialog"
                >
                  ✕
                </button>
              </div>

              {/* Swap iframe */}
              <iframe title="Raydium Swap" src={RAYDIUM_URL} className="modal-iframe" />

              {/* Footer link */}
              <div className="modal-footer">
                <a className="jal-link" href={RAYDIUM_URL} target="_blank" rel="noreferrer">
                  Open on Raydium
                </a>
              </div>
            </div>
          </div>
        </>,
        document.body
      )
    : null;

  // ---------- Render ----------
  if (inHub) {
    // In-panel mode: render content only inside Hub’s glass panel
    return (
      <>
        <section className="hub-content in-hub" aria-labelledby={jalTitleId}>
          {Content}
        </section>
        {Modal}
      </>
    );
  }

  // Standalone page mode (legacy / direct route)
  return (
    <main className="jal-page">
      <section className="jal-panel" aria-labelledby={jalTitleId}>
        {Content}
      </section>
      {Modal}
    </main>
  );
}
