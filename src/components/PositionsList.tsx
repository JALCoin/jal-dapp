import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { verifyTokenMetadataAttached } from "@/utils/verifyTokenMetadataAttached";

type Props = {
  owner: PublicKey;
  connection: Connection;
  highlightMint?: string;
};

type Position = {
  mint: string;
  amountUi: number;
  amountStr: string;
  decimals: number;
  name?: string;
  symbol?: string;
  image?: string;
  metadataUri?: string;
};

const toHttp = (uri?: string) =>
  uri?.startsWith("ipfs://")
    ? `https://ipfs.io/ipfs/${uri.replace("ipfs://", "")}`
    : uri ?? "";

const DUST = 0.000001;

const PositionsList: FC<Props> = ({ owner, connection, highlightMint }) => {
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState<Position[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [hideDust, setHideDust] = useState(true);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return positions
      .filter((p) => (hideDust ? p.amountUi > DUST : true))
      .filter((p) =>
        q
          ? p.mint.toLowerCase().includes(q) ||
            (p.name || "").toLowerCase().includes(q) ||
            (p.symbol || "").toLowerCase().includes(q)
          : true
      );
  }, [positions, query, hideDust]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const parsed = await connection.getParsedTokenAccountsByOwner(
          owner,
          { programId: TOKEN_PROGRAM_ID },
          "confirmed"
        );

        const map = new Map<string, { ui: number; decimals: number }>();

        for (const { account } of parsed.value) {
          const info = account.data.parsed.info;
          const mint: string = info.mint;
          const ta = info.tokenAmount;
          const decimals = Number(ta.decimals ?? 0);
          const ui = Number(ta.uiAmount ?? 0);
          if (ui <= 0) continue;

          const existing = map.get(mint);
          if (existing) {
            existing.ui += ui;
          } else {
            map.set(mint, { ui, decimals });
          }
        }

        const mints = [...map.keys()];
        const enriched: Position[] = await Promise.all(
          mints.map(async (mint) => {
            let name: string | undefined;
            let symbol: string | undefined;
            let image: string | undefined;
            let metadataUri: string | undefined;

            try {
              const meta = await verifyTokenMetadataAttached(
                connection,
                new PublicKey(mint)
              );
              if (meta?.isAttached) {
                name = meta.name || name;
                symbol = meta.symbol || symbol;
                metadataUri = meta.uri || metadataUri;

                if (meta.uri) {
                  try {
                    const res = await fetch(toHttp(meta.uri), {
                      cache: "no-store",
                    });
                    const j = await res.json();
                    image = toHttp(j.image || j.logo || j.icon);
                    name = name || j.name;
                    symbol = symbol || j.symbol;
                  } catch {}
                }
              }
            } catch {}

            const { ui, decimals } = map.get(mint)!;
            const amountStr =
              ui >= 1
                ? ui.toLocaleString(undefined, { maximumFractionDigits: 6 })
                : ui.toPrecision(6);

            return {
              mint,
              amountUi: ui,
              amountStr,
              decimals,
              name,
              symbol,
              image,
              metadataUri,
            };
          })
        );

        enriched.sort((a, b) => {
          if (b.amountUi !== a.amountUi) return b.amountUi - a.amountUi;
          const an = a.symbol || a.name || a.mint;
          const bn = b.symbol || b.name || b.mint;
          return an.localeCompare(bn);
        });

        setPositions(enriched);
      } catch (e) {
        console.error("[PositionsList] load error:", e);
        setError("Couldn’t fetch token positions.");
        setPositions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [owner, connection]);

  return (
    <section style={{ width: "min(100% - 2rem, 1100px)" }}>
      <div className="card" style={{ marginBottom: 12 }}>
        <div
          className="shop-controls"
          style={{ justifyContent: "space-between", gap: 12 }}
        >
          <div className="chip-row">
            <span className="chip">
              Positions: <strong>{positions.length}</strong>
            </span>
            <label className={`chip ${hideDust ? "active" : ""}`}>
              <input
                type="checkbox"
                checked={hideDust}
                onChange={(e) => setHideDust(e.target.checked)}
                style={{ marginRight: 8 }}
              />
              Hide dust (&lt; {DUST})
            </label>
          </div>

          <input
            className="shop-search"
            placeholder="Search name / symbol / mint"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="muted">Loading positions…</p>
        ) : error ? (
          <p style={{ color: "#ff9c9c" }}>{error}</p>
        ) : filtered.length === 0 ? (
          <p className="muted">No positions to show.</p>
        ) : (
          <div className="product-grid" style={{ marginTop: 12 }}>
            {filtered.map((p) => {
              const isHighlight = p.mint === highlightMint;
              return (
                <div
                  key={p.mint}
                  className={`product-card ${isHighlight ? "gold" : ""}`}
                  title={p.mint}
                >
                  <div className={`product-media ${p.image ? "" : "noimg"}`}>
                    {p.image ? (
                      <img src={p.image} alt="" />
                    ) : (
                      <span className="badge soon">No Art</span>
                    )}
                    {isHighlight && (
                      <span
                        className="badge"
                        style={{ right: 10, left: "auto" }}
                      >
                        New
                      </span>
                    )}
                  </div>

                  <div className="product-body">
                    <h4 className="product-title">
                      {(p.symbol || p.name || "Unknown").toString()}
                    </h4>

                    <p className="product-blurb">
                      {p.name ? (
                        <>
                          {p.name} &middot;{" "}
                          <span className="mono-sm">
                            {p.mint.slice(0, 4)}…{p.mint.slice(-4)}
                          </span>
                        </>
                      ) : (
                        <span className="mono-sm">
                          {p.mint.slice(0, 6)}…{p.mint.slice(-6)}
                        </span>
                      )}
                    </p>

                    <div style={{ flex: 1 }} />

                    <div className="product-price">
                      <span className="price-jal">
                        {p.amountStr}
                        <span className="muted" style={{ marginLeft: 6 }}>
                          {p.symbol ? p.symbol.toUpperCase() : ""}
                        </span>
                      </span>
                      <a
                        className="jal-link"
                        href={`https://solscan.io/token/${p.mint}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Solscan ↗
                      </a>
                      {p.metadataUri && (
                        <a
                          className="jal-link"
                          href={toHttp(p.metadataUri)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Metadata ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default PositionsList;
