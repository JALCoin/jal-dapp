// src/config/rpc.ts
import { Connection } from "@solana/web3.js";

export function getRpcEndpoint(): string {
  // Priority: injected -> env -> public
  const injected = (typeof window !== "undefined" && (window as any).__SOLANA_RPC_ENDPOINT__) as
    | string
    | undefined;
  const env = import.meta.env.VITE_SOLANA_RPC as string | undefined;
  return injected ?? env ?? "https://api.mainnet-beta.solana.com";
}

export function getRpcHeaders(): Record<string, string> | undefined {
  const token = import.meta.env.VITE_SOLANA_RPC_TOKEN as string | undefined;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export function makeConnection(commitment: "processed" | "confirmed" | "finalized" = "confirmed") {
  return new Connection(getRpcEndpoint(), {
    commitment,
    httpHeaders: getRpcHeaders(),
  });
}
