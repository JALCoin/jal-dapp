// src/pages/CryptoGeneratorIntro.tsx
import { Link } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function CryptoGeneratorIntro() {
  return (
    <main className="homepage">
      {/* Wallet Button */}
      <div className="wallet-button">
        <WalletMultiButton />
      </div>

      {/* Intro */}
      <section>
        <h1>Your Vault Starts Here</h1>
        <p>Influence becomes infrastructure. This is where you mint your identity.</p>
        <div className="centered-button">
          <Link to="/crypto-generator/engine" className="button">
            Begin Full Process
          </Link>
        </div>
      </section>

      {/* Steps */}
      <section className="section-group">
        {/* Step 1 */}
        <div className="card">
          <h2>🪙 Mint a Token</h2>
          <p>Create your SPL token directly from your wallet. Instant. Permissionless.</p>
          <div className="centered-button">
            <Link to="/crypto-generator/engine#step1" className="button">Go to Mint</Link>
          </div>
        </div>

        {/* Step 2 */}
        <div className="card">
          <h2>🧬 Attach Metadata</h2>
          <p>Name it. Symbol it. Upload the logo. All saved to the chain.</p>
          <div className="centered-button">
            <Link to="/crypto-generator/engine#step5" className="button">Finalize Metadata</Link>
          </div>
        </div>

        {/* Step 3 */}
        <div className="card">
          <h2>🚀 Use It</h2>
          <p>Send it. Grow it. Launch with it. Power a currency around who you are.</p>
          <div className="centered-button">
            <Link to="/dashboard" className="button">View Tools</Link>
          </div>
        </div>
      </section>

      {/* Already Minted */}
      <section>
        <h2>Already minted?</h2>
        <div className="centered-button">
          <Link to="/dashboard" className="button secondary">View My Vault</Link>
        </div>
      </section>
    </main>
  );
}
