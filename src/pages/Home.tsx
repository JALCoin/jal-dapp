// src/pages/Home.tsx
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main className="homepage">
      {/* Hero Section */}
      <section className="hero">
        <h1 className="gold-glow">You’re as valuable as what you decide to build.</h1>
        <p className="gold">This is your vault. Mint it into something real.</p>
        <div className="cta-buttons">
          <Link to="/crypto-generator" className="button gold">Create Your Currency</Link>
          <a href="#manifesto" className="button secondary">Read the Manifesto</a>
        </div>
      </section>

      {/* Core Flow Section */}
      <section className="section-group">
        {/* Generator */}
        <div className="card gold">
          <h2 className="gold-glow">Currency Generator</h2>
          <p className="gold">🪙 Step 1: Connect Phantom Wallet</p>
          <p>🔨 Step 2: Mint Token</p>
          <p>🧬 Step 3: Attach Identity</p>
          <p>🔓 Step 4: Become a Vault</p>
          <div className="centered-button">
            <Link to="/create-token" className="button">Begin Creation</Link>
          </div>
        </div>

        {/* Manifesto */}
        <div id="manifesto" className="card dark gold-border">
          <h2 className="gold-glow">The JAL/SOL Manifesto</h2>
          <p>This isn’t about crypto. It’s about truth, presence, and claiming space. It's about putting your name on something that won’t fade.</p>
          <p className="glow-text">This is the future of on-chain identity.</p>
        </div>

        {/* About */}
        <div className="card">
          <h2 className="gold">About JAL</h2>
          <p>
            I'm Jeremy Aaron Lugg. Born like a king. Built to turn influence into currency. This is more than a dApp—it’s my vault, and now it’s yours too.
          </p>
          <div className="cta-buttons">
            <a href="https://x.com/JAL358" className="button" target="_blank" rel="noopener noreferrer">
              Follow Me on X
            </a>
            <a href="mailto:358jal@gmail.com" className="button">Contact</a>
          </div>
        </div>

        {/* Vault List */}
        <div className="card">
          <h2 className="gold-glow">Explore the Vaults</h2>
          <p>Recently minted tokens by others like you:</p>
          <ul className="vault-list gold-glow">
            <li>$POWERUP</li>
            <li>$SOVEREIGN</li>
            <li>$CHOSEN</li>
          </ul>
          <div className="centered-button">
            <Link to="/dashboard" className="button secondary">View Dashboard</Link>
          </div>
        </div>

        {/* Join */}
        <div className="card gold-border">
          <h2 className="gold-glow">Join the Mission</h2>
          <p>Want early access to drops and secret content?</p>
          <form onSubmit={(e) => e.preventDefault()} className="newsletter-form">
            <input type="email" placeholder="you@example.com" required />
            <div className="centered-button">
              <button type="submit" className="button gold">Join Now</button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        © 2025 JAL/SOL • Built on Solana • 358jal@gmail.com
      </footer>
    </main>
  );
}
