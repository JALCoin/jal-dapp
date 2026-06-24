import { useEffect, useState } from "react";
import { JAL_COIN, shortAddress } from "../lib/jalCoin";

type JalCoinActionsProps = {
  className?: string;
  compact?: boolean;
};

type VerificationRow = {
  id: string;
  label: string;
  value: string;
  note: string;
  href: string;
};

const VERIFICATION_ROWS: VerificationRow[] = [
  {
    id: "mint",
    label: "Official Mint",
    value: JAL_COIN.mintAddress,
    note: "The public SPL token mint for JAL Coin.",
    href: JAL_COIN.solscanMintUrl,
  },
  {
    id: "pool",
    label: "Raydium Pool",
    value: JAL_COIN.raydiumPoolAddress,
    note: "The public JAL / SOL liquidity pool account.",
    href: JAL_COIN.solscanPoolUrl,
  },
  {
    id: "authority",
    label: "Liquidity Wallet",
    value: JAL_COIN.mintAuthorityAddress,
    note: "Official public wallet for voluntary JAL liquidity support.",
    href: JAL_COIN.solscanAuthorityUrl,
  },
  {
    id: "reserve",
    label: "Reserve Account",
    value: JAL_COIN.reserveTokenAccount,
    note: "Token account owned by the authority wallet.",
    href: JAL_COIN.solscanReserveUrl,
  },
];

export function JalCoinActions({ className = "", compact = false }: JalCoinActionsProps) {
  const [copied, setCopied] = useState(false);
  const classes = ["jal-coin-actions", compact ? "jal-coin-actions--compact" : "", className]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    if (!copied) return;

    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyLiquidityWallet() {
    try {
      await navigator.clipboard.writeText(JAL_COIN.liquiditySupportWallet);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={classes} aria-label="JAL Coin actions">
      <a
        className="button gold jal-coin-action"
        href={JAL_COIN.raydiumSwapUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Buy $JAL On Raydium
      </a>
      <button
        type="button"
        className="button ghost jal-coin-action"
        onClick={copyLiquidityWallet}
      >
        {copied ? "Wallet Copied" : "Copy Liquidity Wallet"}
      </button>
    </div>
  );
}

export default function JalCoinPanel() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!copiedId) return;

    const timer = window.setTimeout(() => setCopiedId(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copiedId]);

  async function copyAddress(id: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
    } catch {
      setCopiedId(null);
    }
  }

  return (
    <section
      className="card machine-surface panel-frame jal-coin-panel"
      aria-label="JAL Coin official links"
    >
      <div className="jal-coin-panel-copy">
        <div className="home-kicker">JAL COIN | PUBLIC LINKS</div>
        <h2 className="home-modules-title">Buy $JAL on Raydium or copy the liquidity wallet.</h2>
        <p className="home-modules-lead">
          JAL Coin is part of the JALSOL build on Solana. Use the official links below, compare the
          mint and wallet addresses before acting, and only interact with crypto tools you
          understand.
        </p>

        <JalCoinActions className="jal-coin-panel-actions" />

        <div className="jal-coin-liquidity-guide" aria-label="How to support JAL liquidity">
          <div className="jal-coin-guide-title">Liquidity support</div>
          <ol>
            <li>Use the buy button to open JAL Coin on Raydium.</li>
            <li>Choose SOL on Raydium if you want to buy using SOL.</li>
            <li>Copy the liquidity wallet if you want to send voluntary liquidity support.</li>
          </ol>
          <p>
            Liquidity support sent to the wallet is a voluntary contribution controlled by the
            operator, not a direct Raydium LP deposit or entitlement to LP tokens.
          </p>
        </div>

        <div className="jal-coin-risk-note" role="note">
          Crypto tokens and voluntary wallet support are optional, volatile, and may lose value.
          This is not financial advice, a token sale, equity, or a promise of future benefit.
        </div>
      </div>

      <div className="jal-coin-verification" aria-label="Verified JAL Coin addresses">
        <div className="jal-coin-verification-head">
          <div>
            <div className="jal-coin-verification-kicker">Verify Before You Act</div>
            <div className="jal-coin-verification-title">Official addresses</div>
          </div>
          <div className="jal-coin-status-pill">Freeze Authority: {JAL_COIN.freezeAuthorityStatus}</div>
        </div>

        <div className="jal-coin-address-list">
          {VERIFICATION_ROWS.map((row) => (
            <div className="jal-coin-address-row" key={row.id}>
              <div className="jal-coin-address-main">
                <div className="jal-coin-address-label">{row.label}</div>
                <div className="jal-coin-address-value">{shortAddress(row.value)}</div>
                <p className="jal-coin-address-note">{row.note}</p>
              </div>
              <div className="jal-coin-address-actions">
                <button
                  type="button"
                  className="jal-coin-copy-button"
                  onClick={() => copyAddress(row.id, row.value)}
                >
                  {copiedId === row.id ? "Copied" : "Copy"}
                </button>
                <a
                  className="jal-coin-explorer-link"
                  href={row.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Solscan
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
