import { Link } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function CryptoGeneratorIntro() {
  return (
    <main className="min-h-screen bg-[var(--jal-bg)] text-[var(--jal-text)] p-6 flex items-center justify-center">
      <div className="w-full max-w-5xl space-y-16">

        {/* Wallet Connect */}
        <div className="flex justify-center">
          <WalletMultiButton className="wallet-button scale-110 hover:scale-125 transition-transform duration-300" />
        </div>

        {/* Hero Section */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-wide">Cryptocurrency Generator</h1>
          <p className="text-[var(--jal-muted)] text-lg max-w-xl mx-auto">
            This is where influence becomes currency. Mint your own token in 4 steps.
          </p>
          <Link
            to="/crypto-generator/engine"
            className="button mt-4 animate-pulse bg-black text-white px-6 py-2 rounded hover:brightness-125"
          >
            Begin Minting Process →
          </Link>
        </section>

        {/* Feature Grid */}
        <section className="grid md:grid-cols-3 gap-8 text-center">
          <div className="p-4 rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2">🪙 Mint a Token</h2>
            <p className="text-sm">
              Create your own SPL token directly from your wallet on Solana.
            </p>
          </div>
          <div className="p-4 rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2">🧬 Attach Metadata</h2>
            <p className="text-sm">
              Make it yours with name, symbol, and logo—all on-chain.
            </p>
          </div>
          <div className="p-4 rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2">🚀 Use It</h2>
            <p className="text-sm">
              Send it. List it. Power a project. Let it mean something.
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Already minted?</h2>
          <Link
            to="/dashboard"
            className="button bg-white text-black border border-black px-4 py-2 rounded hover:bg-black hover:text-white transition"
          >
            View My Vault
          </Link>
        </section>
      </div>
    </main>
  );
}
