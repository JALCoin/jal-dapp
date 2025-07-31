// src/pages/CryptoGeneratorIntro.tsx
import { Link } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function CryptoGeneratorIntro() {
  return (
    <main className="min-h-screen px-4 py-16 text-center bg-[var(--jal-bg)] text-[var(--jal-text)]">
      {/* Wallet Connect */}
      <div className="flex justify-center mb-10">
        <WalletMultiButton />
      </div>

      {/* Hero Section */}
      <section className="space-y-4 mb-12">
        <h1 className="text-3xl font-extrabold">Your Vault Starts Here</h1>
        <p className="text-[var(--jal-muted)] max-w-xl mx-auto">
          Influence becomes infrastructure. This is where you mint your identity.
        </p>
        <Link to="/crypto-generator/engine" className="button">
          Begin Full Process
        </Link>
      </section>

      {/* 3-Step Flow Cards */}
      <section className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
        {[
          {
            icon: '🪙',
            title: 'Mint a Token',
            desc: 'Create your SPL token directly from your wallet. Instant. Permissionless.',
            label: 'Go to Mint',
            link: '/crypto-generator/engine#step1',
          },
          {
            icon: '🧬',
            title: 'Attach Metadata',
            desc: 'Name it. Symbol it. Upload the logo. All saved to the chain.',
            label: 'Finalize Metadata',
            link: '/crypto-generator/engine#step5',
          },
          {
            icon: '🚀',
            title: 'Use It',
            desc: 'Send it. Grow it. Launch with it. Power a currency around who you are.',
            label: 'View Tools',
            link: '/dashboard',
          },
        ].map(({ icon, title, desc, label, link }) => (
          <div key={title} className="bg-white rounded-xl p-6 shadow-md text-center">
            <h2 className="text-xl font-semibold mb-2">{icon} {title}</h2>
            <p className="text-sm text-[var(--jal-muted)] mb-4">{desc}</p>
            <Link to={link} className="button">{label}</Link>
          </div>
        ))}
      </section>

      {/* Already Minted */}
      <section className="mt-16 text-center space-y-4">
        <h2 className="text-2xl font-semibold">Already minted?</h2>
        <Link to="/dashboard" className="button secondary">View My Vault</Link>
      </section>
    </main>
  );
}
