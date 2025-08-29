// src/pages/Jal.tsx
import { useEffect, useMemo, useState, useId } from "react";
import { useSearchParams } from "react-router-dom";
import { JAL_MINT } from "../config/tokens";
import RaydiumSwapEmbed from "../components/RaydiumSwapEmbed";

type Props = { inHub?: boolean };

// Raydium expects `sol` for native SOL (not the wSOL mint)
const SOL_PARAM = "sol";
const RAY_URL = `https://raydium.io/swap/?inputMint=${SOL_PARAM}&outputMint=${encodeURIComponent(
  JAL_MINT
)}`;

export default function Jal({ inHub = false }: Props) {
  const [swapOpen, setSwapOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [params, setParams] = useSearchParams();

  // a11y IDs
  const jalTitleId = useId();
  const copiedRegionId = useId();
  const swapRegionId = useId();
  const swapTitleId = useId();

  // Deep-link: ?swap=1 opens the embedded swap
  useEffect(() => {
    if (params.get("swap") === "1") setSwapOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL param in sync
  useEffect(() => {
    const next = new URLSearchParams(params);
    if (swapOpen) next.set("swap", "1");
    else if (next.get("swap") === "1") next.delete("swap");
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapOpen]);

  // Pretty-print mint
  const shortMint = useMemo(
    () =>
      JAL_MINT.length > 12
        ? `${JAL_MINT.slice(0, 6)}...${JAL_MINT.slice(-6)}`
        : JAL_MINT,
    []
  );

  // Copy helpers
  const copyMint = async () => {
    try {
      await navigator.clipboard.writeText(JAL_MINT);
      setCopied(true);
      setTimeout(() => setCopied(false), 900);
    } catch {
      /* no-op */
    }
  };

  const Content = (
    <>
      <h1 id={jalTitleId} className="jal-title">JAL</h1>
      <p className="jal-subtitle">About JAL — story, mission, and how SOL ⇄ JAL works.</p>

      {/* Mint actions */}
      <div className="jal-actions" role="group" aria-label="Token address and actions">
        <code className="jal-chip" title={JAL_MINT} aria-label={`Mint address ${JAL_MINT}`}>
          {shortMint}
        </code>
        <button
          type="button"
          className="jal-btn"
          onClick={copyMint}
          aria-controls={copiedRegionId}
          aria-describedby={copiedRegionId}
        >
          Copy Mint
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

      {/* live region for copy feedback */}
      <div id={copiedRegionId} aria-live="polite" className="sr-only">
        {copied ? "Copied!" : ""}
      </div>

      {/* Swap section (embedded) */}
      <div className="jal-cta" style={{ marginTop: 12 }}>
        {!swapOpen ? (
          <button
            type="button"
            className="jal-btn jal-btn--primary"
            onClick={() => setSwapOpen(true)}
            aria-expanded={swapOpen}
            aria-controls={swapRegionId}
          >
            Open SOL ⇄ JAL Swap
          </button>
        ) : (
          <button
            type="button"
            className="jal-btn"
            onClick={() => setSwapOpen(false)}
            aria-expanded={swapOpen}
            aria-controls={swapRegionId}
          >
            Close Swap
          </button>
        )}
      </div>

      {swapOpen && (
        <section
          id={swapRegionId}
          className="card swap-embed-card"
          role="region"
          aria-labelledby={swapTitleId}
          style={{ marginTop: 12 }}
        >
          <div className="swap-embed-header">
            <h3 id={swapTitleId} style={{ margin: 0 }}>Swap SOL ⇄ JAL</h3>
            <a className="jal-link" href={RAY_URL} target="_blank" rel="noreferrer">
              Open on Raydium ↗
            </a>
          </div>

          {/* If Raydium disallows iframes via CSP/X-Frame-Options, keep this component mapping to a working embed. */}
          <RaydiumSwapEmbed inputMint={SOL_PARAM} outputMint={JAL_MINT} height={700} />
        </section>
      )}
    </>
  );

  if (inHub) {
    return (
      <section className="hub-content in-hub" aria-labelledby={jalTitleId}>
        {Content}
      </section>
    );
  }

  return (
    <main className="jal-page">
      <section className="jal-panel" aria-labelledby={jalTitleId}>
        {Content}
      </section>
    </main>
  );
}
