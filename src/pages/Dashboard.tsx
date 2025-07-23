import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import FinalizeTokenAsNFT, { FinalizeData } from '../components/FinalizeTokenAsNFT';
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

  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

  useEffect(() => {
    const fetchTokens = async () => {
      if (!wallet.publicKey) return;
      setLoading(true);

      try {
        const response = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
          programId: TOKEN_PROGRAM_ID,
        });

        const filtered: TokenInfo[] = [];
        for (const acc of response.value) {
          const info = acc.account.data.parsed.info;
          const mint = info.mint;
          const mintInfo = await connection.getParsedAccountInfo(new PublicKey(mint));
          const parsed = (mintInfo.value?.data as any)?.parsed?.info;

          if (parsed?.mintAuthority === wallet.publicKey.toBase58()) {
            filtered.push({
              mint,
              amount: info.tokenAmount.uiAmountString,
              decimals: info.tokenAmount.decimals,
              isFinalized: false,
            });
          }
        }

        setTokens(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [wallet.publicKey]);

  const handleFinalizeSubmit = async ({ metadataUri }: FinalizeData) => {
    if (!selectedMint || !wallet.publicKey) return;
    try {
      await attachMetadata({
        mint: selectedMint,
        metadataUri,
        wallet,
      });
      console.log(`✅ Metadata attached to ${selectedMint}`);
    } catch (err) {
      console.error('❌ Finalization failed', err);
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
          <p>No tokens found.</p>
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
                  className="explorer-link"
                  href={`https://solscan.io/token/${token.mint}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Solscan ↗
                </a>

                {!token.isFinalized && (
                  <button className="button" onClick={() => {
                    setSelectedMint(token.mint);
                    setShowModal(true);
                  }}>
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
