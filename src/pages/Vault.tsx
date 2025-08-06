// src/pages/Vault.tsx
import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Connection } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Link } from "react-router-dom";

interface TokenInfo {
  mint: string;
  amount: string;
  decimals: number;
  name?: string;
  symbol?: string;
  image?: string;
  hasMetadata?: boolean;
}

export default function Vault() {
  const { publicKey } = useWallet();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);

  const connection = useMemo(() => new Connection("https://api.mainnet-beta.solana.com"), []);

  useEffect(() => {
    const fetchTokens = async () => {
      if (!publicKey) return;

      const accounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID,
      });

      const ownedTokens: TokenInfo[] = accounts.value
        .map(({ account }) => {
          const info = account.data.parsed.info;
          return {
            mint: info.mint,
            amount: info.tokenAmount.uiAmountString,
            decimals: info.tokenAmount.decimals,
          };
        })
        .filter((token) => token.amount !== "0");

      setTokens(ownedTokens);
    };

    fetchTokens();
  }, [connection, publicKey]);

  return (
    <main className="vault-screen">
      {/* === HEADER === */}
      <div className="vault-header-divider"></div>
      <h1 className="vault-title">VAULT</h1>

      {/* === PLACEHOLDER LOGO === */}
      <div className="vault-logo-circle">
        <div className="vault-logo-inner">
          Logo: Updated after<br />currency creation.
        </div>
      </div>

      {/* === GLOWING SLOGAN === */}
      <h2 className="vault-slogan">Plenty is built. I’m created.</h2>

      {/* === SUBTEXT === */}
      <p className="vault-subtext">
        Tokenised by JAL & this is your VAULT. Computed on SOL & mint into something real.
      </p>

      {/* === CTA BUTTON === */}
      <div className="vault-cta-container">
        <Link to="/vault/JAL" className="vault-button">
          CREATE YOUR CURRENCY
        </Link>
      </div>

      {/* === FOOTER === */}
      <footer className="site-footer">
        © 2025 JAL/SOL • Computed by SOL • <a href="mailto:358jal@gmail.com">358jal@gmail.com</a>
      </footer>
    </main>
  );
}
