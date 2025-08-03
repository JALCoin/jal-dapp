// src/pages/Home.tsx
import { Link } from "react-router-dom";
import { generatorInfoBlocks } from "./CryptoGeneratorIntro";

export default function Home() {
  return (
    <main className="homepage">
      {/* === HERO === */}
      <section className="hero">
        <h1 className="hero-glow">You're as valuable as what you decide to build.</h1>
        <p className="text-green-500 text-center">
          Created by JAL & this is your VAULT. Computed on SOL & mint into something real.
        </p>
        <div className="cta-buttons">
          <Link to="/vault/JAL" className="button gold">Create Your Currency</Link>
        </div>
      </section>

      {/* === GENERATOR INFO BLOCKS === */}
      <section className="section-group">
        {generatorInfoBlocks.map((block, i) => (
          <div key={i} className="card">
            <h2>{block.title}</h2>
            {Array.isArray(block.content)
              ? block.content.map((p, idx) => <p key={idx}>{p}</p>)
              : <p>{block.content}</p>}
            {block.link && (
              <div className="centered-button mt-4">
                <Link to={block.link.href} className="button">
                  {block.link.label}
                </Link>
              </div>
            )}
          </div>
        ))}
      </section>

      {/* === ABOUT === */}
      <section className="section-group">
        <div className="card dark">
          <h2>About JAL</h2>
          <p>
            I’m Jeremy Aaron Lugg. Born like a king. Built like a ledger.  
            JAL/SOL is how I prove that influence can become infrastructure.
          </p>
          <div className="cta-buttons">
            <a href="https://x.com/JAL358" className="button" target="_blank" rel="noopener noreferrer">X Profile</a>
            <a href="mailto:358jal@gmail.com" className="button">Contact</a>
          </div>
        </div>
      </section>

      {/* === SAMPLE VAULTS === */}
      <section className="section-group">
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

      {/* === FOOTER === */}
      <footer className="site-footer">
        © 2025 JAL/SOL • Computed by SOL • 358jal@gmail.com
      </footer>
    </main>
  );
}
