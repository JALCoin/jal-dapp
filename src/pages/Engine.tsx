import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  coin: string | null;
  market?: string;
  state: SlotState;
  trackingState?: TrackingState | null;
  unitAud: number;

  entryMid: number | null;
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

  // **New**: To track multiple subslots in a parent slot
  subslots?: SlotRow[] | null; // Array of subslots for the parent slot

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

  [key: string]: unknown;
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

type WorkerStatus = {
  ok?: boolean;
  running?: boolean;
  mode?: string;
  [key: string]: unknown;
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
  harvester?: WorkerStatus;
  executor?: WorkerStatus;
  manager?: WorkerStatus;
  rotation?: WorkerStatus;
  rotationExecutor?: WorkerStatus;
  topup?: WorkerStatus;
  market?: { snapshot?: Snapshot | null };
};

type PublicEventsResponse = { ok: boolean; ts: number; rows: SlotEvent[] };
type PublicSlotsResponse = { ok: boolean; ts: number; rows: SlotRow[] };

type EngineData = {
  rows: MarketRow[];
  snap: Snapshot | null;
  meta: PublicMetaResponse | null;
  slotRows: SlotRow[];
  events: SlotEvent[];
  err: string | null;
  refresh: () => Promise<void>;
};

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
  const raw = (import.meta as { env?: Record<string, string | boolean> }).env?.VITE_ENGINE_SERVICE_URL;
  if (typeof raw === "string" && raw.trim().length) return normalizeBase(raw.trim());
  const isProd = Boolean((import.meta as { env?: Record<string, string | boolean> }).env?.PROD);
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

function isTrackingFamilyState(state: string | null | undefined) {
  const s = String(state || "").toUpperCase();
  return (
    s === "TRACKING" ||
    s === "ARMED" ||
    s === "DRAWDOWN_SEEN" ||
    s === "REVERSAL_CONFIRMING" ||
    s === "DEPLOYING" ||
    s === "BUY_SUBMITTING" ||
    s === "BUY_SUBMITTED" ||
    s === "BUY_LOCK_SUBMITTED" ||
    s === "SELL_SUBMITTED" ||
    s === "SPREAD_BLOCKED" ||
    s === "NO_MARKET"
  );
}

function slotHeartbeatLabel(s: SlotRow, nowMs: number) {
  if (s.updatedAt && Number.isFinite(s.updatedAt)) {
    return ageLabel(nowMs - s.updatedAt);
  }
  if (s.lastSeenAt && Number.isFinite(s.lastSeenAt)) {
    return ageLabel(nowMs - s.lastSeenAt);
  }
  return "—";
}

function subslotLiveNowLabel(s: SlotRow) {
  if (s.subslotNowMid != null && Number.isFinite(s.subslotNowMid)) return fmt(s.subslotNowMid);
  if (s.nowMid != null && Number.isFinite(s.nowMid)) return fmt(s.nowMid);
  return "—";
}

function subslotHeartbeatLabel(s: SlotRow, nowMs: number) {
  if (s.updatedAt && Number.isFinite(s.updatedAt)) {
    return ageLabel(nowMs - s.updatedAt);
  }
  if (s.subslotLastReconcileAt && Number.isFinite(s.subslotLastReconcileAt)) {
    return ageLabel(nowMs - s.subslotLastReconcileAt);
  }
  return "—";
}

function computeSlotFinancials(slotRows: SlotRow[]) {
  let openPnl = 0;
  let visibleRealized = 0;

  for (const s of slotRows) {
    const baseAud = Number(s.combinedEntryAud ?? s.entryAud ?? s.unitAud);
    const netPct = Number(s.netPct);
    const parentProfitAud = Number(s.profitAud);
    const subslotProfitAud = Number(s.subslotProfitAud);

    if (isHoldingFamilyState(s.state) && Number.isFinite(baseAud) && Number.isFinite(netPct)) {
      openPnl += baseAud * (netPct / 100);
    }

    if (Number.isFinite(parentProfitAud)) {
      visibleRealized += parentProfitAud;
    }

    if (Number.isFinite(subslotProfitAud)) {
      visibleRealized += subslotProfitAud;  // Adding subslot profit to total
    }

    // If subslots exist, accumulate their financials
    if (s.subslots) {
      for (const subslot of s.subslots) {
        const subslotProfit = Number(subslot.subslotProfitAud);
        if (Number.isFinite(subslotProfit)) {
          visibleRealized += subslotProfit;
        }
      }
    }
  }

  return {
    openPnl: roundMoney(openPnl),
    visibleRealized: roundMoney(visibleRealized),
  };
}

function stateClassName(value: string | null | undefined) {
  const normalized = String(value || "").toUpperCase().replace(/_/g, "-");
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

function regimeLabel(s: SlotRow): string {
  return (s.regime ?? s.consolidationState ?? "UNCLASSIFIED") as string;
}

function regimeToneClass(s: SlotRow): string {
  const regime = regimeLabel(s).toUpperCase();

  if (regime.includes("UPTREND") || regime.includes("BULL")) return "is-holding";
  if (regime.includes("DOWNTREND") || regime.includes("BEAR")) return "is-exiting";
  if (regime.includes("CONSOLIDATION")) return "is-tracking";
  return "is-muted";
}

function regimeSummary(s: SlotRow): string {
  const regime = regimeLabel(s).toUpperCase();
  const breakout = s.consolidationBreakoutReady === true;

  switch (regime) {
    case "UPTREND":
      return "Trend pressure is upward.";

    case "DOWNTREND":
      return "Trend pressure is downward.";

    case "CONSOLIDATION_BULL":
      return breakout
        ? "Bullish compression with breakout readiness."
        : "Bullish compression, still waiting for release.";

    case "CONSOLIDATION_BEAR":
      return breakout
        ? "Bearish compression with breakdown readiness."
        : "Bearish compression, still waiting for release.";

    default:
      return regime.includes("CONSOLIDATION")
        ? "Compression detected. Waiting for direction."
        : "Market behavior still being classified.";
  }
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

function liveParentAnalysis(s: SlotRow, nowMs: number) {
  const parts: string[] = [];

  const nowMid = s.nowMid;
  const netPct = s.netPct;
  const spreadPct = s.nowSpreadPct;
  const dd = s.drawdownPct;
  const breakout = s.consolidationBreakoutReady === true;
  const tracking = String(s.trackingState || "").toUpperCase();
  const state = String(s.state || "").toUpperCase();
  const regime = String(regimeLabel(s)).toUpperCase();
  const updated = slotHeartbeatLabel(s, nowMs);

  // Parent State Analysis
  if (state === "EXITING") {
    parts.push("Parent exit is being resolved live.");
  } else if (state === "DEPLOYING") {
    parts.push("Parent entry is being confirmed live.");
  } else if (state === "LVL4_TRAIL") {
    parts.push("Parent is in high-protection trailing mode.");
  } else if (isHoldingFamilyState(state)) {
    parts.push("Parent position is live and being managed.");
  } else if (state === "WAITING_ENTRY") {
    parts.push("Parent is waiting for a qualified re-entry.");
  } else {
    parts.push("Parent slot is being observed.");
  }

  // Parent Mid Price
  if (Number.isFinite(nowMid)) {
    parts.push(`Now ${fmt(nowMid)}.`);
  }

  // Net Percentage Calculation
  if (Number.isFinite(netPct)) {
    if (Number(netPct) > 0) parts.push(`Net is green at ${pctNum(netPct)}.`);
    else if (Number(netPct) < 0) parts.push(`Net is red at ${pctNum(netPct)}.`);
    else parts.push(`Net is flat at ${pctNum(netPct)}.`);
  }

  // Spread and Drawdown
  if (Number.isFinite(spreadPct)) {
    parts.push(`Spread is ${pctNum(spreadPct)}.`);
  }

  if (Number.isFinite(dd)) {
    parts.push(`Drawdown is ${pctNum(dd)}.`);
  }

  // Tracking Analysis
  if (tracking === "REVERSAL_CONFIRMING") {
    parts.push("Reversal confirmation is building.");
  } else if (tracking === "DRAWDOWN_SEEN") {
    parts.push("A drawdown has been detected.");
  } else if (tracking === "TRACKING") {
    parts.push("Tracking structure is still forming.");
  } else if (tracking === "SPREAD_BLOCKED") {
    parts.push("Spread is blocking action.");
  }

  // Regime Analysis
  if (regime.includes("CONSOLIDATION")) {
    parts.push(
      breakout
        ? "Compression is ready to break."
        : "Compression is still building."
    );
  } else if (regime.includes("UPTREND") || regime.includes("BULL")) {
    parts.push("Trend pressure remains upward.");
  } else if (regime.includes("DOWNTREND") || regime.includes("BEAR")) {
    parts.push("Trend pressure remains downward.");
  }

  // Updated Time
  if (updated !== "—") {
    parts.push(`Updated ${updated} ago.`);
  }

  return parts.join(" ");
}

function liveSubslotAnalysis(s: SlotRow, nowMs: number) {
  const parts: string[] = [];

  const subState = String(s.subslotState || "").toUpperCase();
  const signal = String(s.subslotSignalState || "").toUpperCase();
  const netPct = s.subslotNetPct;
  const bouncePct = s.subslotBouncePct;
  const emaGapPct = s.subslotEmaGapPct;
  const liveNow = s.subslotNowMid ?? s.nowMid;
  const updated = subslotHeartbeatLabel(s, nowMs);

  // Subslot State Analysis
  if (subState === "BUY_SUBMITTED") {
    parts.push("Subslot entry is pending.");
  } else if (subState === "ACTIVE") {
    parts.push("Subslot trade is live.");
  } else if (subState === "SELL_SUBMITTED") {
    parts.push("Subslot exit is pending.");
  } else if (subState === "CLOSED") {
    parts.push("Subslot is closed.");
  } else {
    parts.push("Subslot is idle.");
  }

  // Signal Analysis
  if (signal === "REVERSAL_CONFIRMING") {
    parts.push("Signal is confirming.");
  } else if (signal === "BOUNCE_SEEN") {
    parts.push("Bounce has been detected.");
  } else if (signal === "TRACKING") {
    parts.push("Subslot is tracking structure.");
  } else if (signal === "ARMED") {
    parts.push("Subslot is armed.");
  } else if (signal === "SPREAD_BLOCKED") {
    parts.push("Subslot is blocked by spread.");
  } else if (signal === "NO_MARKET") {
    parts.push("No usable live market read.");
  }

  // Subslot Live Price
  if (Number.isFinite(liveNow)) {
    parts.push(`Live now ${fmt(liveNow)}.`);
  }

  // Subslot Net Percentage Calculation
  if (Number.isFinite(netPct)) {
    if (Number(netPct) > 0) parts.push(`Subslot net is green at ${pctNum(netPct)}.`);
    else if (Number(netPct) < 0) parts.push(`Subslot net is red at ${pctNum(netPct)}.`);
    else parts.push(`Subslot net is flat at ${pctNum(netPct)}.`);
  }

  // Bounce and EMA Gap Analysis
  if (Number.isFinite(bouncePct)) {
    parts.push(`Bounce is ${pctNum(bouncePct)}.`);
  }

  if (Number.isFinite(emaGapPct)) {
    parts.push(`EMA gap is ${pctNum(emaGapPct)}.`);
  }

  // Updated Time
  if (updated !== "—") {
    parts.push(`Updated ${updated} ago.`);
  }

  return parts.join(" ");
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
    { k: "Updated", v: slotHeartbeatLabel(s, nowMs) },
  ];
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
    else mq.addListener(onChange);

    return () => {
      if (typeof mq.removeEventListener === "function") mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, [bpPx]);

  return isDesktop;
}

function sortMarketRows(rows: MarketRow[], sortKey: SortKey, sortDir: SortDir) {
  const dir = sortDir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const midA = a.mid ?? (a.bid + a.ask) / 2;
    const midB = b.mid ?? (b.bid + b.ask) / 2;
    const spreadA = a.spreadPct ?? (((a.ask - a.bid) / Math.max(midA, 1e-9)) * 100);
    const spreadB = b.spreadPct ?? (((b.ask - b.bid) / Math.max(midB, 1e-9)) * 100);

    if (sortKey === "coin") return a.coin.localeCompare(b.coin) * dir;
    if (sortKey === "mid") return (midA - midB) * dir;
    return (spreadA - spreadB) * dir;
  });
}

function derivePriorityScore(s: SlotRow) {
  if (String(s.state || "").toUpperCase() === "EXITING") return 100;
  if (String(s.state || "").toUpperCase() === "DEPLOYING") return 95;
  if (String(s.subslotState || "").toUpperCase() === "SELL_SUBMITTED") return 90;
  if (String(s.subslotState || "").toUpperCase() === "BUY_SUBMITTED") return 85;
  if (String(s.subslotState || "").toUpperCase() === "ACTIVE") return 80;
  if (String(s.state || "").toUpperCase() === "LVL4_TRAIL") return 75;
  if (isHoldingFamilyState(s.state)) return 70;
  if (String(s.trackingState || "").toUpperCase() === "REVERSAL_CONFIRMING") return 60;
  if (s.consolidationBreakoutReady === true) return 55;
  if (String(s.trackingState || "").toUpperCase() === "TRACKING") return 40;
  if (String(s.trackingState || "").toUpperCase() === "DRAWDOWN_SEEN") return 35;
  return 10;
}

function priorityRailLabel(s: SlotRow) {
  if (String(s.state || "").toUpperCase() === "EXITING") return "EXITING";
  if (String(s.state || "").toUpperCase() === "DEPLOYING") return "ENTERING";
  if (String(s.subslotState || "").toUpperCase() === "ACTIVE") return "TACTICAL ACTIVE";
  if (String(s.subslotState || "").toUpperCase() === "BUY_SUBMITTED") return "TACTICAL ENTRY";
  if (String(s.subslotState || "").toUpperCase() === "SELL_SUBMITTED") return "TACTICAL EXIT";
  if (String(s.state || "").toUpperCase() === "LVL4_TRAIL") return "TRAILING";
  if (isHoldingFamilyState(s.state)) return "HOLDING";
  if (String(s.trackingState || "").toUpperCase() === "REVERSAL_CONFIRMING") return "REVERSAL";
  if (s.consolidationBreakoutReady === true) return "BREAKOUT READY";
  if (String(s.trackingState || "").toUpperCase() === "TRACKING") return "TRACKING";
  return "WATCHING";
}

function slotHealthLabel(s: SlotRow) {
  const state = String(s.state || "").toUpperCase();
  const tracking = String(s.trackingState || "").toUpperCase();
  const spread = Number(s.nowSpreadPct);

  if (state === "EXITING") return "RESOLVING EXIT";
  if (state === "DEPLOYING") return "CONFIRMING ENTRY";
  if (state === "LVL4_TRAIL") return "HIGH STRUCTURE";
  if (isHoldingFamilyState(state) && Number(s.netPct) > 0) return "PROTECTED";
  if (String(s.subslotState || "").toUpperCase() === "ACTIVE") return "TACTICAL LIVE";
  if (tracking === "REVERSAL_CONFIRMING") return "BUILDING";
  if (s.consolidationBreakoutReady === true) return "READY";
  if (tracking === "SPREAD_BLOCKED" || (Number.isFinite(spread) && spread > 1.5)) return "UNDER FRICTION";
  if (tracking === "NO_MARKET") return "NO MARKET";
  return "OBSERVING";
}

function getActiveTrackingCount(trackingStates: Record<string, number>) {
  return Object.entries(trackingStates).reduce((sum, [k, v]) => {
    return isTrackingFamilyState(k) ? sum + Number(v || 0) : sum;
  }, 0);
}

function getActiveTrackingCoins(slots: SlotRow[]) {
  return slots
    .filter((s) => isTrackingFamilyState(s.trackingState))
    .map((s) => s.coin)
    .filter(Boolean)
    .slice(0, 6)
    .join(", ");
}

function computeWindowHarvestFromSlots(slotRows: SlotRow[]) {
  let parentRealized = 0;
  let subslotRealized = 0;

  for (const s of slotRows) {
    const parent = Number(s.profitAud);
    const subslot = Number(s.subslotProfitAud);

    if (Number.isFinite(parent)) parentRealized += parent;
    if (Number.isFinite(subslot)) subslotRealized += subslot;
  }

  return {
    parentRealized: roundMoney(parentRealized),
    subslotRealized: roundMoney(subslotRealized),
    totalRealized: roundMoney(parentRealized + subslotRealized),
  };
}
/* =========================
   Hooks
========================= */

function useEngineData(BASE: string): EngineData {
  const [rows, setRows] = useState<MarketRow[]>([]);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [meta, setMeta] = useState<PublicMetaResponse | null>(null);
  const [slotRows, setSlotRows] = useState<SlotRow[]>([]);
  const [events, setEvents] = useState<SlotEvent[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const disposedRef = useRef(false);
  const latestPollRef = useRef(0);

  const fetchJson = useCallback(async <T,>(path: string, signal?: AbortSignal): Promise<T> => {
  const sep = path.includes("?") ? "&" : "?";
  const url = `${BASE}${path}${sep}ts=${Date.now()}`;

  const r = await fetch(url, {
    method: "GET",
    signal,
    cache: "no-store",
  });

  if (!r.ok) {
    throw new Error(`${path} HTTP ${r.status}`);
  }

  return (await r.json()) as T;
}, [BASE]);

  const fetchMarketRows = useCallback(async (signal?: AbortSignal) => {
    const j = await fetchJson<{ rows?: MarketRow[] }>("/api/market/aud", signal);
    return Array.isArray(j?.rows) ? j.rows : [];
  }, [fetchJson]);

  const fetchSnap = useCallback(async (signal?: AbortSignal) => {
    const j = await fetchJson<{ snapshot?: Snapshot } | Snapshot>("/api/market/snapshot", signal);
    return ("snapshot" in (j as { snapshot?: Snapshot }) ? (j as { snapshot?: Snapshot }).snapshot : j) as Snapshot;
  }, [fetchJson]);

  const fetchMeta = useCallback(async (signal?: AbortSignal) => {
    return await fetchJson<PublicMetaResponse>("/api/public/meta", signal);
  }, [fetchJson]);

  const fetchPublicSlots = useCallback(async (signal?: AbortSignal) => {
    const j = await fetchJson<PublicSlotsResponse>("/api/public/slots", signal);
    const list = Array.isArray(j?.rows) ? j.rows : [];
    return list.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }, [fetchJson]);

  const fetchPublicEvents = useCallback(async (signal?: AbortSignal) => {
    const j = await fetchJson<PublicEventsResponse>("/api/public/events?limit=200", signal);
    const list = Array.isArray(j?.rows) ? j.rows : [];
    return list.sort((a, b) => (b.at || 0) - (a.at || 0));
  }, [fetchJson]);

  const pollAll = useCallback(async () => {
    const pollId = ++latestPollRef.current;
    const ctrl = new AbortController();

    try {
      const [marketRows, snapshot, metaRes, slotsRes, eventsRes] = await Promise.all([
        fetchMarketRows(ctrl.signal),
        fetchSnap(ctrl.signal),
        fetchMeta(ctrl.signal),
        fetchPublicSlots(ctrl.signal),
        fetchPublicEvents(ctrl.signal),
      ]);

      if (disposedRef.current) return;
      if (pollId !== latestPollRef.current) return;

      setRows(marketRows);
      setSnap(snapshot);
      setMeta(metaRes);
      setSlotRows(slotsRes);
      setEvents(eventsRes);
      setErr(null);
    } catch (e: unknown) {
      if (disposedRef.current) return;
      if (pollId !== latestPollRef.current) return;

      const msg = e instanceof Error ? e.message : String(e);
      setErr(`${msg}\nENGINE_BASE: ${BASE}`);
    } finally {
      ctrl.abort();
    }
      }, [BASE, fetchMarketRows, fetchSnap, fetchMeta, fetchPublicSlots, fetchPublicEvents]);

  useEffect(() => {
    disposedRef.current = false;

    void pollAll();
    const id = window.setInterval(() => {
      void pollAll();
    }, 3000);

    return () => {
      disposedRef.current = true;
      window.clearInterval(id);
    };
  }, [pollAll]);

  return { rows, snap, meta, slotRows, events, err, refresh: pollAll };
}

/* =========================
   Presentational Components
========================= */

const EngineHero = React.memo(function EngineHero(props: {
  snap: Snapshot | null;
  meta: PublicMetaResponse | null;
  architecture: string;
  executionMode: string;
  fixedPresent: number;
  feedCount: number;
  lastAction: string;
  view: ViewMode;
}) {
  const { snap, meta, architecture, executionMode, fixedPresent, feedCount, lastAction, view } = props;

  return (
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
          Clarity first. Diagnostics second. Every slot is explained as a machine decision.
          <br />
          Snapshot: {snap?.lastPollIso ?? snap?.lastOkIso ?? "—"}
        </div>
      </aside>
    </header>
  );
});

const CaptureGrid = React.memo(function CaptureGrid(props: {
  openPnl: number;
  windowHarvest: number;
  visibleRealized: number;
  nextSweepLabel: string;
  currentWindow: number | null | undefined;
  lastSweepAgo: string;
  fixedPresent: number;
  fixedExpected: number;
  trackingCount: number;
  holdingCount: number;
  breakoutReady: number;
  consolidation: number;
  activeSubslots: number;
}) {
  return (
    <div className="engine-capture-grid" aria-label="Engine capture cards">
      <div className="engine-capture card machine-surface panel-frame">
        <div className="cap-k">Estimated Open PnL</div>
        <div className="cap-v">{moneyAud(props.openPnl)}</div>
        <div className="cap-sub">
          <span>Window Harvest {moneyAud(props.windowHarvest)}</span>
          <span>•</span>
          <span>Visible Realized {moneyAud(props.visibleRealized)}</span>
        </div>
      </div>

      <div className="engine-capture card machine-surface panel-frame">
        <div className="cap-k">Registry Sweep</div>
        <div className="cap-v">{props.nextSweepLabel}</div>
        <div className="cap-sub">
          <span>Window {props.currentWindow ?? "—"}</span>
          <span>•</span>
          <span>Last sweep {props.lastSweepAgo}</span>
        </div>
      </div>

      <div className="engine-capture card machine-surface panel-frame">
        <div className="cap-k">Fixed Slots</div>
        <div className="cap-v">
          {props.fixedPresent}/{props.fixedExpected}
        </div>
        <div className="cap-sub">
          <span>Tracking {props.trackingCount}</span>
          <span>•</span>
          <span>Holding {props.holdingCount}</span>
        </div>
      </div>

      <div className="engine-capture card machine-surface panel-frame">
        <div className="cap-k">Breakout Ready</div>
        <div className="cap-v">{props.breakoutReady}</div>
        <div className="cap-sub">
          <span>Consolidation {props.consolidation}</span>
          <span>•</span>
          <span>Active subslots {props.activeSubslots}</span>
        </div>
      </div>
    </div>
  );
});

const PriorityRail = React.memo(function PriorityRail(props: {
  slots: SlotRow[];
  onOpenSlot: (id: string) => void;
  nowMs: number;
}) {
  const top = props.slots.slice(0, 3);

  if (!top.length) return null;

  return (
    <div className="card machine-surface panel-frame engine-status-rail" aria-label="Machine priority rail">
      <div className="engine-telemetry-head">
        <div>
          <div className="engine-telemetry-title">Machine Priority</div>
          <div className="engine-telemetry-note">
            The most important fixed-slot conditions right now.
          </div>
        </div>
      </div>

      <div className="engine-priority-grid">
        {top.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`engine-priority-card ${stateToneClass(s)}`}
            onClick={() => props.onOpenSlot(s.id)}
          >
            <div className="engine-priority-top">
              <span className="engine-priority-id">{s.id}</span>
              <span className={`engine-priority-chip ${regimeToneClass(s)}`}>
                {priorityRailLabel(s)}
              </span>
            </div>

            <div className="engine-priority-line">
              <strong>{slotCoin(s)}</strong> • {regimeLabel(s)}
            </div>

            <div className="engine-priority-story">
  {liveParentAnalysis(s, props.nowMs)}
</div>

            <div className="engine-priority-stats">
              <span>Net {pctNum(s.netPct)}</span>
              <span>Spread {pctNum(s.nowSpreadPct)}</span>
              <span>{slotHealthLabel(s)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

const ControlsBar = React.memo(function ControlsBar(props: {
  view: ViewMode;
  setView: React.Dispatch<React.SetStateAction<ViewMode>>;
  feed: Feed;
  setFeed: React.Dispatch<React.SetStateAction<Feed>>;
  setSortKey: React.Dispatch<React.SetStateAction<SortKey>>;
  setSortDir: React.Dispatch<React.SetStateAction<SortDir>>;
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  refresh: () => Promise<void>;
}) {
  return (
    <div className="engine-controls-wrap" aria-label="Controls">
      <div className="engine-controls">
        <button
          type="button"
          className={`button ghost ${props.view === "advanced" ? "active" : ""}`}
          onClick={() => props.setView((v) => (v === "simple" ? "advanced" : "simple"))}
        >
          View: {props.view === "simple" ? "Simple" : "Advanced"}
        </button>

        <button
          type="button"
          className={`button ghost ${props.feed === "all" ? "active" : ""}`}
          onClick={() => props.setFeed("all")}
        >
          Feed: All
        </button>

        <button
          type="button"
          className={`button ghost ${props.feed === "aud" ? "active" : ""}`}
          onClick={() => props.setFeed("aud")}
        >
          Feed: AUD
        </button>

        <button
          type="button"
          className={`button ghost ${props.feed === "watch" ? "active" : ""}`}
          onClick={() => props.setFeed("watch")}
        >
          Feed: Watch
        </button>

        <button
          type="button"
          className="button ghost"
          onClick={() => {
            props.setSortKey("coin");
            props.setSortDir("asc");
          }}
        >
          Sort: A→Z
        </button>

        <button
          type="button"
          className="button ghost"
          onClick={() => {
            props.setSortKey("spread");
            props.setSortDir("asc");
          }}
        >
          Sort: Spread
        </button>

        <button
          type="button"
          className="button ghost"
          onClick={() => {
            props.setSortKey("mid");
            props.setSortDir((d) => (d === "asc" ? "desc" : "asc"));
          }}
        >
          Sort: Price
        </button>

        <button type="button" className="button ghost" onClick={() => void props.refresh()}>
          Refresh
        </button>

        <input
          className="engine-filter"
          value={props.query}
          onChange={(e) => props.setQuery(e.target.value)}
          placeholder="Filter coins / states / regime…"
          aria-label="Filter"
        />
      </div>
    </div>
  );
});

const CarouselPanel = React.memo(function CarouselPanel(props: {
  slots: SlotRow[];
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  onOpenSlot: (id: string) => void;
  paused: boolean;
  setPaused: React.Dispatch<React.SetStateAction<boolean>>;
  nowMs: number;
}) {
  const carouselSlot = props.slots[Math.max(0, Math.min(props.currentIndex, props.slots.length - 1))] ?? null;

  return (
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
              props.setCurrentIndex((i) =>
                props.slots.length ? (i - 1 + props.slots.length) % props.slots.length : 0
              )
            }
            aria-label="Previous JRD"
          >
            ←
          </button>

          <div className="engine-carousel-counter">
            {props.slots.length ? `${props.currentIndex + 1} / ${props.slots.length}` : "0 / 0"}
          </div>

          <button
            type="button"
            className="button ghost"
            onClick={() =>
              props.setCurrentIndex((i) => (props.slots.length ? (i + 1) % props.slots.length : 0))
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
            onClick={() => props.onOpenSlot(carouselSlot.id)}
            onMouseEnter={() => props.setPaused(true)}
            onMouseLeave={() => props.setPaused(false)}
            onFocus={() => props.setPaused(true)}
            onBlur={() => props.setPaused(false)}
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
                <div className={`engine-carousel-v ${regimeToneClass(carouselSlot)}`}>{regimeLabel(carouselSlot)}</div>
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
                <div className="engine-carousel-k">Health</div>
                <div className="engine-carousel-v">{slotHealthLabel(carouselSlot)}</div>
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
  <span>{liveParentAnalysis(carouselSlot, props.nowMs)}</span>
</div>

<div className="engine-carousel-insight">
  <div className="engine-carousel-k">Live Market Insight</div>
  <div className="engine-carousel-v">{regimeSummary(carouselSlot)}</div>
</div>

            <div className={`engine-subslot ${subslotToneClass(carouselSlot)}`}>
              <div className="engine-subslot-head">
                <span className="engine-subslot-title">{subslotModeLabel(carouselSlot)}</span>
                <span className="engine-subslot-state">{subslotDecisionLabel(carouselSlot)}</span>
              </div>

              <div className="engine-subslot-copy">{liveSubslotAnalysis(carouselSlot, props.nowMs)}</div>

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
            onMouseEnter={() => props.setPaused(true)}
            onMouseLeave={() => props.setPaused(false)}
          >
            {props.slots.map((slot, idx) => (
              <button
                key={slot.id}
                type="button"
                className={`engine-carousel-dot ${idx === props.currentIndex ? "active" : ""}`}
                onClick={() => props.setCurrentIndex(idx)}
                aria-label={`Show ${slot.id}`}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="ledger-empty">No fixed slots available.</div>
      )}
    </div>
  );
});

const MarketSurface = React.memo(function MarketSurface(props: {
  rows: MarketRow[];
}) {
  return (
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
            {props.rows.map((r) => {
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
  );
});

const OverviewTable = React.memo(function OverviewTable(props: {
  slots: SlotRow[];
  onOpenSlot: (id: string) => void;
  nowMs: number;
}) {
  return (
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
  <div>Live Analysis</div>
  <div>Health</div>
  <div className="num">Net</div>
  <div className="num">More</div>
</div>

        {props.slots.length ? (
          props.slots.map((s) => (
            <button type="button" className="ledger-row" key={s.id} onClick={() => props.onOpenSlot(s.id)}>
  <div className="ledger-slotid">{s.id}</div>
  <div className={regimeToneClass(s)}>{regimeLabel(s)}</div>
  <div>{engineDecisionLabel(s)}</div>
  <div className={stateClassName(stateLabel(s))}>{stateLabel(s)}</div>
  <div className={subslotToneClass(s)}>{subslotDecisionLabel(s)}</div>
  <div className="ledger-analysis">
  {liveParentAnalysis(s, props.nowMs)}
</div>
  <div>{slotHealthLabel(s)}</div>
  <div className="num">{pctNum(s.netPct)}</div>
  <div className="num ledger-view">Open</div>
</button>
          ))
        ) : (
          <div className="ledger-empty">No fixed slots available.</div>
        )}
      </div>
    </div>
  );
});

const LedgerTable = React.memo(function LedgerTable(props: {
  slots: SlotRow[];
  nowMs: number;
  expandedLedgerSlotId: string | null;
  setExpandedLedgerSlotId: React.Dispatch<React.SetStateAction<string | null>>;
  onOpenSlot: (id: string) => void;
  fixedPresent: number;
  fixedMissing: string[];
}) {
  return (
    <div className="card machine-surface panel-frame engine-ledger" aria-label="Slots Ledger">
      <div className="engine-ledger-top">
        <div>
          <div className="engine-ledger-title">Permanent Slots Ledger</div>
          <div className="engine-ledger-note">
            Click a row to expand the public proof layer. Open full details for diagnostics.
          </div>
        </div>

        <div className="engine-ledger-counts">
          Fixed: <strong>{props.fixedPresent}</strong> • Missing: <strong>{props.fixedMissing.length}</strong>
        </div>
      </div>

      <div className="ledger-table">
        <div className="ledger-head">
          <div>Slot ID</div>
          <div>Coin</div>
          <div>Market</div>
          <div>State</div>
          <div>Regime</div>
          <div>Health</div>
          <div className="num">Unit</div>
          <div className="num">Net</div>
          <div className="num">More</div>
        </div>

        {props.slots.length ? (
          props.slots.map((s) => {
            const expanded = props.expandedLedgerSlotId === s.id;
            const rows = detailRowsForSlot(s, props.nowMs);

            return (
              <div key={s.id} className={`ledger-entry ${expanded ? "is-expanded" : ""}`}>
                <button
                  type="button"
                  className="ledger-row"
                  onClick={() => props.setExpandedLedgerSlotId((prev) => (prev === s.id ? null : s.id))}
                  title="Toggle detail layer"
                  aria-expanded={expanded}
                >
                  <div className="ledger-slotid">{s.id}</div>
                  <div>{slotCoin(s)}</div>
                  <div>{s.market ?? "—"}</div>
                  <div className={stateClassName(stateLabel(s))}>{stateLabel(s)}</div>
                  <div className={regimeToneClass(s)}>{regimeLabel(s)}</div>
                  <div>{slotHealthLabel(s)}</div>
                  <div className="num">{moneyAud(s.unitAud)}</div>
                  <div className="num">{pctNum(s.netPct)}</div>
                  <div className="num ledger-view">{expanded ? "Hide" : "Show"}</div>
                </button>

                {expanded ? (
                  <div className="ledger-subpanel">
                    <div className={`ledger-subpanel-badge ${regimeToneClass(s)}`}>
                      {liveParentAnalysis(s, props.nowMs)}
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
                      {liveSubslotAnalysis(s, props.nowMs)}
                    </div>

                    {/* Render multiple subslots if they exist */}
                    {s.subslots && s.subslots.length > 0 && (
                      <div className="subslot-list">
                        {s.subslots.map((subslot, index) => (
                          <div key={index} className="subslot-card">
                            {/* Render subslot-specific details here */}
                            <div>Subslot {index + 1}</div>
                            <div>Subslot State: {subslot.subslotState}</div>
                            <div>Requested AUD: {moneyAud(subslot.subslotRequestedAud)}</div>
                            <div>Actual AUD: {moneyAud(subslot.subslotActualAud)}</div>
                            {/* Display additional subslot properties */}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="ledger-subpanel-actions">
                      <button
                        type="button"
                        className="button ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          props.onOpenSlot(s.id);
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
  );
});

const EventsPanel = React.memo(function EventsPanel(props: {
  events: SlotEvent[];
  eventsOpen: boolean;
  setEventsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div className="card machine-surface panel-frame engine-events" aria-label="Public Event Log">
      <div className="engine-events-top">
        <div>
          <div className="engine-events-title">Public Event Log</div>
          <div className="engine-events-note">Append-only public log for fixed-slot lifecycle proof.</div>
        </div>

        <button
          type="button"
          className="button ghost"
          onClick={() => props.setEventsOpen((v) => !v)}
          aria-expanded={props.eventsOpen}
        >
          {props.eventsOpen ? "Hide" : "Show"} ({Math.min(props.events.length, 100)})
        </button>
      </div>

      {props.eventsOpen ? (
        <div className="event-log">
          {props.events.length ? (
            props.events.slice(0, 100).map((e) => (
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
  );
});

const AboutPanel = React.memo(function AboutPanel(props: {
  aboutOpen: boolean;
  setAboutOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div className="engine-about" aria-label="About $JAL~Engine">
      <button
        type="button"
        className="button ghost engine-about-btn"
        onClick={() => props.setAboutOpen((v) => !v)}
        aria-expanded={props.aboutOpen}
        aria-controls="engine-about"
      >
        <span>About $JAL~Engine</span>
        <span className="engine-about-toggle">{props.aboutOpen ? "—" : "+"}</span>
      </button>

      {props.aboutOpen ? (
        <div id="engine-about" className="card machine-surface panel-frame engine-about-panel">
          <div className="engine-about-title">Fixed-Slot Jeroid Ledger</div>

          <p>
            This page presents the machine in public-facing language. Each Jeroid slot belongs to one fixed market
            identity and independently waits, deploys, holds, exits, and re-enters under the same rules.
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
            <li>The UI is organized for clarity first and diagnostics second.</li>
          </ul>
        </div>
      ) : null}
    </div>
  );
});

const CollapsibleBlock = React.memo(function CollapsibleBlock(props: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(Boolean(props.defaultOpen));

  return (
    <section className="slot-block">
      <button
        type="button"
        className="slot-block-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{props.title}</span>
        <span>{open ? "—" : "+"}</span>
      </button>

      {open ? <div className="slot-block-body">{props.children}</div> : null}
    </section>
  );
});

const SlotModal = React.memo(function SlotModal(props: {
  slot: SlotRow;
  events: SlotEvent[];
  nowMs: number;
  onClose: () => void;
}) {
  const { slot, events, nowMs, onClose } = props;

  return (
    <div className="slot-modal-layer" role="dialog" aria-modal="true" aria-label="Slot Details" onClick={onClose}>
      <div className="slot-modal-backdrop" aria-hidden="true" />

      <div className="slot-modal-panel card machine-surface panel-frame" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="slot-modal-close" aria-label="Close slot details" onClick={onClose}>
          ×
        </button>

        <div className="slot-modal-scroll">
          <div className="slot-modal-top">
            <div>
              <div className="slot-modal-id">{slot.id}</div>
              <div className="slot-modal-sub">
                {slotCoin(slot)} • {slot.market ?? "—"} •{" "}
                <span className={stateClassName(stateLabel(slot))}>{stateLabel(slot)}</span> •{" "}
                <span className={regimeToneClass(slot)}>{regimeLabel(slot)}</span>
              </div>
            </div>

            <div className="slot-modal-meta">
              <span className="slot-modal-chip">Esc to close</span>
              <span className="slot-modal-chip">{slotHealthLabel(slot)}</span>
            </div>
          </div>

          <CollapsibleBlock title="Overview" defaultOpen>
            <div className="slot-section">Decision Summary</div>

            <div className="slot-modal-grid">
              <div>
                <div className="slot-k">Market</div>
                <div className={`slot-v ${regimeToneClass(slot)}`}>{regimeLabel(slot)}</div>
              </div>
              <div>
                <div className="slot-k">Decision</div>
                <div className="slot-v">{engineDecisionLabel(slot)}</div>
              </div>
              <div>
                <div className="slot-k">Position</div>
                <div className={`slot-v ${stateClassName(stateLabel(slot))}`}>{stateLabel(slot)}</div>
              </div>
              <div>
                <div className="slot-k">Entry Phase</div>
                <div className={`slot-v ${stateClassName(trackingLabel(slot))}`}>{entryPhaseLabel(slot)}</div>
              </div>
              <div>
                <div className="slot-k">Health</div>
                <div className="slot-v">{slotHealthLabel(slot)}</div>
              </div>
              <div>
  <div className="slot-k">Decision Note</div>
  <div className="slot-v">{liveParentAnalysis(slot, nowMs)}</div>
</div>
            </div>
          </CollapsibleBlock>

          <CollapsibleBlock title="Parent Position" defaultOpen>
            <div className="slot-section">Core Metrics</div>

            <div className="slot-modal-grid">
              <div><div className="slot-k">Unit</div><div className="slot-v">{moneyAud(slot.unitAud)}</div></div>
              <div><div className="slot-k">Cycles</div><div className="slot-v">{slot.cycles ?? 0}</div></div>
              <div><div className="slot-k">Entry</div><div className="slot-v">{effectiveEntryLabel(slot)}</div></div>
              <div><div className="slot-k">Now</div><div className="slot-v">{effectiveNowLabel(slot)}</div></div>
              <div><div className="slot-k">Gross</div><div className="slot-v">{pctNum(slot.grossPct)}</div></div>
              <div><div className="slot-k">Net</div><div className="slot-v">{pctNum(slot.netPct)}</div></div>
              <div><div className="slot-k">Level</div><div className="slot-v">{slot.level ? `LVL${slot.level}` : "—"}</div></div>
              <div><div className="slot-k">Lock</div><div className="slot-v">{lockDisplay(slot)}</div></div>
              <div><div className="slot-k">Spread</div><div className="slot-v">{pctNum(slot.nowSpreadPct)}</div></div>
              <div><div className="slot-k">Drawdown</div><div className="slot-v">{pctNum(slot.drawdownPct)}</div></div>
              <div><div className="slot-k">Re-entry target</div><div className="slot-v">{fmt(slot.reentryTargetMid)}</div></div>
              <div><div className="slot-k">Exit reason</div><div className="slot-v">{slot.exitReason ?? "—"}</div></div>
              <div><div className="slot-k">Created</div><div className="slot-v">{ageLabel(nowMs - slot.createdAt)}</div></div>
              <div><div className="slot-k">Updated</div><div className="slot-v">{slotHeartbeatLabel(slot, nowMs)}</div></div>
            </div>
          </CollapsibleBlock>

          <CollapsibleBlock title="Tactical Subslot" defaultOpen>

            <div>
  <div className="slot-k">Live Analysis</div>
  <div className="slot-v">{liveSubslotAnalysis(slot, nowMs)}</div>
</div>
<div>
  <div className="slot-k">Live Now</div>
  <div className="slot-v">{subslotLiveNowLabel(slot)}</div>
</div>

            <div className="slot-section">Subslot Snapshot</div>

            <div className="slot-modal-grid">
              <div><div className="slot-k">Mode</div><div className={`slot-v slot-subslot ${subslotToneClass(slot)}`}>{subslotModeLabel(slot)}</div></div>
              <div><div className="slot-k">Decision</div><div className={`slot-v slot-subslot ${subslotToneClass(slot)}`}>{subslotDecisionLabel(slot)}</div></div>
              <div><div className="slot-k">State</div><div className="slot-v">{slot.subslotState ?? "—"}</div></div>
              <div><div className="slot-k">Signal</div><div className="slot-v">{slot.subslotSignalState ?? "—"}</div></div>
              <div><div className="slot-k">Confirm Ticks</div><div className="slot-v">{slot.subslotConfirmTicks != null ? slot.subslotConfirmTicks : "—"}</div></div>
              <div><div className="slot-k">Bounce</div><div className="slot-v">{pctNum(slot.subslotBouncePct)}</div></div>
              <div><div className="slot-k">EMA Gap</div><div className="slot-v">{pctNum(slot.subslotEmaGapPct)}</div></div>
              <div><div className="slot-k">Requested AUD</div><div className="slot-v">{moneyAud(slot.subslotRequestedAud)}</div></div>
              <div><div className="slot-k">Actual AUD</div><div className="slot-v">{moneyAud(slot.subslotActualAud)}</div></div>
              <div><div className="slot-k">Requested Qty</div><div className="slot-v">{fmt(slot.subslotRequestedCoinQty)}</div></div>
              <div><div className="slot-k">Actual Qty</div><div className="slot-v">{fmt(slot.subslotActualCoinQty)}</div></div>
              <div><div className="slot-k">Submitted Rate</div><div className="slot-v">{fmt(slot.subslotSubmittedRate)}</div></div>
              <div><div className="slot-k">Actual Rate</div><div className="slot-v">{fmt(slot.subslotActualRate)}</div></div>
              <div><div className="slot-k">Live Now</div><div className="slot-v">{subslotLiveNowLabel(slot)}</div></div>
              <div><div className="slot-k">Subslot Gross</div><div className="slot-v">{pctNum(slot.subslotGrossPct)}</div></div>
              <div><div className="slot-k">Subslot Net</div><div className="slot-v">{pctNum(slot.subslotNetPct)}</div></div>
              <div><div className="slot-k">Peak Bid</div><div className="slot-v">{fmt(slot.subslotPeakBid)}</div></div>
              <div><div className="slot-k">Drawdown</div><div className="slot-v">{pctNum(slot.subslotDrawdownPct)}</div></div>
              <div><div className="slot-k">Exit Reason</div><div className="slot-v">{slot.subslotExitReason ?? "—"}</div></div>
              <div><div className="slot-k">Profit AUD</div><div className="slot-v">{moneyAud(slot.subslotProfitAud)}</div></div>
              <div><div className="slot-k">Profit %</div><div className="slot-v">{pctNum(slot.subslotProfitPct)}</div></div>
              <div><div className="slot-k">Pending Merge</div><div className="slot-v">{moneyAud(slot.subslotPendingMergeAud)}</div></div>
              <div><div className="slot-k">Last Merged</div><div className="slot-v">{moneyAud(slot.subslotLastMergedAud)}</div></div>
              <div><div className="slot-k">Lifetime Profit</div><div className="slot-v">{moneyAud(slot.subslotLifetimeProfitAud)}</div></div>
              <div><div className="slot-k">Lifetime Cycles</div><div className="slot-v">{slot.subslotLifetimeCycles ?? 0}</div></div>
              <div><div className="slot-k">Updated</div><div className="slot-v">{subslotHeartbeatLabel(slot, nowMs)}</div></div>
              <div><div className="slot-k">Reconcile Note</div><div className="slot-v">{slot.subslotLastReconcileNote ?? "—"}</div></div>
              <div><div className="slot-k">Last Error</div><div className="slot-v">{slot.subslotLastError ?? "—"}</div></div>
            </div>
          </CollapsibleBlock>

          <CollapsibleBlock title="Tracking / Entry Structure" defaultOpen={false}>
            <div className="slot-section">Tracking Snapshot</div>

            <div className="slot-modal-grid">
              <div><div className="slot-k">Tracking State</div><div className={`slot-v ${stateClassName(trackingLabel(slot))}`}>{trackingLabel(slot)}</div></div>
              <div><div className="slot-k">Reason</div><div className="slot-v">{reasonLabel(slot.candidateReason)}</div></div>
              <div><div className="slot-k">Drawdown</div><div className="slot-v">{pctNum(slot.candidateDrawdownPct)}</div></div>
              <div><div className="slot-k">Bounce</div><div className="slot-v">{pctNum(slot.candidateBouncePct)}</div></div>
              <div><div className="slot-k">EMA Gap</div><div className="slot-v">{pctNum(slot.candidateEmaGapPct)}</div></div>
              <div><div className="slot-k">Reversal Ticks</div><div className="slot-v">{slot.candidateReversalTicks != null ? slot.candidateReversalTicks : "—"}</div></div>
              <div><div className="slot-k">Score</div><div className="slot-v">{slot.candidateScore != null ? slot.candidateScore.toFixed(3) : "—"}</div></div>
              <div><div className="slot-k">Tracked Peak</div><div className="slot-v">{fmt(slot.candidatePeakMid)}</div></div>
              <div><div className="slot-k">Tracked Low</div><div className="slot-v">{fmt(slot.candidateLowMid)}</div></div>
              <div><div className="slot-k">Candidate Spread</div><div className="slot-v">{pctNum(slot.nowSpreadPct ?? slot.candidateSpreadPrevPct)}</div></div>
            </div>

            {(slot.entryDrawdownPct != null ||
              slot.entryBouncePct != null ||
              slot.entryEmaGapPct != null ||
              slot.entryScore != null) && (
              <>
                <div className="slot-section">Entry Context</div>

                <div className="slot-modal-grid">
                  <div><div className="slot-k">Entry Drawdown</div><div className="slot-v">{pctNum(slot.entryDrawdownPct)}</div></div>
                  <div><div className="slot-k">Entry Bounce</div><div className="slot-v">{pctNum(slot.entryBouncePct)}</div></div>
                  <div><div className="slot-k">Entry EMA Gap</div><div className="slot-v">{pctNum(slot.entryEmaGapPct)}</div></div>
                  <div><div className="slot-k">Confirm Ticks</div><div className="slot-v">{slot.entryConfirmTicks != null ? slot.entryConfirmTicks : "—"}</div></div>
                  <div><div className="slot-k">Entry Score</div><div className="slot-v">{slot.entryScore != null ? slot.entryScore.toFixed(3) : "—"}</div></div>
                  <div><div className="slot-k">Fee Model</div><div className="slot-v">{slot.frictionModel ?? "—"}</div></div>
                </div>
              </>
            )}
          </CollapsibleBlock>

          {(slot.rotationReservationId ||
            slot.rotationStage ||
            slot.rotationEligibleOut != null ||
            slot.rotationEligibleIn != null) && (
            <CollapsibleBlock title="Rotation / Capital Handoff" defaultOpen={false}>
              <div className="slot-section">Rotation Snapshot</div>

              <div className="slot-modal-grid">
                <div><div className="slot-k">Reservation</div><div className="slot-v">{slot.rotationReservationId ?? "—"}</div></div>
                <div><div className="slot-k">Role</div><div className="slot-v">{slot.rotationRole ?? "—"}</div></div>
                <div><div className="slot-k">Stage</div><div className="slot-v">{slot.rotationStage ?? "—"}</div></div>
                <div><div className="slot-k">Linked Slot</div><div className="slot-v">{slot.rotationLinkedSlotId ?? "—"}</div></div>
                <div><div className="slot-k">Eligible Out</div><div className="slot-v">{slot.rotationEligibleOut == null ? "—" : slot.rotationEligibleOut ? "YES" : "NO"}</div></div>
                <div><div className="slot-k">Eligible In</div><div className="slot-v">{slot.rotationEligibleIn == null ? "—" : slot.rotationEligibleIn ? "YES" : "NO"}</div></div>
                <div><div className="slot-k">Edge Score</div><div className="slot-v">{fmt(slot.rotationEdgeScore)}</div></div>
                <div><div className="slot-k">Released AUD</div><div className="slot-v">{moneyAud(slot.rotationReleasedAud)}</div></div>
                <div><div className="slot-k">Funding Reserved</div><div className="slot-v">{moneyAud(slot.rotationFundingReservedAud)}</div></div>
                <div><div className="slot-k">Funding Transferred</div><div className="slot-v">{moneyAud(slot.rotationFundingTransferredAud)}</div></div>
                <div><div className="slot-k">Reason</div><div className="slot-v">{slot.rotationReason ?? "—"}</div></div>
                <div><div className="slot-k">Last Error</div><div className="slot-v">{slot.rotationLastError ?? "—"}</div></div>
              </div>
            </CollapsibleBlock>
          )}

          {(slot.topupMode || slot.topupLastAppliedAt || slot.topupRequestedTargetAud != null) && (
            <CollapsibleBlock title="Top-up Snapshot" defaultOpen={false}>
              <div className="slot-modal-grid">
                <div><div className="slot-k">Mode</div><div className="slot-v">{slot.topupMode ?? "—"}</div></div>
                <div><div className="slot-k">Requested Target</div><div className="slot-v">{moneyAud(slot.topupRequestedTargetAud)}</div></div>
                <div><div className="slot-k">Last Target</div><div className="slot-v">{moneyAud(slot.topupLastTargetAud)}</div></div>
                <div><div className="slot-k">Fallback AUD</div><div className="slot-v">{moneyAud(slot.topupFallbackAud)}</div></div>
                <div><div className="slot-k">Last Delta</div><div className="slot-v">{moneyAud(slot.topupLastDeltaAud)}</div></div>
                <div><div className="slot-k">Last Applied</div><div className="slot-v">{slot.topupLastAppliedAt ? ageLabel(nowMs - slot.topupLastAppliedAt) : "—"}</div></div>
              </div>
            </CollapsibleBlock>
          )}

          {(slot.realizedAt != null ||
            slot.entryAud != null ||
            slot.exitAud != null ||
            slot.profitAud != null ||
            slot.profitPct != null) && (
            <CollapsibleBlock title="Realized Proof" defaultOpen={false}>
              <div className="slot-modal-grid">
                <div><div className="slot-k">Entry AUD</div><div className="slot-v">{moneyAud(slot.entryAud)}</div></div>
                <div><div className="slot-k">Exit AUD</div><div className="slot-v">{moneyAud(slot.exitAud)}</div></div>
                <div><div className="slot-k">Profit AUD</div><div className="slot-v">{moneyAud(slot.profitAud)}</div></div>
                <div><div className="slot-k">Profit %</div><div className="slot-v">{pctNum(slot.profitPct)}</div></div>
              </div>
            </CollapsibleBlock>
          )}

          <CollapsibleBlock title="Timeline" defaultOpen>
            <div className="event-log">
              {events.length ? (
                events.slice(0, 60).map((e) => (
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
          </CollapsibleBlock>

          <CollapsibleBlock title="Rules Snapshot" defaultOpen={false}>
            <div className="slot-rules">
              <div>Permanent identity: one slot belongs to one fixed coin market.</div>
              <div>Market regime leads the explanation layer.</div>
              <div>Parent slot and tactical subslot remain separate accounting layers.</div>
              <div>Deploy, hold, lock, exit, and re-entry decisions remain deterministic.</div>
              <div className="slot-rules-note">
                This slot is part of the fixed-slot Jeroid ledger, not a selector pool.
              </div>
            </div>
          </CollapsibleBlock>
        </div>
      </div>
    </div>
  );
});

const SummaryPanel = React.memo(function SummaryPanel(props: {
  meta: PublicMetaResponse | null;
  fixedAllowlist: string[];
  fixedMissing: string[];
  trackingStates: Record<string, number>;
  overviewCounts: {
    bull: number;
    bear: number;
    consolidation: number;
    breakoutReady: number;
    waiting: number;
    activeSubslots: number;
  };
  topTrackingCoins: string;
  executionMode: string;
  view: ViewMode;
}) {
  return (
    <div className="engine-bay">
      <div className="bay-head">
        <div className="bay-title">Engine Summary</div>
        <div className="bay-note">Machine state + structure overview.</div>
      </div>

      <div className="card machine-surface panel-frame engine-telemetry">
        <div className="engine-telemetry-head">
          <div className="engine-telemetry-title">System State</div>
        </div>

        <div className="engine-mini">
          <div className="engine-mini-row">
            <div className="mini-k">Execution</div>
            <div className="mini-v">{props.executionMode}</div>
          </div>

          <div className="engine-mini-row">
  <div className="mini-k">Tracking</div>
  <div className="mini-v">{getActiveTrackingCount(props.trackingStates)}</div>
</div>

          <div className="engine-mini-row">
            <div className="mini-k">Breakouts Ready</div>
            <div className="mini-v">{props.overviewCounts.breakoutReady}</div>
          </div>

          <div className="engine-mini-row">
            <div className="mini-k">Consolidation</div>
            <div className="mini-v">{props.overviewCounts.consolidation}</div>
          </div>

          <div className="engine-mini-row">
            <div className="mini-k">Active Subslots</div>
            <div className="mini-v">{props.overviewCounts.activeSubslots}</div>
          </div>

          <div className="engine-mini-row">
            <div className="mini-k">Tracking Coins</div>
            <div className="mini-v">{props.topTrackingCoins || "—"}</div>
          </div>

          <div className="engine-mini-row">
  <div className="mini-k">Snapshot Poll</div>
  <div className="mini-v">
    {props.meta?.market?.snapshot?.lastPollIso ?? props.meta?.market?.snapshot?.lastOkIso ?? "—"}
  </div>
</div>

          <div className="engine-mini-row">
            <div className="mini-k">Last OK</div>
            <div className="mini-v">
              {props.meta?.market?.snapshot?.lastOkIso ?? "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
/* =========================
   Main Component
========================= */

export default function Engine() {
  const BASE = useMemo(() => pickBase(), []);
  const isDesktop = useIsDesktop(980);

  const { rows, snap, meta, slotRows, events, err, refresh } = useEngineData(BASE);

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

    return sortMarketRows(list, sortKey, sortDir);
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

    return [...list].sort((a, b) => {
      if (sortKey === "coin") return slotCoin(a).localeCompare(slotCoin(b)) * (sortDir === "asc" ? 1 : -1);
      if (sortKey === "mid") {
        const av = a.nowMid ?? a.entryMid ?? -Infinity;
        const bv = b.nowMid ?? b.entryMid ?? -Infinity;
        return (av - bv) * (sortDir === "asc" ? 1 : -1);
      }
      const av = a.nowSpreadPct ?? Infinity;
      const bv = b.nowSpreadPct ?? Infinity;
      return (av - bv) * (sortDir === "asc" ? 1 : -1);
    });
  }, [query, slotRows, sortDir, sortKey]);

  const prioritizedSlots = useMemo(() => {
    return [...filteredSlots].sort((a, b) => derivePriorityScore(b) - derivePriorityScore(a));
  }, [filteredSlots]);

  useEffect(() => {
    if (!prioritizedSlots.length) {
      setCarouselIndex(0);
      return;
    }
    if (carouselIndex > prioritizedSlots.length - 1) setCarouselIndex(0);
  }, [prioritizedSlots.length, carouselIndex]);

  useEffect(() => {
    if (!prioritizedSlots.length || carouselPaused) return;
    const t = window.setInterval(() => {
      setCarouselIndex((i) => (i + 1) % prioritizedSlots.length);
    }, CAROUSEL_INTERVAL_MS);
    return () => window.clearInterval(t);
  }, [prioritizedSlots.length, carouselPaused]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedSlotId(null);
      if (e.key === "ArrowRight") {
        setCarouselIndex((i) => (prioritizedSlots.length ? (i + 1) % prioritizedSlots.length : 0));
      }
      if (e.key === "ArrowLeft") {
        setCarouselIndex((i) => (prioritizedSlots.length ? (i - 1 + prioritizedSlots.length) % prioritizedSlots.length : 0));
      }
    };

    window.addEventListener("keydown", onKey);
    if (selectedSlotId) document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [selectedSlotId, prioritizedSlots.length]);

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

  const slotFinancials = useMemo(() => computeSlotFinancials(slotRows), [slotRows]);
  const slotHarvest = useMemo(() => computeWindowHarvestFromSlots(slotRows), [slotRows]);

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

    const snapshotAgeMs =
    snap?.lastPollAt != null
      ? nowMs - snap.lastPollAt
      : snap?.lastOkAt != null
      ? nowMs - snap.lastOkAt
      : null;

  const snapshotFresh =
    snapshotAgeMs != null && Number.isFinite(snapshotAgeMs) ? snapshotAgeMs <= 10000 : false;

  const topTrackingCoins = useMemo(() => {
  return getActiveTrackingCoins(slotRows);
}, [slotRows]);

  const overviewCounts = useMemo(() => {
  const out = {
    bull: 0,
    bear: 0,
    consolidation: 0,
    breakoutReady: 0,
    waiting: 0,
    activeSubslots: 0,
  };

  for (const s of slotRows) {
    const regime = String(regimeLabel(s)).toUpperCase();
    if (regime.includes("UPTREND") || regime.includes("BULL")) out.bull += 1;
    if (regime.includes("DOWNTREND") || regime.includes("BEAR")) out.bear += 1;
    if (regime.includes("CONSOLIDATION")) out.consolidation += 1;
    if (s.consolidationBreakoutReady === true) out.breakoutReady += 1;
    if (String(s.state).toUpperCase() === "WAITING_ENTRY") out.waiting += 1;
    if (String(s.subslotState || "").toUpperCase() === "ACTIVE") out.activeSubslots += 1;
  }

  return out;
}, [slotRows]);

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
                            <EngineHero
                snap={snap}
                meta={meta}
                architecture={architecture}
                executionMode={executionMode}
                fixedPresent={fixedPresent}
                feedCount={feedCount}
                lastAction={`${lastAction} • ${snapshotFresh ? "FRESH" : "STALE"}`}
                view={view}
              />

              <CaptureGrid
                openPnl={slotFinancials.openPnl}
                windowHarvest={slotHarvest.totalRealized}
                visibleRealized={slotFinancials.visibleRealized}
                nextSweepLabel={nextSweepLabel}
                currentWindow={meta?.cadence?.currentWindow}
                lastSweepAgo={lastSweepAgo}
                fixedPresent={fixedPresent}
                fixedExpected={fixedExpected}
                trackingCount={getActiveTrackingCount(trackingStates)}
                holdingCount={(counts.holding ?? 0) + (counts.locked ?? 0)}
                breakoutReady={overviewCounts.breakoutReady}
                consolidation={overviewCounts.consolidation}
                activeSubslots={overviewCounts.activeSubslots}
              />

              <PriorityRail
  slots={prioritizedSlots}
  onOpenSlot={setSelectedSlotId}
  nowMs={nowMs}
/>

              <ControlsBar
                view={view}
                setView={setView}
                feed={feed}
                setFeed={setFeed}
                setSortKey={setSortKey}
                setSortDir={setSortDir}
                query={query}
                setQuery={setQuery}
                refresh={refresh}
              />

              {err ? (
                <div className="engine-log" role="status" aria-label="Errors">
                  <pre>{err}</pre>
                </div>
              ) : null}

              <CarouselPanel
  slots={prioritizedSlots}
  currentIndex={carouselIndex}
  setCurrentIndex={setCarouselIndex}
  onOpenSlot={setSelectedSlotId}
  paused={carouselPaused}
  setPaused={setCarouselPaused}
  nowMs={nowMs}
/>
              <div className="engine-grid engine-grid--asym" aria-label="Engine bays">
                <SummaryPanel
                  meta={meta}
                  fixedAllowlist={fixedAllowlist}
                  fixedMissing={fixedMissing}
                  trackingStates={trackingStates}
                  overviewCounts={overviewCounts}
                  topTrackingCoins={topTrackingCoins}
                  executionMode={executionMode}
                  view={view}
                />

                <MarketSurface rows={filteredMarketRows} />
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
                <OverviewTable slots={filteredSlots} onOpenSlot={setSelectedSlotId} nowMs={nowMs} />
              ) : null}

              {section === "ledger" ? (
                <>
                  <div className="engine-ledger-topgrid" aria-label="Jeroid status cards">
                    <div className="engine-capture card machine-surface panel-frame" data-treasury="true">
                      <div className="cap-k">Registry</div>
                      <div className="cap-v">{meta?.harvester?.running ? "RUNNING" : "STOPPED"}</div>
                      <div className="cap-sub">
                        <span>Phase {String(meta?.harvester?.phase ?? "—")}</span>
                        <span>•</span>
                        <span>Window {meta?.cadence?.currentWindow ?? "—"}</span>
                      </div>
                    </div>

                    <div className="engine-capture card machine-surface panel-frame" data-treasury="true">
  <div className="cap-k">Tracking family</div>
  <div className="cap-v">{getActiveTrackingCount(trackingStates)}</div>
  <div className="cap-sub">
    <span>TRACKING {trackingStates.TRACKING ?? 0}</span>
    <span>•</span>
    <span>ARMED {trackingStates.ARMED ?? 0}</span>
    <span>•</span>
    <span>BLOCKED {trackingStates.SPREAD_BLOCKED ?? 0}</span>
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

                  <LedgerTable
                    slots={filteredSlots}
                    nowMs={nowMs}
                    expandedLedgerSlotId={expandedLedgerSlotId}
                    setExpandedLedgerSlotId={setExpandedLedgerSlotId}
                    onOpenSlot={setSelectedSlotId}
                    fixedPresent={fixedPresent}
                    fixedMissing={fixedMissing}
                  />

                  {showEventsUnderLedger ? (
                    <EventsPanel events={events} eventsOpen={eventsOpen} setEventsOpen={setEventsOpen} />
                  ) : null}
                </>
              ) : null}

              {section === "events" ? (
                <EventsPanel events={events} eventsOpen={eventsOpen} setEventsOpen={setEventsOpen} />
              ) : null}

              {section === "about" ? (
                <AboutPanel aboutOpen={aboutOpen} setAboutOpen={setAboutOpen} />
              ) : null}
            </div>
          </div>
        </section>
      </div>

      {selectedSlot ? (
        <SlotModal
          slot={selectedSlot}
          events={selectedSlotEvents}
          nowMs={nowMs}
          onClose={() => setSelectedSlotId(null)}
        />
      ) : null}
    </main>
  );
}