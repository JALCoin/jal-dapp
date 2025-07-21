import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Link } from 'react-router-dom';

interface TokenInfo {
  mint: string;
  amount: string;
  decimals: number;
  isFinalized: boolean;
}

const Dashboard: FC = () => {
  const { publicKey } = useWallet();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, [publicKey]);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Your Created Tokens</h1>

      {loading ? (
        <p>Loading token accounts...</p>
      ) : tokens.length === 0 ? (
        <p>No tokens created by this wallet.</p>
      ) : (
        <div className="space-y-4">
          {tokens.map((token, idx) => (
            <div
              key={idx}
              className="border border-gray-700 p-4 rounded-lg flex justify-between items-center"
            >
              <div>
                <p className="font-mono text-sm text-green-400">Mint: {token.mint}</p>
                <p className="text-sm">Amount: {token.amount}</p>
              </div>
              {!token.isFinalized && (
                <Link
                  to={`/finalize/${token.mint}`}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md text-white text-sm"
                >
                  Finalize
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
