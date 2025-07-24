import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { finalizeTokenMetadata } from '../utils/finalizeMetadata';

interface TokenInfo {
  mint: string;
  amount: string;
  decimals: number;
  finalized: boolean;
}

const Dashboard: FC = () => {
  const wallet = useWallet();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uriInputs, setUriInputs] = useState<{ [mint: string]: string }>({});
  const [nameInputs, setNameInputs] = useState<{ [mint: string]: string }>({});
  const [symbolInputs, setSymbolInputs] = useState<{ [mint: string]: string }>({});

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

            const finalized = false; // Skip metadata PDA check for now

            filteredTokens.push({
              mint,
              amount: tokenInfo.tokenAmount.uiAmountString,
              decimals: tokenInfo.tokenAmount.decimals,
              finalized,
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

  const handleInputChange = (
    mint: string,
    field: 'uri' | 'name' | 'symbol',
    value: string
  ) => {
    if (field === 'uri') setUriInputs((prev) => ({ ...prev, [mint]: value }));
    if (field === 'name') setNameInputs((prev) => ({ ...prev, [mint]: value }));
    if (field === 'symbol') setSymbolInputs((prev) => ({ ...prev, [mint]: value }));
  };

  const handleFinalize = async (mint: string) => {
    try {
      const metadataUri = uriInputs[mint];
      const name = nameInputs[mint];
      const symbol = symbolInputs[mint];
      if (!metadataUri || !name || !symbol) return alert('Please fill in all fields.');

      await finalizeTokenMetadata({
        connection,
        wallet,
        mintAddress: mint,
        metadataUri,
        name,
        symbol,
      });

      alert('✅ Metadata finalized.');
      setTokens((prev) => prev.map((t) => (t.mint === mint ? { ...t, finalized: true } : t)));
    } catch (err) {
      alert('❌ Finalization failed.');
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
                  <p>
                    <strong>Mint:</strong> <span>{token.mint}</span>
                  </p>
                  <p>
                    <strong>Amount:</strong> {token.amount}
                  </p>
                  <p>
                    <strong>Status:</strong>{' '}
                    {token.finalized ? '✅ Finalized' : '❌ Not finalized'}
                  </p>
                </div>

                <input
                  placeholder="Token Name"
                  value={nameInputs[token.mint] || ''}
                  onChange={(e) => handleInputChange(token.mint, 'name', e.target.value)}
                  disabled={token.finalized}
                />
                <input
                  placeholder="Symbol"
                  value={symbolInputs[token.mint] || ''}
                  onChange={(e) => handleInputChange(token.mint, 'symbol', e.target.value)}
                  disabled={token.finalized}
                />
                <input
                  placeholder="ipfs://..."
                  value={uriInputs[token.mint] || ''}
                  onChange={(e) => handleInputChange(token.mint, 'uri', e.target.value)}
                  disabled={token.finalized}
                />

                <button
                  onClick={() => handleFinalize(token.mint)}
                  disabled={token.finalized}
                >
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