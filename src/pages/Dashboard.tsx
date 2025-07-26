import type { FC } from 'react';
import { useEffect, useState } from 'react';
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
  const { publicKey, sendTransaction } = useWallet();
  const connection = new Connection('https://solana-proxy-production.up.railway.app', 'confirmed');

  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMint, setSelectedMint] = useState<string | null>(null);
  const [showFinalizer, setShowFinalizer] = useState(false);

  useEffect(() => {
    const fetchTokens = async () => {
      if (!publicKey) return;
      setLoading(true);

      try {
        const response = await connection.getParsedTokenAccountsByOwner(publicKey, {
          programId: TOKEN_PROGRAM_ID,
        });

        const tokens: TokenInfo[] = [];

        for (const acc of response.value) {
          const mintAddress = acc.account.data.parsed.info.mint;
          const mintInfo = await connection.getParsedAccountInfo(new PublicKey(mintAddress));
          const parsed = (mintInfo.value?.data as any)?.parsed?.info;

          if (parsed?.mintAuthority === publicKey.toBase58()) {
            const tokenInfo = acc.account.data.parsed.info;
            tokens.push({
              mint: mintAddress,
              amount: tokenInfo.tokenAmount.uiAmountString,
              decimals: tokenInfo.tokenAmount.decimals,
            });
          }
        }

        setTokens(tokens);
      } catch (err) {
        console.error('Token fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [publicKey]);

  const handleTurnIntoCurrency = (mint: string) => {
    setSelectedMint(mint);
    setShowFinalizer(true);
  };

  return (
    <main>
      <div className="container">
        <h1>Your Created Tokens</h1>

        {loading ? (
          <p>Loading token accounts...</p>
        ) : tokens.length === 0 ? (
          <p>No tokens created by this wallet.</p>
        ) : (
          <div className="token-list">
            {tokens.map((token, idx) => (
              <div key={idx} className="token-card">
                <div className="token-info">
                  <p><strong>Mint:</strong> <span className="mono">{token.mint}</span>
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
          walletPublicKey={publicKey!}
          sendTransaction={sendTransaction!}
          onClose={() => setShowFinalizer(false)}
          templateMetadata={{
            name: 'JAL',
            symbol: 'JAL',
            description: 'JAL is a token that unlocks utility in the Solana vault ecosystem.',
            image: 'https://gateway.lighthouse.storage/ipfs/<YOUR_IMAGE_CID>/logo.png'
          }}
        />
      )}
    </main>
  );
};

export default Dashboard;
