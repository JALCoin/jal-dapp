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

// Resolve Token-2022 id (same pattern you use in Landing.tsx)
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

/** Get a project-standard connection (confirmed) */
export const connection = (): Connection => makeConnection("confirmed");

/** Build a VersionedTransaction from instructions */
export async function buildV0Tx(opts: {
  payer: PublicKey;
  ixs: TransactionInstruction[];
  priorityMicrolamports?: number; // per compute unit
  computeUnitLimit?: number;      // default ~200k
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
    budgetIxs.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: priorityMicrolamports }));
  }

  const msg = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions: [...budgetIxs, ...ixs],
  }).compileToV0Message(alts);

  return new VersionedTransaction(msg);
}

/** Send SOL */
export async function sendSol(opts: {
  from: Keypair;
  to: PublicKey | string;
  sol: number;                        // e.g. 0.01
  priorityMicrolamports?: number;
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
    priorityMicrolamports: opts.priorityMicrolamports ?? 1, // ~tip per CU
  });

  tx.sign([opts.from]);
  return connection().sendTransaction(tx, { maxRetries: 3 });
}

/** Send SPL tokens (works for classic SPL or Token-2022) */
export async function sendSpl(opts: {
  from: Keypair;
  to: PublicKey | string;
  mint: PublicKey | string;
  amount: number;                      // UI units (e.g., 12.34)
  decimals: number;                    // mint decimals
  useToken2022?: boolean;
  priorityMicrolamports?: number;
}) {
  const toPk = new PublicKey(opts.to);
  const mintPk = new PublicKey(opts.mint);
  const programId = opts.useToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

  const fromAta = await getAssociatedTokenAddress(mintPk, opts.from.publicKey, false, programId);
  const toAta = await getAssociatedTokenAddress(mintPk, toPk, false, programId);

  const amountRaw = BigInt(Math.round(opts.amount * 10 ** opts.decimals));

  const ix = splTransferIx(fromAta, toAta, opts.from.publicKey, amountRaw, [], programId);

  const tx = await buildV0Tx({
    payer: opts.from.publicKey,
    ixs: [ix],
    priorityMicrolamports: opts.priorityMicrolamports ?? 1,
  });

  tx.sign([opts.from]);
  return connection().sendTransaction(tx, { maxRetries: 3 });
}

/** Add a Memo to any set of instructions */
export function memoIx(text: string) {
  return new TransactionInstruction({
    programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"), // Memo v2 program
    keys: [],
    data: Buffer.from(text, "utf8"),
  });
}

/** Estimate (rough) cost in lamports for a transaction */
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
  // CU used is in sim.value.unitsConsumed (newer nodes); fallback to 200k
  const cu = (sim.value as any)?.unitsConsumed ?? 200_000;
  const baseFee = 5000; // cluster base TX fee in lamports (protocol)
  // If you intend to set a priority fee, multiply CU by microLamports/1e6
  return { estimatedComputeUnits: cu, baseFeeLamports: baseFee };
}

/** Offline: build base64 to sign elsewhere; then attach signature & send */
export async function buildOfflineBase64(opts: {
  payer: PublicKey;
  ixs: TransactionInstruction[];
}) {
  const tx = await buildV0Tx({ payer: opts.payer, ixs: opts.ixs, computeUnitLimit: 0 });
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
