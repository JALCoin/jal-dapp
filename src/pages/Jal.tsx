import { useMemo, useState } from "react";

type Props = { inHub?: boolean };

const JAL_MINT = "9TCwNEKKPPgZBQ3CopjdhW9j8fZNt8SH7waZJTFRgx7v";

export default function Jal({ inHub = false }: Props) {
  const [copied, setCopied] = useState(false);

  const shortMint = useMemo(
    () =>
      JAL_MINT.length > 12
        ? `${JAL_MINT.slice(0, 6)}...${JAL_MINT.slice(-6)}`
        : JAL_MINT,
    []
  );

  async function copyMint() {
    try {
      await navigator.clipboard.writeText(JAL_MINT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 900);
    } catch {
      setCopied(false);
    }
  }

  const content = (
    <>
      <h1 className="jal-title">JAL Reference</h1>
      <p className="jal-subtitle">
        This page is a technical reference for the JAL mint address and project context.
      </p>

      <div className="jal-actions" role="group" aria-label="Token address and actions">
        <code className="jal-chip" title={JAL_MINT} aria-label={`Mint address ${JAL_MINT}`}>
          {shortMint}
        </code>

        <button type="button" className="jal-btn" onClick={() => void copyMint()}>
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

      <div aria-live="polite" className="sr-only">
        {copied ? "Copied!" : ""}
      </div>

      <p className="jal-subtitle">
        No swap venue, token sale, or managed trading service is presented through this page.
        Any external market links should only be added after separate legal and platform review.
      </p>
    </>
  );

  if (inHub) {
    return <section className="hub-content in-hub">{content}</section>;
  }

  return (
    <main className="jal-page">
      <section className="jal-panel">{content}</section>
    </main>
  );
}
