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
      const priceScore =
        mid > 0 ? clamp01(1 / (1 + Math.abs(Math.log10(mid + 1e-9)))) : 0.5;
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
                  SLOTS <span>{slotsActive}/{Math.max(slotsTotal, 0)}</span>
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

            <div
              className="card machine-surface panel-frame"
              style={{
                marginTop: 14,
                padding: 14,
                borderRadius: 18,
                background: "rgba(0,0,0,.22)",
                border: "1px solid rgba(255,255,255,.12)",
              }}
              aria-label="Market Selection Telemetry"
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.9 }}>
                  Market Selection Telemetry
                </div>
                <div style={{ opacity: 0.75, fontSize: 13 }}>Preview signals (series-based metrics come with backend)</div>
              </div>

              {telemetry ? (
                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
                  <div style={{ opacity: 0.9 }}>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>Selected coin</div>
                    <div style={{ fontWeight: 900 }}>{telemetry.coin}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{telemetry.market}</div>
                  </div>

                  <div style={{ opacity: 0.9 }}>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>Mid</div>
                    <div style={{ fontWeight: 900 }}>{fmt(telemetry.mid)}</div>
                  </div>

                  <div style={{ opacity: 0.9 }}>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>Spread</div>
                    <div style={{ fontWeight: 900 }}>{pctRatio(telemetry.spread)}</div>
                  </div>

                  <div style={{ opacity: 0.9 }}>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>Rank score</div>
                    <div style={{ fontWeight: 900 }}>{telemetry.score.toFixed(3)}</div>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 10, opacity: 0.75 }}>Telemetry pending (no rows).</div>
              )}
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
                    Baseline building: <strong>{baselineLabel}</strong> (24h) • Next deploy: <strong>{nextDeployLabel}</strong>
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

              {/* ---------------- Slots Ledger ---------------- */}
              <div
                className="card machine-surface panel-frame"
                style={{
                  marginTop: 14,
                  padding: 14,
                  borderRadius: 18,
                  background: "rgba(0,0,0,.22)",
                  border: "1px solid rgba(255,255,255,.12)",
                }}
                aria-label="Slots Ledger"
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.9 }}>
                      Slots Ledger
                    </div>
                    <div style={{ marginTop: 6, opacity: 0.8, fontSize: 13 }}>
                      Read-only machine ledger. Backend will populate these rows when the harvester is live.
                    </div>
                  </div>

                  <div style={{ opacity: 0.8, fontSize: 13 }}>
                    Active: <strong>{slotsActive}</strong> • Total: <strong>{slotsTotal}</strong>
                  </div>
                </div>

                <div className="ledger-table" style={{ marginTop: 12 }}>
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
                        <div style={{ fontWeight: 900 }}>{s.id}</div>
                        <div>${s.unitAud}</div>
                        <div>{s.state}</div>
                        <div>{s.coin ?? "—"}</div>
                        <div className="num">{s.entryMid != null ? fmt(s.entryMid) : "—"}</div>
                        <div className="num">{s.nowMid != null ? fmt(s.nowMid) : "—"}</div>
                        <div className="num">{s.netPct != null ? pctRatio(s.netPct) : "—"}</div>
                        <div>{s.level ? `LVL${s.level}` : "—"}</div>
                        <div className="num">{s.lockPct != null ? pctRatio(s.lockPct) : "—"}</div>
                        <div>{ageLabel(nowMs - s.createdAt)}</div>
                        <div className="num" style={{ opacity: 0.9 }}>
                          View
                        </div>
                      </button>
                    ))
                  ) : (
                    <div style={{ padding: 12, opacity: 0.75 }}>
                      No slots in ledger yet. (This will populate once the backend harvester is live.)
                    </div>
                  )}
                </div>
              </div>

              {/* ---------------- Public Event Log ---------------- */}
              <div
                className="card machine-surface panel-frame"
                style={{
                  marginTop: 14,
                  padding: 14,
                  borderRadius: 18,
                  background: "rgba(0,0,0,.22)",
                  border: "1px solid rgba(255,255,255,.12)",
                }}
                aria-label="Public Event Log"
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.9 }}>
                    Public Event Log
                  </div>
                  <div style={{ opacity: 0.75, fontSize: 13 }}>Append-only preview (no keys / no balances)</div>
                </div>

                <div className="event-log" style={{ marginTop: 10 }}>
                  {events.length ? (
                    events.slice(0, 20).map((e) => (
                      <div className="event-row" key={e.id}>
                        <div className="event-time">{fmtEventTime(e.at)}</div>
                        <div className="event-msg">
                          <span style={{ opacity: 0.9, fontWeight: 800 }}>{e.kind}</span>{" "}
                          <span style={{ opacity: 0.9 }}>{e.msg}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: 10, opacity: 0.75 }}>No events yet.</div>
                  )}
                </div>
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
                      It mirrors the tradable surface available on the operator’s exchange (CoinSpot) and presents it as a
                      readable execution environment.
                    </p>

                    <p style={{ margin: "8px 0" }}>
                      The table above is sourced from CoinSpot’s public <em>latest</em> endpoint (bid/ask). Only symbols with
                      valid bid + ask are displayed. This keeps the input surface clean, tradable, and restart-safe.
                    </p>

                    <div style={{ fontWeight: 800, marginTop: 10 }}>Baseline initialization</div>
                    <p style={{ margin: "8px 0" }}>
                      The engine begins in observation mode to build baseline measurements before any deployments can occur.
                      Baseline window: 24 hours from first successful data capture.
                    </p>

                    <div style={{ fontWeight: 800, marginTop: 10 }}>Tracking (public ledger)</div>
                    <p style={{ margin: "8px 0" }}>
                      Deployments and harvesting are tracked as a read-only machine ledger: a status strip, a slots table, and
                      an append-only event log. This keeps the system inspectable without exposing keys, balances, or internal
                      controls.
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

      {/* ---------------- Slot Details Drawer (UI-only) ---------------- */}
      {selectedSlot ? (
        <div className="slot-drawer-backdrop" role="dialog" aria-modal="true" aria-label="Slot Details">
          <div className="slot-drawer card machine-surface panel-frame">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 16 }}>{selectedSlot.id}</div>
                <div style={{ opacity: 0.75, fontSize: 13 }}>
                  Unit ${selectedSlot.unitAud} • {selectedSlot.state} • {selectedSlot.coin ?? "—"}
                </div>
              </div>

              <button type="button" className="button ghost" onClick={() => setSelectedSlotId(null)}>
                Close
              </button>
            </div>

            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Entry</div>
                <div style={{ fontWeight: 900 }}>{selectedSlot.entryMid != null ? fmt(selectedSlot.entryMid) : "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Now</div>
                <div style={{ fontWeight: 900 }}>{selectedSlot.nowMid != null ? fmt(selectedSlot.nowMid) : "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Harvester Net</div>
                <div style={{ fontWeight: 900 }}>{selectedSlot.netPct != null ? pctRatio(selectedSlot.netPct) : "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Level</div>
                <div style={{ fontWeight: 900 }}>{selectedSlot.level ? `LVL${selectedSlot.level}` : "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Lock</div>
                <div style={{ fontWeight: 900 }}>{selectedSlot.lockPct != null ? pctRatio(selectedSlot.lockPct) : "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Age</div>
                <div style={{ fontWeight: 900 }}>{ageLabel(nowMs - selectedSlot.createdAt)}</div>
              </div>
            </div>

            <div style={{ marginTop: 14, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.9 }}>
              Timeline
            </div>

            <div className="event-log" style={{ marginTop: 10 }}>
              {selectedSlotEvents.length ? (
                selectedSlotEvents.map((e) => (
                  <div className="event-row" key={e.id}>
                    <div className="event-time">{fmtEventTime(e.at)}</div>
                    <div className="event-msg">
                      <span style={{ opacity: 0.9, fontWeight: 800 }}>{e.kind}</span>{" "}
                      <span style={{ opacity: 0.9 }}>{e.msg}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: 10, opacity: 0.75 }}>No slot events yet.</div>
              )}
            </div>

            <div style={{ marginTop: 14, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.9 }}>
              Rules Snapshot (frozen per slot)
            </div>

            <div style={{ marginTop: 10, opacity: 0.85, lineHeight: 1.55, fontSize: 13 }}>
              <div>Levels: LVL1 +3.75% • LVL2 +4.00% • LVL3 +4.50% • LVL4 +5.00%+</div>
              <div>Sell triggers on drop to the active lock threshold (not on first touch up).</div>
              <div>LVL4 may enable a 24h timer to capture late gains.</div>
              <div style={{ marginTop: 8, opacity: 0.75 }}>
                (Backend will attach the exact friction/spread assumptions + entry band parameters here.)
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
        @media (max-width: 740px){
          .jeroid-grid{ grid-template-columns: 1fr !important; }
        }

        .ledger-table{
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 14px;
          overflow: hidden;
          background: rgba(0,0,0,.18);
        }
        .ledger-head{
          display:grid;
          grid-template-columns: 1.1fr .6fr 1fr .6fr .8fr .8fr .7fr .7fr .7fr .7fr .5fr;
          gap: 10px;
          padding: 10px 12px;
          font-size: 12px;
          letter-spacing: .08em;
          text-transform: uppercase;
          opacity: .8;
          border-bottom: 1px solid rgba(255,255,255,.10);
        }
        .ledger-row{
          width: 100%;
          text-align: left;
          display:grid;
          grid-template-columns: 1.1fr .6fr 1fr .6fr .8fr .8fr .7fr .7fr .7fr .7fr .5fr;
          gap: 10px;
          padding: 10px 12px;
          border: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
          border-bottom: 1px solid rgba(255,255,255,.06);
        }
        .ledger-row:hover{ background: rgba(255,255,255,.04); }
        .ledger-row .num, .ledger-head .num{ text-align: right; }

        @media (max-width: 900px){
          .ledger-head, .ledger-row{
            grid-template-columns: 1.2fr .7fr 1fr .7fr .9fr .9fr .8fr;
          }
          .ledger-head > :nth-child(9),
          .ledger-head > :nth-child(10),
          .ledger-head > :nth-child(11),
          .ledger-row > :nth-child(9),
          .ledger-row > :nth-child(10),
          .ledger-row > :nth-child(11){ display:none; }
        }

        .event-log{
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 14px;
          overflow: hidden;
          background: rgba(0,0,0,.18);
        }
        .event-row{
          display:flex;
          gap: 12px;
          padding: 10px 12px;
          border-bottom: 1px solid rgba(255,255,255,.06);
          align-items: baseline;
        }
        .event-time{
          width: 70px;
          opacity: .75;
          font-variant-numeric: tabular-nums;
        }
        .event-msg{ flex: 1; }

        .slot-drawer-backdrop{
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.55);
          backdrop-filter: blur(6px);
          display: flex;
          justify-content: flex-end;
          z-index: 9999;
        }
        .slot-drawer{
          width: min(520px, 92vw);
          height: 100%;
          padding: 14px;
          border-radius: 0;
          overflow: auto;
        }
      `}</style>
    </main>
  );
}