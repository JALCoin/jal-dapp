import { useEffect, useState } from "react";
import { JAL_COIN, shortAddress } from "../lib/jalCoin";

type JalCoinActionsProps = {
  className?: string;
  compact?: boolean;
};

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
        Open Raydium
      </a>
      <button
        type="button"
        className="button ghost jal-coin-action"
        onClick={copyLiquidityWallet}
      >
        {copied ? "Wallet Copied" : "Copy Support Wallet"}
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
        <h2 className="home-modules-title">Check the links. Try the path. Follow the build.</h2>
        <p className="home-modules-lead">
          Start with the official links, compare what you see, and only open outside tools when
          the path makes sense to you.
        </p>

        <JalCoinActions className="jal-coin-panel-actions" />

        <div className="jal-coin-liquidity-guide" aria-label="How to support JAL liquidity">
          <div className="jal-coin-guide-title">Support is optional</div>
          <ol>
            {JAL_COIN.supportBoundaryCopy.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <p>{JAL_COIN.supportBoundaryCopy.lead}</p>
        </div>

        <div className="jal-coin-risk-note" role="note">
          Crypto is optional and can lose value. This is not financial advice, a token sale,
          equity, or a promise.
        </div>
      </div>

      <div className="jal-coin-verification" aria-label="Verified JAL Coin addresses">
        <div className="jal-coin-verification-head">
          <div>
            <div className="jal-coin-verification-kicker">Check First</div>
            <div className="jal-coin-verification-title">Official links</div>
          </div>
          <div className="jal-coin-status-pill">Freeze Status: {JAL_COIN.freezeAuthorityStatus}</div>
        </div>

        <div className="jal-coin-address-list">
          {JAL_COIN.verificationItems.map((row) => (
            <div className={`jal-coin-address-row tone-${row.tone}`} key={row.id}>
              <div className="jal-coin-address-main">
                <div className="jal-coin-address-label">{row.label}</div>
                <div className="jal-coin-address-tech">{row.technicalLabel}</div>
                <div className="jal-coin-address-value">
                  {row.copyable ? shortAddress(row.value) : row.value}
                </div>
                <p className="jal-coin-address-note">{row.note}</p>
              </div>
              <div className="jal-coin-address-actions">
                {row.copyable ? (
                  <button
                    type="button"
                    className="jal-coin-copy-button"
                    onClick={() => copyAddress(row.id, row.value)}
                  >
                    {copiedId === row.id ? "Copied" : "Copy"}
                  </button>
                ) : null}
                <a
                  className="jal-coin-explorer-link"
                  href={row.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {row.hrefLabel}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
