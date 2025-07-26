import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { finalizeTokenMetadata } from '../utils/finalizeTokenMetadata';

interface TokenInfo {
  mint: string;
  amount: string;
  decimals: number;
  symbol?: string; // optional for now
}

const Dashboard: FC = () => {
  const { publicKey, sendTransaction } = useWallet();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);

  const [imageUri, setImageUri] = useState('');
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [metadataUri, setMetadataUri] = useState('');

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

  const handleTurnIntoCurrency = () => {
    setShowInstructions(true);
  };

  const handleDownloadMetadata = () => {
    const metadata = {
      name,
      symbol,
      description,
      image: imageUri,
    };

    const file = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'metadata.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAttachMetadata = async (mint: string) => {
    if (!publicKey || !sendTransaction || !metadataUri || !name || !symbol) {
      alert('Missing required data to finalize metadata.');
      return;
    }

    try {
      const sig = await finalizeTokenMetadata({
        connection,
        walletPublicKey: publicKey,
        sendTransaction,
        mintAddress: new PublicKey(mint),
        metadataUri,
        name,
        symbol,
      });

      alert(`✅ Metadata attached! Tx: ${sig}`);
    } catch (err) {
      console.error('Attach metadata error:', err);
      alert('❌ Failed to attach metadata. Check console for details.');
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
        <div className="instruction-backdrop">
          <div className="instruction-panel">
            <button onClick={() => setShowInstructions(false)} className="close-btn">×</button>
            <h2>Turn Into Currency</h2>
            <ol>
              <li>
                Go to{' '}
                <a href="https://www.lighthouse.storage/" target="_blank" rel="noopener noreferrer">
                  lighthouse.storage
                </a>{' '}
                and click <strong>“Get Started”</strong>.
                <ul>
                  <li>Connect your <strong>Phantom wallet</strong></li>
                  <li>Confirm your <strong>email address</strong> to activate the account</li>
                  <li>Once inside, click <strong>“Upload New” → “Upload File”</strong> in the left sidebar</li>
                  <li>Select and upload your <strong>token image</strong> (PNG recommended)</li>
                </ul>
                After upload completes, copy the <code>ipfs://</code> or <code>https://gateway.lighthouse.storage/ipfs/...</code> link.
              </li>

              <li>
                Paste your image URI:
                <input
                  className="currency-input"
                  placeholder="ipfs://..."
                  value={imageUri}
                  onChange={(e) => setImageUri(e.target.value)}
                />
              </li>

              <li>
                Fill out your token identity:
                <div className="currency-form">
                  <input
                    placeholder="Token Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <input
                    placeholder="Symbol"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                  />
                  <textarea
                    placeholder="Description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <button className="button" onClick={handleDownloadMetadata}>
                    Download metadata.json
                  </button>
                </div>
              </li>

              <li>
                Upload your <code>metadata.json</code> to Lighthouse and copy the resulting <strong>IPFS URI</strong>.
                <input
                  className="currency-input"
                  placeholder="ipfs://..."
                  value={metadataUri}
                  onChange={(e) => setMetadataUri(e.target.value)}
                />
                {tokens.map((token, idx) => (
                  <button key={idx} className="button" onClick={() => handleAttachMetadata(token.mint)}>
                    Attach Metadata to {token.symbol || token.mint.slice(0, 4)}...
                  </button>
                ))}
              </li>
            </ol>

            <p className="note">
              This metadata URI will become your token’s permanent identity on Solana.
            </p>
          </div>
        </div>
      )}
    </main>
  );
};

export default Dashboard;
