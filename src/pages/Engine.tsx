// src/pages/Engine.tsx
import { useEffect, useMemo, useRef, useState } from "react";

type MarketRow = {
  ts: number;
  iso: string;
  coin: string; // "BTC" or "BTC_USDT"
  market?: string; // "BTC/AUD" or "BTC/USDT"
  bid: number;
  ask: number;
  last?: number | null;
  mid?: number | null;
  spreadAbs?: number | null;
  spreadPct?: number | null; // ratio (e.g. 0.0021)
};

type Snapshot = {
  ok: boolean;
  lastOkAt: number;
  lastOkIso: string | null;
  err: string | null;
  counts: { all: number; aud: number; watch: number };
  watch: string[];
  pollMs?: number;
  url?: string;
};

const BASE =
  (import.meta as any).env?.VITE_ENGINE_SERVICE_URL?.replace(/\/+$/, "") ||
  "http://localhost:8787";

type SortKey = "spread" | "coin" | "mid";
type SortDir = "asc" | "desc";
type Feed = "all" | "aud" | "watch";

function fmt(n: number) {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 10 });
}

function pctRatio(r: number | null | undefined) {
  if (r == null || !Number.isFinite(r)) return "—";
  return `${(r * 100).toFixed(3)}%`;
}

function feedLabel(feed: Feed) {
  if (feed === "aud") return "AUD";
  if (feed === "watch") return "WATCH";
  return "ALL";
}

/** Slots are identical harvesters; only unit size differs. */
type SlotTier = "JEROID_50" | "JEROID_75" | "JEROID_150" | "JEROID_200";

type SlotCard = {
  tier: SlotTier;
  amountAud: number;
  title: string;
  bullets: string[];
};

const SLOT_BULLETS = [
  "1 unit = 1 public slot ID (when enabled)",
  "Executes under the same deterministic harvester rules",
  "Identical system logic across all slots",
];

const SLOT_CARDS: SlotCard[] = [
  { tier: "JEROID_50", amountAud: 50, title: "System Slot", bullets: SLOT_BULLETS },
  { tier: "JEROID_75", amountAud: 75, title: "System Slot", bullets: SLOT_BULLETS },
  { tier: "JEROID_150", amountAud: 150, title: "System Slot", bullets: SLOT_BULLETS },
  { tier: "JEROID_200", amountAud: 200, title: "System Slot", bullets: SLOT_BULLETS },
];

// ---------------- Baseline countdown (client-only, pre-backend) ----------------
// We latch the baseline start time on first successful market snapshot and store in localStorage.
// When you move to Railway + backend state, you can relocate this to the service.
const BASELINE_STORAGE_KEY = "jal_engine_baseline_start_at_ms";
const BASELINE_WINDOW_MS = 24 * 60 * 60 * 1000;

function readBaselineStartAt(): number | null {
  try {
    const raw = localStorage.getItem(BASELINE_STORAGE_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

function writeBaselineStartAt(ms: number) {
  try {
    localStorage.setItem(BASELINE_STORAGE_KEY, String(ms));
  } catch {
    // ignore (private mode / blocked storage)
  }
}

function msToCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
}

export default function Engine() {
  const [rows, setRows] = useState<MarketRow[]>([]);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [feed, setFeed] = useState<Feed>("all");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("spread");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [aboutOpen, setAboutOpen] = useState(false);

  const timerRef = useRef<number | null>(null);

  // Baseline latch + clock (client-only)
  const [baselineStartAt, setBaselineStartAt] = useState<number | null>(() => readBaselineStartAt());
  const [nowMs, setNowMs] = useState(() => Date.now());

  async function fetchRows(signal?: AbortSignal) {
    const r = await fetch(`${BASE}/api/market/${feed}`, { method: "GET", signal });
    if (!r.ok) throw new Error(`market/${feed} HTTP ${r.status}`);
    const j = await r.json();
    return Array.isArray(j?.rows) ? (j.rows as MarketRow[]) : [];
  }

  async function fetchSnap(signal?: AbortSignal) {
    const r = await fetch(`${BASE}/api/market/snapshot`, { method: "GET", signal });
    if (!r.ok) throw new Error(`market/snapshot HTTP ${r.status}`);
    return (await r.json()) as Snapshot;
  }

  useEffect(() => {
    const ctrl = new AbortController();

    const tick = async () => {
      try {
        setErr(null);
        const [list, s] = await Promise.all([fetchRows(ctrl.signal), fetchSnap(ctrl.signal)]);
        setRows(list);
        setSnap(s);

        // Latch baseline start time on first successful snapshot.
        // We use s.lastOkAt if present, otherwise Date.now().
        if (s?.ok) {
          const existing = baselineStartAt ?? readBaselineStartAt();
          if (!existing) {
            const startAt = Number.isFinite(s.lastOkAt) && s.lastOkAt > 0 ? s.lastOkAt : Date.now();
            writeBaselineStartAt(startAt);
            setBaselineStartAt(startAt);
          }
        }
      } catch (e: any) {
        setErr(e?.message ?? String(e));
      }
    };

    tick();
    timerRef.current = window.setInterval(tick, 2500);

    return () => {
      ctrl.abort();
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feed]);

  // Live clock for countdown UI
  useEffect(() => {
    const t = window.setInterval(() => setNowMs(Date.now()), 500);
    return () => window.clearInterval(t);
  }, []);

  const baselineReadyAt = baselineStartAt ? baselineStartAt + BASELINE_WINDOW_MS : null;
  const baselineRemainingMs = baselineReadyAt ? Math.max(0, baselineReadyAt - nowMs) : null;
  const baselineIsReady = baselineRemainingMs !== null ? baselineRemainingMs <= 0 : false;

  const baselineLabel = (() => {
    if (!baselineStartAt) return "PENDING";
    if (baselineIsReady) return "READY";
    return msToCountdown(baselineRemainingMs ?? 0);
  })();

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    let list = rows;

    if (q) {
      list = list.filter((r) => {
        const m = (r.market ?? `${r.coin}/AUD`).toUpperCase();
        return r.coin.toUpperCase().includes(q) || m.includes(q);
      });
    }

    const dir = sortDir === "asc" ? 1 : -1;

    const getNum = (r: MarketRow) => {
      const mid = r.mid ?? (r.bid + r.ask) / 2;
      const spread = r.spreadPct ?? ((r.ask - r.bid) / (mid || 1));
      if (sortKey === "mid") return mid;
      if (sortKey === "spread") return spread;
      return 0;
    };

    return [...list].sort((a, b) => {
      if (sortKey === "coin") return a.coin.localeCompare(b.coin) * dir;
      return (getNum(a) - getNum(b)) * dir;
    });
  }, [rows, query, sortKey, sortDir]);

  const coinsCount =
    feed === "all"
      ? snap?.counts?.all ?? rows.length
      : feed === "aud"
        ? snap?.counts?.aud ?? rows.length
        : snap?.counts?.watch ?? rows.length;

  return (
    <main className="home-shell" aria-label="$JAL~Engine">
      <div className="home-wrap">
        <section className="card engine-window engine-window--hero machine-surface panel-frame" aria-label="Engine">
          <div className="engine-bg" aria-hidden="true">
            <img className="engine-bg-logo" src="/JALSOL1.gif" alt="" />
          </div>

          <div className="engine-foreground">
            <div className="engine-head">
              <div />
              <div className="engine-head-center">
                <h1 className="engine-title">$JAL~Engine</h1>
                <div className="engine-sub">
                  Real-time tradable market console (CoinSpot public latest) — FEED: {feedLabel(feed)}
                </div>
              </div>

              <div className="engine-auth">
                <span className={`indicator ${snap?.ok ? "ok" : "warn"}`}>
                  STATUS <span>{snap?.ok ? "ONLINE" : "WAITING"}</span>
                </span>

                <span className="indicator">
                  COINS <span>{coinsCount}</span>
                </span>

                <span className="indicator">
                  UPDATED <span>{snap?.lastOkIso ? snap.lastOkIso.slice(11, 19) : "—"}</span>
                </span>

                <span className={`indicator ${baselineIsReady ? "ok" : "warn"}`} title="Baseline measurement window (24h)">
                  BASELINE <span>{baselineLabel}</span>
                </span>
              </div>
            </div>

            <div className="engine-controls" aria-label="Controls">
              <button
                type="button"
                className={`button ghost ${feed === "all" ? "active" : ""}`}
                onClick={() => setFeed("all")}
              >
                Feed: All
              </button>

              <button
                type="button"
                className={`button ghost ${feed === "aud" ? "active" : ""}`}
                onClick={() => setFeed("aud")}
              >
                Feed: AUD
              </button>

              <button
                type="button"
                className={`button ghost ${feed === "watch" ? "active" : ""}`}
                onClick={() => setFeed("watch")}
              >
                Feed: Watch
              </button>

              <button
                type="button"
                className="button ghost"
                onClick={() => {
                  setSortKey("spread");
                  setSortDir("desc");
                }}
              >
                Sort: Spread
              </button>

              <button
                type="button"
                className="button ghost"
                onClick={() => {
                  setSortKey("coin");
                  setSortDir("asc");
                }}
              >
                Sort: A→Z
              </button>

              <button
                type="button"
                className="button ghost"
                onClick={() => {
                  setSortKey("mid");
                  setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                }}
              >
                Sort: Price
              </button>

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter (e.g. BTC, SOL, XRP)…"
                style={{
                  flex: "1",
                  minWidth: 220,
                  padding: "12px 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,.14)",
                  background: "rgba(0,0,0,.35)",
                  color: "var(--text)",
                  outline: "none",
                }}
                aria-label="Filter coins"
              />
            </div>

            {err ? (
              <div className="engine-log" role="status" aria-label="Errors">
                <pre>{err}</pre>
              </div>
            ) : null}

            <div className="market-console" aria-label="Market table">
              <div className="market-head">
                <div>Coin</div>
                <div className="market-price">Bid</div>
                <div className="market-price">Ask</div>
                <div className="market-price">Mid</div>
                <div className="market-price">Spread</div>
              </div>

              {filtered.map((r) => {
                const mid = r.mid ?? (r.bid + r.ask) / 2;
                const spread = r.spreadPct ?? ((r.ask - r.bid) / (mid || 1));
                return (
                  <div className="market-row" key={r.market ?? r.coin}>
                    <div className="market-coin">
                      <strong>{r.coin}</strong>
                      <span className="market-market">{r.market ?? `${r.coin}/AUD`}</span>
                    </div>

                    <div className="market-price">{fmt(r.bid)}</div>
                    <div className="market-price">{fmt(r.ask)}</div>
                    <div className="market-price">{fmt(mid)}</div>
                    <div className="market-price">{pctRatio(spread)}</div>
                  </div>
                );
              })}
            </div>

            {/* ---------------- System Support Slots ---------------- */}
            <div
              style={{
                marginTop: 18,
                paddingTop: 14,
                borderTop: "1px solid rgba(255,255,255,.10)",
              }}
              aria-label="System Support Slots"
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.9 }}>
                    System Support Slots
                  </div>

                  <div style={{ marginTop: 8, opacity: 0.9, lineHeight: 1.5 }}>
                    These slots are <strong>public support donations</strong> for the JAL software system.
                    <br />
                    They are displayed as deployment slots for proof-of-concept transparency.
                    <br />
                    They <strong>do not</strong> create profits, returns, equity, ownership, or trading access.
                    <br />
                    <strong>Slots activate soon.</strong>
                  </div>

                  <div style={{ marginTop: 8, opacity: 0.85 }}>
                    All slots execute under identical deterministic harvester rules. Only unit size varies.
                  </div>

                  <div style={{ marginTop: 10, opacity: 0.8, fontSize: 13 }}>
                    Baseline building: <strong>{baselineLabel}</strong> (24h measurement window)
                  </div>
                </div>

                <div style={{ alignSelf: "flex-start", opacity: 0.8, fontSize: 13 }}>
                  1 unit = 1 slot • Public slot ID + log reference (when enabled)
                </div>
              </div>

              <div
                style={{
                  marginTop: 14,
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 14,
                }}
                className="jeroid-grid"
              >
                {SLOT_CARDS.map((c) => (
                  <div
                    key={c.tier}
                    className="card machine-surface panel-frame"
                    style={{
                      padding: 16,
                      borderRadius: 18,
                      background: "rgba(0,0,0,.28)",
                      border: "1px solid rgba(255,255,255,.12)",
                    }}
                    aria-label={`System support slot ${c.amountAud}`}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ fontSize: 18, fontWeight: 900 }}>
                        ${c.amountAud} <span style={{ fontSize: 12, opacity: 0.8 }}>AUD</span>
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.75, textTransform: "uppercase", letterSpacing: ".12em" }}>
                        {c.title.toUpperCase()}
                      </div>
                    </div>

                    <ul style={{ marginTop: 10, opacity: 0.9, paddingLeft: 18, lineHeight: 1.55 }}>
                      {c.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      className="button"
                      disabled
                      aria-disabled="true"
                      style={{
                        width: "100%",
                        marginTop: 12,
                        opacity: 0.65,
                        cursor: "not-allowed",
                      }}
                      title="Funding rail not yet active"
                    >
                      Deploy (Soon)
                    </button>

                    <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                      Funding rail not yet active — slot visible for inspection.
                    </div>
                  </div>
                ))}
              </div>

              {/* ---------------- About Dropdown ---------------- */}
              <div style={{ marginTop: 16 }} aria-label="About $JAL~Engine + Jeroids">
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => setAboutOpen((v) => !v)}
                  aria-expanded={aboutOpen}
                  aria-controls="engine-about"
                  style={{ width: "100%", justifyContent: "space-between" as any }}
                >
                  <span>About $JAL~Engine + Jeroids</span>
                  <span style={{ opacity: 0.8 }}>{aboutOpen ? "—" : "+"}</span>
                </button>

                {aboutOpen ? (
                  <div
                    id="engine-about"
                    className="card machine-surface panel-frame"
                    style={{
                      marginTop: 10,
                      padding: 16,
                      borderRadius: 18,
                      background: "rgba(0,0,0,.22)",
                      border: "1px solid rgba(255,255,255,.12)",
                      lineHeight: 1.6,
                      opacity: 0.95,
                    }}
                  >
                    <div style={{ fontWeight: 900, marginBottom: 8 }}>$JAL~Engine — what you’re looking at</div>

                    <p style={{ margin: "8px 0" }}>
                      $JAL~Engine is a public machine exhibit: a live market window backed by a deterministic service layer.
                      It mirrors the tradable surface available on the operator’s centralized exchange (CoinSpot) and presents
                      it as a readable execution environment.
                    </p>

                    <p style={{ margin: "8px 0" }}>
                      The table above is sourced from CoinSpot’s public <em>latest</em> endpoint (bid/ask). Only symbols with
                      valid bid + ask are displayed. This keeps the input surface clean, tradable, and restart-safe.
                    </p>

                    <div style={{ fontWeight: 800, marginTop: 10 }}>Baseline initialization</div>
                    <p style={{ margin: "8px 0" }}>
                      The engine begins in observation mode to build baseline measurements (rolling peak, drawdown, spread,
                      momentum) before any deployments can occur. The baseline window is 24 hours from first successful data
                      capture.
                    </p>

                    <div style={{ fontWeight: 800, marginTop: 10 }}>Jeroids — what a “slot” means</div>
                    <p style={{ margin: "8px 0" }}>
                      A System Support Slot is a fixed support unit that (when enabled) creates a public slot ID and a matching
                      log reference. Slot sizes vary ($50 / $75 / $150 / $200 AUD), but the harvester logic is identical — only
                      the unit size changes.
                    </p>

                    <p style={{ margin: "8px 0" }}>
                      These slots are <strong>public support donations</strong> for proof-of-concept visibility. They are not
                      an investment product and they do not create profit rights, ownership, equity, ownership, or trading
                      access.
                    </p>

                    <div style={{ fontWeight: 800, marginTop: 10 }}>How the harvester layer will operate (future)</div>
                    <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                      <li>Observe live tradable markets → build a deterministic snapshot.</li>
                      <li>Evaluate under fixed system rules → authorize or reject actions.</li>
                      <li>Execute from the operator account only → write public logs for transparency.</li>
                      <li>Persist state so the machine remains coherent across restarts.</li>
                    </ul>

                    <p style={{ margin: "10px 0 0", opacity: 0.9 }}>
                      When slots activate, the system will still carry explicit risk: loss is possible, and there are no
                      guaranteed outcomes.
                    </p>
                  </div>
                ) : null}
              </div>

              <div style={{ marginTop: 14, opacity: 0.75, fontSize: 13 }}>
                This is a public machine exhibit. The market window above reflects the tradable surface the engine evaluates.
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* mobile grid collapse helper */}
      <style>{`
        @media (max-width: 740px){
          .jeroid-grid{ grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}