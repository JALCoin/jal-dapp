// src/components/RaydiumSwapButton.tsx
import { useMemo } from "react";
// ❌ was: import { JAL_MINT } from '@/config/tokens';
import { JAL_MINT } from "../config/tokens";  // <= relative path

function raydiumSwapUrl(outputMint: string) {
  return `https://raydium.io/swap/?inputCurrency=sol&outputCurrency=${encodeURIComponent(
    outputMint
  )}&fixed=in`;
}

export default function RaydiumSwapButton({
  mint = JAL_MINT,
  className = "chip",
  children,
}: {
  mint?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const url = useMemo(() => raydiumSwapUrl(mint), [mint]);

  const onClick = () => {
    setTimeout(() => {
      if (!document.hidden) window.location.href = url;
    }, 100);
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={onClick}
    >
      {children ?? "Swap SOL → JAL on Raydium"}
    </a>
  );
}
