// src/pages/Dashboard.tsx
import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
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
  const connection = useMemo(
    () => new Connection('https://solana-proxy-production.up.railway.app', 'confirmed'),
    []
  );

  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [hiddenMints, setHiddenMints] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetadataFromChain = async (mint: string): Promise<Partial<TokenInfo>> => {
    try {
      const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
      const [metadataPDA] = await PublicKey.findProgramAddress(
        [
          Buffer.from("metadata"),
          METADATA_PROGRAM_ID.toBuffer(),
          new PublicKey(mint).toBuffer(),
        ],
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
      <div className="container">
        <h1 className="text-3xl font-bold text-center">Your Created Tokens</h1>

        {loading ? (
          <p className="text-center mt-4 text-[var(--jal-muted)]">Loading token accounts...</p>
        ) : visibleTokens.length === 0 ? (
          <p className="text-center mt-4 text-[var(--jal-muted)]">No tokens created by this wallet.</p>
        ) : (
          <div className="token-list">
            {visibleTokens.map((token) => (
              <div key={token.mint} className="token-card">
                <button
                  className="delete-btn"
                  onClick={() => handleHideToken(token.mint)}
                  title="Remove from dashboard"
                >×</button>

                {token.image && (
                  <img
                    src={token.image.startsWith('ipfs://') ? token.image.replace('ipfs://', 'https://ipfs.io/ipfs/') : token.image}
                    alt={token.name || token.symbol || 'Token Logo'}
                    className="w-16 h-16 object-contain mb-2"
                  />
                )}

                <div className="token-info">
                  <p><strong>Name:</strong> {token.name || '—'}</p>
                  <p><strong>Symbol:</strong> {token.symbol || '—'}</p>
                  <p>
                    <strong>Mint:</strong>{' '}
                    <span className="mono">{token.mint}</span>
                    <button
                      className="copy-btn"
                      onClick={() => navigator.clipboard.writeText(token.mint)}
                      title="Copy Mint Address"
                    >📋</button>
                  </p>
                  <p><strong>Amount:</strong> {token.amount}</p>
                </div>

                <a
                  href={`https://solscan.io/token/${token.mint}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="explorer-link"
                >View on Solscan ↗</a>

                {token.hasMetadata && localStorage.getItem(`unlocked-${token.mint}`) && (
                  <div className="text-xs mt-2 text-green-600">✅ Tools unlocked</div>
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
