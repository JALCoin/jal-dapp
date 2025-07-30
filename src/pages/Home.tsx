// src/pages/Home.tsx
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main className="bg-[var(--jal-bg)] text-[var(--jal-text)] min-h-screen scroll-smooth overflow-x-hidden">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center h-screen text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
          You haven't found what you're looking for, have you?
        </h1>
        <p className="mt-4 text-lg md:text-xl text-[var(--jal-muted)] max-w-2xl">
          Until now. JAL/SOL is where self-worth meets code—where you don’t just follow value… you mint it.
        </p>
        <div className="mt-8 flex gap-4 flex-wrap justify-center">
          <Link
            to="/CreateToken"
            className="bg-black hover:bg-[var(--jal-glow)] text-white px-6 py-3 rounded-2xl shadow-xl transition-all"
          >
            Create Your Currency
          </Link>
          <a
            href="#manifesto"
            className="border border-black px-6 py-3 rounded-2xl hover:bg-white hover:text-black transition-all"
          >
            Read the Manifesto
          </a>
        </div>
      </section>

      {/* About */}
      <section className="py-24 px-6 text-center bg-white text-black">
        <h2 className="text-3xl font-semibold">About JAL</h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg">
          I'm Jeremy Aaron Lugg. Born like a king. Built to turn influence into currency.
          This is more than a dApp. It's my vault—and now it's yours too.
        </p>
        <div className="mt-6 flex gap-4 justify-center flex-wrap">
          <a
            href="https://x.com/JAL358"
            target="_blank"
            className="underline hover:text-[var(--jal-glow)]"
          >
            Follow Me on X
          </a>
          <a
            href="mailto:358jal@gmail.com"
            className="underline hover:text-[var(--jal-glow)]"
          >
            Contact
          </a>
        </div>
      </section>

      {/* Token Creator */}
      <section className="py-24 px-6 text-center">
        <h2 className="text-3xl font-semibold">Currency Generator</h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-[var(--jal-muted)]">
          Step 1: Connect Phantom Wallet<br />
          Step 2: Mint Token<br />
          Step 3: Attach Identity<br />
          Step 4: Become a Vault
        </p>
        <div className="mt-6">
          <Link
            to="/CreateToken"
            className="px-6 py-3 bg-black text-white rounded-2xl shadow hover:bg-[var(--jal-glow)] transition"
          >
            Begin Creation
          </Link>
        </div>
      </section>

      {/* Manifesto */}
      <section
        id="manifesto"
        className="py-24 px-6 bg-black text-white text-center"
      >
        <h2 className="text-3xl font-semibold">The JAL/SOL Manifesto</h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg">
          This isn’t about crypto. It’s about truth, code, and claiming space.
          It's about putting your name on something that won’t fade.
        </p>
        <p className="mt-4 text-[var(--jal-muted)]">
          This is the future of on-chain identity.
        </p>
      </section>

      {/* Dashboard Preview */}
      <section className="py-24 px-6 text-center bg-white text-black">
        <h2 className="text-3xl font-semibold">Explore the Vaults</h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg">
          Recently minted tokens by others like you:
        </p>
        <ul className="mt-6 flex justify-center gap-6 font-mono">
          <li>$POWERUP</li>
          <li>$SOVEREIGN</li>
          <li>$CHOSEN</li>
        </ul>
        <div className="mt-6">
          <Link
            to="/Dashboard"
            className="px-6 py-3 border border-black rounded-2xl hover:bg-black hover:text-white transition"
          >
            View Dashboard
          </Link>
        </div>
      </section>

      {/* Subscribe or Follow CTA */}
      <section className="py-24 px-6 text-center bg-[var(--jal-bg)] text-black">
        <h2 className="text-3xl font-semibold">Join the Mission</h2>
        <p className="mt-4 max-w-xl mx-auto text-lg">
          Want early access to drops and secret content?
        </p>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="mt-6 flex flex-col md:flex-row gap-4 justify-center"
        >
          <input
            type="email"
            placeholder="you@example.com"
            className="px-4 py-2 rounded-md border border-black focus:outline-none"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-black text-white rounded-md hover:bg-[var(--jal-glow)] transition"
          >
            Join Now
          </button>
        </form>
      </section>

      {/* Footer */}
      <footer className="text-center text-sm py-6 bg-black text-white">
        © 2025 JAL/SOL • Built on Solana • 358jal@gmail.com
      </footer>
    </main>
  );
}
