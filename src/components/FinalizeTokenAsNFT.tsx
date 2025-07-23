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
        <h1>Finalize Token</h1>
        <p><strong>Mint:</strong> {mint}</p>

        <div style={{ textAlign: 'left', fontSize: '0.95rem', marginTop: '1.5rem' }}>
          <p><strong>Instructions:</strong></p>
          <ol style={{ paddingLeft: '1.2rem' }}>
            <li>
              Sign in at <a href="https://www.lighthouse.storage/" target="_blank" rel="noopener noreferrer">lighthouse.storage</a> and create an account.
            </li>
            <li>
              Upload your token logo image and copy the returned <code>ipfs://...</code> image link.
            </li>
            <li>
              Create a <code>metadata.json</code> file with the following content:
              <pre style={{
                background: '#111',
                color: '#0ffdd4',
                padding: '0.75rem',
                borderRadius: '6px',
                marginTop: '0.5rem',
                fontSize: '0.85rem',
                whiteSpace: 'pre-wrap'
              }}>
{`{
  "name": "Your Token Name",
  "symbol": "SYMBOL",
  "description": "Your token description",
  "image": "ipfs://your-image-hash"
}`}
              </pre>
            </li>
            <li>
              Upload <code>metadata.json</code> to Lighthouse and copy the returned URI.
            </li>
            <li>
              Paste the URI below to finalize your token on-chain.
            </li>
          </ol>
        </div>

        <input
          type="text"
          placeholder="Paste metadata URI (ipfs://...)"
          value={metadataUri}
          onChange={(e) => setMetadataUri(e.target.value)}
        />

        <button
          className="button"
          onClick={() => onSubmit({ metadataUri })}
          disabled={!metadataUri}
        >
          Finalize Metadata
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
