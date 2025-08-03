// src/components/CurrencyFinalizer.tsx
import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import TokenFinalizerModal from '../utils/TokenFinalizerModal';

interface Props {
  className?: string;
}

const CurrencyFinalizer: FC<Props> = ({ className }) => {
  const { publicKey } = useWallet();
  const connection = useMemo(() => new Connection('https://solana-proxy-production.up.railway.app', 'confirmed'), []);
  const [tokens, setTokens] = useState<any[]>([]);
  const [selectedMint, setSelectedMint] = useState<string | null>(null);
  const [showFinalizer, setShowFinalizer] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState<string | null>(null);

  const fetchMetadataFromChain = async (mint: string) => {
    try {
      const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
      const [metadataPDA] = await PublicKey.findProgramAddress(
        [
          Buffer.from("metadata"),
          METADATA_PROGRAM_ID.toBuffer(),
          new PublicKey(mint).toBuffer(),
        ],
        METADATA_PROGRAM_ID
      );

      const acc = await connection.getAccountInfo(metadataPDA);
      if (!acc) return {};

      const uri = new TextDecoder()
        .decode(acc.data.slice(115, 315))
        .replace(/\u0000/g, '')
        .trim();

      const res = await fetch(uri.startsWith('http') ? uri : `https://ipfs.io/ipfs/${uri.replace('ipfs://', '')}`);
      const data = await res.json();

      return { ...data, hasMetadata: true };
    } catch {
      return { hasMetadata: false };
    }
  };

  const fetchTokens = async () => {
    if (!publicKey) return;
    const response = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID });
    const enriched = await Promise.all(
      response.value.map(async (acc) => {
        const info = acc.account.data.parsed.info;
        const mint = info.mint;
        const meta = await fetchMetadataFromChain(mint);
        return {
          mint,
          amount: info.tokenAmount.uiAmountString,
          ...meta,
        };
      })
    );
    setTokens(enriched.filter((t) => !t.hasMetadata));
  };

  useEffect(() => {
    fetchTokens();
  }, [publicKey]);

  const handleClick = (mint: string) => {
    setSelectedMint(mint);
    setShowFinalizer(true);
  };

  const handleSuccess = (mint: string) => {
    setJustUnlocked(mint);
    setShowFinalizer(false);
    fetchTokens();
  };

  return (
    <div className={className}>
      {justUnlocked && (
        <div className="text-center border border-green-500 text-green-400 bg-black rounded p-3 mb-4 text-sm">
          Token finalized successfully: <strong>{justUnlocked}</strong>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-6">
        {tokens.map((token) => (
          <div key={token.mint} className="token-card p-4 rounded border border-[var(--jal-border)] bg-[var(--jal-surface)]">
            <p className="text-sm break-all"><strong>Mint:</strong> {token.mint}</p>
            <p className="text-sm"><strong>Amount:</strong> {token.amount}</p>
            <button className="button mt-3" onClick={() => handleClick(token.mint)}>
              Attach Metadata
            </button>
          </div>
        ))}
      </div>

      {showFinalizer && selectedMint && (
        <div className="modal-overlay">
          <TokenFinalizerModal
            mint={selectedMint}
            connection={connection}
            onClose={() => setShowFinalizer(false)}
            onSuccess={handleSuccess}
          />
        </div>
      )}
    </div>
  );
};

export default CurrencyFinalizer;
