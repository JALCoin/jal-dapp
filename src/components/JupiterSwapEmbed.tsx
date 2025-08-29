import React from "react";
import { JAL_MINT } from "../config/tokens";

// SOL mint (native-wrapped)
const SOL_MINT = "So11111111111111111111111111111111111111112";

type Props = {
  inputMint?: string;
  outputMint?: string;
  className?: string;
  height?: number | string;
};

export default function JupiterSwapEmbed({
  inputMint = SOL_MINT,
  outputMint = JAL_MINT,
  className,
  height = 700,
}: Props) {
  const src = `https://terminal.jup.ag/#/swap?inputMint=${encodeURIComponent(
    inputMint
  )}&outputMint=${encodeURIComponent(
    outputMint
  )}&theme=dark&version=5&fixedInputMint=true&fixedOutputMint=true`;

  return (
    <div className={className ?? "swap-embed-wrap"}>
      <iframe
        title="Swap SOL → JAL"
        src={src}
        style={{
          width: "100%",
          height: typeof height === "number" ? `${height}px` : height,
          border: 0,
          borderRadius: 12,
          overflow: "hidden",
        }}
        // minimal, permissive enough for the widget
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        allow="clipboard-read; clipboard-write; web-share"
        loading="lazy"
      />
    </div>
  );
}
