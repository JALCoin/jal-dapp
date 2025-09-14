// src/components/CurrencyFinalizer.tsx
import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { makeConnection } from "../config/rpc";
import TokenFinalizerModal from "../utils/TokenFinalizerModal";

interface Props {
  className?: string;
}

type EnrichedToken = {
  mint: string;
  amount: string;
  hasMetadata?: boolean;
  // passthrough fields from fetched JSON if present
  [k: string]: any;
};

const METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

const CurrencyFinalizer: FC<Props> = ({ className }) => {
  const { publicKey } = useWallet();
  const connection = useMemo(() => makeConnection("confirmed"), []);

  const [tokens, setTokens] = useState<EnrichedToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMint, setSelectedMint] = useState<string | null>(null);
  const [showFinalizer, setShowFinalizer] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Fetch minimal on-chain metadata; returns true if metadata account exists,
  // and also tries to fetch the JSON for extra fields when possible.
  const fetchMetadataFromChain = async (
    mint: string
  ): Promise<Partial<EnrichedToken>> => {
    try {
      const [metadataPDA] = await PublicKey.findProgramAddress(
        [
          Buffer.from("metadata"),
          METADATA_PROGRAM_ID.toBuffer(),
          new PublicKey(mint).toBuffer(),
        ],
        METADATA_PROGRAM_ID
      );

      const acc = await connection.getAccountInfo(metadataPDA);
      if (!acc) return { hasMetadata: false };

      // Heuristic read of URI from the Metadata account; good enough for std mints.
      const raw = new TextDecoder().decode(acc.data);
      // Try the classic fixed window first; fall back to a looser parse.
      let uri = new TextDecoder()
        .decode(acc.data.slice(115, 315))
        .replace(/\u0000/g, "")
        .trim();

      if (!uri) {
        const match = raw.match(/https?:\/\/[^\s"']+/);
        if (match) uri = match[0];
      }
      if (!uri) return { hasMetadata: true }; // account exists even if we didn't parse the URI

      const url = uri.startsWith("http")
        ? uri
        : `https://ipfs.io/ipfs/${uri.replace("ipfs://", "")}`;

      try {
        const res = await fetch(url);
        if (!res.ok) return { hasMetadata: true };
        const data = await res.json().catch(() => ({}));
        return { ...data, hasMetadata: true };
      } catch {
        return { hasMetadata: true };
      }
    } catch {
      return { hasMetadata: false };
    }
  };

  const fetchTokens = async () => {
    if (!publicKey) {
      setTokens([]);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const resp = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID },
        "confirmed"
      );

      const enriched = await Promise.all(
        resp.value.map(async ({ account }) => {
          const info = account.data.parsed.info;
          const mint: string = info.mint;
          const meta = await fetchMetadataFromChain(mint);
          return {
            mint,
            amount: info.tokenAmount?.uiAmountString ?? "0",
            ...meta,
          } as EnrichedToken;
        })
      );

      setTokens(enriched.filter((t) => !t.hasMetadata));
    } catch (e: any) {
      console.error("[CurrencyFinalizer] token fetch failed:", e);
      setErr(e?.message ?? "Failed to load tokens.");
      setTokens([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTokens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey]);

  const handleClick = (mint: string) => {
    setSelectedMint(mint);
    setShowFinalizer(true);
  };

  const handleSuccess = (mint: string) => {
    setJustUnlocked(mint);
    setShowFinalizer(false);
    void fetchTokens();
  };

  return (
    <div className={className}>
      {justUnlocked && (
        <div className="text-center border border-green-500 text-green-400 bg-black rounded p-3 mb-4 text-sm">
          Token finalized successfully: <strong>{justUnlocked}</strong>
        </div>
      )}

      {err && (
        <div className="text-center border border-red-500 text-red-400 bg-black rounded p-3 mb-4 text-sm">
          {err}
        </div>
      )}

      {loading ? (
        <div className="text-sm opacity-80">Loading your tokens…</div>
      ) : tokens.length === 0 ? (
        <div className="text-sm opacity-80">
          {publicKey
            ? "Looks like all your tokens already have metadata."
            : "Connect a wallet to scan for tokens without metadata."}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-6">
          {tokens.map((t) => (
            <div
              key={t.mint}
              className="token-card p-4 rounded border border-[var(--jal-border)] bg-[var(--jal-surface)]"
            >
              <p className="text-sm break-all">
                <strong>Mint:</strong> {t.mint}
              </p>
              <p className="text-sm">
                <strong>Amount:</strong> {t.amount}
              </p>
              <button className="button mt-3" onClick={() => handleClick(t.mint)}>
                Attach Metadata
              </button>
            </div>
          ))}
        </div>
      )}

      {showFinalizer && selectedMint && (
        <div className="modal-overlay">
          <TokenFinalizerModal
            mint={selectedMint}
            connection={connection}
            onClose={() => setShowFinalizer(false)}
            onSuccess={handleSuccess}
          />
        </div>
      )}
    </div>
  );
};

export default CurrencyFinalizer;
