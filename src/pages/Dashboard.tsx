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
}

const Dashboard: FC = () => {
  const { publicKey, sendTransaction } = useWallet();
  const connection = new Connection('https://solana-proxy-production.up.railway.app', 'confirmed');

  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);

  const [imageUri, setImageUri] = useState('');
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [metadataUri, setMetadataUri] = useState('');
  const [selectedMint, setSelectedMint] = useState<string | null>(null);
  const [attaching, setAttaching] = useState(false);

  useEffect(() => {
    const fetchTokens = async () => {
      if (!publicKey) return;

      setLoading(true);
      try {
        const response = await connection.getParsedTokenAccountsByOwner(publicKey, {
          programId: TOKEN_PROGRAM_ID,
        });

        const candidateMints = response.value
          .sort((a: any, b: any) =>
            b.account.lamports - a.account.lamports ||
            b.pubkey.toBase58().localeCompare(a.pubkey.toBase58())
          )
          .map((acc: any) => acc.account.data.parsed.info.mint);

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

  const handleTurnIntoCurrency = (mint: string) => {
    setSelectedMint(mint);
    setShowInstructions(true);
  };

  const handleDownloadMetadata = () => {
    const metadata = { name, symbol, description, image: imageUri };
    const file = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'metadata.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAttachMetadata = async () => {
    if (!selectedMint || !publicKey || !sendTransaction || !metadataUri || !name || !symbol) {
      alert('Missing required data to finalize metadata.');
      return;
    }

    setAttaching(true);
    try {
      const sig = await finalizeTokenMetadata({
        connection,
        sendTransaction,
        walletPublicKey: publicKey,
        mintAddress: new PublicKey(selectedMint),
        metadataUri,
        name,
        symbol,
      });

      alert(`✅ Metadata attached! Tx: ${sig}`);
    } catch (err) {
      console.error('Attach metadata error:', err);
      alert('❌ Failed to attach metadata. Check console for details.');
    } finally {
      setAttaching(false);
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

      {showInstructions && selectedMint && (
        <div className="instruction-backdrop">
          <div className="instruction-panel">
            <button onClick={() => setShowInstructions(false)} className="close-btn">×</button>
            <h2>Turn Into Currency</h2>
            <ol>
              <li>
                Upload your <strong>token image</strong> to{' '}
                <a href="https://www.lighthouse.storage/" target="_blank" rel="noopener noreferrer">lighthouse.storage</a>
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
                Upload metadata.json to Lighthouse, paste the final IPFS URI:
                <input
                  className="currency-input"
                  placeholder="ipfs://..."
                  value={metadataUri}
                  onChange={(e) => setMetadataUri(e.target.value)}
                />
              </li>
              <li>
                <button className="button" disabled={attaching} onClick={handleAttachMetadata}>
                  {attaching ? 'Attaching...' : `Attach Metadata to ${selectedMint.slice(0, 4)}...`}
                </button>
              </li>
            </ol>

            <p className="note">This metadata will become your token’s permanent identity on Solana.</p>
          </div>
        </div>
      )}
    </main>
  );
};

export default Dashboard;
