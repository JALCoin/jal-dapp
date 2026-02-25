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

function clamp01(x: number) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function msToCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
}

// ---------------- System Support Slots (static cards) ----------------
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

// ---------------- Baseline + issuance countdown (client-only pre-backend) ----------------
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
    // ignore
  }
}

// ---------------- Ledger tracking (UI-first; backend later) ----------------
type EngineMode = "OBSERVE" | "ARMED" | "EXECUTING" | "COOLDOWN";

type SlotState =
  | "QUEUED"
  | "TRACKING"
  | "HOLDING"
  | "LVL1_LOCK"
  | "LVL2_LOCK"
  | "LVL3_LOCK"
  | "LVL4_TRAIL"
  | "EXITED";

type SlotRow = {
  id: string; // public slot id (JRD-00023)
  unitAud: number; // 50/75/150/200
  state: SlotState;
  coin: string | null; // e.g. XRP
  entryMid: number | null;
  nowMid: number | null;
  netPct: number | null; // ratio
  level: 0 | 1 | 2 | 3 | 4;
  lockPct: number | null; // ratio
  createdAt: number; // ms
  updatedAt: number; // ms
};

type SlotEvent = {
  id: string; // event id
  at: number; // ms
  kind:
    | "BASELINE_CAPTURE"
    | "RANK"
    | "SLOT_QUEUED"
    | "SLOT_DEPLOYED"
    | "LVL_REACHED"
    | "LOCK_UPDATED"
    | "EXIT_TRIGGER"
    | "NOTE";
  msg: string;
  slotId?: string;
  coin?: string;
};

const LEDGER_SLOTS_KEY = "jal_engine_slots_ledger_v1";
const LEDGER_EVENTS_KEY = "jal_engine_events_v1";

function readSlotsLedger(): SlotRow[] {
  try {
    const raw = localStorage.getItem(LEDGER_SLOTS_KEY);
    if (!raw) return [];
    const j = JSON.parse(raw);
    return Array.isArray(j) ? (j as SlotRow[]) : [];
  } catch {
    return [];
  }
}

function readEventsLedger(): SlotEvent[] {
  try {
    const raw = localStorage.getItem(LEDGER_EVENTS_KEY);
    if (!raw) return [];
    const j = JSON.parse(raw);
    return Array.isArray(j) ? (j as SlotEvent[]) : [];
  } catch {
    return [];
  }
}

function writeEventsLedger(ev: SlotEvent[]) {
  try {
    localStorage.setItem(LEDGER_EVENTS_KEY, JSON.stringify(ev));
  } catch {
    // ignore
  }
}

function ageLabel(msSince: number) {
  const s = Math.max(0, Math.floor(msSince / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function fmtEventTime(atMs: number) {
  const d = new Date(atMs);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

// ---------------- Engine service base URL (UPDATED) ----------------
//
// ✅ Fixes your production "Failed to fetch" caused by falling back to localhost.
// Priority:
//   1) VITE_ENGINE_SERVICE_URL (explicit)
//   2) PROD fallback -> Railway public URL
//   3) DEV fallback  -> localhost
//
// In Vercel Project Settings -> Environment Variables, set:
//   VITE_ENGINE_SERVICE_URL = https://jal-engine-service-production.up.railway.app
//
const PROD_DEFAULT = "https://jal-engine-service-production.up.railway.app";
const DEV_DEFAULT = "http://localhost:8787";

function normalizeBase(u: string) {
  return u.replace(/\/+$/, "");
}

function pickBase(): string {
  const raw = (import.meta as any).env?.VITE_ENGINE_SERVICE_URL;
  if (typeof raw === "string" && raw.trim().length) return normalizeBase(raw.trim());
  const isProd = Boolean((import.meta as any).env?.PROD);
  return normalizeBase(isProd ? PROD_DEFAULT : DEV_DEFAULT);
}

export default function Engine() {
  const BASE = useMemo(() => pickBase(), []);
  const engineHostLabel = useMemo(() => {
    try {
      const url = new URL(BASE);
      return url.host;
    } catch {
      return BASE;
    }
  }, [BASE]);

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

  // Ledger (UI-first)
  const [slotRows, setSlotRows] = useState<SlotRow[]>(() => readSlotsLedger());
  const [events, setEvents] = useState<SlotEvent[]>(() => readEventsLedger());
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

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
        if (s?.ok) {
          const existing = baselineStartAt ?? readBaselineStartAt();
          if (!existing) {
            const startAt = Number.isFinite(s.lastOkAt) && s.lastOkAt > 0 ? s.lastOkAt : Date.now();
            writeBaselineStartAt(startAt);
            setBaselineStartAt(startAt);

            // Seed baseline event once (public log)
            const ev = readEventsLedger();
            if (!ev.some((e) => e.kind === "BASELINE_CAPTURE")) {
              const seeded: SlotEvent = {
                id: `EVT-${startAt}`,
                at: startAt,
                kind: "BASELINE_CAPTURE",
                msg: "BASELINE_CAPTURE OK (24h measurement window started)",
              };
              const next = [seeded, ...ev].slice(0, 200);
              writeEventsLedger(next);
              setEvents(next);
            }
          }
        }

        // UI ledger source (until backend exists)
        setSlotRows(readSlotsLedger());
        setEvents(readEventsLedger());
      } catch (e: any) {
        // Helpful error for CORS / DNS / mixed content / wrong URL
        const msg = e?.message ?? String(e);
        setErr(`${msg}\nENGINE_BASE: ${BASE}`);
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
  }, [feed, BASE]);

  useEffect(() => {
    const t = window.setInterval(() => setNowMs(Date.now()), 500);
    return () => window.clearInterval(t);
  }, []);

  const baselineReadyAt = baselineStartAt ? baselineStartAt + BASELINE_WINDOW_MS : null;
  const baselineRemainingMs = baselineReadyAt ? Math.max(0, baselineReadyAt - nowMs) : null;
  const baselineIsReady = baselineRemainingMs !== null ? baselineRemainingMs <= 0 : false;

  const nextDeployAt = useMemo(() => {
    if (!baselineReadyAt) return null;
    if (!baselineIsReady) return baselineReadyAt;
    const elapsed = Math.max(0, nowMs - baselineReadyAt);
    const k = Math.floor(elapsed / BASELINE_WINDOW_MS) + 1;
    return baselineReadyAt + k * BASELINE_WINDOW_MS;
  }, [baselineReadyAt, baselineIsReady, nowMs]);

  const nextDeployRemainingMs = nextDeployAt ? Math.max(0, nextDeployAt - nowMs) : null;

  const baselineLabel = (() => {
    if (!baselineStartAt) return "PENDING";
    if (baselineIsReady) return "READY";
    return msToCountdown(baselineRemainingMs ?? 0);
  })();

  const nextDeployLabel = (() => {
    if (!baselineStartAt) return "PENDING";
    if (!nextDeployAt) return "PENDING";
    return msToCountdown(nextDeployRemainingMs ?? 0);
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

  const telemetry = useMemo(() => {
    if (!filtered.length) return null;

    const scored = filtered.map((r) => {
      const mid = r.mid ?? (r.bid + r.ask) / 2;
      const spread = r.spreadPct ?? ((r.ask - r.bid) / (mid || 1));
      const spreadScore = 1 - clamp01(spread / 0.02); // 0..2% band
      const priceScore = mid > 0 ? clamp01(1 / (1 + Math.abs(Math.log10(mid + 1e-9)))) : 0.5;
      const score = 0.8 * spreadScore + 0.2 * priceScore;
      return { r, mid, spread, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored[0];

    return {
      coin: top.r.coin,
      market: top.r.market ?? `${top.r.coin}/AUD`,
      mid: top.mid,
      spread: top.spread,
      score: top.score,
    };
  }, [filtered]);

  const slotsActive = slotRows.filter((s) => s.state !== "EXITED").length;
  const slotsTotal = slotRows.length;

  const engineMode: EngineMode = (() => {
    if (!snap?.ok) return "OBSERVE";
    if (!baselineStartAt) return "OBSERVE";
    if (!baselineIsReady) return "OBSERVE";
    return "ARMED";
  })();

  const lastAction = useMemo(() => {
    const e = events[0];
    if (!e) return null;
    return `${e.kind} ${e.slotId ? e.slotId : ""} ${e.coin ? e.coin : ""} ${fmtEventTime(e.at)}`
      .replace(/\s+/g, " ")
      .trim();
  }, [events]);

  const selectedSlot = useMemo(() => {
    if (!selectedSlotId) return null;
    return slotRows.find((s) => s.id === selectedSlotId) ?? null;
  }, [selectedSlotId, slotRows]);

  const selectedSlotEvents = useMemo(() => {
    if (!selectedSlotId) return [];
    return events.filter((e) => e.slotId === selectedSlotId).slice(0, 60);
  }, [events, selectedSlotId]);

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

                {/* UPDATED: show the actual engine host (not localhost) */}
                <div className="engine-sub">ENGINE: {engineHostLabel}</div>
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

                <span className={`indicator ${baselineIsReady ? "ok" : "warn"}`} title="Countdown to next daily issuance">
                  NEXT DEPLOY <span>{nextDeployLabel}</span>
                </span>

                <span className="indicator" title="Slots currently visible to the system ledger">
                  SLOTS{" "}
                  <span>
                    {slotsActive}/{Math.max(slotsTotal, 0)}
                  </span>
                </span>

                <span className={`indicator ${engineMode === "ARMED" ? "ok" : "warn"}`} title="Engine state (UI preview)">
                  MODE <span>{engineMode}</span>
                </span>

                <span className="indicator" title="Most recent ledger event (UI preview)">
                  LAST <span>{lastAction ? lastAction.slice(-8) : "—"}</span>
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
                className="engine-filter"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter (e.g. BTC, SOL, XRP)…"
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

            <div className="card machine-surface panel-frame engine-telemetry" aria-label="Market Selection Telemetry">
              <div className="engine-telemetry-head">
                <div className="engine-telemetry-title">Market Selection Telemetry</div>
                <div className="engine-telemetry-note">Preview signals (series-based metrics come with backend)</div>
              </div>

              {telemetry ? (
                <div className="engine-telemetry-grid">
                  <div className="engine-telemetry-item">
                    <div className="engine-telemetry-k">Selected coin</div>
                    <div className="engine-telemetry-v">{telemetry.coin}</div>
                    <div className="engine-telemetry-sub">{telemetry.market}</div>
                  </div>

                  <div className="engine-telemetry-item">
                    <div className="engine-telemetry-k">Mid</div>
                    <div className="engine-telemetry-v">{fmt(telemetry.mid)}</div>
                  </div>

                  <div className="engine-telemetry-item">
                    <div className="engine-telemetry-k">Spread</div>
                    <div className="engine-telemetry-v">{pctRatio(telemetry.spread)}</div>
                  </div>

                  <div className="engine-telemetry-item">
                    <div className="engine-telemetry-k">Rank score</div>
                    <div className="engine-telemetry-v">{telemetry.score.toFixed(3)}</div>
                  </div>
                </div>
              ) : (
                <div className="engine-telemetry-pending">Telemetry pending (no rows).</div>
              )}
            </div>

            {/* ---------------- System Support Slots ---------------- */}
            <div className="engine-slots" aria-label="System Support Slots">
              <div className="engine-slots-head">
                <div className="engine-slots-left">
                  <div className="engine-slots-title">System Support Slots</div>

                  <div className="engine-slots-copy">
                    These slots are <strong>public support donations</strong> for the JAL software system.
                    <br />
                    They are displayed as deployment slots for proof-of-concept transparency.
                    <br />
                    They <strong>do not</strong> create profits, returns, equity, ownership, or trading access.
                    <br />
                    <strong>Slots activate soon.</strong>
                  </div>

                  <div className="engine-slots-subcopy">
                    All slots execute under identical deterministic harvester rules. Only unit size varies.
                  </div>

                  <div className="engine-slots-timing">
                    Baseline building: <strong>{baselineLabel}</strong> (24h) • Next deploy:{" "}
                    <strong>{nextDeployLabel}</strong>
                  </div>
                </div>

                <div className="engine-slots-right">1 unit = 1 slot • Public slot ID + log reference (when enabled)</div>
              </div>

              <div className="jeroid-grid">
                {SLOT_CARDS.map((c) => (
                  <div
                    key={c.tier}
                    className="card machine-surface panel-frame engine-slot-card"
                    aria-label={`System support slot ${c.amountAud}`}
                  >
                    <div className="engine-slot-top">
                      <div className="engine-slot-amt">
                        ${c.amountAud} <span>AUD</span>
                      </div>
                      <div className="engine-slot-tag">{c.title.toUpperCase()}</div>
                    </div>

                    <ul className="engine-slot-bullets">
                      {c.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      className="button engine-slot-btn"
                      disabled
                      aria-disabled="true"
                      title="Funding rail not yet active"
                    >
                      Deploy (Soon)
                    </button>

                    <div className="engine-slot-foot">Funding rail not yet active — slot visible for inspection.</div>
                  </div>
                ))}
              </div>

              {/* ---------------- Slots Ledger ---------------- */}
              <div className="card machine-surface panel-frame engine-ledger" aria-label="Slots Ledger">
                <div className="engine-ledger-top">
                  <div>
                    <div className="engine-ledger-title">Slots Ledger</div>
                    <div className="engine-ledger-note">
                      Read-only machine ledger. Backend will populate these rows when the harvester is live.
                    </div>
                  </div>

                  <div className="engine-ledger-counts">
                    Active: <strong>{slotsActive}</strong> • Total: <strong>{slotsTotal}</strong>
                  </div>
                </div>

                <div className="ledger-table">
                  <div className="ledger-head">
                    <div>Slot ID</div>
                    <div>Unit</div>
                    <div>State</div>
                    <div>Coin</div>
                    <div className="num">Entry</div>
                    <div className="num">Now</div>
                    <div className="num">Net</div>
                    <div>Level</div>
                    <div className="num">Lock</div>
                    <div>Age</div>
                    <div className="num">Log</div>
                  </div>

                  {slotRows.length ? (
                    slotRows.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="ledger-row"
                        onClick={() => setSelectedSlotId(s.id)}
                        title="Open slot details"
                      >
                        <div className="ledger-slotid">{s.id}</div>
                        <div>${s.unitAud}</div>
                        <div>{s.state}</div>
                        <div>{s.coin ?? "—"}</div>
                        <div className="num">{s.entryMid != null ? fmt(s.entryMid) : "—"}</div>
                        <div className="num">{s.nowMid != null ? fmt(s.nowMid) : "—"}</div>
                        <div className="num">{s.netPct != null ? pctRatio(s.netPct) : "—"}</div>
                        <div>{s.level ? `LVL${s.level}` : "—"}</div>
                        <div className="num">{s.lockPct != null ? pctRatio(s.lockPct) : "—"}</div>
                        <div>{ageLabel(nowMs - s.createdAt)}</div>
                        <div className="num ledger-view">View</div>
                      </button>
                    ))
                  ) : (
                    <div className="ledger-empty">
                      No slots in ledger yet. (This will populate once the backend harvester is live.)
                    </div>
                  )}
                </div>
              </div>

              {/* ---------------- Public Event Log ---------------- */}
              <div className="card machine-surface panel-frame engine-events" aria-label="Public Event Log">
                <div className="engine-events-top">
                  <div className="engine-events-title">Public Event Log</div>
                  <div className="engine-events-note">Append-only preview (no keys / no balances)</div>
                </div>

                <div className="event-log">
                  {events.length ? (
                    events.slice(0, 20).map((e) => (
                      <div className="event-row" key={e.id}>
                        <div className="event-time">{fmtEventTime(e.at)}</div>
                        <div className="event-msg">
                          <span className="event-kind">{e.kind}</span>{" "}
                          <span className="event-text">{e.msg}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="event-empty">No events yet.</div>
                  )}
                </div>
              </div>

              {/* ---------------- About Dropdown ---------------- */}
              <div className="engine-about" aria-label="About $JAL~Engine + Jeroids">
                <button
                  type="button"
                  className="button ghost engine-about-btn"
                  onClick={() => setAboutOpen((v) => !v)}
                  aria-expanded={aboutOpen}
                  aria-controls="engine-about"
                >
                  <span>About $JAL~Engine + Jeroids</span>
                  <span className="engine-about-toggle">{aboutOpen ? "—" : "+"}</span>
                </button>

                {aboutOpen ? (
                  <div id="engine-about" className="card machine-surface panel-frame engine-about-panel">
                    <div className="engine-about-title">$JAL~Engine — what you’re looking at</div>

                    <p>
                      $JAL~Engine is a public machine exhibit: a live market window backed by a deterministic service layer.
                      It mirrors the tradable surface available on the operator’s exchange (CoinSpot) and presents it as a
                      readable execution environment.
                    </p>

                    <p>
                      The table above is sourced from CoinSpot’s public <em>latest</em> endpoint (bid/ask). Only symbols with
                      valid bid + ask are displayed. This keeps the input surface clean, tradable, and restart-safe.
                    </p>

                    <div className="engine-about-h">Baseline initialization</div>
                    <p>
                      The engine begins in observation mode to build baseline measurements before any deployments can occur.
                      Baseline window: 24 hours from first successful data capture.
                    </p>

                    <div className="engine-about-h">Tracking (public ledger)</div>
                    <p>
                      Deployments and harvesting are tracked as a read-only machine ledger: a status strip, a slots table, and
                      an append-only event log. This keeps the system inspectable without exposing keys, balances, or internal
                      controls.
                    </p>

                    <div className="engine-about-h">How the harvester layer will operate (future)</div>
                    <ul>
                      <li>Observe live tradable markets → build a deterministic snapshot.</li>
                      <li>Evaluate under fixed system rules → authorize or reject actions.</li>
                      <li>Execute from the operator account only → write public logs for transparency.</li>
                      <li>Persist state so the machine remains coherent across restarts.</li>
                    </ul>

                    <p className="engine-about-risk">
                      When slots activate, the system will still carry explicit risk: loss is possible, and there are no
                      guaranteed outcomes.
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="engine-footer-note">
                This is a public machine exhibit. The market window above reflects the tradable surface the engine evaluates.
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ---------------- Slot Details Drawer (UI-only) ---------------- */}
      {selectedSlot ? (
        <div className="slot-drawer-backdrop" role="dialog" aria-modal="true" aria-label="Slot Details">
          <div className="slot-drawer card machine-surface panel-frame">
            <div className="slot-drawer-top">
              <div>
                <div className="slot-drawer-id">{selectedSlot.id}</div>
                <div className="slot-drawer-sub">
                  Unit ${selectedSlot.unitAud} • {selectedSlot.state} • {selectedSlot.coin ?? "—"}
                </div>
              </div>

              <button type="button" className="button ghost" onClick={() => setSelectedSlotId(null)}>
                Close
              </button>
            </div>

            <div className="slot-drawer-grid">
              <div>
                <div className="slot-k">Entry</div>
                <div className="slot-v">{selectedSlot.entryMid != null ? fmt(selectedSlot.entryMid) : "—"}</div>
              </div>
              <div>
                <div className="slot-k">Now</div>
                <div className="slot-v">{selectedSlot.nowMid != null ? fmt(selectedSlot.nowMid) : "—"}</div>
              </div>
              <div>
                <div className="slot-k">Harvester Net</div>
                <div className="slot-v">{selectedSlot.netPct != null ? pctRatio(selectedSlot.netPct) : "—"}</div>
              </div>
              <div>
                <div className="slot-k">Level</div>
                <div className="slot-v">{selectedSlot.level ? `LVL${selectedSlot.level}` : "—"}</div>
              </div>
              <div>
                <div className="slot-k">Lock</div>
                <div className="slot-v">{selectedSlot.lockPct != null ? pctRatio(selectedSlot.lockPct) : "—"}</div>
              </div>
              <div>
                <div className="slot-k">Age</div>
                <div className="slot-v">{ageLabel(nowMs - selectedSlot.createdAt)}</div>
              </div>
            </div>

            <div className="slot-section">Timeline</div>

            <div className="event-log">
              {selectedSlotEvents.length ? (
                selectedSlotEvents.map((e) => (
                  <div className="event-row" key={e.id}>
                    <div className="event-time">{fmtEventTime(e.at)}</div>
                    <div className="event-msg">
                      <span className="event-kind">{e.kind}</span>{" "}
                      <span className="event-text">{e.msg}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="event-empty">No slot events yet.</div>
              )}
            </div>

            <div className="slot-section">Rules Snapshot (frozen per slot)</div>

            <div className="slot-rules">
              <div>Levels: LVL1 +3.75% • LVL2 +4.00% • LVL3 +4.50% • LVL4 +5.00%+</div>
              <div>Sell triggers on drop to the active lock threshold (not on first touch up).</div>
              <div>LVL4 may enable a 24h timer to capture late gains.</div>
              <div className="slot-rules-note">
                (Backend will attach the exact friction/spread assumptions + entry band parameters here.)
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}