import type { FC } from 'react';
import { useState } from 'react';
import { PublicKey, Connection } from '@solana/web3.js';
import { finalizeTokenMetadata } from '../utils/finalizeTokenMetadata';
import { verifyTokenMetadataAttached } from '../utils/verifyTokenMetadataAttached';

interface Props {
  mint: string;
  connection: Connection;
  walletPublicKey: PublicKey;
  sendTransaction: (
    transaction: any,
    connection: Connection,
    options?: { skipPreflight?: boolean }
  ) => Promise<string>;
  onClose: () => void;
}

const TokenFinalizerModal: FC<Props> = ({ mint, connection, walletPublicKey, sendTransaction, onClose }) => {
  const [imageUri, setImageUri] = useState('');
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [metadataUri, setMetadataUri] = useState('');
  const [attaching, setAttaching] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const handleDownloadMetadata = () => {
    const metadata = { name, symbol, description, image: imageUri };
    const file = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'metadata.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAttachMetadata = async () => {
    setAttaching(true);
    setStatus('idle');
    try {
      const signature = await finalizeTokenMetadata({
        connection,
        sendTransaction,
        walletPublicKey,
        mintAddress: new PublicKey(mint),
        metadataUri,
        name,
        symbol,
      });
      setTxSignature(signature);

      const verified = await verifyTokenMetadataAttached(connection, new PublicKey(mint));
      if (!verified) throw new Error('Metadata could not be verified on-chain.');

      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setAttaching(false);
    }
  };

  return (
    <div className="instruction-backdrop">
      <div className="instruction-panel">
        <button onClick={onClose} className="close-btn">×</button>
        <h2>Turn Into Currency</h2>
        <ol>
          <li>
            Upload your <strong>token image</strong> to{' '}
            <a href="https://www.lighthouse.storage/" target="_blank" rel="noopener noreferrer">lighthouse.storage</a>
          </li>
          <li>
            Paste your image URI:
            <input className="currency-input" value={imageUri} onChange={(e) => setImageUri(e.target.value)} placeholder="ipfs://..." />
          </li>
          <li>
            Fill out your token identity:
            <input placeholder="Token Name" value={name} onChange={(e) => setName(e.target.value)} />
            <input placeholder="Symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
            <textarea placeholder="Description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            <button className="button" onClick={handleDownloadMetadata}>Download metadata.json</button>
          </li>
          <li>
            Upload your metadata.json and paste the IPFS URI:
            <input className="currency-input" value={metadataUri} onChange={(e) => setMetadataUri(e.target.value)} placeholder="ipfs://..." />
          </li>
          <li>
            <button className="button" disabled={attaching} onClick={handleAttachMetadata}>
              {attaching ? 'Attaching...' : `Attach Metadata to ${mint.slice(0, 4)}...`}
            </button>
            <p className="note">
              ⚠️ Please approve the Phantom wallet popup immediately after clicking. If you delay, the transaction may fail.
            </p>
          </li>
        </ol>

        {status === 'success' && txSignature && (
          <p className="text-green-500 text-sm mt-3">
            ✅ Metadata verified.{' '}
            <a
              href={`https://solscan.io/tx/${txSignature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              View on Solana ↗
            </a>
          </p>
        )}

        {status === 'error' && (
          <p className="text-red-500 text-sm mt-3">
            ❌ Metadata could not be verified on-chain.
          </p>
        )}

        <p className="note mt-3">
          Once attached, this metadata will be permanently stored on-chain for your token.
        </p>
      </div>
    </div>
  );
};

export default TokenFinalizerModal;
