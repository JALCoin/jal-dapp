// src/pages/Dashboard.tsx
import { FC, useEffect, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

interface TokenInfo {
  mint: string;
  amount: string;
  decimals: number;
  name?: string;
  symbol?: string;
  image?: string;
  hasMetadata?: boolean;
}

const Dashboard: FC = () => {
  const { publicKey } = useWallet();
  const connection = useMemo(() => new Connection('https://solana-proxy-production.up.railway.app', 'confirmed'), []);
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [hiddenMints, setHiddenMints] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetadataFromChain = async (mint: string): Promise<Partial<TokenInfo>> => {
    try {
      const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
      const [metadataPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), new PublicKey(mint).toBuffer()],
        METADATA_PROGRAM_ID
      );

      const accountInfo = await connection.getAccountInfo(metadataPDA);
      if (!accountInfo) return {};

      const uriStart = 115;
      const uriEnd = uriStart + 200;
      const uri = new TextDecoder().decode(accountInfo.data.slice(uriStart, uriEnd)).replace(/\u0000/g, '').trim();
      const res = await fetch(uri.startsWith('http') ? uri : `https://ipfs.io/ipfs/${uri.replace('ipfs://', '')}`);
      const data = await res.json();

      localStorage.setItem(`metadata-${mint}`, JSON.stringify(data));
      localStorage.setItem(`unlocked-${mint}`, 'true');

      return {
        name: data.name,
        symbol: data.symbol,
        image: data.image,
        hasMetadata: true,
      };
    } catch {
      return { hasMetadata: false };
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('hiddenMints');
    if (saved) {
      try {
        setHiddenMints(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('hiddenMints', JSON.stringify(hiddenMints));
  }, [hiddenMints]);

  const fetchTokens = async () => {
    if (!publicKey) return;
    setLoading(true);

    try {
      const response = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID,
      });

      const enrichedTokens: TokenInfo[] = [];
      for (const acc of response.value) {
        const info = acc.account.data.parsed.info;
        const mint = info.mint;

        const baseToken: TokenInfo = {
          mint,
          amount: info.tokenAmount.uiAmountString,
          decimals: info.tokenAmount.decimals,
        };

        const metadata = await fetchMetadataFromChain(mint);
        enrichedTokens.push({ ...baseToken, ...metadata });
      }

      setTokens(enrichedTokens);
    } catch (err) {
      console.error('Token fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, [publicKey, connection]);

  const handleHideToken = (mint: string) => {
    setHiddenMints((prev) => [...prev, mint]);
  };

  const visibleTokens = tokens.filter((t) => !hiddenMints.includes(t.mint));

  return (
    <main className="min-h-screen bg-[var(--jal-bg)] text-[var(--jal-text)] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center mb-8 glow-text white-glow uppercase tracking-widest">
          Your Vault
        </h1>

        {loading ? (
          <p className="text-center mt-10 text-[var(--jal-muted)] text-lg animate-pulse">Loading tokens...</p>
        ) : visibleTokens.length === 0 ? (
          <p className="text-center mt-10 text-[var(--jal-muted)] text-lg">No tokens found in your Vault.</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {visibleTokens.map((token) => (
              <div key={token.mint} className="token-card relative rounded-xl p-5 bg-[var(--jal-card)] border border-[var(--jal-glow)] shadow-lg hover:shadow-[0_0_24px_var(--jal-gold)] transition-all duration-300">
                <button
                  onClick={() => handleHideToken(token.mint)}
                  title="Hide from dashboard"
                  className="absolute top-2 right-2 text-sm text-red-400 hover:text-white transition duration-150 px-2"
                >✕</button>

                {token.image && (
                  <img
                    src={token.image.startsWith('ipfs://') ? token.image.replace('ipfs://', 'https://ipfs.io/ipfs/') : token.image}
                    alt={token.name || token.symbol || 'Token'}
                    className="w-20 h-20 object-contain mx-auto mb-4 rounded-md drop-shadow"
                  />
                )}

                <div className="text-center space-y-1">
                  <p className="text-white font-semibold text-lg">{token.name || 'Unnamed Token'}</p>
                  <p className="text-[var(--jal-muted)] text-sm">{token.symbol || '—'}</p>
                  <p className="text-sm break-all"><strong className="text-[var(--jal-glow)]">Mint:</strong> {token.mint}</p>
                  <p><strong>Amount:</strong> {token.amount}</p>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <a
                    href={`https://solscan.io/token/${token.mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline"
                  >
                    View on Solscan ↗
                  </a>
                  <button
                    className="text-sm bg-black border border-[var(--jal-gold)] px-2 py-1 rounded hover:bg-[var(--jal-surface)]"
                    onClick={() => navigator.clipboard.writeText(token.mint)}
                    title="Copy mint address"
                  >📋 Copy</button>
                </div>

                {token.hasMetadata && localStorage.getItem(`unlocked-${token.mint}`) && (
                  <p className="text-center text-green-400 text-xs mt-2">✅ Metadata Attached</p>
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
