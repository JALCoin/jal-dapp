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
  templateMetadata,
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
    const checkImageMetadata = async () => {
      if (!imageUri.startsWith('http')) return;

      try {
        const res = await fetch(imageUri);
        const blob = await res.blob();
        const sizeKB = +(blob.size / 1024).toFixed(2);

        setMimeType(blob.type || 'image/png');
        setImageSizeKB(sizeKB);
      } catch (err) {
        console.warn('Image check failed:', err);
        setMimeType('');
        setImageSizeKB(0);
      }
    };

    if (imageUri) checkImageMetadata();
  }, [imageUri]);

  if (!wallet?.adapter || !mint || !connection) return null;

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
        files: [{ uri: imageUri, type: mimeType || 'image/png' }],
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
      if (!verified?.isAttached) throw new Error('Metadata could not be verified.');

      setStatus('success');
    } catch (error) {
      console.error('Attach metadata failed:', error);
      setStatus('error');
    } finally {
      setAttaching(false);
    }
  };

  return (
    <div className="instruction-backdrop">
      <div className="instruction-panel">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Turn Into Currency</h2>
        <ol>
          <li>
            Upload your <strong>token image</strong> to{' '}
            <a href="https://www.lighthouse.storage/" target="_blank" rel="noopener noreferrer">
              lighthouse.storage
            </a>
          </li>
          <li>
            Paste the uploaded image URI:
            <input
              value={imageUri}
              onChange={(e) => setImageUri(e.target.value)}
              placeholder="https://gateway.lighthouse.storage/ipfs/..."
            />
            {imageSizeKB > 0 && (
              <p className={imageSizeKB > IMAGE_SIZE_LIMIT_KB ? 'text-red-500' : 'text-xs'}>
                {`File type: ${mimeType} | Size: ${imageSizeKB} KB`}
              </p>
            )}
          </li>
          <li>
            Fill in your token identity:
            <input
              placeholder="Token Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              placeholder="Symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            />
            <textarea
              placeholder="Description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button
              className="button"
              onClick={handleDownloadMetadata}
              disabled={imageSizeKB > IMAGE_SIZE_LIMIT_KB}
            >
              Download metadata.json
            </button>
          </li>
          <li>
            Upload your `metadata.json` to IPFS and paste the URI:
            <input
              value={metadataUri}
              onChange={(e) => setMetadataUri(e.target.value)}
              placeholder="ipfs://..."
            />
          </li>
          <li>
            <button className="button" disabled={attaching} onClick={handleAttachMetadata}>
              {attaching ? 'Attaching...' : `Attach Metadata to ${mint.slice(0, 4)}...`}
            </button>
            <p className="note">
              ⚠️ Approve Phantom immediately after clicking. Delay = failure.
            </p>
          </li>
        </ol>

        {status === 'success' && txSignature && (
          <div className="text-green-500 text-sm mt-3">
            ✅ Metadata verified.<br />
            <a
              href={`https://solscan.io/tx/${txSignature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              View Transaction ↗
            </a><br />
            <a
              href={`https://solscan.io/address/${mint}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              View Mint ↗
            </a><br />
            <a
              href={`https://ipfs.io/ipfs/${metadataUri.replace('ipfs://', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline text-xs break-all"
            >
              Metadata URI ↗
            </a>
          </div>
        )}

        {status === 'error' && (
          <p className="text-red-500 text-sm mt-3">
            ❌ Failed to attach metadata. Try again or check IPFS URI.
          </p>
        )}

        <p className="note mt-3">
          Once attached, this metadata becomes permanent on-chain.
        </p>
      </div>
    </div>
  );
};

export default TokenFinalizerModal;
