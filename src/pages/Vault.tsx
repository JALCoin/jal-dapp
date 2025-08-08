import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Link } from "react-router-dom";

export default function Vault() {
  const { publicKey } = useWallet();
  const [tokenCount, setTokenCount] = useState<number | null>(null);

  const connection = useMemo(
    () => new Connection("https://api.mainnet-beta.solana.com"),
    []
  );

  useEffect(() => {
    const fetchTokens = async () => {
      if (!publicKey) return;

      try {
        const accounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          {
            programId: TOKEN_PROGRAM_ID,
          }
        );

        const ownedTokens = accounts.value.filter(({ account }) => {
          const amount = account.data.parsed.info.tokenAmount.uiAmount;
          return amount && amount > 0;
        });

        setTokenCount(ownedTokens.length);
      } catch (err) {
        console.error("Failed to fetch tokens:", err);
      }
    };

    fetchTokens();
  }, [connection, publicKey]);

  return (
    <main className="vault-screen vault-unlock">
      {/* Shared animated machine background */}
      <div className="machine-bg" aria-hidden />

      {/* === VAULT TITLE === */}
      <h1 className="vault-title">VAULT</h1>

      {/* === LOGO PLACEHOLDER IN GLOW CIRCLE === */}
      <div className={`logo-circle ${publicKey ? "wallet-connected" : ""}`}>
        <div className="vault-logo-inner" style={{ textAlign: "center" }}>
          Logo: Updated after
          <br />
          currency creation.
        </div>
      </div>

      {/* === GLOWING SLOGAN === */}
      <h2 className="vault-slogan">Plenty is built. I’m created.</h2>

      {/* === SUBTEXT === */}
      <p className="vault-subtext">
        Tokenised by JAL & this is your VAULT. Computed on SOL & mint into
        something real.
      </p>

      {/* === CTA BUTTON === */}
      <div className="vault-cta-container">
        <Link to="/vault/JAL" className="vault-button">
          CREATE YOUR CURRENCY
        </Link>
      </div>

      {/* === OPTIONAL WALLET STATUS === */}
      {publicKey && (
        <p className="vault-subtext">
          Wallet connected:
          <br />
          <span style={{ fontSize: "0.8rem" }}>
            {publicKey.toBase58()}
          </span>
          {tokenCount !== null && (
            <div style={{ marginTop: "0.5rem" }}>
              🪙 <strong>{tokenCount}</strong>{" "}
              token{tokenCount === 1 ? "" : "s"} in your Vault
            </div>
          )}
        </p>
      )}

      {/* === FOOTER === */}
      <footer className="site-footer">
        © 2025 JAL/SOL • Computed by SOL •{" "}
        <a href="mailto:358jal@gmail.com">358jal@gmail.com</a>
      </footer>
    </main>
  );
}
