import { FC, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

interface TokenData {
  mint: string;
  amount: number;
}

const Dashboard: FC = () => {
  const { publicKey } = useWallet();
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [selectedMint, setSelectedMint] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("createdTokens");
    if (stored) {
      setTokens(JSON.parse(stored));
    }
  }, []);

  const handleTurnIntoCurrency = (mint: string) => {
    setSelectedMint(mint);
    setShowInstructions(true);
  };

  return (
    <div className="flex flex-col items-center justify-center text-center mt-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Your Created Tokens</h1>

      {tokens.length === 0 ? (
        <p className="text-lg">No tokens created yet.</p>
      ) : (
        tokens.map((token, index) => (
          <div
            key={index}
            className="bg-white text-black rounded-lg shadow-md p-6 mb-6 w-full max-w-lg"
          >
            <p><strong>Mint:</strong> {token.mint}</p>
            <p><strong>Amount:</strong> {token.amount}</p>
            <a
              href={`https://solscan.io/token/${token.mint}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline block mt-2"
            >
              View on Solscan ↗
            </a>
            <button
              onClick={() => handleTurnIntoCurrency(token.mint)}
              className="mt-4 bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition"
            >
              Turn Into Currency
            </button>
          </div>
        ))
      )}

      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white text-black p-6 rounded-lg max-w-lg w-full relative">
            <button
              onClick={() => setShowInstructions(false)}
              className="absolute top-2 right-4 text-2xl leading-none"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4">Turn Into Currency</h2>
            <ol className="list-decimal space-y-3 text-left text-sm pl-5">
              <li>
                Go to{" "}
                <a
                  href="https://www.lighthouse.storage/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  lighthouse.storage
                </a>{" "}
                and create an account.
              </li>
              <li>
                Upload your <code>metadata.json</code> file including:
                <ul className="list-disc pl-6 mt-1">
                  <li><strong>name</strong></li>
                  <li><strong>symbol</strong></li>
                  <li><strong>description</strong></li>
                  <li><strong>image</strong> (IPFS URI)</li>
                </ul>
              </li>
              <li>Copy the returned metadata URI.</li>
              <li>Come back to paste it in the next step (coming soon).</li>
            </ol>
            <p className="text-xs text-gray-600 mt-4">
              This step transforms your token into an on-chain asset with identity.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
