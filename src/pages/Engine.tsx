// src/pages/Engine.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* =========================
   Types
========================= */
type MarketRow = {
  coin: string;
  market?: string;
  bid: number;
  ask: number;
  mid?: number | null;
  spreadAbs?: number | null;
  spreadPct?: number | null; // percent number
};

type Snapshot = {
  ok: boolean;
  lastOkAt: number;
  lastOkIso: string | null;
  lastPollAt?: number | null;
  lastPollIso?: string | null;
  err: string | null;
  counts: { all: number; aud: number; watch: number };
  watch: string[];
  pollMs?: number;
  url?: string;
};

type Feed = "all" | "aud" | "watch";
type SortKey = "coin" | "spread" | "mid";
type SortDir = "asc" | "desc";
type ViewMode = "simple" | "advanced";
type Section = "ledger" | "events" | "about";

type SlotState =
  | "WAITING_ENTRY"
  | "DEPLOYING"
  | "HOLDING"
  | "LVL1_LOCK"
  | "LVL2_LOCK"
  | "LVL3_LOCK"
  | "LVL4_TRAIL"
  | "EXITING"
  | "QUEUED"
  | "EXITED";

type TrackingState =
  | "ARMED"
  | "TRACKING"
  | "DRAWDOWN_SEEN"
  | "REVERSAL_CONFIRMING"
  | "DEPLOYING"
  | "BUY_SUBMITTING"
  | "BUY_SUBMITTED"
  | "BUY_LOCK_SUBMITTED"
  | "HOLDING"
  | "SELL_SUBMITTED"
  | "EXIT_FAILED_PENDING"
  | "NO_MARKET"
  | "SPREAD_BLOCKED"
  | "REGISTRY_FAULT"
  | string;

type SlotRow = {
  id: string;
  slotType?: string;
  coin: string | null;
  market?: string;
  state: SlotState;
  trackingState?: TrackingState | null;
  unitAud: number;

  entryMid: number | null;
  entryBid?: number | null;
  entryAsk?: number | null;
  entrySpreadPct?: number | null;

  nowMid: number | null;
  nowBid?: number | null;
  nowAsk?: number | null;
  nowSpreadPct?: number | null;

  grossPct?: number | null;
  netPct?: number | null;

  peakBid?: number | null;
  drawdownPct?: number | null;

  level: 0 | 1 | 2 | 3 | 4;
  lockPct: number | null;

  cycles: number;
  lifetimeNetPct?: number | null;

  realizedAt?: number | null;
  entryAud?: number | null;
  exitAud?: number | null;
  profitAud?: number | null;
  profitPct?: number | null;
  exitReason?: string | null;

  exitMid?: number | null;
  reentryDropPct?: number | null;
  reentryTargetMid?: number | null;

  feeBps?: number | null;
  frictionModel?: string | null;
  executorVersion?: string | null;
  paperOnly?: boolean;

  buyLockCount?: number | null;
  buyLockActive?: boolean | null;
  buyLockLastAt?: number | null;
  buyLockLastUnitAud?: number | null;
  buyLockLastRate?: number | null;
  buyLockLastCoinQty?: number | null;

  combinedEntryAud?: number | null;
  combinedCoinQty?: number | null;
  combinedEntryRate?: number | null;

  liveExecutionMode?: string | null;
  liveLastError?: string | null;
  liveLastReconcileAt?: number | null;
  liveLastReconcileNote?: string | null;

  liveBuyLockOrderId?: string | null;
  liveBuyLockRequestedAud?: number | null;
  liveBuyLockRequestedCoinQty?: number | null;
  liveBuyLockSubmittedRate?: number | null;
  liveBuyLockOrderAt?: number | null;
  liveBuyLockFillStatus?: string | null;
  liveBuyLockActualAud?: number | null;
  liveBuyLockActualCoinQty?: number | null;
  liveBuyLockActualRate?: number | null;
  liveBuyLockFilledAt?: number | null;

  candidateCoin?: string | null;
  candidateTrackingSince?: number | null;
  candidateLastSeenAt?: number | null;
  candidateMidPrev?: number | null;
  candidateBidPrev?: number | null;
  candidateAskPrev?: number | null;
  candidateSpreadPrevPct?: number | null;
  candidatePeakMid?: number | null;
  candidateLowMid?: number | null;
  candidateDrawdownPct?: number | null;
  candidateBouncePct?: number | null;
  candidateEmaFast?: number | null;
  candidateEmaSlow?: number | null;
  candidateEmaGapPct?: number | null;
  candidateReversalTicks?: number | null;
  candidateScore?: number | null;
  candidateSelectorScore?: number | null;
  candidateReason?: string | null;

  entryDrawdownPct?: number | null;
  entryBouncePct?: number | null;
  entryEmaFast?: number | null;
  entryEmaSlow?: number | null;
  entryEmaGapPct?: number | null;
  entryConfirmTicks?: number | null;
  entryScore?: number | null;

  createdAt: number;
  updatedAt: number;
  firstArmedAt?: number | null;
  deployedAt?: number | null;
  deployingAt?: number | null;
  lastSeenAt?: number | null;
  lastExitAt?: number | null;
};

type SlotEventKind =
  | "BASELINE_CAPTURE"
  | "HARVESTER_START"
  | "HARVESTER_STOP"
  | "EXECUTOR_START"
  | "EXECUTOR_STOP"
  | "SLOT_ARMED"
  | "SLOT_REPAIRED"
  | "SLOTS_ARMED_INITIAL"
  | "REGISTRY_SWEEP"
  | "SLOT_DEPLOYED"
  | "LVL_REACHED"
  | "LOCK_UPDATED"
  | "EXIT_TRIGGER"
  | "SLOT_EXITED"
  | "ISSUE_SKIPPED"
  | "NOTE"
  | "ERROR"
  | string;

type SlotEvent = {
  id: string;
  at: number;
  iso?: string;
  kind: SlotEventKind;
  msg: string;
  slotId?: string;
  coin?: string;
};

type PublicMetaResponse = {
  ok: boolean;
  ts: number;
  service?: string;

  engine?: {
    host?: string;
    execution?: "SIM" | "LIVE";
    liveTradingEnabled?: boolean;
    liveExecutionAllowed?: boolean;
    architecture?: string;
  };

  gates?: {
    writeEnabled?: boolean;
    destructiveDebugAllowed?: boolean;
    harvesterEnabled?: boolean;
    harvesterTickMs?: number;
    executorEnabled?: boolean;
    executorTickMs?: number;
    managerEnabled?: boolean;
    managerTickMs?: number;
    topupEnabled?: boolean;
    topupTickMs?: number;
  };

  fixedSlots?: {
    expected?: number;
    allowlist?: string[];
    present?: number;
    missing?: string[];
    fixedCoinsPresent?: string[];
  };

  cadence?: {
    baselineAt?: number | null;
    firstArmedAt?: number | null;
    nextSweepAt?: number | null;
    windowMs?: number | null;
    remainingMs?: number | null;
    currentWindow?: number | null;
    lastRegistrySweepAt?: number | null;
    lastRegistrySweepWindow?: number | null;
  };

  counts?: {
    slots?: number;
    fixedSlots?: number;
    waiting?: number;
    deploying?: number;
    exiting?: number;
    holding?: number;
    locked?: number;
    lvl1?: number;
    lvl2?: number;
    lvl3?: number;
    lvl4?: number;
    inPlay?: number;
  };

  trackingStates?: Record<string, number>;
  harvester?: any;
  executor?: any;
  manager?: any;
  topup?: any;
  market?: { snapshot?: Snapshot | null };
};

type PublicEventsResponse = { ok: boolean; ts: number; rows: SlotEvent[] };
type PublicSlotsResponse = { ok: boolean; ts: number; rows: SlotRow[] };

/* =========================
   Constants
========================= */
const PROD_DEFAULT = "https://jal-engine-service-production.up.railway.app";
const DEV_DEFAULT = "http://localhost:8787";
const CAROUSEL_INTERVAL_MS = 4500;

/* =========================
   Helpers
========================= */
function normalizeBase(u: string) {
  return u.replace(/\/+$/, "");
}

function pickBase(): string {
  const raw = (import.meta as any).env?.VITE_ENGINE_SERVICE_URL;
  if (typeof raw === "string" && raw.trim().length) return normalizeBase(raw.trim());
  const isProd = Boolean((import.meta as any).env?.PROD);
  return normalizeBase(isProd ? PROD_DEFAULT : DEV_DEFAULT);
}

function fmt(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (Math.abs(n) >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 10 });
}

function pctNum(p: number | null | undefined) {
  if (p == null || !Number.isFinite(p)) return "—";
  return `${p.toFixed(3)}%`;
}

function moneyAud(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 2,
  });
}

function msToCountdown(ms: number | null | undefined) {
  if (ms == null || !Number.isFinite(ms)) return "—";
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
}

function ageLabel(msSince: number | null | undefined) {
  if (msSince == null || !Number.isFinite(msSince)) return "—";
  const s = Math.max(0, Math.floor(msSince / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtEventTime(atMs: number) {
  const d = new Date(atMs);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function trackingLabel(s: SlotRow) {
  return s.trackingState || "—";
}

function stateLabel(s: SlotRow) {
  return s.state;
}

function slotCoin(s: SlotRow) {
  return s.coin ?? "—";
}

function effectiveEntryLabel(s: SlotRow) {
  if (s.entryMid != null && Number.isFinite(s.entryMid)) return fmt(s.entryMid);
  if (s.state === "WAITING_ENTRY" && s.reentryTargetMid != null && Number.isFinite(s.reentryTargetMid)) {
    return fmt(s.reentryTargetMid);
  }
  return "—";
}

function effectiveNowLabel(s: SlotRow) {
  if (s.nowMid != null && Number.isFinite(s.nowMid)) return fmt(s.nowMid);
  if (s.candidateMidPrev != null && Number.isFinite(s.candidateMidPrev)) return fmt(s.candidateMidPrev);
  return "—";
}

function lockDisplay(s: SlotRow) {
  return pctNum(s.lockPct);
}

function reasonLabel(reason: string | null | undefined) {
  if (!reason) return "—";
  return String(reason).replace(/_/g, " ");
}

function subslotLabel(s: SlotRow) {
  const tracking = String(s.trackingState || "").toUpperCase();
  const state = String(s.state || "").toUpperCase();

  if (tracking === "BUY_LOCK_SUBMITTED") return "BUY-LOCK SUBSLOT";
  if (tracking === "SELL_SUBMITTED" || state === "EXITING") return "EXIT SUBSLOT";
  if (tracking === "BUY_SUBMITTING" || tracking === "BUY_SUBMITTED") return "ENTRY SUBSLOT";
  if (
    state === "HOLDING" ||
    state === "LVL1_LOCK" ||
    state === "LVL2_LOCK" ||
    state === "LVL3_LOCK" ||
    state === "LVL4_TRAIL"
  ) {
    return "HOLD SUBSLOT";
  }
  if (state === "DEPLOYING" || tracking === "DEPLOYING" || tracking === "REVERSAL_CONFIRMING") {
    return "DEPLOY SUBSLOT";
  }
  if (tracking === "TRACKING" || tracking === "DRAWDOWN_SEEN") return "TRACK SUBSLOT";
  if (tracking === "SPREAD_BLOCKED") return "BLOCKED SUBSLOT";
  if (tracking === "NO_MARKET") return "NO-MARKET SUBSLOT";
  return "IDLE SUBSLOT";
}

function subslotToneClass(s: SlotRow) {
  const tracking = String(s.trackingState || "").toUpperCase();
  const state = String(s.state || "").toUpperCase();

  if (tracking === "BUY_LOCK_SUBMITTED") return "is-buylock";
  if (tracking === "SELL_SUBMITTED" || state === "EXITING") return "is-exiting";
  if (tracking === "BUY_SUBMITTING" || tracking === "BUY_SUBMITTED") return "is-deploying";
  if (
    state === "HOLDING" ||
    state === "LVL1_LOCK" ||
    state === "LVL2_LOCK" ||
    state === "LVL3_LOCK" ||
    state === "LVL4_TRAIL"
  ) {
    return "is-holding";
  }
  if (tracking === "TRACKING" || tracking === "DRAWDOWN_SEEN" || tracking === "REVERSAL_CONFIRMING") {
    return "is-tracking";
  }
  if (tracking === "SPREAD_BLOCKED") return "is-blocked";
  if (tracking === "NO_MARKET") return "is-muted";
  return "is-neutral";
}

function parseHarvestAudFromEvents(events: SlotEvent[]) {
  const out = { total: 0, last24h: 0, last7d: 0 };
  if (!events?.length) return out;

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const weekMs = 7 * dayMs;

  const grab = (msg: string) => {
    const m =
      msg.match(/HARVEST[_\s-]*AUD(?:[_\s-]*DELTA)?\s*[:=]?\s*([+-]?\d+(\.\d+)?)/i) ??
      msg.match(/AUD\s*HARVEST\s*[:=]?\s*([+-]?\d+(\.\d+)?)/i) ??
      msg.match(/\(([+-]?\$?\d+(\.\d+)?)\,/i);
    if (!m) return null;
    const raw = String(m[1]).replace(/\$/g, "");
    const v = Number(raw);
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

function useIsDesktop(bpPx = 980) {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(`(min-width: ${bpPx}px)`).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(`(min-width: ${bpPx}px)`);
    const onChange = () => setIsDesktop(mq.matches);

    onChange();
    if (typeof mq.addEventListener === "function") mq.addEventListener("change", onChange);
    else (mq as any).addListener(onChange);

    return () => {
      if (typeof mq.removeEventListener === "function") mq.removeEventListener("change", onChange);
      else (mq as any).removeListener(onChange);
    };
  }, [bpPx]);

  return isDesktop;
}

function stateToneClass(slot: SlotRow) {
  const tracking = String(slot.trackingState || "").toUpperCase();
  const state = String(slot.state || "").toUpperCase();

  if (
    state === "HOLDING" ||
    state === "LVL1_LOCK" ||
    state === "LVL2_LOCK" ||
    state === "LVL3_LOCK" ||
    state === "LVL4_TRAIL"
  ) {
    return "is-holding";
  }

  if (
    state === "DEPLOYING" ||
    state === "EXITING" ||
    tracking === "DEPLOYING" ||
    tracking === "REVERSAL_CONFIRMING" ||
    tracking === "BUY_SUBMITTING" ||
    tracking === "BUY_SUBMITTED" ||
    tracking === "BUY_LOCK_SUBMITTED" ||
    tracking === "SELL_SUBMITTED"
  ) {
    return "is-deploying";
  }

  if (tracking === "TRACKING" || tracking === "ARMED" || tracking === "DRAWDOWN_SEEN") {
    return "is-tracking";
  }

  if (tracking === "SPREAD_BLOCKED") {
    return "is-blocked";
  }

  if (tracking === "NO_MARKET") {
    return "is-muted";
  }

  return "is-neutral";
}

/* =========================
   Component
========================= */
export default function Engine() {
  const BASE = useMemo(() => pickBase(), []);
  const isDesktop = useIsDesktop(980);

  const [rows, setRows] = useState<MarketRow[]>([]);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [meta, setMeta] = useState<PublicMetaResponse | null>(null);
  const [slotRows, setSlotRows] = useState<SlotRow[]>([]);
  const [events, setEvents] = useState<SlotEvent[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [feed, setFeed] = useState<Feed>("aud");
  const [sortKey, setSortKey] = useState<SortKey>("coin");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [query, setQuery] = useState("");

  const [view, setView] = useState<ViewMode>("simple");
  const [section, setSection] = useState<Section>("ledger");
  const [eventsOpen, setEventsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);

  const pollRef = useRef<number | null>(null);

  const fetchRows = useCallback(
    async (signal?: AbortSignal) => {
      const r = await fetch(`${BASE}/api/market/${feed}`, { method: "GET", signal });
      if (!r.ok) throw new Error(`market/${feed} HTTP ${r.status}`);
      const j = await r.json();
      return Array.isArray(j?.rows) ? (j.rows as MarketRow[]) : [];
    },
    [BASE, feed]
  );

  const fetchSnap = useCallback(
    async (signal?: AbortSignal) => {
      const r = await fetch(`${BASE}/api/market/snapshot`, { method: "GET", signal });
      if (!r.ok) throw new Error(`market/snapshot HTTP ${r.status}`);
      return (await r.json()) as Snapshot;
    },
    [BASE]
  );

  const fetchMeta = useCallback(
    async (signal?: AbortSignal) => {
      const r = await fetch(`${BASE}/api/public/meta`, { method: "GET", signal });
      if (!r.ok) throw new Error(`public/meta HTTP ${r.status}`);
      return (await r.json()) as PublicMetaResponse;
    },
    [BASE]
  );

  const fetchPublicSlots = useCallback(
    async (signal?: AbortSignal) => {
      const r = await fetch(`${BASE}/api/public/slots`, { method: "GET", signal });
      if (!r.ok) throw new Error(`public/slots HTTP ${r.status}`);
      const j = (await r.json()) as PublicSlotsResponse;
      const list = Array.isArray(j?.rows) ? j.rows : [];
      list.sort((a, b) => String(a.id).localeCompare(String(b.id)));
      return list;
    },
    [BASE]
  );

  const fetchPublicEvents = useCallback(
    async (signal?: AbortSignal) => {
      const r = await fetch(`${BASE}/api/public/events?limit=200`, { method: "GET", signal });
      if (!r.ok) throw new Error(`public/events HTTP ${r.status}`);
      const j = (await r.json()) as PublicEventsResponse;
      const list = Array.isArray(j?.rows) ? j.rows : [];
      list.sort((a, b) => (b.at || 0) - (a.at || 0));
      return list;
    },
    [BASE]
  );

  useEffect(() => {
    const ctrl = new AbortController();

    const tick = async () => {
      try {
        setErr(null);

        const [marketRows, snapshot, metaRes, slotsRes, eventsRes] = await Promise.all([
          fetchRows(ctrl.signal),
          fetchSnap(ctrl.signal),
          fetchMeta(ctrl.signal),
          fetchPublicSlots(ctrl.signal),
          fetchPublicEvents(ctrl.signal),
        ]);

        setRows(marketRows);
        setSnap(snapshot);
        setMeta(metaRes);
        setSlotRows(slotsRes);
        setEvents(eventsRes);
      } catch (e: any) {
        const msg = e?.message ?? String(e);
        setErr(`${msg}\nENGINE_BASE: ${BASE}`);
      }
    };

    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }

    tick();
    pollRef.current = window.setInterval(tick, 2500);

    return () => {
      ctrl.abort();
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [BASE, fetchMeta, fetchPublicEvents, fetchPublicSlots, fetchRows, fetchSnap]);

  useEffect(() => {
    const t = window.setInterval(() => setNowMs(Date.now()), 500);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedSlotId(null);
      if (e.key === "ArrowRight") {
        setCarouselIndex((i) => (slotRows.length ? (i + 1) % slotRows.length : 0));
      }
      if (e.key === "ArrowLeft") {
        setCarouselIndex((i) => (slotRows.length ? (i - 1 + slotRows.length) % slotRows.length : 0));
      }
    };

    window.addEventListener("keydown", onKey);

    if (selectedSlotId) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [selectedSlotId, slotRows.length]);

  const filteredMarketRows = useMemo(() => {
    const q = query.trim().toUpperCase();
    let list = rows.slice();

    if (q) {
      list = list.filter((r) => {
        const market = (r.market ?? `${r.coin}/AUD`).toUpperCase();
        return r.coin.toUpperCase().includes(q) || market.includes(q);
      });
    }

    const dir = sortDir === "asc" ? 1 : -1;

    return list.sort((a, b) => {
      const midA = a.mid ?? (a.bid + a.ask) / 2;
      const midB = b.mid ?? (b.bid + b.ask) / 2;
      const spreadA = a.spreadPct ?? (((a.ask - a.bid) / Math.max(midA, 1e-9)) * 100);
      const spreadB = b.spreadPct ?? (((b.ask - b.bid) / Math.max(midB, 1e-9)) * 100);

      if (sortKey === "coin") return a.coin.localeCompare(b.coin) * dir;
      if (sortKey === "mid") return (midA - midB) * dir;
      return (spreadA - spreadB) * dir;
    });
  }, [query, rows, sortDir, sortKey]);

  const filteredSlots = useMemo(() => {
    const q = query.trim().toUpperCase();
    let list = slotRows.slice();

    if (q) {
      list = list.filter((s) => {
        const coin = (s.coin ?? "").toUpperCase();
        const market = (s.market ?? "").toUpperCase();
        const id = (s.id ?? "").toUpperCase();
        const tracking = (s.trackingState ?? "").toUpperCase();
        return coin.includes(q) || market.includes(q) || id.includes(q) || tracking.includes(q);
      });
    }

    return list.sort((a, b) => {
      if (sortKey === "coin") return slotCoin(a).localeCompare(slotCoin(b)) * (sortDir === "asc" ? 1 : -1);
      if (sortKey === "mid") {
        const av = a.nowMid ?? a.entryMid ?? -Infinity;
        const bv = b.nowMid ?? b.entryMid ?? -Infinity;
        return (av - bv) * (sortDir === "asc" ? 1 : -1);
      }
      const av = a.nowSpreadPct ?? a.entrySpreadPct ?? Infinity;
      const bv = b.nowSpreadPct ?? b.entrySpreadPct ?? Infinity;
      return (av - bv) * (sortDir === "asc" ? 1 : -1);
    });
  }, [query, slotRows, sortDir, sortKey]);

  useEffect(() => {
    if (!filteredSlots.length) {
      setCarouselIndex(0);
      return;
    }
    if (carouselIndex > filteredSlots.length - 1) {
      setCarouselIndex(0);
    }
  }, [filteredSlots.length, carouselIndex]);

  useEffect(() => {
    if (!filteredSlots.length || carouselPaused) return;

    const t = window.setInterval(() => {
      setCarouselIndex((i) => (i + 1) % filteredSlots.length);
    }, CAROUSEL_INTERVAL_MS);

    return () => window.clearInterval(t);
  }, [filteredSlots.length, carouselPaused]);

  const selectedSlot = useMemo(
    () => slotRows.find((s) => s.id === selectedSlotId) ?? null,
    [slotRows, selectedSlotId]
  );

  const selectedSlotEvents = useMemo(() => {
    if (!selectedSlotId) return [];
    return events.filter((e) => e.slotId === selectedSlotId);
  }, [events, selectedSlotId]);

  const carouselSlot = useMemo(() => {
    if (!filteredSlots.length) return null;
    return filteredSlots[Math.max(0, Math.min(carouselIndex, filteredSlots.length - 1))] ?? null;
  }, [filteredSlots, carouselIndex]);

  const fixedAllowlist = meta?.fixedSlots?.allowlist ?? [];
  const fixedExpected = meta?.fixedSlots?.expected ?? fixedAllowlist.length;
  const fixedPresent = meta?.fixedSlots?.present ?? slotRows.length;
  const fixedMissing = meta?.fixedSlots?.missing ?? [];

  const executionMode = meta?.engine?.execution ?? "SIM";
  const architecture = meta?.engine?.architecture ?? "—";

  const counts = meta?.counts ?? {};
  const trackingStates = meta?.trackingStates ?? {};

  const harvest = useMemo(() => parseHarvestAudFromEvents(events), [events]);

  const nextSweepLabel = msToCountdown(meta?.cadence?.remainingMs ?? null);
  const lastSweepAgo = ageLabel(
    meta?.cadence?.lastRegistrySweepAt ? nowMs - meta.cadence.lastRegistrySweepAt : null
  );

  const lastAction = useMemo(() => {
    const e = events[0];
    if (!e) return "—";
    return `${e.kind}${e.coin ? ` • ${e.coin}` : ""}${e.slotId ? ` • ${e.slotId}` : ""}`;
  }, [events]);

  const marketCounts = snap?.counts ?? { all: 0, aud: 0, watch: 0 };
  const feedCount = feed === "all" ? marketCounts.all : feed === "aud" ? marketCounts.aud : marketCounts.watch;

  const topTrackingCoins = useMemo(() => {
    return filteredSlots
      .filter(
        (s) =>
          s.trackingState === "TRACKING" ||
          s.trackingState === "DRAWDOWN_SEEN" ||
          s.trackingState === "REVERSAL_CONFIRMING"
      )
      .map((s) => s.coin)
      .filter(Boolean)
      .slice(0, 6)
      .join(", ");
  }, [filteredSlots]);

  const showEventsUnderLedger = isDesktop && section === "ledger";

  return (
    <main className="home-shell engine-shell" data-view={view} aria-label="$JAL~Engine">
      <div className="home-wrap">
        <section className="card engine-window engine-window--hero machine-surface panel-frame" aria-label="Engine">
          <div className="engine-bg" aria-hidden="true">
            <img className="engine-bg-logo" src="/JALSOL1.gif" alt="" />
          </div>

          <div className="engine-foreground">
            <div className="engine-zone" data-zone="engine">
              <header className="engine-hero" aria-label="Engine header">
                <div className="engine-hero-left" aria-hidden="true" />

                <div className="engine-hero-center">
                  <h1 className="engine-title">$JAL~Engine</h1>
                  <div className="engine-sub">Deterministic fixed-slot Jeroid ledger.</div>

                  {view === "advanced" ? (
                    <div className="card machine-surface panel-frame engine-telemetry engine-telemetry--compact">
                      <div className="engine-mini">
                        <div className="engine-mini-row">
                          <div className="mini-k">Architecture</div>
                          <div className="mini-v">{architecture}</div>
                        </div>
                        <div className="engine-mini-row">
                          <div className="mini-k">Write gate</div>
                          <div className="mini-v">
                            {meta?.gates?.writeEnabled === true
                              ? "ENABLED"
                              : meta?.gates?.writeEnabled === false
                              ? "DISABLED"
                              : "UNKNOWN"}
                          </div>
                        </div>
                        <div className="engine-mini-row">
                          <div className="mini-k">Last action</div>
                          <div className="mini-v">{lastAction}</div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <aside className="engine-hero-right" aria-label="Engine HUD">
                  <div className="engine-hero-status" aria-label="Engine indicators">
                    <span className={`indicator status ${snap?.ok ? "ok" : "warn"}`}>
                      STATUS <span>{snap?.ok ? "ONLINE" : "WAITING"}</span>
                    </span>

                    <span className="indicator metric">
                      EXEC <span>{executionMode}</span>
                    </span>

                    <span className="indicator metric">
                      SLOTS <span>{fixedPresent}</span>
                    </span>

                    <span className="indicator metric">
                      FEED <span>{feedCount}</span>
                    </span>
                  </div>

                  <div className="engine-auth-hint">
                    AUD growth shown here is <strong>harvest-only</strong>. External transfers are ignored.
                  </div>
                </aside>
              </header>

              <div className="engine-capture-grid" aria-label="Engine capture cards">
                <div className="engine-capture card machine-surface panel-frame">
                  <div className="cap-k">Harvest Captured</div>
                  <div className="cap-v">{moneyAud(harvest.total)}</div>
                  <div className="cap-sub">
                    <span>24H {moneyAud(harvest.last24h)}</span>
                    <span>•</span>
                    <span>7D {moneyAud(harvest.last7d)}</span>
                  </div>
                </div>

                <div className="engine-capture card machine-surface panel-frame">
                  <div className="cap-k">Registry Sweep</div>
                  <div className="cap-v">{nextSweepLabel}</div>
                  <div className="cap-sub">
                    <span>Window {meta?.cadence?.currentWindow ?? "—"}</span>
                    <span>•</span>
                    <span>Last sweep {lastSweepAgo}</span>
                  </div>
                </div>

                <div className="engine-capture card machine-surface panel-frame">
                  <div className="cap-k">Fixed Slots</div>
                  <div className="cap-v">
                    {fixedPresent}/{fixedExpected}
                  </div>
                  <div className="cap-sub">
                    <span>Tracking {trackingStates.TRACKING ?? 0}</span>
                    <span>•</span>
                    <span>Holding {(counts.holding ?? 0) + (counts.locked ?? 0)}</span>
                  </div>
                </div>
              </div>

              <div className="engine-controls-wrap" aria-label="Controls">
                <div className="engine-controls">
                  <button
                    type="button"
                    className={`button ghost ${view === "advanced" ? "active" : ""}`}
                    onClick={() => setView(view === "simple" ? "advanced" : "simple")}
                  >
                    View: {view === "simple" ? "Simple" : "Advanced"}
                  </button>

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
                      setSortKey("spread");
                      setSortDir("asc");
                    }}
                  >
                    Sort: Spread
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
                    placeholder="Filter coins / slots…"
                    aria-label="Filter"
                  />
                </div>
              </div>

              {err ? (
                <div className="engine-log" role="status" aria-label="Errors">
                  <pre>{err}</pre>
                </div>
              ) : null}

              <div className="card machine-surface panel-frame engine-status-rail" aria-label="Live JRD Status">
                <div className="engine-telemetry-head">
                  <div>
                    <div className="engine-telemetry-title">Live JRD Status</div>
                    <div className="engine-telemetry-note">
                      One fixed Jeroid position at a time. Click the card to open full details.
                    </div>
                  </div>

                  <div className="engine-carousel-controls">
                    <button
                      type="button"
                      className="button ghost"
                      onClick={() =>
                        setCarouselIndex((i) =>
                          filteredSlots.length ? (i - 1 + filteredSlots.length) % filteredSlots.length : 0
                        )
                      }
                      aria-label="Previous JRD"
                    >
                      ←
                    </button>

                    <div className="engine-carousel-counter">
                      {filteredSlots.length ? `${carouselIndex + 1} / ${filteredSlots.length}` : "0 / 0"}
                    </div>

                    <button
                      type="button"
                      className="button ghost"
                      onClick={() =>
                        setCarouselIndex((i) => (filteredSlots.length ? (i + 1) % filteredSlots.length : 0))
                      }
                      aria-label="Next JRD"
                    >
                      →
                    </button>
                  </div>
                </div>

                {carouselSlot ? (
                  <>
                    <button
                      type="button"
                      className={`engine-carousel-card ${stateToneClass(carouselSlot)}`}
                      onClick={() => setSelectedSlotId(carouselSlot.id)}
                      onMouseEnter={() => setCarouselPaused(true)}
                      onMouseLeave={() => setCarouselPaused(false)}
                      onFocus={() => setCarouselPaused(true)}
                      onBlur={() => setCarouselPaused(false)}
                    >
                      <div className="engine-carousel-card-top">
                        <div className="engine-carousel-id">{carouselSlot.id}</div>
                        <div className="engine-carousel-coin">
                          {slotCoin(carouselSlot)} <span>{carouselSlot.market ?? "—"}</span>
                        </div>
                      </div>

                      <div className="engine-carousel-grid">
                        <div className="engine-carousel-metric">
                          <div className="engine-carousel-k">State</div>
                          <div className="engine-carousel-v">{stateLabel(carouselSlot)}</div>
                        </div>

                        <div className="engine-carousel-metric">
                          <div className="engine-carousel-k">Tracking</div>
                          <div className="engine-carousel-v">{trackingLabel(carouselSlot)}</div>
                        </div>

                        <div className="engine-carousel-metric">
                          <div className="engine-carousel-k">Net</div>
                          <div className="engine-carousel-v">{pctNum(carouselSlot.netPct)}</div>
                        </div>

                        <div className="engine-carousel-metric">
                          <div className="engine-carousel-k">Cycles</div>
                          <div className="engine-carousel-v">{carouselSlot.cycles ?? 0}</div>
                        </div>

                        <div className="engine-carousel-metric">
                          <div className="engine-carousel-k">Unit</div>
                          <div className="engine-carousel-v">{moneyAud(carouselSlot.unitAud)}</div>
                        </div>

                        <div className="engine-carousel-metric">
                          <div className="engine-carousel-k">Now</div>
                          <div className="engine-carousel-v">{effectiveNowLabel(carouselSlot)}</div>
                        </div>
                      </div>

                      <div className="engine-carousel-foot">
                        <span>Entry {effectiveEntryLabel(carouselSlot)}</span>
                        <span>•</span>
                        <span>Level {carouselSlot.level ? `LVL${carouselSlot.level}` : "—"}</span>
                        <span>•</span>
                        <span>View Details</span>
                      </div>

                      <div className={`engine-subslot ${subslotToneClass(carouselSlot)}`}>
                        <div className="engine-subslot-head">
                          <span className="engine-subslot-title">{subslotLabel(carouselSlot)}</span>
                          <span className="engine-subslot-state">
                            {carouselSlot.liveBuyLockFillStatus ??
                              carouselSlot.trackingState ??
                              carouselSlot.state}
                          </span>
                        </div>

                        <div className="engine-subslot-grid">
                          <div className="engine-subslot-item">
                            <div className="engine-subslot-k">Subslot Net</div>
                            <div className="engine-subslot-v">{pctNum(carouselSlot.netPct)}</div>
                          </div>

                          <div className="engine-subslot-item">
                            <div className="engine-subslot-k">Buy-Lock Count</div>
                            <div className="engine-subslot-v">{carouselSlot.buyLockCount ?? 0}</div>
                          </div>

                          <div className="engine-subslot-item">
                            <div className="engine-subslot-k">Combined Basis</div>
                            <div className="engine-subslot-v">{moneyAud(carouselSlot.combinedEntryAud)}</div>
                          </div>

                          <div className="engine-subslot-item">
                            <div className="engine-subslot-k">Last Reconcile</div>
                            <div className="engine-subslot-v">
                              {carouselSlot.liveLastReconcileAt
                                ? ageLabel(nowMs - carouselSlot.liveLastReconcileAt)
                                : "—"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>

                    <div
                      className="engine-carousel-dots"
                      onMouseEnter={() => setCarouselPaused(true)}
                      onMouseLeave={() => setCarouselPaused(false)}
                    >
                      {filteredSlots.map((slot, idx) => (
                        <button
                          key={slot.id}
                          type="button"
                          className={`engine-carousel-dot ${idx === carouselIndex ? "active" : ""}`}
                          onClick={() => setCarouselIndex(idx)}
                          aria-label={`Show ${slot.id}`}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="ledger-empty">No fixed slots available.</div>
                )}
              </div>

              <div className="engine-grid engine-grid--asym" aria-label="Engine bays">
                <div className="engine-bay engine-bay--narrow">
                  <div className="bay-head">
                    <div className="bay-title">Machine Summary</div>
                    <div className="bay-note">Fixed-slot runtime state.</div>
                  </div>

                  <div className="card machine-surface panel-frame engine-telemetry" aria-label="Machine Summary">
                    <div className="engine-telemetry-grid">
                      <div className="engine-telemetry-item">
                        <div className="engine-telemetry-k">Expected slots</div>
                        <div className="engine-telemetry-v">{fixedExpected}</div>
                        <div className="engine-telemetry-sub">Present {fixedPresent}</div>
                      </div>

                      <div className="engine-telemetry-item">
                        <div className="engine-telemetry-k">Waiting</div>
                        <div className="engine-telemetry-v">{counts.waiting ?? 0}</div>
                        <div className="engine-telemetry-sub">Deploying {counts.deploying ?? 0}</div>
                      </div>

                      <div className="engine-telemetry-item">
                        <div className="engine-telemetry-k">Holding family</div>
                        <div className="engine-telemetry-v">{(counts.holding ?? 0) + (counts.locked ?? 0)}</div>
                        <div className="engine-telemetry-sub">
                          L1 {counts.lvl1 ?? 0} • L2 {counts.lvl2 ?? 0} • L3 {counts.lvl3 ?? 0} • L4 {counts.lvl4 ?? 0}
                        </div>
                      </div>

                      <div className="engine-telemetry-item">
                        <div className="engine-telemetry-k">Tracking coins</div>
                        <div className="engine-telemetry-v">{trackingStates.TRACKING ?? 0}</div>
                        <div className="engine-telemetry-sub">{topTrackingCoins || "—"}</div>
                      </div>

                      <div className="engine-telemetry-item">
                        <div className="engine-telemetry-k">No market</div>
                        <div className="engine-telemetry-v">{trackingStates.NO_MARKET ?? 0}</div>
                        <div className="engine-telemetry-sub">Spread blocked {trackingStates.SPREAD_BLOCKED ?? 0}</div>
                      </div>

                      <div className="engine-telemetry-item">
                        <div className="engine-telemetry-k">Allowlist</div>
                        <div className="engine-telemetry-v">{fixedAllowlist.length}</div>
                        <div className="engine-telemetry-sub">
                          {fixedMissing.length ? `Missing ${fixedMissing.join(", ")}` : "No missing fixed ids"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {view === "advanced" ? (
                    <div className="card machine-surface panel-frame engine-telemetry" aria-label="Worker Status">
                      <div className="engine-telemetry-head">
                        <div className="engine-telemetry-title">Worker Status</div>
                        <div className="engine-telemetry-note">Backend runtime wiring</div>
                      </div>

                      <div className="engine-telemetry-grid">
                        <div className="engine-telemetry-item">
                          <div className="engine-telemetry-k">Harvester</div>
                          <div className="engine-telemetry-v">{meta?.harvester?.mode ?? "—"}</div>
                          <div className="engine-telemetry-sub">
                            {meta?.harvester?.running ? "RUNNING" : "STOPPED"}
                          </div>
                        </div>

                        <div className="engine-telemetry-item">
                          <div className="engine-telemetry-k">Executor</div>
                          <div className="engine-telemetry-v">{meta?.executor?.mode ?? "—"}</div>
                          <div className="engine-telemetry-sub">
                            {meta?.executor?.running ? "RUNNING" : "STOPPED"}
                          </div>
                        </div>

                        <div className="engine-telemetry-item">
                          <div className="engine-telemetry-k">Manager</div>
                          <div className="engine-telemetry-v">{meta?.manager?.mode ?? "—"}</div>
                          <div className="engine-telemetry-sub">
                            {meta?.manager?.running ? "RUNNING" : "STOPPED"}
                          </div>
                        </div>

                        <div className="engine-telemetry-item">
                          <div className="engine-telemetry-k">Execution</div>
                          <div className="engine-telemetry-v">{executionMode}</div>
                          <div className="engine-telemetry-sub">
                            {meta?.engine?.liveTradingEnabled ? "LIVE READY" : "SIM ONLY"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="engine-bay">
                  <div className="bay-head">
                    <div className="bay-title">Market Surface</div>
                    <div className="bay-note">Read-only CoinSpot feed.</div>
                  </div>

                  <div className="card machine-surface panel-frame engine-telemetry" aria-label="Tradable Surface">
                    <div className="engine-telemetry-head">
                      <div className="engine-telemetry-title">Tradable Surface</div>
                      <div className="engine-telemetry-note">Coin / Mid / Spread</div>
                    </div>

                    <div className="market-console" aria-label="Market table">
                      <div className="market-head market-head--compact">
                        <div>Coin</div>
                        <div className="market-price">Mid</div>
                        <div className="market-price">Spread</div>
                      </div>

                      <div className="market-body" aria-label="Market rows">
                        {filteredMarketRows.map((r) => {
                          const mid = r.mid ?? (r.bid + r.ask) / 2;
                          const spreadPct = r.spreadPct ?? (((r.ask - r.bid) / Math.max(mid, 1e-9)) * 100);

                          return (
                            <div className="market-row market-row--compact" key={`${r.coin}::${r.market ?? ""}`}>
                              <div className="market-coin">
                                <strong>{r.coin}</strong>
                                <span className="market-market">{r.market ?? `${r.coin}/AUD`}</span>
                              </div>

                              <div className="market-price">{fmt(mid)}</div>
                              <div className="market-price">{pctNum(spreadPct)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="engine-divider" aria-hidden="true">
              <div className="engine-divider-line" />
              <div className="engine-divider-label">Jeroid Ledger</div>
              <div className="engine-divider-line" />
            </div>

            <div className="engine-zone" data-zone="ledger">
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
                  className={`engine-section-tab ${section === "about" ? "active" : ""}`}
                  onClick={() => setSection("about")}
                >
                  About
                </button>
              </div>

              {section === "ledger" ? (
                <>
                  <div className="engine-ledger-topgrid" aria-label="Jeroid status cards">
                    <div className="engine-capture card machine-surface panel-frame" data-treasury="true">
                      <div className="cap-k">Registry</div>
                      <div className="cap-v">{meta?.harvester?.running ? "RUNNING" : "STOPPED"}</div>
                      <div className="cap-sub">
                        <span>Phase {meta?.harvester?.phase ?? "—"}</span>
                        <span>•</span>
                        <span>Window {meta?.cadence?.currentWindow ?? "—"}</span>
                      </div>
                    </div>

                    <div className="engine-capture card machine-surface panel-frame" data-treasury="true">
                      <div className="cap-k">Tracking states</div>
                      <div className="cap-v">{Object.keys(trackingStates).length}</div>
                      <div className="cap-sub">
                        <span>TRACKING {trackingStates.TRACKING ?? 0}</span>
                        <span>•</span>
                        <span>DRAWDOWN {trackingStates.DRAWDOWN_SEEN ?? 0}</span>
                      </div>
                    </div>

                    <div className="engine-capture card machine-surface panel-frame" data-treasury="true">
                      <div className="cap-k">Fixed universe</div>
                      <div className="cap-v">{fixedAllowlist.length}</div>
                      <div className="cap-sub">
                        <span>{fixedAllowlist.slice(0, 4).join(", ")}</span>
                        <span>•</span>
                        <span>{fixedAllowlist.length > 4 ? `+${fixedAllowlist.length - 4} more` : "full set"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="card machine-surface panel-frame engine-ledger" aria-label="Slots Ledger">
                    <div className="engine-ledger-top">
                      <div>
                        <div className="engine-ledger-title">Permanent Slots Ledger</div>
                        <div className="engine-ledger-note">
                          Read-only public machine proof. Each slot belongs to one fixed coin identity.
                        </div>
                      </div>

                      <div className="engine-ledger-counts">
                        Fixed: <strong>{fixedPresent}</strong> • Missing: <strong>{fixedMissing.length}</strong>
                      </div>
                    </div>

                    <div className="ledger-table">
                      <div className="ledger-head">
                        <div>Slot ID</div>
                        <div>Coin</div>
                        <div>Market</div>
                        <div>State</div>
                        <div>Subslot</div>
                        <div>Tracking</div>
                        <div className="num">Unit</div>
                        <div className="num">Net</div>
                        <div className="num">Cycles</div>
                        <div className="num">Log</div>
                      </div>

                      {filteredSlots.length ? (
                        filteredSlots.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            className="ledger-row"
                            onClick={() => setSelectedSlotId(s.id)}
                            title="Open slot details"
                          >
                            <div className="ledger-slotid">{s.id}</div>
                            <div>{slotCoin(s)}</div>
                            <div>{s.market ?? "—"}</div>
                            <div>{stateLabel(s)}</div>
                            <div>
                              <span className={`ledger-subslot ${subslotToneClass(s)}`}>
                                {subslotLabel(s)}
                              </span>
                            </div>
                            <div>{trackingLabel(s)}</div>
                            <div className="num">{moneyAud(s.unitAud)}</div>
                            <div className="num">{pctNum(s.netPct)}</div>
                            <div className="num">{s.cycles ?? 0}</div>
                            <div className="num ledger-view">View</div>
                          </button>
                        ))
                      ) : (
                        <div className="ledger-empty">No slots in public ledger yet.</div>
                      )}
                    </div>

                    <div className="engine-footer-note engine-footer-note--spaced">
                      AUD growth shown on this page is <strong>harvest-only</strong>. External deposits and withdrawals are ignored.
                    </div>
                  </div>

                  {showEventsUnderLedger ? (
                    <div className="card machine-surface panel-frame engine-events" aria-label="Public Event Log">
                      <div className="engine-events-top">
                        <div>
                          <div className="engine-events-title">Public Event Log</div>
                          <div className="engine-events-note">Append-only public log for fixed-slot lifecycle proof.</div>
                        </div>

                        <button
                          type="button"
                          className="button ghost"
                          onClick={() => setEventsOpen((v) => !v)}
                          aria-expanded={eventsOpen}
                        >
                          {eventsOpen ? "Hide" : "Show"} ({Math.min(events.length, 50)})
                        </button>
                      </div>

                      {eventsOpen ? (
                        <div className="event-log">
                          {events.length ? (
                            events.slice(0, 50).map((e) => (
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
                      ) : null}
                    </div>
                  ) : null}
                </>
              ) : null}

              {section === "events" ? (
                <div className="card machine-surface panel-frame engine-events" aria-label="Public Event Log">
                  <div className="engine-events-top">
                    <div>
                      <div className="engine-events-title">Public Event Log</div>
                      <div className="engine-events-note">Append-only public log (no keys / no balances)</div>
                    </div>

                    <button
                      type="button"
                      className="button ghost"
                      onClick={() => setEventsOpen((v) => !v)}
                      aria-expanded={eventsOpen}
                    >
                      {eventsOpen ? "Hide" : "Show"} ({Math.min(events.length, 100)})
                    </button>
                  </div>

                  {eventsOpen ? (
                    <div className="event-log">
                      {events.length ? (
                        events.slice(0, 100).map((e) => (
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
                  ) : (
                    <div className="event-empty">Collapsed.</div>
                  )}
                </div>
              ) : null}

              {section === "about" ? (
                <div className="engine-about" aria-label="About $JAL~Engine">
                  <button
                    type="button"
                    className="button ghost engine-about-btn"
                    onClick={() => setAboutOpen((v) => !v)}
                    aria-expanded={aboutOpen}
                    aria-controls="engine-about"
                  >
                    <span>About $JAL~Engine</span>
                    <span className="engine-about-toggle">{aboutOpen ? "—" : "+"}</span>
                  </button>

                  {aboutOpen ? (
                    <div id="engine-about" className="card machine-surface panel-frame engine-about-panel">
                      <div className="engine-about-title">Fixed-Slot Jeroid Ledger</div>

                      <p>
                        This page reflects the permanent-slot backend architecture. Each Jeroid slot belongs to one fixed market
                        identity and independently waits, deploys, holds, exits, and re-enters under the same machine rules.
                      </p>

                      <p>
                        <strong>Tracking State</strong> describes pre-entry market readiness for that specific slot’s coin.
                        <br />
                        <strong>State</strong> describes lifecycle ownership inside the ledger.
                      </p>

                      <div className="engine-about-h">Machine order</div>
                      <ul>
                        <li>Harvester ensures the fixed slot registry exists.</li>
                        <li>Executor evaluates only each slot’s own coin.</li>
                        <li>Manager controls hold / lock / exit / re-entry lifecycle.</li>
                        <li>Ledger persists public machine proof for UI inspection.</li>
                      </ul>

                      <div className="engine-about-h">Key truths</div>
                      <ul>
                        <li>Slot identity is permanent coin identity.</li>
                        <li>No anonymous queued selector pool is used anymore.</li>
                        <li>AUD growth shown here is harvest-only.</li>
                        <li>External transfers are excluded from displayed harvest totals.</li>
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>

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
                  {slotCoin(selectedSlot)} • {selectedSlot.market ?? "—"} • {stateLabel(selectedSlot)} •{" "}
                  {trackingLabel(selectedSlot)}
                  <span className="slot-drawer-esc">Esc to close</span>
                </div>
              </div>

              <button type="button" className="button ghost" onClick={() => setSelectedSlotId(null)}>
                Close
              </button>
            </div>

            <div className="slot-drawer-grid">
              <div>
                <div className="slot-k">Unit</div>
                <div className="slot-v">{moneyAud(selectedSlot.unitAud)}</div>
              </div>
              <div>
                <div className="slot-k">Cycles</div>
                <div className="slot-v">{selectedSlot.cycles ?? 0}</div>
              </div>
              <div>
                <div className="slot-k">Entry</div>
                <div className="slot-v">{effectiveEntryLabel(selectedSlot)}</div>
              </div>
              <div>
                <div className="slot-k">Now</div>
                <div className="slot-v">{effectiveNowLabel(selectedSlot)}</div>
              </div>
              <div>
                <div className="slot-k">Gross</div>
                <div className="slot-v">{pctNum(selectedSlot.grossPct)}</div>
              </div>
              <div>
                <div className="slot-k">Net</div>
                <div className="slot-v">{pctNum(selectedSlot.netPct)}</div>
              </div>
              <div>
                <div className="slot-k">Level</div>
                <div className="slot-v">{selectedSlot.level ? `LVL${selectedSlot.level}` : "—"}</div>
              </div>
              <div>
                <div className="slot-k">Subslot</div>
                <div className={`slot-v slot-subslot ${subslotToneClass(selectedSlot)}`}>
                  {subslotLabel(selectedSlot)}
                </div>
              </div>
              <div>
                <div className="slot-k">Lock</div>
                <div className="slot-v">{lockDisplay(selectedSlot)}</div>
              </div>
              <div>
                <div className="slot-k">Re-entry target</div>
                <div className="slot-v">{fmt(selectedSlot.reentryTargetMid)}</div>
              </div>
              <div>
                <div className="slot-k">Exit reason</div>
                <div className="slot-v">{selectedSlot.exitReason ?? "—"}</div>
              </div>
              <div>
                <div className="slot-k">Created</div>
                <div className="slot-v">{ageLabel(nowMs - selectedSlot.createdAt)}</div>
              </div>
              <div>
                <div className="slot-k">Last seen</div>
                <div className="slot-v">
                  {selectedSlot.lastSeenAt ? ageLabel(nowMs - selectedSlot.lastSeenAt) : "—"}
                </div>
              </div>
            </div>

            <div className="slot-section">Subslot Snapshot</div>

            <div className="slot-drawer-grid">
              <div>
                <div className="slot-k">Subslot Role</div>
                <div className={`slot-v slot-subslot ${subslotToneClass(selectedSlot)}`}>
                  {subslotLabel(selectedSlot)}
                </div>
              </div>
              <div>
                <div className="slot-k">Buy-Lock Count</div>
                <div className="slot-v">{selectedSlot.buyLockCount ?? 0}</div>
              </div>
              <div>
                <div className="slot-k">Buy-Lock Fill</div>
                <div className="slot-v">{selectedSlot.liveBuyLockFillStatus ?? "—"}</div>
              </div>
              <div>
                <div className="slot-k">Combined Entry AUD</div>
                <div className="slot-v">{moneyAud(selectedSlot.combinedEntryAud)}</div>
              </div>
              <div>
                <div className="slot-k">Combined Coin Qty</div>
                <div className="slot-v">{fmt(selectedSlot.combinedCoinQty)}</div>
              </div>
              <div>
                <div className="slot-k">Combined Entry Rate</div>
                <div className="slot-v">{fmt(selectedSlot.combinedEntryRate)}</div>
              </div>
              <div>
                <div className="slot-k">Last Reconcile</div>
                <div className="slot-v">
                  {selectedSlot.liveLastReconcileAt
                    ? ageLabel(nowMs - selectedSlot.liveLastReconcileAt)
                    : "—"}
                </div>
              </div>
              <div>
                <div className="slot-k">Reconcile Note</div>
                <div className="slot-v">{selectedSlot.liveLastReconcileNote ?? "—"}</div>
              </div>
              <div>
                <div className="slot-k">Last Error</div>
                <div className="slot-v">{selectedSlot.liveLastError ?? "—"}</div>
              </div>
            </div>

            <div className="slot-section">Tracking Snapshot</div>

            <div className="slot-drawer-grid">
              <div>
                <div className="slot-k">Tracking State</div>
                <div className="slot-v">{trackingLabel(selectedSlot)}</div>
              </div>
              <div>
                <div className="slot-k">Reason</div>
                <div className="slot-v">{reasonLabel(selectedSlot.candidateReason)}</div>
              </div>
              <div>
                <div className="slot-k">Drawdown</div>
                <div className="slot-v">{pctNum(selectedSlot.candidateDrawdownPct)}</div>
              </div>
              <div>
                <div className="slot-k">Bounce</div>
                <div className="slot-v">{pctNum(selectedSlot.candidateBouncePct)}</div>
              </div>
              <div>
                <div className="slot-k">EMA Gap</div>
                <div className="slot-v">{pctNum(selectedSlot.candidateEmaGapPct)}</div>
              </div>
              <div>
                <div className="slot-k">Reversal Ticks</div>
                <div className="slot-v">
                  {selectedSlot.candidateReversalTicks != null ? selectedSlot.candidateReversalTicks : "—"}
                </div>
              </div>
              <div>
                <div className="slot-k">Score</div>
                <div className="slot-v">
                  {selectedSlot.candidateScore != null ? selectedSlot.candidateScore.toFixed(3) : "—"}
                </div>
              </div>
              <div>
                <div className="slot-k">Tracked Peak</div>
                <div className="slot-v">{fmt(selectedSlot.candidatePeakMid)}</div>
              </div>
              <div>
                <div className="slot-k">Tracked Low</div>
                <div className="slot-v">{fmt(selectedSlot.candidateLowMid)}</div>
              </div>
              <div>
                <div className="slot-k">Spread</div>
                <div className="slot-v">{pctNum(selectedSlot.nowSpreadPct ?? selectedSlot.candidateSpreadPrevPct)}</div>
              </div>
            </div>

            {(selectedSlot.entryDrawdownPct != null ||
              selectedSlot.entryBouncePct != null ||
              selectedSlot.entryEmaGapPct != null ||
              selectedSlot.entryScore != null) && (
              <>
                <div className="slot-section">Entry Context</div>

                <div className="slot-drawer-grid">
                  <div>
                    <div className="slot-k">Entry Drawdown</div>
                    <div className="slot-v">{pctNum(selectedSlot.entryDrawdownPct)}</div>
                  </div>
                  <div>
                    <div className="slot-k">Entry Bounce</div>
                    <div className="slot-v">{pctNum(selectedSlot.entryBouncePct)}</div>
                  </div>
                  <div>
                    <div className="slot-k">Entry EMA Gap</div>
                    <div className="slot-v">{pctNum(selectedSlot.entryEmaGapPct)}</div>
                  </div>
                  <div>
                    <div className="slot-k">Confirm Ticks</div>
                    <div className="slot-v">
                      {selectedSlot.entryConfirmTicks != null ? selectedSlot.entryConfirmTicks : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="slot-k">Entry Score</div>
                    <div className="slot-v">
                      {selectedSlot.entryScore != null ? selectedSlot.entryScore.toFixed(3) : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="slot-k">Fee Model</div>
                    <div className="slot-v">{selectedSlot.frictionModel ?? "—"}</div>
                  </div>
                </div>
              </>
            )}

            {(selectedSlot.realizedAt != null ||
              selectedSlot.entryAud != null ||
              selectedSlot.exitAud != null ||
              selectedSlot.profitAud != null ||
              selectedSlot.profitPct != null) && (
              <>
                <div className="slot-section">Realized Proof</div>

                <div className="slot-drawer-grid">
                  <div>
                    <div className="slot-k">Entry AUD</div>
                    <div className="slot-v">{moneyAud(selectedSlot.entryAud)}</div>
                  </div>
                  <div>
                    <div className="slot-k">Exit AUD</div>
                    <div className="slot-v">{moneyAud(selectedSlot.exitAud)}</div>
                  </div>
                  <div>
                    <div className="slot-k">Profit AUD</div>
                    <div className="slot-v">{moneyAud(selectedSlot.profitAud)}</div>
                  </div>
                  <div>
                    <div className="slot-k">Profit %</div>
                    <div className="slot-v">{pctNum(selectedSlot.profitPct)}</div>
                  </div>
                </div>
              </>
            )}

            <div className="slot-section">Timeline</div>

            <div className="event-log">
{selectedSlotEvents.length ? (
  selectedSlotEvents.slice(0, 60).map((e) => (
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

            <div className="slot-section">Rules Snapshot</div>

            <div className="slot-rules">
              <div>Permanent identity: one slot belongs to one fixed coin market.</div>
              <div>WAITING_ENTRY is the latch before deployment.</div>
              <div>Deploy / hold / lock / exit decisions remain deterministic.</div>
              <div className="slot-rules-note">
                This slot is part of the fixed-slot Jeroid ledger, not a selector pool.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}