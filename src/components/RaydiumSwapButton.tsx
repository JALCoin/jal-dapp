import { useMemo } from "react";
import { JAL_MINT } from "@/config/tokens";

/** Raydium swap URL helper */
function raydiumSwapUrl(outputMint: string) {
  // Raydium expects `inputCurrency=sol` for SOL -> token
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

  // Using a plain anchor keeps browsers from blocking it.
  // We also add a tiny JS fallback in case target=_blank is disabled.
  const onClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    // if a popup blocker prevents tab creation, fall back to same-tab navigation
    setTimeout(() => {
      // if document still focused and no new tab opened, just navigate
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
