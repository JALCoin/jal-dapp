// src/pages/Engine.tsx
import { useEffect, useMemo, useState } from "react";

type MarketRow = {
  coin: string; // "BTC"
  market: string; // "BTC/AUD"
  bid: number;
  ask: number;
  change24hPct?: number; // optional
  updatedAt?: number; // epoch ms
};

function fmtTime(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function fmtNum(n: number, dp = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

function fmtPct(n?: number) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  const s = n >= 0 ? `+${n.toFixed(2)}` : n.toFixed(2);
  return `${s}%`;
}

function calcSpreadPct(bid: number, ask: number) {
  if (!(bid > 0) || !(ask > 0)) return undefined;
  const mid = (bid + ask) / 2;
  if (!(mid > 0)) return undefined;
  return ((ask - bid) / mid) * 100;
}

function dpForPrice(n: number) {
  if (!Number.isFinite(n) || n <= 0) return 2;
  if (n < 0.01) return 8;
  if (n < 1) return 6;
  return 2;
}

type SortMode = "VOL" | "SPREAD" | "ALPHA";

export default function Engine() {
  const networkLabel = "MAINNET";

  /* ---------------- Terminal header (time) ---------------- */
  const [now, setNow] = useState(() => fmtTime(new Date()));
  useEffect(() => {
    const id = window.setInterval(() => setNow(fmtTime(new Date())), 1000);
    return () => window.clearInterval(id);
  }, []);

  /* ---------------- Market (server-backed snapshot) ---------------- */
  const [market, setMarket] = useState<MarketRow[]>(() => [
    // safe boot placeholder (overwritten by /api/market)
    { coin: "SOL", market: "SOL/AUD", bid: 122.13, ask: 122.81, updatedAt: Date.now() },
    { coin: "BTC", market: "BTC/AUD", bid: 88000, ask: 88250, updatedAt: Date.now() },
    { coin: "ETH", market: "ETH/AUD", bid: 4700, ask: 4720, updatedAt: Date.now() },
    { coin: "XRP", market: "XRP/AUD", bid: 2.076, ask: 2.083, updatedAt: Date.now() },
    { coin: "BONK", market: "BONK/AUD", bid: 0.000034, ask: 0.000035, updatedAt: Date.now() },
  ]);

  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [lastMarketOkAt, setLastMarketOkAt] = useState<number | null>(null);

  // UI controls
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortMode>("VOL");
  const [limit, setLimit] = useState(40);

  useEffect(() => {
    let alive = true;

    async function poll() {
      setMarketLoading(true);
      setMarketError(null);

      try {
        const res = await fetch("/api/market", { method: "GET" });
        if (!res.ok) throw new Error(`market fetch failed: ${res.status}`);

        const data = (await res.json()) as MarketRow[];
        if (!alive) return;

        const rows = Array.isArray(data) ? data : [];
        if (rows.length > 0) {
          setMarket(rows);
          setLastMarketOkAt(Date.now());
        } else {
          setMarketError("market returned empty");
        }
      } catch (e: any) {
        if (!alive) return;
        setMarketError(e?.message ?? "market fetch error");
      } finally {
        if (!alive) return;
        setMarketLoading(false);
      }
    }

    poll();
    const id = window.setInterval(poll, 8000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  const marketLiveLabel = marketError ? "MARKET: ERROR" : marketLoading ? "MARKET: UPDATING" : "MARKET: LIVE";

  const filteredSorted = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let rows = [...market];

    if (needle) {
      rows = rows.filter((r) => {
        const a = (r.coin ?? "").toLowerCase();
        const b = (r.market ?? "").toLowerCase();
        return a.includes(needle) || b.includes(needle);
      });
    }

    rows.sort((a, b) => {
      if (sort === "ALPHA") return (a.coin || "").localeCompare(b.coin || "");
      if (sort === "SPREAD") {
        const sa = calcSpreadPct(a.bid, a.ask) ?? -1;
        const sb = calcSpreadPct(b.bid, b.ask) ?? -1;
        return sb - sa; // biggest spread first
      }
      // VOL default: abs 24h change
      const va = Math.abs(a.change24hPct ?? 0);
      const vb = Math.abs(b.change24hPct ?? 0);
      return vb - va;
    });

    return rows.slice(0, Math.max(8, Math.min(200, limit)));
  }, [market, q, sort, limit]);

  return (
    <main className="home-shell" aria-label="$JAL~Engine">
      <div className="home-wrap">
        {/* ===== Top status strip ===== */}
        <section className="terminal-bar panel-frame machine-surface" aria-label="Engine status">
          <div className="terminal-left">
            <span className="terminal-pill ok">ONLINE</span>
            <span className="terminal-sep">•</span>
            <span className="terminal-pill">{networkLabel}</span>
            <span className="terminal-sep">•</span>
            <span className="terminal-dim">TIME</span>
            <span className="terminal-time">{now}</span>
          </div>

          <div className="terminal-right">
            <span className={`terminal-auth ${marketError ? "is-none" : "is-ro"}`}>
              {marketLiveLabel}
              {lastMarketOkAt ? ` • ${fmtTime(new Date(lastMarketOkAt))}` : ""}
            </span>
          </div>
        </section>

        {/* ===== Engine window ===== */}
        <section className="card engine-window engine-window--hero machine-surface panel-frame" aria-label="Market console">
          {/* low-opacity looping logo behind */}
          <div className="engine-bg" aria-hidden="true">
            <img className="engine-bg-logo" src="/JALSOL1.gif" alt="" />
          </div>

          <div className="engine-foreground">
            <div className="engine-head">
              <div className="engine-head-left" aria-hidden="true" />
              <div className="engine-head-center">
                <h1 className="engine-title">$JAL~Engine</h1>
                <div className="engine-sub">Real-time tradable market console (CEX-backed)</div>
              </div>

              <div className="engine-auth">
                <div className="engine-auth-col">
                  <button type="button" className="button gold" disabled aria-disabled="true" title="Coming soon">
                    Deploy Jeroids (soon)
                  </button>
                  <div className="engine-auth-hint">Viewer mode. Execution unlocks when deployment is ready.</div>
                </div>
              </div>
            </div>

            {/* ===== Controls ===== */}
            <div className="engine-controls" aria-label="Market controls">
              <label className="chip" style={{ gap: 10 }}>
                <span style={{ opacity: 0.75 }}>SEARCH</span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="BTC, SOL/AUD…"
                  aria-label="Search market"
                  style={{
                    width: 220,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "inherit",
                  }}
                />
              </label>

              <button type="button" className={`button ${sort === "VOL" ? "neon" : ""}`} onClick={() => setSort("VOL")}>
                Sort: 24H Move
              </button>

              <button
                type="button"
                className={`button ${sort === "SPREAD" ? "neon" : ""}`}
                onClick={() => setSort("SPREAD")}
              >
                Sort: Spread
              </button>

              <button
                type="button"
                className={`button ${sort === "ALPHA" ? "neon" : ""}`}
                onClick={() => setSort("ALPHA")}
              >
                Sort: A→Z
              </button>

              <button type="button" className="button ghost" onClick={() => setLimit((v) => (v === 40 ? 80 : 40))}>
                Rows: {limit}
              </button>
            </div>

            {/* ===== Market console ===== */}
            <div className="market-console" aria-label="Tradable market">
              <div className="market-head">
                <div>COIN</div>
                <div className="market-price">BID</div>
                <div className="market-price">ASK</div>
                <div className="market-price">SPREAD</div>
                <div className="market-price">24H</div>
              </div>

              {filteredSorted.map((r) => {
                const spread = calcSpreadPct(r.bid, r.ask);
                const isPos = (r.change24hPct ?? 0) >= 0;

                return (
                  <div key={r.market} className="market-row">
                    <div className="market-coin">
                      <strong>{r.coin}</strong> <span className="market-market">{r.market}</span>
                    </div>

                    <div className="market-price">{r.bid > 0 ? fmtNum(r.bid, dpForPrice(r.bid)) : "—"}</div>
                    <div className="market-price">{r.ask > 0 ? fmtNum(r.ask, dpForPrice(r.ask)) : "—"}</div>
                    <div className="market-price">{typeof spread === "number" ? `${spread.toFixed(2)}%` : "—"}</div>

                    <div className={`market-price ${isPos ? "market-pos" : "market-neg"}`}>{fmtPct(r.change24hPct)}</div>
                  </div>
                );
              })}
            </div>

            <div className="market-foot">
              {marketLoading ? "Market: updating…" : "Market: live snapshot"}
              {marketError ? ` • ${marketError}` : ""}
              {!marketError && filteredSorted.length === 0 ? " • no matches" : ""}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}