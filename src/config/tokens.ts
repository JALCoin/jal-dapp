// src/config/tokens.ts
import { PublicKey } from "@solana/web3.js";

/**
 * Prefer an env override, fall back to your default JAL mint.
 * Set VITE_JAL_MINT in your .env(.local) when needed.
 */
const ENV_MINT = (import.meta.env.VITE_JAL_MINT as string | undefined)?.trim();
const DEFAULT_JAL_MINT = "9TCwNEKKPPgZBQ3CopjdhW9j8fZNt8SH7waZJTFRgx7v"; // <-- your current JAL mint

// Export as string (Landing.tsx compares strings against parsed token accounts)
export const JAL_MINT: string = ENV_MINT && ENV_MINT !== "REPLACE_WITH_JAL_MINT"
  ? ENV_MINT
  : DEFAULT_JAL_MINT;

// Also export a PublicKey for places that need it
export const JAL_MINT_KEY: PublicKey = (() => {
  try {
    return new PublicKey(JAL_MINT);
  } catch {
    console.warn("[tokens] Invalid JAL mint provided, using default:", JAL_MINT);
    return new PublicKey(DEFAULT_JAL_MINT);
  }
})();

// (Optional) centralize JAL decimals if you reference it elsewhere
export const JAL_DECIMALS = 9;
