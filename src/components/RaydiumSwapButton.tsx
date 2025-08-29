// src/components/RaydiumSwapEmbed.tsx
import { useEffect, useMemo, useState } from "react";

type Props = {
  /** Raydium wants "sol" here (not wSOL mint). */
  inputMint?: string;       // e.g. "sol"
  outputMint?: string;      // e.g. your JAL mint
  className?: string;
};

export default function RaydiumSwapEmbed({
  inputMint = "sol",
  outputMint,
  className,
}: Props) {
  const src = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("inputCurrency", inputMint);          // <- align with Raydium
    if (outputMint) qs.set("outputCurrency", outputMint);
    qs.set("fixed", "in");                       // lock input to SOL
    return `https://raydium.io/swap/?${qs.toString()}`;
  }, [inputMint, outputMint]);

  // If CSP/X-Frame-Options blocks the iframe, show a hint with a link.
  const [loaded, setLoaded] = useState(false);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    setLoaded(false);
    setBlocked(false);
    const id = window.setTimeout(() => {
      if (!loaded) setBlocked(true);
    }, 4000);
    return () => clearTimeout(id);
  }, [src, loaded]);

  return (
    <>
      <div className={`swap-embed-wrap ${className ?? ""} ${loaded ? "ready" : "loading"}`.trim()}>
        <iframe
          title="Raydium Swap"
          src={src}
          className="swap-embed-iframe"
          loading="eager"
          allow="clipboard-read; clipboard-write"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          onLoad={() => setLoaded(true)}
        />
      </div>

      {blocked && (
        <p className="swap-embed-hint">
          The swap widget couldn’t load here (likely blocked from being embedded).
          <a href={src} target="_blank" rel="noreferrer"> Open Raydium in a new tab ↗</a>
        </p>
      )}
    </>
  );
}
