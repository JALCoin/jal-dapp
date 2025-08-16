// src/pages/Jal.tsx
import { useEffect, useMemo, useRef, useState } from "react";

const JAL_MINT = "9TCwNEKKPPgZBQ3CopjdhW9j8fZNt8SH7waZJTFRgx7v";
const RAYDIUM_URL =
  "https://raydium.io/swap/?inputMint=sol&outputMint=9TCwNEKKPPgZBQ3CopjdhW9j8fZNt8SH7waZJTFRgx7v";

export default function Jal() {
  const [swapOpen, setSwapOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Page mount animation (CSS-only)
  const pageRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const node = pageRef.current;
    if (!node) return;
    node.classList.add("route-enter-jal");
    const t = setTimeout(() => node.classList.remove("route-enter-jal"), 420);
    return () => {
      node.classList.remove("route-enter-jal");
      clearTimeout(t);
    };
  }, []);

  // Modal a11y/focus
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (!swapOpen) return;
    // Focus first actionable in modal
    closeBtnRef.current?.focus();

    // Trap Tab focus within modal
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSwapOpen(false);
      if (e.key !== "Tab") return;
      const root = modalRef.current;
      if (!root) return;
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button, textarea, input, select, iframe, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));
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
    // Prevent body scroll underneath modal
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [swapOpen]);

  // Shorten mint for chip display
  const shortMint = useMemo(
    () => (JAL_MINT.length > 12 ? `${JAL_MINT.slice(0, 6)}...${JAL_MINT.slice(-6)}` : JAL_MINT),
    []
  );

  // Copy mint address
  const copyMint = async () => {
    try {
      await navigator.clipboard.writeText(JAL_MINT);
      setCopied(true);
      setTimeout(() => setCopied(false), 900);
    } catch {
      // noop
    }
  };

  // Close on clicking backdrop (outside modal card)
  const onOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setSwapOpen(false);
  };

  return (
    <main ref={pageRef} className="jal-page">
      {/* Panel */}
      <section className="jal-panel" aria-labelledby="jal-title">
        <h1 id="jal-title" className="jal-title">JAL</h1>
        <p className="jal-subtitle">About JAL — story, mission, and how SOL ⇄ JAL works.</p>

        {/* Mint actions */}
        <div className="jal-actions" role="group" aria-label="Token address and actions">
          <code className="jal-chip" title={JAL_MINT} aria-label={`Mint address ${JAL_MINT}`}>
            {shortMint}
          </code>

          <button type="button" className="jal-btn" onClick={copyMint} aria-live="polite">
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
            aria-controls="jal-swap-dialog"
          >
            Open SOL ⇄ JAL Swap
          </button>
        </div>
      </section>

      {/* Modal */}
      {swapOpen && (
        <>
          <div className="modal-overlay" onClick={onOverlayClick} />
          <div
            className="modal-host"
            role="dialog"
            aria-modal="true"
            aria-labelledby="swap-title"
            id="jal-swap-dialog"
          >
            <div ref={modalRef} className="modal">
              {/* Header */}
              <div className="modal-header">
                <div className="modal-spacer" />
                <div className="modal-title" id="swap-title">
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
              <iframe
                title="Raydium Swap"
                src={RAYDIUM_URL}
                className="modal-iframe"
              />

              {/* Footer link */}
              <div className="modal-footer">
                <a
                  className="jal-link"
                  href={RAYDIUM_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open on Raydium
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
