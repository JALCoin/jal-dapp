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
        <p><strong>Mint:</strong> <span style={{ wordBreak: 'break-word' }}>{mint}</span></p>

        <div style={{ textAlign: 'left', fontSize: '0.95rem', marginTop: '1.5rem' }}>
          <ol style={{ paddingLeft: '1.2rem', lineHeight: '1.75' }}>
            <li><strong>1.</strong> Visit <a href="https://www.lighthouse.storage" target="_blank" rel="noopener noreferrer">lighthouse.storage</a> and log in or create an account.</li>
            <li><strong>2.</strong> Upload your <code>metadata.json</code> file and copy the resulting IPFS URI (e.g., <code>ipfs://...</code>).</li>
            <li><strong>3.</strong> Paste that URI below and click "Finalize".</li>
          </ol>
        </div>

        <input
          type="text"
          placeholder="ipfs://... (metadata URI)"
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
