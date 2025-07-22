import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import type { FinalizeData } from '../components/FinalizeTokenAsNFT';
import FinalizeTokenAsNFT from '../components/FinalizeTokenAsNFT';
import { attachMetadata } from '../utils/attachMetadata';

interface TokenInfo {
  mint: string;
  amount: string;
  decimals: number;
  isFinalized: boolean;
}

const Dashboard: FC = () => {
  const wallet = useWallet();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMint, setSelectedMint] = useState<string | null>(null);

  const connection = new Connection('https://solana-proxy-production.up.railway.app', 'confirmed');

  useEffect(() => {
    const fetchTokens = async () => {
      if (!wallet.publicKey) return;

      setLoading(true);
      try {
        const response = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
          programId: TOKEN_PROGRAM_ID,
        });

        const candidateMints = response.value.map((acc: any) => acc.account.data.parsed.info.mint);
        const filteredTokens: TokenInfo[] = [];

        for (const mint of candidateMints) {
          const mintPubkey = new PublicKey(mint);
          const mintInfo = await connection.getParsedAccountInfo(mintPubkey);
          const parsed = (mintInfo.value?.data as any)?.parsed?.info;

          if (parsed?.mintAuthority === wallet.publicKey.toBase58()) {
            const tokenAccount = response.value.find(
              (acc: any) => acc.account.data.parsed.info.mint === mint
            );
            const tokenInfo = tokenAccount?.account.data.parsed.info;

            filteredTokens.push({
              mint,
              amount: tokenInfo.tokenAmount.uiAmountString,
              decimals: tokenInfo.tokenAmount.decimals,
              isFinalized: false,
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
  }, [wallet.publicKey]);

  const handleFinalizeSubmit = async (data: FinalizeData) => {
    if (!selectedMint || !wallet.publicKey || !wallet.signTransaction) return;

    try {
      const result = await attachMetadata({
        data,
        mint: selectedMint,
        wallet,
        connection,
        lighthouseApiKey: data.lighthouseApiKey,
      });

      console.log('✅ Finalized:', result);
      alert(`Metadata written!\nURI: ${result.metadataUri}`);
    } catch (err) {
      console.error('❌ Finalization failed:', err);
      alert('Finalization failed. Check console.');
    } finally {
      setShowModal(false);
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

                {!token.isFinalized && (
                  <button
                    className="button"
                    onClick={() => {
                      setSelectedMint(token.mint);
                      setShowModal(true);
                    }}
                  >
                    Finalize
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && selectedMint && (
        <FinalizeTokenAsNFT
          mint={selectedMint}
          onClose={() => setShowModal(false)}
          onSubmit={handleFinalizeSubmit}
        />
      )}
    </main>
  );
};

export default Dashboard;
