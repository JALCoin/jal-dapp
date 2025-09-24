// src/lib/tx.ts
import {
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction as splTransferIx,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID as TOKEN_2022_ID_MAYBE,
} from "@solana/spl-token";
import { makeConnection } from "../config/rpc";

/* ────────────────────────────────────────────────────────────────────────── */
/* Program IDs                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

// Resolve Token-2022 id (same pattern used in Landing.tsx)
export const TOKEN_2022_PROGRAM_ID: PublicKey = (() => {
  try {
    const maybe = TOKEN_2022_ID_MAYBE as any;
    if (!maybe) return new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
    if (maybe instanceof PublicKey) return maybe;
    if (typeof maybe === "string") return new PublicKey(maybe);
    if (maybe?.toBase58) return new PublicKey(maybe.toBase58());
  } catch {}
  return new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
})();

/* ────────────────────────────────────────────────────────────────────────── */
/* Connection                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

export const connection = (): Connection => makeConnection("confirmed");

/* ────────────────────────────────────────────────────────────────────────── */
/* Priority fee hints (µ-lamports per CU)                                     */
/* ────────────────────────────────────────────────────────────────────────── */

export type PriorityHints = { low: number; med: number; high: number };

/**
 * Fetch recent priority fee distribution (if RPC supports it).
 * Returns micro-lamports per CU for low/med/high presets.
 */
export async function getPriorityFeeHints(): Promise<PriorityHints | null> {
  try {
    const conn = connection() as any;
    const arr = await conn.getRecentPrioritizationFees?.();
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const micros = arr
      .map((x: any) => Number(x?.prioritizationFee))
      .filter((n: number) => Number.isFinite(n))
      .sort((a: number, b: number) => a - b);
    if (!micros.length) return null;
    const pick = (p: number) =>
      micros[Math.max(0, Math.min(micros.length - 1, Math.floor(micros.length * p)))];
    return { low: pick(0.2), med: pick(0.5), high: pick(0.85) };
  } catch {
    return null;
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Core builder                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Build a Versioned v0 transaction with optional compute budget settings.
 * - priorityMicrolamports: micro-lamports per compute unit (priority fee)
 * - computeUnitLimit: CU limit for the tx (e.g., ~200k for router swaps)
 */
export async function buildV0Tx(opts: {
  payer: PublicKey;
  ixs: TransactionInstruction[];
  priorityMicrolamports?: number; // per compute unit (µ-lamports/CU)
  computeUnitLimit?: number;      // default ~200k if set; omit to skip
  alts?: AddressLookupTableAccount[];
}) {
  const {
    payer,
    ixs,
    priorityMicrolamports,
    computeUnitLimit = 200_000,
    alts = [],
  } = opts;

  const conn = connection();
  const { blockhash } = await conn.getLatestBlockhash("confirmed");

  const budgetIxs: TransactionInstruction[] = [];
  if (computeUnitLimit) {
    budgetIxs.push(ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnitLimit }));
  }
  if (priorityMicrolamports != null) {
    budgetIxs.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: Math.max(0, Math.floor(priorityMicrolamports)) }));
  }

  const msg = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions: [...budgetIxs, ...ixs],
  }).compileToV0Message(alts);

  return new VersionedTransaction(msg);
}

/* ────────────────────────────────────────────────────────────────────────── */
/* SOL transfer                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

export async function sendSol(opts: {
  from: Keypair;
  to: PublicKey | string;
  sol: number;                        // e.g. 0.01
  priorityMicrolamports?: number;
  computeUnitLimit?: number;
}) {
  const toPk = new PublicKey(opts.to);
  const lamports = Math.floor(opts.sol * LAMPORTS_PER_SOL);

  const ix = SystemProgram.transfer({
    fromPubkey: opts.from.publicKey,
    toPubkey: toPk,
    lamports,
  });

  const tx = await buildV0Tx({
    payer: opts.from.publicKey,
    ixs: [ix],
    priorityMicrolamports: opts.priorityMicrolamports ?? undefined,
    computeUnitLimit: opts.computeUnitLimit ?? 200_000,
  });

  tx.sign([opts.from]);
  return connection().sendTransaction(tx, { maxRetries: 3 });
}

/* ────────────────────────────────────────────────────────────────────────── */
/* SPL / Token-2022 transfer                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

export async function sendSpl(opts: {
  from: Keypair;
  to: PublicKey | string;
  mint: PublicKey | string;
  amount: number;                      // UI units (e.g., 12.34)
  decimals: number;                    // mint decimals
  useToken2022?: boolean;
  priorityMicrolamports?: number;
  computeUnitLimit?: number;
}) {
  const toPk = new PublicKey(opts.to);
  const mintPk = new PublicKey(opts.mint);
  const programId = opts.useToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

  const fromAta = await getAssociatedTokenAddress(mintPk, opts.from.publicKey, false, programId);
  const toAta = await getAssociatedTokenAddress(mintPk, toPk, false, programId);

  // Safer integer conversion; avoids FP drift
  const amountRaw = BigInt(Math.round(Number(opts.amount) * 10 ** Number(opts.decimals)));

  const ix = splTransferIx(fromAta, toAta, opts.from.publicKey, amountRaw, [], programId);

  const tx = await buildV0Tx({
    payer: opts.from.publicKey,
    ixs: [ix],
    priorityMicrolamports: opts.priorityMicrolamports ?? undefined,
    computeUnitLimit: opts.computeUnitLimit ?? 200_000,
  });

  tx.sign([opts.from]);
  return connection().sendTransaction(tx, { maxRetries: 3 });
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Memo                                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

export function memoIx(text: string) {
  return new TransactionInstruction({
    programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"), // Memo v2
    keys: [],
    data: Buffer.from(text, "utf8"),
  });
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Estimation                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Rough fee estimator:
 * - Simulates to fetch `unitsConsumed` (falls back to 200k CU)
 * - Returns base protocol fee (lamports) plus CU
 *   (apply priority fee yourself: microLamports/CU * CU / 1e6)
 */
export async function estimateLamports(ixs: TransactionInstruction[], payer: PublicKey) {
  const conn = connection();
  const { blockhash } = await conn.getLatestBlockhash("confirmed");
  const msg = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions: ixs,
  }).compileToV0Message();
  const tx = new VersionedTransaction(msg);
  const sim = await conn.simulateTransaction(tx, { replaceRecentBlockhash: true });
  const cu = (sim.value as any)?.unitsConsumed ?? 200_000;
  const baseFeeLamports = 5_000; // protocol base (approx.)
  return { estimatedComputeUnits: cu, baseFeeLamports };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Offline prepare / submit                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

export async function buildOfflineBase64(opts: {
  payer: PublicKey;
  ixs: TransactionInstruction[];
  priorityMicrolamports?: number;
  computeUnitLimit?: number;
  alts?: AddressLookupTableAccount[];
}) {
  const tx = await buildV0Tx({
    payer: opts.payer,
    ixs: opts.ixs,
    priorityMicrolamports: opts.priorityMicrolamports,
    computeUnitLimit: opts.computeUnitLimit ?? 0, // set 0 to omit CU limit if desired
    alts: opts.alts,
  });
  const serialized = Buffer.from(tx.message.serialize()).toString("base64");
  return { messageBase64: serialized, tx };
}

export async function attachSigAndSend(opts: {
  tx: VersionedTransaction;
  signature: Uint8Array; // 64 bytes ed25519
  publicKey: PublicKey;  // signer’s pubkey
}) {
  opts.tx.addSignature(opts.publicKey, opts.signature);
  return connection().sendTransaction(opts.tx, { maxRetries: 3 });
}
