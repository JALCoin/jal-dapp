import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import finalizeMetadata from '../utils/finalizeMetadata';

interface TokenInfo {
  mint: string;
  amount: string;
  decimals: number;
}

const Dashboard: FC = () => {
  const { publicKey, signTransaction } = useWallet();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uriInputs, setUriInputs] = useState<{ [mint: string]: string }>({});

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
            const tokenAccount = response.value.find(
              (acc: any) => acc.account.data.parsed.info.mint === mint
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

  const handleUriChange = (mint: string, value: string) => {
    setUriInputs((prev) => ({ ...prev, [mint]: value }));
  };

  const handleFinalize = async (mint: string) => {
    try {
      const metadataUri = uriInputs[mint];
      if (!metadataUri) return alert('Please provide a metadata URI first.');

      await finalizeMetadata({
        connection,
        wallet: { publicKey, signTransaction },
        mint: new PublicKey(mint),
        metadataUri,
      });

      alert('Metadata finalized!');
    } catch (err) {
      console.error('Error finalizing metadata:', err);
      alert('Failed to finalize metadata.');
    }
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
                    >📋</button>
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
                >View on Solscan ↗</a>

                <input
                  className="currency-input"
                  placeholder="ipfs://..."
                  value={uriInputs[token.mint] || ''}
                  onChange={(e) => handleUriChange(token.mint, e.target.value)}
                />

                <button className="button" onClick={() => handleFinalize(token.mint)}>
                  Finalize Metadata
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Dashboard;
