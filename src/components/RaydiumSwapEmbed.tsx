// src/components/RaydiumSwapEmbed.tsx
import { useMemo } from "react";
import { JAL_MINT } from "../config/tokens";

type Props = {
  inputMint?: string;   // "sol" alias or WSOL mint
  outputMint?: string;  // JAL mint
  height?: number;      // px height for the iframe wrapper
  className?: string;   // optional extra class on wrapper
};

function buildRaydiumUrl(input: string, output: string) {
  const qs = new URLSearchParams({
    inputMint: input,
    outputMint: output,
    fixed: "in",
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
        /* omit the `loading` attribute to avoid type issues on older react-dom types */
        referrerPolicy="no-referrer"
        allow="clipboard-read; clipboard-write; fullscreen"
      />
    </div>
  );
}
