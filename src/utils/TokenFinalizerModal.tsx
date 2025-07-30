import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { PublicKey, Connection } from '@solana/web3.js';
import { finalizeTokenMetadata } from '../utils/finalizeTokenMetadata';
import { verifyTokenMetadataAttached } from '../utils/verifyTokenMetadataAttached';
import { createSignerFromWalletAdapter } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { useWallet } from '@solana/wallet-adapter-react';

interface Props {
  mint: string;
  connection: Connection;
  onClose: () => void;
  onSuccess?: (mint: string) => void;
  templateMetadata?: {
    name?: string;
    symbol?: string;
    description?: string;
    image?: string;
  };
}

const TokenFinalizerModal: FC<Props> = ({
  mint,
  connection,
  onClose,
  onSuccess,
  templateMetadata
}) => {
  const { wallet } = useWallet();
  const [imageUri, setImageUri] = useState(templateMetadata?.image ?? '');
  const [name, setName] = useState(templateMetadata?.name ?? '');
  const [symbol, setSymbol] = useState(templateMetadata?.symbol ?? '');
  const [description, setDescription] = useState(templateMetadata?.description ?? '');
  const [metadataUri, setMetadataUri] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [imageSizeKB, setImageSizeKB] = useState(0);
  const [attaching, setAttaching] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const IMAGE_SIZE_LIMIT_KB = 500;

  useEffect(() => {
    const checkImage = async () => {
      if (!imageUri.startsWith('http')) return;

      try {
        const res = await fetch(imageUri);
        const blob = await res.blob();
        setMimeType(blob.type || 'image/png');
        setImageSizeKB(+(blob.size / 1024).toFixed(2));
      } catch {
        setMimeType('');
        setImageSizeKB(0);
      }
    };

    checkImage();
  }, [imageUri]);

  if (!wallet?.adapter || !mint) return null;

  const handleDownloadMetadata = () => {
    if (imageSizeKB > IMAGE_SIZE_LIMIT_KB) {
      alert('Image too large for token metadata (max 500KB).');
      return;
    }

    const metadata = {
      name,
      symbol,
      description,
      image: imageUri,
      properties: {
        files: [{ uri: imageUri, type: mimeType }],
        category: 'image',
      },
    };

    const blob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'metadata.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAttachMetadata = async () => {
    setAttaching(true);
    setStatus('idle');

    try {
      const signer = createSignerFromWalletAdapter(wallet.adapter);
      const signature = await finalizeTokenMetadata({
        signer,
        mintAddress: new PublicKey(mint),
        metadataUri,
        name,
        symbol,
      });

      setTxSignature(signature);

      const verified = await verifyTokenMetadataAttached(connection, new PublicKey(mint));
      if (!verified?.isAttached) throw new Error('Metadata verification failed.');

      setStatus('success');

      // ✅ Trigger success callback
      if (onSuccess) {
        onSuccess(mint);
      }
    } catch (e) {
      console.error(e);
      setStatus('error');
    } finally {
      setAttaching(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <button className="delete-btn" onClick={onClose}>×</button>
        <h2 className="text-xl font-bold mb-3 text-center">Turn Into Currency</h2>

        <ol className="space-y-4 text-sm">
          <li>
            1. Upload your <strong>token image</strong> to{' '}
            <a href="https://www.lighthouse.storage/" target="_blank" rel="noopener noreferrer" className="underline">
              lighthouse.storage
            </a>
          </li>

          <li>
            2. Paste the uploaded image URI:
            <input
              type="text"
              value={imageUri}
              onChange={(e) => setImageUri(e.target.value)}
              placeholder="https://gateway.lighthouse.storage/ipfs/..."
            />
            {imageSizeKB > 0 && (
              <p className={`text-xs ${imageSizeKB > IMAGE_SIZE_LIMIT_KB ? 'text-red-500' : 'text-green-600'}`}>
                File type: {mimeType} | Size: {imageSizeKB} KB
              </p>
            )}
          </li>

          <li>
            3. Fill in your token identity:
            <input placeholder="Token Name" value={name} onChange={(e) => setName(e.target.value)} />
            <input placeholder="Symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
            <textarea placeholder="Description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            <button className="button" onClick={handleDownloadMetadata} disabled={imageSizeKB > IMAGE_SIZE_LIMIT_KB}>
              Download metadata.json
            </button>
          </li>

          <li>
            4. Upload your metadata file to IPFS and paste the URI:
            <input
              value={metadataUri}
              onChange={(e) => setMetadataUri(e.target.value)}
              placeholder="ipfs://..."
            />
          </li>

          <li>
            <button className="button" onClick={handleAttachMetadata} disabled={attaching}>
              {attaching ? 'Attaching...' : `Attach Metadata to ${mint.slice(0, 4)}...`}
            </button>
            <p className="text-xs text-yellow-700 mt-1">
              ⚠️ Approve Phantom immediately after clicking. Delay = failure.
            </p>
          </li>
        </ol>

        {status === 'success' && txSignature && (
          <div className="text-green-600 text-xs mt-4 space-y-1">
            <p>✅ Metadata successfully attached.</p>
            <a href={`https://solscan.io/tx/${txSignature}`} target="_blank" rel="noopener noreferrer" className="underline">
              View Transaction ↗
            </a>
            <a href={`https://solscan.io/address/${mint}`} target="_blank" rel="noopener noreferrer" className="underline">
              View Mint ↗
            </a>
            <a href={`https://ipfs.io/ipfs/${metadataUri.replace('ipfs://', '')}`} target="_blank" rel="noopener noreferrer" className="underline break-all">
              Metadata URI ↗
            </a>
          </div>
        )}

        {status === 'error' && (
          <p className="text-red-500 text-xs mt-3">
            ❌ Metadata attachment failed. Double check IPFS URI and retry.
          </p>
        )}

        <p className="text-[var(--jal-muted)] text-xs mt-3">
          Once attached, this metadata becomes permanent on-chain.
        </p>
      </div>
    </div>
  );
};

export default TokenFinalizerModal;
