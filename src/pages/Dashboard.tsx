// src/pages/Dashboard.tsx
import type { FC } from "react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

type TokenInfo = {
  mint: string;
  amount: string;
  decimals: number;
  name?: string;
  symbol?: string;
  image?: string;
  hasMetadata?: boolean;
};

const METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

// simple cache with TTL
const MD_KEY = (mint: string) => `metadata-${mint}`;
const MD_TTL_KEY = (mint: string) => `metadata-ttl-${mint}`;
const TTL_MS = 1000 * 60 * 60 * 24; // 24h

const gateway = (uri: string) =>
  uri.startsWith("ipfs://")
    ? `https://ipfs.io/ipfs/${uri.replace("ipfs://", "")}`
    : uri;

const fetchJsonWithTimeout = async (url: string, ms = 10000) => {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(id);
  }
};

const Dashboard: FC = () => {
  const { publicKey } = useWallet();
  const connection = useMemo(
    () =>
      new Connection(
        // swap to your preferred RPC
        "https://api.mainnet-beta.solana.com",
        "confirmed"
      ),
    []
  );

  const [sol, setSol] = useState<number | null>(null);
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [hiddenMints, setHiddenMints] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // load hidden set
  useEffect(() => {
    const saved = localStorage.getItem("hiddenMints");
    if (saved) {
      try {
        setHiddenMints(JSON.parse(saved));
      } catch {}
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("hiddenMints", JSON.stringify(hiddenMints));
  }, [hiddenMints]);

  const fetchMetadataFromChain = useCallback(
    async (mintStr: string): Promise<Partial<TokenInfo>> => {
      // cache hit?
      const ttl = Number(localStorage.getItem(MD_TTL_KEY(mintStr) || ""));
      const cached =
        localStorage.getItem(MD_KEY(mintStr)) && ttl && Date.now() < ttl;
      if (cached) {
        try {
          const data = JSON.parse(localStorage.getItem(MD_KEY(mintStr)!)!);
          return {
            name: data.name,
            symbol: data.symbol,
            image: data.image,
            hasMetadata: true,
          };
        } catch {
          // fall through to fetch
        }
      }

      try {
        const mint = new PublicKey(mintStr);
        const [metadataPDA] = await PublicKey.findProgramAddress(
          [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
          METADATA_PROGRAM_ID
        );

        const accountInfo = await connection.getAccountInfo(metadataPDA);
        if (!accountInfo) return { hasMetadata: false };

        // quick & dirty Metaplex V1 parsing: pull the URI region (works for most SPLs)
        const uriGuessStart = 115; // not perfect, but common
        const uriGuessEnd = uriGuessStart + 200;
        const uri = new TextDecoder()
          .decode(accountInfo.data.slice(uriGuessStart, uriGuessEnd))
          .replace(/\0/g, "")
          .trim();

        if (!uri) return { hasMetadata: false };

        const json = await fetchJsonWithTimeout(gateway(uri));
        const out = {
          name: json.name,
          symbol: json.symbol,
          image: json.image,
          hasMetadata: true,
        };

        localStorage.setItem(MD_KEY(mintStr), JSON.stringify(json));
        localStorage.setItem(MD_TTL_KEY(mintStr), String(Date.now() + TTL_MS));
        return out;
      } catch {
        return { hasMetadata: false };
      }
    },
    [connection]
  );

  const fetchAll = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);

    try {
      // SOL
      const lamports = await connection.getBalance(publicKey);
      setSol(lamports / LAMPORTS_PER_SOL);

      // TOKENS
      const resp = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID,
      });

      // filter to positive balances and dedupe mints
      const positive = resp.value
        .map((v) => v.account.data.parsed.info)
        .filter((i: any) => Number(i.tokenAmount?.uiAmount || 0) > 0);

      const dedupMintMap = new Map<string, any>();
      for (const info of positive) dedupMintMap.set(info.mint, info);

      const mints = [...dedupMintMap.keys()];

      // metadata in parallel
      const meta = await Promise.allSettled(
        mints.map((m) => fetchMetadataFromChain(m))
      );

      const enriched: TokenInfo[] = mints.map((mint, idx) => {
        const baseInfo = dedupMintMap.get(mint);
        const metaPart =
          meta[idx].status === "fulfilled" ? meta[idx].value : {};
        return {
          mint,
          amount: baseInfo.tokenAmount.uiAmountString,
          decimals: baseInfo.tokenAmount.decimals,
          ...(metaPart as Partial<TokenInfo>),
        };
      });

      setTokens(enriched);
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection, fetchMetadataFromChain]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleHide = (mint: string) => setHiddenMints((s) => [...s, mint]);
  const handleUnhide = (mint: string) =>
    setHiddenMints((s) => s.filter((m) => m !== mint));

  const visible = tokens.filter((t) => !hiddenMints.includes(t.mint));

  return (
    <main className="min-h-screen bg-[var(--jal-bg)] text-[var(--jal-text)] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-extrabold glow-text white-glow uppercase tracking-widest">
            Your Vault
          </h1>
          <button
            className="vault-button"
            onClick={async () => {
              setRefreshing(true);
              await fetchAll();
              setRefreshing(false);
            }}
            disabled={refreshing}
            title="Refresh balances"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {/* SOL + Hidden manager */}
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3 mb-8">
          <div className="p-4 rounded-xl border border-[var(--jal-border)] bg-[var(--jal-surface)]">
            <div className="text-sm text-[var(--jal-muted)] mb-1">◎ SOL Balance</div>
            <div className="text-2xl font-bold text-white">
              {sol == null ? "—" : sol.toFixed(4)}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[var(--jal-border)] bg-[var(--jal-surface)] md:col-span-2">
            <div className="text-sm text-[var(--jal-muted)] mb-2">Hidden tokens</div>
            {hiddenMints.length === 0 ? (
              <div className="text-[var(--jal-muted)] text-sm">None hidden.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {hiddenMints.map((m) => (
                  <button
                    key={m}
                    className="text-xs bg-black border border-[var(--jal-gold)] px-2 py-1 rounded hover:bg-[var(--jal-surface)]"
                    onClick={() => handleUnhide(m)}
                    title="Unhide"
                  >
                    Unhide&nbsp;{m.slice(0, 4)}…{m.slice(-4)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-center mt-10 text-[var(--jal-muted)] text-lg animate-pulse">
            Loading tokens…
          </p>
        ) : visible.length === 0 ? (
          <p className="text-center mt-10 text-[var(--jal-muted)] text-lg">
            No tokens found in your Vault.
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((t) => (
              <div
                key={t.mint}
                className="token-card relative rounded-xl p-5 bg-[var(--jal-surface)] border border-[var(--jal-glow)] shadow-lg hover:shadow-[0_0_24px_var(--jal-gold)] transition-all duration-300"
              >
                <button
                  onClick={() => handleHide(t.mint)}
                  title="Hide from dashboard"
                  className="absolute top-2 right-2 text-sm text-red-400 hover:text-white transition duration-150 px-2"
                >
                  ✕
                </button>

                {t.image && (
                  <img
                    src={gateway(t.image)}
                    alt={t.name || t.symbol || "Token"}
                    className="w-20 h-20 object-contain mx-auto mb-4 rounded-md drop-shadow"
                    loading="lazy"
                  />
                )}

                <div className="text-center space-y-1">
                  <p className="text-white font-semibold text-lg">
                    {t.name || "Unnamed Token"}
                  </p>
                  <p className="text-[var(--jal-muted)] text-sm">
                    {t.symbol || "—"}
                  </p>
                  <p className="text-sm break-all">
                    <strong className="text-[var(--jal-glow)]">Mint:</strong>{" "}
                    {t.mint}
                  </p>
                  <p>
                    <strong>Amount:</strong> {t.amount}
                  </p>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <a
                    href={`https://solscan.io/token/${t.mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline"
                  >
                    View on Solscan ↗
                  </a>
                  <button
                    className="text-sm bg-black border border-[var(--jal-gold)] px-2 py-1 rounded hover:bg-[var(--jal-surface)]"
                    onClick={() => navigator.clipboard.writeText(t.mint)}
                    title="Copy mint address"
                  >
                    📋 Copy
                  </button>
                </div>

                {t.hasMetadata &&
                  localStorage.getItem(`metadata-${t.mint}`) && (
                    <p className="text-center text-green-400 text-xs mt-2">
                      ✅ Metadata Attached
                    </p>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Dashboard;
