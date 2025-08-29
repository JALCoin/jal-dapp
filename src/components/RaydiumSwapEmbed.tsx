// src/components/RaydiumSwapEmbed.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { JAL_MINT } from "../config/tokens";

type Props = {
  /** 'sol' for native SOL or WSOL mint */
  inputMint?: string;
  /** target mint (e.g., JAL) */
  outputMint?: string;
  /** px height for wrapper */
  height?: number;
  /** extra wrapper class */
  className?: string;
  /** try mint params first */
  preferMintParams?: boolean;
};

function buildUrl(
  kind: "mint" | "currency",
  input: string,
  output: string,
  fixedIn = true
) {
  const u = new URL("https://raydium.io/swap/");
  if (kind === "mint") {
    u.searchParams.set("inputMint", input);
    u.searchParams.set("outputMint", output);
  } else {
    u.searchParams.set("inputCurrency", input);
    u.searchParams.set("outputCurrency", output);
  }
  if (fixedIn) u.searchParams.set("fixed", "in");
  return u.toString();
}

export default function RaydiumSwapEmbed({
  inputMint = "sol",
  outputMint = JAL_MINT,
  height = 700,
  className = "",
  preferMintParams = true,
}: Props) {
  const [mode, setMode] = useState<"mint" | "currency">(
    preferMintParams ? "mint" : "currency"
  );
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const triedFallbackRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const src = useMemo(
    () => buildUrl(mode, inputMint, outputMint, true),
    [mode, inputMint, outputMint]
  );

  useEffect(() => {
    // If onLoad never fires, try other param style, then show fallback.
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setLoading(true);
    setBlocked(false);
    timerRef.current = window.setTimeout(() => {
      if (!triedFallbackRef.current) {
        triedFallbackRef.current = true;
        setMode((m) => (m === "mint" ? "currency" : "mint"));
      } else {
        setBlocked(true);
        setLoading(false);
      }
    }, 2000);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [src]);

  return (
    <div
      className={`swap-embed-wrap ${className}`.trim()}
      style={{ height }}
      aria-label="Raydium swap embed"
    >
      {!blocked ? (
        <iframe
          key={src}
          className="swap-embed-iframe"
          title="Raydium Swap"
          src={src}
          loading="eager"
          referrerPolicy="no-referrer"
          allow="clipboard-read; clipboard-write; fullscreen"
          onLoad={() => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
            setLoading(false);
          }}
        />
      ) : (
        <div
          style={{
            display: "grid",
            placeItems: "center",
            padding: 16,
            height: "100%",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: 520 }}>
            <p style={{ opacity: 0.9, marginBottom: 12 }}>
              The swap can’t be embedded in this browser. Open it in a new tab:
            </p>
            <a href={src} target="_blank" rel="noreferrer" className="button gold">
              Open on Raydium ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
