import type { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';

const Dashboard: FC = () => {
  const { publicKey } = useWallet();
  const [mint, setMint] = useState<string | null>(null);
  const [ata, setAta] = useState<string | null>(null);
  const [supply, setSupply] = useState<string | null>(null);
  const [decimals, setDecimals] = useState<number | null>(null);
  const [authority, setAuthority] = useState<string | null>(null);

  useEffect(() => {
    const storedMint = localStorage.getItem('mint');
    const storedAta = localStorage.getItem('ata');
    setMint(storedMint);
    setAta(storedAta);

    if (storedMint) {
      const connection = new Connection('https://solana-proxy-production.up.railway.app', 'confirmed');
      const fetchMintData = async () => {
        try {
          const mintInfo = await getMint(connection, new PublicKey(storedMint));
          setSupply(mintInfo.supply.toString());
          setDecimals(mintInfo.decimals);
          setAuthority(mintInfo.mintAuthority?.toBase58() ?? 'None');
        } catch (err) {
          console.error('Failed to load mint info:', err);
        }
      };
      fetchMintData();
    }
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">📊 Your Dashboard</h1>

      {publicKey ? (
        <p className="text-sm text-green-600 break-words">
          Connected Wallet: {publicKey.toBase58()}
        </p>
      ) : (
        <p className="text-sm text-red-600">Wallet not connected</p>
      )}

      {mint && (
        <div className="space-y-1">
          <p className="text-sm font-semibold">🪙 Mint Address:</p>
          <p className="text-xs break-words">{mint}</p>
        </div>
      )}

      {ata && (
        <div className="space-y-1">
          <p className="text-sm font-semibold">📦 Associated Token Account:</p>
          <p className="text-xs break-words">{ata}</p>
        </div>
      )}

      {supply && decimals !== null && authority && (
        <div className="space-y-1 text-xs">
          <p><span className="font-semibold">Total Supply:</span> {supply}</p>
          <p><span className="font-semibold">Decimals:</span> {decimals}</p>
          <p><span className="font-semibold">Mint Authority:</span> {authority}</p>
        </div>
      )}

      <div className="pt-4 space-y-3">
        <h2 className="font-semibold text-lg">🛠 Token Utilities (coming soon)</h2>
        <ul className="text-sm list-disc pl-5">
          <li>Transfer tokens</li>
          <li>Burn tokens</li>
          <li>Mint more tokens</li>
          <li>Distribute airdrops</li>
          <li>Attach NFT metadata</li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
