// src/pages/Home.tsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Home() {
  const navigate = useNavigate();
  const [symbol, setSymbol] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("vaultSymbol");
    if (stored) setSymbol(stored.toUpperCase());
  }, []);

  const handleVaultRedirect = () => {
    navigate(symbol ? `/vault/${symbol}` : "/dashboard");
  };

  return (
    <main className="homepage">
      {/* Hero Section */}
      <section className="hero">
        <h1 className="glow-text white-glow">You're as valuable as what you decide to build.</h1>
        <p className="glow-muted">
          Created by JAL & this is your VAULT. Computed on SOL & mint into something real.
        </p>
        <div className="cta-buttons">
          <button className="button gold" onClick={handleVaultRedirect}>
            Create Your Currency
          </button>
        </div>
      </section>

      {/* Vault Overview */}
      <section className="section-group">
        <div className="card">
          <h2 className="glow-text white-glow">What is the VAULT?</h2>
          <p>
            The VAULT generates Solana tokens with a Neutral Reputation on Solscan.
            Identity is attached on-chain using Lighthouse and Metaplex.
          </p>
          <p>
            Each token receives a public vault URL:<br />
            <strong>jalsol.com/VAULT/YOURSYMBOL</strong>
          </p>
          <div className="centered-button">
            <button className="button" onClick={handleVaultRedirect}>
              Start Generation
            </button>
          </div>
        </div>

        {/* Token Creation Flow */}
        <div className="card">
          <h2 className="glow-text gold-glow">How It Works</h2>
          <ol style={{ textAlign: "left" }}>
            <li>Connect your Phantom Wallet</li>
            <li>Mint your Token</li>
            <li>Upload metadata to Lighthouse</li>
            <li>Finalize it using Metaplex</li>
            <li>You now own a Vault</li>
          </ol>
        </div>

        {/* Creator Info */}
        <div className="card dark">
          <h2 className="glow-text white-glow">About JAL</h2>
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

        {/* Live Vaults */}
        <div className="card">
          <h2 className="glow-text">Recent Vaults</h2>
          <p>Live tokens minted using JAL/SOL:</p>
          <ul className="vault-list">
            <li>$POWERUP</li>
            <li>$SOVEREIGN</li>
            <li>$CHOSEN</li>
          </ul>
          <div className="centered-button">
            <button className="button secondary" onClick={() => navigate("/dashboard")}>
              Open the Vault
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer glow-muted">
        © 2025 JAL/SOL • Computed by SOL • 358jal@gmail.com
      </footer>
    </main>
  );
}
