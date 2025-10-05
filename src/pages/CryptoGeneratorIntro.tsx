// src/pages/CryptoGeneratorIntro.tsx
import { Link } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

type InfoLink = { href: string; label: string };
export interface GeneratorInfoBlock {
  title: string;
  content: string;
  link?: InfoLink;
}

const tokenBlocks: GeneratorInfoBlock[] = [
  {
    title: "Mint a Token",
    content:
      "Define your symbol, supply, and mint authority using your connected wallet.",
    link: { href: "/crypto-generator/engine#step1", label: "Go to Mint" },
  },
  {
    title: "Attach Metadata",
    content:
      "Upload a logo and finalize token info on-chain via Lighthouse (IPFS) + Metaplex.",
    link: { href: "/crypto-generator/engine#step5", label: "Finalize Metadata" },
  },
  {
    title: "Vault Access",
    content:
      "After creation, view balances and activity in your token’s vault.",
    link: { href: "/?panel=vault", label: "View Vault" },
  },
];

export default function CryptoGeneratorIntro() {
  return (
    <main className="landing-gradient">
      <section className="container" aria-label="Crypto Generator" style={{ padding: 24 }}>
        {/* Wallet */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <WalletMultiButton />
        </div>

        {/* Hero */}
        <div className="card">
          <h1 className="jal-title" style={{ marginTop: 0 }}>Generate Your Currency</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            Create a Solana token with on-chain identity and finality. Your vault, your symbol, your legacy.
          </p>

          {/* Dual paths */}
          <div className="product-grid" style={{ marginTop: 12 }}>
            {/* Currency / Token */}
            <article className="product-card">
              <div className="product-body">
                <h4 className="product-title">Currency / Token (Fungible)</h4>
                <div className="product-blurb">
                  <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                    <li>Interchangeable units (1 X = 1 X)</li>
                    <li>Best for points, memecoins, governance</li>
                    <li>You control supply and mint authority</li>
                  </ul>
                </div>
                <div className="muted" style={{ marginTop: 8 }}>
                  Creates: SPL Mint + Associated Token Account + Metadata
                </div>
                <div style={{ marginTop: 10 }}>
                  <Link className="button gold" to="/crypto-generator/engine#step1">
                    Start Token
                  </Link>
                </div>
                <div className="chip-row" style={{ marginTop: 10 }}>
                  <span className="chip">Loyalty</span>
                  <span className="chip">Governance</span>
                  <span className="chip">Memecoin</span>
                </div>
              </div>
            </article>

            {/* NFT */}
            <article className="product-card">
              <div className="product-body">
                <h4 className="product-title">NFT / Asset (Non-Fungible)</h4>
                <div className="product-blurb">
                  <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                    <li>Unique items or passes (1/1 or limited series)</li>
                    <li>Artwork stored via Lighthouse/IPFS</li>
                    <li>Collection metadata for discovery</li>
                  </ul>
                </div>
                <div className="muted" style={{ marginTop: 8 }}>
                  Current path: <strong>Attach Metadata</strong> preview (minting UI is in progress)
                </div>
                <div style={{ marginTop: 10 }}>
                  {/* We’re honest: this takes them to the metadata step (preview) */}
                  <Link className="button" to="/crypto-generator/engine#step5" aria-label="Open NFT metadata step">
                    Open Metadata Preview
                  </Link>
                </div>
                <div className="chip-row" style={{ marginTop: 10 }}>
                  <span className="chip">Art</span>
                  <span className="chip">Membership</span>
                  <span className="chip">Access Pass</span>
                </div>
              </div>
            </article>
          </div>

          {/* Quick CTA */}
          <div className="chip-row" style={{ marginTop: 12, justifyContent: "center" }}>
            <Link className="chip" to="/crypto-generator/engine#step1">Currency Generator</Link>
            <Link className="chip" to="/crypto-generator/engine#step5" title="Metadata attach preview">
              NFT (Metadata Preview)
            </Link>
          </div>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
            <Link to="/crypto-generator/engine#step1" className="button gold">
              Start Generation
            </Link>
          </div>
        </div>

        {/* How it works */}
        <div className="feature-grid" style={{ marginTop: 16 }}>
          {tokenBlocks.map(({ title, content, link }) => (
            <article key={title} className="feature-card">
              <div className="title" style={{ marginBottom: 6 }}>{title}</div>
              <p className="muted">{content}</p>
              {link && (
                <div style={{ marginTop: 10 }}>
                  <Link to={link.href} className="button">
                    {link.label}
                  </Link>
                </div>
              )}
            </article>
          ))}
        </div>

        {/* Already generated */}
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Already created your token?</h3>
          <div style={{ marginTop: 8 }}>
            <Link to="/?panel=vault" className="button ghost">
              Go to Vault
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
