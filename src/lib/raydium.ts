import { JAL_MINT } from "../config/tokens";

type FixedSide = "in" | "out";

/** Builds a Raydium swap URL prefilled with tokens. */
export function raydiumSwapUrl(
  input: string = "sol",
  outputMint: string = JAL_MINT,
  fixed: FixedSide = "in"
) {
  const base = "https://raydium.io/swap/";
  const q = new URLSearchParams({
    fixed,
    inputCurrency: input,          // "sol" is accepted shorthand for SOL
    outputCurrency: outputMint,    // SPL mint address
  });
  return `${base}?${q.toString()}`;
}
