import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

interface TokenInfo {
  mint: string;
  amount: string;
  decimals: number;
}

const Dashboard: FC = () => {
  const { publicKey } = useWallet();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);

  const connection = new Connection('https://solana-proxy-production.up.railway.app', 'confirmed');

  useEffect(() => {
    const fetchTokens = async () => {
      if (!publicKey) return;

      setLoading(true);
      try {
        const response = await connection.getParsedTokenAccountsByOwner(publicKey, {
          programId: TOKEN_PROGRAM_ID,
        });

        const candidateMints = response.value.map((acc: any) => acc.account.data.parsed.info.mint);
        const filteredTokens: TokenInfo[] = [];

        for (const mint of candidateMints) {
          const mintPubkey = new PublicKey(mint);
          const mintInfo = await connection.getParsedAccountInfo(mintPubkey);
          const parsed = (mintInfo.value?.data as any)?.parsed?.info;

          if (parsed?.mintAuthority === publicKey.toBase58()) {
            const tokenAccount = response.value.find((acc: any) =>
              acc.account.data.parsed.info.mint === mint
            );
            const tokenInfo = tokenAccount?.account.data.parsed.info;

            filteredTokens.push({
              mint,
              amount: tokenInfo.tokenAmount.uiAmountString,
              decimals: tokenInfo.tokenAmount.decimals,
            });
          }
        }

        setTokens(filteredTokens);
      } catch (err) {
        console.error('Error filtering tokens:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [publicKey]);

  const handleTurnIntoCurrency = () => {
    setShowInstructions(true);
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
                  <p className="token-mint">
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
                  <p>
                    <strong>Amount:</strong> {token.amount}
                  </p>
                </div>

                <a
                  href={`https://solscan.io/token/${token.mint}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="explorer-link"
                >
                  View on Solscan ↗
                </a>

                <button className="button" onClick={handleTurnIntoCurrency}>
                  Turn Into Currency
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

{showInstructions && (
  <div className="currency-overlay">
    <div className="currency-modal">
      <button
        onClick={() => setShowInstructions(false)}
        className="currency-close"
        aria-label="Close instructions"
      >
        ×
      </button>

      <h2 className="text-xl font-bold mb-4 text-center">Turn Into Currency</h2>

      <ol className="list-decimal text-sm space-y-3 text-left pl-5">
        <li>
          Go to{" "}
          <a
            href="https://www.lighthouse.storage/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline font-medium"
          >
            lighthouse.storage
          </a>{" "}
          and create an account.
        </li>
        <li>
          Upload your{" "}
          <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">metadata.json</code> file including:
          <ul className="list-disc mt-2 ml-6 space-y-1 text-[13px]">
            <li><strong>name</strong></li>
            <li><strong>symbol</strong></li>
            <li><strong>description</strong></li>
            <li><strong>image</strong> (IPFS URI)</li>
          </ul>
        </li>
        <li>Copy the returned metadata URI.</li>
        <li>Come back and paste it in the next step (coming soon).</li>
      </ol>

      <p className="note text-xs text-center text-gray-500 border-t mt-6 pt-4">
        This step transforms your token into an on-chain asset with identity.
      </p>
    </div>
  </div>
)}
    </main>
  );
};

export default Dashboard;
