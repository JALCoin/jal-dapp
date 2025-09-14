// src/config/rpc.ts
import { Connection } from "@solana/web3.js";

export function getRpcEndpoint(): string {
  const injected =
    (typeof window !== "undefined" &&
      (window as any).__SOLANA_RPC_ENDPOINT__) as string | undefined;

  const heliusKey = import.meta.env.VITE_HELIUS_API_KEY as string | undefined;
  const envRpc = import.meta.env.VITE_SOLANA_RPC as string | undefined;

  // 1) explicit override from index.html
  if (injected) return injected;

  // 2) build from Helius key if present
  if (heliusKey) {
    return `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`;
  }

  // 3) fallback to provided RPC or public
  return envRpc ?? "https://api.mainnet-beta.solana.com";
}

export function getRpcHeaders(): Record<string, string> | undefined {
  const token = import.meta.env.VITE_SOLANA_RPC_TOKEN as string | undefined;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export function makeConnection(
  commitment: "processed" | "confirmed" | "finalized" = "confirmed"
) {
  return new Connection(getRpcEndpoint(), {
    commitment,
    httpHeaders: getRpcHeaders(),
  });
}
