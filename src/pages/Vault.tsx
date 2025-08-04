import { useEffect, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
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

export default function Vault() {
  const { publicKey } = useWallet();
  const connection = useMemo(
    () => new Connection('https://solana-proxy-production.up.railway.app', 'confirmed'),
    []
  );

  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [hiddenMints, setHiddenMints] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!publicKey) return;
    setLoading(true);

    const fetchTokens = async () => {
      try {
        const response = await connection.getParsedTokenAccountsByOwner(publicKey, {
          programId: TOKEN_PROGRAM_ID,
        });

        const enriched: TokenInfo[] = [];

        for (const acc of response.value) {
          const info = acc.account.data.parsed.info;
          const mint = info.mint;

          const baseToken: TokenInfo = {
            mint,
            amount: info.tokenAmount.uiAmountString,
            decimals: info.tokenAmount.decimals,
          };

          const metadata = await fetchMetadata(mint);
          enriched.push({ ...baseToken, ...metadata });
        }

        setTokens(enriched);
      } catch (err) {
        console.error('Token fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [publicKey, connection]);

  const fetchMetadata = async (mint: string): Promise<Partial<TokenInfo>> => {
    try {
      const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
      const [metadataPDA] = await PublicKey.findProgramAddress(
        [Buffer.from('metadata'), METADATA_PROGRAM_ID.toBuffer(), new PublicKey(mint).toBuffer()],
        METADATA_PROGRAM_ID
      );

      const accountInfo = await connection.getAccountInfo(metadataPDA);
      if (!accountInfo) return {};

      const uri = new TextDecoder()
        .decode(accountInfo.data.slice(115, 315))
        .replace(/\u0000/g, '')
        .trim();

      const url = uri.startsWith('http') ? uri : `https://ipfs.io/ipfs/${uri.replace('ipfs://', '')}`;
      const res = await fetch(url);
      const data = await res.json();

      localStorage.setItem(`metadata-${mint}`, JSON.stringify(data));
      localStorage.setItem(`unlocked-${mint}`, 'true');
      localStorage.setItem('vaultSymbol', data.symbol);

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

  const handleHideToken = (mint: string) => {
    setHiddenMints((prev) => [...prev, mint]);
  };

  const visibleTokens = tokens.filter((t) => !hiddenMints.includes(t.mint));

  return (
    <main className="min-h-screen bg-[var(--jal-bg)] text-[var(--jal-text)] p-6">
      <div className="max-w-6xl mx-auto vault-unlock">
        <h1 className="vault-header">Vault</h1>

        {!publicKey && (
          <div className="vault-wallet">
            <WalletMultiButton />
          </div>
        )}

        {loading ? (
          <div className="vault-loading">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="skeleton-card" />
            ))}
          </div>
        ) : visibleTokens.length === 0 ? (
          <p className="text-center mt-10 text-[var(--jal-muted)] text-lg">
            No tokens found in your Vault.
          </p>
        ) : (
          <div className="vault-grid">
            {visibleTokens.map((token) => (
              <div key={token.mint} className="token-card relative">
                <button
                  onClick={() => handleHideToken(token.mint)}
                  title="Hide from vault"
                  className="absolute top-2 right-2 text-sm text-red-400 hover:text-white transition duration-150 px-2"
                >
                  ✕
                </button>

                {token.image && (
                  <img
                    src={
                      token.image.startsWith('ipfs://')
                        ? token.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
                        : token.image
                    }
                    alt={token.name || token.symbol || 'Token'}
                    className="w-20 h-20 mx-auto mb-2 object-contain rounded"
                  />
                )}

                <div className="text-center space-y-1">
                  <p className="text-white font-semibold text-lg">
                    {token.name || 'Unnamed Token'}
                  </p>
                  <p className="text-[var(--jal-muted)] text-sm">
                    {token.symbol || '—'}
                  </p>
                  <p className="text-sm break-all">
                    <strong className="text-[var(--jal-glow)]">Mint:</strong> {token.mint}
                  </p>
                  <p>
                    <strong>Amount:</strong> {token.amount}
                  </p>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <a
                    href={`https://solscan.io/token/${token.mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="explorer-link"
                  >
                    View on Solscan ↗
                  </a>
                  <button
                    className="copy-btn"
                    onClick={() => navigator.clipboard.writeText(token.mint)}
                    title="Copy mint address"
                  >
                    📋 Copy
                  </button>
                </div>

                <p
                  className={`meta-tag ${
                    token.hasMetadata ? 'finalized' : 'missing'
                  }`}
                >
                  {token.hasMetadata ? '✅ Metadata Attached' : '⚠️ Metadata not attached'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
