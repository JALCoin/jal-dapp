// src/pages/Engine.tsx
import { useEffect, useMemo, useRef, useState } from "react";

type MarketRow = {
  ts: number;
  iso: string;
  coin: string;
  market?: string;
  bid: number;
  ask: number;
  last?: number | null;
  mid?: number | null;
  spreadAbs?: number | null;
  spreadPct?: number | null; // ratio
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

// ---------------- Public Ledger (backend-sourced) ----------------
type EngineMode = "OBSERVE" | "ARMED" | "EXECUTING" | "COOLDOWN";
type ExecutionMode = "SIM" | "LIVE";

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
  id: string;
  unitAud: number;
  state: SlotState;
  coin: string | null;
  entryMid: number | null;
  nowMid: number | null;
  netPct: number | null; // ratio
  level: 0 | 1 | 2 | 3 | 4;
  lockPct: number | null; // ratio
  createdAt: number;
  updatedAt: number;
  source?: ExecutionMode; // optional
};

type SlotEvent = {
  id: string;
  at: number;
  iso?: string;
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

type PublicMetaResponse = {
  ok: boolean;
  ts: number;

  engine?: {
    host?: string;
    execution?: "SIM" | "LIVE";
    liveTradingEnabled?: boolean;
  };

  gates?: {
    writeEnabled?: boolean;
    harvesterEnabled?: boolean;
    harvesterTickMs?: number;
    executorEnabled?: boolean;
    executorTickMs?: number;
  };

  baseline?: {
    startAt?: number | null;
    nextIssueAt?: number | null;
    windowMs?: number | null;
    remainingMs?: number | null;
    currentWindow?: number | null;
    lastIssuedWindow?: number | null;
  };

  // server.cjs passes through harvester.getStatus() + executor.getStatus()
  harvester?: any;
  executor?: any;

  market?: {
    snapshot?: any;
  };
};

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

// ---------------- Engine service base URL ----------------
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

type PublicEventsResponse = { ok: boolean; ts: number; rows: SlotEvent[] };
type PublicSlotsResponse = { ok: boolean; ts: number; rows: SlotRow[] };

function safeUpper(s: any) {
  return typeof s === "string" ? s.toUpperCase() : "";
}

// UI-only exclusions for preview telemetry (prevents stablecoins "winning" the preview)
const PREVIEW_EXCLUDE = new Set(["USDT", "USDC", "DAI", "TUSD", "USDP", "FDUSD", "EURT"]);

// ---------------- Harvest-only AUD growth (UI fallback from events) ----------------
function parseHarvestAudFromEvents(events: SlotEvent[]) {
  const out = { total: 0, last24h: 0, last7d: 0 };
  if (!events?.length) return out;

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const weekMs = 7 * dayMs;

  const grab = (msg: string) => {
    const m =
      msg.match(/HARVEST[_\s-]*AUD(?:[_\s-]*DELTA)?\s*[:=]?\s*([+-]?\d+(\.\d+)?)/i) ??
      msg.match(/AUD\s*HARVEST\s*[:=]?\s*([+-]?\d+(\.\d+)?)/i);
    if (!m) return null;
    const v = Number(m[1]);
    return Number.isFinite(v) ? v : null;
  };

  for (const e of events) {
    const v = grab(String(e.msg ?? ""));
    if (v == null) continue;

    out.total += v;

    const age = now - (e.at || 0);
    if (age <= dayMs) out.last24h += v;
    if (age <= weekMs) out.last7d += v;
  }

  out.total = Math.round(out.total * 100) / 100;
  out.last24h = Math.round(out.last24h * 100) / 100;
  out.last7d = Math.round(out.last7d * 100) / 100;

  return out;
}

function moneyAud(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "AUD", maximumFractionDigits: 2 });
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
  const [meta, setMeta] = useState<PublicMetaResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [feed, setFeed] = useState<Feed>("all");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("spread");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [aboutOpen, setAboutOpen] = useState(false);
  const timerRef = useRef<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Ledger (PUBLIC, backend)
  const [slotRows, setSlotRows] = useState<SlotRow[]>([]);
  const [events, setEvents] = useState<SlotEvent[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // Sections (tabs)
  type Section = "ledger" | "events" | "support" | "about";
  const [section, setSection] = useState<Section>("ledger");

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

  async function fetchMeta(signal?: AbortSignal) {
    // your server exposes /api/public/meta and aliases /api/status → same shape
    const r = await fetch(`${BASE}/api/public/meta`, { method: "GET", signal });
    if (!r.ok) return null;
    const j = (await r.json()) as Partial<PublicMetaResponse>;
    if (!j || (j as any).ok === false) return null;
    return j as PublicMetaResponse;
  }

  async function fetchPublicEvents(signal?: AbortSignal) {
    const r = await fetch(`${BASE}/api/public/events?limit=200`, { method: "GET", signal });
    if (!r.ok) throw new Error(`public/events HTTP ${r.status}`);
    const j = (await r.json()) as Partial<PublicEventsResponse>;
    const list = Array.isArray(j?.rows) ? (j!.rows as SlotEvent[]) : [];
    list.sort((a, b) => (b.at || 0) - (a.at || 0));
    return list;
  }

  async function fetchPublicSlots(signal?: AbortSignal) {
    const r = await fetch(`${BASE}/api/public/slots`, { method: "GET", signal });
    if (!r.ok) throw new Error(`public/slots HTTP ${r.status}`);
    const j = (await r.json()) as Partial<PublicSlotsResponse>;
    const list = Array.isArray(j?.rows) ? (j!.rows as SlotRow[]) : [];
    list.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    return list;
  }

  useEffect(() => {
    const ctrl = new AbortController();

    const tick = async () => {
      try {
        setErr(null);

        const [list, s, pubEv, pubSlots, m] = await Promise.all([
          fetchRows(ctrl.signal),
          fetchSnap(ctrl.signal),
          fetchPublicEvents(ctrl.signal),
          fetchPublicSlots(ctrl.signal),
          fetchMeta(ctrl.signal),
        ]);

        setRows(list);
        setSnap(s);
        setEvents(pubEv);
        setSlotRows(pubSlots);
        if (m) setMeta(m);
      } catch (e: any) {
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

  // ---------------- Baseline + issuance countdown (BACKEND truth) ----------------
  const baselineStartAt = meta?.baseline?.startAt ?? null;

  const FALLBACK_WINDOW_MS = 24 * 60 * 60 * 1000;
  const windowMs =
    meta?.baseline?.windowMs && meta.baseline.windowMs > 0 ? meta.baseline.windowMs : FALLBACK_WINDOW_MS;

  const baselineReadyAt = baselineStartAt ? baselineStartAt + windowMs : null;

  const computedNextDeployAt = useMemo(() => {
    if (!baselineStartAt) return null;
    const elapsed = nowMs - baselineStartAt;
    const k = Math.floor(elapsed / windowMs) + 1;
    return baselineStartAt + k * windowMs;
  }, [baselineStartAt, nowMs, windowMs]);

  // backend calls it nextIssueAt
  const nextDeployAt = meta?.baseline?.nextIssueAt ?? computedNextDeployAt;

  const baselineRemainingMs = baselineReadyAt ? Math.max(0, baselineReadyAt - nowMs) : null;
  const baselineIsReady = baselineRemainingMs !== null ? baselineRemainingMs <= 0 : false;

  const nextDeployRemainingMs = nextDeployAt ? Math.max(0, nextDeployAt - nowMs) : null;

  const baselineLabel = (() => {
    if (!baselineStartAt) return "BACKEND PENDING";
    if (baselineIsReady) return "READY";
    return msToCountdown(baselineRemainingMs ?? 0);
  })();

  const nextDeployLabel = (() => {
    if (!baselineStartAt) return "BACKEND PENDING";
    if (!nextDeployAt) return "BACKEND PENDING";
    return msToCountdown(nextDeployRemainingMs ?? 0);
  })();

  // ---------------- Market filtering/sorting ----------------
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

  // ---------------- Telemetry (UI preview only) ----------------
  const telemetry = useMemo(() => {
    if (!filtered.length) return null;

    const scored = filtered
      .filter((r) => !PREVIEW_EXCLUDE.has(safeUpper(r.coin)))
      .map((r) => {
        const mid = r.mid ?? (r.bid + r.ask) / 2;
        const spread = r.spreadPct ?? ((r.ask - r.bid) / (mid || 1));
        const spreadScore = 1 - clamp01(spread / 0.02);
        const priceScore = mid > 0 ? clamp01(1 / (1 + Math.abs(Math.log10(mid + 1e-9)))) : 0.5;
        const score = 0.8 * spreadScore + 0.2 * priceScore;
        return { r, mid, spread, score };
      });

    if (!scored.length) return null;

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

  // ---------------- Ledger derived ----------------
  const slotsActive = slotRows.filter((s) => s.state !== "EXITED").length;
  const slotsTotal = slotRows.length;

  const executionMode: ExecutionMode = (meta?.engine?.execution as ExecutionMode) ?? "SIM";

  // best-effort engine lifecycle (until backend publishes a dedicated mode)
  const engineMode: EngineMode = (() => {
    const execRunning = Boolean(meta?.executor?.running);
    const harvRunning = Boolean(meta?.harvester?.running);
    if (executionMode === "LIVE" && execRunning) return "EXECUTING";
    if (harvRunning || execRunning) return "ARMED";
    return "OBSERVE";
  })();

  const harvesterRunning = Boolean(meta?.harvester?.running);

  // backend harvester status has phase directly
  const pendingPhase = String(meta?.harvester?.phase ?? "—");
  const lastTickAt =
    (typeof meta?.harvester?.now === "number" ? meta.harvester.now : null) ??
    (typeof meta?.ts === "number" ? meta.ts : null);

  const lastTickAgo = lastTickAt ? ageLabel(nowMs - lastTickAt) : "—";

  const lastErr =
    (meta?.harvester?.lastErr ? String(meta.harvester.lastErr) : null) ??
    (meta?.market?.snapshot?.err ? String(meta.market.snapshot.err) : null);

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

  // ---------------- Harvest-only AUD growth ----------------
  const harvestFallback = useMemo(() => parseHarvestAudFromEvents(events), [events]);
  const harvestAudTotal = harvestFallback.total;
  const harvestAud24h = harvestFallback.last24h;
  const harvestAud7d = harvestFallback.last7d;

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

                <div className="engine-sub" style={{ opacity: 0.6 }}>
                  ENGINE: {engineHostLabel}
                </div>
              </div>

              <div className="engine-auth">
                <div className="engine-indicators" aria-label="Engine indicators">
                  <span className={`indicator ${snap?.ok ? "ok" : "warn"}`}>
                    STATUS <span>{snap?.ok ? "ONLINE" : "WAITING"}</span>
                  </span>

                  <span className="indicator">
                    UPDATED <span>{snap?.lastOkIso ? snap.lastOkIso.slice(11, 19) : "—"}</span>
                  </span>

                  <span className="indicator">
                    COINS <span>{coinsCount}</span>
                  </span>

                  <span
                    className={`indicator ${baselineIsReady ? "ok" : "warn"}`}
                    title="Baseline measurement window (24h) — backend truth"
                  >
                    BASELINE <span>{baselineLabel}</span>
                  </span>

                  <span
                    className={`indicator ${baselineIsReady ? "ok" : "warn"}`}
                    title="Countdown to next daily issuance"
                  >
                    NEXT DEPLOY <span>{nextDeployLabel}</span>
                  </span>

                  <span className="indicator" title="Slots currently visible to the system ledger">
                    SLOTS{" "}
                    <span>
                      {slotsActive}/{Math.max(slotsTotal, 0)}
                    </span>
                  </span>

                  <span
                    className={`indicator ${engineMode === "EXECUTING" ? "ok" : "warn"}`}
                    title="Engine lifecycle (best-effort until backend publishes a dedicated field)"
                  >
                    MODE <span>{engineMode}</span>
                  </span>

                  <span
                    className={`indicator ${executionMode === "LIVE" ? "warn" : "ok"}`}
                    title="Execution reality (SIM = no trades, LIVE = real trades)"
                  >
                    EXECUTION <span>{executionMode}</span>
                  </span>

                  <span className="indicator" title="Most recent ledger event (public)">
                    LAST <span>{lastAction ? lastAction.slice(-8) : "—"}</span>
                  </span>

                  <span className="indicator ok" title="Harvest-only AUD growth (excludes deposits/withdrawals)">
                    HARVEST <span>{moneyAud(harvestAudTotal)}</span>
                  </span>

                  <span className="indicator" title="Harvest-only AUD delta over last 24h">
                    24H <span>{moneyAud(harvestAud24h)}</span>
                  </span>

                  <span className="indicator" title="Harvest-only AUD delta over last 7 days">
                    7D <span>{moneyAud(harvestAud7d)}</span>
                  </span>
                </div>

                <div className="engine-auth-hint">
                  AUD growth shown here is <strong>harvest-only</strong>. External transfers are ignored.
                </div>
              </div>
            </div>

            {/* ---------------- Harvester status strip (read-only) ---------------- */}
            <div className="card machine-surface panel-frame engine-telemetry" aria-label="Harvester Status">
              <div className="engine-telemetry-head">
                <div className="engine-telemetry-title">Harvester Status</div>
                <div className="engine-telemetry-note">Backend wiring clarity (read-only)</div>
              </div>

              <div className="engine-telemetry-grid">
                <div className="engine-telemetry-item">
                  <div className="engine-telemetry-k">Harvester</div>
                  <div className="engine-telemetry-v">
                    {meta ? (harvesterRunning ? "RUNNING" : "STOPPED") : "BACKEND PENDING"}
                  </div>
                  <div className="engine-telemetry-sub">
                    {meta?.gates?.writeEnabled === false
                      ? "Writes disabled"
                      : meta?.gates?.writeEnabled === true
                      ? "Writes enabled"
                      : "Write gate unknown"}
                  </div>
                </div>

                <div className="engine-telemetry-item">
                  <div className="engine-telemetry-k">Package phase</div>
                  <div className="engine-telemetry-v">{meta ? pendingPhase : "BACKEND PENDING"}</div>
                  <div className="engine-telemetry-sub">
                    {meta?.baseline?.currentWindow != null ? `window ${meta.baseline.currentWindow}` : "—"}
                  </div>
                </div>

                <div className="engine-telemetry-item">
                  <div className="engine-telemetry-k">Last tick</div>
                  <div className="engine-telemetry-v">{meta ? lastTickAgo : "—"}</div>
                  <div className="engine-telemetry-sub">{lastTickAt ? fmtEventTime(lastTickAt) : "—"}</div>
                </div>

                <div className="engine-telemetry-item">
                  <div className="engine-telemetry-k">Last error</div>
                  <div className="engine-telemetry-v">{lastErr ? "ERROR" : "—"}</div>
                  <div className="engine-telemetry-sub">{lastErr ? lastErr.slice(0, 72) : "—"}</div>
                </div>
              </div>
            </div>

            {/* ---------------- Controls ---------------- */}
            <div className="engine-controls" aria-label="Controls">
              <button type="button" className={`button ghost ${feed === "all" ? "active" : ""}`} onClick={() => setFeed("all")}>
                Feed: All
              </button>

              <button type="button" className={`button ghost ${feed === "aud" ? "active" : ""}`} onClick={() => setFeed("aud")}>
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

            {/* ---------------- Market table ---------------- */}
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

            {/* ---------------- Market telemetry (UI preview) ---------------- */}
            <div className="card machine-surface panel-frame engine-telemetry" aria-label="Market Selection Telemetry">
              <div className="engine-telemetry-head">
                <div className="engine-telemetry-title">Market Selection Telemetry</div>
                <div className="engine-telemetry-note">
                  Preview (UI-only). Backend ranking will publish <em>RANK</em> events + slot deploys.
                </div>
              </div>

              {telemetry ? (
                <div className="engine-telemetry-grid">
                  <div className="engine-telemetry-item">
                    <div className="engine-telemetry-k">Preview coin</div>
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
                    <div className="engine-telemetry-k">Preview score</div>
                    <div className="engine-telemetry-v">{telemetry.score.toFixed(3)}</div>
                  </div>
                </div>
              ) : (
                <div className="engine-telemetry-pending">Telemetry pending (no rows).</div>
              )}
            </div>

            {/* ---------------- Section tabs ---------------- */}
            <div className="engine-section-tabs" aria-label="Engine sections">
              <button
                type="button"
                className={`engine-section-tab ${section === "ledger" ? "active" : ""}`}
                onClick={() => setSection("ledger")}
              >
                Ledger
              </button>
              <button
                type="button"
                className={`engine-section-tab ${section === "events" ? "active" : ""}`}
                onClick={() => setSection("events")}
              >
                Events
              </button>
              <button
                type="button"
                className={`engine-section-tab ${section === "support" ? "active" : ""}`}
                onClick={() => setSection("support")}
              >
                Support Slots
              </button>
              <button
                type="button"
                className={`engine-section-tab ${section === "about" ? "active" : ""}`}
                onClick={() => setSection("about")}
              >
                About
              </button>
            </div>

            {/* ---------------- Ledger (PUBLIC) ---------------- */}
            {section === "ledger" ? (
              <div className="card machine-surface panel-frame engine-ledger" aria-label="Slots Ledger">
                <div className="engine-ledger-top">
                  <div>
                    <div className="engine-ledger-title">Slots Ledger</div>
                    <div className="engine-ledger-note">
                      Read-only public ledger (backend sourced). Click any row to inspect slot history.
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
                    <div className="ledger-empty">No slots in public ledger yet.</div>
                  )}
                </div>

                <div className="engine-footer-note" style={{ marginTop: 12 }}>
                  AUD growth shown on this page is harvest-only (market droid). External deposits/withdrawals are ignored.
                </div>
              </div>
            ) : null}

            {/* ---------------- Events (PUBLIC) ---------------- */}
            {section === "events" ? (
              <div className="card machine-surface panel-frame engine-events" aria-label="Public Event Log">
                <div className="engine-events-top">
                  <div className="engine-events-title">Public Event Log</div>
                  <div className="engine-events-note">Append-only public log (no keys / no balances)</div>
                </div>

                <div className="event-log">
                  {events.length ? (
                    events.slice(0, 50).map((e) => (
                      <div className="event-row" key={e.id}>
                        <div className="event-time">{fmtEventTime(e.at)}</div>
                        <div className="event-msg">
                          <span className="event-kind">{e.kind}</span> <span className="event-text">{e.msg}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="event-empty">No events yet.</div>
                  )}
                </div>
              </div>
            ) : null}

            {/* ---------------- Support Slots ---------------- */}
            {section === "support" ? (
              <div className="engine-slots" aria-label="System Support Slots">
                <div className="engine-slots-head">
                  <div className="engine-slots-left">
                    <div className="engine-slots-title">System Support Slots</div>

                    <div className="engine-slots-copy">
                      These slots are <strong>public support donations</strong> for the JAL software system.
                      <br />
                      They are displayed for proof-of-concept transparency.
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

                      <button type="button" className="button engine-slot-btn" disabled aria-disabled="true" title="Funding rail not yet active">
                        Deploy (Soon)
                      </button>

                      <div className="engine-slot-foot">Funding rail not yet active — slot visible for inspection.</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* ---------------- About ---------------- */}
            {section === "about" ? (
              <div className="engine-about" aria-label="About $JAL~Engine + Jeroids">
                <button
                  type="button"
                  className="button ghost engine-about-btn"
                  onClick={() => setAboutOpen((v) => !v)}
                  aria-expanded={aboutOpen}
                  aria-controls="engine-about"
                >
                  <span>About $JAL~Engine + Market Droid</span>
                  <span className="engine-about-toggle">{aboutOpen ? "—" : "+"}</span>
                </button>

                {aboutOpen ? (
                  <div id="engine-about" className="card machine-surface panel-frame engine-about-panel">
                    <div className="engine-about-title">$JAL~Engine — what you’re looking at</div>

                    <p>
                      $JAL~Engine is a public machine exhibit: a live market window backed by a deterministic service layer. It
                      mirrors the tradable surface available on the operator’s exchange (CoinSpot) and presents it as a readable
                      execution environment.
                    </p>

                    <p>
                      <strong>AUD growth shown here is harvest-only.</strong> It is measured from market droid harvest deltas
                      (completed cycles). Deposits, withdrawals, and manual portfolio changes are excluded.
                    </p>

                    <div className="engine-about-h">Baseline + fixed daily cadence</div>
                    <p>
                      Baseline is anchored to backend <strong>baseline.startAt</strong>. After that, issuance uses a{" "}
                      <strong>fixed wall-clock schedule</strong>: the next deploy is always the next exact 24h boundary from the
                      baseline.
                    </p>

                    <div className="engine-about-h">Execution clarity</div>
                    <ul>
                      <li>
                        <strong>MODE</strong> is lifecycle (observe → armed → executing → cooldown).
                      </li>
                      <li>
                        <strong>EXECUTION</strong> is reality (<strong>SIM</strong> = no trades, <strong>LIVE</strong> = real trades).
                      </li>
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      </div>

      {/* ---------------- Slot Details Drawer ---------------- */}
      {selectedSlot ? (
        <div
          className="slot-drawer-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Slot Details"
          onClick={() => setSelectedSlotId(null)}
        >
          <div className="slot-drawer card machine-surface panel-frame" onClick={(e) => e.stopPropagation()}>
            <div className="slot-drawer-top">
              <div>
                <div className="slot-drawer-id">{selectedSlot.id}</div>
                <div className="slot-drawer-sub">
                  Unit ${selectedSlot.unitAud} • {selectedSlot.state} • {selectedSlot.coin ?? "—"}{" "}
                  {selectedSlot.source ? `• ${selectedSlot.source}` : ""}
                  <span style={{ marginLeft: 10, opacity: 0.75 }}>Esc to close</span>
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
                      <span className="event-kind">{e.kind}</span> <span className="event-text">{e.msg}</span>
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
              <div className="slot-rules-note">(Backend should attach exact friction/spread assumptions + entry band parameters here.)</div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}