import { FC, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';

const Dashboard: FC = () => {
  const { publicKey } = useWallet();
  const [mintAddress, setMintAddress] = useState<string | null>(null);
  const [ataAddress, setAtaAddress] = useState<string | null>(null);
  const [supply, setSupply] = useState<string | null>(null);
  const [decimals, setDecimals] = useState<number | null>(null);
  const [authority, setAuthority] = useState<string | null>(null);

  const connection = new Connection('https://solana-proxy-production.up.railway.app', 'confirmed');

  useEffect(() => {
    const storedMint = localStorage.getItem('mint');
    const storedAta = localStorage.getItem('ata');
    setMintAddress(storedMint);
    setAtaAddress(storedAta);

    if (storedMint) {
      const fetchMintData = async () => {
        try {
          const mintInfo = await getMint(connection, new PublicKey(storedMint));
          setSupply(mintInfo.supply.toString());
          setDecimals(mintInfo.decimals);
          setAuthority(mintInfo.mintAuthority?.toBase58() ?? 'None');
        } catch (e) {
          console.error('Failed to fetch mint info', e);
        }
      };

      fetchMintData();
    }
  }, []);

  return (
    <main className="container">
      <h1 className="text-3xl font-bold mb-6">📊 Your Token Overview</h1>

      {publicKey && (
        <p><strong>Connected Wallet:</strong> {publicKey.toBase58()}</p>
      )}

      {mintAddress && (
        <>
          <p><strong>Mint Address:</strong> {mintAddress}</p>
          <p><strong>ATA:</strong> {ataAddress}</p>
        </>
      )}

      {supply && decimals !== null && (
        <>
          <p><strong>Total Supply:</strong> {supply}</p>
          <p><strong>Decimals:</strong> {decimals}</p>
          <p><strong>Mint Authority:</strong> {authority}</p>
        </>
      )}

      <hr className="my-6" />

      <button disabled className="button opacity-50 cursor-not-allowed">
        🔒 Finalize as NFT (coming next)
      </button>
    </main>
  );
};

export default Dashboard;
