import { Link } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function CryptoGeneratorIntro() {
  return (
    <main className="min-h-screen bg-[var(--jal-bg)] text-[var(--jal-text)] px-6 pt-24 pb-12">
      <div className="max-w-5xl mx-auto space-y-20">

        {/* Wallet Button */}
        <div className="flex justify-center">
          <WalletMultiButton />
        </div>

        {/* Hero Section */}
        <section className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Cryptocurrency Generator</h1>
          <p className="text-[var(--jal-muted)]">
            This is where influence becomes currency. Mint your own token in 4 steps.
          </p>
          <Link to="/crypto-generator/engine" className="button mt-2 mx-auto">
            Begin Full Process →
          </Link>
        </section>

        {/* Feature Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="flex flex-col items-center space-y-3">
            <h2 className="text-lg font-semibold">🪙 Mint a Token</h2>
            <p className="text-sm max-w-xs">
              Create your own SPL token directly from your wallet on Solana.
            </p>
            <Link to="/crypto-generator/engine#step1" className="button">
              Go to Mint
            </Link>
          </div>
          <div className="flex flex-col items-center space-y-3">
            <h2 className="text-lg font-semibold">🧬 Attach Metadata</h2>
            <p className="text-sm max-w-xs">
              Make it yours with name, symbol, and logo—all on-chain.
            </p>
            <Link to="/crypto-generator/engine#step5" className="button">
              Finalize Metadata
            </Link>
          </div>
          <div className="flex flex-col items-center space-y-3">
            <h2 className="text-lg font-semibold">🚀 Use It</h2>
            <p className="text-sm max-w-xs">
              Send it. List it. Power a project. Let it mean something.
            </p>
            <Link to="/dashboard" className="button">
              View Tools
            </Link>
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
