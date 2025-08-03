// src/pages/Home.tsx
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main className="homepage">
      {/* Hero Section */}
      <section className="hero">
        <h1>JAL/SOL: A Currency Generator</h1>
        <p>
          Built by JAL. Computed on SOL. This is a tool to mint presence, not hype.
        </p>
        <div className="cta-buttons">
          <Link to="/crypto-generator" className="button gold">Create Your Currency</Link>
        </div>
      </section>

      {/* VAULT Overview */}
      <section className="section-group">
        <div className="card">
          <h2>What is the VAULT?</h2>
          <p>
            The VAULT generates Solana tokens with a Neutral Reputation on Solscan.
            Identity is attached on-chain using Lighthouse and Metaplex.
          </p>
          <p>
            Each token receives a public vault URL:<br />
            <strong>jalsol.com/VAULT/YOURSYMBOL</strong>
          </p>
          <div className="centered-button">
            <Link to="/crypto-generator" className="button">Start Generation</Link>
          </div>
        </div>

        {/* Token Creation Flow */}
        <div className="card">
          <h2>How It Works</h2>
          <p>1. Connect your Phantom Wallet</p>
          <p>2. Mint your Token</p>
          <p>3. Upload metadata to Lighthouse</p>
          <p>4. Finalize it using Metaplex</p>
          <p>5. You now own a Vault</p>
        </div>

        {/* Creator */}
        <div className="card dark">
          <h2>About JAL</h2>
          <p>
            I’m Jeremy Aaron Lugg. Born like a king. Built like a ledger.
            JAL/SOL is how I prove that influence can become infrastructure.
          </p>
          <div className="cta-buttons">
            <a href="https://x.com/JAL358" className="button" target="_blank" rel="noopener noreferrer">
              X Profile
            </a>
            <a href="mailto:358jal@gmail.com" className="button">Contact</a>
          </div>
        </div>

        {/* Sample Vaults */}
        <div className="card">
          <h2>Recent Vaults</h2>
          <p>Live tokens minted using JAL/SOL:</p>
          <ul className="vault-list">
            <li>$POWERUP</li>
            <li>$SOVEREIGN</li>
            <li>$CHOSEN</li>
          </ul>
          <div className="centered-button">
            <Link to="/dashboard" className="button secondary">Open the Vault</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        © 2025 JAL/SOL • Computed by SOL • 358jal@gmail.com
      </footer>
    </main>
  );
}
