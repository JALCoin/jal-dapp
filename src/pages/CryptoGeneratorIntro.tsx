import { Link } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function CryptoGeneratorIntro() {
  return (
    <main className="min-h-screen bg-[var(--jal-bg)] text-[var(--jal-text)] px-6 pt-24 pb-12">
      <div className="max-w-5xl mx-auto space-y-24">

        {/* Wallet Connection */}
        <div className="wallet-button">
          <WalletMultiButton />
        </div>

        {/* Hero Section */}
        <section className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight">Your Vault Starts Here</h1>
          <p className="text-[var(--jal-muted)] mt-4 text-lg max-w-xl mx-auto">
            Influence becomes infrastructure. This is where you mint your identity.
          </p>
          <div className="cta-buttons mt-6">
            <Link to="/crypto-generator/engine" className="button">
              Begin Full Process
            </Link>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: '🪙 Mint a Token',
              desc: 'Create your SPL token directly from your wallet. Instant. Permissionless.',
              link: '/crypto-generator/engine#step1',
              label: 'Go to Mint'
            },
            {
              title: '🧬 Attach Metadata',
              desc: 'Name it. Symbol it. Upload the logo. All saved to the chain.',
              link: '/crypto-generator/engine#step5',
              label: 'Finalize Metadata'
            },
            {
              title: '🚀 Use It',
              desc: 'Send it. Grow it. Launch with it. Power a currency around who you are.',
              link: '/dashboard',
              label: 'View Tools'
            }
          ].map(({ title, desc, link, label }) => (
            <div key={title} className="card text-center">
              <h2 className="text-xl font-bold mb-2">{title}</h2>
              <p className="text-[var(--jal-muted)] text-sm mb-4">{desc}</p>
              <Link to={link} className="button">{label}</Link>
            </div>
          ))}
        </section>

        {/* Dashboard Redirect */}
        <section className="text-center">
          <h2 className="text-2xl font-semibold">Already minted?</h2>
          <div className="centered-button mt-4">
            <Link to="/dashboard" className="button secondary">
              View My Vault
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
