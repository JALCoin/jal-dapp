// src/pages/Home.tsx
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main className="homepage">
      {/* Hero Section */}
      <section>
        <h1>You haven't found what you're looking for, have you?</h1>
        <p>
          Until now. JAL/SOL is where self-worth meets code—where you don’t just follow value… you mint it.
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginTop: '1.5rem',
          }}
        >
          <Link to="/create-token" className="button">
            Create Your Currency
          </Link>
          <a
            href="#manifesto"
            className="button"
            style={{
              backgroundColor: 'white',
              color: 'black',
              border: '1px solid black',
            }}
          >
            Read the Manifesto
          </a>
        </div>
      </section>

      {/* Section Group */}
      <section className="section-group">
        {/* Generator */}
        <div>
          <h2>Currency Generator</h2>
          <p>🪙 Step 1: Connect Phantom Wallet</p>
          <p>🔨 Step 2: Mint Token</p>
          <p>🧬 Step 3: Attach Identity</p>
          <p>🔓 Step 4: Become a Vault</p>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
              marginTop: '1rem',
            }}
          >
            <Link to="/create-token" className="button">
              Begin Creation
            </Link>
          </div>
        </div>

        {/* Manifesto */}
        <div
          id="manifesto"
          style={{
            backgroundColor: 'black',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            marginTop: '1rem',
            textAlign: 'center',
          }}
        >
          <h2>The JAL/SOL Manifesto</h2>
          <p>
            This isn’t about crypto. It’s about truth, code, and claiming space.
            It's about putting your name on something that won’t fade.
          </p>
          <p style={{ color: 'var(--jal-glow)' }}>
            This is the future of on-chain identity.
          </p>
        </div>

        {/* About */}
        <div>
          <h2>About JAL</h2>
          <p>
            I'm Jeremy Aaron Lugg. Born like a king. Built to turn influence into currency.
            This is more than a dApp. It's my vault—and now it's yours too.
          </p>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
              marginTop: '1rem',
            }}
          >
            <a
              href="https://x.com/JAL358"
              target="_blank"
              rel="noopener noreferrer"
              className="button"
            >
              Follow Me on X
            </a>
            <a href="mailto:358jal@gmail.com" className="button">
              Contact
            </a>
          </div>
        </div>

        {/* Dashboard */}
        <div>
          <h2>Explore the Vaults</h2>
          <p>Recently minted tokens by others like you:</p>
          <ul
            style={{
              listStylePosition: 'inside',
              textAlign: 'center',
              paddingLeft: 0,
              marginTop: '1rem',
              marginBottom: '1rem',
            }}
          >
            <li>$POWERUP</li>
            <li>$SOVEREIGN</li>
            <li>$CHOSEN</li>
          </ul>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
              marginTop: '1rem',
            }}
          >
            <Link
              to="/dashboard"
              className="button"
              style={{
                backgroundColor: 'white',
                color: 'black',
                border: '1px solid black',
              }}
            >
              View Dashboard
            </Link>
          </div>
        </div>

        {/* Join */}
        <div>
          <h2>Join the Mission</h2>
          <p>Want early access to drops and secret content?</p>
          <form
            onSubmit={(e) => e.preventDefault()}
            style={{ textAlign: 'center' }}
          >
            <input type="email" placeholder="you@example.com" />
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
                marginTop: '1rem',
              }}
            >
              <button type="submit" className="button">
                Join Now
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          color: 'black',
          padding: '2rem 1rem',
          textAlign: 'center',
        }}
      >
        © 2025 JAL/SOL • Built on Solana • 358jal@gmail.com
      </footer>
    </main>
  );
}
