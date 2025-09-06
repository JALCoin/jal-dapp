// src/pages/CryptoGeneratorIntro.tsx
import { Link } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export interface GeneratorInfoBlock {
  title: string;
  content: string;
  link?: { href: string; label: string };
}

export const generatorInfoBlocks: GeneratorInfoBlock[] = [
  {
    title: "Mint a Token",
    content:
      "Define your symbol, supply, and mint authority using your connected wallet.",
    link: { href: "/crypto-generator/engine#step1", label: "Go to Mint" },
  },
  {
    title: "Attach Metadata",
    content:
      "Upload a logo and finalize token info on-chain via Lighthouse + Metaplex.",
    link: { href: "/crypto-generator/engine#step5", label: "Finalize Metadata" },
  },
  {
    title: "Vault Access",
    content:
      "Your token gets a vault page for balances and activity once created.",
    link: { href: "/?panel=vault", label: "View Vault" },
  },
];

export default function CryptoGeneratorIntro() {
  return (
    <main className="landing-gradient">
      <section className="bank-landing container" aria-label="Crypto Generator">
        {/* Wallet */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <WalletMultiButton />
        </div>

        {/* Hero */}
        <div className="card">
          <h1 className="jal-title">Generate Your Currency</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            Create a Solana token with on-chain identity and finality. Your vault,
            your symbol, your legacy.
          </p>
          <div className="chip-row" style={{ marginTop: 10 }}>
            <Link className="chip" to="/crypto-generator/engine#step1">
              Currency Generator
            </Link>
            <Link className="chip" to="/crypto-generator/engine#step5">
              NFT Generator
            </Link>
          </div>
          <div className="jal-cta">
            <Link to="/crypto-generator/engine" className="button gold">
              Start Generation
            </Link>
          </div>
        </div>

        {/* Info blocks */}
        <div className="feature-grid">
          {generatorInfoBlocks.map(({ title, content, link }) => (
            <article key={title} className="feature-card">
              <h4>{title}</h4>
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
        <div className="card">
          <h3>Already created your token?</h3>
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
