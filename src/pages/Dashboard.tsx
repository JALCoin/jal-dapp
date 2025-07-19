import type { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

const Dashboard: FC = () => {
  const { publicKey } = useWallet();

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

      {/* Placeholder section for token info */}
      <div className="bg-gray-100 p-4 rounded shadow space-y-2">
        <p className="font-semibold text-sm">Token Details (coming soon):</p>
        <ul className="text-xs text-gray-700 list-disc pl-5">
          <li>Mint Address</li>
          <li>Associated Token Account</li>
          <li>Token Supply & Decimals</li>
          <li>Mint Authority</li>
        </ul>
      </div>

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
