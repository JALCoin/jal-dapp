export const SOLANA_RPC_URL =
  (import.meta as ImportMeta & {
    env?: { VITE_SOLANA_RPC_URL?: string };
  }).env?.VITE_SOLANA_RPC_URL || "https://solana-proxy-production.up.railway.app";

export const HELIUS_METADATA_RPC =
  (import.meta as ImportMeta & {
    env?: { VITE_HELIUS_RPC_URL?: string };
  }).env?.VITE_HELIUS_RPC_URL || SOLANA_RPC_URL;