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
    <div className="min-h-screen bg-black text-white px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">Your Created Tokens</h1>

        {loading ? (
          <p className="text-center">Loading token accounts...</p>
        ) : tokens.length === 0 ? (
          <p className="text-center text-gray-400">No tokens created by this wallet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {tokens.map((token, idx) => (
              <div
                key={idx}
                className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex flex-col justify-between shadow"
              >
                <div className="space-y-1">
                  <p className="text-sm font-mono text-green-400 break-words">
                    <span className="font-semibold text-white">Mint:</span> {token.mint}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Amount:</span> {token.amount}
                  </p>
                </div>
                {!token.isFinalized && (
                  <div className="mt-4">
                    <Link
                      to={`/finalize/${token.mint}`}
                      className="inline-block bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white text-sm text-center w-full"
                    >
                      Finalize
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
