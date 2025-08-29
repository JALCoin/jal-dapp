import { raydiumSwapUrl } from "../lib/raydium";
import { JAL_MINT } from "../config/tokens";

export default function RaydiumSwapButton({
  className = "vault-button",
  label = "Swap SOL → JAL on Raydium ↗",
}: { className?: string; label?: string }) {
  const href = raydiumSwapUrl("sol", JAL_MINT, "in");
  const missing = !JAL_MINT || JAL_MINT.includes("REPLACE_");

  return (
    <a
      href={missing ? undefined : href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-disabled={missing}
      onClick={(e) => missing && e.preventDefault()}
      title={missing ? "Set JAL mint in src/config/tokens.ts or VITE_JAL_MINT" : "Open Raydium swap"}
    >
      {label}
    </a>
  );
}
