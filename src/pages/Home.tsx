// src/pages/Home.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type AuthMode = "full" | "ro";

type MarketRow = {
  coin: string;          // "BTC"
  market: string;        // "BTC/AUD"
  bid: number;
  ask: number;
  change24hPct?: number; // optional
  updatedAt?: number;    // epoch ms
};

function safeTrim(v: string) {
  return (v ?? "").trim();
}

function maskKey(s: string) {
  const v = safeTrim(s);
  if (v.length <= 6) return v ? "******" : "";
  return `${v.slice(0, 3)}…${v.slice(-3)}`;
}

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

  /* ---------------- Auth UI (remembered) ---------------- */
  const [authConnected, setAuthConnected] = useState<null | { mode: AuthMode; masked: string }>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("jal_engine_auth");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const mode: AuthMode = parsed?.mode === "full" ? "full" : "ro";
      const key = safeTrim(parsed?.key ?? "");
      const secret = safeTrim(parsed?.secret ?? "");
      if (!key || !secret) return;
      setAuthConnected({ mode, masked: maskKey(key) });
    } catch {
      // ignore
    }
  }, []);

  /* ---------------- Modal auth state ---------------- */
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("ro");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [authRemember, setAuthRemember] = useState(false);

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const closeAuth = () => {
    setAuthOpen(false);
    setApiKey("");
    setApiSecret("");
    setAuthRemember(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && authOpen) closeAuth();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authOpen]);

  const handleAuthSubmit = () => {
    const k = safeTrim(apiKey);
    const s = safeTrim(apiSecret);
    if (!k || !s) return;

    const masked = maskKey(k);
    setAuthConnected({ mode: authMode, masked });

    if (authRemember) {
      try {
        localStorage.setItem("jal_engine_auth", JSON.stringify({ mode: authMode, key: k, secret: s }));
      } catch {
        // ignore
      }
    }

    closeAuth();
  };

  /* ---------------- Full access arm (2-step) ---------------- */
  const [armFull, setArmFull] = useState(false);
  useEffect(() => {
    if (!armFull) return;
    const id = window.setTimeout(() => setArmFull(false), 6000);
    return () => window.clearTimeout(id);
  }, [armFull]);

  const handleFullAccessClick = () => {
    if (!armFull) {
      setArmFull(true);
      return;
    }
    setArmFull(false);
    openAuth("full");
  };

  /* ---------------- Market Console (Public CEX snapshot) ---------------- */
  const [market, setMarket] = useState<MarketRow[]>(() => [
    { coin: "SOL", market: "SOL/AUD", bid: 122.13, ask: 122.81, change24hPct: 2.41, updatedAt: Date.now() },
    { coin: "BTC", market: "BTC/AUD", bid: 88000, ask: 88250, change24hPct: 1.1, updatedAt: Date.now() },
    { coin: "ETH", market: "ETH/AUD", bid: 4700, ask: 4720, change24hPct: -0.42, updatedAt: Date.now() },
    { coin: "XRP", market: "XRP/AUD", bid: 2.076, ask: 2.083, change24hPct: 0.18, updatedAt: Date.now() },
    { coin: "BONK", market: "BONK/AUD", bid: 0.000034, ask: 0.000035, change24hPct: 5.23, updatedAt: Date.now() },
  ]);

  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);

  // Frontend-only public market fetch (no keys). You can keep ENABLE_FETCH=false until endpoint is ready.
  useEffect(() => {
    let alive = true;

    async function poll() {
      const ENABLE_FETCH = false; // flip true when you wire your endpoint or direct CoinSpot public fetch
      if (!ENABLE_FETCH) return;

      setMarketLoading(true);
      setMarketError(null);

      try {
        const res = await fetch("/api/market", { method: "GET" });
        if (!res.ok) throw new Error(`market fetch failed: ${res.status}`);
        const data = (await res.json()) as MarketRow[];
        if (!alive) return;

        const stamped = (data ?? []).map((r) => ({ ...r, updatedAt: Date.now() }));
        setMarket(stamped);
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
    return copy.slice(0, 10);
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
            {authConnected ? (
              <span className={`terminal-auth ${authConnected.mode === "full" ? "is-full" : "is-ro"}`}>
                AUTH: {authConnected.mode === "full" ? "FULL" : "RO"} ({authConnected.masked})
              </span>
            ) : (
              <span className="terminal-auth is-none">AUTH: NONE</span>
            )}
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

          {/* No "Start Engine" button on Home (by design). */}
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
                  <button type="button" className="button" onClick={() => openAuth("ro")}>
                    Sign in (Read Only)
                  </button>
                  <div className="engine-auth-hint">View market + analytics. No orders.</div>
                </div>

                <div className="engine-auth-col">
                  <button
                    type="button"
                    className={`button gold ${armFull ? "armed" : ""}`}
                    onClick={handleFullAccessClick}
                  >
                    {armFull ? "CONFIRM Full Access" : "Sign in (Full Access)"}
                  </button>
                  <div className="engine-auth-hint">Execution capability. Use only on your machine.</div>
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
                      <strong>{r.coin}</strong>{" "}
                      <span className="market-market">{r.market}</span>
                    </div>

                    <div className="market-price">{r.bid > 0 ? fmtNum(r.bid, r.bid < 1 ? 6 : 2) : "—"}</div>
                    <div className="market-price">{r.ask > 0 ? fmtNum(r.ask, r.ask < 1 ? 6 : 2) : "—"}</div>
                    <div className="market-price">{typeof spread === "number" ? `${spread.toFixed(2)}%` : "—"}</div>

                    <div className={`market-price ${isPos ? "market-pos" : "market-neg"}`}>
                      {fmtPct(r.change24hPct)}
                    </div>
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
                    className="jeroid-card"
                    onClick={() => navigate("/app/engine")}
                    aria-label={`${b.title} (Coming soon)`}
                  >
                    <div className="jeroid-title">{b.title}</div>
                    <div className="jeroid-desc">{b.desc}</div>
                    <div className="jeroid-soon">COMING SOON</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== Packaged system ===== */}
        <section className="card bundle-card machine-surface panel-frame" aria-label="Packaged system">
          <h2 className="bundle-title">SYSTEM MODULE: Packaged Build</h2>
          <p className="bundle-lead">
            Includes engine + deployment + dashboard scaffolding for builders who want their own iteration.
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

      {/* ===== Auth modal ===== */}
      {authOpen && (
        <>
          <button className="engine-modal-backdrop" aria-label="Close sign-in" onClick={closeAuth} />
          <section className="engine-modal" role="dialog" aria-modal="true" aria-label="API Sign In">
            <div className="engine-modal-head">
              <div>
                <div className="engine-modal-title">CoinSpot API Sign In</div>
                <div className="engine-modal-sub">
                  {authMode === "full"
                    ? "FULL ACCESS — enables deployment actions"
                    : "READ ONLY — enables market read + analytics"}
                </div>
              </div>

              <button type="button" className="engine-modal-close" onClick={closeAuth} aria-label="Close">
                ✕
              </button>
            </div>

            <div className="engine-modal-body">
              <label className="engine-field">
                <span>API Key</span>
                <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} autoFocus placeholder="paste key" />
              </label>

              <label className="engine-field">
                <span>API Secret</span>
                <input value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} placeholder="paste secret" />
              </label>

              <label className="engine-remember">
                <input type="checkbox" checked={authRemember} onChange={(e) => setAuthRemember(e.target.checked)} />
                <span>Remember on this device (stores in localStorage)</span>
              </label>

              <div className="engine-modal-actions">
                <button type="button" className="button" onClick={closeAuth}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={authMode === "full" ? "button gold" : "button neon"}
                  onClick={handleAuthSubmit}
                >
                  Connect
                </button>
              </div>

              <p className="engine-modal-note">Tip: leave “Remember” off to keep keys session-only.</p>
            </div>
          </section>
        </>
      )}
    </main>
  );
}