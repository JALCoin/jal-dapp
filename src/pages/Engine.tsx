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
  history?: {
    enabled?: boolean;
    dir?: string;
    retentionDays?: number;
    writes?: number;
    lastWriteAt?: number | null;
    lastWriteIso?: string | null;
    lastFile?: string | null;
    lastErr?: string | null;
  };
};

type Feed = "all" | "aud" | "watch" | "engine";
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

type SubslotRow = {
  subslotId?: string | null;
  subslotSequence?: number | null;
  subslotTriggerBandIndex?: number | null;
  subslotTriggerParentNetPct?: number | null;
  subslotEntryParentNetPct?: number | null;
  subslotState?: string | null;
  subslotEntryMode?: string | null;
  subslotSignalState?: string | null;
  subslotSignalReason?: string | null;
  subslotSignalNeededTicks?: number | null;
  subslotNowMid?: number | null;
  subslotEntryMid?: number | null;
  subslotGrossPct?: number | null;
  subslotNetPct?: number | null;
  subslotPeakBid?: number | null;
  subslotDrawdownPct?: number | null;
  subslotBouncePct?: number | null;
  subslotEmaGapPct?: number | null;
  subslotRecoveredConfirmed?: boolean | null;
  subslotRecoveredAt?: number | null;
  subslotRecoveredPeakNetPct?: number | null;
  subslotProfitAud?: number | null;
  subslotProfitPct?: number | null;
  subslotExitReason?: string | null;
  subslotOpenedAt?: number | null;
  subslotClosedAt?: number | null;
  subslotCooldownUntil?: number | null;
  subslotLastError?: string | null;
  subslotLastReconcileAt?: number | null;
  subslotLastReconcileNote?: string | null;

  subslotRequestedAud?: number | null;
  subslotRequestedCoinQty?: number | null;
  subslotSubmittedRate?: number | null;
  subslotActualAud?: number | null;
  subslotActualCoinQty?: number | null;
  subslotActualRate?: number | null;
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
  subslotRealizedAt?: number | null;
  subslotPendingMergeAud?: number | null;
  subslotLastMergedAud?: number | null;
  subslotMergedAt?: number | null;
  subslotLifetimeProfitAud?: number | null;
  subslotLifetimeCycles?: number | null;
  subslotTrackingSince?: number | null;
  subslotLowMid?: number | null;
  subslotLastMid?: number | null;
  subslotEmaFast?: number | null;
  subslotEmaSlow?: number | null;
  subslotConfirmTicks?: number | null;
};

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

  // Legacy flat `subslot*` fields remain as a fallback for older rows.
  // `subslots[]` is the authoritative tactical model when present.
  subslots?: SubslotRow[] | null;

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
  subslotTriggerBandIndex?: number | null;
  subslotTriggerParentNetPct?: number | null;
  subslotEntryParentNetPct?: number | null;

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
  rotationSourceType?: string | null;
  rotationWalletReady?: boolean | null;
  rotationWalletBlockedReason?: string | null;
  rotationWalletMovableAud?: number | null;
  rotationWalletAudValue?: number | null;
  rotationWalletAvailableCoin?: number | null;
  rotationWalletBasisKnown?: boolean | null;
  rotationWalletProfitGuardPassed?: boolean | null;
  rotationWalletBasisAsOf?: number | null;
  rotationWalletAvgCostAud?: number | null;
  rotationWalletCostBasisAud?: number | null;
  rotationWalletUnrealizedNetPct?: number | null;
  rotationWalletProfitMinNetPct?: number | null;
  rotationTargetExecutorEligible?: boolean | null;
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
  runtime?: {
    warnings?: string[];
    topupMode?: {
      raw?: string;
      normalized?: string;
      aliasUsed?: boolean;
      valid?: boolean;
    };
    quoteGuard?: {
      enabled?: boolean;
      required?: boolean;
      maxDriftPct?: number;
      timeoutMs?: number;
    };
    envAuditSummary?: {
      total?: number;
      configured?: number;
      byStatus?: Record<string, number>;
    };
    telemetry?: {
      eventsSeen?: number;
      eventsWritten?: number;
      eventsSuppressed?: number;
      lastEventAt?: number;
      lastEventPrefix?: string | null;
      byKind?: Record<string, number>;
      byPrefix?: Record<string, number>;
      lastWorkerAction?: {
        server?: {
          at?: number;
          prefix?: string;
          msg?: string;
          written?: boolean;
          suppressed?: boolean;
        };
        harvester?: {
          at?: number;
          prefix?: string;
          msg?: string;
          written?: boolean;
          suppressed?: boolean;
        };
        executor?: {
          at?: number;
          prefix?: string;
          msg?: string;
          written?: boolean;
          suppressed?: boolean;
        };
        manager?: {
          at?: number;
          prefix?: string;
          msg?: string;
          written?: boolean;
          suppressed?: boolean;
        };
      };
    };
    eventCompression?: {
      enabled?: boolean;
      windowMs?: number;
      trackedKeys?: number;
      totalSuppressed?: number;
      totalWritten?: number;
      byCategory?: Record<string, number>;
      active?: Array<{
        category?: string;
        reason?: string | null;
        slotId?: string | null;
        coin?: string | null;
        suppressed?: number;
        lastAt?: number;
        lastMsg?: string | null;
      }>;
    };
    rotationDashboard?: {
      summary?: {
        policyEnabled?: boolean;
        policyRunning?: boolean;
        executorEnabled?: boolean;
        executorRunning?: boolean;
        executorDryRun?: boolean;
        recommend?: boolean;
        blockedReason?: string | null;
        edgeScore?: number | null;
        activeReservations?: number;
        reservationStages?: Record<string, number>;
        eligibleInCandidates?: number;
        eligibleOutCandidates?: number;
      };
    };
    rotationExecutor?: {
      enabled?: boolean;
      dryRun?: boolean;
      liveEntryEnabled?: boolean;
      liveExitEnabled?: boolean;
    };
  };
};

type PublicCapitalCoin = {
  coin?: string;
  availableCoin?: number | null;
  audValue?: number | null;
  rate?: number | null;
  walletSourceReady?: boolean | null;
  walletSourceBlockedReason?: string | null;
  movableAudEstimate?: number | null;
  cooldownRemainingMs?: number | null;
  slotId?: string | null;
  slotState?: string | null;
  trackingState?: string | null;
  rotationEligibleOut?: boolean | null;
  rotationScoreOut?: number | null;
  rotationOutBlockedReason?: string | null;
  rotationTargetSlotId?: string | null;
  rotationTargetCoin?: string | null;
  rotationEdgeScore?: number | null;
  rotationReason?: string | null;
  rotationSourceType?: string | null;
  rotationWalletReady?: boolean | null;
  rotationWalletBlockedReason?: string | null;
  rotationWalletMovableAud?: number | null;
  rotationWalletAudValue?: number | null;
  rotationWalletAvailableCoin?: number | null;
  rotationWalletBasisKnown?: boolean | null;
  rotationWalletProfitGuardPassed?: boolean | null;
  rotationWalletBasisAsOf?: number | null;
  rotationWalletAvgCostAud?: number | null;
  rotationWalletCostBasisAud?: number | null;
  rotationWalletUnrealizedNetPct?: number | null;
  rotationWalletProfitMinNetPct?: number | null;
  rotationTargetExecutorEligible?: boolean | null;
};

type PublicCapitalResponse = {
  ok?: boolean;
  ts?: number;
  audAvailable?: number | null;
  audBalance?: number | null;
  walletAudValue?: number | null;
  movableAudEstimate?: number | null;
  walletSourceEnabled?: boolean | null;
  cacheMs?: number | null;
  stale?: boolean | null;
  generatedAt?: number | null;
  refreshError?: string | null;
  rotation?: {
    enabled?: boolean | null;
    executorEnabled?: boolean | null;
    dryRun?: boolean | null;
    liveEntryEnabled?: boolean | null;
    liveExitEnabled?: boolean | null;
    requireWaitingEligible?: boolean | null;
    walletRequireBasis?: boolean | null;
    walletMinSourceNetPct?: number | null;
  } | null;
  coins?: PublicCapitalCoin[] | null;
};

type PublicEventsResponse = { ok: boolean; ts: number; rows: SlotEvent[] };
type PublicSlotsResponse = { ok: boolean; ts: number; rows: SlotRow[] };

type EngineData = {
  rowsAll: MarketRow[];
  rowsAud: MarketRow[];
  snap: Snapshot | null;
  meta: PublicMetaResponse | null;
  capital: PublicCapitalResponse | null;
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
const ENGINE_POLL_INTERVAL_MS = 3000;
const CAPITAL_POLL_INTERVAL_MS = 15000;

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
  if (n == null || !Number.isFinite(n)) return "-";
  if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (Math.abs(n) >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 10 });
}

function pctNum(p: number | null | undefined) {
  if (p == null || !Number.isFinite(p)) return "-";
  return `${p.toFixed(3)}%`;
}

function moneyAud(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "-";
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
  if (ms == null || !Number.isFinite(ms)) return "-";
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
}

function ageLabel(msSince: number | null | undefined) {
  if (msSince == null || !Number.isFinite(msSince)) return "-";
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

function titleCaseWords(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function enumLabel(value: string | null | undefined) {
  if (!value) return "-";
  return titleCaseWords(String(value).replace(/_/g, " "));
}

function trackingLabel(s: SlotRow) {
  return enumLabel(s.trackingState);
}

function stateLabel(s: SlotRow) {
  return enumLabel(s.state);
}

function slotCoin(s: SlotRow) {
  return s.coin ?? "-";
}

function effectiveEntryLabel(s: SlotRow) {
  if (s.entryMid != null && Number.isFinite(s.entryMid)) return fmt(s.entryMid);
  if (s.state === "WAITING_ENTRY" && s.reentryTargetMid != null && Number.isFinite(s.reentryTargetMid)) {
    return fmt(s.reentryTargetMid);
  }
  return "-";
}

function effectiveNowLabel(s: SlotRow) {
  if (s.nowMid != null && Number.isFinite(s.nowMid)) return fmt(s.nowMid);
  if (s.candidateMidPrev != null && Number.isFinite(s.candidateMidPrev)) return fmt(s.candidateMidPrev);
  return "-";
}

function lockDisplay(s: SlotRow) {
  return pctNum(s.lockPct);
}

function reasonLabel(reason: string | null | undefined) {
  if (!reason) return "-";
  const normalized = String(reason).trim().toLowerCase();

  const mapped: Record<string, string> = {
    wallet_rotation_cooldown: "Wallet rotation cooldown",
    wallet_source_below_min_aud: "Wallet source below minimum AUD",
    wallet_coin_not_available: "Wallet coin not available",
    waiting_not_executor_eligible: "Waiting slot not executor-eligible",
    spread_blowout: "Spread above allowed threshold",
    spread_unresolved: "Spread unavailable",
    market_unresolved: "Market unavailable",
    no_market: "No market data",
    bidask_unresolved: "Bid/ask unavailable",
    live_bidask_required: "Live bid/ask required",
    drawdown_not_ready: "Drawdown not ready",
    bounce_not_ready: "Bounce not ready",
    trend_not_ready: "Trend not ready",
    priority_score_below_min: "Priority score below minimum",
    wallet_basis_unavailable: "Wallet basis unavailable",
    wallet_basis_avg_cost_unresolved: "Wallet average cost unavailable",
    wallet_source_not_in_profit: "Wallet source not in profit",
    too_profitable_to_rotate: "Source is too profitable to rotate",
    realized_loss_exit_disabled: "Loss exit disabled by policy",
    max_realized_loss_exceeded: "Maximum realized loss exceeded",
  };

  if (mapped[normalized]) return mapped[normalized];
  return enumLabel(reason);
}

function yesNo(v: boolean | null | undefined) {
  if (v == null) return "-";
  return v ? "YES" : "NO";
}

function fmtTimestampAge(ts: number | null | undefined, nowMs: number) {
  if (!ts || !Number.isFinite(ts)) return "-";
  return ageLabel(nowMs - ts);
}

function formatDateTime(ts: number | null | undefined) {
  if (ts == null || !Number.isFinite(ts)) return "-";
  return new Date(ts).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatSnapshotLabel(snap: Snapshot | null, nowMs: number) {
  if (!snap) return "-";

  const ts = snap.lastPollAt ?? snap.lastOkAt ?? null;
  if (ts == null || !Number.isFinite(ts)) return snap.lastPollIso ?? snap.lastOkIso ?? "-";

  const age = ageLabel(nowMs - ts);
  return `${formatDateTime(ts)} (${age} ago)`;
}

function walletReadinessLabel(
  capitalCoin: PublicCapitalCoin | null | undefined,
  basisRequired: boolean
) {
  if (!capitalCoin) return "-";
  const hasPolicySignal =
    capitalCoin.rotationWalletReady != null ||
    capitalCoin.rotationWalletBlockedReason != null ||
    capitalCoin.rotationWalletProfitGuardPassed != null ||
    capitalCoin.rotationWalletBasisKnown != null ||
    capitalCoin.rotationTargetCoin != null ||
    capitalCoin.rotationTargetSlotId != null ||
    capitalCoin.rotationEligibleOut === true;
  if (capitalCoin.rotationWalletProfitGuardPassed === false) return "PROFIT BLOCKED";
  if (basisRequired && hasPolicySignal && capitalCoin.rotationWalletBasisKnown === false) return "BASIS BLOCKED";
  if (capitalCoin.rotationWalletReady === true) return "POLICY READY";
  if (capitalCoin.walletSourceReady === true) return "TREASURY READY";
  const blocked = String(capitalCoin.walletSourceBlockedReason || "").toLowerCase();
  if (blocked === "wallet_rotation_cooldown") return "COOLDOWN";
  if (blocked === "wallet_source_below_min_aud") return "BELOW MIN SIZE";
  if (blocked === "wallet_coin_not_available") return "NO WALLET COIN";
  if (blocked || capitalCoin.rotationWalletBlockedReason || capitalCoin.rotationOutBlockedReason) return "BLOCKED";
  return "STANDBY";
}

function walletReadinessTone(
  capitalCoin: PublicCapitalCoin | null | undefined,
  basisRequired: boolean
) {
  const label = walletReadinessLabel(capitalCoin, basisRequired);
  if (label === "POLICY READY") return "state-positive";
  if (label === "TREASURY READY") return "state-warn";
  if (label === "PROFIT BLOCKED" || label === "BASIS BLOCKED") return "state-bad";
  if (label === "COOLDOWN") return "state-warn";
  if (label === "-" || label === "STANDBY") return "state-muted";
  return "state-bad";
}

function rotationModeLabel(capital: PublicCapitalResponse | null | undefined) {
  if (!capital?.rotation?.enabled) return "OFF";
  if (capital.rotation.executorEnabled && capital.rotation.dryRun) return "DRY RUN";
  if (capital.rotation.executorEnabled && (capital.rotation.liveEntryEnabled || capital.rotation.liveExitEnabled)) {
    return "LIVE";
  }
  if (!capital.rotation.executorEnabled) return "POLICY ONLY";
  return "READY";
}

function capitalFreshnessLabel(capital: PublicCapitalResponse | null | undefined, nowMs: number) {
  if (!capital?.generatedAt) return "-";
  const age = ageLabel(nowMs - capital.generatedAt);
  return capital.stale ? `STALE | ${age}` : `FRESH | ${age}`;
}

function capitalReasonLabel(coin: PublicCapitalCoin | null | undefined) {
  if (!coin) return "-";
  const blockedReason =
    coin.rotationWalletBlockedReason ||
    coin.rotationOutBlockedReason ||
    coin.rotationReason ||
    coin.walletSourceBlockedReason;
  if (blockedReason) return reasonLabel(blockedReason);
  if (
    coin.walletSourceReady === true &&
    coin.rotationWalletReady !== true &&
    !coin.rotationTargetCoin &&
    !coin.rotationTargetSlotId
  ) {
    return "Wallet capital is available, but no active rotation recommendation is selected yet.";
  }
  return "Standby";
}

function summarizeRecordTop(
  record: Record<string, number> | null | undefined,
  limit = 3
) {
  const entries = Object.entries(record ?? {})
    .filter(([, value]) => Number.isFinite(value))
    .sort((a, b) => b[1] - a[1])
    .slice(0, Math.max(0, limit));

  if (!entries.length) return "-";
  return entries.map(([key, value]) => `${key} ${value}`).join(" | ");
}

function runtimeGateLabel(
  action:
    | {
        prefix?: string;
        msg?: string;
      }
    | null
    | undefined
) {
  const prefix = String(action?.prefix || "").toUpperCase();
  if (prefix.includes("PORTFOLIO_GATE_OPEN")) return "OPEN";
  if (prefix.includes("PORTFOLIO_GATE_BLOCKED")) return "BLOCKED";
  if (prefix) return enumLabel(prefix);
  return "-";
}

function quoteGuardLabel(
  quoteGuard:
    | {
        enabled?: boolean;
        required?: boolean;
        maxDriftPct?: number;
      }
    | null
    | undefined
) {
  if (!quoteGuard) return "-";
  if (!quoteGuard.enabled) return "OFF";
  const mode = quoteGuard.required ? "REQUIRED" : "BEST EFFORT";
  const drift = quoteGuard.maxDriftPct != null ? pctNum(quoteGuard.maxDriftPct) : "-";
  return `ON | ${mode} | drift ${drift}`;
}

function historyStatusLabel(snap: Snapshot | null | undefined, nowMs: number) {
  const history = snap?.history;
  if (!history?.enabled) return "OFF";
  if (history.lastErr) return `ERR | ${history.lastErr}`;
  if (history.lastWriteAt) {
    return `${history.writes ?? 0} writes | ${ageLabel(nowMs - history.lastWriteAt)} ago`;
  }
  return `${history.writes ?? 0} writes`;
}

function suppressionLabel(
  telemetry:
    | {
        eventsSeen?: number;
        eventsSuppressed?: number;
      }
    | null
    | undefined
) {
  const seen = telemetry?.eventsSeen ?? 0;
  const suppressed = telemetry?.eventsSuppressed ?? 0;
  if (seen <= 0) return "-";
  const pct = ((suppressed / seen) * 100).toFixed(1);
  return `${suppressed}/${seen} (${pct}%)`;
}

function secondaryOverviewSummary(slot: SlotRow) {
  const total = getSecondaryRows(slot).length;
  return `${primarySubslotDecisionLabel(slot)} | ${total}`;
}

function coinSpreadThresholdPct(slot: SlotRow) {
  const coin = String(slot.coin || "").toUpperCase();

  const perCoin: Record<string, number> = {
    BTC: 0.3,
    ETH: 0.35,
    XRP: 0.3,
    SOL: 0.3,
    ADA: 0.45,
    DOGE: 0.45,
    LTC: 0.45,
    TRX: 0.7,
  };

  return perCoin[coin] ?? 1.1;
}

function rotationDoctrineLabel(capital: PublicCapitalResponse | null | undefined) {
  return `Policy gate ${capital?.rotation?.enabled ? "ON" : "OFF"} | Basis required ${yesNo(capital?.rotation?.walletRequireBasis)} | Live executor ${yesNo(Boolean(capital?.rotation?.executorEnabled && (capital?.rotation?.liveEntryEnabled || capital?.rotation?.liveExitEnabled)))}`;
}

function topWalletCoins(capital: PublicCapitalResponse | null | undefined, limit = 5) {
  const list = Array.isArray(capital?.coins) ? capital.coins.slice() : [];
  return list
    .sort((a, b) => (b.audValue ?? 0) - (a.audValue ?? 0))
    .slice(0, Math.max(0, limit));
}

function movableWalletCoins(capital: PublicCapitalResponse | null | undefined) {
  const list = Array.isArray(capital?.coins) ? capital.coins.slice() : [];
  return list
    .filter(
      (coin) =>
        (coin.movableAudEstimate ?? 0) > 0 || coin.walletSourceReady === true || coin.rotationEligibleOut === true
    )
    .sort((a, b) => (b.movableAudEstimate ?? 0) - (a.movableAudEstimate ?? 0));
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
  return "-";
}

function getSubslots(slot: SlotRow): SubslotRow[] {
  if (Array.isArray(slot.subslots) && slot.subslots.length > 0) {
    return slot.subslots;
  }

  if (!slot.subslotState) return [];

  return [
    {
      subslotId: slot.subslotOrderId ?? `${slot.id}-legacy-subslot`,
      subslotSequence: slot.subslotCount ?? 1,
      subslotState: slot.subslotState,
      subslotTriggerBandIndex: slot.subslotTriggerBandIndex,
      subslotTriggerParentNetPct: slot.subslotTriggerParentNetPct,
      subslotEntryParentNetPct: slot.subslotEntryParentNetPct,
      subslotEntryMode: slot.subslotEntryMode,
      subslotSignalState: slot.subslotSignalState,
      subslotSignalReason: slot.subslotSignalReason,
      subslotNowMid: slot.subslotNowMid,
      subslotEntryMid: slot.subslotEntryMid,
      subslotGrossPct: slot.subslotGrossPct,
      subslotNetPct: slot.subslotNetPct,
      subslotPeakBid: slot.subslotPeakBid,
      subslotDrawdownPct: slot.subslotDrawdownPct,
      subslotBouncePct: slot.subslotBouncePct,
      subslotEmaGapPct: slot.subslotEmaGapPct,
      subslotProfitAud: slot.subslotProfitAud,
      subslotProfitPct: slot.subslotProfitPct,
      subslotExitReason: slot.subslotExitReason,
      subslotOpenedAt: slot.subslotOpenedAt,
      subslotClosedAt: slot.subslotClosedAt,
      subslotCooldownUntil: slot.subslotCooldownUntil,
      subslotLastError: slot.subslotLastError,
      subslotLastReconcileAt: slot.subslotLastReconcileAt,
      subslotLastReconcileNote: slot.subslotLastReconcileNote,
      subslotRequestedAud: slot.subslotRequestedAud,
      subslotRequestedCoinQty: slot.subslotRequestedCoinQty,
      subslotSubmittedRate: slot.subslotSubmittedRate,
      subslotActualAud: slot.subslotActualAud,
      subslotActualCoinQty: slot.subslotActualCoinQty,
      subslotActualRate: slot.subslotActualRate,
      subslotOrderId: slot.subslotOrderId,
      subslotFillStatus: slot.subslotFillStatus,
      subslotPreAudAvailable: slot.subslotPreAudAvailable,
      subslotPreCoinAvailable: slot.subslotPreCoinAvailable,
      subslotExitOrderId: slot.subslotExitOrderId,
      subslotExitRequestedCoinQty: slot.subslotExitRequestedCoinQty,
      subslotExitSubmittedRate: slot.subslotExitSubmittedRate,
      subslotExitExpectedAud: slot.subslotExitExpectedAud,
      subslotExitOrderAt: slot.subslotExitOrderAt,
      subslotExitActualAud: slot.subslotExitActualAud,
      subslotExitActualCoinQty: slot.subslotExitActualCoinQty,
      subslotExitActualRate: slot.subslotExitActualRate,
      subslotExitFilledAt: slot.subslotExitFilledAt,
      subslotRealizedAt: slot.subslotRealizedAt,
      subslotPendingMergeAud: slot.subslotPendingMergeAud,
      subslotLastMergedAud: slot.subslotLastMergedAud,
      subslotMergedAt: slot.subslotMergedAt,
      subslotLifetimeProfitAud: slot.subslotLifetimeProfitAud,
      subslotLifetimeCycles: slot.subslotLifetimeCycles,
      subslotTrackingSince: slot.subslotTrackingSince,
      subslotLowMid: slot.subslotLowMid,
      subslotLastMid: slot.subslotLastMid,
      subslotEmaFast: slot.subslotEmaFast,
      subslotEmaSlow: slot.subslotEmaSlow,
      subslotConfirmTicks: slot.subslotConfirmTicks,
    },
  ];
}

function getSecondaryRows(slot: SlotRow) {
  return getSubslots(slot);
}

function getPrimarySubslot(slot: SlotRow): SubslotRow | null {
  const subslots = getSubslots(slot);
  return subslots.length ? subslots[0] : null;
}

function secondaryPriorityScore(subslot: SubslotRow) {
  const state = String(subslot.subslotState || "").toUpperCase();
  const signal = String(subslot.subslotSignalState || "").toUpperCase();

  if (state === "SELL_SUBMITTED") return 100;
  if (state === "BUY_SUBMITTED") return 95;
  if (state === "ACTIVE") return 90;
  if (signal === "REVERSAL_CONFIRMING") return 70;
  if (signal === "BOUNCE_SEEN") return 60;
  if (signal === "TRACKING") return 50;
  if (signal === "ARMED") return 40;
  if (state === "CLOSED") return 20;
  return 10;
}

function getRelevantSecondaryRow(slot: SlotRow): SubslotRow | null {
  const secondaries = getSubslots(slot);
  if (!secondaries.length) return null;

  return [...secondaries].sort((a, b) => {
    const scoreDelta = secondaryPriorityScore(b) - secondaryPriorityScore(a);
    if (scoreDelta !== 0) return scoreDelta;

    const aAt = Number(
      a.subslotLastReconcileAt ??
      a.subslotClosedAt ??
      a.subslotOpenedAt ??
      a.subslotSequence ??
      0
    );
    const bAt = Number(
      b.subslotLastReconcileAt ??
      b.subslotClosedAt ??
      b.subslotOpenedAt ??
      b.subslotSequence ??
      0
    );
    return bAt - aAt;
  })[0] ?? null;
}

function getPrimarySecondarySnapshot(slot: SlotRow) {
  return getRelevantSecondaryRow(slot);
}

function isSubslotBusy(subslot: SubslotRow): boolean {
  const state = String(subslot.subslotState || "").toUpperCase();
  const signal = String(subslot.subslotSignalState || "").toUpperCase();
  return (
    state === "ACTIVE" ||
    state === "BUY_SUBMITTED" ||
    state === "SELL_SUBMITTED" ||
    signal === "TRACKING" ||
    signal === "ARMED" ||
    signal === "BOUNCE_SEEN" ||
    signal === "REVERSAL_CONFIRMING" ||
    signal === "SPREAD_BLOCKED"
  );
}

function getActiveSubslots(slot: SlotRow): SubslotRow[] {
  return getSubslots(slot).filter((subslot) => String(subslot.subslotState || "").toUpperCase() === "ACTIVE");
}

function getActiveSecondaryRows(slot: SlotRow) {
  return getActiveSubslots(slot);
}

function hasActiveSubslots(slot: SlotRow) {
  return getActiveSubslots(slot).length > 0;
}

function hasPendingSubslotBuys(slot: SlotRow) {
  return getSubslots(slot).some((subslot) => String(subslot.subslotState || "").toUpperCase() === "BUY_SUBMITTED");
}

function hasPendingSubslotSells(slot: SlotRow) {
  return getSubslots(slot).some((subslot) => String(subslot.subslotState || "").toUpperCase() === "SELL_SUBMITTED");
}

function getSubslotOpenCount(slot: SlotRow) {
  return getSubslots(slot).filter((subslot) => {
    const state = String(subslot.subslotState || "").toUpperCase();
    return state === "ACTIVE" || state === "BUY_SUBMITTED" || state === "SELL_SUBMITTED";
  }).length;
}

function getSubslotRealizedProfit(slot: SlotRow) {
  return roundMoney(
    getSubslots(slot).reduce((sum, subslot) => {
      const profit = Number(subslot.subslotProfitAud);
      return Number.isFinite(profit) ? sum + profit : sum;
    }, 0)
  );
}

function getClosedSubslotCount(slot: SlotRow) {
  return getSubslots(slot).filter((subslot) => String(subslot.subslotState || "").toUpperCase() === "CLOSED").length;
}

function countActiveSecondaries(slot: SlotRow) {
  return getActiveSubslots(slot).length;
}

function subslotLiveNowLabel(subslot: SubslotRow, parent: SlotRow) {
  if (subslot.subslotNowMid != null && Number.isFinite(subslot.subslotNowMid)) return fmt(subslot.subslotNowMid);
  if (parent.nowMid != null && Number.isFinite(parent.nowMid)) return fmt(parent.nowMid);
  return "-";
}

function subslotHeartbeatLabel(subslot: SubslotRow, nowMs: number) {
  if (subslot.subslotLastReconcileAt && Number.isFinite(subslot.subslotLastReconcileAt)) {
    return ageLabel(nowMs - subslot.subslotLastReconcileAt);
  }
  return "-";
}

function computeSlotFinancials(slotRows: SlotRow[]) {
  let openPnl = 0;
  let visibleRealized = 0;

  for (const s of slotRows) {
    const baseAud = Number(s.combinedEntryAud ?? s.entryAud ?? s.unitAud);
    const netPct = Number(s.netPct);
    const parentProfitAud = Number(s.profitAud);
    const subslots = getSubslots(s);

    if (isHoldingFamilyState(s.state) && Number.isFinite(baseAud) && Number.isFinite(netPct)) {
      openPnl += baseAud * (netPct / 100);
    }

    if (Number.isFinite(parentProfitAud)) {
      visibleRealized += parentProfitAud;
    }

    if (subslots.length > 0) {
      for (const subslot of subslots) {
        const subslotProfit = Number(subslot.subslotProfitAud);
        if (Number.isFinite(subslotProfit)) {
          visibleRealized += subslotProfit;
        }
      }
    } else {
      const subslotProfitAud = Number(s.subslotProfitAud);
      if (Number.isFinite(subslotProfitAud)) {
        visibleRealized += subslotProfitAud;
      }
    }
  }

  return {
    openPnl: roundMoney(openPnl),
    visibleRealized: roundMoney(visibleRealized),
  };
}

function stateClassName(value: string | null | undefined) {
  const normalized = String(value || "").toUpperCase().replace(/[_\s]+/g, "-");
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

function rawRegimeValue(s: SlotRow): string {
  return String(s.regime ?? s.consolidationState ?? "UNCLASSIFIED").toUpperCase();
}

function regimeLabel(s: SlotRow): string {
  return enumLabel(s.regime ?? s.consolidationState ?? "UNCLASSIFIED");
}

function regimeToneClass(s: SlotRow): string {
  const regime = rawRegimeValue(s);

  if (regime.includes("UPTREND") || regime.includes("BULL")) return "is-holding";
  if (regime.includes("DOWNTREND") || regime.includes("BEAR")) return "is-exiting";
  if (regime.includes("CONSOLIDATION")) return "is-tracking";
  return "is-muted";
}

function regimeSummary(s: SlotRow): string {
  const regime = rawRegimeValue(s);
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
  const primary = getPrimarySecondarySnapshot(s);
  const mode = String(primary?.subslotEntryMode || "").toUpperCase();
  const regime = rawRegimeValue(s);

  if (mode) return mode.replace(/_/g, " ");
  if (regime.includes("CONSOLIDATION")) return "CONSOLIDATION CAPTURE";
  if (regime.includes("UPTREND")) return "UPTREND CAPTURE";
  if (regime.includes("DOWNTREND") || regime.includes("BEAR")) return "COUNTER-TREND CAPTURE";
  return "TACTICAL CAPTURE";
}

function subslotDecisionLabel(subslot: SubslotRow) {
  const sub = String(subslot.subslotState || "").toUpperCase();
  const signal = String(subslot.subslotSignalState || "").toUpperCase();

  if (sub === "BUY_SUBMITTED") return "Entry pending";
  if (sub === "ACTIVE") return "Trade active";
  if (sub === "SELL_SUBMITTED") return "Exit pending";
  if (sub === "CLOSED" && subslot.subslotExitReason) return "Last trade closed";

  if (signal === "REVERSAL_CONFIRMING") return "Waiting for confirmation";
  if (signal === "BOUNCE_SEEN") return "Bounce detected";
  if (signal === "TRACKING") return "Tracking move";
  if (signal === "ARMED") return "Armed";
  if (signal === "NO_MARKET") return "No usable market";
  return "Idle";
}

function subslotToneClass(subslot: SubslotRow) {
  const sub = String(subslot.subslotState || "").toUpperCase();
  const signal = String(subslot.subslotSignalState || "").toUpperCase();

  if (sub === "BUY_SUBMITTED") return "is-deploying";
  if (sub === "ACTIVE") return "is-holding";
  if (sub === "SELL_SUBMITTED") return "is-exiting";
  if (sub === "CLOSED") return "is-muted";

  if (signal === "REVERSAL_CONFIRMING") return "is-deploying";
  if (signal === "BOUNCE_SEEN" || signal === "TRACKING" || signal === "ARMED") return "is-tracking";
  if (signal === "NO_MARKET") return "is-muted";

  return "is-muted";
}

function isIdleSubslot(subslot: SubslotRow) {
  const sub = String(subslot.subslotState || "").toUpperCase();
  const signal = String(subslot.subslotSignalState || "").toUpperCase();
  return sub === "CLOSED" && (!signal || signal === "NO_MARKET");
}

function primarySubslotToneClass(slot: SlotRow) {
  const primary = getPrimarySecondarySnapshot(slot);
  return primary ? subslotToneClass(primary) : "is-muted";
}

function primarySubslotDecisionLabel(slot: SlotRow) {
  const primary = getPrimarySecondarySnapshot(slot);
  return primary ? subslotDecisionLabel(primary) : "Idle";
}

function primarySubslotLiveNowLabel(slot: SlotRow) {
  const primary = getPrimarySecondarySnapshot(slot);
  return primary ? subslotLiveNowLabel(primary, slot) : "-";
}

function primarySubslotHeartbeatLabel(slot: SlotRow, nowMs: number) {
  const primary = getPrimarySecondarySnapshot(slot);
  return primary ? subslotHeartbeatLabel(primary, nowMs) : "-";
}

function subslotStateBadgeLabel(subslot: SubslotRow) {
  const state = String(subslot.subslotState || "").toUpperCase();
  if (state === "ACTIVE") return "JRD SECONDARY ACTIVE";
  if (state === "BUY_SUBMITTED") return "JRD SECONDARY ENTRY";
  if (state === "SELL_SUBMITTED") return "JRD SECONDARY EXIT";
  if (state === "CLOSED") return "JRD SECONDARY CLOSED";
  return "JRD SECONDARY IDLE";
}

function subslotTriggerBandLabel(subslot: SubslotRow) {
  const index = Number(subslot.subslotTriggerBandIndex);
  if (Number.isInteger(index) && index >= 0) return `Band ${index + 1}`;
  if (subslot.subslotTriggerParentNetPct != null && Number.isFinite(subslot.subslotTriggerParentNetPct)) {
    return "Band trigger";
  }
  return "Legacy trigger";
}

function subslotTriggerSummary(subslot: SubslotRow) {
  const parts: string[] = [];
  const band = subslotTriggerBandLabel(subslot);
  if (band !== "Legacy trigger" || subslot.subslotTriggerParentNetPct != null) parts.push(band);
  if (subslot.subslotTriggerParentNetPct != null && Number.isFinite(subslot.subslotTriggerParentNetPct)) {
    parts.push(`trigger ${pctNum(subslot.subslotTriggerParentNetPct)}`);
  }
  if (subslot.subslotEntryParentNetPct != null && Number.isFinite(subslot.subslotEntryParentNetPct)) {
    parts.push(`opened ${pctNum(subslot.subslotEntryParentNetPct)}`);
  }
  return parts.length ? parts.join(" | ") : "Legacy trigger";
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
  if (rawRegimeValue(s).includes("CONSOLIDATION")) return "BUILDING";
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
  const regime = rawRegimeValue(s);
  const updated = slotHeartbeatLabel(s, nowMs);

  // Parent State Analysis
  if (state === "EXITING") {
    parts.push("Jrd Primary exit is being resolved live.");
  } else if (state === "DEPLOYING") {
    parts.push("Jrd Primary entry is being confirmed live.");
  } else if (state === "LVL4_TRAIL") {
    parts.push("Jrd Primary is in high-protection trailing mode.");
  } else if (isHoldingFamilyState(state)) {
    parts.push("Jrd Primary is live and being managed.");
  } else if (state === "WAITING_ENTRY") {
    parts.push("Jrd Primary is waiting for a qualified re-entry.");
  } else {
    parts.push("Jrd Primary is being observed.");
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
  if (updated !== "-") {
    parts.push(`Updated ${updated} ago.`);
  }

  return parts.join(" ");
}

function liveSubslotAnalysis(subslot: SubslotRow, parent: SlotRow, nowMs: number) {
  const parts: string[] = [];

  const subState = String(subslot.subslotState || "").toUpperCase();
  const signal = String(subslot.subslotSignalState || "").toUpperCase();
  const netPct = subslot.subslotNetPct;
  const bouncePct = subslot.subslotBouncePct;
  const emaGapPct = subslot.subslotEmaGapPct;
  const liveNow = subslot.subslotNowMid ?? parent.nowMid;
  const updated = subslotHeartbeatLabel(subslot, nowMs);

  // Subslot State Analysis
  if (subState === "BUY_SUBMITTED") {
    parts.push("Jrd Secondary entry is pending.");
  } else if (subState === "ACTIVE") {
    parts.push("Jrd Secondary trade is live.");
  } else if (subState === "SELL_SUBMITTED") {
    parts.push("Jrd Secondary exit is pending.");
  } else if (subState === "CLOSED") {
    parts.push("Jrd Secondary is closed.");
  } else {
    parts.push("Jrd Secondary is idle.");
  }

  if (subslot.subslotTriggerParentNetPct != null && Number.isFinite(subslot.subslotTriggerParentNetPct)) {
    parts.push(`${subslotTriggerBandLabel(subslot)} fired at ${pctNum(subslot.subslotTriggerParentNetPct)} parent net.`);
  }

  if (subslot.subslotEntryParentNetPct != null && Number.isFinite(subslot.subslotEntryParentNetPct)) {
    parts.push(`Parent net at entry was ${pctNum(subslot.subslotEntryParentNetPct)}.`);
  }

  // Signal Analysis
  if (signal === "REVERSAL_CONFIRMING") {
    parts.push("Signal is confirming.");
  } else if (signal === "BOUNCE_SEEN") {
    parts.push("Bounce has been detected.");
  } else if (signal === "TRACKING") {
    parts.push("Jrd Secondary is tracking structure.");
  } else if (signal === "ARMED") {
    parts.push("Jrd Secondary is armed.");
  } else if (signal === "SPREAD_BLOCKED") {
    parts.push("Jrd Secondary is blocked by spread.");
  } else if (signal === "NO_MARKET") {
    parts.push("No usable live market read.");
  }

  // Subslot Live Price
  if (Number.isFinite(liveNow)) {
    parts.push(`Live now ${fmt(liveNow)}.`);
  }

  // Subslot Net Percentage Calculation
  if (Number.isFinite(netPct)) {
    if (Number(netPct) > 0) parts.push(`Jrd Secondary net is green at ${pctNum(netPct)}.`);
    else if (Number(netPct) < 0) parts.push(`Jrd Secondary net is red at ${pctNum(netPct)}.`);
    else parts.push(`Jrd Secondary net is flat at ${pctNum(netPct)}.`);
  }

  // Bounce and EMA Gap Analysis
  if (Number.isFinite(bouncePct)) {
    parts.push(`Bounce is ${pctNum(bouncePct)}.`);
  }

  if (Number.isFinite(emaGapPct)) {
    parts.push(`EMA gap is ${pctNum(emaGapPct)}.`);
  }

  // Updated Time
  if (updated !== "-") {
    parts.push(`Updated ${updated} ago.`);
  }

  return parts.join(" ");
}

function primaryLiveSubslotAnalysis(slot: SlotRow, nowMs: number) {
  const primary = getPrimarySecondarySnapshot(slot);
  return primary ? liveSubslotAnalysis(primary, slot, nowMs) : "No Jrd Secondary records available.";
}

function detailRowsForSlot(s: SlotRow, nowMs: number) {
  return [
    { k: "Slot", v: s.id },
    { k: "Coin", v: slotCoin(s) },
    { k: "Market", v: s.market ?? "-" },
    { k: "State", v: stateLabel(s) },
    { k: "Tracking", v: trackingLabel(s) },
    { k: "Decision", v: engineDecisionLabel(s) },
    { k: "Regime", v: regimeLabel(s) },
    { k: "Regime strength", v: s.regimeStrength != null ? String(s.regimeStrength) : "-" },
    { k: "Trend score", v: s.regimeTrendScore != null ? String(s.regimeTrendScore) : "-" },
    { k: "Breakout ready", v: s.consolidationBreakoutReady == null ? "-" : s.consolidationBreakoutReady ? "YES" : "NO" },
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
  const subslots = getSubslots(s);
  const hasPendingSell = subslots.some((subslot) => String(subslot.subslotState || "").toUpperCase() === "SELL_SUBMITTED");
  const hasPendingBuy = subslots.some((subslot) => String(subslot.subslotState || "").toUpperCase() === "BUY_SUBMITTED");
  const hasActive = subslots.some((subslot) => String(subslot.subslotState || "").toUpperCase() === "ACTIVE");

  if (String(s.state || "").toUpperCase() === "EXITING") return 100;
  if (String(s.state || "").toUpperCase() === "DEPLOYING") return 95;
  if (hasPendingSell) return 90;
  if (hasPendingBuy) return 85;
  if (hasActive) return 80;
  if (String(s.state || "").toUpperCase() === "LVL4_TRAIL") return 75;
  if (isHoldingFamilyState(s.state)) return 70;
  if (String(s.trackingState || "").toUpperCase() === "REVERSAL_CONFIRMING") return 60;
  if (s.consolidationBreakoutReady === true) return 55;
  if (String(s.trackingState || "").toUpperCase() === "TRACKING") return 40;
  if (String(s.trackingState || "").toUpperCase() === "DRAWDOWN_SEEN") return 35;
  return 10;
}

function priorityRailLabel(s: SlotRow) {
  if (hasActiveSubslots(s)) return "JRD SECONDARY ACTIVE";
  if (hasPendingSubslotBuys(s)) return "JRD SECONDARY ENTRY";
  if (hasPendingSubslotSells(s)) return "JRD SECONDARY EXIT";
  if (String(s.state || "").toUpperCase() === "EXITING") return "EXITING";
  if (String(s.state || "").toUpperCase() === "DEPLOYING") return "ENTERING";
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
  const spreadLimit = coinSpreadThresholdPct(s);

  if (state === "EXITING") return "RESOLVING EXIT";
  if (state === "DEPLOYING") return "CONFIRMING ENTRY";
  if (state === "LVL4_TRAIL") return "HIGH STRUCTURE";
  if (isHoldingFamilyState(state) && Number(s.netPct) > 0) return "PROTECTED";
  if (hasPendingSubslotSells(s)) return "JRD SECONDARY EXIT";
  if (hasPendingSubslotBuys(s)) return "JRD SECONDARY ENTRY";
  if (hasActiveSubslots(s)) return "JRD SECONDARY LIVE";
  if (tracking === "REVERSAL_CONFIRMING") return "BUILDING";
  if (s.consolidationBreakoutReady === true) return "READY";
  if (tracking === "SPREAD_BLOCKED" || (Number.isFinite(spread) && spread > spreadLimit)) {
    return "UNDER FRICTION";
  }
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
    const subslot = getSubslotRealizedProfit(s);

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
  const [rowsAll, setRowsAll] = useState<MarketRow[]>([]);
  const [rowsAud, setRowsAud] = useState<MarketRow[]>([]);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [meta, setMeta] = useState<PublicMetaResponse | null>(null);
  const [capital, setCapital] = useState<PublicCapitalResponse | null>(null);
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

  const fetchMarketRowsAll = useCallback(async (signal?: AbortSignal) => {
    const j = await fetchJson<{ rows?: MarketRow[] }>("/api/market/all", signal);
    return Array.isArray(j?.rows) ? j.rows : [];
  }, [fetchJson]);

  const fetchMarketRowsAud = useCallback(async (signal?: AbortSignal) => {
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

  const fetchPublicCapital = useCallback(async (signal?: AbortSignal) => {
    return await fetchJson<PublicCapitalResponse>("/api/public/capital", signal);
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

  const pollCore = useCallback(async () => {
    const pollId = ++latestPollRef.current;
    const ctrl = new AbortController();

    try {
      const [
        marketRowsAllRes,
        marketRowsAudRes,
        snapshotRes,
        metaRes,
        slotsRes,
        eventsRes,
      ] = await Promise.allSettled([
        fetchMarketRowsAll(ctrl.signal),
        fetchMarketRowsAud(ctrl.signal),
        fetchSnap(ctrl.signal),
        fetchMeta(ctrl.signal),
        fetchPublicSlots(ctrl.signal),
        fetchPublicEvents(ctrl.signal),
      ]);

      if (disposedRef.current) return;
      if (pollId !== latestPollRef.current) return;

      const failures: string[] = [];
      let successCount = 0;

      if (marketRowsAllRes.status === "fulfilled") {
        setRowsAll(marketRowsAllRes.value);
        successCount += 1;
      } else {
        failures.push(`market/all unavailable`);
      }

      if (marketRowsAudRes.status === "fulfilled") {
        setRowsAud(marketRowsAudRes.value);
        successCount += 1;
      } else {
        failures.push(`market/aud unavailable`);
      }

      if (snapshotRes.status === "fulfilled") {
        setSnap(snapshotRes.value);
        successCount += 1;
      } else {
        failures.push(`market/snapshot unavailable`);
      }

      if (metaRes.status === "fulfilled") {
        setMeta(metaRes.value);
        successCount += 1;
      } else {
        failures.push(`meta unavailable`);
      }

      if (slotsRes.status === "fulfilled") {
        setSlotRows(slotsRes.value);
        successCount += 1;
      } else {
        failures.push(`slots unavailable`);
      }

      if (eventsRes.status === "fulfilled") {
        setEvents(eventsRes.value);
        successCount += 1;
      } else {
        failures.push(`events unavailable`);
      }

      if (!failures.length) {
        setErr(null);
      } else if (successCount > 0) {
        setErr(`Partial refresh issue: ${failures.join(" | ")}\nENGINE_BASE: ${BASE}`);
      } else {
        setErr(`All engine endpoints failed: ${failures.join(" | ")}\nENGINE_BASE: ${BASE}`);
      }
    } catch (e: unknown) {
      if (disposedRef.current) return;
      if (pollId !== latestPollRef.current) return;

      const msg = e instanceof Error ? e.message : String(e);
      setErr(`${msg}\nENGINE_BASE: ${BASE}`);
    } finally {
      ctrl.abort();
    }
  }, [BASE, fetchMarketRowsAll, fetchMarketRowsAud, fetchSnap, fetchMeta, fetchPublicSlots, fetchPublicEvents]);

  const pollCapital = useCallback(async () => {
    const ctrl = new AbortController();

    try {
      const capitalRes = await fetchPublicCapital(ctrl.signal);
      if (disposedRef.current) return;
      setCapital(capitalRes);
    } catch (e: unknown) {
      if (disposedRef.current) return;
    } finally {
      ctrl.abort();
    }
  }, [fetchPublicCapital]);

  const refresh = useCallback(async () => {
    await Promise.all([pollCore(), pollCapital()]);
  }, [pollCore, pollCapital]);

  useEffect(() => {
    disposedRef.current = false;

    void pollCore();
    void pollCapital();

    const coreId = window.setInterval(() => {
      void pollCore();
    }, ENGINE_POLL_INTERVAL_MS);

    const capitalId = window.setInterval(() => {
      void pollCapital();
    }, CAPITAL_POLL_INTERVAL_MS);

    return () => {
      disposedRef.current = true;
      window.clearInterval(coreId);
      window.clearInterval(capitalId);
    };
  }, [pollCore, pollCapital]);

  return { rowsAll, rowsAud, snap, meta, capital, slotRows, events, err, refresh };
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
  runtimeWarnings: string[];
  nowMs: number;
}) {
  const { snap, meta, architecture, executionMode, fixedPresent, feedCount, lastAction, view, runtimeWarnings, nowMs } = props;

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

        <div className={`engine-runtime-warnings ${runtimeWarnings.length ? "has-warnings" : "is-clear"}`}>
          <div className="engine-runtime-title">Runtime Warnings</div>
          {runtimeWarnings.length ? (
            runtimeWarnings.map((warning, index) => (
              <div key={`${warning}-${index}`} className="engine-runtime-warning">{warning}</div>
            ))
          ) : (
            <div className="engine-runtime-warning engine-runtime-warning--muted">No runtime warnings.</div>
          )}
        </div>
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
          Snapshot: {formatSnapshotLabel(snap, nowMs)}
        </div>
      </aside>
    </header>
  );
});

const CaptureGrid = React.memo(function CaptureGrid(props: {
  openPnl: number;
  windowHarvest: number;
  visibleRealized: number;
  audAvailable: number | null | undefined;
  walletAudValue: number | null | undefined;
  movableAudEstimate: number | null | undefined;
  rotationMode: string;
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
          <span>|</span>
          <span>Visible Realized {moneyAud(props.visibleRealized)}</span>
        </div>
      </div>

      <div className="engine-capture card machine-surface panel-frame">
        <div className="cap-k">Capital Mobility</div>
        <div className="cap-v">{moneyAud(props.audAvailable)}</div>
        <div className="cap-sub">
          <span>Wallet Value {moneyAud(props.walletAudValue)}</span>
          <span>|</span>
          <span>Movable {moneyAud(props.movableAudEstimate)}</span>
          <span>|</span>
          <span>{props.rotationMode}</span>
        </div>
      </div>

      <div className="engine-capture card machine-surface panel-frame">
        <div className="cap-k">Registry Sweep</div>
        <div className="cap-v">{props.nextSweepLabel}</div>
        <div className="cap-sub">
          <span>Window {props.currentWindow ?? "-"}</span>
          <span>|</span>
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
          <span>|</span>
          <span>Holding {props.holdingCount}</span>
        </div>
      </div>

      <div className="engine-capture card machine-surface panel-frame">
        <div className="cap-k">Breakout Ready</div>
        <div className="cap-v">{props.breakoutReady}</div>
        <div className="cap-sub">
          <span>Consolidation {props.consolidation}</span>
          <span>|</span>
          <span>Active Jrd Secondary {props.activeSubslots}</span>
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
              <strong>{slotCoin(s)}</strong> | {regimeLabel(s)}
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
          className={`button ghost ${props.feed === "engine" ? "active" : ""}`}
          onClick={() => props.setFeed("engine")}
        >
          Feed: Engine
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
          Sort: A-Z
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
          placeholder="Filter coins / states / regime..."
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
  const carouselBaseSlot = props.slots[Math.max(0, Math.min(props.currentIndex, props.slots.length - 1))] ?? null;
  const carouselPrimary = carouselBaseSlot ? getPrimarySubslot(carouselBaseSlot) : null;
  const carouselSlot = carouselBaseSlot && carouselPrimary ? { ...carouselBaseSlot, ...carouselPrimary } : carouselBaseSlot;
  const carouselSubslots = carouselBaseSlot ? getSecondaryRows(carouselBaseSlot) : [];
  const carouselActiveCount = carouselBaseSlot ? countActiveSecondaries(carouselBaseSlot) : 0;
  const carouselPendingEntryCount = carouselSubslots.filter(
    (subslot) => String(subslot.subslotState || "").toUpperCase() === "BUY_SUBMITTED"
  ).length;
  const carouselPendingExitCount = carouselSubslots.filter(
    (subslot) => String(subslot.subslotState || "").toUpperCase() === "SELL_SUBMITTED"
  ).length;

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
            <svg className="engine-carousel-nav-icon" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M10.5 3.5 6 8l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
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
            <svg className="engine-carousel-nav-icon" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M5.5 3.5 10 8l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
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
                {slotCoin(carouselSlot)} <span>{carouselSlot.market ?? "-"}</span>
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

            <div className={`engine-subslot ${primarySubslotToneClass(carouselSlot)}`}>
              <div className="engine-subslot-head">
                <span className="engine-subslot-title">{subslotModeLabel(carouselSlot)}</span>
                <span className="engine-subslot-state">{primarySubslotDecisionLabel(carouselSlot)}</span>
              </div>

              <div className="engine-subslot-copy">{primaryLiveSubslotAnalysis(carouselSlot, props.nowMs)}</div>

              <div className="engine-subslot-grid">
                <div className="engine-subslot-item">
                  <div className="engine-subslot-k">Jrd Secondary</div>
                  <div className="engine-subslot-v">{carouselSubslots.length}</div>
                </div>

                <div className="engine-subslot-item">
                  <div className="engine-subslot-k">Active</div>
                  <div className="engine-subslot-v">{carouselActiveCount}</div>
                </div>

                <div className="engine-subslot-item">
                  <div className="engine-subslot-k">Pending Entry</div>
                  <div className="engine-subslot-v">{carouselPendingEntryCount}</div>
                </div>

                <div className="engine-subslot-item">
                  <div className="engine-subslot-k">Pending Exit</div>
                  <div className="engine-subslot-v">{carouselPendingExitCount}</div>
                </div>
              </div>

              {carouselPrimary && (isSubslotBusy(carouselPrimary) || !isIdleSubslot(carouselPrimary)) ? (
                <div className="engine-subslot-grid">
                  <div className="engine-subslot-item">
                    <div className="engine-subslot-k">Band</div>
                    <div className="engine-subslot-v">{subslotTriggerBandLabel(carouselPrimary)}</div>
                  </div>

                  <div className="engine-subslot-item">
                    <div className="engine-subslot-k">Trigger</div>
                    <div className="engine-subslot-v">{pctNum(carouselPrimary.subslotTriggerParentNetPct)}</div>
                  </div>

                  <div className="engine-subslot-item">
                    <div className="engine-subslot-k">Parent @ Open</div>
                    <div className="engine-subslot-v">{pctNum(carouselPrimary.subslotEntryParentNetPct)}</div>
                  </div>

                  <div className="engine-subslot-item">
                    <div className="engine-subslot-k">Signal</div>
                    <div className="engine-subslot-v">{carouselSlot.subslotSignalState ?? "-"}</div>
                  </div>

                  <div className="engine-subslot-item">
                    <div className="engine-subslot-k">Confirm</div>
                    <div className="engine-subslot-v">
                      {carouselSlot.subslotConfirmTicks != null ? carouselSlot.subslotConfirmTicks : "-"}
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
  <div>Regime</div>
  <div>Decision</div>
  <div>Position</div>
  <div>Jrd Secondary</div>
  <div>Live Analysis</div>
  <div>Health</div>
  <div className="num">Net</div>
  <div className="num">Open</div>
</div>

        {props.slots.length ? (
          props.slots.map((s) => (
            <button type="button" className="ledger-row" key={s.id} onClick={() => props.onOpenSlot(s.id)}>
  <div className="ledger-slotid">{s.id}</div>
  <div className={regimeToneClass(s)}>{regimeLabel(s)}</div>
  <div>{engineDecisionLabel(s)}</div>
  <div className={stateClassName(stateLabel(s))}>{stateLabel(s)}</div>
  <div className={primarySubslotToneClass(s)}>
    {secondaryOverviewSummary(s)}
  </div>
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
          Fixed: <strong>{props.fixedPresent}</strong> | Missing: <strong>{props.fixedMissing.length}</strong>
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
          <div className="num">Open</div>
        </div>

        {props.slots.length ? (
          props.slots.map((s) => {
            const expanded = props.expandedLedgerSlotId === s.id;
            const rows = detailRowsForSlot(s, props.nowMs);
            const subslots = getSecondaryRows(s);

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
                  <div>{s.market ?? "-"}</div>
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

                    <div className={`ledger-subpanel-badge secondary-summary ${primarySubslotToneClass(s)}`}>
                      {primaryLiveSubslotAnalysis(s, props.nowMs)}
                    </div>

                    {subslots.length > 0 && (
                      <div className="secondary-list subslot-list">
                        {subslots.map((subslot, index) => (
                          <div key={subslot.subslotId ?? `${s.id}-subslot-${index}`} className="secondary-card subslot-card">
                            <div className="ledger-subpanel-grid secondary-grid">
                              <div className="ledger-subpanel-item">
                            <div className="ledger-subpanel-k">Jrd Secondary</div>
                                <div className="ledger-subpanel-v">
                                  Jrd Secondary #{subslot.subslotSequence ?? index + 1} | {subslot.subslotId ?? "legacy"}
                                </div>
                              </div>
                              <div className="ledger-subpanel-item">
                                <div className="ledger-subpanel-k">Label</div>
                                <div className={`ledger-subpanel-v ${subslotToneClass(subslot)}`}>{subslotStateBadgeLabel(subslot)}</div>
                              </div>
                              <div className="ledger-subpanel-item">
                                <div className="ledger-subpanel-k">Trigger Band</div>
                                <div className="ledger-subpanel-v">{subslotTriggerBandLabel(subslot)}</div>
                              </div>
                              <div className="ledger-subpanel-item">
                                <div className="ledger-subpanel-k">Trigger Summary</div>
                                <div className="ledger-subpanel-v">{subslotTriggerSummary(subslot)}</div>
                              </div>
                              <div className="ledger-subpanel-item">
                                <div className="ledger-subpanel-k">State</div>
                                <div className="ledger-subpanel-v">{subslot.subslotState ?? "-"}</div>
                              </div>
                              <div className="ledger-subpanel-item">
                                <div className="ledger-subpanel-k">Mode</div>
                                <div className="ledger-subpanel-v">{subslot.subslotEntryMode ?? "-"}</div>
                              </div>
                              <div className="ledger-subpanel-item">
                                <div className="ledger-subpanel-k">Signal</div>
                                <div className="ledger-subpanel-v">{subslot.subslotSignalState ?? "-"}</div>
                              </div>
                              <div className="ledger-subpanel-item">
                                <div className="ledger-subpanel-k">Net</div>
                                <div className="ledger-subpanel-v">{pctNum(subslot.subslotNetPct)}</div>
                              </div>
                              <div className="ledger-subpanel-item">
                                <div className="ledger-subpanel-k">Profit AUD</div>
                                <div className="ledger-subpanel-v">{moneyAud(subslot.subslotProfitAud)}</div>
                              </div>
                              <div className="ledger-subpanel-item">
                                <div className="ledger-subpanel-k">Entry Mid</div>
                                <div className="ledger-subpanel-v">{fmt(subslot.subslotEntryMid)}</div>
                              </div>
                              <div className="ledger-subpanel-item">
                                <div className="ledger-subpanel-k">Live Now</div>
                                <div className="ledger-subpanel-v">{subslotLiveNowLabel(subslot, s)}</div>
                              </div>
                              <div className="ledger-subpanel-item">
                                <div className="ledger-subpanel-k">Bounce</div>
                                <div className="ledger-subpanel-v">{pctNum(subslot.subslotBouncePct)}</div>
                              </div>
                              <div className="ledger-subpanel-item">
                                <div className="ledger-subpanel-k">EMA Gap</div>
                                <div className="ledger-subpanel-v">{pctNum(subslot.subslotEmaGapPct)}</div>
                              </div>
                              <div className="ledger-subpanel-item">
                                <div className="ledger-subpanel-k">Recovered</div>
                                <div className="ledger-subpanel-v">
                                  {subslot.subslotRecoveredConfirmed == null
                                    ? "-"
                                    : subslot.subslotRecoveredConfirmed
                                    ? "YES"
                                    : "NO"}
                                </div>
                              </div>
                              <div className="ledger-subpanel-item">
                                <div className="ledger-subpanel-k">Exit Reason</div>
                                <div className="ledger-subpanel-v">{subslot.subslotExitReason ?? "-"}</div>
                              </div>
                              <div className="ledger-subpanel-item">
                                <div className="ledger-subpanel-k">Updated</div>
                                <div className="ledger-subpanel-v">{subslotHeartbeatLabel(subslot, props.nowMs)}</div>
                              </div>
                              <div className="ledger-subpanel-item">
                                <div className="ledger-subpanel-k">Reconcile</div>
                                <div className="ledger-subpanel-v">{subslot.subslotLastReconcileNote ?? "-"}</div>
                              </div>
                            </div>

                            <div className={`ledger-subpanel-badge ${subslotToneClass(subslot)}`}>
                              {liveSubslotAnalysis(subslot, s, props.nowMs)}
                            </div>

                            {subslot.subslotLastError ? (
                              <div className="ledger-subpanel-badge is-exiting">{subslot.subslotLastError}</div>
                            ) : null}
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
        <span className="engine-about-toggle">{props.aboutOpen ? "-" : "+"}</span>
      </button>

      {props.aboutOpen ? (
        <div id="engine-about" className="card machine-surface panel-frame engine-about-panel">
          <div className="engine-about-title">Jeroid JRD Ledger</div>

          <p>
            This page presents the machine in public-facing language. Each Jeroid slot belongs to one fixed market
            identity and independently waits, deploys, holds, exits, and re-enters under the same rules.
          </p>

          <p>
            <strong>Market</strong> shows the detected regime.
            <br />
            <strong>Decision</strong> shows what the engine is doing with that regime.
            <br />
            <strong>Jrd Primary</strong> shows the primary lifecycle.
            <br />
            <strong>Jrd Secondary</strong> shows the secondary tactical capture layer inside the hold window.
          </p>

          <div className="engine-about-h">Machine order</div>
          <ul>
            <li>Harvester maintains the fixed slot registry.</li>
            <li>Executor evaluates each slot's own coin only.</li>
            <li>Manager controls hold, lock, exit, Jrd Secondary logic, and regime interpretation.</li>
            <li>Rotation remains a separate capital-handling layer.</li>
            <li>Ledger persists public machine proof for inspection.</li>
          </ul>

          <div className="engine-about-h">Key truths</div>
          <ul>
            <li>Slot identity is permanent coin identity.</li>
            <li>Open Jrd Primary PnL is floating and not harvested.</li>
            <li>Jrd Secondary PnL remains separate until merge on Jrd Primary reset.</li>
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
        <span className="slot-block-toggle-label">{props.title}</span>
        <span className="slot-block-toggle-icon" aria-hidden="true">{open ? "-" : "+"}</span>
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
          <svg className="slot-modal-close-icon" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 4l8 8M12 4 4 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        <div className="slot-modal-scroll">
          <div className="slot-modal-top">
            <div>
              <div className="slot-modal-id">{slot.id}</div>
              <div className="slot-modal-sub">
                {slotCoin(slot)} | {slot.market ?? "-"} |{" "}
                <span className={stateClassName(stateLabel(slot))}>{stateLabel(slot)}</span> |{" "}
                <span className={regimeToneClass(slot)}>{regimeLabel(slot)}</span>
              </div>
            </div>

            <div className="slot-modal-meta">
              <span className="slot-modal-chip">Esc to close</span>
              <span className="slot-modal-chip">{slotHealthLabel(slot)}</span>
            </div>
          </div>

          <div className="slot-modal-strip" aria-label="Slot summary strip">
            <div className="slot-modal-strip-item">
              <div className="slot-k">Coin</div>
              <div className="slot-v">{slotCoin(slot)}</div>
            </div>
            <div className="slot-modal-strip-item">
              <div className="slot-k">Market</div>
              <div className="slot-v">{slot.market ?? "-"}</div>
            </div>
            <div className="slot-modal-strip-item">
              <div className="slot-k">State</div>
              <div className={`slot-v ${stateClassName(stateLabel(slot))}`}>{stateLabel(slot)}</div>
            </div>
            <div className="slot-modal-strip-item">
              <div className="slot-k">Regime</div>
              <div className={`slot-v ${regimeToneClass(slot)}`}>{regimeLabel(slot)}</div>
            </div>
            <div className="slot-modal-strip-item">
              <div className="slot-k">Health</div>
              <div className="slot-v">{slotHealthLabel(slot)}</div>
            </div>
          </div>

          <CollapsibleBlock title="Overview" defaultOpen>
            <div className="slot-section">Decision Summary</div>

            <div className="slot-modal-grid">
              <div>
                <div className="slot-k">Jrd Primary</div>
                <div className="slot-v">{slot.id}</div>
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

          <CollapsibleBlock title="Jrd Primary" defaultOpen>
            <div className="slot-section">Core Metrics</div>

            <div className="slot-modal-grid">
              <div><div className="slot-k">Unit</div><div className="slot-v">{moneyAud(slot.unitAud)}</div></div>
              <div><div className="slot-k">Cycles</div><div className="slot-v">{slot.cycles ?? 0}</div></div>
              <div><div className="slot-k">Entry</div><div className="slot-v">{effectiveEntryLabel(slot)}</div></div>
              <div><div className="slot-k">Now</div><div className="slot-v">{effectiveNowLabel(slot)}</div></div>
              <div><div className="slot-k">Gross</div><div className="slot-v">{pctNum(slot.grossPct)}</div></div>
              <div><div className="slot-k">Net</div><div className="slot-v">{pctNum(slot.netPct)}</div></div>
              <div><div className="slot-k">Level</div><div className="slot-v">{slot.level ? `LVL${slot.level}` : "-"}</div></div>
              <div><div className="slot-k">Lock</div><div className="slot-v">{lockDisplay(slot)}</div></div>
              <div><div className="slot-k">Spread</div><div className="slot-v">{pctNum(slot.nowSpreadPct)}</div></div>
              <div><div className="slot-k">Drawdown</div><div className="slot-v">{pctNum(slot.drawdownPct)}</div></div>
              <div><div className="slot-k">Re-entry target</div><div className="slot-v">{fmt(slot.reentryTargetMid)}</div></div>
              <div><div className="slot-k">Exit reason</div><div className="slot-v">{slot.exitReason ?? "-"}</div></div>
              <div><div className="slot-k">Created</div><div className="slot-v">{ageLabel(nowMs - slot.createdAt)}</div></div>
              <div><div className="slot-k">Updated</div><div className="slot-v">{slotHeartbeatLabel(slot, nowMs)}</div></div>
            </div>
          </CollapsibleBlock>

          <CollapsibleBlock title="Jrd Secondary" defaultOpen>
            <div className="slot-section">Jrd Primary Secondary Summary</div>

              <div className="slot-modal-grid">
              <div><div className="slot-k">Total Jrd Secondary</div><div className="slot-v">{getSecondaryRows(slot).length}</div></div>
              <div><div className="slot-k">Active</div><div className="slot-v">{getActiveSecondaryRows(slot).length}</div></div>
              <div><div className="slot-k">Pending Entry</div><div className="slot-v">{hasPendingSubslotBuys(slot) ? "YES" : "NO"}</div></div>
              <div><div className="slot-k">Pending Exit</div><div className="slot-v">{hasPendingSubslotSells(slot) ? "YES" : "NO"}</div></div>
              <div><div className="slot-k">Open Jrd Secondary</div><div className="slot-v">{getSubslotOpenCount(slot)}</div></div>
              <div><div className="slot-k">Closed Jrd Secondary</div><div className="slot-v">{getClosedSubslotCount(slot)}</div></div>
              <div><div className="slot-k">Realized Jrd Secondary PnL</div><div className="slot-v">{moneyAud(getSubslotRealizedProfit(slot))}</div></div>
              {getSecondaryRows(slot).length ? (
                <>
                  <div><div className="slot-k">Latest Jrd Secondary</div><div className={`slot-v slot-subslot ${primarySubslotToneClass(slot)}`}>{primarySubslotDecisionLabel(slot)}</div></div>
                  <div><div className="slot-k">Latest Trigger Band</div><div className="slot-v">{getPrimarySecondarySnapshot(slot) ? subslotTriggerBandLabel(getPrimarySecondarySnapshot(slot) as SubslotRow) : "-"}</div></div>
                  <div><div className="slot-k">Latest Trigger Summary</div><div className="slot-v">{getPrimarySecondarySnapshot(slot) ? subslotTriggerSummary(getPrimarySecondarySnapshot(slot) as SubslotRow) : "-"}</div></div>
                  <div><div className="slot-k">Latest Live Now</div><div className="slot-v">{primarySubslotLiveNowLabel(slot)}</div></div>
                  <div><div className="slot-k">Latest Updated</div><div className="slot-v">{primarySubslotHeartbeatLabel(slot, nowMs)}</div></div>
                </>
              ) : null}
            </div>

            {getSecondaryRows(slot).length ? (
              <>
                <div className="slot-section">Latest Jrd Secondary</div>
                <div><div className="slot-k">Live Analysis</div><div className="slot-v">{primaryLiveSubslotAnalysis(slot, nowMs)}</div></div>

              <div className="secondary-list subslot-list">
                {getSecondaryRows(slot).map((subslot, index) => (
                  <div key={subslot.subslotId ?? `${slot.id}-modal-subslot-${index}`} className="secondary-card subslot-card">
                    <div className="slot-section">
                      Jrd Secondary #{subslot.subslotSequence ?? index + 1} | {subslot.subslotId ?? "legacy"} | {subslotStateBadgeLabel(subslot)}
                    </div>

                    <div className="slot-modal-grid secondary-grid">
                      <div><div className="slot-k">Trigger Band</div><div className="slot-v">{subslotTriggerBandLabel(subslot)}</div></div>
                      <div><div className="slot-k">Trigger Level</div><div className="slot-v">{pctNum(subslot.subslotTriggerParentNetPct)}</div></div>
                      <div><div className="slot-k">Parent Net @ Open</div><div className="slot-v">{pctNum(subslot.subslotEntryParentNetPct)}</div></div>
                      <div><div className="slot-k">State</div><div className="slot-v">{subslot.subslotState ?? "-"}</div></div>
                      <div><div className="slot-k">Mode</div><div className="slot-v">{subslot.subslotEntryMode ?? "-"}</div></div>
                      <div><div className="slot-k">Signal</div><div className="slot-v">{subslot.subslotSignalState ?? "-"}</div></div>
                      <div><div className="slot-k">Confirm Ticks</div><div className="slot-v">{subslot.subslotConfirmTicks ?? "-"}</div></div>
                      <div><div className="slot-k">Entry Mid</div><div className="slot-v">{fmt(subslot.subslotEntryMid)}</div></div>
                      <div><div className="slot-k">Live Now</div><div className="slot-v">{subslotLiveNowLabel(subslot, slot)}</div></div>
                      <div><div className="slot-k">Gross</div><div className="slot-v">{pctNum(subslot.subslotGrossPct)}</div></div>
                      <div><div className="slot-k">Net</div><div className="slot-v">{pctNum(subslot.subslotNetPct)}</div></div>
                      <div><div className="slot-k">Profit AUD</div><div className="slot-v">{moneyAud(subslot.subslotProfitAud)}</div></div>
                      <div><div className="slot-k">Profit %</div><div className="slot-v">{pctNum(subslot.subslotProfitPct)}</div></div>
                      <div><div className="slot-k">Bounce</div><div className="slot-v">{pctNum(subslot.subslotBouncePct)}</div></div>
                      <div><div className="slot-k">EMA Gap</div><div className="slot-v">{pctNum(subslot.subslotEmaGapPct)}</div></div>
                      <div><div className="slot-k">Recovered</div><div className="slot-v">{subslot.subslotRecoveredConfirmed == null ? "-" : subslot.subslotRecoveredConfirmed ? "YES" : "NO"}</div></div>
                      <div><div className="slot-k">Exit Reason</div><div className="slot-v">{subslot.subslotExitReason ?? "-"}</div></div>
                      <div><div className="slot-k">Opened</div><div className="slot-v">{subslot.subslotOpenedAt ? ageLabel(nowMs - subslot.subslotOpenedAt) : "-"}</div></div>
                      <div><div className="slot-k">Closed</div><div className="slot-v">{subslot.subslotClosedAt ? ageLabel(nowMs - subslot.subslotClosedAt) : "-"}</div></div>
                      <div><div className="slot-k">Updated</div><div className="slot-v">{subslotHeartbeatLabel(subslot, nowMs)}</div></div>
                      <div><div className="slot-k">Reconcile Note</div><div className="slot-v">{subslot.subslotLastReconcileNote ?? "-"}</div></div>
                    </div>

                    <div><div className="slot-k">Live Analysis</div><div className="slot-v">{liveSubslotAnalysis(subslot, slot, nowMs)}</div></div>

                    {subslot.subslotLastError ? (
                      <div><div className="slot-k">Last Error</div><div className="slot-v">{subslot.subslotLastError}</div></div>
                    ) : null}
                  </div>
                ))}
              </div>
              </>
            ) : (
              <div className="slot-v">No Jrd Secondary records available.</div>
            )}
          </CollapsibleBlock>

          <CollapsibleBlock title="Tracking / Entry Structure" defaultOpen={false}>
            <div className="slot-section">Tracking Snapshot</div>

            <div className="slot-modal-grid">
              <div><div className="slot-k">Tracking State</div><div className={`slot-v ${stateClassName(trackingLabel(slot))}`}>{trackingLabel(slot)}</div></div>
              <div><div className="slot-k">Reason</div><div className="slot-v">{reasonLabel(slot.candidateReason)}</div></div>
              <div><div className="slot-k">Drawdown</div><div className="slot-v">{pctNum(slot.candidateDrawdownPct)}</div></div>
              <div><div className="slot-k">Bounce</div><div className="slot-v">{pctNum(slot.candidateBouncePct)}</div></div>
              <div><div className="slot-k">EMA Gap</div><div className="slot-v">{pctNum(slot.candidateEmaGapPct)}</div></div>
              <div><div className="slot-k">Reversal Ticks</div><div className="slot-v">{slot.candidateReversalTicks != null ? slot.candidateReversalTicks : "-"}</div></div>
              <div><div className="slot-k">Score</div><div className="slot-v">{slot.candidateScore != null ? slot.candidateScore.toFixed(3) : "-"}</div></div>
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
                  <div><div className="slot-k">Confirm Ticks</div><div className="slot-v">{slot.entryConfirmTicks != null ? slot.entryConfirmTicks : "-"}</div></div>
                  <div><div className="slot-k">Entry Score</div><div className="slot-v">{slot.entryScore != null ? slot.entryScore.toFixed(3) : "-"}</div></div>
                  <div><div className="slot-k">Fee Model</div><div className="slot-v">{slot.frictionModel ?? "-"}</div></div>
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
                <div><div className="slot-k">Target Slot</div><div className="slot-v">{slot.rotationTargetSlotId ?? "-"}</div></div>
                <div><div className="slot-k">Source Slot</div><div className="slot-v">{slot.rotationSourceSlotId ?? slot.rotationFundingSourceSlotId ?? "-"}</div></div>
                <div><div className="slot-k">Target Coin</div><div className="slot-v">{slot.rotationTargetCoin ?? "-"}</div></div>
                <div><div className="slot-k">Out Score</div><div className="slot-v">{fmt(slot.rotationScoreOut)}</div></div>
                <div><div className="slot-k">In Score</div><div className="slot-v">{fmt(slot.rotationScoreIn)}</div></div>
                <div><div className="slot-k">Out Blocked</div><div className="slot-v">{slot.rotationOutBlockedReason ?? "-"}</div></div>
                <div><div className="slot-k">In Blocked</div><div className="slot-v">{slot.rotationInBlockedReason ?? "-"}</div></div>
                <div><div className="slot-k">Recommendation</div><div className="slot-v">{slot.rotationReason ?? slot.rotationOutBlockedReason ?? slot.rotationInBlockedReason ?? "-"}</div></div>
              </div>

              <div className="slot-modal-grid">
                <div><div className="slot-k">Reservation</div><div className="slot-v">{slot.rotationReservationId ?? "-"}</div></div>
                <div><div className="slot-k">Role</div><div className="slot-v">{slot.rotationRole ?? "-"}</div></div>
                <div><div className="slot-k">Stage</div><div className="slot-v">{slot.rotationStage ?? "-"}</div></div>
                <div><div className="slot-k">Linked Slot</div><div className="slot-v">{slot.rotationLinkedSlotId ?? "-"}</div></div>
                <div><div className="slot-k">Eligible Out</div><div className="slot-v">{slot.rotationEligibleOut == null ? "-" : slot.rotationEligibleOut ? "YES" : "NO"}</div></div>
                <div><div className="slot-k">Eligible In</div><div className="slot-v">{slot.rotationEligibleIn == null ? "-" : slot.rotationEligibleIn ? "YES" : "NO"}</div></div>
                <div><div className="slot-k">Edge Score</div><div className="slot-v">{fmt(slot.rotationEdgeScore)}</div></div>
                <div><div className="slot-k">Released AUD</div><div className="slot-v">{moneyAud(slot.rotationReleasedAud)}</div></div>
                <div><div className="slot-k">Funding Reserved</div><div className="slot-v">{moneyAud(slot.rotationFundingReservedAud)}</div></div>
                <div><div className="slot-k">Funding Transferred</div><div className="slot-v">{moneyAud(slot.rotationFundingTransferredAud)}</div></div>
                <div><div className="slot-k">Reason</div><div className="slot-v">{slot.rotationReason ?? "-"}</div></div>
                <div><div className="slot-k">Last Error</div><div className="slot-v">{slot.rotationLastError ?? "-"}</div></div>
              </div>

              <div className="slot-section">Wallet-backed Rotation</div>
              <div className="slot-modal-grid">
                <div><div className="slot-k">Source Type</div><div className="slot-v">{String(slot.rotationSourceType ?? "-")}</div></div>
                <div><div className="slot-k">Wallet Ready</div><div className="slot-v">{yesNo(slot.rotationWalletReady as boolean | null | undefined)}</div></div>
                <div><div className="slot-k">Wallet Blocked</div><div className="slot-v">{reasonLabel(slot.rotationWalletBlockedReason as string | null | undefined)}</div></div>
                <div><div className="slot-k">Wallet Movable AUD</div><div className="slot-v">{moneyAud(slot.rotationWalletMovableAud as number | null | undefined)}</div></div>
                <div><div className="slot-k">Wallet AUD Value</div><div className="slot-v">{moneyAud(slot.rotationWalletAudValue as number | null | undefined)}</div></div>
                <div><div className="slot-k">Wallet Available Coin</div><div className="slot-v">{fmt(slot.rotationWalletAvailableCoin as number | null | undefined)}</div></div>
                <div><div className="slot-k">Basis Known</div><div className="slot-v">{yesNo(slot.rotationWalletBasisKnown as boolean | null | undefined)}</div></div>
                <div><div className="slot-k">Basis As Of</div><div className="slot-v">{fmtTimestampAge(slot.rotationWalletBasisAsOf as number | null | undefined, nowMs)}</div></div>
                <div><div className="slot-k">Avg Cost AUD</div><div className="slot-v">{moneyAud(slot.rotationWalletAvgCostAud as number | null | undefined)}</div></div>
                <div><div className="slot-k">Cost Basis AUD</div><div className="slot-v">{moneyAud(slot.rotationWalletCostBasisAud as number | null | undefined)}</div></div>
                <div><div className="slot-k">Unrealized Net %</div><div className="slot-v">{pctNum(slot.rotationWalletUnrealizedNetPct as number | null | undefined)}</div></div>
                <div><div className="slot-k">Profit Guard</div><div className="slot-v">{yesNo(slot.rotationWalletProfitGuardPassed as boolean | null | undefined)}</div></div>
                <div><div className="slot-k">Profit Min Net %</div><div className="slot-v">{pctNum(slot.rotationWalletProfitMinNetPct as number | null | undefined)}</div></div>
                <div><div className="slot-k">Target Executor Eligible</div><div className="slot-v">{yesNo(slot.rotationTargetExecutorEligible as boolean | null | undefined)}</div></div>
              </div>
            </CollapsibleBlock>
          )}

          {(slot.topupMode || slot.topupLastAppliedAt || slot.topupRequestedTargetAud != null) && (
            <CollapsibleBlock title="Top-up Snapshot" defaultOpen={false}>
              <div className="slot-modal-grid">
                <div><div className="slot-k">Mode</div><div className="slot-v">{slot.topupMode ?? "-"}</div></div>
                <div><div className="slot-k">Requested Target</div><div className="slot-v">{moneyAud(slot.topupRequestedTargetAud)}</div></div>
                <div><div className="slot-k">Last Target</div><div className="slot-v">{moneyAud(slot.topupLastTargetAud)}</div></div>
                <div><div className="slot-k">Fallback AUD</div><div className="slot-v">{moneyAud(slot.topupFallbackAud)}</div></div>
                <div><div className="slot-k">Last Delta</div><div className="slot-v">{moneyAud(slot.topupLastDeltaAud)}</div></div>
                <div><div className="slot-k">Last Applied</div><div className="slot-v">{slot.topupLastAppliedAt ? ageLabel(nowMs - slot.topupLastAppliedAt) : "-"}</div></div>
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
              <div>Jrd Primary and Jrd Secondary remain separate accounting layers.</div>
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
  capital: PublicCapitalResponse | null;
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
    pendingSubslotEntries: number;
    pendingSubslotExits: number;
    closedSubslots: number;
  };
  topTrackingCoins: string;
  executionMode: string;
  view: ViewMode;
  nowMs: number;
}) {
  const runtime = props.meta?.runtime;
  const telemetry = runtime?.telemetry;
  const compression = runtime?.eventCompression;
  const rotationSummary = runtime?.rotationDashboard?.summary;
  const snapshot = props.meta?.market?.snapshot ?? null;
  const serverGate = telemetry?.lastWorkerAction?.server;

  return (
    <div className="engine-bay">
      <div className="bay-head">
        <div className="bay-title">Engine Summary</div>
        <div className="bay-note">Machine state + structure overview.</div>
      </div>

      <div className="card machine-surface panel-frame engine-telemetry">
        <div className="engine-telemetry-head">
          <div>
            <div className="engine-telemetry-title">System State</div>
            <div className="engine-telemetry-note">Public treasury view.</div>
          </div>
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
            <div className="mini-k">Active Jrd Secondary</div>
            <div className="mini-v">{props.overviewCounts.activeSubslots}</div>
          </div>

          <div className="engine-mini-row">
            <div className="mini-k">Pending Entry</div>
            <div className="mini-v">{props.overviewCounts.pendingSubslotEntries}</div>
          </div>

          <div className="engine-mini-row">
            <div className="mini-k">Pending Exit</div>
            <div className="mini-v">{props.overviewCounts.pendingSubslotExits}</div>
          </div>

          <div className="engine-mini-row">
            <div className="mini-k">Closed Jrd Secondary</div>
            <div className="mini-v">{props.overviewCounts.closedSubslots}</div>
          </div>

          <div className="engine-mini-row">
            <div className="mini-k">Free AUD</div>
            <div className="mini-v">{moneyAud(props.capital?.audAvailable)}</div>
          </div>

          <div className="engine-mini-row">
            <div className="mini-k">Wallet Value</div>
            <div className="mini-v">{moneyAud(props.capital?.walletAudValue)}</div>
          </div>

          <div className="engine-mini-row">
            <div className="mini-k">Movable AUD</div>
            <div className="mini-v">{moneyAud(props.capital?.movableAudEstimate)}</div>
          </div>

          <div className="engine-mini-row">
            <div className="mini-k">Rotation Mode</div>
            <div className="mini-v">{rotationModeLabel(props.capital)}</div>
          </div>

          <div className="engine-mini-row">
            <div className="mini-k">Treasury-ready Coins</div>
            <div className="mini-v">
              {movableWalletCoins(props.capital).filter((coin) => coin.walletSourceReady === true).length}
            </div>
          </div>

          <div className="engine-mini-row">
            <div className="mini-k">Tracking Coins</div>
            <div className="mini-v">{props.topTrackingCoins || "-"}</div>
          </div>

          <div className="engine-mini-row">
            <div className="mini-k">Snapshot Poll</div>
            <div className="mini-v">
              {formatSnapshotLabel(props.meta?.market?.snapshot ?? null, Date.now())}
            </div>
          </div>

          <div className="engine-mini-row">
            <div className="mini-k">Last OK</div>
            <div className="mini-v">
              {formatDateTime(props.meta?.market?.snapshot?.lastOkAt)}
            </div>
          </div>
        </div>
      </div>

      <div className="card machine-surface panel-frame engine-telemetry">
        <div className="engine-telemetry-head">
          <div>
            <div className="engine-telemetry-title">Runtime Health</div>
            <div className="engine-telemetry-note">Live guardrails, replay logging, and noise control.</div>
          </div>
        </div>

        <div className="engine-mini">
          <div className="engine-mini-row">
            <div className="mini-k">Portfolio Gate</div>
            <div className="mini-v">{runtimeGateLabel(serverGate)}</div>
          </div>

          <div className="engine-mini-row">
            <div className="mini-k">Gate Age</div>
            <div className="mini-v">{serverGate?.at ? ageLabel(props.nowMs - serverGate.at) : "-"}</div>
          </div>

          <div className="engine-mini-row">
            <div className="mini-k">Server Signal</div>
            <div className="mini-v">{serverGate?.msg ?? "-"}</div>
          </div>

          <div className="engine-mini-row">
            <div className="mini-k">Noise Filter</div>
            <div className="mini-v">{suppressionLabel(telemetry)}</div>
          </div>

          <div className="engine-mini-row">
            <div className="mini-k">Top Runtime Noise</div>
            <div className="mini-v">{summarizeRecordTop(telemetry?.byPrefix, 4)}</div>
          </div>

          <div className="engine-mini-row">
            <div className="mini-k">Compression Active</div>
            <div className="mini-v">
              {compression?.enabled
                ? `${compression.totalSuppressed ?? 0} suppressed | ${compression.trackedKeys ?? 0} keys`
                : "OFF"}
            </div>
          </div>

          <div className="engine-mini-row">
            <div className="mini-k">Replay Log</div>
            <div className="mini-v">{historyStatusLabel(snapshot, props.nowMs)}</div>
          </div>

          <div className="engine-mini-row">
            <div className="mini-k">Quote Guard</div>
            <div className="mini-v">{quoteGuardLabel(runtime?.quoteGuard)}</div>
          </div>

          <div className="engine-mini-row">
            <div className="mini-k">Rotation Candidates</div>
            <div className="mini-v">
              out {rotationSummary?.eligibleOutCandidates ?? 0} | in {rotationSummary?.eligibleInCandidates ?? 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const CapitalMobilityPanel = React.memo(function CapitalMobilityPanel(props: {
  capital: PublicCapitalResponse | null;
  nowMs: number;
}) {
  const topCoins = useMemo(() => topWalletCoins(props.capital, 5), [props.capital]);
  const movableCoins = useMemo(() => movableWalletCoins(props.capital), [props.capital]);
  const treasuryReadyCount = movableCoins.filter((coin) => coin.walletSourceReady === true).length;
  const policyReadyCount = movableCoins.filter((coin) => coin.rotationWalletReady === true).length;

  return (
    <div className="engine-bay">
      <div className="bay-head">
        <div className="bay-title">Capital Mobility</div>
        <div className="bay-note">Public treasury view for wallet value, free AUD, and movement readiness.</div>
      </div>

      <div className="card machine-surface panel-frame engine-telemetry capital-panel">
        <div className="engine-telemetry-head">
          <div>
            <div className="engine-telemetry-title">Capital Snapshot</div>
            <div className="engine-telemetry-note">
              Rotation mode {rotationModeLabel(props.capital)} | Treasury-ready {treasuryReadyCount} | Policy-ready {policyReadyCount}
            </div>
            <div className="engine-telemetry-note">{rotationDoctrineLabel(props.capital)}</div>
          </div>
        </div>

        <div className="secondary-summary capital-summary">
          <div className="secondary-grid capital-summary-grid">
            <div><div className="slot-k">State</div><div className="slot-v">{capitalFreshnessLabel(props.capital, props.nowMs)}</div></div>
            <div><div className="slot-k">Cache TTL</div><div className="slot-v">{props.capital?.cacheMs ? `${Math.round(props.capital.cacheMs / 1000)}s` : "-"}</div></div>
            <div><div className="slot-k">Generated</div><div className="slot-v">{props.capital?.generatedAt ? ageLabel(props.nowMs - props.capital.generatedAt) : "-"}</div></div>
            <div><div className="slot-k">Free AUD</div><div className="slot-v">{moneyAud(props.capital?.audAvailable)}</div></div>
            <div><div className="slot-k">AUD Balance</div><div className="slot-v">{moneyAud(props.capital?.audBalance)}</div></div>
            <div><div className="slot-k">Wallet Value</div><div className="slot-v">{moneyAud(props.capital?.walletAudValue)}</div></div>
            <div><div className="slot-k">Movable AUD</div><div className="slot-v">{moneyAud(props.capital?.movableAudEstimate)}</div></div>
            <div><div className="slot-k">Wallet Sources</div><div className="slot-v">{props.capital?.walletSourceEnabled ? "ENABLED" : "DISABLED"}</div></div>
            <div><div className="slot-k">Rotation Mode</div><div className="slot-v">{rotationModeLabel(props.capital)}</div></div>
            <div><div className="slot-k">Require Waiting Eligible</div><div className="slot-v">{yesNo(props.capital?.rotation?.requireWaitingEligible)}</div></div>
            <div><div className="slot-k">Require Basis</div><div className="slot-v">{yesNo(props.capital?.rotation?.walletRequireBasis)}</div></div>
            <div><div className="slot-k">Wallet Profit Floor</div><div className="slot-v">{pctNum(props.capital?.rotation?.walletMinSourceNetPct)}</div></div>
          </div>
        </div>

        {props.capital?.refreshError ? (
          <div className="ledger-empty">Refresh error: {props.capital.refreshError}</div>
        ) : null}

        <div className="ledger-empty">
          Wallet readiness shows available capital. Rotation recommendation shows whether the policy currently wants to use it.
        </div>

        <div className="slot-section">Top Wallet Coins</div>
        {topCoins.length ? (
          <div className="secondary-list">
            {topCoins.map((coin) => (
              <div key={`top-${coin.coin ?? "coin"}`} className="secondary-card">
                <div className="secondary-grid capital-coin-grid">
                  <div><div className="slot-k">Coin</div><div className="slot-v">{coin.coin ?? "-"}</div></div>
                  <div><div className="slot-k">Source Type</div><div className="slot-v">{coin.rotationSourceType ?? "-"}</div></div>
                  <div><div className="slot-k">Wallet AUD</div><div className="slot-v">{moneyAud(coin.audValue)}</div></div>
                  <div><div className="slot-k">Treasury Ready</div><div className="slot-v">{yesNo(coin.walletSourceReady)}</div></div>
                  <div><div className="slot-k">Policy Ready</div><div className="slot-v">{yesNo(coin.rotationWalletReady)}</div></div>
                  <div><div className="slot-k">Available Coin</div><div className="slot-v">{fmt(coin.availableCoin)}</div></div>
                  <div><div className="slot-k">Rate</div><div className="slot-v">{fmt(coin.rate)}</div></div>
                  <div><div className="slot-k">Movable AUD</div><div className="slot-v">{moneyAud(coin.movableAudEstimate)}</div></div>
                  <div><div className="slot-k">Readiness</div><div className={`slot-v ${walletReadinessTone(coin, Boolean(props.capital?.rotation?.walletRequireBasis))}`}>{walletReadinessLabel(coin, Boolean(props.capital?.rotation?.walletRequireBasis))}</div></div>
                  <div><div className="slot-k">Basis Known</div><div className="slot-v">{yesNo(coin.rotationWalletBasisKnown)}</div></div>
                  <div><div className="slot-k">Profit Guard</div><div className="slot-v">{yesNo(coin.rotationWalletProfitGuardPassed)}</div></div>
                  <div><div className="slot-k">Target Executor Eligible</div><div className="slot-v">{yesNo(coin.rotationTargetExecutorEligible)}</div></div>
                  <div><div className="slot-k">Unrealized Net %</div><div className="slot-v">{pctNum(coin.rotationWalletUnrealizedNetPct)}</div></div>
                  <div><div className="slot-k">Avg Cost AUD</div><div className="slot-v">{moneyAud(coin.rotationWalletAvgCostAud)}</div></div>
                  <div><div className="slot-k">Cost Basis AUD</div><div className="slot-v">{moneyAud(coin.rotationWalletCostBasisAud)}</div></div>
                  <div><div className="slot-k">Basis As Of</div><div className="slot-v">{fmtTimestampAge(coin.rotationWalletBasisAsOf, props.nowMs)}</div></div>
                  <div><div className="slot-k">Blocked</div><div className="slot-v">{capitalReasonLabel(coin)}</div></div>
                  <div><div className="slot-k">Policy Block</div><div className="slot-v">{reasonLabel(coin.rotationWalletBlockedReason)}</div></div>
                  <div><div className="slot-k">Target Coin</div><div className="slot-v">{coin.rotationTargetCoin ?? "-"}</div></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ledger-empty">No wallet coin values are currently available from the public capital feed.</div>
        )}

        <div className="slot-section">Wallet Rotation Surface</div>
        {movableCoins.length ? (
          <div className="secondary-list">
            {movableCoins.map((coin) => (
              <div key={`move-${coin.coin ?? "coin"}`} className="secondary-card">
                <div className="secondary-metrics capital-metrics">
                  <div><div className="slot-k">Coin</div><div className="slot-v">{coin.coin ?? "-"}</div></div>
                  <div><div className="slot-k">Source Type</div><div className="slot-v">{coin.rotationSourceType ?? "-"}</div></div>
                  <div><div className="slot-k">Wallet AUD</div><div className="slot-v">{moneyAud(coin.audValue)}</div></div>
                  <div><div className="slot-k">Wallet Movable AUD</div><div className="slot-v">{moneyAud(coin.rotationWalletMovableAud ?? coin.movableAudEstimate)}</div></div>
                  <div><div className="slot-k">Treasury Ready</div><div className="slot-v">{yesNo(coin.walletSourceReady)}</div></div>
                  <div><div className="slot-k">Policy Ready</div><div className="slot-v">{yesNo(coin.rotationWalletReady)}</div></div>
                  <div><div className="slot-k">Ready</div><div className={`slot-v ${walletReadinessTone(coin, Boolean(props.capital?.rotation?.walletRequireBasis))}`}>{walletReadinessLabel(coin, Boolean(props.capital?.rotation?.walletRequireBasis))}</div></div>
                  <div><div className="slot-k">Basis Known</div><div className="slot-v">{yesNo(coin.rotationWalletBasisKnown)}</div></div>
                  <div><div className="slot-k">Profit Guard</div><div className="slot-v">{yesNo(coin.rotationWalletProfitGuardPassed)}</div></div>
                  <div><div className="slot-k">Target Executor Eligible</div><div className="slot-v">{yesNo(coin.rotationTargetExecutorEligible)}</div></div>
                  <div><div className="slot-k">Wallet AUD Value</div><div className="slot-v">{moneyAud(coin.rotationWalletAudValue)}</div></div>
                  <div><div className="slot-k">Wallet Available Coin</div><div className="slot-v">{fmt(coin.rotationWalletAvailableCoin)}</div></div>
                  <div><div className="slot-k">Target</div><div className="slot-v">{coin.rotationTargetCoin ?? coin.rotationTargetSlotId ?? "-"}</div></div>
                  <div><div className="slot-k">Edge</div><div className="slot-v">{fmt(coin.rotationEdgeScore ?? coin.rotationScoreOut)}</div></div>
                  <div><div className="slot-k">Reason</div><div className="slot-v">{capitalReasonLabel(coin)}</div></div>
                  <div><div className="slot-k">Policy Block</div><div className="slot-v">{reasonLabel(coin.rotationWalletBlockedReason)}</div></div>
                  <div><div className="slot-k">Unrealized Net %</div><div className="slot-v">{pctNum(coin.rotationWalletUnrealizedNetPct)}</div></div>
                  <div><div className="slot-k">Avg Cost AUD</div><div className="slot-v">{moneyAud(coin.rotationWalletAvgCostAud)}</div></div>
                  <div><div className="slot-k">Cost Basis AUD</div><div className="slot-v">{moneyAud(coin.rotationWalletCostBasisAud)}</div></div>
                  <div><div className="slot-k">Basis As Of</div><div className="slot-v">{fmtTimestampAge(coin.rotationWalletBasisAsOf, props.nowMs)}</div></div>
                  <div><div className="slot-k">Cooldown</div><div className="slot-v">{(coin.cooldownRemainingMs ?? 0) > 0 ? msToCountdown(coin.cooldownRemainingMs) : "-"}</div></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ledger-empty">No wallet-backed movement sources are currently ready or estimated as movable.</div>
        )}
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

  const { rowsAll, rowsAud, snap, meta, capital, slotRows, events, err, refresh } = useEngineData(BASE);

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
  const fixedAllowlist = meta?.fixedSlots?.allowlist ?? [];
  const engineCoinSet = useMemo(
    () => new Set(fixedAllowlist.map((c) => String(c).toUpperCase())),
    [fixedAllowlist]
  );

  useEffect(() => {
    const t = window.setInterval(() => setNowMs(Date.now()), 500);
    return () => window.clearInterval(t);
  }, []);

  const filteredMarketRows = useMemo(() => {
    const q = query.trim().toUpperCase();
    const watchSet = new Set((snap?.watch ?? []).map((c) => String(c).toUpperCase()));
    let list = feed === "all" ? rowsAll.slice() : rowsAud.slice();

    if (feed === "watch") {
      list = list.filter((r) => watchSet.has(String(r.coin).toUpperCase()));
    }

    if (feed === "engine") {
      list = rowsAud.filter((r) => engineCoinSet.has(String(r.coin).toUpperCase()));
    }

    if (q) {
      list = list.filter((r) => {
        const market = (r.market ?? `${r.coin}/AUD`).toUpperCase();
        return r.coin.toUpperCase().includes(q) || market.includes(q);
      });
    }

    return sortMarketRows(list, sortKey, sortDir);
  }, [engineCoinSet, feed, query, rowsAll, rowsAud, snap?.watch, sortDir, sortKey]);

  const filteredSlots = useMemo(() => {
    const q = query.trim().toUpperCase();
    let list = slotRows.slice();

    if (q) {
      list = list.filter((s) => {
        const subslotFields = getSubslots(s).flatMap((subslot) => [
          subslot.subslotId ?? "",
          subslot.subslotState ?? "",
          subslot.subslotSignalState ?? "",
          subslot.subslotEntryMode ?? "",
          subslot.subslotExitReason ?? "",
        ]);
        const fields = [
          s.coin ?? "",
          s.market ?? "",
          s.id ?? "",
          s.trackingState ?? "",
          s.subslotState ?? "",
          s.rotationStage ?? "",
          s.regime ?? "",
          s.consolidationState ?? "",
          ...subslotFields,
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

  const fixedExpected = meta?.fixedSlots?.expected ?? fixedAllowlist.length;
  const fixedPresent = meta?.fixedSlots?.present ?? slotRows.length;
  const fixedMissing = meta?.fixedSlots?.missing ?? [];
  const runtimeWarnings = meta?.runtime?.warnings ?? [];
  const executionMode = meta?.engine?.execution ?? "SIM";
  const architecture = meta?.engine?.architecture ?? "-";
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
    if (!e) return "-";
    return `${e.kind}${e.coin ? ` | ${e.coin}` : ""}${e.slotId ? ` | ${e.slotId}` : ""}`;
  }, [events]);

  const marketCounts = snap?.counts ?? { all: 0, aud: 0, watch: 0 };
  const engineFeedCount = rowsAud.filter((r) => engineCoinSet.has(String(r.coin).toUpperCase())).length;

  const feedCount =
    feed === "all"
      ? marketCounts.all
      : feed === "aud"
      ? marketCounts.aud
      : feed === "watch"
      ? marketCounts.watch
      : engineFeedCount;

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
    pendingSubslotEntries: 0,
    pendingSubslotExits: 0,
    closedSubslots: 0,
  };

  for (const s of slotRows) {
    const regime = rawRegimeValue(s);
    if (regime.includes("UPTREND") || regime.includes("BULL")) out.bull += 1;
    if (regime.includes("DOWNTREND") || regime.includes("BEAR")) out.bear += 1;
    if (regime.includes("CONSOLIDATION")) out.consolidation += 1;
    if (s.consolidationBreakoutReady === true) out.breakoutReady += 1;
    if (String(s.state).toUpperCase() === "WAITING_ENTRY") out.waiting += 1;
    for (const subslot of getSubslots(s)) {
      const state = String(subslot.subslotState || "").toUpperCase();
      if (state === "ACTIVE") out.activeSubslots += 1;
      if (state === "BUY_SUBMITTED") out.pendingSubslotEntries += 1;
      if (state === "SELL_SUBMITTED") out.pendingSubslotExits += 1;
      if (state === "CLOSED") out.closedSubslots += 1;
    }
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
                lastAction={`${lastAction} | ${snapshotFresh ? "FRESH" : "STALE"}`}
                view={view}
                runtimeWarnings={runtimeWarnings}
                nowMs={nowMs}
              />

              <CaptureGrid
                openPnl={slotFinancials.openPnl}
                windowHarvest={slotHarvest.totalRealized}
                visibleRealized={slotFinancials.visibleRealized}
                audAvailable={capital?.audAvailable}
                walletAudValue={capital?.walletAudValue}
                movableAudEstimate={capital?.movableAudEstimate}
                rotationMode={rotationModeLabel(capital)}
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
                <div className="engine-bay-stack">
                <SummaryPanel
                  meta={meta}
                  capital={capital}
                  fixedAllowlist={fixedAllowlist}
                  fixedMissing={fixedMissing}
                  trackingStates={trackingStates}
                  overviewCounts={overviewCounts}
                  topTrackingCoins={topTrackingCoins}
                  executionMode={executionMode}
                  view={view}
                  nowMs={nowMs}
                />

                  <CapitalMobilityPanel capital={capital} nowMs={nowMs} />
                </div>

                <div className="engine-bay engine-bay--market">
                  <MarketSurface rows={filteredMarketRows} />
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
                <OverviewTable slots={filteredSlots} onOpenSlot={setSelectedSlotId} nowMs={nowMs} />
              ) : null}

              {section === "ledger" ? (
                <>
                  <div className="engine-ledger-topgrid" aria-label="Jeroid status cards">
                    <div className="engine-capture card machine-surface panel-frame" data-treasury="true">
                      <div className="cap-k">Registry</div>
                      <div className="cap-v">{meta?.harvester?.running ? "RUNNING" : "STOPPED"}</div>
                      <div className="cap-sub">
                        <span>Phase {String(meta?.harvester?.phase ?? "-")}</span>
                        <span>|</span>
                        <span>Window {meta?.cadence?.currentWindow ?? "-"}</span>
                      </div>
                    </div>

                    <div className="engine-capture card machine-surface panel-frame" data-treasury="true">
  <div className="cap-k">Tracking family</div>
  <div className="cap-v">{getActiveTrackingCount(trackingStates)}</div>
  <div className="cap-sub">
    <span>TRACKING {trackingStates.TRACKING ?? 0}</span>
    <span>|</span>
    <span>ARMED {trackingStates.ARMED ?? 0}</span>
    <span>|</span>
    <span>BLOCKED {trackingStates.SPREAD_BLOCKED ?? 0}</span>
  </div>
</div>

                    <div className="engine-capture card machine-surface panel-frame" data-treasury="true">
                      <div className="cap-k">Fixed universe</div>
                      <div className="cap-v">{fixedAllowlist.length}</div>
                      <div className="cap-sub">
                        <span>{fixedAllowlist.slice(0, 4).join(", ")}</span>
                        <span>|</span>
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

