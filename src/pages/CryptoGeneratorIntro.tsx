import { Link } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function CryptoGeneratorIntro() {
  return (
    <main className="min-h-screen bg-[var(--jal-bg)] text-[var(--jal-text)] p-6">
      <div className="max-w-5xl mx-auto space-y-12">

        {/* Wallet Connect */}
        <div className="wallet-button">
          <WalletMultiButton />
        </div>

        {/* Hero Section */}
        <section className="text-center">
          <h1 className="text-3xl font-bold">Cryptocurrency Generator</h1>
          <p className="mt-2 text-[var(--jal-muted)]">
            This is where influence becomes currency. Mint your own token in 4 steps.
          </p>
          <Link to="/crypto-generator/engine" className="button mt-6">
            Begin Minting Process →
          </Link>
        </section>

        {/* Feature Grid */}
        <section className="section-group">
          <div>
            <h2>🪙 Mint a Token</h2>
            <p>Create your own SPL token directly from your wallet on Solana.</p>
          </div>
          <div>
            <h2>🧬 Attach Metadata</h2>
            <p>Make it yours with name, symbol, and logo—all on-chain.</p>
          </div>
          <div>
            <h2>🚀 Use It</h2>
            <p>Send it. List it. Power a project. Let it mean something.</p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-2xl font-semibold">Already minted?</h2>
          <Link to="/dashboard" className="button mt-2">
            View My Vault
          </Link>
        </section>
      </div>
    </main>
  );
}
