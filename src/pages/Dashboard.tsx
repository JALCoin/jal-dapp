import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import TokenFinalizerModal from '../utils/TokenFinalizerModal';

interface TokenInfo {
  mint: string;
  amount: string;
  decimals: number;
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
  const [selectedMint, setSelectedMint] = useState<string | null>(null);
  const [showFinalizer, setShowFinalizer] = useState(false);
  const [templateMetadata, setTemplateMetadata] = useState<{
    name?: string;
    symbol?: string;
    description?: string;
    image?: string;
    mimeType?: string;
    sizeKB?: number;
  }>({});

  // Load hidden mints from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('hiddenMints');
    if (saved) {
      try {
        setHiddenMints(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse hiddenMints:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('hiddenMints', JSON.stringify(hiddenMints));
  }, [hiddenMints]);

  useEffect(() => {
    const fetchTokens = async () => {
      if (!publicKey) return;
      setLoading(true);

      try {
        const response = await connection.getParsedTokenAccountsByOwner(publicKey, {
          programId: TOKEN_PROGRAM_ID,
        });

        const owned: TokenInfo[] = [];

        for (const acc of response.value) {
          const mintAddress = acc.account.data.parsed.info.mint;
          const mintInfo = await connection.getParsedAccountInfo(new PublicKey(mintAddress));
          const parsed = (mintInfo.value?.data as any)?.parsed?.info;

          if (parsed?.mintAuthority === publicKey.toBase58()) {
            const tokenInfo = acc.account.data.parsed.info;
            owned.push({
              mint: mintAddress,
              amount: tokenInfo.tokenAmount.uiAmountString,
              decimals: tokenInfo.tokenAmount.decimals,
            });
          }
        }

        setTokens(owned);
      } catch (err) {
        console.error('Token fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [publicKey, connection]);

  const handleTurnIntoCurrency = async (mint: string) => {
    try {
      const imageUrl = 'https://gateway.lighthouse.storage/ipfs/bafybeiaw3zuzz25waz56cur5n4xkfnxmpewte5nvlscqenwzpdarlholbu';
      const res = await fetch(imageUrl);
      const blob = await res.blob();

      const fileSizeKB = +(blob.size / 1024).toFixed(2);
      const mimeType = blob.type;

      if (fileSizeKB > 500) {
        console.warn(`Image is ${fileSizeKB}KB, exceeds 500KB.`);
      }

      setTemplateMetadata({
        name: 'JAL Coin',
        symbol: 'JAL',
        description: 'JAL is a token that unlocks utility in the Solana vault ecosystem.',
        image: imageUrl,
        mimeType,
        sizeKB: fileSizeKB,
      });

      setSelectedMint(mint);
      setShowFinalizer(true);
    } catch (error) {
      console.error('Metadata image fetch failed:', error);
    }
  };

  const handleHideToken = (mint: string) => {
    setHiddenMints((prev) => [...prev, mint]);
  };

  const visibleTokens = tokens.filter((t) => !hiddenMints.includes(t.mint));

  return (
    <main>
      <div className="container">
        <h1>Your Created Tokens</h1>

        {loading ? (
          <p>Loading token accounts...</p>
        ) : visibleTokens.length === 0 ? (
          <p>No tokens created by this wallet.</p>
        ) : (
          <div className="token-list">
            {visibleTokens.map((token) => (
              <div key={token.mint} className="token-card" style={{ position: 'relative' }}>
                <button
                  className="delete-btn"
                  onClick={() => handleHideToken(token.mint)}
                  title="Remove from dashboard"
                >
                  ×
                </button>

                <div className="token-info">
                  <p>
                    <strong>Mint:</strong>{' '}
                    <span className="mono">{token.mint}</span>
                    <button
                      className="copy-btn"
                      onClick={() => navigator.clipboard.writeText(token.mint)}
                      title="Copy Mint Address"
                    >
                      📋
                    </button>
                  </p>
                  <p><strong>Amount:</strong> {token.amount}</p>
                </div>

                <a
                  href={`https://solscan.io/token/${token.mint}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="explorer-link"
                >
                  View on Solscan ↗
                </a>

                <button className="button" onClick={() => handleTurnIntoCurrency(token.mint)}>
                  Turn Into Currency
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showFinalizer && selectedMint && (
        <TokenFinalizerModal
          mint={selectedMint}
          connection={connection}
          onClose={() => setShowFinalizer(false)}
          templateMetadata={templateMetadata}
        />
      )}
    </main>
  );
};

export default Dashboard;
