// src/pages/Home.tsx
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section>
        <h1>You haven't found what you're looking for, have you?</h1>
        <p>
          Until now. JAL/SOL is where self-worth meets code—where you don’t just follow value… you mint it.
        </p>
        <div className="flex gap-4 flex-wrap justify-center mt-6">
          <Link to="/create-token" className="button">Create Your Currency</Link>
          <a href="#manifesto" className="button" style={{ backgroundColor: 'white', color: 'black', border: '1px solid black' }}>Read the Manifesto</a>
        </div>
      </section>

      {/* About Section */}
      <section>
        <h2>About JAL</h2>
        <p>
          I'm Jeremy Aaron Lugg. Born like a king. Built to turn influence into currency.
          This is more than a dApp. It's my vault—and now it's yours too.
        </p>
        <div className="flex gap-4 flex-wrap justify-center mt-4">
          <a href="https://x.com/JAL358" target="_blank" className="button">Follow Me on X</a>
          <a href="mailto:358jal@gmail.com" className="button">Contact</a>
        </div>
      </section>

      {/* Token Generator Section */}
      <section>
        <h2>Currency Generator</h2>
        <div className="section-group">
          <div>
            <p>🪙 Step 1: Connect Phantom Wallet</p>
            <p>🔨 Step 2: Mint Token</p>
            <p>🧬 Step 3: Attach Identity</p>
            <p>🔓 Step 4: Become a Vault</p>
          </div>
        </div>
        <div className="mt-6 text-center">
          <Link to="/create-token" className="button">Begin Creation</Link>
        </div>
      </section>

      {/* Manifesto Section */}
      <section id="manifesto" style={{ backgroundColor: 'black', color: 'white' }}>
        <h2>The JAL/SOL Manifesto</h2>
        <p>
          This isn’t about crypto. It’s about truth, code, and claiming space.
          It's about putting your name on something that won’t fade.
        </p>
        <p style={{ color: 'var(--jal-muted)' }}>This is the future of on-chain identity.</p>
      </section>

      {/* Dashboard Section */}
      <section style={{ backgroundColor: 'white', color: 'black' }}>
        <h2>Explore the Vaults</h2>
        <p>Recently minted tokens by others like you:</p>
        <ul className="flex gap-6 justify-center mt-4 font-mono text-lg">
          <li>$POWERUP</li>
          <li>$SOVEREIGN</li>
          <li>$CHOSEN</li>
        </ul>
        <div className="mt-6">
          <Link to="/dashboard" className="button" style={{ backgroundColor: 'white', color: 'black', border: '1px solid black' }}>
            View Dashboard
          </Link>
        </div>
      </section>

      {/* Join Section */}
      <section>
        <h2>Join the Mission</h2>
        <p>Want early access to drops and secret content?</p>
        <form onSubmit={(e) => e.preventDefault()}>
          <input type="email" placeholder="you@example.com" />
          <button type="submit" className="button">Join Now</button>
        </form>
      </section>

      {/* Footer */}
      <footer>
        © 2025 JAL/SOL • Built on Solana • 358jal@gmail.com
      </footer>
    </main>
  );
}
