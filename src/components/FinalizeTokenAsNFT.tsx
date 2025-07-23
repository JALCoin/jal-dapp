import type { FC } from 'react';
import { useState } from 'react';

export interface FinalizeData {
  metadataUri: string;
}

interface FinalizeProps {
  mint: string;
  onClose: () => void;
  onSubmit: (data: FinalizeData) => void;
}

const FinalizeTokenAsNFT: FC<FinalizeProps> = ({ mint, onClose, onSubmit }) => {
  const [metadataUri, setMetadataUri] = useState('');

  return (
    <div className="modal-overlay">
      <div className="modal-box container">
        <h1>Finalize Your Token</h1>
        <p>
          <strong>Mint Address:</strong>{' '}
          <span style={{ wordBreak: 'break-word' }}>{mint}</span>
        </p>

        <div style={{ textAlign: 'left', fontSize: '0.95rem', marginTop: '1.5rem' }}>
          <ol style={{ paddingLeft: '1.2rem', lineHeight: '1.75' }}>
            <li>
              <strong>1.</strong> Visit{' '}
              <a
                href="https://www.lighthouse.storage/"
                target="_blank"
                rel="noopener noreferrer"
              >
                lighthouse.storage
              </a>{' '}
              and log in or create an account.
            </li>
            <li>
              <strong>2.</strong> On your dashboard, generate a new <strong>API key</strong>.
            </li>
            <li>
              <strong>3.</strong> Upload your <strong>token image</strong> and copy the IPFS URI.
            </li>
            <li>
              <strong>4.</strong> Create a <code>metadata.json</code> file using:
              <pre
                style={{
                  background: '#111',
                  color: '#0ffdd4',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  marginTop: '0.5rem',
                  whiteSpace: 'pre-wrap',
                }}
              >
{`{
  "name": "Your Token Name",
  "symbol": "SYMBOL",
  "description": "What your token represents",
  "image": "ipfs://your-image-hash"
}`}
              </pre>
            </li>
            <li>
              <strong>5.</strong> Upload <code>metadata.json</code> to Lighthouse and copy the resulting IPFS URI.
            </li>
            <li>
              <strong>6.</strong> Paste your <code>ipfs://</code> URI below.
            </li>
            <li>
              <strong>7.</strong> Click “Finalize” to write your metadata to Solana.
            </li>
          </ol>
        </div>

        <input
          type="text"
          placeholder="ipfs://... (metadata.json URI)"
          value={metadataUri}
          onChange={(e) => setMetadataUri(e.target.value)}
        />

        <button
          className="button"
          disabled={!metadataUri}
          onClick={() => onSubmit({ metadataUri })}
        >
          Finalize NFT
        </button>

        <button
          className="button"
          style={{ backgroundColor: '#222', color: 'white' }}
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default FinalizeTokenAsNFT;
