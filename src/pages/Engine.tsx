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
  spreadPct?: number | null;
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
type Section = "overview" | "ledger" | "events" | "about";

type SlotState =
  | "WAITING_ENTRY"
  | "DEPLOYING"
  | "HOLDING"
  | "LVL1_LOCK"
  | "LVL2_LOCK"
  | "LVL3_LOCK"
  | "LVL4_TRAIL"
  | "EXITING";

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
  managerVersion?: string | null;
  paperOnly?: boolean;

  liveExecutionMode?: string | null;
  liveLastError?: string | null;
  liveLastReconcileAt?: number | null;
  liveLastReconcileNote?: string | null;

  liveOrderId?: string | null;
  liveOrderSide?: string | null;

  liveEntryOrderId?: string | null;
  liveEntryRequestedAud?: number | null;
  liveEntryRequestedCoinQty?: number | null;
  liveEntrySubmittedRate?: number | null;
  liveEntryOrderAt?: number | null;
  liveEntryFillStatus?: string | null;
  liveEntryActualAud?: number | null;
  liveEntryActualCoinQty?: number | null;
  liveEntryActualRate?: number | null;
  liveEntryFilledAt?: number | null;

  liveExitOrderId?: string | null;
  liveExitRequestedCoinQty?: number | null;
  liveExitExpectedAud?: number | null;
  liveExitSubmittedRate?: number | null;
  liveExitOrderAt?: number | null;
  liveExitFillStatus?: string | null;
  liveExitActualAud?: number | null;
  liveExitActualCoinQty?: number | null;
  liveExitActualRate?: number | null;
  liveExitFilledAt?: number | null;

  subslotActive?: boolean | null;
  subslotCount?: number | null;
  subslotState?: string | null;
  subslotOpenedAt?: number | null;
  subslotClosedAt?: number | null;
  subslotCooldownUntil?: number | null;

  subslotRequestedAud?: number | null;
  subslotRequestedCoinQty?: number | null;
  subslotSubmittedRate?: number | null;

  subslotActualAud?: number | null;
  subslotActualCoinQty?: number | null;
  subslotActualRate?: number | null;

  subslotEntryMid?: number | null;
  subslotNowMid?: number | null;
  subslotGrossPct?: number | null;
  subslotNetPct?: number | null;
  subslotPeakBid?: number | null;
  subslotDrawdownPct?: number | null;

  subslotOrderId?: string | null;
  subslotFillStatus?: string | null;
  subslotPreAudAvailable?: number | null;
  subslotPreCoinAvailable?: number | null;

  subslotExitOrderId?: string | null;
  subslotExitRequestedCoinQty?: number | null;
  subslotExitSubmittedRate?: number | null;
  subslotExitExpectedAud?: number | null;
  subslotExitOrderAt?: number | null;
  subslotExitActualAud?: number | null;
  subslotExitActualCoinQty?: number | null;
  subslotExitActualRate?: number | null;
  subslotExitFilledAt?: number | null;

  subslotExitReason?: string | null;
  subslotProfitAud?: number | null;
  subslotProfitPct?: number | null;
  subslotRealizedAt?: number | null;

  subslotLastError?: string | null;
  subslotLastReconcileAt?: number | null;
  subslotLastReconcileNote?: string | null;

  subslotPendingMergeAud?: number | null;
  subslotLastMergedAud?: number | null;
  subslotMergedAt?: number | null;
  subslotLifetimeProfitAud?: number | null;
  subslotLifetimeCycles?: number | null;

  subslotTrackingSince?: number | null;
  subslotLowMid?: number | null;
  subslotLastMid?: number | null;
  subslotBouncePct?: number | null;
  subslotEmaFast?: number | null;
  subslotEmaSlow?: number | null;
  subslotEmaGapPct?: number | null;
  subslotConfirmTicks?: number | null;
  subslotSignalState?: string | null;
  subslotSignalReason?: string | null;
  subslotEntryMode?: string | null;

  regime?: string | null;
  regimeStrength?: number | null;
  regimeTrendScore?: number | null;
  regimeFlipCount?: number | null;
  regimeUpdatedAt?: number | null;
  regimeFastEma?: number | null;
  regimeSlowEma?: number | null;
  regimeFastSlopePct?: number | null;
  regimeSlowSlopePct?: number | null;
  regimeRangePct?: number | null;
  regimeLastMid?: number | null;

  consolidationState?: string | null;
  consolidationRangeHigh?: number | null;
  consolidationRangeLow?: number | null;
  consolidationRangePct?: number | null;
  consolidationTicks?: number | null;
  consolidationCompressionScore?: number | null;
  consolidationBreakoutReady?: boolean | null;

  rotationEligibleOut?: boolean | null;
  rotationScoreOut?: number | null;
  rotationOutBlockedReason?: string | null;
  rotationEligibleIn?: boolean | null;
  rotationScoreIn?: number | null;
  rotationInBlockedReason?: string | null;
  rotationEdgeScore?: number | null;
  rotationTargetSlotId?: string | null;
  rotationTargetCoin?: string | null;
  rotationSourceSlotId?: string | null;
  rotationRequested?: boolean | null;
  rotationRequestedAt?: number | null;
  rotationReason?: string | null;

  rotationReservationId?: string | null;
  rotationRole?: string | null;
  rotationLinkedSlotId?: string | null;
  rotationStage?: string | null;
  rotationPreExitState?: string | null;
  rotationStartedAt?: number | null;
  rotationCompletedAt?: number | null;
  rotationLastError?: string | null;
  rotationExitOrderId?: string | null;
  rotationEntryOrderId?: string | null;
  rotationReleasedAud?: number | null;
  rotationFundingReservedAud?: number | null;
  rotationFundingSourceSlotId?: string | null;
  rotationExitSubmittedAt?: number | null;
  rotationEntrySubmittedAt?: number | null;
  rotationDryRun?: boolean | null;
  rotationAttemptCount?: number | null;
  rotationEntryAttemptCount?: number | null;
  rotationOriginalUnitAud?: number | null;
  rotationFundingTransferredAud?: number | null;

  rotationExitIntentId?: string | null;
  rotationExitIntentAt?: number | null;
  rotationFundingIntentId?: string | null;
  rotationFundingIntentAt?: number | null;
  rotationEntryIntentId?: string | null;
  rotationEntryIntentAt?: number | null;

  topupLastAppliedAt?: number | null;
  topupLastDeltaAud?: number | null;
  topupLastTargetAud?: number | null;
  topupRequestedTargetAud?: number | null;
  topupFallbackAud?: number | null;
  topupMode?: string | null;

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

  buyLockCount?: number | null;
  buyLockActive?: boolean | null;
  buyLockLastAt?: number | null;
  buyLockLastUnitAud?: number | null;
  buyLockLastRate?: number | null;
  buyLockLastCoinQty?: number | null;
  combinedEntryAud?: number | null;
  combinedCoinQty?: number | null;
  combinedEntryRate?: number | null;
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
    rotationEnabled?: boolean;
    rotationTickMs?: number;
    rotationExecutorEnabled?: boolean;
    rotationExecutorTickMs?: number;
    topupEnabled?: boolean;
    topupTickMs?: number;
  };
  fixedSlots?: {
    expected?: number;
    allowlist?: string[];
    present?: number;
    missing?: string[];
    fixedCoinsPresent?: string[];
    orphaned?: string[];
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
  rotation?: any;
  rotationExecutor?: any;
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

function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
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

function isHoldingFamilyState(state: SlotState | string | null | undefined) {
  const s = String(state || "").toUpperCase();
  return (
    s === "HOLDING" ||
    s === "LVL1_LOCK" ||
    s === "LVL2_LOCK" ||
    s === "LVL3_LOCK" ||
    s === "LVL4_TRAIL"
  );
}

function parseWindowHarvestFromEvents(events: SlotEvent[]) {
  const out = { window: 0, last24h: 0, last7d: 0 };
  if (!events?.length) return out;

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const weekMs = 7 * dayMs;

  const grab = (msg: string) => {
    const profitAud =
      msg.match(/profitAud=([+-]?\d+(\.\d+)?)/i) ??
      msg.match(/HARVEST[_\s-]*AUD(?:[_\s-]*DELTA)?\s*[:=]?\s*([+-]?\d+(\.\d+)?)/i) ??
      msg.match(/AUD\s*HARVEST\s*[:=]?\s*([+-]?\d+(\.\d+)?)/i) ??
      msg.match(/\(([+-]?\$?\d+(\.\d+)?)\,/i);

    if (!profitAud) return null;

    const raw = String(profitAud[1]).replace(/\$/g, "");
    const v = Number(raw);
    return Number.isFinite(v) ? v : null;
  };

  for (const e of events) {
    const v = grab(String(e.msg ?? ""));
    if (v == null) continue;

    out.window += v;
    const age = now - (e.at || 0);
    if (age <= dayMs) out.last24h += v;
    if (age <= weekMs) out.last7d += v;
  }

  out.window = roundMoney(out.window);
  out.last24h = roundMoney(out.last24h);
  out.last7d = roundMoney(out.last7d);

  return out;
}

function computeSlotFinancials(slotRows: SlotRow[]) {
  let openPnl = 0;
  let visibleRealized = 0;

  for (const s of slotRows) {
    const baseAud = Number(
  s.combinedEntryAud ?? s.entryAud ?? s.unitAud
    );
    const netPct = Number(s.netPct);
    const profitAud = Number(s.profitAud);

if (isHoldingFamilyState(s.state) && Number.isFinite(baseAud) && Number.isFinite(netPct)) {
  openPnl += baseAud * (netPct / 100);
}

    if (Number.isFinite(profitAud)) {
      visibleRealized += profitAud;
    }
  }

  return {
    openPnl: roundMoney(openPnl),
    visibleRealized: roundMoney(visibleRealized),
  };
}

function stateClassName(value: string | null | undefined) {
  const normalized = String(value || "")
    .toUpperCase()
    .replace(/_/g, "-");
  return normalized ? `state-${normalized}` : "";
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
    tracking === "SELL_SUBMITTED"
  ) {
    return "is-deploying";
  }

  if (tracking === "TRACKING" || tracking === "ARMED" || tracking === "DRAWDOWN_SEEN") {
    return "is-tracking";
  }

  if (tracking === "SPREAD_BLOCKED") return "is-blocked";
  if (tracking === "NO_MARKET") return "is-muted";
  return "is-neutral";
}

function regimeLabel(s: SlotRow) {
  return s.regime || s.consolidationState || "UNCLASSIFIED";
}

function regimeToneClass(s: SlotRow) {
  const regime = String(regimeLabel(s)).toUpperCase();

  if (regime.includes("UPTREND") || regime.includes("BULL")) return "is-holding";
  if (regime.includes("DOWNTREND") || regime.includes("BEAR")) return "is-exiting";
  if (regime.includes("CONSOLIDATION")) return "is-tracking";
  return "is-muted";
}

function regimeSummary(s: SlotRow) {
  const regime = String(regimeLabel(s)).toUpperCase();
  const breakout = s.consolidationBreakoutReady === true;

  if (regime === "UPTREND") return "Trend pressure is upward.";
  if (regime === "DOWNTREND") return "Trend pressure is downward.";
  if (regime === "CONSOLIDATION_BULL")
    return breakout
      ? "Bullish compression with breakout readiness."
      : "Bullish compression, still waiting for release.";
  if (regime === "CONSOLIDATION_BEAR")
    return breakout
      ? "Bearish compression with breakdown readiness."
      : "Bearish compression, still waiting for release.";
  if (regime.includes("CONSOLIDATION")) return "Compression detected. Waiting for direction.";
  return "Market behavior still being classified.";
}

function subslotModeLabel(s: SlotRow) {
  const mode = String(s.subslotEntryMode || "").toUpperCase();
  const regime = String(regimeLabel(s)).toUpperCase();

  if (mode) return mode.replace(/_/g, " ");
  if (regime.includes("CONSOLIDATION")) return "CONSOLIDATION CAPTURE";
  if (regime.includes("UPTREND")) return "UPTREND CAPTURE";
  if (regime.includes("DOWNTREND") || regime.includes("BEAR")) return "COUNTER-TREND CAPTURE";
  return "TACTICAL CAPTURE";
}

function subslotDecisionLabel(s: SlotRow) {
  const sub = String(s.subslotState || "").toUpperCase();
  const signal = String(s.subslotSignalState || "").toUpperCase();

  if (sub === "BUY_SUBMITTED") return "Entry pending";
  if (sub === "ACTIVE") return "Trade active";
  if (sub === "SELL_SUBMITTED") return "Exit pending";
  if (sub === "CLOSED" && s.subslotExitReason) return "Last trade closed";

  if (signal === "REVERSAL_CONFIRMING") return "Waiting for confirmation";
  if (signal === "BOUNCE_SEEN") return "Bounce detected";
  if (signal === "TRACKING") return "Tracking move";
  if (signal === "ARMED") return "Armed";
  if (signal === "NO_MARKET") return "No usable market";
  return "Idle";
}

function subslotReasonLabel(s: SlotRow) {
  const sub = String(s.subslotState || "").toUpperCase();
  const signal = String(s.subslotSignalState || "").toUpperCase();

  if (sub === "BUY_SUBMITTED") return "A live entry has been submitted and is awaiting confirmation.";
  if (sub === "ACTIVE") return "A tactical capture is currently open inside the parent slot.";
  if (sub === "SELL_SUBMITTED") return "A live exit has been submitted and is awaiting confirmation.";
  if (sub === "CLOSED" && s.subslotExitReason) {
    return `Last exit reason: ${reasonLabel(s.subslotExitReason)}.`;
  }

  if (signal === "REVERSAL_CONFIRMING") return "Bounce, trend, and confirmation checks are aligning.";
  if (signal === "BOUNCE_SEEN") return "A bounce was detected, but confirmation is not complete yet.";
  if (signal === "TRACKING") return "The system is watching for structure before entry.";
  if (signal === "ARMED") return "The setup is armed but waiting for movement.";
  if (signal === "NO_MARKET") return "The system does not have a usable live market read.";
  return "No tactical action is currently active.";
}

function subslotToneClass(s: SlotRow) {
  const sub = String(s.subslotState || "").toUpperCase();
  const signal = String(s.subslotSignalState || "").toUpperCase();

  if (sub === "BUY_SUBMITTED") return "is-deploying";
  if (sub === "ACTIVE") return "is-holding";
  if (sub === "SELL_SUBMITTED") return "is-exiting";
  if (sub === "CLOSED") return "is-muted";

  if (signal === "REVERSAL_CONFIRMING") return "is-deploying";
  if (signal === "BOUNCE_SEEN" || signal === "TRACKING" || signal === "ARMED") return "is-tracking";
  if (signal === "NO_MARKET") return "is-muted";

  return "is-muted";
}

function isIdleSubslot(s: SlotRow) {
  const sub = String(s.subslotState || "").toUpperCase();
  const signal = String(s.subslotSignalState || "").toUpperCase();

  return sub === "CLOSED" && (!signal || signal === "NO_MARKET");
}

function engineDecisionLabel(s: SlotRow) {
  const state = String(s.state || "").toUpperCase();

  if (state === "WAITING_ENTRY") return "Waiting";
  if (state === "DEPLOYING") return "Entering";
  if (state === "EXITING") return "Exiting";
  if (state === "LVL4_TRAIL") return "Trailing";
  if (state === "LVL3_LOCK" || state === "LVL2_LOCK" || state === "LVL1_LOCK") return "Locked";
  if (state === "HOLDING") return "Holding";
  return "Watching";
}

function entryPhaseLabel(s: SlotRow) {
  const state = String(s.state || "").toUpperCase();
  const tracking = String(s.trackingState || "").toUpperCase();

  if (state === "WAITING_ENTRY" && s.reentryTargetMid != null) return "Waiting for re-entry level";
  if (tracking === "REVERSAL_CONFIRMING") return "Reversal confirming";
  if (tracking === "DRAWDOWN_SEEN") return "Drawdown observed";
  if (tracking === "TRACKING") return "Tracking structure";
  if (tracking === "SPREAD_BLOCKED") return "Spread blocked";
  if (tracking === "NO_MARKET") return "No market";
  if (state === "DEPLOYING") return "Deploying";
  if (isHoldingFamilyState(state)) return "Position established";
  if (state === "EXITING") return "Exit in progress";
  return "Idle";
}

function breakoutLabel(s: SlotRow) {
  if (s.consolidationBreakoutReady === true) return "READY";
  if (String(regimeLabel(s)).toUpperCase().includes("CONSOLIDATION")) return "BUILDING";
  return "NO";
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

function describeDecision(s: SlotRow) {
  const state = String(s.state || "").toUpperCase();

  if (state === "WAITING_ENTRY") {
    if (s.reentryTargetMid != null) return `Waiting for price to revisit ${fmt(s.reentryTargetMid)}.`;
    return "Waiting for a new qualified entry.";
  }

  if (state === "DEPLOYING") return "Submitting and confirming a live entry.";
  if (state === "EXITING") return "Submitting or confirming a live exit.";
  if (state === "LVL4_TRAIL") return "Holding with the highest trail protection engaged.";
  if (state === "LVL3_LOCK") return "Holding with level 3 lock protection.";
  if (state === "LVL2_LOCK") return "Holding with level 2 lock protection.";
  if (state === "LVL1_LOCK") return "Holding with level 1 lock protection.";
  if (state === "HOLDING") return "Holding the parent position and monitoring tactical conditions.";

  return "Monitoring slot conditions.";
}

function detailRowsForSlot(s: SlotRow, nowMs: number) {
  return [
    { k: "Slot", v: s.id },
    { k: "Coin", v: slotCoin(s) },
    { k: "Market", v: s.market ?? "—" },
    { k: "State", v: stateLabel(s) },
    { k: "Tracking", v: trackingLabel(s) },
    { k: "Decision", v: engineDecisionLabel(s) },
    { k: "Regime", v: regimeLabel(s) },
    { k: "Regime strength", v: s.regimeStrength != null ? String(s.regimeStrength) : "—" },
    { k: "Trend score", v: s.regimeTrendScore != null ? String(s.regimeTrendScore) : "—" },
    { k: "Breakout ready", v: s.consolidationBreakoutReady == null ? "—" : s.consolidationBreakoutReady ? "YES" : "NO" },
    { k: "Entry", v: effectiveEntryLabel(s) },
    { k: "Now", v: effectiveNowLabel(s) },
    { k: "Spread", v: pctNum(s.nowSpreadPct) },
    { k: "Net", v: pctNum(s.netPct) },
    { k: "Gross", v: pctNum(s.grossPct) },
    { k: "Unit", v: moneyAud(s.unitAud) },
    { k: "Cycles", v: String(s.cycles ?? 0) },
    { k: "Lifetime net", v: pctNum(s.lifetimeNetPct) },
    { k: "Drawdown", v: pctNum(s.drawdownPct) },
    { k: "Lock", v: lockDisplay(s) },
    { k: "Last seen", v: s.lastSeenAt ? ageLabel(nowMs - s.lastSeenAt) : "—" },
  ];
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
  const [section, setSection] = useState<Section>("overview");
  const [eventsOpen, setEventsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [expandedLedgerSlotId, setExpandedLedgerSlotId] = useState<string | null>(null);

  const [nowMs, setNowMs] = useState(() => Date.now());
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);

  const pollRef = useRef<number | null>(null);

  const fetchRows = useCallback(
    async (signal?: AbortSignal) => {
      const endpoint = feed === "watch" ? "aud" : feed;
      const r = await fetch(`${BASE}/api/market/${endpoint}`, { method: "GET", signal });
      if (!r.ok) throw new Error(`market/${endpoint} HTTP ${r.status}`);
      const j = await r.json();
      return Array.isArray(j?.rows) ? (j.rows as MarketRow[]) : [];
    },
    [BASE, feed]
  );

  const fetchSnap = useCallback(
    async (signal?: AbortSignal) => {
      const r = await fetch(`${BASE}/api/market/snapshot`, { method: "GET", signal });
      if (!r.ok) throw new Error(`market/snapshot HTTP ${r.status}`);
      const j = await r.json();
      return (j?.snapshot ?? j) as Snapshot;
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

    void tick();
    pollRef.current = window.setInterval(() => {
      void tick();
    }, 2500);

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

  const filteredMarketRows = useMemo(() => {
    const q = query.trim().toUpperCase();
    const watchSet = new Set((snap?.watch ?? []).map((c) => String(c).toUpperCase()));
    let list = rows.slice();

    if (feed === "watch") {
      list = list.filter((r) => watchSet.has(String(r.coin).toUpperCase()));
    }

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
  }, [feed, query, rows, snap?.watch, sortDir, sortKey]);

  const filteredSlots = useMemo(() => {
    const q = query.trim().toUpperCase();
    let list = slotRows.slice();

    if (q) {
      list = list.filter((s) => {
        const fields = [
          s.coin ?? "",
          s.market ?? "",
          s.id ?? "",
          s.trackingState ?? "",
          s.subslotState ?? "",
          s.rotationStage ?? "",
          s.regime ?? "",
          s.consolidationState ?? "",
        ];

        return fields.some((x) => String(x).toUpperCase().includes(q));
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

  const prioritizedSlots = useMemo(() => {
  const score = (s: SlotRow) => {
    if (isHoldingFamilyState(s.state)) return 5;
    if (String(s.subslotState || "").toUpperCase() === "ACTIVE") return 4;
    if (String(s.subslotState || "").toUpperCase() === "BUY_SUBMITTED") return 3;
    if (String(s.trackingState || "").toUpperCase() === "REVERSAL_CONFIRMING") return 2;
    if (String(s.trackingState || "").toUpperCase() === "TRACKING") return 1;
    return 0;
  };

  return [...filteredSlots].sort((a, b) => score(b) - score(a));
}, [filteredSlots]);

const carouselSlot = useMemo(() => {
  if (!prioritizedSlots.length) return null;
  return prioritizedSlots[Math.max(0, Math.min(carouselIndex, prioritizedSlots.length - 1))] ?? null;
}, [prioritizedSlots, carouselIndex]);

  useEffect(() => {
  if (!prioritizedSlots.length) {
    setCarouselIndex(0);
    return;
  }
  if (carouselIndex > prioritizedSlots.length - 1) {
    setCarouselIndex(0);
  }
}, [prioritizedSlots.length, carouselIndex]);

  useEffect(() => {
  if (!prioritizedSlots.length || carouselPaused) return;

  const t = window.setInterval(() => {
    setCarouselIndex((i) => (i + 1) % prioritizedSlots.length);
  }, CAROUSEL_INTERVAL_MS);

  return () => window.clearInterval(t);
}, [prioritizedSlots.length, carouselPaused]);

  const selectedSlot = useMemo(
    () => slotRows.find((s) => s.id === selectedSlotId) ?? null,
    [slotRows, selectedSlotId]
  );

  const selectedSlotEvents = useMemo(() => {
    if (!selectedSlotId) return [];
    return events.filter((e) => e.slotId === selectedSlotId);
  }, [events, selectedSlotId]);

  const fixedAllowlist = meta?.fixedSlots?.allowlist ?? [];
  const fixedExpected = meta?.fixedSlots?.expected ?? fixedAllowlist.length;
  const fixedPresent = meta?.fixedSlots?.present ?? slotRows.length;
  const fixedMissing = meta?.fixedSlots?.missing ?? [];

  const executionMode = meta?.engine?.execution ?? "SIM";
  const architecture = meta?.engine?.architecture ?? "—";

  const counts = meta?.counts ?? {};
  const trackingStates = meta?.trackingStates ?? {};

  const windowHarvest = useMemo(() => parseWindowHarvestFromEvents(events), [events]);
  const slotFinancials = useMemo(() => computeSlotFinancials(slotRows), [slotRows]);

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

  const overviewCounts = useMemo(() => {
    const out = {
      bull: 0,
      bear: 0,
      consolidation: 0,
      breakoutReady: 0,
      waiting: 0,
      activeSubslots: 0,
    };

    for (const s of filteredSlots) {
      const regime = String(regimeLabel(s)).toUpperCase();
      if (regime.includes("UPTREND") || regime.includes("BULL")) out.bull += 1;
      if (regime.includes("DOWNTREND") || regime.includes("BEAR")) out.bear += 1;
      if (regime.includes("CONSOLIDATION")) out.consolidation += 1;
      if (s.consolidationBreakoutReady === true) out.breakoutReady += 1;
      if (String(s.state).toUpperCase() === "WAITING_ENTRY") out.waiting += 1;
      if (String(s.subslotState || "").toUpperCase() === "ACTIVE") out.activeSubslots += 1;
    }

    return out;
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
                  <div className="engine-sub">Fixed-slot market machine with public runtime proof.</div>

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
                    The frontend now prioritizes decision clarity first, raw diagnostics second.
                  </div>
                </aside>
              </header>

              <div className="engine-capture-grid" aria-label="Engine capture cards">
                <div className="engine-capture card machine-surface panel-frame">
                  <div className="cap-k">Estimated Open PnL</div>
                  <div className="cap-v">{moneyAud(slotFinancials.openPnl)}</div>
                  <div className="cap-sub">
                    <span>Window Harvest {moneyAud(windowHarvest.window)}</span>
                    <span>•</span>
                    <span>Visible Realized {moneyAud(slotFinancials.visibleRealized)}</span>
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

                <div className="engine-capture card machine-surface panel-frame">
                  <div className="cap-k">Breakout Ready</div>
                  <div className="cap-v">{overviewCounts.breakoutReady}</div>
                  <div className="cap-sub">
                    <span>Consolidation {overviewCounts.consolidation}</span>
                    <span>•</span>
                    <span>Active subslots {overviewCounts.activeSubslots}</span>
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
                    placeholder="Filter coins / states / regime…"
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
                      A public-facing explanation of what each fixed slot is doing right now.
                    </div>
                  </div>

                  <div className="engine-carousel-controls">
                    <button
                      type="button"
                      className="button ghost"
                      onClick={() =>
                        setCarouselIndex((i) =>
                          prioritizedSlots.length ? (i - 1 + prioritizedSlots.length) % prioritizedSlots.length : 0
                        )
                      }
                      aria-label="Previous JRD"
                    >
                      ←
                    </button>

                    <div className="engine-carousel-counter">
                      {prioritizedSlots.length ? `${carouselIndex + 1} / ${prioritizedSlots.length}` : "0 / 0"}
                    </div>

                    <button
                      type="button"
                      className="button ghost"
                      onClick={() =>
                        setCarouselIndex((i) => (prioritizedSlots.length ? (i + 1) % prioritizedSlots.length : 0))
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
                          <div className="engine-carousel-k">Market</div>
                          <div className={`engine-carousel-v ${regimeToneClass(carouselSlot)}`}>
                            {regimeLabel(carouselSlot)}
                          </div>
                        </div>

                        <div className="engine-carousel-metric">
                          <div className="engine-carousel-k">Decision</div>
                          <div className={`engine-carousel-v ${stateClassName(stateLabel(carouselSlot))}`}>
                            {engineDecisionLabel(carouselSlot)}
                          </div>
                        </div>

                        <div className="engine-carousel-metric">
                          <div className="engine-carousel-k">Position</div>
                          <div className={`engine-carousel-v ${stateClassName(stateLabel(carouselSlot))}`}>
                            {stateLabel(carouselSlot)}
                          </div>
                        </div>

                        <div className="engine-carousel-metric">
                          <div className="engine-carousel-k">Entry Phase</div>
                          <div className={`engine-carousel-v ${stateClassName(trackingLabel(carouselSlot))}`}>
                            {entryPhaseLabel(carouselSlot)}
                          </div>
                        </div>

                        <div className="engine-carousel-metric">
                          <div className="engine-carousel-k">Net</div>
                          <div className="engine-carousel-v">{pctNum(carouselSlot.netPct)}</div>
                        </div>

                        <div className="engine-carousel-metric">
                          <div className="engine-carousel-k">Spread</div>
                          <div className="engine-carousel-v">{pctNum(carouselSlot.nowSpreadPct)}</div>
                        </div>

                        <div className="engine-carousel-metric">
                          <div className="engine-carousel-k">Breakout</div>
                          <div className="engine-carousel-v">{breakoutLabel(carouselSlot)}</div>
                        </div>

                        <div className="engine-carousel-metric">
                          <div className="engine-carousel-k">Cycles</div>
                          <div className="engine-carousel-v">{carouselSlot.cycles ?? 0}</div>
                        </div>
                      </div>

                      <div className="engine-carousel-foot">
                        <span>{regimeSummary(carouselSlot)}</span>
                      </div>

                      <div className={`engine-subslot ${subslotToneClass(carouselSlot)}`}>
                        <div className="engine-subslot-head">
                          <span className="engine-subslot-title">{subslotModeLabel(carouselSlot)}</span>
                          <span className="engine-subslot-state">{subslotDecisionLabel(carouselSlot)}</span>
                        </div>

                        <div className="engine-subslot-copy">{subslotReasonLabel(carouselSlot)}</div>

                        {!isIdleSubslot(carouselSlot) ? (
                          <div className="engine-subslot-grid">
                            <div className="engine-subslot-item">
                              <div className="engine-subslot-k">Signal</div>
                              <div className="engine-subslot-v">{carouselSlot.subslotSignalState ?? "—"}</div>
                            </div>

                            <div className="engine-subslot-item">
                              <div className="engine-subslot-k">Confirm</div>
                              <div className="engine-subslot-v">
                                {carouselSlot.subslotConfirmTicks != null ? carouselSlot.subslotConfirmTicks : "—"}
                              </div>
                            </div>

                            <div className="engine-subslot-item">
                              <div className="engine-subslot-k">Bounce</div>
                              <div className="engine-subslot-v">{pctNum(carouselSlot.subslotBouncePct)}</div>
                            </div>

                            <div className="engine-subslot-item">
                              <div className="engine-subslot-k">EMA Gap</div>
                              <div className="engine-subslot-v">{pctNum(carouselSlot.subslotEmaGapPct)}</div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </button>

                    <div
                      className="engine-carousel-dots"
                      onMouseEnter={() => setCarouselPaused(true)}
                      onMouseLeave={() => setCarouselPaused(false)}
                    >
                      {prioritizedSlots.map((slot, idx) => (
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
                    <div className="bay-note">Public machine state, simplified for clarity.</div>
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
                        <div className="engine-telemetry-k">Consolidation</div>
                        <div className="engine-telemetry-v">{overviewCounts.consolidation}</div>
                        <div className="engine-telemetry-sub">
                          Breakout ready {overviewCounts.breakoutReady}
                        </div>
                      </div>

                      <div className="engine-telemetry-item">
                        <div className="engine-telemetry-k">Bull / Bear</div>
                        <div className="engine-telemetry-v">
                          {overviewCounts.bull} / {overviewCounts.bear}
                        </div>
                        <div className="engine-telemetry-sub">Trend classification</div>
                      </div>

                      <div className="engine-telemetry-item">
                        <div className="engine-telemetry-k">Tracking coins</div>
                        <div className="engine-telemetry-v">{trackingStates.TRACKING ?? 0}</div>
                        <div className="engine-telemetry-sub">{topTrackingCoins || "—"}</div>
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
                          <div className="engine-telemetry-k">Rotation</div>
                          <div className="engine-telemetry-v">{meta?.rotation?.mode ?? "—"}</div>
                          <div className="engine-telemetry-sub">
                            {meta?.rotation?.running ? "RUNNING" : "STOPPED"}
                          </div>
                        </div>

                        <div className="engine-telemetry-item">
                          <div className="engine-telemetry-k">Rotation Exec</div>
                          <div className="engine-telemetry-v">{meta?.rotationExecutor?.mode ?? "—"}</div>
                          <div className="engine-telemetry-sub">
                            {meta?.rotationExecutor?.running ? "RUNNING" : "STOPPED"}
                          </div>
                        </div>

                        <div className="engine-telemetry-item">
                          <div className="engine-telemetry-k">Top-up</div>
                          <div className="engine-telemetry-v">{meta?.topup?.mode ?? "—"}</div>
                          <div className="engine-telemetry-sub">
                            {meta?.topup?.running ? "RUNNING" : "STOPPED"}
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
                  className={`engine-section-tab ${section === "overview" ? "active" : ""}`}
                  onClick={() => setSection("overview")}
                >
                  Overview
                </button>

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

              {section === "overview" ? (
                <div className="card machine-surface panel-frame engine-ledger" aria-label="Overview cards">
                  <div className="engine-ledger-top">
                    <div>
                      <div className="engine-ledger-title">Decision Overview</div>
                      <div className="engine-ledger-note">
                        Every slot explained by market behavior, machine decision, and tactical capture status.
                      </div>
                    </div>
                  </div>

                  <div className="ledger-table">
                    <div className="ledger-head">
                      <div>Slot</div>
                      <div>Market</div>
                      <div>Decision</div>
                      <div>Position</div>
                      <div>Subslot</div>
                      <div className="num">Net</div>
                      <div className="num">Spread</div>
                      <div className="num">More</div>
                    </div>

                    {filteredSlots.length ? (
                      filteredSlots.map((s) => (
                        <button
                          type="button"
                          className="ledger-row"
                          key={s.id}
                          onClick={() => setSelectedSlotId(s.id)}
                        >
                          <div className="ledger-slotid">{s.id}</div>
                          <div className={regimeToneClass(s)}>{regimeLabel(s)}</div>
                          <div>{engineDecisionLabel(s)}</div>
                          <div className={stateClassName(stateLabel(s))}>{stateLabel(s)}</div>
                          <div className={subslotToneClass(s)}>{subslotDecisionLabel(s)}</div>
                          <div className="num">{pctNum(s.netPct)}</div>
                          <div className="num">{pctNum(s.nowSpreadPct)}</div>
                          <div className="num ledger-view">Open</div>
                        </button>
                      ))
                    ) : (
                      <div className="ledger-empty">No fixed slots available.</div>
                    )}
                  </div>
                </div>
              ) : null}

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
                          Click a row to expand the public proof layer. Open full details for diagnostics.
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
                        <div>Regime</div>
                        <div className="num">Unit</div>
                        <div className="num">Net</div>
                        <div className="num">More</div>
                      </div>

                      {filteredSlots.length ? (
                        filteredSlots.map((s) => {
                          const expanded = expandedLedgerSlotId === s.id;
                          const rows = detailRowsForSlot(s, nowMs);

                          return (
                            <div key={s.id} className={`ledger-entry ${expanded ? "is-expanded" : ""}`}>
                              <button
                                type="button"
                                className="ledger-row"
                                onClick={() =>
                                  setExpandedLedgerSlotId((prev) => (prev === s.id ? null : s.id))
                                }
                                title="Toggle detail layer"
                                aria-expanded={expanded}
                              >
                                <div className="ledger-slotid">{s.id}</div>
                                <div>{slotCoin(s)}</div>
                                <div>{s.market ?? "—"}</div>
                                <div className={stateClassName(stateLabel(s))}>{stateLabel(s)}</div>
                                <div className={regimeToneClass(s)}>{regimeLabel(s)}</div>
                                <div className="num">{moneyAud(s.unitAud)}</div>
                                <div className="num">{pctNum(s.netPct)}</div>
                                <div className="num ledger-view">{expanded ? "Hide" : "Show"}</div>
                              </button>

                              {expanded ? (
                                <div className="ledger-subpanel">
                                  <div className={`ledger-subpanel-badge ${regimeToneClass(s)}`}>
                                    {regimeSummary(s)}
                                  </div>

                                  <div className="ledger-subpanel-grid">
                                    {rows.map((row) => (
                                      <div key={row.k} className="ledger-subpanel-item">
                                        <div className="ledger-subpanel-k">{row.k}</div>
                                        <div className="ledger-subpanel-v">{row.v}</div>
                                      </div>
                                    ))}
                                  </div>

                                  <div className={`ledger-subpanel-badge ${subslotToneClass(s)}`}>
                                    {subslotModeLabel(s)} • {subslotDecisionLabel(s)}
                                  </div>

                                  <div className="ledger-subpanel-actions">
                                    <button
                                      type="button"
                                      className="button ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedSlotId(s.id);
                                      }}
                                    >
                                      Open Full Details
                                    </button>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          );
                        })
                      ) : (
                        <div className="ledger-empty">No fixed slots available.</div>
                      )}
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
                        This page presents the machine in public-facing language. Each Jeroid slot belongs to one fixed
                        market identity and independently waits, deploys, holds, exits, and re-enters under the same
                        rules.
                      </p>

                      <p>
                        <strong>Market</strong> shows the detected regime.
                        <br />
                        <strong>Decision</strong> shows what the engine is doing with that regime.
                        <br />
                        <strong>Position</strong> shows the parent slot lifecycle.
                        <br />
                        <strong>Subslot</strong> shows the tactical capture layer inside the hold window.
                      </p>

                      <div className="engine-about-h">Machine order</div>
                      <ul>
                        <li>Harvester maintains the fixed slot registry.</li>
                        <li>Executor evaluates each slot’s own coin only.</li>
                        <li>Manager controls hold, lock, exit, subslot logic, and regime interpretation.</li>
                        <li>Rotation remains a separate capital-handling layer.</li>
                        <li>Ledger persists public machine proof for inspection.</li>
                      </ul>

                      <div className="engine-about-h">Key truths</div>
                      <ul>
                        <li>Slot identity is permanent coin identity.</li>
                        <li>Open parent PnL is floating and not harvested.</li>
                        <li>Subslot PnL remains separate until merge on parent reset.</li>
                        <li>Window harvest reflects recent realized event flow only.</li>
                        <li>External transfers are excluded from displayed totals.</li>
                        <li>The UI is now organized for clarity first and diagnostics second.</li>
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
          className="slot-modal-layer"
          role="dialog"
          aria-modal="true"
          aria-label="Slot Details"
          onClick={() => setSelectedSlotId(null)}
        >
          <div className="slot-modal-backdrop" aria-hidden="true" />

          <div
            className="slot-modal-panel card machine-surface panel-frame"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="slot-modal-close"
              aria-label="Close slot details"
              onClick={() => setSelectedSlotId(null)}
            >
              ×
            </button>

            <div className="slot-modal-scroll">
              <div className="slot-modal-top">
                <div>
                  <div className="slot-modal-id">{selectedSlot.id}</div>
                  <div className="slot-modal-sub">
                    {slotCoin(selectedSlot)} • {selectedSlot.market ?? "—"} •{" "}
                    <span className={stateClassName(stateLabel(selectedSlot))}>{stateLabel(selectedSlot)}</span> •{" "}
                    <span className={regimeToneClass(selectedSlot)}>{regimeLabel(selectedSlot)}</span>
                  </div>
                </div>

                <div className="slot-modal-meta">
                  <span className="slot-modal-chip">Esc to close</span>
                  <span className="slot-modal-chip">Diagnostic Chamber</span>
                </div>
              </div>

              <div className="slot-section">Decision Summary</div>

              <div className="slot-modal-grid">
                <div>
                  <div className="slot-k">Market</div>
                  <div className={`slot-v ${regimeToneClass(selectedSlot)}`}>{regimeLabel(selectedSlot)}</div>
                </div>
                <div>
                  <div className="slot-k">Decision</div>
                  <div className="slot-v">{engineDecisionLabel(selectedSlot)}</div>
                </div>
                <div>
                  <div className="slot-k">Position</div>
                  <div className={`slot-v ${stateClassName(stateLabel(selectedSlot))}`}>{stateLabel(selectedSlot)}</div>
                </div>
                <div>
                  <div className="slot-k">Entry Phase</div>
                  <div className={`slot-v ${stateClassName(trackingLabel(selectedSlot))}`}>
                    {entryPhaseLabel(selectedSlot)}
                  </div>
                </div>
                <div>
                  <div className="slot-k">Regime Strength</div>
                  <div className="slot-v">
                    {selectedSlot.regimeStrength != null ? selectedSlot.regimeStrength : "—"}
                  </div>
                </div>
                <div>
                  <div className="slot-k">Trend Score</div>
                  <div className="slot-v">
                    {selectedSlot.regimeTrendScore != null ? selectedSlot.regimeTrendScore : "—"}
                  </div>
                </div>
                <div>
                  <div className="slot-k">Flip Count</div>
                  <div className="slot-v">
                    {selectedSlot.regimeFlipCount != null ? selectedSlot.regimeFlipCount : "—"}
                  </div>
                </div>
                <div>
                  <div className="slot-k">Breakout Ready</div>
                  <div className="slot-v">{breakoutLabel(selectedSlot)}</div>
                </div>
                <div>
                  <div className="slot-k">Consolidation State</div>
                  <div className="slot-v">{selectedSlot.consolidationState ?? "—"}</div>
                </div>
                <div>
                  <div className="slot-k">Consolidation Range</div>
                  <div className="slot-v">{pctNum(selectedSlot.consolidationRangePct)}</div>
                </div>
                <div>
                  <div className="slot-k">Compression Score</div>
                  <div className="slot-v">
                    {selectedSlot.consolidationCompressionScore != null
                      ? selectedSlot.consolidationCompressionScore
                      : "—"}
                  </div>
                </div>
                <div>
                  <div className="slot-k">Decision Note</div>
                  <div className="slot-v">{describeDecision(selectedSlot)}</div>
                </div>
              </div>

              <div className="slot-section">Core Metrics</div>

              <div className="slot-modal-grid">
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
                  <div className="slot-k">Lock</div>
                  <div className="slot-v">{lockDisplay(selectedSlot)}</div>
                </div>
                <div>
                  <div className="slot-k">Spread</div>
                  <div className="slot-v">{pctNum(selectedSlot.nowSpreadPct)}</div>
                </div>
                <div>
                  <div className="slot-k">Drawdown</div>
                  <div className="slot-v">{pctNum(selectedSlot.drawdownPct)}</div>
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

              <div className="slot-modal-grid">
                <div>
                  <div className="slot-k">Mode</div>
                  <div className={`slot-v slot-subslot ${subslotToneClass(selectedSlot)}`}>
                    {subslotModeLabel(selectedSlot)}
                  </div>
                </div>
                <div>
                  <div className="slot-k">Decision</div>
                  <div className={`slot-v slot-subslot ${subslotToneClass(selectedSlot)}`}>
                    {subslotDecisionLabel(selectedSlot)}
                  </div>
                </div>
                <div>
                  <div className="slot-k">State</div>
                  <div className="slot-v">{selectedSlot.subslotState ?? "—"}</div>
                </div>
                <div>
                  <div className="slot-k">Signal</div>
                  <div className="slot-v">{selectedSlot.subslotSignalState ?? "—"}</div>
                </div>
                <div>
                  <div className="slot-k">Confirm Ticks</div>
                  <div className="slot-v">
                    {selectedSlot.subslotConfirmTicks != null ? selectedSlot.subslotConfirmTicks : "—"}
                  </div>
                </div>
                <div>
                  <div className="slot-k">Bounce</div>
                  <div className="slot-v">{pctNum(selectedSlot.subslotBouncePct)}</div>
                </div>
                <div>
                  <div className="slot-k">EMA Gap</div>
                  <div className="slot-v">{pctNum(selectedSlot.subslotEmaGapPct)}</div>
                </div>
                <div>
                  <div className="slot-k">Requested AUD</div>
                  <div className="slot-v">{moneyAud(selectedSlot.subslotRequestedAud)}</div>
                </div>
                <div>
                  <div className="slot-k">Actual AUD</div>
                  <div className="slot-v">{moneyAud(selectedSlot.subslotActualAud)}</div>
                </div>
                <div>
                  <div className="slot-k">Requested Qty</div>
                  <div className="slot-v">{fmt(selectedSlot.subslotRequestedCoinQty)}</div>
                </div>
                <div>
                  <div className="slot-k">Actual Qty</div>
                  <div className="slot-v">{fmt(selectedSlot.subslotActualCoinQty)}</div>
                </div>
                <div>
                  <div className="slot-k">Submitted Rate</div>
                  <div className="slot-v">{fmt(selectedSlot.subslotSubmittedRate)}</div>
                </div>
                <div>
                  <div className="slot-k">Actual Rate</div>
                  <div className="slot-v">{fmt(selectedSlot.subslotActualRate)}</div>
                </div>
                <div>
                  <div className="slot-k">Subslot Gross</div>
                  <div className="slot-v">{pctNum(selectedSlot.subslotGrossPct)}</div>
                </div>
                <div>
                  <div className="slot-k">Subslot Net</div>
                  <div className="slot-v">{pctNum(selectedSlot.subslotNetPct)}</div>
                </div>
                <div>
                  <div className="slot-k">Peak Bid</div>
                  <div className="slot-v">{fmt(selectedSlot.subslotPeakBid)}</div>
                </div>
                <div>
                  <div className="slot-k">Drawdown</div>
                  <div className="slot-v">{pctNum(selectedSlot.subslotDrawdownPct)}</div>
                </div>
                <div>
                  <div className="slot-k">Exit Reason</div>
                  <div className="slot-v">{selectedSlot.subslotExitReason ?? "—"}</div>
                </div>
                <div>
                  <div className="slot-k">Profit AUD</div>
                  <div className="slot-v">{moneyAud(selectedSlot.subslotProfitAud)}</div>
                </div>
                <div>
                  <div className="slot-k">Profit %</div>
                  <div className="slot-v">{pctNum(selectedSlot.subslotProfitPct)}</div>
                </div>
                <div>
                  <div className="slot-k">Pending Merge</div>
                  <div className="slot-v">{moneyAud(selectedSlot.subslotPendingMergeAud)}</div>
                </div>
                <div>
                  <div className="slot-k">Last Merged</div>
                  <div className="slot-v">{moneyAud(selectedSlot.subslotLastMergedAud)}</div>
                </div>
                <div>
                  <div className="slot-k">Lifetime Profit</div>
                  <div className="slot-v">{moneyAud(selectedSlot.subslotLifetimeProfitAud)}</div>
                </div>
                <div>
                  <div className="slot-k">Lifetime Cycles</div>
                  <div className="slot-v">{selectedSlot.subslotLifetimeCycles ?? 0}</div>
                </div>
                <div>
                  <div className="slot-k">Last Reconcile</div>
                  <div className="slot-v">
                    {selectedSlot.subslotLastReconcileAt
                      ? ageLabel(nowMs - selectedSlot.subslotLastReconcileAt)
                      : "—"}
                  </div>
                </div>
                <div>
                  <div className="slot-k">Reconcile Note</div>
                  <div className="slot-v">{selectedSlot.subslotLastReconcileNote ?? "—"}</div>
                </div>
                <div>
                  <div className="slot-k">Last Error</div>
                  <div className="slot-v">{selectedSlot.subslotLastError ?? "—"}</div>
                </div>
              </div>

              <div className="slot-section">Tracking Snapshot</div>

              <div className="slot-modal-grid">
                <div>
                  <div className="slot-k">Tracking State</div>
                  <div className={`slot-v ${stateClassName(trackingLabel(selectedSlot))}`}>
                    {trackingLabel(selectedSlot)}
                  </div>
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
                  <div className="slot-k">Candidate Spread</div>
                  <div className="slot-v">
                    {pctNum(selectedSlot.nowSpreadPct ?? selectedSlot.candidateSpreadPrevPct)}
                  </div>
                </div>
              </div>

              {(selectedSlot.rotationReservationId ||
                selectedSlot.rotationStage ||
                selectedSlot.rotationEligibleOut != null ||
                selectedSlot.rotationEligibleIn != null) && (
                <>
                  <div className="slot-section">Rotation Snapshot</div>

                  <div className="slot-modal-grid">
                    <div>
                      <div className="slot-k">Reservation</div>
                      <div className="slot-v">{selectedSlot.rotationReservationId ?? "—"}</div>
                    </div>
                    <div>
                      <div className="slot-k">Role</div>
                      <div className="slot-v">{selectedSlot.rotationRole ?? "—"}</div>
                    </div>
                    <div>
                      <div className="slot-k">Stage</div>
                      <div className="slot-v">{selectedSlot.rotationStage ?? "—"}</div>
                    </div>
                    <div>
                      <div className="slot-k">Linked Slot</div>
                      <div className="slot-v">{selectedSlot.rotationLinkedSlotId ?? "—"}</div>
                    </div>
                    <div>
                      <div className="slot-k">Eligible Out</div>
                      <div className="slot-v">
                        {selectedSlot.rotationEligibleOut == null
                          ? "—"
                          : selectedSlot.rotationEligibleOut
                          ? "YES"
                          : "NO"}
                      </div>
                    </div>
                    <div>
                      <div className="slot-k">Eligible In</div>
                      <div className="slot-v">
                        {selectedSlot.rotationEligibleIn == null
                          ? "—"
                          : selectedSlot.rotationEligibleIn
                          ? "YES"
                          : "NO"}
                      </div>
                    </div>
                    <div>
                      <div className="slot-k">Edge Score</div>
                      <div className="slot-v">{fmt(selectedSlot.rotationEdgeScore)}</div>
                    </div>
                    <div>
                      <div className="slot-k">Released AUD</div>
                      <div className="slot-v">{moneyAud(selectedSlot.rotationReleasedAud)}</div>
                    </div>
                    <div>
                      <div className="slot-k">Funding Reserved</div>
                      <div className="slot-v">{moneyAud(selectedSlot.rotationFundingReservedAud)}</div>
                    </div>
                    <div>
                      <div className="slot-k">Funding Transferred</div>
                      <div className="slot-v">{moneyAud(selectedSlot.rotationFundingTransferredAud)}</div>
                    </div>
                    <div>
                      <div className="slot-k">Reason</div>
                      <div className="slot-v">{selectedSlot.rotationReason ?? "—"}</div>
                    </div>
                    <div>
                      <div className="slot-k">Last Error</div>
                      <div className="slot-v">{selectedSlot.rotationLastError ?? "—"}</div>
                    </div>
                  </div>
                </>
              )}

              {(selectedSlot.topupMode ||
                selectedSlot.topupLastAppliedAt ||
                selectedSlot.topupRequestedTargetAud != null) && (
                <>
                  <div className="slot-section">Top-up Snapshot</div>

                  <div className="slot-modal-grid">
                    <div>
                      <div className="slot-k">Mode</div>
                      <div className="slot-v">{selectedSlot.topupMode ?? "—"}</div>
                    </div>
                    <div>
                      <div className="slot-k">Requested Target</div>
                      <div className="slot-v">{moneyAud(selectedSlot.topupRequestedTargetAud)}</div>
                    </div>
                    <div>
                      <div className="slot-k">Last Target</div>
                      <div className="slot-v">{moneyAud(selectedSlot.topupLastTargetAud)}</div>
                    </div>
                    <div>
                      <div className="slot-k">Fallback AUD</div>
                      <div className="slot-v">{moneyAud(selectedSlot.topupFallbackAud)}</div>
                    </div>
                    <div>
                      <div className="slot-k">Last Delta</div>
                      <div className="slot-v">{moneyAud(selectedSlot.topupLastDeltaAud)}</div>
                    </div>
                    <div>
                      <div className="slot-k">Last Applied</div>
                      <div className="slot-v">
                        {selectedSlot.topupLastAppliedAt
                          ? ageLabel(nowMs - selectedSlot.topupLastAppliedAt)
                          : "—"}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {(selectedSlot.entryDrawdownPct != null ||
                selectedSlot.entryBouncePct != null ||
                selectedSlot.entryEmaGapPct != null ||
                selectedSlot.entryScore != null) && (
                <>
                  <div className="slot-section">Entry Context</div>

                  <div className="slot-modal-grid">
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

                  <div className="slot-modal-grid">
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
                        <span className="event-kind">{e.kind}</span>{" "}
                        <span className="event-text">{e.msg}</span>
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
                <div>Market regime now leads the explanation layer.</div>
                <div>Parent slot and tactical subslot remain separate accounting layers.</div>
                <div>Deploy, hold, lock, exit, and re-entry decisions remain deterministic.</div>
                <div className="slot-rules-note">
                  This slot is part of the fixed-slot Jeroid ledger, not a selector pool.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}