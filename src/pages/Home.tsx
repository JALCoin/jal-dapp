// src/pages/Home.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type MarketRow = {
  coin: string;          // "BTC"
  market: string;        // "BTC/AUD"
  bid: number;
  ask: number;
  change24hPct?: number; // optional
  updatedAt?: number;    // epoch ms
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

export default function Home() {
  const navigate = useNavigate();

  const links = useMemo(
    () => [
      { label: "Raydium (JAL/SOL)", href: "https://raydium.io/" },
      {
        label: "Solscan ($JAL)",
        href: "https://solscan.io/token/9TCwNEKKPPgZBQ3CopjdhW9j8fZNt8SH7waZJTFRgx7v",
      },
    ],
    []
  );

  /* ---------------- Terminal header (time + status) ---------------- */
  const [lastUpdate, setLastUpdate] = useState(() => fmtTime(new Date()));
  useEffect(() => {
    const id = window.setInterval(() => setLastUpdate(fmtTime(new Date())), 1000);
    return () => window.clearInterval(id);
  }, []);

  const networkLabel = "MAINNET";

  /* ---------------- Market Console (account-backed snapshot) ----------------
     Home shows the tradable market snapshot as routed through your server.
     Visitors do NOT sign in here.
     Your backend can use YOUR CoinSpot credentials (your existing setup) if needed.
  ------------------------------------------------------------------------- */
  const [market, setMarket] = useState<MarketRow[]>(() => [
    { coin: "BONK", market: "BONK/AUD", bid: 0.000034, ask: 0.000035, change24hPct: 5.23, updatedAt: Date.now() },
    { coin: "SOL", market: "SOL/AUD", bid: 122.13, ask: 122.81, change24hPct: 2.41, updatedAt: Date.now() },
    { coin: "BTC", market: "BTC/AUD", bid: 88000, ask: 88250, change24hPct: 1.1, updatedAt: Date.now() },
    { coin: "ETH", market: "ETH/AUD", bid: 4700, ask: 4720, change24hPct: -0.42, updatedAt: Date.now() },
    { coin: "XRP", market: "XRP/AUD", bid: 2.076, ask: 2.083, change24hPct: 0.18, updatedAt: Date.now() },
  ]);

  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function poll() {
      const ENABLE_FETCH = true; // set false if /api/market isn't wired yet
      if (!ENABLE_FETCH) return;

      setMarketLoading(true);
      setMarketError(null);

      try {
        // Expect: MarketRow[] from your backend
        const res = await fetch("/api/market", { method: "GET" });
        if (!res.ok) throw new Error(`market fetch failed: ${res.status}`);
        const data = (await res.json()) as MarketRow[];

        if (!alive) return;

        const stamped = (Array.isArray(data) ? data : []).map((r) => ({
          ...r,
          updatedAt: Date.now(),
        }));

        // Prevent UI blanking on transient failures
        if (stamped.length > 0) setMarket(stamped);
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

  const rankedMarket = useMemo(() => {
    const copy = [...market];
    copy.sort((a, b) => Math.abs(b.change24hPct ?? 0) - Math.abs(a.change24hPct ?? 0));
    return copy.slice(0, 14);
  }, [market]);

  /* ---------------- Jeroid deployment teaser (COMING SOON) ---------------- */
  const jeroidButtons = useMemo(
    () => [
      { id: "jr-lvl1", title: "Jeroid LVL1", desc: "$50 deployment unit • baseline hold" },
      { id: "jr-lvl2", title: "Jeroid LVL2", desc: "$50 deployment unit • tighter rules" },
      { id: "jr-lvl3", title: "Jeroid LVL3", desc: "$50 deployment unit • aggressive trail" },
      { id: "jr-lvl4", title: "Jeroid LVL4", desc: "Exit discipline • trailing lock" },
    ],
    []
  );

  return (
    <main className="home-shell" aria-label="Home">
      <div className="home-wrap">
        {/* ===== Terminal Header Strip ===== */}
        <section className="terminal-bar panel-frame machine-surface" aria-label="Terminal status">
          <div className="terminal-left">
            <span className="terminal-pill ok">ONLINE</span>
            <span className="terminal-sep">•</span>
            <span className="terminal-pill">{networkLabel}</span>
            <span className="terminal-sep">•</span>
            <span className="terminal-dim">LAST UPDATE</span>
            <span className="terminal-time">{lastUpdate}</span>
          </div>

          <div className="terminal-right">
            {/* Visitors do NOT sign in. This is a public console preview. */}
            <span className="terminal-auth is-ro">MARKET: LIVE</span>
          </div>
        </section>

        {/* ===== Overview (media presence + identity) ===== */}
        <section className="card home-hero machine-surface panel-frame" aria-label="Overview">
          <div className="home-kicker">JAL SYSTEM • ONLINE</div>

          <h1 className="home-title">jalsol.com</h1>

          <p className="home-lead">
            <strong>Terminal for Solana utility.</strong> Generate tokens, create ATAs, mint accounts, and
            navigate the market through <strong>$JAL~Engine</strong>.
          </p>

          <p className="home-lead">
            Founded by <strong>Jeremy Aaron Lugg</strong> — Sol-Trader • Mechanical Metal Engineer • Digital Creator.
          </p>

          <div className="home-links" aria-label="Links">
            {links.map((l) => (
              <a key={l.label} className="chip" href={l.href} target="_blank" rel="noreferrer">
                {l.label}
              </a>
            ))}
          </div>

          <div className="home-primary" aria-label="Note">
            <div className="home-primary-note">
              <span>Nothing here is urgent.</span> The system is live and performs immediately — this page is a public
              console preview of what the engine is watching.
            </div>
          </div>
        </section>

        {/* ===== $JAL~Engine — Market Console Preview ===== */}
        <section className="card engine-window engine-window--hero machine-surface panel-frame" aria-label="$JAL~Engine">
          <div className="engine-bg" aria-hidden="true">
            <img className="engine-bg-logo" src="/JALSOL1.gif" alt="" />
          </div>

          <div className="engine-foreground">
            <div className="engine-head">
              <div className="engine-head-left" aria-hidden="true" />
              <div className="engine-head-center">
                <h2 className="engine-title">$JAL~Engine</h2>
                <div className="engine-sub">Live market interface • structured deployment</div>
              </div>

              <div className="engine-auth">
                <div className="engine-auth-col">
                  <button
                    type="button"
                    className="button"
                    onClick={() => navigate("/app/engine")}
                    aria-label="Open engine console"
                  >
                    Open Console
                  </button>
                  <div className="engine-auth-hint">Viewer mode. Deployment actions appear here later.</div>
                </div>
              </div>
            </div>

            {/* Market console */}
            <div className="market-console" aria-label="Tradable market">
              <div className="market-head">
                <div>COIN</div>
                <div className="market-price">BID</div>
                <div className="market-price">ASK</div>
                <div className="market-price">SPREAD</div>
                <div className="market-price">24H</div>
              </div>

              {rankedMarket.map((r) => {
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
            </div>

            {/* Jeroid deployment teaser */}
            <div className="jeroid-bay" aria-label="Jeroid deployment">
              <div className="jeroid-head">JEROID DEPLOYMENT</div>

              <div className="jeroid-grid">
                {jeroidButtons.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className="jeroid-card is-soon"
                    disabled
                    aria-disabled="true"
                    aria-label={`${b.title} (Coming soon)`}
                    title="Coming soon"
                  >
                    <div className="jeroid-title">{b.title}</div>
                    <div className="jeroid-desc">{b.desc}</div>
                    <div className="jeroid-soon">COMING SOON</div>
                  </button>
                ))}
              </div>

              <div className="jeroid-note">
                Thank you for supporting <strong>$JAL~Engine</strong>. Supporters will be able to deploy $50 Jeroids
                into the live harvester (executed via my connected CoinSpot environment). This section is intentionally
                locked until deployment is ready.
              </div>
            </div>
          </div>
        </section>

        {/* ===== Packaged system ===== */}
        <section className="card bundle-card machine-surface panel-frame" aria-label="Packaged system">
          <h2 className="bundle-title">SYSTEM MODULE: Packaged Build</h2>

          <p className="bundle-lead">
            Thank you for supporting <strong>$JAL~Engine</strong>. If you want to try the system for yourself, grab the
            packaged downloadable build below and run it in your own environment.
          </p>

          <div className="engine-controls" aria-label="Bundle actions">
            <button type="button" className="button gold" onClick={() => navigate("/app/inventory")}>
              View
            </button>
            <button type="button" className="button" onClick={() => navigate("/app/inventory/purchase")}>
              Purchase
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}