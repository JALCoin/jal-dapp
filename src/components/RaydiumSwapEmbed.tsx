// src/components/RaydiumSwapEmbed.tsx
import { useMemo } from "react";
import { JAL_MINT } from "../config/tokens";

type Props = {
  inputMint?: string;   // Raydium accepts "sol" alias or the WSOL mint
  outputMint?: string;  // JAL mint
  height?: number;      // px height for the iframe wrapper
  className?: string;   // optional extra class on wrapper
};

function buildRaydiumUrl(input: string, output: string) {
  // Raydium v2 site supports inputMint/outputMint params
  const qs = new URLSearchParams({
    inputMint: input,          // e.g. "sol" or the WSOL mint
    outputMint: output,        // e.g. your JAL mint
    fixed: "in",               // lock input side (optional)
  });
  return `https://raydium.io/swap/?${qs.toString()}`;
}

export default function RaydiumSwapEmbed({
  inputMint = "sol",
  outputMint = JAL_MINT,
  height = 700,
  className = "",
}: Props) {
  const src = useMemo(() => buildRaydiumUrl(inputMint, outputMint), [inputMint, outputMint]);

  return (
    <div
      className={`swap-embed-wrap ${className}`.trim()}
      style={{ height }}
      aria-label="Raydium swap embed"
    >
      <iframe
        className="swap-embed-iframe"
        title="Raydium Swap"
        src={src}
        loading="eager"
        referrerPolicy="no-referrer"
        allow="clipboard-read; clipboard-write; fullscreen"
      />
    </div>
  );
}
