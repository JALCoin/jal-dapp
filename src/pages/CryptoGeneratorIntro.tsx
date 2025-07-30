import { Link } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function CryptoGeneratorIntro() {
  return (
    <main className="min-h-screen bg-[var(--jal-bg)] text-[var(--jal-text)] px-6 pt-24 pb-12">
      <div className="max-w-5xl mx-auto space-y-20">

        {/* Wallet Button */}
        <div className="wallet-button">
          <WalletMultiButton />
        </div>

        {/* Hero Section */}
        <section className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Cryptocurrency Generator</h1>
          <p className="text-[var(--jal-muted)]">
            This is where influence becomes currency. Mint your own token in 4 steps.
          </p>
          <div className="flex justify-center">
            <Link to="/crypto-generator/engine" className="button">
              Begin Full Process →
            </Link>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="section-group grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: '🪙 Mint a Token',
              desc: 'Create your own SPL token directly from your wallet on Solana.',
              link: '/crypto-generator/engine#step1',
              label: 'Go to Mint',
            },
            {
              title: '🧬 Attach Metadata',
              desc: 'Make it yours with name, symbol, and logo—all on-chain.',
              link: '/crypto-generator/engine#step5',
              label: 'Finalize Metadata',
            },
            {
              title: '🚀 Use It',
              desc: 'Send it. List it. Power a project. Let it mean something.',
              link: '/dashboard',
              label: 'View Tools',
            },
          ].map(({ title, desc, link, label }) => (
            <div key={title} className="text-center space-y-2">
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-sm text-[var(--jal-muted)]">{desc}</p>
              <Link to={link} className="button mt-2 inline-block">{label}</Link>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Already minted?</h2>
          <Link to="/dashboard" className="button">
            View My Vault
          </Link>
        </section>
      </div>
    </main>
  );
}
