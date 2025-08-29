// src/components/RaydiumSwapButton.tsx
import { useMemo } from "react";
import { JAL_MINT } from "../config/tokens";

type Props = {
  /** Output token mint; defaults to your JAL mint */
  mint?: string;
  /** Class name for styling (defaults to chip-style) */
  className?: string;
  /** Custom label; default provided */
  children?: React.ReactNode;
  /** Optional input token param (Raydium expects "sol" for SOL) */
  inputMint?: string;
};

function buildRaydiumUrl(outputMint: string, inputMint = "sol") {
  const u = new URL("https://raydium.io/swap/");
  // Raydium expects "sol" literal for native SOL
  u.searchParams.set("inputMint", inputMint.toLowerCase() === "sol" ? "sol" : inputMint);
  u.searchParams.set("outputMint", outputMint);
  // Hint Raydium that input is fixed (optional)
  u.searchParams.set("fixed", "in");
  return u.toString();
}

export default function RaydiumSwapButton({
  mint = JAL_MINT,
  className = "chip",
  children,
  inputMint = "sol",
}: Props) {
  const url = useMemo(() => buildRaydiumUrl(mint, inputMint), [mint, inputMint]);

  const onClick = () => {
    // Fallback: if the browser blocks the new tab, navigate current tab
    setTimeout(() => {
      if (typeof document !== "undefined" && !document.hidden && typeof window !== "undefined") {
        window.location.href = url;
      }
    }, 120);
  };

  const label = children ?? "Swap SOL → JAL on Raydium";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={onClick}
      title="Open Raydium swap (SOL → JAL)"
      aria-label="Open Raydium swap (SOL to JAL)"
    >
      {label}
    </a>
  );
}
