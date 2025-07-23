// src/components/FinalizeTokenAsNFT.tsx
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
        <p><strong>Mint Address:</strong> <span style={{ wordBreak: 'break-word' }}>{mint}</span></p>

        <div style={{ textAlign: 'left', fontSize: '0.95rem', marginTop: '1.5rem' }}>
          <ol style={{ paddingLeft: '1.2rem', lineHeight: '1.75' }}>
            <li><strong>1.</strong> Go to <a href="https://www.lighthouse.storage/" target="_blank" rel="noopener noreferrer">lighthouse.storage</a> and sign in or create an account.</li>
            <li><strong>2.</strong> On your dashboard, generate an <strong>API key</strong> under the "API Keys" section.</li>
            <li><strong>3.</strong> Upload your <strong>token image/logo</strong> and copy the resulting <code>ipfs://</code> URI.</li>
            <li><strong>4.</strong> Create a <code>metadata.json</code> file locally using this template:
              <pre style={{
                background: '#111',
                color: '#0ffdd4',
                padding: '0.75rem',
                borderRadius: '6px',
                marginTop: '0.5rem',
                whiteSpace: 'pre-wrap'
              }}>
{`{
  "name": "Your Token Name",
  "symbol": "SYMBOL",
  "description": "What your token represents",
  "image": "ipfs://your-image-hash"
}`}
              </pre>
            </li>
            <li><strong>5.</strong> Upload your <code>metadata.json</code> to Lighthouse and copy the <strong>IPFS metadata URI</strong>.</li>
            <li><strong>6.</strong> Paste the metadata URI below.</li>
            <li><strong>7.</strong> Click "Finalize" and sign the transaction to attach your metadata on-chain.</li>
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
