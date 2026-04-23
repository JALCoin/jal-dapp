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
  ageMsSinceOk?: number | null;
  ageMsSincePoll?: number | null;
  err: string | null;
  counts: { all: number; aud: number; watch: number };
  watch: string[];
  requiredAudCoins?: string[];
  probe?: Record<string, unknown> | null;
  roFallback?: {
    enabled?: boolean;
    delegatedTo?: string;
  };
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
type Section = "focus" | "behavior" | "slots" | "capital" | "market" | "events" | "about";

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

type ExitDecision = {
  liveNetPct?: number | null;
  liveGrossPct?: number | null;
  spreadPct?: number | null;
  drawdownPct?: number | null;
  exitFloorPct?: number | null;
  executableExitNetPct?: number | null;
  executableExitProfitAud?: number | null;
  executableExitAud?: number | null;
  exitGateState?: string | null;
  exitGateReason?: string | null;
  exitTriggerAt?: number | null;
  exitTriggerReason?: string | null;
  exitWaitGreenSince?: number | null;
  exitGreenConfirmTicks?: number | null;
  exitBestExecutableNetPct?: number | null;
  exitBestExecutableProfitAud?: number | null;
  exitRequiredNetPct?: number | null;
  exitRequiredProfitAud?: number | null;
};

type ReportingSummary = {
  lastRealizedNetPct?: number | null;
  lastRealizedProfitAud?: number | null;
  lifetimeNetPct?: number | null;
  totalNetGainAud?: number | null;
  capitalLaneAud?: number | null;
  deployedUnitAud?: number | null;
  cycles?: number | null;
};

type SecondarySummary = {
  liveCount?: number | null;
  liveNetPct?: number | null;
  totalNetGainAud?: number | null;
  cycles?: number | null;
  decision?: ExitDecision | null;
};

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
  decision?: ExitDecision | null;
  reporting?: ReportingSummary | null;
};

type SlotRow = {
  id: string;
  coin: string | null;
  market?: string;
  state: SlotState;
  trackingState?: TrackingState | null;
  unitAud: number;
  visualUnitAud?: number | null;

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
  levelTrailPeakNetPct?: number | null;
  levelTrailFloorPct?: number | null;
  levelTrailArmPct?: number | null;
  levelTrailRetainPct?: number | null;
  levelTrailVolatilityPct?: number | null;
  levelTrailVolatilitySpreadPct?: number | null;
  levelTrailVolatilityRangePct?: number | null;

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
  candidatePriorityEligible?: boolean | null;
  candidatePriorityReason?: string | null;
  candidatePriorityBlockedReason?: string | null;
  candidatePriorityAt?: number | null;

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

  decision?: ExitDecision | null;
  reporting?: ReportingSummary | null;
  secondary?: SecondarySummary | null;

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

type ManagerLevelTrailConfig = {
  enabled?: boolean;
  armPct?: number;
  retainPct?: number;
};

type ManagerVolatilityTrailConfig = {
  enabled?: boolean;
  spreadMult?: number;
  rangeMult?: number;
  armMult?: number;
  maxArmPct?: number;
  retainDecay?: number;
  minRetainPct?: number;
};

type ManagerStatus = WorkerStatus & {
  reentry?: {
    mode?: string;
    dropPct?: number;
  };
  holding?: {
    lvl1Pct?: number;
    lvl2Pct?: number;
    lvl3Pct?: number;
    lvl4Pct?: number;
    lvl4TrailPct?: number;
    lock1Pct?: number;
    lock2Pct?: number;
    lock3Pct?: number;
    peakResetAfterExit?: boolean;
    levelTrails?: {
      lvl1?: ManagerLevelTrailConfig;
      lvl2?: ManagerLevelTrailConfig;
      lvl3?: ManagerLevelTrailConfig;
      volatility?: ManagerVolatilityTrailConfig;
    };
    coinOverrides?: Record<string, string[]>;
  };
  subslot?: {
    enabled?: boolean;
    maxPerSlot?: number;
    sizePctOfParent?: number;
    minAud?: number;
    maxForcedSizePct?: number;
    triggerParentNetPct?: number;
    triggerParentNetBandsPct?: number[];
    costAwareEntry?: {
      enabled?: boolean;
      spreadMult?: number;
      slippageBufferPct?: number;
      minNetAfterCostPct?: number;
    };
  };
  primaryPerf?: {
    enabled?: boolean;
    windowTrades?: number;
    disableAfterLossStreak?: number;
    cooldownMs?: number;
    negativeEvHalfSize?: boolean;
    strongNegativeEvDisableThresholdPct?: number;
  };
};

type RotationDashboardSummary = {
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

type RotationDashboardDecision = {
  recommend?: boolean;
  edgeScore?: number | null;
  rawEdgeScore?: number | null;
  blockedReason?: string | null;
  rotationReason?: string | null;
  bestOut?: {
    slotId?: string | null;
    coin?: string | null;
    state?: string | null;
    score?: number | null;
    sourceType?: string | null;
  } | null;
  bestIn?: {
    slotId?: string | null;
    coin?: string | null;
    state?: string | null;
    score?: number | null;
  } | null;
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
  manager?: ManagerStatus;
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
    marketFreshness?: {
      pollMs?: number;
      [key: string]: unknown;
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
    tradeTelemetry?: {
      [key: string]: unknown;
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
      summary?: RotationDashboardSummary;
      recommendation?: RotationDashboardDecision | null;
      executor?: {
        lastActionAt?: number | null;
        lastAction?: {
          type?: string | null;
          reason?: string | null;
          reservationId?: string | null;
          dryRun?: boolean;
          outSlotId?: string | null;
          inSlotId?: string | null;
          edgeScore?: number | null;
          error?: string | null;
        } | null;
        lastPair?: {
          reservationId?: string | null;
          outSlotId?: string | null;
          outCoin?: string | null;
          inSlotId?: string | null;
          inCoin?: string | null;
          edgeScore?: number | null;
        } | null;
      };
      reservations?: Array<{
        reservationId?: string;
        slotCount?: number;
        stages?: string[];
        updatedAt?: number | null;
        out?: {
          slotId?: string | null;
          coin?: string | null;
          state?: string | null;
          stage?: string | null;
        } | null;
        in?: {
          slotId?: string | null;
          coin?: string | null;
          state?: string | null;
          stage?: string | null;
        } | null;
      }>;
      candidates?: {
        in?: Array<{
          slotId?: string;
          coin?: string | null;
          score?: number | null;
          eligible?: boolean;
          blockedReason?: string | null;
          targetExecutorEligible?: boolean;
          sourceSlotId?: string | null;
          edgeScore?: number | null;
          reason?: string | null;
        }>;
        out?: Array<{
          slotId?: string;
          coin?: string | null;
          state?: string | null;
          score?: number | null;
          eligible?: boolean;
          blockedReason?: string | null;
          sourceType?: string | null;
          walletReady?: boolean;
          walletBlockedReason?: string | null;
          targetSlotId?: string | null;
          targetCoin?: string | null;
          edgeScore?: number | null;
          reason?: string | null;
        }>;
      };
    } & RotationDashboardSummary;
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
    minSourceAud?: number | null;
    maxSourcePct?: number | null;
    maxAudPerTrade?: number | null;
    cooldownMs?: number | null;
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

type BehaviorCard = {
  title: string;
  summary: string;
  detail: string;
};

type BehaviorCoinProfile = {
  coin: string;
  personality: string;
  executor: string;
  primary: string;
  secondary: string;
  safeguards: string;
};

/* =========================
   Constants
========================= */

const PROD_DEFAULT = "https://jal-engine-service-production.up.railway.app";
const DEV_DEFAULT = "http://localhost:8787";
const CAROUSEL_INTERVAL_MS = 4500;
const ENGINE_POLL_INTERVAL_MS = 3000;
const CAPITAL_POLL_INTERVAL_MS = 15000;
const ENGINE_BEHAVIOR_AS_OF = "22 Apr 2026";

const PRIMARY_BEHAVIOR_CARDS: BehaviorCard[] = [
  {
    title: "Fixed Universe + Cadence",
    summary:
      "Eight permanent AUD slots stay assigned to BTC, ETH, XRP, SOL, DOGE, ADA, LTC, and TRX. The harvester keeps the registry intact every 5 seconds with AUD 25 baseline units.",
    detail:
      "Market polls every 3 seconds; executor and manager both work every 2 seconds. Entry and exit quotes older than 9 seconds are treated as stale.",
  },
  {
    title: "Primary Entry Logic",
    summary:
      "Each coin waits for a drawdown-and-bounce reversal inside its own spread ceiling, then commits on a 1-tick confirmation with full-unit sizing.",
    detail:
      "EMA-up is not required. The executor uses ask/bid plus a 10 bps fee model, AUD 10 minimum entries, and continuation logic instead of long confirmation stacks.",
  },
  {
    title: "Primary Profit Ladder",
    summary:
      "Global hold levels arm at 1.5%, 2.5%, 4.0%, and 6.0% net. Default lock floors are 0.70%, 1.40%, and 2.60%, with LVL4 switching to a 3.0% peak trail.",
    detail:
      "Most live behavior is then refined by per-coin trail overrides. Re-entry mode is EXIT_DROP with a 1.0% target below the last confirmed exit.",
  },
  {
    title: "Exit Discipline",
    summary:
      "Jrd Primary exits stay green-first: the default release floor is 0.20% net or AUD 0.30, with 1 green confirmation tick before capital resets.",
    detail:
      "If a parent collapses to -14.0% net the secondary trigger ladder bottoms out. A busy Jrd Secondary can delay a parent from finalizing back to WAITING_ENTRY.",
  },
  {
    title: "Primary Performance Memory",
    summary:
      "Recent primaries are scored over the last 8 trades. After 3 straight losses the affected coin cools down for 30 minutes.",
    detail:
      "Negative-EV half-sizing is OFF for primaries in this profile, so the engine prefers either full-size entries or temporary disablement instead of soft clipping.",
  },
];

const SECONDARY_BEHAVIOR_CARDS: BehaviorCard[] = [
  {
    title: "Jrd Secondary Mission",
    summary:
      "Secondaries harvest volatility inside a live primary instead of replacing it. Base size is 20% of parent capital, minimum AUD 3.50, maximum forced size 60%, and up to 8 cycles can exist before the parent resets.",
    detail:
      "Accounting stays separate during the hold and merges only when the parent returns to WAITING_ENTRY. Negative-EV half-sizing is ON for this layer.",
  },
  {
    title: "Trigger And Cost Gate",
    summary:
      "The default secondary ladder fires only while the parent is underwater, using band triggers at -1.5%, -3.0%, -4.75%, -6.5%, -8.0%, -10.0%, -12.0%, and -14.0%.",
    detail:
      "Entry is cost-aware: net-after-cost must still clear 0.06%, spread multiplier is 1.00x, slippage buffer is 0.08%, and EMA-up is not required.",
  },
  {
    title: "Recovery-First Exits",
    summary:
      "Before recovery, secondaries intentionally ignore red noise: stop-loss and early-failure exits stay disabled until post-fee recovery is confirmed.",
    detail:
      "Recovery floor is 0.25% over 2 confirming ticks. After recovery, weakness must persist for 3 ticks before giveback rules engage, with 20% giveback protection and a 0.25% protect floor.",
  },
  {
    title: "Directional Playbooks",
    summary:
      "Uptrend secondaries use 15 second cooldowns, 0.60% take-profit, and a 0.14 trail after a 0.34 arm. Downtrend secondaries use 20 second cooldowns, 0.45% take-profit, and a 0.10 trail after a 0.24 arm.",
    detail:
      "Consolidation bull entries use a 0.015 EMA gap and 0.60% take-profit. Consolidation bear entries are more defensive, allowing 0.05 bounce and -0.01 EMA gap with a 0.45% take-profit.",
  },
  {
    title: "Regime Engine",
    summary:
      "Regime detection is ON with 0.35 / 0.12 fast and slow alphas, a 0.10 minimum EMA gap, and 0.04 / 0.02 slope floors for uptrend recognition.",
    detail:
      "Chop flips are watched over 6 ticks. Consolidation is recognized after 3 compressed ticks, max 0.35% range, max 0.08 EMA gap, compression score at least 2, and breakout confirmation in 1 tick.",
  },
];

const ENGINE_GUARDRAIL_CARDS: BehaviorCard[] = [
  {
    title: "Portfolio Guardrails",
    summary:
      "Portfolio risk is ON with 8 maximum in-play slots, 8 maximum underwater parents, and an AUD 15 free-buffer requirement.",
    detail:
      "The book does not hard-stop simply because every parent is red, but it still watches the average-net block line at -5.0%.",
  },
  {
    title: "Live Quote Discipline",
    summary:
      "Quote guard is required. Global drift tolerance is 1.25% with a 10 second timeout; ETH, SOL, and XRP can widen to 2.75% on live buy quotes.",
    detail:
      "Market history and trade telemetry are both enabled, so the UI is backed by replayable quote history plus live submission diagnostics.",
  },
  {
    title: "What Is Disabled",
    summary:
      "Rotation policy, rotation executor, and waiting-slot top-up are all OFF in this profile.",
    detail:
      "The engine is behaving like a pure fixed-slot primary-plus-secondary system, not a capital-rotation or treasury-raising strategy.",
  },
];

const ENGINE_COIN_BEHAVIOR_PROFILES: BehaviorCoinProfile[] = [
  {
    coin: "BTC",
    personality: "Tightest spread and cleanest secondary filter; the benchmark leader.",
    executor:
      "Primary entry allows spread up to 1.40%, drawdown 0.40%-8.00%, bounce at least 0.15%, and continuation EMA gap >= 0.005%, all with 1-tick confirmation.",
    primary:
      "Primary exits want at least 0.12% net or AUD 0.25. Trail rails keep 40%, 48%, and 58% of move after arming at 0.25%, 0.20%, and 0.25%. Adaptive vol trail is enabled but arm multiplier is 0.00, capped at 0.35%, with 28% minimum retain.",
    secondary:
      "Secondaries only fire in very clean conditions: spread <= 0.45%, bounce >= 0.35%, expected edge >= 0.10%, post-cost net >= 0.05%, and min exit AUD 0.08. Parent-trigger ladder is effectively disabled here.",
    safeguards:
      "BTC is the most selective coin in the book, favoring thinner spread and continuation clarity over deep oversold harvesting.",
  },
  {
    coin: "ETH",
    personality: "Balanced leader with fast continuation tolerance and moderately tight exits.",
    executor:
      "Primary entry allows spread up to 1.80%, drawdown 0.30%-10.00%, bounce >= 0.15%, continuation drawdown >= 0.04%, EMA gap >= 0.002%, and 1-tick confirmation.",
    primary:
      "Primary exits want 0.15% net or AUD 0.30. Trail rails arm at 0.15%, 0.20%, and 0.25%, then keep 42%, 50%, and 60%. Adaptive vol trail is ON with 0.95 arm mult, 0.40 max arm, and 30% minimum retain.",
    secondary:
      "Secondary layer tolerates flat EMA structure: EMA gap 0.00, spread <= 0.50%, bounce >= 0.25%, expected edge >= 0.10%, post-cost >= 0.06%, and min exit AUD 0.09.",
    safeguards:
      "Live buy drift can widen to 2.75%, so ETH can still participate during fast tape without turning fully loose.",
  },
  {
    coin: "XRP",
    personality: "Momentum-friendly and continuation-tolerant, but still spread-aware.",
    executor:
      "Primary entry allows spread up to 1.80%, drawdown 0.50%-10.00%, bounce >= 0.15%, continuation drawdown >= 0.01%, EMA gap >= 0.0004%, and 1-tick confirmation.",
    primary:
      "Primary exits want 0.15% net or AUD 0.30. Trail rails match ETH at 0.15% / 42%, 0.20% / 50%, and 0.25% / 60%. Adaptive vol trail is ON with 0.95 arm mult, 0.40 max arm, and 30% minimum retain.",
    secondary:
      "Secondaries can lean slightly counter-trend: EMA gap -0.01, spread <= 0.70%, bounce >= 0.25%, expected edge >= 0.10%, post-cost >= 0.08%, and min exit AUD 0.10.",
    safeguards:
      "A 2.75% live buy drift allowance plus slightly negative secondary EMA gap lets XRP engage rebounds earlier than ETH.",
  },
  {
    coin: "SOL",
    personality: "Fast beta breakout coin with explicit lock rails and no adaptive vol trail.",
    executor:
      "Primary entry allows spread up to 2.40%, drawdown 0.30%-10.00%, bounce >= 0.12%, continuation drawdown >= 0.08%, EMA gap >= 0.002%, and 1-tick confirmation.",
    primary:
      "Primary exits want 0.20% net or AUD 0.35. Locks step up to 0.95%, 1.75%, and 3.00%, while trails arm at 0.12%, 0.18%, and 0.24% and retain 50%, 60%, and 70%. Adaptive vol trail is OFF.",
    secondary:
      "Secondary layer uses EMA gap 0.02, spread <= 0.70%, bounce >= 0.25%, expected edge >= 0.10%, post-cost >= 0.08%, and min exit AUD 0.12. Consolidation bull entries can flatten the EMA gap to 0.00.",
    safeguards:
      "SOL also gets a 2.75% live buy drift allowance, but the exit rail stays explicit rather than volatility-shaped.",
  },
  {
    coin: "ADA",
    personality: "Slowest primary trigger, deepest recovery ladder, and staged band-driven harvesting.",
    executor:
      "Primary entry allows spread up to 2.20%, drawdown 0.60%-12.00%, bounce >= 0.18%, and 1-tick confirmation with no EMA-up requirement.",
    primary:
      "Primary exits want 0.24% net or AUD 0.38. Trail rails arm at 0.22%, 0.30%, and 0.38% and keep 34%, 42%, and 52%. Adaptive vol trail is ON with 1.10 arm mult, 0.65 max arm, and 20% minimum retain.",
    secondary:
      "Secondaries are band-only: -1.5%, -3.0%, -4.75%, -6.5%, -7.75%, -9.75%, -11.75%, and -14.0%. Core filters are spread <= 2.20%, bounce >= 0.25%, EMA gap 0.02, expected edge >= 0.10%, post-cost >= 0.10%, and min exit AUD 0.14. Consolidation spreads can stretch to 2.6% with bull edge 0.12 and bear edge 0.14.",
    safeguards:
      "ADA is tuned for staged underwater recovery rather than shallow noise. The extra banding makes it one of the most deliberate rebound harvesters in the set.",
  },
  {
    coin: "DOGE",
    personality: "Loose spread tolerance and aggressive lock floors for meme-volatility harvesting.",
    executor:
      "Primary entry allows spread up to 3.00%, drawdown 0.40%-12.00%, bounce >= 0.12%, and 1-tick confirmation.",
    primary:
      "Primary exits want 0.32% net or AUD 0.45. Hard locks are 1.00%, 1.85%, and 3.10%, while trails arm at 0.14%, 0.20%, and 0.26% and retain 52%, 62%, and 72%. Adaptive vol trail is OFF.",
    secondary:
      "Secondaries can stay negative on structure: EMA gap -0.20, downtrend EMA gap -0.20, spread <= 3.00%, bounce >= 0.20%, expected edge >= 0.10%, post-cost >= 0.12%, and min exit AUD 0.16. Consolidation lanes allow 3.2% spread with bull edge 0.12 and bear edge 0.14.",
    safeguards:
      "The parent band ladder runs from -1.5% to -14.0%, making DOGE a deep-recovery specialist rather than a neat-trend coin.",
  },
  {
    coin: "LTC",
    personality: "Middle-weight mean-reversion coin with wider secondary spread tolerance.",
    executor:
      "Primary entry allows spread up to 2.60%, drawdown 0.60%-12.00%, bounce >= 0.18%, and 1-tick confirmation.",
    primary:
      "Primary exits want 0.22% net or AUD 0.35. Trail rails arm at 0.18%, 0.24%, and 0.30% and keep 38%, 46%, and 56%. Adaptive vol trail is ON with 1.05 arm mult, 0.50 max arm, and 24% minimum retain.",
    secondary:
      "Secondaries allow EMA gap 0.00, spread <= 3.50%, bounce >= 0.25%, expected edge >= 0.10%, post-cost >= 0.10%, and min exit AUD 0.12.",
    safeguards:
      "LTC is less fussy than BTC or ETH on spread, but it still demands clean net-after-cost recovery before a secondary is worth keeping.",
  },
  {
    coin: "TRX",
    personality: "High-lock, high-noise book end tuned for thinner-market rebounds.",
    executor:
      "Primary entry allows spread up to 3.40%, drawdown 0.40%-12.00%, bounce >= 0.12%, and 1-tick confirmation.",
    primary:
      "Primary exits want 0.36% net or AUD 0.45. Locks step to 1.05%, 1.95%, and 3.20%, while trails arm at 0.14%, 0.20%, and 0.26% and retain 54%, 64%, and 74%. Adaptive vol trail is OFF.",
    secondary:
      "Secondaries use EMA gap 0.015, spread <= 2.80%, bounce >= 0.20%, expected edge >= 0.08%, post-cost >= 0.12%, and min exit AUD 0.16. Consolidation lanes allow 3.4% spread with bull edge 0.10 and bear edge 0.12.",
    safeguards:
      "TRX is one of the most profit-demanding parents in the book, so it waits longer before releasing green than the majors do.",
  },
];

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

function msToShortLabel(ms: number | null | undefined) {
  if (ms == null || !Number.isFinite(ms)) return "-";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const secs = ms / 1000;
  return Number.isInteger(secs) ? `${secs.toFixed(0)}s` : `${secs.toFixed(1)}s`;
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

function recentAgeLabel(msSince: number | null | undefined) {
  if (msSince == null || !Number.isFinite(msSince)) return "-";
  if (msSince < 60000) return "just now";
  return ageLabel(msSince);
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

function effectiveNowMid(s: SlotRow) {
  if (s.nowMid != null && Number.isFinite(s.nowMid)) return s.nowMid;
  if (s.candidateMidPrev != null && Number.isFinite(s.candidateMidPrev)) return s.candidateMidPrev;
  return null;
}

function reentryTargetHit(s: SlotRow) {
  return (
    s.reentryTargetMid != null &&
    Number.isFinite(s.reentryTargetMid) &&
    effectiveNowMid(s) != null &&
    Number.isFinite(effectiveNowMid(s)) &&
    Number(effectiveNowMid(s)) <= Number(s.reentryTargetMid)
  );
}

function primaryExitFloorPct(slot: SlotRow) {
  const lockPct = slot.lockPct;
  const trailFloorPct = slot.levelTrailFloorPct;
  if (lockPct != null && Number.isFinite(lockPct) && trailFloorPct != null && Number.isFinite(trailFloorPct)) {
    return Math.max(lockPct, trailFloorPct);
  }
  if (trailFloorPct != null && Number.isFinite(trailFloorPct)) return trailFloorPct;
  if (lockPct != null && Number.isFinite(lockPct)) return lockPct;
  return null;
}

function primaryExitFloorLabel(slot: SlotRow) {
  const floor = primaryExitFloorPct(slot);
  return floor != null && Number.isFinite(floor) ? pctNum(floor) : "Not armed";
}

function primaryTrailLabel(slot: SlotRow) {
  if (slot.level === 4) return "LVL4 peak trail";
  if (!(slot.level >= 1 && slot.level <= 3)) return "-";

  const lockPct = slot.lockPct;
  const trailFloorPct = slot.levelTrailFloorPct;
  if (
    lockPct != null &&
    Number.isFinite(lockPct) &&
    trailFloorPct != null &&
    Number.isFinite(trailFloorPct) &&
    trailFloorPct > lockPct
  ) {
    return `ACTIVE @ ${pctNum(trailFloorPct)}`;
  }

  return "Lock only";
}

function primaryTrailToneClass(slot: SlotRow) {
  if (slot.level === 4) return "is-holding";
  if (!(slot.level >= 1 && slot.level <= 3)) return "is-muted";

  const lockPct = slot.lockPct;
  const trailFloorPct = slot.levelTrailFloorPct;
  if (
    lockPct != null &&
    Number.isFinite(lockPct) &&
    trailFloorPct != null &&
    Number.isFinite(trailFloorPct) &&
    trailFloorPct > lockPct
  ) {
    return "is-holding";
  }

  return "is-tracking";
}

function primaryTrailFloorLabel(slot: SlotRow) {
  if (slot.levelTrailFloorPct != null && Number.isFinite(slot.levelTrailFloorPct)) {
    return pctNum(slot.levelTrailFloorPct);
  }
  if (slot.level != null && slot.level >= 1 && slot.level <= 3) return "Static lock only";
  return "Not armed";
}

function primaryTrailPeakLabel(slot: SlotRow) {
  if (slot.levelTrailPeakNetPct != null && Number.isFinite(slot.levelTrailPeakNetPct)) {
    return pctNum(slot.levelTrailPeakNetPct);
  }
  if (slot.level === 4) return "Awaiting peak";
  return "No peak yet";
}

function primaryTrailMovementLabel(slot: SlotRow) {
  const state = String(slot.state || "").toUpperCase();
  if (!(state === "LVL1_LOCK" || state === "LVL2_LOCK" || state === "LVL3_LOCK" || state === "LVL4_TRAIL")) {
    return null;
  }

  const floorPct = primaryExitFloorPct(slot);
  const lockPct = slot.lockPct;
  const trailFloorPct = slot.levelTrailFloorPct;
  const peakPct = slot.levelTrailPeakNetPct;
  const netPct = slot.netPct;
  const parts: string[] = [];

  if (floorPct != null && Number.isFinite(floorPct)) {
    parts.push(`floor ${pctNum(floorPct)}`);
  }

  if (
    lockPct != null &&
    Number.isFinite(lockPct) &&
    trailFloorPct != null &&
    Number.isFinite(trailFloorPct) &&
    trailFloorPct > lockPct
  ) {
    parts.push(`lift ${pctNum(trailFloorPct - lockPct)}`);
  } else if (lockPct != null && Number.isFinite(lockPct) && state !== "LVL4_TRAIL") {
    parts.push(`static lock ${pctNum(lockPct)}`);
  }

  if (
    netPct != null &&
    Number.isFinite(netPct) &&
    floorPct != null &&
    Number.isFinite(floorPct)
  ) {
    const gapPct = Number(netPct) - floorPct;
    parts.push(gapPct >= 0 ? `${pctNum(gapPct)} above floor` : `${pctNum(Math.abs(gapPct))} below floor`);
  }

  if (peakPct != null && Number.isFinite(peakPct)) {
    parts.push(`peak ${pctNum(peakPct)}`);
  }

  return parts.length ? `Primary rail ${parts.join(" | ")}.` : null;
}

function managerLevelTrailLabel(trail: ManagerLevelTrailConfig | undefined) {
  if (!trail?.enabled) return "OFF";
  const armPct = trail.armPct != null && Number.isFinite(trail.armPct) ? `${trail.armPct.toFixed(3)}%` : "-";
  const retainPct =
    trail.retainPct != null && Number.isFinite(trail.retainPct)
      ? `${(trail.retainPct * 100).toFixed(0)}%`
      : "-";
  return `ON | arm ${armPct} | keep ${retainPct}`;
}

function managerCoinOverrideCoins(coinOverrides: Record<string, string[]> | null | undefined) {
  return Object.keys(coinOverrides ?? {})
    .filter((coin) => !!coin)
    .sort((a, b) => a.localeCompare(b));
}

function managerVolatilityModeLabel(
  volatility: ManagerVolatilityTrailConfig | undefined,
  coinOverrides: Record<string, string[]> | null | undefined
) {
  const overrideCoins = managerCoinOverrideCoins(coinOverrides);
  if (overrideCoins.length) return `PER-COIN | ${overrideCoins.length} coins`;
  if (!volatility?.enabled) return "OFF";

  const spreadMult =
    volatility.spreadMult != null && Number.isFinite(volatility.spreadMult)
      ? `${volatility.spreadMult.toFixed(2)}x`
      : "-";
  const rangeMult =
    volatility.rangeMult != null && Number.isFinite(volatility.rangeMult)
      ? `${volatility.rangeMult.toFixed(2)}x`
      : "-";
  return `GLOBAL | spread ${spreadMult} | range ${rangeMult}`;
}

function managerVolatilityDetailLabel(
  volatility: ManagerVolatilityTrailConfig | undefined,
  coinOverrides: Record<string, string[]> | null | undefined
) {
  const overrideCoins = managerCoinOverrideCoins(coinOverrides);
  if (overrideCoins.length) {
    return "The LVL1-LVL3 lines above are the fallback trail baseline. Live trail math is now resolved per coin for the override set below.";
  }
  if (!volatility?.enabled) {
    return "Fixed locks remain the minimum floor. These trails only raise the exit floor inside LVL1-LVL3 bands.";
  }

  const armCap =
    volatility.maxArmPct != null && Number.isFinite(volatility.maxArmPct)
      ? pctNum(volatility.maxArmPct)
      : "-";
  const keepFloor =
    volatility.minRetainPct != null && Number.isFinite(volatility.minRetainPct)
      ? `${(volatility.minRetainPct * 100).toFixed(0)}%`
      : "-";
  return `Adaptive volatility is global. Arm cap ${armCap} | keep floor ${keepFloor}.`;
}

function primaryTrailArmLabel(slot: SlotRow) {
  if (slot.levelTrailArmPct != null && Number.isFinite(slot.levelTrailArmPct)) {
    return pctNum(slot.levelTrailArmPct);
  }
  if (slot.level >= 1 && slot.level <= 3) return "Not resolved";
  return "-";
}

function primaryTrailRetainLabel(slot: SlotRow) {
  if (slot.levelTrailRetainPct != null && Number.isFinite(slot.levelTrailRetainPct)) {
    return `${(slot.levelTrailRetainPct * 100).toFixed(0)}%`;
  }
  if (slot.level >= 1 && slot.level <= 3) return "Not resolved";
  return "-";
}

function primaryTrailVolatilityLabel(slot: SlotRow) {
  if (slot.levelTrailVolatilityPct != null && Number.isFinite(slot.levelTrailVolatilityPct)) {
    return pctNum(slot.levelTrailVolatilityPct);
  }
  if (slot.level >= 1 && slot.level <= 3) return "None";
  return "-";
}

function primaryTrailVolatilityInputsLabel(slot: SlotRow) {
  const spreadPct = slot.levelTrailVolatilitySpreadPct;
  const rangePct = slot.levelTrailVolatilityRangePct;
  const hasSpread = spreadPct != null && Number.isFinite(spreadPct);
  const hasRange = rangePct != null && Number.isFinite(rangePct);

  if (hasSpread || hasRange) {
    return `spread ${hasSpread ? pctNum(spreadPct) : "-"} | range ${hasRange ? pctNum(rangePct) : "-"}`;
  }
  if (slot.level >= 1 && slot.level <= 3) return "No adaptive input";
  return "-";
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

function hasActiveParentExposure(slot: SlotRow | null | undefined) {
  const state = String(slot?.state || "").toUpperCase();
  return isHoldingFamilyState(state) || state === "EXITING";
}

function primaryDecision(slot: SlotRow | null | undefined) {
  return slot?.decision ?? null;
}

function primaryReporting(slot: SlotRow | null | undefined) {
  return slot?.reporting ?? null;
}

function primaryCapitalLaneAud(slot: SlotRow | null | undefined) {
  const candidates = [primaryReporting(slot)?.capitalLaneAud, slot?.visualUnitAud, slot?.unitAud];
  for (const value of candidates) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function primaryDeployedUnitAud(slot: SlotRow | null | undefined) {
  const candidates = [primaryReporting(slot)?.deployedUnitAud, slot?.unitAud];
  for (const value of candidates) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function secondarySummaryData(slot: SlotRow | null | undefined) {
  return slot?.secondary ?? null;
}

function liveParentGrossPct(slot: SlotRow | null | undefined) {
  const decisionGrossPct = primaryDecision(slot)?.liveGrossPct;
  if (decisionGrossPct != null && Number.isFinite(decisionGrossPct)) return decisionGrossPct;
  const grossPct = slot?.grossPct;
  if (!slot || !hasActiveParentExposure(slot) || grossPct == null || !Number.isFinite(grossPct)) {
    return null;
  }
  return grossPct;
}

function liveParentNetPct(slot: SlotRow | null | undefined) {
  const decisionNetPct = primaryDecision(slot)?.liveNetPct;
  if (decisionNetPct != null && Number.isFinite(decisionNetPct)) return decisionNetPct;
  const netPct = slot?.netPct;
  if (!slot || !hasActiveParentExposure(slot) || netPct == null || !Number.isFinite(netPct)) {
    return null;
  }
  return netPct;
}

function primaryTotalGainPct(slot: SlotRow | null | undefined) {
  const reportedPct = primaryReporting(slot)?.lifetimeNetPct;
  if (reportedPct != null && Number.isFinite(reportedPct)) return reportedPct;
  const lifetimeNetPct = slot?.lifetimeNetPct;
  if (lifetimeNetPct == null || !Number.isFinite(lifetimeNetPct)) return null;
  return Number((lifetimeNetPct * 100).toFixed(3));
}

function primaryTotalGainAud(slot: SlotRow | null | undefined) {
  if (!slot) return null;
  const reportedAud = primaryReporting(slot)?.totalNetGainAud;
  if (reportedAud != null && Number.isFinite(reportedAud)) return reportedAud;
  return null;
}

function primaryLastRealizedNetPct(slot: SlotRow | null | undefined) {
  if (!slot) return null;
  const reportedPct = primaryReporting(slot)?.lastRealizedNetPct;
  if (reportedPct != null && Number.isFinite(reportedPct)) return reportedPct;
  const fallbackPct = slot.profitPct;
  if (fallbackPct == null || !Number.isFinite(fallbackPct)) return null;
  return fallbackPct;
}

function primaryLastRealizedProfitAud(slot: SlotRow | null | undefined) {
  if (!slot) return null;
  const reportedAud = primaryReporting(slot)?.lastRealizedProfitAud;
  if (reportedAud != null && Number.isFinite(reportedAud)) return reportedAud;
  const fallbackAud = slot.profitAud;
  if (fallbackAud == null || !Number.isFinite(fallbackAud)) return null;
  return fallbackAud;
}

function secondaryLiveCount(slot: SlotRow | null | undefined) {
  if (!slot) return 0;
  const liveCount = secondarySummaryData(slot)?.liveCount;
  if (liveCount != null && Number.isFinite(liveCount)) return liveCount;
  return countActiveSecondaries(slot);
}

function secondaryTotalGainAud(slot: SlotRow | null | undefined) {
  if (!slot) return null;
  const reportedAud = secondarySummaryData(slot)?.totalNetGainAud;
  if (reportedAud != null && Number.isFinite(reportedAud)) return reportedAud;
  const lifetime = slot.subslotLifetimeProfitAud;
  if (lifetime == null || !Number.isFinite(lifetime)) return null;
  return lifetime;
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

function slotHeartbeatCardLabel(s: SlotRow, nowMs: number) {
  if (s.updatedAt && Number.isFinite(s.updatedAt)) {
    return recentAgeLabel(nowMs - s.updatedAt);
  }
  if (s.lastSeenAt && Number.isFinite(s.lastSeenAt)) {
    return recentAgeLabel(nowMs - s.lastSeenAt);
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
    const liveNet = liveParentNetPct(s);
    const parentRealizedAud = primaryTotalGainAud(s);
    const secondaryRealizedAud = secondaryTotalGainAud(s);

    if (hasActiveParentExposure(s) && Number.isFinite(baseAud) && liveNet != null && Number.isFinite(liveNet)) {
      openPnl += baseAud * (liveNet / 100);
    }

    if (parentRealizedAud != null && Number.isFinite(parentRealizedAud)) {
      visibleRealized += parentRealizedAud;
    } else {
      const fallbackParentProfitAud = Number(s.profitAud);
      if (Number.isFinite(fallbackParentProfitAud)) {
        visibleRealized += fallbackParentProfitAud;
      }
    }

    if (secondaryRealizedAud != null && Number.isFinite(secondaryRealizedAud)) {
      visibleRealized += secondaryRealizedAud;
    } else {
      const subslots = getSubslots(s);
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

function configuredSubslotTriggerPct(
  subslot: SubslotRow | null | undefined,
  subslotConfig: ManagerStatus["subslot"] | null | undefined,
  fallbackBandIndex?: number | null
) {
  const directTriggerPct = Number(subslot?.subslotTriggerParentNetPct);
  if (Number.isFinite(directTriggerPct)) return directTriggerPct;

  const configuredBands = Array.isArray(subslotConfig?.triggerParentNetBandsPct)
    ? subslotConfig.triggerParentNetBandsPct
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value))
    : [];

  let bandIndex = Number(subslot?.subslotTriggerBandIndex);
  if (!Number.isInteger(bandIndex) || bandIndex < 0) {
    const sequenceIndex = Number(subslot?.subslotSequence);
    if (Number.isInteger(sequenceIndex) && sequenceIndex >= 1) {
      bandIndex = sequenceIndex - 1;
    } else if (fallbackBandIndex != null && Number.isInteger(fallbackBandIndex) && fallbackBandIndex >= 0) {
      bandIndex = fallbackBandIndex;
    } else {
      bandIndex = Number.NaN;
    }
  }

  if (configuredBands.length && Number.isInteger(bandIndex) && bandIndex >= 0 && bandIndex < configuredBands.length) {
    return configuredBands[bandIndex];
  }

  const configuredTriggerPct = Number(subslotConfig?.triggerParentNetPct);
  if (Number.isFinite(configuredTriggerPct) && configuredTriggerPct > -900) {
    return configuredTriggerPct;
  }

  return null;
}

function subslotLiveDistancePct(
  subslot: SubslotRow | null | undefined,
  parent: SlotRow | null | undefined,
  subslotConfig?: ManagerStatus["subslot"] | null | undefined,
  fallbackBandIndex?: number | null
) {
  if (!parent) return null;

  const state = String(subslot?.subslotState || "").toUpperCase();
  if (state === "ACTIVE" || state === "BUY_SUBMITTED") return 0;

  const triggerPct = configuredSubslotTriggerPct(subslot, subslotConfig, fallbackBandIndex);
  const parentNetPct = liveParentNetPct(parent);
  const normalizedTriggerPct = Number(triggerPct);
  if (!Number.isFinite(normalizedTriggerPct) || parentNetPct == null || !Number.isFinite(parentNetPct)) return null;

  const remainingPct =
    normalizedTriggerPct < 0
      ? Math.max(0, Number(parentNetPct) - normalizedTriggerPct)
      : Math.max(0, normalizedTriggerPct - Number(parentNetPct));

  return Number(remainingPct.toFixed(3));
}

function subslotLiveCounterLabel(
  subslot: SubslotRow | null | undefined,
  parent: SlotRow | null | undefined,
  subslotConfig?: ManagerStatus["subslot"] | null | undefined,
  fallbackBandIndex?: number | null
) {
  const state = String(subslot?.subslotState || "").toUpperCase();
  if (state === "ACTIVE") return "Live now";
  if (state === "BUY_SUBMITTED") return "Entry pending";
  if (state === "SELL_SUBMITTED") return "Exit pending";

  const distancePct = subslotLiveDistancePct(subslot, parent, subslotConfig, fallbackBandIndex);
  if (distancePct != null) return `${pctNum(distancePct)} to live`;

  const signal = String(subslot?.subslotSignalState || "").toUpperCase();
  if (signal === "ARMED") return "Armed";
  if (signal === "REVERSAL_CONFIRMING") return "Confirming";
  if (signal === "BOUNCE_SEEN" || signal === "TRACKING") return "Watching";
  if (state === "CLOSED") return "Closed";
  return "-";
}

function readerStatusLabel(s: SlotRow) {
  const state = String(s.state || "").toUpperCase();
  const liveNet = liveParentNetPct(s);

  if (state === "WAITING_ENTRY") return "Waiting";
  if (state === "DEPLOYING") return "Entering";
  if (state === "EXITING") return "Exiting";
  if (state === "LVL4_TRAIL") return "Trailing";
  if (state === "LVL1_LOCK" || state === "LVL2_LOCK" || state === "LVL3_LOCK") return "Protected";
  if (state === "HOLDING" && liveNet != null && Number(liveNet) > 0) return "Protected";
  if (state === "HOLDING") return "Holding";
  return "Watching";
}

function primaryReferenceLabel(slot: SlotRow | null | undefined) {
  if (!slot) return "-";
  if (slot.reentryTargetMid != null && Number.isFinite(slot.reentryTargetMid)) {
    return fmt(slot.reentryTargetMid);
  }
  return "-";
}

type EntryMilestoneState = "done" | "pending" | "blocked";
type EntryMilestone = {
  label: string;
  state: EntryMilestoneState;
  countsTowardEntry?: boolean;
};
type EntryProgressModel = {
  referenceDone: boolean;
  readyCount: number;
  totalCount: number;
  remainingCount: number;
  waitingLabels: string[];
  blocked: boolean;
};

function primaryCandidateBlockedReason(slot: SlotRow) {
  return String(slot.candidatePriorityBlockedReason || "").trim().toLowerCase();
}

function primaryEntryConfirmProgress(slot: SlotRow) {
  const blockedReason = primaryCandidateBlockedReason(slot);
  const required = Math.max(0, Number(slot.entryConfirmTicks || 0));
  const tracked = Math.max(0, Number(slot.candidateReversalTicks || 0));

  const match = blockedReason.match(/^confirm_ticks_(\d+)_of_(\d+)$/);
  const current = match ? Number(match[1]) : tracked;
  const total = match ? Number(match[2]) : required;
  const ready = slot.candidatePriorityEligible === true || total <= 0 || current >= total;

  return { current, total, ready };
}

function primaryEntryMilestones(slot: SlotRow): EntryMilestone[] {
  const tracking = String(slot.trackingState || "").toUpperCase();
  const blockedReason = primaryCandidateBlockedReason(slot);
  const referenceDone = reentryTargetHit(slot);
  const marketReady = tracking !== "NO_MARKET" && blockedReason !== "market_unresolved";
  const spreadReady =
    tracking !== "SPREAD_BLOCKED" &&
    !["spread_blowout", "spread_unresolved", "live_bidask_required", "bidask_unresolved"].includes(
      blockedReason
    );
  const drawdownReady = blockedReason !== "drawdown_not_ready";
  const bounceReady = drawdownReady && blockedReason !== "bounce_not_ready";
  const trendReady = bounceReady && blockedReason !== "trend_not_ready";
  const confirm = primaryEntryConfirmProgress(slot);

  const milestones: EntryMilestone[] = [
    {
      label: referenceDone ? "Reference crossed" : "Reference pending",
      state: referenceDone ? "done" : "pending",
      countsTowardEntry: false,
    },
    {
      label: drawdownReady ? "Drawdown ready" : "Drawdown pending",
      state: drawdownReady ? "done" : "pending",
    },
    {
      label: bounceReady ? "Bounce ready" : "Bounce pending",
      state: bounceReady ? "done" : "pending",
    },
    {
      label: trendReady ? "Trend ready" : "Trend pending",
      state: trendReady ? "done" : "pending",
    },
  ];

  if (!marketReady) {
    milestones.push({ label: "Market read pending", state: "blocked" });
  } else {
    milestones.push({
      label: spreadReady ? "Spread clear" : "Spread blocked",
      state: spreadReady ? "done" : "blocked",
    });
  }

  milestones.push({
    label: confirm.ready ? "Confirm ready" : `Confirm ${confirm.current}/${confirm.total || 0}`,
    state: confirm.ready ? "done" : "pending",
  });

  return milestones;
}

function primaryEntryProgressModel(slot: SlotRow): EntryProgressModel {
  const milestones = primaryEntryMilestones(slot).filter((item) => item.countsTowardEntry !== false);
  const readyCount = milestones.filter((item) => item.state === "done").length;
  const waitingLabels = milestones
    .filter((item) => item.state !== "done")
    .map((item) => {
      if (item.label.startsWith("Drawdown")) return "Drawdown";
      if (item.label.startsWith("Bounce")) return "Bounce";
      if (item.label.startsWith("Trend")) return "Trend";
      if (item.label.startsWith("Spread")) return item.label;
      if (item.label.startsWith("Market")) return "Market read";
      if (item.label.startsWith("Confirm")) return item.label;
      return item.label;
    });

  return {
    referenceDone: reentryTargetHit(slot),
    readyCount,
    totalCount: milestones.length,
    remainingCount: Math.max(0, milestones.length - readyCount),
    waitingLabels,
    blocked: milestones.some((item) => item.state === "blocked"),
  };
}

function primaryEntryCountdownLabel(slot: SlotRow) {
  const progress = primaryEntryProgressModel(slot);
  const confirm = primaryEntryConfirmProgress(slot);

  if (progress.remainingCount <= 0) return "Entry ready";
  if (!confirm.ready && progress.remainingCount === 1 && confirm.total > 0) {
    return `Confirm ${confirm.current}/${confirm.total} remaining`;
  }
  return `${progress.remainingCount} gates remaining`;
}

function primaryEntryWaitingLabel(slot: SlotRow) {
  const progress = primaryEntryProgressModel(slot);
  if (!progress.waitingLabels.length) return "All entry gates are ready.";
  if (progress.waitingLabels.length === 1) return `Waiting on ${progress.waitingLabels[0]}.`;
  return `Waiting on ${progress.waitingLabels.join(", ")}.`;
}

function primaryEntryProgressBlock(slot: SlotRow) {
  const progress = primaryEntryProgressModel(slot);
  const fillPct = progress.totalCount > 0 ? Math.max(8, (progress.readyCount / progress.totalCount) * 100) : 0;
  const toneClass = progress.remainingCount <= 0 ? "is-ready" : progress.blocked ? "is-blocked" : "is-active";

  return (
    <div className={`entry-progress ${toneClass}`} aria-label="Primary entry progress">
      <div className="entry-progress-top">
        <span className="entry-progress-label">Entry progress</span>
        <span className="entry-progress-value">
          {progress.readyCount}/{progress.totalCount} gates
        </span>
      </div>
      <div className="entry-progress-bar" aria-hidden="true">
        <span style={{ width: `${fillPct}%` }} />
      </div>
      <div className="entry-progress-meta">
        <span>{progress.referenceDone ? "Reference crossed" : "Reference pending"}</span>
        <span>{primaryEntryCountdownLabel(slot)}</span>
      </div>
    </div>
  );
}

type PrimaryExitLevelStep = {
  key: "lvl1" | "lvl2" | "lvl3" | "lvl4";
  title: string;
  armPct: number;
  floorPct: number | null;
  trailing: boolean;
};

function normalizeExitArmPct(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return null;
  const num = Number(value);
  return Math.abs(num) <= 0.2 ? num * 100 : num;
}

function primaryExitLevelSteps(holding: ManagerStatus["holding"] | null | undefined): PrimaryExitLevelStep[] {
  const steps: PrimaryExitLevelStep[] = [];
  const lvl1Pct = normalizeExitArmPct(holding?.lvl1Pct);
  const lvl2Pct = normalizeExitArmPct(holding?.lvl2Pct);
  const lvl3Pct = normalizeExitArmPct(holding?.lvl3Pct);
  const lvl4Pct = normalizeExitArmPct(holding?.lvl4Pct);
  const lock1Pct = holding?.lock1Pct;
  const lock2Pct = holding?.lock2Pct;
  const lock3Pct = holding?.lock3Pct;

  if (lvl1Pct != null && Number.isFinite(lvl1Pct)) {
    steps.push({
      key: "lvl1",
      title: "LVL1",
      armPct: Number(lvl1Pct),
      floorPct: lock1Pct != null && Number.isFinite(lock1Pct) ? Number(lock1Pct) : null,
      trailing: false,
    });
  }

  if (lvl2Pct != null && Number.isFinite(lvl2Pct)) {
    steps.push({
      key: "lvl2",
      title: "LVL2",
      armPct: Number(lvl2Pct),
      floorPct: lock2Pct != null && Number.isFinite(lock2Pct) ? Number(lock2Pct) : null,
      trailing: false,
    });
  }

  if (lvl3Pct != null && Number.isFinite(lvl3Pct)) {
    steps.push({
      key: "lvl3",
      title: "LVL3",
      armPct: Number(lvl3Pct),
      floorPct: lock3Pct != null && Number.isFinite(lock3Pct) ? Number(lock3Pct) : null,
      trailing: false,
    });
  }

  if (lvl4Pct != null && Number.isFinite(lvl4Pct)) {
    steps.push({
      key: "lvl4",
      title: "LVL4",
      armPct: Number(lvl4Pct),
      floorPct: null,
      trailing: true,
    });
  }

  return steps;
}

function primaryExitCurrentStepIndex(slot: SlotRow) {
  const state = String(slot.state || "").toUpperCase();
  if (state === "LVL4_TRAIL" || slot.level === 4) return 4;
  if (state === "LVL3_LOCK" || slot.level === 3) return 3;
  if (state === "LVL2_LOCK" || slot.level === 2) return 2;
  if (state === "LVL1_LOCK" || slot.level === 1) return 1;
  return 0;
}

function clampPct01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function primaryExitProgressModel(
  slot: SlotRow,
  holding: ManagerStatus["holding"] | null | undefined
) {
  const steps = primaryExitLevelSteps(holding);
  const totalCount = steps.length;
  const currentLevel = Math.min(primaryExitCurrentStepIndex(slot), totalCount);
  const liveNet = liveParentNetPct(slot);
  const currentFloor = primaryDecision(slot)?.exitFloorPct ?? primaryExitFloorPct(slot);
  const nextStep = currentLevel < totalCount ? steps[currentLevel] : null;
  const laterSteps = nextStep ? steps.slice(currentLevel + 1) : [];

  let fillPct = currentLevel >= totalCount && totalCount > 0 ? 100 : 0;
  if (liveNet != null && Number.isFinite(liveNet) && totalCount > 0 && currentLevel < totalCount) {
    const prevArm = currentLevel > 0 ? steps[currentLevel - 1]?.armPct ?? 0 : 0;
    const nextArm = nextStep?.armPct ?? prevArm;
    const span = Math.max(nextArm - prevArm, 0.0001);
    const phasePct = clampPct01((Number(liveNet) - prevArm) / span);
    fillPct = ((currentLevel + phasePct) / totalCount) * 100;
  }
  fillPct = totalCount > 0 ? Math.max(8, Math.min(100, fillPct)) : 0;

  return {
    steps,
    totalCount,
    currentLevel,
    currentFloor,
    liveNet,
    nextStep,
    laterSteps,
    fillPct,
    isTrailing: currentLevel >= totalCount && totalCount > 0,
    isArmed: currentFloor != null && Number.isFinite(currentFloor) && Number(currentFloor) > 0,
  };
}

function primaryExitCountdownLabel(
  slot: SlotRow,
  holding: ManagerStatus["holding"] | null | undefined
) {
  const progress = primaryExitProgressModel(slot, holding);
  if (!progress.totalCount) return "Levels unavailable";
  if (progress.isTrailing) return "Trail active";
  if (!progress.nextStep) return "Protection armed";
  return `${progress.totalCount - progress.currentLevel} levels remaining`;
}

function primaryExitProgressBlock(
  slot: SlotRow,
  holding: ManagerStatus["holding"] | null | undefined
) {
  const progress = primaryExitProgressModel(slot, holding);
  if (!progress.totalCount) return null;

  const toneClass = progress.isTrailing ? "is-ready" : progress.isArmed ? "is-active" : "is-blocked";

  return (
    <div className={`entry-progress exit-progress ${toneClass}`} aria-label="Primary exit progress">
      <div className="entry-progress-top">
        <span className="entry-progress-label">Exit progress</span>
        <span className="entry-progress-value">
          {progress.currentLevel}/{progress.totalCount} levels
        </span>
      </div>
      <div className="entry-progress-bar" aria-hidden="true">
        <span style={{ width: `${progress.fillPct}%` }} />
      </div>
      <div className="entry-progress-meta">
        <span>
          {progress.currentFloor != null && Number.isFinite(progress.currentFloor) && progress.currentFloor > 0
            ? `Floor ${pctNum(progress.currentFloor)}`
            : "No floor armed"}
        </span>
        <span>{primaryExitCountdownLabel(slot, holding)}</span>
      </div>
      <div className="exit-progress-rail" aria-label="Primary exit ladder">
        {progress.steps.map((step, index) => {
          const stepClass = progress.isTrailing
            ? step.trailing
              ? "is-trailing"
              : "is-complete"
            : index < progress.currentLevel
              ? "is-complete"
              : index === progress.currentLevel
                ? "is-current"
                : "is-pending";

          return (
            <div key={step.key} className={`exit-progress-step ${stepClass}`}>
              <div className="exit-progress-step-title">{step.title}</div>
              <div className="exit-progress-step-detail">
                {step.trailing
                  ? `${pctNum(step.armPct)} -> Trail`
                  : `${pctNum(step.armPct)} -> ${pctNum(step.floorPct)}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type SecondaryRailItem = {
  key: string;
  label: string;
  stateLabel: string;
  counterLabel: string;
  toneClass: string;
};

function secondaryRailItemStateLabel(subslot: SubslotRow | null) {
  if (!subslot) return "Idle";

  const state = String(subslot.subslotState || "").toUpperCase();
  const signal = String(subslot.subslotSignalState || "").toUpperCase();

  if (state === "BUY_SUBMITTED") return "Entry";
  if (state === "ACTIVE") return "Live";
  if (state === "SELL_SUBMITTED") return "Exit";
  if (signal === "REVERSAL_CONFIRMING") return "Confirm";
  if (signal === "BOUNCE_SEEN") return "Bounce";
  if (signal === "TRACKING") return "Track";
  if (signal === "ARMED") return "Armed";
  if (state === "CLOSED") return "Closed";
  return "Idle";
}

function secondaryRailSlotCapacity(
  slot: SlotRow,
  subslotConfig: ManagerStatus["subslot"] | null | undefined
) {
  const railMax = 8;
  const configuredBands = Array.isArray(subslotConfig?.triggerParentNetBandsPct)
    ? subslotConfig.triggerParentNetBandsPct
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value))
    : [];
  const bandCount = configuredBands.length;
  const configuredMaxPerSlot = Number(subslotConfig?.maxPerSlot);
  const maxPerSlot =
    Number.isInteger(configuredMaxPerSlot) && configuredMaxPerSlot > 0
      ? configuredMaxPerSlot
      : null;
  const sequenceMax = getSubslots(slot).reduce((max, subslot) => {
    const seq = Number(subslot?.subslotSequence);
    return Number.isInteger(seq) && seq > max ? seq : max;
  }, 0);

  let capacity =
    bandCount > 0
      ? (maxPerSlot != null ? Math.min(maxPerSlot, bandCount) : bandCount)
      : (maxPerSlot ?? 5);

  capacity = Math.max(capacity, sequenceMax || 0);
  return Math.max(1, Math.min(railMax, capacity));
}

function secondaryRailItems(
  slot: SlotRow,
  subslotConfig: ManagerStatus["subslot"] | null | undefined
): SecondaryRailItem[] {
  const slotCapacity = secondaryRailSlotCapacity(slot, subslotConfig);
  const sorted = [...getSubslots(slot)].sort((a, b) => {
    const aSeq = Number(a.subslotSequence);
    const bSeq = Number(b.subslotSequence);
    if (Number.isFinite(aSeq) && Number.isFinite(bSeq)) return aSeq - bSeq;
    if (Number.isFinite(aSeq)) return -1;
    if (Number.isFinite(bSeq)) return 1;
    return 0;
  });

  const assigned = new Map<number, SubslotRow>();
  const overflow: SubslotRow[] = [];

  for (const subslot of sorted) {
    const seq = Number(subslot.subslotSequence);
    if (Number.isInteger(seq) && seq >= 1 && seq <= slotCapacity && !assigned.has(seq)) {
      assigned.set(seq, subslot);
    } else {
      overflow.push(subslot);
    }
  }

  const items: SecondaryRailItem[] = [];

  for (let index = 1; index <= slotCapacity; index += 1) {
    const subslot = assigned.get(index) ?? overflow.shift() ?? null;
    items.push({
      key: subslot?.subslotId ?? `${slot.id}-secondary-${index}`,
      label: `S${index}`,
      stateLabel: secondaryRailItemStateLabel(subslot),
      counterLabel: subslotLiveCounterLabel(subslot, slot, subslotConfig, index - 1),
      toneClass: subslot ? subslotToneClass(subslot) : "is-muted",
    });
  }

  return items;
}

function secondaryRailSummary(
  slot: SlotRow,
  subslotConfig: ManagerStatus["subslot"] | null | undefined
) {
  const slotCapacity = secondaryRailSlotCapacity(slot, subslotConfig);
  const openCount = getSubslotOpenCount(slot);
  const activeCount = getActiveSecondaryRows(slot).length;
  const realizedAud = getSubslotRealizedProfit(slot);
  const parts: string[] = [];

  if (!getSecondaryRows(slot).length) {
    return `${slotCapacity} tactical secondary slots available during this Primary.`;
  }

  if (openCount > 0) parts.push(`${openCount}/${slotCapacity} open`);
  if (activeCount > 0) parts.push(`${activeCount} live`);
  if (hasPendingSubslotBuys(slot)) parts.push("entry pending");
  if (hasPendingSubslotSells(slot)) parts.push("exit pending");
  if (realizedAud != null) parts.push(`realized ${moneyAud(realizedAud)}`);

  return parts.length ? parts.join(" | ") : "Secondary rail idle.";
}

function primarySecondaryRail(
  slot: SlotRow,
  subslotConfig: ManagerStatus["subslot"] | null | undefined
) {
  const slotCapacity = secondaryRailSlotCapacity(slot, subslotConfig);
  const items = secondaryRailItems(slot, subslotConfig);

  return (
    <div className="entry-progress secondary-rail" aria-label="Primary secondary rail">
      <div className="entry-progress-top">
        <span className="entry-progress-label">Secondary rail</span>
        <span className="entry-progress-value">{countActiveSecondaries(slot)}/{slotCapacity} live</span>
      </div>
      <div className="secondary-rail-track" aria-label="Secondary trade slots">
        {items.map((item) => (
          <div key={item.key} className={`secondary-rail-slot ${item.toneClass}`}>
            <div className="secondary-rail-slot-label">{item.label}</div>
            <div className="secondary-rail-slot-state">{item.stateLabel}</div>
            <div className="secondary-rail-slot-counter">{item.counterLabel}</div>
          </div>
        ))}
      </div>
      <div className="secondary-rail-summary">{secondaryRailSummary(slot, subslotConfig)}</div>
    </div>
  );
}

function primaryRoundTripFeePct(slot: SlotRow | null | undefined) {
  const feeBps = slot?.feeBps;
  if (feeBps == null || !Number.isFinite(feeBps)) return null;
  return Number((((Number(feeBps) * 2) / 100)).toFixed(3));
}

function primaryGrossNetGapPct(slot: SlotRow | null | undefined) {
  const grossPct = liveParentGrossPct(slot);
  const netPct = liveParentNetPct(slot);
  if (grossPct == null || !Number.isFinite(grossPct) || netPct == null || !Number.isFinite(netPct)) return null;
  return Number(Math.abs(grossPct - netPct).toFixed(3));
}

function primaryGrossNetSummary(slot: SlotRow) {
  const gapPct = primaryGrossNetGapPct(slot);
  const entrySpreadRaw = Number(slot.entrySpreadPct);
  const liveSpreadRaw = Number(slot.nowSpreadPct);
  const entrySpreadPct = Number.isFinite(entrySpreadRaw) ? entrySpreadRaw : null;
  const liveSpreadPct = Number.isFinite(liveSpreadRaw) ? liveSpreadRaw : null;
  const feePct = primaryRoundTripFeePct(slot);
  const parts: string[] = [
    "Live Gross shows the same parent move before friction and fees.",
    "Live Net is the executable parent exit after spread and fees.",
  ];

  if (Number.isFinite(entrySpreadPct) || Number.isFinite(liveSpreadPct)) {
    parts.push(
      `Entry spread ${pctNum(Number.isFinite(entrySpreadPct) ? entrySpreadPct : null)}, live spread ${pctNum(
        Number.isFinite(liveSpreadPct) ? liveSpreadPct : null
      )}.`
    );
  }

  if (feePct != null && Number.isFinite(feePct)) {
    parts.push(`Round-trip fees ${pctNum(feePct)}.`);
  }

  if (gapPct != null && Number.isFinite(gapPct)) {
    parts.push(`That compresses the executable move by ${pctNum(gapPct)}.`);
  }

  return parts.join(" ");
}

function primaryGrossNetBreakdownBlock(slot: SlotRow) {
  const grossPct = liveParentGrossPct(slot);
  const netPct = liveParentNetPct(slot);
  if (grossPct == null || !Number.isFinite(grossPct) || netPct == null || !Number.isFinite(netPct)) return null;

  const gapPct = primaryGrossNetGapPct(slot);
  const feePct = primaryRoundTripFeePct(slot);
  const entrySpreadRaw = Number(slot.entrySpreadPct);
  const liveSpreadRaw = Number(slot.nowSpreadPct);
  const entrySpreadPct = Number.isFinite(entrySpreadRaw) ? entrySpreadRaw : null;
  const liveSpreadPct = Number.isFinite(liveSpreadRaw) ? liveSpreadRaw : null;

  return (
    <div className="entry-progress execution-breakdown" aria-label="Primary gross versus net">
      <div className="entry-progress-top">
        <span className="entry-progress-label">Gross vs Net</span>
        <span className="entry-progress-value">
          Gap {pctNum(gapPct)}
        </span>
      </div>
      <div className="execution-breakdown-grid">
        <div className="execution-breakdown-metric">
          <div className="execution-breakdown-k">Gross</div>
          <div className="execution-breakdown-v">{pctNum(grossPct)}</div>
        </div>
        <div className="execution-breakdown-metric">
          <div className="execution-breakdown-k">Net</div>
          <div className="execution-breakdown-v">{pctNum(netPct)}</div>
        </div>
        <div className="execution-breakdown-metric">
          <div className="execution-breakdown-k">Entry Spread</div>
          <div className="execution-breakdown-v">{pctNum(entrySpreadPct)}</div>
        </div>
        <div className="execution-breakdown-metric">
          <div className="execution-breakdown-k">Live Spread</div>
          <div className="execution-breakdown-v">{pctNum(liveSpreadPct)}</div>
        </div>
        <div className="execution-breakdown-metric">
          <div className="execution-breakdown-k">Round-trip Fees</div>
          <div className="execution-breakdown-v">{pctNum(feePct)}</div>
        </div>
        <div className="execution-breakdown-metric">
          <div className="execution-breakdown-k">Compression</div>
          <div className="execution-breakdown-v">{pctNum(gapPct)}</div>
        </div>
      </div>
      <div className="execution-breakdown-copy">{primaryGrossNetSummary(slot)}</div>
    </div>
  );
}

function primarySetupStateLabel(slot: SlotRow) {
  const tracking = String(slot.trackingState || "").toUpperCase();
  const state = String(slot.state || "").toUpperCase();

  if (state === "DEPLOYING") return "Entry submitting";
  if (tracking === "REVERSAL_CONFIRMING") return "Reversal confirming";
  if (tracking === "DRAWDOWN_SEEN") return "Drawdown ready";
  if (tracking === "SPREAD_BLOCKED") return "Spread blocked";
  if (tracking === "NO_MARKET") return "Waiting for market";
  if (reentryTargetHit(slot)) return "Reference crossed";
  return "Tracking setup";
}

function primaryProtectionLabel(slot: SlotRow) {
  const state = String(slot.state || "").toUpperCase();
  const floorPct = primaryDecision(slot)?.exitFloorPct ?? primaryExitFloorPct(slot);
  const liveNet = liveParentNetPct(slot);

  if (state === "EXITING") return "Sell resolving";
  if (state === "DEPLOYING") return "Awaiting entry proof";

  if (floorPct != null && Number.isFinite(floorPct) && Number(floorPct) > 0) {
    const parts = [`Floor ${pctNum(floorPct)}`];
    if (liveNet != null && Number.isFinite(liveNet)) {
      const gapPct = Number(liveNet) - Number(floorPct);
      parts.push(gapPct >= 0 ? `${pctNum(gapPct)} above` : `${pctNum(Math.abs(gapPct))} below`);
    }
    return parts.join(" | ");
  }

  if (isHoldingFamilyState(state)) {
    if (liveNet != null && Number(liveNet) > 0) return "Green, floor not armed";
    return "No floor yet";
  }

  if (state === "WAITING_ENTRY" && slot.reentryTargetMid != null && Number.isFinite(slot.reentryTargetMid)) {
    return `Reference ${fmt(slot.reentryTargetMid)}`;
  }

  return "-";
}

function secondaryTradesLabel(slot: SlotRow | null | undefined) {
  if (!slot) return "None";
  const total = getSecondaryRows(slot).length;
  const active = secondaryLiveCount(slot);
  const totalGainAud = secondaryTotalGainAud(slot);
  const parts: string[] = [];

  if (!total) return "None";
  if (active > 0) parts.push(`${active} live`);
  if (hasPendingSubslotBuys(slot)) parts.push("entry pending");
  if (hasPendingSubslotSells(slot)) parts.push("exit pending");
  if (!parts.length) parts.push(`${total} recorded`);
  if (totalGainAud != null) parts.push(moneyAud(totalGainAud));
  return parts.join(" | ");
}

function nextActionLabel(s: SlotRow) {
  const state = String(s.state || "").toUpperCase();
  const tracking = String(s.trackingState || "").toUpperCase();

  if (tracking === "PARENT_EXIT_WAIT_GREEN") return "Waiting for green exit";
  if (state === "EXITING") return "Confirming exit fill";
  if (state === "DEPLOYING") return "Confirming entry fill";

  if (state === "WAITING_ENTRY") {
    if (tracking === "REVERSAL_CONFIRMING") return "Reversal confirming";
    if (tracking === "DRAWDOWN_SEEN") return "Drawdown ready";
    if (tracking === "SPREAD_BLOCKED") return "Spread blocking entry";
    if (tracking === "NO_MARKET") return "Waiting for market read";
    if (reentryTargetHit(s)) return "Reference crossed, waiting for remaining gates";
    if (s.reentryTargetMid != null && Number.isFinite(s.reentryTargetMid)) return "Tracking setup from last exit";
    return "Watching for setup";
  }

  if (hasPendingSubslotSells(s)) return "Managing secondary exit";
  if (hasPendingSubslotBuys(s)) return "Managing secondary entry";
  if (secondaryLiveCount(s) > 0) return "Managing secondary trades";
  if (state === "LVL4_TRAIL" || state === "LVL1_LOCK" || state === "LVL2_LOCK" || state === "LVL3_LOCK") {
    return "Holding above exit floor";
  }
  if (state === "HOLDING") {
    const liveNet = liveParentNetPct(s);
    return liveNet != null && Number(liveNet) > 0 ? "Building protection" : "Waiting for protection";
  }

  return "Observing";
}

function liveParentAnalysis(s: SlotRow, nowMs: number) {
  const parts: string[] = [];

  const nowMid = s.nowMid;
  const netPct = liveParentNetPct(s);
  const lifetimeNet = primaryTotalGainPct(s);
  const spreadPct = s.nowSpreadPct;
  const dd = s.drawdownPct;
  const breakout = s.consolidationBreakoutReady === true;
  const tracking = String(s.trackingState || "").toUpperCase();
  const state = String(s.state || "").toUpperCase();
  const regime = rawRegimeValue(s);
  const updated = slotHeartbeatLabel(s, nowMs);
  const trailMovement = primaryTrailMovementLabel(s);

  // Parent State Analysis
  if (state === "EXITING") {
    parts.push("Jrd Primary exit is being resolved live.");
  } else if (state === "DEPLOYING") {
    parts.push("Jrd Primary entry is being confirmed live.");
  } else if (state === "LVL4_TRAIL") {
    parts.push("Jrd Primary is in high-protection trailing mode.");
  } else if (state === "LVL1_LOCK" || state === "LVL2_LOCK" || state === "LVL3_LOCK") {
    parts.push("Jrd Primary is locked with a live trailing floor.");
  } else if (isHoldingFamilyState(state)) {
    parts.push("Jrd Primary is live and being managed.");
  } else if (state === "WAITING_ENTRY") {
    if (reentryTargetHit(s)) {
      if (tracking === "REVERSAL_CONFIRMING") {
        parts.push("Primary setup has crossed its last-exit reference and reversal confirmation is building.");
      } else if (tracking === "SPREAD_BLOCKED") {
        parts.push("Primary setup has crossed its last-exit reference, but spread is blocking deployment.");
      } else if (tracking === "NO_MARKET") {
        parts.push("Primary setup has crossed its last-exit reference, but live market confirmation is unavailable.");
      } else {
        parts.push("Primary setup has crossed its last-exit reference and is still waiting for the remaining entry gates.");
      }
    } else {
      parts.push("Primary is waiting for a qualified setup.");
    }
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
  } else if (state === "WAITING_ENTRY" && Number.isFinite(lifetimeNet)) {
    parts.push(`Lifetime net is ${pctNum(lifetimeNet)}.`);
  }

  if (trailMovement) {
    parts.push(trailMovement);
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
  const liveDistancePct = subslotLiveDistancePct(subslot, parent);

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

  if (liveDistancePct != null) {
    if (liveDistancePct > 0) parts.push(`${pctNum(liveDistancePct)} remains before Jrd Secondary goes live.`);
    else parts.push("Jrd Secondary live trigger is met.");
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

type PositionStageKey =
  | "waiting-setup"
  | "reversal-confirming"
  | "entering"
  | "live-primary"
  | "protected-primary"
  | "exit-waiting"
  | "exiting";

type PositionMetric = {
  label: string;
  value: string;
  toneClass?: string;
};

const POSITION_STAGE_ORDER: Array<{ key: PositionStageKey; title: string; note: string }> = [
  {
    key: "waiting-setup",
    title: "Waiting Setup",
    note: "Primaries watching for a qualified pullback and bounce.",
  },
  {
    key: "reversal-confirming",
    title: "Reversal Confirming",
    note: "Primaries close to entry if confirmation and spread hold.",
  },
  {
    key: "entering",
    title: "Entering",
    note: "Primary entries are in flight and still proving the fill.",
  },
  {
    key: "live-primary",
    title: "Live Primary",
    note: "Primaries are live but protection is not fully armed yet.",
  },
  {
    key: "protected-primary",
    title: "Protected Primary",
    note: "Protection is armed and the Primary is being defended live.",
  },
  {
    key: "exit-waiting",
    title: "Exit Waiting",
    note: "The Primary wants to exit, but the green sell gate is still blocking.",
  },
  {
    key: "exiting",
    title: "Exiting",
    note: "Primary sells are resolving live.",
  },
];

function primaryExecutableExitNetPct(slot: SlotRow | null | undefined) {
  const value = primaryDecision(slot)?.executableExitNetPct;
  return value != null && Number.isFinite(value) ? value : null;
}

function primaryExecutableExitProfitAud(slot: SlotRow | null | undefined) {
  const value = primaryDecision(slot)?.executableExitProfitAud;
  return value != null && Number.isFinite(value) ? value : null;
}

function primaryExitRequiredNetPct(slot: SlotRow | null | undefined) {
  const value = primaryDecision(slot)?.exitRequiredNetPct;
  return value != null && Number.isFinite(value) ? value : null;
}

function primaryExitRequiredProfitAud(slot: SlotRow | null | undefined) {
  const value = primaryDecision(slot)?.exitRequiredProfitAud;
  return value != null && Number.isFinite(value) ? value : null;
}

function primaryFloorGapPct(slot: SlotRow | null | undefined) {
  if (!slot) return null;
  const liveNet = liveParentNetPct(slot);
  const floorPct = primaryDecision(slot)?.exitFloorPct ?? primaryExitFloorPct(slot);
  if (
    liveNet == null ||
    floorPct == null ||
    !Number.isFinite(liveNet) ||
    !Number.isFinite(floorPct) ||
    Number(floorPct) <= 0
  ) {
    return null;
  }
  return Number(liveNet) - Number(floorPct);
}

function positionStageForSlot(slot: SlotRow): PositionStageKey {
  const state = String(slot.state || "").toUpperCase();
  const tracking = String(slot.trackingState || "").toUpperCase();
  const floorPct = primaryDecision(slot)?.exitFloorPct ?? primaryExitFloorPct(slot);
  const hasArmedFloor = floorPct != null && Number.isFinite(floorPct) && Number(floorPct) > 0;

  if (tracking === "PARENT_EXIT_WAIT_GREEN") return "exit-waiting";
  if (state === "EXITING") return "exiting";
  if (
    state === "DEPLOYING" ||
    tracking === "DEPLOYING" ||
    tracking === "BUY_SUBMITTING" ||
    tracking === "BUY_SUBMITTED" ||
    tracking === "BUY_LOCK_SUBMITTED"
  ) {
    return "entering";
  }
  if (state === "WAITING_ENTRY" && tracking === "REVERSAL_CONFIRMING") return "reversal-confirming";
  if (
    state === "LVL1_LOCK" ||
    state === "LVL2_LOCK" ||
    state === "LVL3_LOCK" ||
    state === "LVL4_TRAIL" ||
    (state === "HOLDING" && hasArmedFloor)
  ) {
    return "protected-primary";
  }
  if (state === "HOLDING") return "live-primary";
  return "waiting-setup";
}

function positionStageMeta(key: PositionStageKey) {
  return POSITION_STAGE_ORDER.find((entry) => entry.key === key) ?? POSITION_STAGE_ORDER[0];
}

function slotNeedsAction(slot: SlotRow) {
  const tracking = String(slot.trackingState || "").toUpperCase();
  const stage = positionStageForSlot(slot);
  return (
    stage === "entering" ||
    stage === "exit-waiting" ||
    stage === "exiting" ||
    tracking === "SPREAD_BLOCKED" ||
    tracking === "NO_MARKET" ||
    hasPendingSubslotBuys(slot) ||
    hasPendingSubslotSells(slot)
  );
}

function actionNeededSummary(slot: SlotRow) {
  const stage = positionStageForSlot(slot);
  const decision = primaryDecision(slot);

  if (stage === "exit-waiting") {
    const parts = ["Green exit is still blocked."];
    if (
      decision?.exitRequiredNetPct != null &&
      Number.isFinite(decision.exitRequiredNetPct) &&
      decision?.exitRequiredProfitAud != null &&
      Number.isFinite(decision.exitRequiredProfitAud)
    ) {
      parts.push(
        `Needs executable net above ${pctNum(decision.exitRequiredNetPct)} and executable profit above ${moneyAud(decision.exitRequiredProfitAud)}.`
      );
    } else if (decision?.exitRequiredNetPct != null && Number.isFinite(decision.exitRequiredNetPct)) {
      parts.push(`Needs executable net above ${pctNum(decision.exitRequiredNetPct)}.`);
    }
    if (
      decision?.executableExitNetPct != null &&
      Number.isFinite(decision.executableExitNetPct) &&
      decision?.executableExitProfitAud != null &&
      Number.isFinite(decision.executableExitProfitAud)
    ) {
      parts.push(
        `Current read is ${pctNum(decision.executableExitNetPct)} and ${moneyAud(decision.executableExitProfitAud)}.`
      );
    }
    if (decision?.exitGateReason && !/needs\s*>?=/i.test(decision.exitGateReason)) parts.push(decision.exitGateReason);
    return parts.join(" ");
  }

  if (stage === "entering") return "Primary entry is confirming live.";
  if (stage === "exiting") return "Primary sell is confirming live.";
  if (hasPendingSubslotSells(slot)) return "Secondary exit is being managed.";
  if (hasPendingSubslotBuys(slot)) return "Secondary entry is being managed.";
  if (String(slot.trackingState || "").toUpperCase() === "SPREAD_BLOCKED") return "Spread is blocking the next Primary entry.";
  if (String(slot.trackingState || "").toUpperCase() === "NO_MARKET") return "Waiting for a fresh market read.";
  return nextActionLabel(slot);
}

function waitingPrimarySummary(slot: SlotRow) {
  return primaryEntryWaitingLabel(slot);
}

function activePrimarySummary(slot: SlotRow) {
  const stage = positionStageForSlot(slot);
  if (stage === "exit-waiting") return actionNeededSummary(slot);
  if (stage === "exiting") return "Primary sell is resolving live.";
  if (stage === "entering") return "Primary entry is confirming live.";
  if (stage === "protected-primary") return "Protection is armed and the Primary is being defended live.";
  return "Primary is live and still building protection.";
}

function positionStageSummary(slot: SlotRow) {
  const stage = positionStageForSlot(slot);
  if (stage === "waiting-setup" || stage === "reversal-confirming") return waitingPrimarySummary(slot);
  if (stage === "entering" || stage === "exit-waiting" || stage === "exiting") return actionNeededSummary(slot);
  return activePrimarySummary(slot);
}

function positionCardToneClass(slot: SlotRow) {
  const stage = positionStageForSlot(slot);
  if (stage === "exit-waiting") return "is-blocked";
  if (stage === "exiting") return "is-exiting";
  if (stage === "entering" || stage === "reversal-confirming") return "is-deploying";
  if (stage === "protected-primary" || stage === "live-primary") return "is-holding";
  return stateToneClass(slot);
}

function positionMetricsForSlot(slot: SlotRow, nowMs: number): PositionMetric[] {
  const stage = positionStageForSlot(slot);
  const decision = primaryDecision(slot);
  const floorGap = primaryFloorGapPct(slot);

  if (stage === "waiting-setup") {
    return [
      { label: "Drawdown", value: pctNum(slot.candidateDrawdownPct ?? slot.drawdownPct) },
      { label: "Bounce", value: pctNum(slot.candidateBouncePct) },
      { label: "Spread", value: pctNum(slot.nowSpreadPct) },
      { label: "Reference", value: primaryReferenceLabel(slot) },
    ];
  }

  if (stage === "reversal-confirming") {
    return [
      { label: "Bounce", value: pctNum(slot.candidateBouncePct) },
      { label: "Spread", value: pctNum(slot.nowSpreadPct) },
      { label: "Signal", value: primarySetupStateLabel(slot), toneClass: "is-deploying" },
      { label: "Reference", value: primaryReferenceLabel(slot) },
    ];
  }

  if (stage === "entering") {
    return [
      { label: "Entry", value: effectiveEntryLabel(slot) },
      { label: "Live Price", value: effectiveNowLabel(slot) },
      { label: "Spread", value: pctNum(slot.nowSpreadPct) },
      { label: "Updated", value: slotHeartbeatCardLabel(slot, nowMs) },
    ];
  }

  if (stage === "live-primary") {
    return [
      { label: "Live Net", value: pctNum(liveParentNetPct(slot)), toneClass: "is-holding" },
      { label: "Live Gross", value: pctNum(liveParentGrossPct(slot)), toneClass: "is-tracking" },
      { label: "Protection", value: primaryProtectionLabel(slot) },
      { label: "Secondary Trades", value: secondaryTradesLabel(slot), toneClass: primarySubslotToneClass(slot) },
    ];
  }

  if (stage === "protected-primary") {
    return [
      { label: "Live Net", value: pctNum(liveParentNetPct(slot)), toneClass: "is-holding" },
      { label: "Live Gross", value: pctNum(liveParentGrossPct(slot)), toneClass: "is-tracking" },
      { label: "Exit Floor", value: pctNum(decision?.exitFloorPct ?? primaryExitFloorPct(slot)) },
      {
        label: "Gap To Floor",
        value: floorGap == null ? "-" : floorGap >= 0 ? `${pctNum(floorGap)} above` : `${pctNum(Math.abs(floorGap))} below`,
      },
    ];
  }

  if (stage === "exit-waiting") {
    return [
      {
        label: "Executable Net",
        value: pctNum(primaryExecutableExitNetPct(slot)),
        toneClass: "is-blocked",
      },
      {
        label: "Executable AUD",
        value: moneyAud(primaryExecutableExitProfitAud(slot)),
        toneClass: "is-blocked",
      },
      { label: "Required Net", value: pctNum(primaryExitRequiredNetPct(slot)) },
      { label: "Required AUD", value: moneyAud(primaryExitRequiredProfitAud(slot)) },
    ];
  }

  return [
    { label: "Live Net", value: pctNum(liveParentNetPct(slot)), toneClass: "is-exiting" },
    { label: "Live Gross", value: pctNum(liveParentGrossPct(slot)), toneClass: "is-tracking" },
    { label: "Expected Exit", value: moneyAud(slot.liveExitExpectedAud) },
    { label: "Fill Status", value: slot.liveExitFillStatus ?? "-" },
  ];
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
    } catch {
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
        <h1 className="engine-title">JAL Engine</h1>
        <div className="engine-sub">
          Private fixed-slot auto-trading dashboard for the 8-coin engine.
          Read the outcome first, then open the machine proof when you need the deeper detail.
        </div>

        {view === "advanced" ? (
          <div className="card machine-surface panel-frame engine-telemetry engine-telemetry--compact">
            <div className="engine-mini">
              <div className="engine-mini-row">
                <div className="mini-k">System</div>
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
                <div className="mini-k">Last engine action</div>
                <div className="mini-v">{lastAction}</div>
              </div>
            </div>
          </div>
        ) : null}

        <div className={`engine-runtime-warnings ${runtimeWarnings.length ? "has-warnings" : "is-clear"}`}>
          <div className="engine-runtime-title">Attention</div>
          {runtimeWarnings.length ? (
            runtimeWarnings.map((warning, index) => (
              <div key={`${warning}-${index}`} className="engine-runtime-warning">{warning}</div>
            ))
          ) : (
            <div className="engine-runtime-warning engine-runtime-warning--muted">System clear.</div>
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
          Clarity first. Proof second. Each slot shows status, live performance, protection, and next action.
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
        <div className="cap-k">Open Positions</div>
        <div className="cap-v">{moneyAud(props.openPnl)}</div>
        <div className="cap-sub">
          <span>Realized Total {moneyAud(props.visibleRealized)}</span>
          <span>|</span>
          <span>Recent Window {moneyAud(props.windowHarvest)}</span>
        </div>
      </div>

      <div className="engine-capture card machine-surface panel-frame">
        <div className="cap-k">Available Capital</div>
        <div className="cap-v">{moneyAud(props.audAvailable)}</div>
        <div className="cap-sub">
          <span>Wallet {moneyAud(props.walletAudValue)}</span>
          <span>|</span>
          <span>Movable {moneyAud(props.movableAudEstimate)}</span>
          <span>|</span>
          <span>{props.rotationMode}</span>
        </div>
      </div>

      <div className="engine-capture card machine-surface panel-frame">
        <div className="cap-k">Market & Cadence</div>
        <div className="cap-v">{props.nextSweepLabel}</div>
        <div className="cap-sub">
          <span>Window {props.currentWindow ?? "-"}</span>
          <span>|</span>
          <span>Last sweep {props.lastSweepAgo}</span>
        </div>
      </div>

      <div className="engine-capture card machine-surface panel-frame">
        <div className="cap-k">Positions</div>
        <div className="cap-v">
          {props.fixedPresent}/{props.fixedExpected}
        </div>
        <div className="cap-sub">
          <span>Tracking {props.trackingCount}</span>
          <span>|</span>
          <span>In play {props.holdingCount}</span>
        </div>
      </div>

      <div className="engine-capture card machine-surface panel-frame">
        <div className="cap-k">Secondary Trades</div>
        <div className="cap-v">{props.activeSubslots}</div>
        <div className="cap-sub">
          <span>Breakout ready {props.breakoutReady}</span>
          <span>|</span>
          <span>Consolidation {props.consolidation}</span>
        </div>
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
  holding: ManagerStatus["holding"] | null | undefined;
  subslotConfig: ManagerStatus["subslot"] | null | undefined;
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
    <div className="card machine-surface panel-frame engine-status-rail" aria-label="Live engine status">
      <div className="engine-telemetry-head">
        <div>
          <div className="engine-telemetry-title">Position Spotlight</div>
          <div className="engine-telemetry-note">
            One slot at a time, explained in plain language before the deeper machine detail.
            Live Net tracks the executable parent exit after spread and fees. Live Gross shows the same parent move before friction and fees.
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
                <div className="engine-carousel-k">Status</div>
                <div className={`engine-carousel-v ${stateClassName(stateLabel(carouselSlot))}`}>
                  {readerStatusLabel(carouselSlot)}
                </div>
              </div>

              <div className="engine-carousel-metric">
                <div className="engine-carousel-k">Live Net</div>
                <div className="engine-carousel-v">{pctNum(liveParentNetPct(carouselSlot))}</div>
              </div>

              <div className="engine-carousel-metric">
                <div className="engine-carousel-k">Live Gross</div>
                <div className="engine-carousel-v">{pctNum(liveParentGrossPct(carouselSlot))}</div>
              </div>

              <div className="engine-carousel-metric">
                <div className="engine-carousel-k">Lifetime Net</div>
                <div className="engine-carousel-v">{pctNum(primaryTotalGainPct(carouselSlot))}</div>
              </div>

              <div className="engine-carousel-metric">
                <div className="engine-carousel-k">Live Deployed</div>
                <div className="engine-carousel-v">{moneyAud(primaryDeployedUnitAud(carouselSlot))}</div>
              </div>

              <div className="engine-carousel-metric">
                <div className="engine-carousel-k">Protection</div>
                <div className="engine-carousel-v">{primaryProtectionLabel(carouselSlot)}</div>
              </div>

              <div className="engine-carousel-metric">
                <div className="engine-carousel-k">Next Action</div>
                <div className="engine-carousel-v">{nextActionLabel(carouselSlot)}</div>
              </div>

              <div className="engine-carousel-metric">
                <div className="engine-carousel-k">Spread</div>
                <div className="engine-carousel-v">{pctNum(carouselSlot.nowSpreadPct)}</div>
              </div>

              <div className="engine-carousel-metric">
                <div className="engine-carousel-k">Secondary Trades</div>
                <div className="engine-carousel-v">{secondaryTradesLabel(carouselBaseSlot)}</div>
              </div>

              <div className="engine-carousel-metric">
                <div className="engine-carousel-k">Updated</div>
                <div className="engine-carousel-v">{slotHeartbeatLabel(carouselSlot, props.nowMs)}</div>
              </div>
            </div>

            <div className="engine-carousel-foot">
  <span>{liveParentAnalysis(carouselSlot, props.nowMs)}</span>
</div>

{carouselSlot && hasActiveParentExposure(carouselSlot) ? (
  <div className="engine-carousel-progress">
    {primaryExitProgressBlock(carouselSlot, props.holding)}
    {primaryGrossNetBreakdownBlock(carouselSlot)}
  </div>
) : null}

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
                      <div className="engine-subslot-k">To Live</div>
                      <div className="engine-subslot-v">
                        {subslotLiveCounterLabel(carouselPrimary, carouselSlot, props.subslotConfig)}
                      </div>
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
        <div className="bay-note">Read-only CoinSpot market feed for Jeremy&apos;s personal engine.</div>
      </div>

      <div className="card machine-surface panel-frame engine-telemetry" aria-label="Market feed">
        <div className="engine-telemetry-head">
          <div className="engine-telemetry-title">Market Feed</div>
          <div className="engine-telemetry-note">Coin / Mid / Spread for read-only viewing</div>
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
  holding: ManagerStatus["holding"] | null | undefined;
  subslotConfig: ManagerStatus["subslot"] | null | undefined;
  onOpenSlot: (id: string) => void;
  nowMs: number;
}) {
  const actionSlots = props.slots.filter(slotNeedsAction);
  const liveSlots = props.slots.filter((slot) => {
    const stage = positionStageForSlot(slot);
    return (
      stage === "entering" ||
      stage === "live-primary" ||
      stage === "protected-primary"
    );
  });
  const waitingSlots = props.slots.filter((slot) => String(slot.state || "").toUpperCase() === "WAITING_ENTRY");
  const liveSecondaries = props.slots.reduce((sum, slot) => sum + secondaryLiveCount(slot), 0);

  return (
    <div className="card machine-surface panel-frame engine-ledger engine-dashboard" aria-label="Overview cards">
      <div className="engine-ledger-top">
        <div>
          <div className="engine-ledger-title">Reader Dashboard</div>
          <div className="engine-ledger-note">
            Live summary first: what needs action now, what is already in motion, and what is building toward the next
            Primary entry.
          </div>
        </div>
      </div>

      <div className="dashboard-metric-grid" aria-label="Dashboard headline metrics">
        <div className="dashboard-metric-card">
          <div className="dashboard-metric-k">Action Needed</div>
          <div className="dashboard-metric-v">{actionSlots.length}</div>
          <div className="dashboard-metric-sub">Entries, exits, or blocked reads that need the closest attention.</div>
        </div>

        <div className="dashboard-metric-card">
          <div className="dashboard-metric-k">Live Primaries</div>
          <div className="dashboard-metric-v">{liveSlots.length}</div>
          <div className="dashboard-metric-sub">Primaries entering, live, protected, or resolving an exit.</div>
        </div>

        <div className="dashboard-metric-card">
          <div className="dashboard-metric-k">Waiting Primaries</div>
          <div className="dashboard-metric-v">{waitingSlots.length}</div>
          <div className="dashboard-metric-sub">Primaries tracking the next qualified setup.</div>
        </div>

        <div className="dashboard-metric-card">
          <div className="dashboard-metric-k">Live Secondaries</div>
          <div className="dashboard-metric-v">{liveSecondaries}</div>
          <div className="dashboard-metric-sub">Secondary trades currently active across the fixed set.</div>
        </div>
      </div>

      <div className="dashboard-shell">
        <section className="dashboard-panel" aria-label="Action needed">
          <div className="dashboard-panel-top">
            <div>
              <div className="dashboard-panel-title">Action Needed</div>
              <div className="dashboard-panel-note">Only the live items that are actively moving or blocked.</div>
            </div>
            <div className="dashboard-panel-count">{actionSlots.length}</div>
          </div>

          {actionSlots.length ? (
            <div className="dashboard-list">
              {actionSlots.map((slot) => (
                <button
                  type="button"
                  key={slot.id}
                  className={`dashboard-row ${positionCardToneClass(slot)}`}
                  onClick={() => props.onOpenSlot(slot.id)}
                >
                  <div className="dashboard-row-top">
                    <div className="dashboard-row-coin">{slotCoin(slot)}</div>
                    <div className="dashboard-row-badge">{positionStageMeta(positionStageForSlot(slot)).title}</div>
                  </div>
                  <div className="dashboard-row-copy">{actionNeededSummary(slot)}</div>
                  <div className="dashboard-row-meta">
                    <span>{secondaryTradesLabel(slot)}</span>
                    <span>{slotHeartbeatCardLabel(slot, props.nowMs)}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty">System clear. No Primary or Secondary stage needs immediate attention.</div>
          )}
        </section>

        <section className="dashboard-panel" aria-label="Live primaries">
          <div className="dashboard-panel-top">
            <div>
              <div className="dashboard-panel-title">Live Primaries</div>
              <div className="dashboard-panel-note">
                What is already in motion, including protection and exit readiness. Live Net is the executable parent exit after spread and fees. Live Gross is the same parent move before friction and fees.
              </div>
            </div>
            <div className="dashboard-panel-count">{liveSlots.length}</div>
          </div>

          {liveSlots.length ? (
            <div className="dashboard-list">
              {liveSlots.map((slot) => (
                <button
                  type="button"
                  key={slot.id}
                  className={`dashboard-row ${positionCardToneClass(slot)}`}
                  onClick={() => props.onOpenSlot(slot.id)}
                >
                  <div className="dashboard-row-top">
                    <div className="dashboard-row-coin">{slotCoin(slot)}</div>
                    <div className="dashboard-row-badge">{positionStageMeta(positionStageForSlot(slot)).title}</div>
                  </div>
                  <div className="dashboard-row-stats">
                    <span>Live Net {pctNum(liveParentNetPct(slot))}</span>
                    <span>Live Gross {pctNum(liveParentGrossPct(slot))}</span>
                    <span>{primaryProtectionLabel(slot)}</span>
                  </div>
                  {primaryExitProgressBlock(slot, props.holding)}
                  {primarySecondaryRail(slot, props.subslotConfig)}
                  <div className="dashboard-row-meta">
                    <span>{slotHeartbeatCardLabel(slot, props.nowMs)}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty">No live Primaries right now.</div>
          )}
        </section>

        <section className="dashboard-panel dashboard-panel--waiting" aria-label="Waiting primaries">
          <div className="dashboard-panel-top">
            <div>
              <div className="dashboard-panel-title">Waiting Primaries</div>
              <div className="dashboard-panel-note">Setup quality, not a hard re-entry trigger.</div>
            </div>
            <div className="dashboard-panel-count">{waitingSlots.length}</div>
          </div>

          {waitingSlots.length ? (
            <div className="dashboard-list">
              {waitingSlots.map((slot) => (
                <button
                  type="button"
                  key={slot.id}
                  className={`dashboard-row ${positionCardToneClass(slot)}`}
                  onClick={() => props.onOpenSlot(slot.id)}
                >
                  <div className="dashboard-row-top">
                    <div className="dashboard-row-coin">{slotCoin(slot)}</div>
                    <div className="dashboard-row-badge">{primarySetupStateLabel(slot)}</div>
                  </div>
                  <div className="dashboard-row-stats">
                    <span>Drawdown {pctNum(slot.candidateDrawdownPct ?? slot.drawdownPct)}</span>
                    <span>Bounce {pctNum(slot.candidateBouncePct)}</span>
                    <span>Spread {pctNum(slot.nowSpreadPct)}</span>
                  </div>
                  {primaryEntryProgressBlock(slot)}
                  <div className="dashboard-row-copy">{primaryEntryWaitingLabel(slot)}</div>
                  <div className="dashboard-row-meta">
                    <span>Reference {primaryReferenceLabel(slot)}</span>
                    <span>{slotHeartbeatCardLabel(slot, props.nowMs)}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty">No waiting Primaries in the current view.</div>
          )}
        </section>
      </div>
    </div>
  );
});

const LedgerTable = React.memo(function LedgerTable(props: {
  slots: SlotRow[];
  nowMs: number;
  onOpenSlot: (id: string) => void;
  fixedPresent: number;
  fixedMissing: string[];
}) {
  const stageCounts = POSITION_STAGE_ORDER.reduce<Record<PositionStageKey, number>>((acc, stage) => {
    acc[stage.key] = props.slots.filter((slot) => positionStageForSlot(slot) === stage.key).length;
    return acc;
  }, {
    "waiting-setup": 0,
    "reversal-confirming": 0,
    entering: 0,
    "live-primary": 0,
    "protected-primary": 0,
    "exit-waiting": 0,
    exiting: 0,
  });

  const liveSecondaries = props.slots.reduce((sum, slot) => sum + secondaryLiveCount(slot), 0);

  return (
    <div className="card machine-surface panel-frame engine-ledger engine-stage-board" aria-label="Slots Ledger">
      <div className="engine-ledger-top">
        <div>
          <div className="engine-ledger-title">Positions Board</div>
          <div className="engine-ledger-note">
            Primaries move between live stage sections automatically, with the relevant metrics shown for each stage.
          </div>
        </div>

        <div className="engine-ledger-counts">
          Fixed: <strong>{props.fixedPresent}</strong> | Missing: <strong>{props.fixedMissing.length}</strong>
        </div>
      </div>

      <div className="positions-summary-grid" aria-label="Position stage counts">
        <div className="positions-summary-card">
          <div className="positions-summary-k">Waiting Setup</div>
          <div className="positions-summary-v">{stageCounts["waiting-setup"]}</div>
        </div>
        <div className="positions-summary-card">
          <div className="positions-summary-k">Reversal Confirming</div>
          <div className="positions-summary-v">{stageCounts["reversal-confirming"]}</div>
        </div>
        <div className="positions-summary-card">
          <div className="positions-summary-k">Live Primary</div>
          <div className="positions-summary-v">{stageCounts["live-primary"]}</div>
        </div>
        <div className="positions-summary-card">
          <div className="positions-summary-k">Protected Primary</div>
          <div className="positions-summary-v">{stageCounts["protected-primary"]}</div>
        </div>
        <div className="positions-summary-card">
          <div className="positions-summary-k">Exit Waiting</div>
          <div className="positions-summary-v">{stageCounts["exit-waiting"]}</div>
        </div>
        <div className="positions-summary-card">
          <div className="positions-summary-k">Live Secondaries</div>
          <div className="positions-summary-v">{liveSecondaries}</div>
        </div>
      </div>

      <div className="stage-board">
        {props.slots.length ? (
          POSITION_STAGE_ORDER.map((stageMeta) => {
            const stageSlots = props.slots.filter((slot) => positionStageForSlot(slot) === stageMeta.key);
            if (!stageSlots.length) return null;

            return (
              <section key={stageMeta.key} className="stage-section" aria-label={stageMeta.title}>
                <div className="stage-section-top">
                  <div>
                    <div className="stage-section-title">{stageMeta.title}</div>
                    <div className="stage-section-note">{stageMeta.note}</div>
                  </div>
                  <div className="stage-section-count">{stageSlots.length}</div>
                </div>

                <div className="stage-card-grid">
                  {stageSlots.map((slot) => {
                    const stage = positionStageForSlot(slot);
                    const metrics = positionMetricsForSlot(slot, props.nowMs);

                    return (
                      <button
                        type="button"
                        key={slot.id}
                        className={`stage-card ${positionCardToneClass(slot)}`}
                        onClick={() => props.onOpenSlot(slot.id)}
                      >
                        <div className="stage-card-top">
                          <div>
                            <div className="stage-card-coin">{slotCoin(slot)}</div>
                            <div className={`stage-card-status ${stateClassName(stateLabel(slot))}`}>{readerStatusLabel(slot)}</div>
                          </div>
                          <div className="stage-card-open">Open</div>
                        </div>

                        <div className="stage-card-market">{slot.market ?? `${slotCoin(slot)}/AUD`}</div>

                        <div className="stage-card-metrics">
                          {metrics.map((metric) => (
                            <div key={metric.label} className="stage-card-metric">
                              <div className="stage-card-k">{metric.label}</div>
                              <div className={`stage-card-v ${metric.toneClass ?? ""}`}>{metric.value}</div>
                            </div>
                          ))}
                        </div>

                        {(stage === "waiting-setup" || stage === "reversal-confirming") &&
                          primaryEntryProgressBlock(slot)}

                        <div className="stage-card-summary">{positionStageSummary(slot)}</div>

                        <div className="stage-card-foot">
                          <span>
                            {stage === "waiting-setup" || stage === "reversal-confirming"
                              ? `Last-exit reference ${primaryReferenceLabel(slot)}`
                              : secondaryTradesLabel(slot)}
                          </span>
                          <span>{slotHeartbeatCardLabel(slot, props.nowMs)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
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

const TradingBehaviorPanel = React.memo(function TradingBehaviorPanel(props: {
  meta: PublicMetaResponse | null;
  fixedAllowlist: string[];
  executionMode: string;
}) {
  const allowlistLabel = props.fixedAllowlist.length
    ? props.fixedAllowlist.join(", ")
    : "BTC, ETH, XRP, SOL, DOGE, ADA, LTC, TRX";
  const gates = props.meta?.gates;
  const manager = props.meta?.manager;
  const subslot = manager?.subslot;
  const quoteGuard = props.meta?.runtime?.quoteGuard;

  const secondaryBaseSize =
    subslot?.sizePctOfParent != null && Number.isFinite(subslot.sizePctOfParent)
      ? `${(subslot.sizePctOfParent * 100).toFixed(0)}%`
      : "20%";
  const secondaryForcedCap =
    subslot?.maxForcedSizePct != null && Number.isFinite(subslot.maxForcedSizePct)
      ? `${(subslot.maxForcedSizePct * 100).toFixed(0)}%`
      : "60%";

  return (
    <div className="engine-bay">
      <div className="bay-head">
        <div className="bay-title">Trading Behavior Blueprint</div>
        <div className="bay-note">
          Current fixed-slot machine profile rendered from the {ENGINE_BEHAVIOR_AS_OF} configuration snapshot.
        </div>
      </div>

      <div className="card machine-surface panel-frame engine-telemetry">
        <div className="engine-telemetry-head">
          <div>
            <div className="engine-telemetry-title">How This Version Trades</div>
            <div className="engine-telemetry-note">
              JAL Engine is currently behaving as a live, fixed-universe AUD book. Primaries seek controlled drawdown reversals, secondaries harvest intrahold volatility, and disabled rotation means capital stays inside its slot until a parent fully exits.
            </div>
          </div>
        </div>

        <div className="slot-modal-grid">
          <div>
            <div className="slot-k">Config Snapshot</div>
            <div className="slot-v">{ENGINE_BEHAVIOR_AS_OF}</div>
          </div>
          <div>
            <div className="slot-k">Universe</div>
            <div className="slot-v">{allowlistLabel}</div>
          </div>
          <div>
            <div className="slot-k">Execution</div>
            <div className="slot-v">
              {props.executionMode} | live {yesNo(props.meta?.engine?.liveTradingEnabled)} | writes{" "}
              {yesNo(gates?.writeEnabled)}
            </div>
          </div>
          <div>
            <div className="slot-k">Cadence</div>
            <div className="slot-v">
              market {msToShortLabel(props.meta?.runtime?.marketFreshness?.pollMs as number | null | undefined)} | executor{" "}
              {msToShortLabel(gates?.executorTickMs)} | manager {msToShortLabel(gates?.managerTickMs)} | harvester{" "}
              {msToShortLabel(gates?.harvesterTickMs)}
            </div>
          </div>
          <div>
            <div className="slot-k">Entry Model</div>
            <div className="slot-v">FULL_UNIT | min {moneyAud(10)} | 10 bps fee | ask/bid+fee</div>
          </div>
          <div>
            <div className="slot-k">Re-entry</div>
            <div className="slot-v">
              {manager?.reentry?.mode ?? "EXIT_DROP"} | drop {pctNum(manager?.reentry?.dropPct ?? 0.01)}
            </div>
          </div>
          <div>
            <div className="slot-k">Jrd Secondary</div>
            <div className="slot-v">
              {subslot?.enabled === false ? "OFF" : "ON"} | up to {subslot?.maxPerSlot ?? 8} cycles | base {secondaryBaseSize}
            </div>
          </div>
          <div>
            <div className="slot-k">Secondary Minimums</div>
            <div className="slot-v">
              min {moneyAud(subslot?.minAud ?? 3.5)} | forced cap {secondaryForcedCap}
            </div>
          </div>
          <div>
            <div className="slot-k">Quote Guard</div>
            <div className="slot-v">{quoteGuardLabel(quoteGuard)}</div>
          </div>
          <div>
            <div className="slot-k">Rotation / Top-up</div>
            <div className="slot-v">
              rotation {yesNo(gates?.rotationEnabled)} | executor {yesNo(gates?.rotationExecutorEnabled)} | top-up{" "}
              {yesNo(gates?.topupEnabled)}
            </div>
          </div>
        </div>
      </div>

      <div className="card machine-surface panel-frame engine-telemetry">
        <div className="engine-telemetry-head">
          <div>
            <div className="engine-telemetry-title">Primary Lifecycle</div>
            <div className="engine-telemetry-note">What has to happen before Jrd Primary enters, scales its floor, and exits.</div>
          </div>
        </div>

        <div className="engine-upgrade-grid">
          {PRIMARY_BEHAVIOR_CARDS.map((card) => (
            <div key={card.title} className="engine-upgrade-item">
              <div className="engine-upgrade-k">{card.title}</div>
              <div className="engine-upgrade-v">{card.summary}</div>
              <div className="engine-upgrade-sub">{card.detail}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card machine-surface panel-frame engine-telemetry">
        <div className="engine-telemetry-head">
          <div>
            <div className="engine-telemetry-title">Jrd Secondary Playbook</div>
            <div className="engine-telemetry-note">How the intrahold tactical layer decides when to engage and when it is finally allowed to leave.</div>
          </div>
        </div>

        <div className="engine-upgrade-grid">
          {SECONDARY_BEHAVIOR_CARDS.map((card) => (
            <div key={card.title} className="engine-upgrade-item">
              <div className="engine-upgrade-k">{card.title}</div>
              <div className="engine-upgrade-v">{card.summary}</div>
              <div className="engine-upgrade-sub">{card.detail}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card machine-surface panel-frame engine-telemetry">
        <div className="engine-telemetry-head">
          <div>
            <div className="engine-telemetry-title">Coin-By-Coin Profiles</div>
            <div className="engine-telemetry-note">Each slot shares the same machine architecture, but the thresholds below change the personality of the trade.</div>
          </div>
        </div>

        <div className="engine-upgrade-grid">
          {ENGINE_COIN_BEHAVIOR_PROFILES.map((profile) => (
            <div key={profile.coin} className="engine-upgrade-item">
              <div className="engine-upgrade-k">{profile.coin}</div>
              <div className="engine-upgrade-v">{profile.personality}</div>
              <div className="engine-upgrade-lines">
                <div className="engine-upgrade-line">
                  <span className="engine-upgrade-line-label">Entry</span>
                  <span className="engine-upgrade-line-value">{profile.executor}</span>
                </div>
                <div className="engine-upgrade-line">
                  <span className="engine-upgrade-line-label">Primary</span>
                  <span className="engine-upgrade-line-value">{profile.primary}</span>
                </div>
                <div className="engine-upgrade-line">
                  <span className="engine-upgrade-line-label">Secondary</span>
                  <span className="engine-upgrade-line-value">{profile.secondary}</span>
                </div>
              </div>
              <div className="engine-upgrade-sub">{profile.safeguards}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card machine-surface panel-frame engine-telemetry">
        <div className="engine-telemetry-head">
          <div>
            <div className="engine-telemetry-title">Guardrails And Disabled Systems</div>
            <div className="engine-telemetry-note">The final layer is not signal generation. It is permissioning, quote validation, and deciding what this engine is not allowed to do.</div>
          </div>
        </div>

        <div className="engine-upgrade-grid">
          {ENGINE_GUARDRAIL_CARDS.map((card) => (
            <div key={card.title} className="engine-upgrade-item">
              <div className="engine-upgrade-k">{card.title}</div>
              <div className="engine-upgrade-v">{card.summary}</div>
              <div className="engine-upgrade-sub">{card.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

const AboutPanel = React.memo(function AboutPanel(props: {
  aboutOpen: boolean;
  setAboutOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div className="engine-about" aria-label="About JAL Engine">
      <button
        type="button"
        className="button ghost engine-about-btn"
        onClick={() => props.setAboutOpen((v) => !v)}
        aria-expanded={props.aboutOpen}
        aria-controls="engine-about"
      >
        <span>About JAL Engine</span>
        <span className="engine-about-toggle">{props.aboutOpen ? "-" : "+"}</span>
      </button>

      {props.aboutOpen ? (
        <div id="engine-about" className="card machine-surface panel-frame engine-about-panel">
          <div className="engine-about-title">Jeroid JRD Ledger</div>

          <p>
            This page presents Jeremy Aaron Lugg&apos;s own engine in public-facing language. It is a
            read-only telemetry surface, not a public trading service. Each Jeroid slot belongs to
            one fixed market identity and independently waits, deploys, holds, exits, and re-enters
            under the same rules.
          </p>
          <p>
            Where exchange-connected activity appears here, it relates to Jeremy Aaron Lugg&apos;s own
            account and not to customer accounts. This page is not personal advice, a signal
            service, or an invitation for visitors to mirror trades.
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
            <li>Jrd Secondary net results remain separate until merge on Jrd Primary reset.</li>
            <li>Window harvest reflects recent realized event flow only.</li>
            <li>External transfers are excluded from displayed totals.</li>
            <li>The UI is organized for clarity first and diagnostics second.</li>
          </ul>

          <div className="engine-about-h">Market Condition Key</div>
          <ul>
            <li><strong>Uptrend</strong>: Price structure is rising and momentum conditions support continuation.</li>
            <li><strong>Downtrend</strong>: Price structure is falling and rebounds are treated more cautiously.</li>
            <li><strong>Consolidation Bull</strong>: Price is compressing in a range with a bullish lean or recovery bias.</li>
            <li><strong>Consolidation Bear</strong>: Price is compressing in a range with a bearish lean or weakness bias.</li>
            <li><strong>Chop</strong>: Price action is noisy, inconsistent, and often too messy for tactical entries.</li>
          </ul>

          <div className="engine-about-h">Trade Type Key</div>
          <ul>
            <li><strong>Jrd Primary</strong>: The main fixed-slot position for that coin, entered and managed by the core engine rules.</li>
            <li><strong>Jrd Secondary</strong>: A smaller tactical trade opened inside a live Jrd Primary hold window to harvest rebounds.</li>
            <li><strong>Rotation</strong>: A separate capital-transfer layer that can move wallet value between coins when enabled.</li>
            <li><strong>Paper / Sim</strong>: Orders are evaluated and tracked without live exchange execution.</li>
            <li><strong>Live</strong>: Orders are sent to the exchange and reconciled against real fills and balances.</li>
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
  subslotConfig: ManagerStatus["subslot"] | null | undefined;
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
                <span className={stateClassName(stateLabel(slot))}>{readerStatusLabel(slot)}</span> |{" "}
                <span className={regimeToneClass(slot)}>{regimeLabel(slot)}</span>
              </div>
            </div>

            <div className="slot-modal-meta">
              <span className="slot-modal-chip">Esc to close</span>
              <span className="slot-modal-chip">{nextActionLabel(slot)}</span>
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
              <div className="slot-k">Status</div>
              <div className={`slot-v ${stateClassName(stateLabel(slot))}`}>{readerStatusLabel(slot)}</div>
            </div>
            <div className="slot-modal-strip-item">
              <div className="slot-k">Live Net</div>
              <div className="slot-v">{pctNum(liveParentNetPct(slot))}</div>
            </div>
            <div className="slot-modal-strip-item">
              <div className="slot-k">Live Gross</div>
              <div className="slot-v">{pctNum(liveParentGrossPct(slot))}</div>
            </div>
            <div className="slot-modal-strip-item">
              <div className="slot-k">Lifetime Net</div>
              <div className="slot-v">{pctNum(primaryTotalGainPct(slot))}</div>
            </div>
          </div>

          <CollapsibleBlock title="Overview" defaultOpen>
            <div className="slot-section">Reader Summary</div>

            <div className="slot-modal-grid">
              <div>
                <div className="slot-k">Primary Position</div>
                <div className="slot-v">{slot.id}</div>
              </div>
              <div>
                <div className="slot-k">Status</div>
                <div className="slot-v">{readerStatusLabel(slot)}</div>
              </div>
              <div>
                <div className="slot-k">Next Action</div>
                <div className="slot-v">{nextActionLabel(slot)}</div>
              </div>
              <div>
                <div className="slot-k">Protection</div>
                <div className="slot-v">{primaryProtectionLabel(slot)}</div>
              </div>
              <div>
                <div className="slot-k">Secondary Trades</div>
                <div className="slot-v">{secondaryTradesLabel(slot)}</div>
              </div>
              <div>
  <div className="slot-k">Reader Note</div>
  <div className="slot-v">{liveParentAnalysis(slot, nowMs)}</div>
</div>
            </div>
          </CollapsibleBlock>

          <CollapsibleBlock title="Primary Position" defaultOpen>
          <div className="slot-section">Core Metrics</div>

            <div className="slot-section">Primary Rail</div>
            <div className="primary-rail-grid">
              <div className={`primary-rail-item ${primaryTrailToneClass(slot)}`}>
                <div className="slot-k">Exit Floor</div>
                <div className="slot-v">{primaryExitFloorLabel(slot)}</div>
              </div>
              <div className={`primary-rail-item ${primaryTrailToneClass(slot)}`}>
                <div className="slot-k">Primary Rail</div>
                <div className="slot-v">{primaryTrailLabel(slot)}</div>
              </div>
              <div className="primary-rail-item">
                <div className="slot-k">Trail Floor</div>
                <div className="slot-v">{primaryTrailFloorLabel(slot)}</div>
              </div>
              <div className="primary-rail-item">
                <div className="slot-k">Trail Peak Net</div>
                <div className="slot-v">{primaryTrailPeakLabel(slot)}</div>
              </div>
            </div>

            <div className="slot-section">Adaptive Trail Inputs</div>
            <div className="slot-modal-grid">
              <div>
                <div className="slot-k">Resolved Arm</div>
                <div className="slot-v">{primaryTrailArmLabel(slot)}</div>
              </div>
              <div>
                <div className="slot-k">Resolved Keep</div>
                <div className="slot-v">{primaryTrailRetainLabel(slot)}</div>
              </div>
              <div>
                <div className="slot-k">Adaptive Volatility</div>
                <div className="slot-v">{primaryTrailVolatilityLabel(slot)}</div>
              </div>
              <div>
                <div className="slot-k">Volatility Inputs</div>
                <div className="slot-v">{primaryTrailVolatilityInputsLabel(slot)}</div>
              </div>
            </div>

            <div className="slot-modal-grid">
              <div><div className="slot-k">Capital Lane</div><div className="slot-v">{moneyAud(primaryCapitalLaneAud(slot))}</div></div>
              <div><div className="slot-k">Live Deployed</div><div className="slot-v">{moneyAud(primaryDeployedUnitAud(slot))}</div></div>
              <div><div className="slot-k">Cycles</div><div className="slot-v">{slot.cycles ?? 0}</div></div>
              <div><div className="slot-k">{String(slot.state || "").toUpperCase() === "WAITING_ENTRY" ? "Reference From Last Exit" : "Entry"}</div><div className="slot-v">{effectiveEntryLabel(slot)}</div></div>
              <div><div className="slot-k">Now</div><div className="slot-v">{effectiveNowLabel(slot)}</div></div>
              <div><div className="slot-k">Live Gross</div><div className="slot-v">{pctNum(liveParentGrossPct(slot))}</div></div>
              <div><div className="slot-k">Live Net</div><div className="slot-v">{pctNum(liveParentNetPct(slot))}</div></div>
              <div><div className="slot-k">Lifetime Net</div><div className="slot-v">{pctNum(primaryTotalGainPct(slot))}</div></div>
              <div><div className="slot-k">Level</div><div className="slot-v">{slot.level ? `LVL${slot.level}` : "-"}</div></div>
              <div><div className="slot-k">Protection</div><div className="slot-v">{primaryProtectionLabel(slot)}</div></div>
              <div><div className="slot-k">Spread</div><div className="slot-v">{pctNum(slot.nowSpreadPct)}</div></div>
              <div><div className="slot-k">Drawdown</div><div className="slot-v">{pctNum(slot.drawdownPct)}</div></div>
              <div><div className="slot-k">Secondary Trades</div><div className="slot-v">{secondaryTradesLabel(slot)}</div></div>
              <div><div className="slot-k">Reference From Last Exit</div><div className="slot-v">{fmt(slot.reentryTargetMid)}</div></div>
              <div><div className="slot-k">Exit reason</div><div className="slot-v">{slot.exitReason ?? "-"}</div></div>
              <div><div className="slot-k">Created</div><div className="slot-v">{ageLabel(nowMs - slot.createdAt)}</div></div>
              <div><div className="slot-k">Updated</div><div className="slot-v">{slotHeartbeatLabel(slot, nowMs)}</div></div>
            </div>
          </CollapsibleBlock>

          <CollapsibleBlock title="Secondary Trades" defaultOpen>
            <div className="slot-section">Secondary Summary</div>

              <div className="slot-modal-grid">
              <div><div className="slot-k">Total Secondary Trades</div><div className="slot-v">{getSecondaryRows(slot).length}</div></div>
              <div><div className="slot-k">Active</div><div className="slot-v">{getActiveSecondaryRows(slot).length}</div></div>
              <div><div className="slot-k">Pending Entry</div><div className="slot-v">{hasPendingSubslotBuys(slot) ? "YES" : "NO"}</div></div>
              <div><div className="slot-k">Pending Exit</div><div className="slot-v">{hasPendingSubslotSells(slot) ? "YES" : "NO"}</div></div>
              <div><div className="slot-k">Open Secondary Trades</div><div className="slot-v">{getSubslotOpenCount(slot)}</div></div>
              <div><div className="slot-k">Closed Secondary Trades</div><div className="slot-v">{getClosedSubslotCount(slot)}</div></div>
              <div><div className="slot-k">Total Net Gain (AUD)</div><div className="slot-v">{moneyAud(secondaryTotalGainAud(slot))}</div></div>
              {getSecondaryRows(slot).length ? (
                <>
                  <div><div className="slot-k">Latest Secondary Trade</div><div className={`slot-v slot-subslot ${primarySubslotToneClass(slot)}`}>{primarySubslotDecisionLabel(slot)}</div></div>
                    <div><div className="slot-k">Latest Trigger Band</div><div className="slot-v">{getPrimarySecondarySnapshot(slot) ? subslotTriggerBandLabel(getPrimarySecondarySnapshot(slot) as SubslotRow) : "-"}</div></div>
                    <div><div className="slot-k">Latest Trigger Summary</div><div className="slot-v">{getPrimarySecondarySnapshot(slot) ? subslotTriggerSummary(getPrimarySecondarySnapshot(slot) as SubslotRow) : "-"}</div></div>
                    <div><div className="slot-k">Latest To Live</div><div className="slot-v">{getPrimarySecondarySnapshot(slot) ? subslotLiveCounterLabel(getPrimarySecondarySnapshot(slot) as SubslotRow, slot, props.subslotConfig) : "-"}</div></div>
                    <div><div className="slot-k">Latest Live Now</div><div className="slot-v">{primarySubslotLiveNowLabel(slot)}</div></div>
                    <div><div className="slot-k">Latest Updated</div><div className="slot-v">{primarySubslotHeartbeatLabel(slot, nowMs)}</div></div>
                  </>
              ) : null}
            </div>

            {getSecondaryRows(slot).length ? (
              <>
                <div className="slot-section">Latest Secondary Trades</div>
                <div><div className="slot-k">Live Analysis</div><div className="slot-v">{primaryLiveSubslotAnalysis(slot, nowMs)}</div></div>

              <div className="secondary-list subslot-list">
                {getSecondaryRows(slot).map((subslot, index) => (
                  <div key={subslot.subslotId ?? `${slot.id}-modal-subslot-${index}`} className="secondary-card subslot-card">
                    <div className="slot-section">
                      Secondary Trade #{subslot.subslotSequence ?? index + 1} | {subslot.subslotId ?? "legacy"} | {subslotStateBadgeLabel(subslot)}
                    </div>

                    <div className="slot-modal-grid secondary-grid">
                        <div><div className="slot-k">Trigger Band</div><div className="slot-v">{subslotTriggerBandLabel(subslot)}</div></div>
                        <div><div className="slot-k">Trigger Level</div><div className="slot-v">{pctNum(subslot.subslotTriggerParentNetPct)}</div></div>
                        <div><div className="slot-k">To Live</div><div className="slot-v">{subslotLiveCounterLabel(subslot, slot, props.subslotConfig)}</div></div>
                        <div><div className="slot-k">Parent Net @ Open</div><div className="slot-v">{pctNum(subslot.subslotEntryParentNetPct)}</div></div>
                        <div><div className="slot-k">State</div><div className="slot-v">{subslot.subslotState ?? "-"}</div></div>
                        <div><div className="slot-k">Mode</div><div className="slot-v">{subslot.subslotEntryMode ?? "-"}</div></div>
                      <div><div className="slot-k">Signal</div><div className="slot-v">{subslot.subslotSignalState ?? "-"}</div></div>
                      <div><div className="slot-k">Confirm Ticks</div><div className="slot-v">{subslot.subslotConfirmTicks ?? "-"}</div></div>
                      <div><div className="slot-k">Entry Mid</div><div className="slot-v">{fmt(subslot.subslotEntryMid)}</div></div>
                      <div><div className="slot-k">Live Now</div><div className="slot-v">{subslotLiveNowLabel(subslot, slot)}</div></div>
                      <div><div className="slot-k">Gross</div><div className="slot-v">{pctNum(subslot.subslotGrossPct)}</div></div>
                      <div><div className="slot-k">Live Net</div><div className="slot-v">{pctNum(subslot.subslotNetPct)}</div></div>
                      <div><div className="slot-k">Last Result (AUD)</div><div className="slot-v">{moneyAud(subslot.subslotProfitAud)}</div></div>
                      <div><div className="slot-k">Last Result (%)</div><div className="slot-v">{pctNum(subslot.subslotProfitPct)}</div></div>
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
              <div className="slot-v">No secondary trade records available.</div>
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
            primaryLastRealizedProfitAud(slot) != null ||
            primaryLastRealizedNetPct(slot) != null ||
            primaryTotalGainAud(slot) != null ||
            secondaryTotalGainAud(slot) != null) && (
            <CollapsibleBlock title="Realized Exit Context" defaultOpen={false}>
              <div className="slot-modal-grid">
                <div><div className="slot-k">Entry AUD</div><div className="slot-v">{moneyAud(slot.entryAud)}</div></div>
                <div><div className="slot-k">Exit AUD</div><div className="slot-v">{moneyAud(slot.exitAud)}</div></div>
                <div><div className="slot-k">Last Primary Exit (AUD)</div><div className="slot-v">{moneyAud(primaryLastRealizedProfitAud(slot))}</div></div>
                <div><div className="slot-k">Last Primary Exit (%)</div><div className="slot-v">{pctNum(primaryLastRealizedNetPct(slot))}</div></div>
                <div><div className="slot-k">Primary Realized Total</div><div className="slot-v">{moneyAud(primaryTotalGainAud(slot))}</div></div>
                <div><div className="slot-k">Secondary Realized Total</div><div className="slot-v">{moneyAud(secondaryTotalGainAud(slot))}</div></div>
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
  const manager = props.meta?.manager;
  const telemetry = runtime?.telemetry;
  const compression = runtime?.eventCompression;
  const rotationSummary = runtime?.rotationDashboard?.summary ?? runtime?.rotationDashboard;
  const snapshot = props.meta?.market?.snapshot ?? null;
  const serverGate = telemetry?.lastWorkerAction?.server;
  const holding = manager?.holding;
  const levelTrails = holding?.levelTrails;
  const coinOverrideCoins = managerCoinOverrideCoins(holding?.coinOverrides);
  const primaryPerf = manager?.primaryPerf;
  const costAwareEntry = manager?.subslot?.costAwareEntry;

  return (
    <div className="engine-bay">
      <div className="bay-head">
        <div className="bay-title">Advanced System Summary</div>
        <div className="bay-note">Engineering detail behind the simpler reader dashboard.</div>
      </div>

      <div className="card machine-surface panel-frame engine-telemetry">
        <div className="engine-telemetry-head">
          <div>
            <div className="engine-telemetry-title">Machine State</div>
            <div className="engine-telemetry-note">What the fixed-slot engine is doing right now.</div>
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
            <div className="engine-telemetry-title">Recent Upgrades</div>
            <div className="engine-telemetry-note">Primary hold rails, adaptive trail inputs, primary memory, and secondary cost gating now surfaced directly in the dapp.</div>
          </div>
        </div>

        <div className="engine-upgrade-grid">
          <div className="engine-upgrade-item">
            <div className="engine-upgrade-k">Primary Ladder</div>
            <div className="engine-upgrade-lines">
              <div className="engine-upgrade-line">
                <span className="engine-upgrade-line-label">LVL1</span>
                <span className="engine-upgrade-line-value">{pctNum(holding?.lvl1Pct)} arm / {pctNum(holding?.lock1Pct)} lock</span>
              </div>
              <div className="engine-upgrade-line">
                <span className="engine-upgrade-line-label">LVL2</span>
                <span className="engine-upgrade-line-value">{pctNum(holding?.lvl2Pct)} arm / {pctNum(holding?.lock2Pct)} lock</span>
              </div>
              <div className="engine-upgrade-line">
                <span className="engine-upgrade-line-label">LVL3</span>
                <span className="engine-upgrade-line-value">{pctNum(holding?.lvl3Pct)} arm / {pctNum(holding?.lock3Pct)} lock</span>
              </div>
            </div>
            <div className="engine-upgrade-v">
              LVL4 {pctNum(holding?.lvl4Pct)} | peak trail {pctNum(holding?.lvl4TrailPct)}
            </div>
            <div className="engine-upgrade-sub">Levels 1-3 still defend their static lock floors before any additive trail takes over.</div>
          </div>

          <div className="engine-upgrade-item">
            <div className="engine-upgrade-k">Primary Level Trails</div>
            <div className="engine-upgrade-lines">
              <div className="engine-upgrade-line">
                <span className="engine-upgrade-line-label">LVL1</span>
                <span className="engine-upgrade-line-value">{managerLevelTrailLabel(levelTrails?.lvl1)}</span>
              </div>
              <div className="engine-upgrade-line">
                <span className="engine-upgrade-line-label">LVL2</span>
                <span className="engine-upgrade-line-value">{managerLevelTrailLabel(levelTrails?.lvl2)}</span>
              </div>
              <div className="engine-upgrade-line">
                <span className="engine-upgrade-line-label">LVL3</span>
                <span className="engine-upgrade-line-value">{managerLevelTrailLabel(levelTrails?.lvl3)}</span>
              </div>
            </div>
            <div className="engine-upgrade-v">
              {managerVolatilityModeLabel(levelTrails?.volatility, holding?.coinOverrides)}
            </div>
            {coinOverrideCoins.length ? (
              <div className="engine-upgrade-chiplist" aria-label="Coin trail overrides">
                {coinOverrideCoins.map((coin) => (
                  <span key={coin} className="engine-upgrade-chip">{coin}</span>
                ))}
              </div>
            ) : null}
            <div className="engine-upgrade-sub">
              {managerVolatilityDetailLabel(levelTrails?.volatility, holding?.coinOverrides)}
            </div>
          </div>

          <div className="engine-upgrade-item">
            <div className="engine-upgrade-k">Primary Performance Memory</div>
            <div className="engine-upgrade-v">
              {primaryPerf?.enabled ? "ON" : "OFF"} | {primaryPerf?.windowTrades ?? "-"} trades | streak {primaryPerf?.disableAfterLossStreak ?? "-"}
            </div>
            <div className="engine-upgrade-sub">
              Cooldown {primaryPerf?.cooldownMs != null ? msToCountdown(primaryPerf.cooldownMs) : "-"} | Half-size on negative EV {primaryPerf?.negativeEvHalfSize ? "YES" : "NO"}
            </div>
          </div>

          <div className="engine-upgrade-item">
            <div className="engine-upgrade-k">Secondary Cost Gate</div>
            <div className="engine-upgrade-v">
              {costAwareEntry?.enabled ? "ON" : "OFF"} | net {pctNum(costAwareEntry?.minNetAfterCostPct)} | slip {pctNum(costAwareEntry?.slippageBufferPct)}
            </div>
            <div className="engine-upgrade-sub">
              Spread multiplier {costAwareEntry?.spreadMult != null && Number.isFinite(costAwareEntry.spreadMult) ? `${costAwareEntry.spreadMult.toFixed(2)}x` : "-"}
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

const RotationPolicyPanel = React.memo(function RotationPolicyPanel(props: {
  meta: PublicMetaResponse | null;
  capital: PublicCapitalResponse | null;
  nowMs: number;
}) {
  const dashboard = props.meta?.runtime?.rotationDashboard;
  const summary = dashboard?.summary ?? dashboard;
  const recommendation = dashboard?.recommendation ?? null;
  const executor = dashboard?.executor ?? null;
  const reservations = Array.isArray(dashboard?.reservations) ? dashboard.reservations : [];
  const outCandidates = Array.isArray(dashboard?.candidates?.out)
    ? dashboard.candidates.out.slice(0, 4)
    : [];
  const inCandidates = Array.isArray(dashboard?.candidates?.in)
    ? dashboard.candidates.in.slice(0, 4)
    : [];

  const policyState = !summary?.policyEnabled
    ? "OFF"
    : recommendation?.recommend
    ? "RECOMMENDING"
    : recommendation?.blockedReason || summary?.blockedReason
    ? "BLOCKED"
    : summary?.policyRunning
    ? "SCANNING"
    : "IDLE";

  const executorAction = executor?.lastAction?.type
    ? enumLabel(executor.lastAction.type)
    : executor?.lastAction?.reason
    ? reasonLabel(executor.lastAction.reason)
    : "-";

  return (
    <div className="engine-bay">
      <div className="bay-head">
        <div className="bay-title">Rotation Policy</div>
        <div className="bay-note">Read-only view of the current recommendation, pair reservations, and executor handoff state.</div>
      </div>

      <div className="card machine-surface panel-frame engine-telemetry capital-panel">
        <div className="engine-telemetry-head">
          <div>
            <div className="engine-telemetry-title">Policy & Executor Surface</div>
            <div className="engine-telemetry-note">
              Policy {policyState} | Executor {rotationModeLabel(props.capital)} | Reservations {summary?.activeReservations ?? 0}
            </div>
          </div>
        </div>

        <div className="secondary-summary capital-summary">
          <div className="secondary-grid capital-summary-grid">
            <div><div className="slot-k">Policy State</div><div className="slot-v">{policyState}</div></div>
            <div><div className="slot-k">Executor Mode</div><div className="slot-v">{rotationModeLabel(props.capital)}</div></div>
            <div><div className="slot-k">Recommend</div><div className="slot-v">{yesNo(recommendation?.recommend)}</div></div>
            <div><div className="slot-k">Net Edge</div><div className="slot-v">{fmt(recommendation?.edgeScore ?? summary?.edgeScore)}</div></div>
            <div><div className="slot-k">Raw Edge</div><div className="slot-v">{fmt(recommendation?.rawEdgeScore)}</div></div>
            <div><div className="slot-k">Blocked</div><div className="slot-v">{reasonLabel(recommendation?.blockedReason ?? summary?.blockedReason)}</div></div>
            <div><div className="slot-k">Rotation Reason</div><div className="slot-v">{reasonLabel(recommendation?.rotationReason)}</div></div>
            <div><div className="slot-k">Reservation Stages</div><div className="slot-v">{summarizeRecordTop(summary?.reservationStages, 4)}</div></div>
            <div><div className="slot-k">Eligible Out</div><div className="slot-v">{summary?.eligibleOutCandidates ?? 0}</div></div>
            <div><div className="slot-k">Eligible In</div><div className="slot-v">{summary?.eligibleInCandidates ?? 0}</div></div>
            <div><div className="slot-k">Executor Action</div><div className="slot-v">{executorAction}</div></div>
            <div><div className="slot-k">Action Age</div><div className="slot-v">{fmtTimestampAge(executor?.lastActionAt, props.nowMs)}</div></div>
          </div>
        </div>

        <div className="slot-section">Current Decision</div>
        {recommendation?.bestOut || recommendation?.bestIn ? (
          <div className="secondary-list">
            <div className="secondary-card">
              <div className="secondary-grid capital-coin-grid">
                <div><div className="slot-k">Best Out</div><div className="slot-v">{recommendation?.bestOut?.coin ?? recommendation?.bestOut?.slotId ?? "-"}</div></div>
                <div><div className="slot-k">Out Slot</div><div className="slot-v">{recommendation?.bestOut?.slotId ?? "-"}</div></div>
                <div><div className="slot-k">Out State</div><div className="slot-v">{recommendation?.bestOut?.state ?? "-"}</div></div>
                <div><div className="slot-k">Out Score</div><div className="slot-v">{fmt(recommendation?.bestOut?.score)}</div></div>
                <div><div className="slot-k">Source Type</div><div className="slot-v">{recommendation?.bestOut?.sourceType ?? "-"}</div></div>
                <div><div className="slot-k">Best In</div><div className="slot-v">{recommendation?.bestIn?.coin ?? recommendation?.bestIn?.slotId ?? "-"}</div></div>
                <div><div className="slot-k">In Slot</div><div className="slot-v">{recommendation?.bestIn?.slotId ?? "-"}</div></div>
                <div><div className="slot-k">In State</div><div className="slot-v">{recommendation?.bestIn?.state ?? "-"}</div></div>
                <div><div className="slot-k">In Score</div><div className="slot-v">{fmt(recommendation?.bestIn?.score)}</div></div>
                <div><div className="slot-k">Last Pair</div><div className="slot-v">{executor?.lastPair?.outCoin ?? executor?.lastPair?.outSlotId ?? "-"} to {executor?.lastPair?.inCoin ?? executor?.lastPair?.inSlotId ?? "-"}</div></div>
                <div><div className="slot-k">Last Pair Reservation</div><div className="slot-v">{executor?.lastPair?.reservationId ?? "-"}</div></div>
                <div><div className="slot-k">Last Pair Edge</div><div className="slot-v">{fmt(executor?.lastPair?.edgeScore)}</div></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="ledger-empty">
            {summary?.policyEnabled
              ? `No active recommendation is selected right now. ${reasonLabel(recommendation?.blockedReason ?? summary?.blockedReason)}`
              : "Rotation policy is currently disabled."}
          </div>
        )}

        <div className="slot-section">Active Reservations</div>
        {reservations.length ? (
          <div className="secondary-list">
            {reservations.map((reservation) => (
              <div key={reservation.reservationId ?? `${reservation.out?.slotId ?? "out"}-${reservation.in?.slotId ?? "in"}`} className="secondary-card">
                <div className="secondary-grid capital-coin-grid">
                  <div><div className="slot-k">Reservation</div><div className="slot-v">{reservation.reservationId ?? "-"}</div></div>
                  <div><div className="slot-k">Stages</div><div className="slot-v">{reservation.stages?.join(" | ") || "-"}</div></div>
                  <div><div className="slot-k">Updated</div><div className="slot-v">{fmtTimestampAge(reservation.updatedAt, props.nowMs)}</div></div>
                  <div><div className="slot-k">Out</div><div className="slot-v">{reservation.out?.coin ?? reservation.out?.slotId ?? "-"}</div></div>
                  <div><div className="slot-k">Out State</div><div className="slot-v">{reservation.out?.state ?? "-"}</div></div>
                  <div><div className="slot-k">Out Stage</div><div className="slot-v">{reservation.out?.stage ?? "-"}</div></div>
                  <div><div className="slot-k">In</div><div className="slot-v">{reservation.in?.coin ?? reservation.in?.slotId ?? "-"}</div></div>
                  <div><div className="slot-k">In State</div><div className="slot-v">{reservation.in?.state ?? "-"}</div></div>
                  <div><div className="slot-k">In Stage</div><div className="slot-v">{reservation.in?.stage ?? "-"}</div></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ledger-empty">No paired reservations are active right now.</div>
        )}

        <div className="slot-section">Top Rotation Candidates</div>
        {outCandidates.length || inCandidates.length ? (
          <div className="secondary-list">
            {outCandidates.map((candidate) => (
              <div key={`rotation-out-${candidate.slotId ?? candidate.coin ?? "candidate"}`} className="secondary-card">
                <div className="secondary-grid capital-coin-grid">
                  <div><div className="slot-k">Out Coin</div><div className="slot-v">{candidate.coin ?? "-"}</div></div>
                  <div><div className="slot-k">Slot</div><div className="slot-v">{candidate.slotId ?? "-"}</div></div>
                  <div><div className="slot-k">State</div><div className="slot-v">{candidate.state ?? "-"}</div></div>
                  <div><div className="slot-k">Eligible</div><div className="slot-v">{yesNo(candidate.eligible)}</div></div>
                  <div><div className="slot-k">Score</div><div className="slot-v">{fmt(candidate.score)}</div></div>
                  <div><div className="slot-k">Edge</div><div className="slot-v">{fmt(candidate.edgeScore)}</div></div>
                  <div><div className="slot-k">Source Type</div><div className="slot-v">{candidate.sourceType ?? "-"}</div></div>
                  <div><div className="slot-k">Target</div><div className="slot-v">{candidate.targetCoin ?? candidate.targetSlotId ?? "-"}</div></div>
                  <div><div className="slot-k">Wallet Ready</div><div className="slot-v">{yesNo(candidate.walletReady)}</div></div>
                  <div><div className="slot-k">Blocked</div><div className="slot-v">{reasonLabel(candidate.blockedReason ?? candidate.walletBlockedReason)}</div></div>
                  <div><div className="slot-k">Reason</div><div className="slot-v">{reasonLabel(candidate.reason)}</div></div>
                </div>
              </div>
            ))}
            {inCandidates.map((candidate) => (
              <div key={`rotation-in-${candidate.slotId ?? candidate.coin ?? "candidate"}`} className="secondary-card">
                <div className="secondary-grid capital-coin-grid">
                  <div><div className="slot-k">In Coin</div><div className="slot-v">{candidate.coin ?? "-"}</div></div>
                  <div><div className="slot-k">Slot</div><div className="slot-v">{candidate.slotId ?? "-"}</div></div>
                  <div><div className="slot-k">Eligible</div><div className="slot-v">{yesNo(candidate.eligible)}</div></div>
                  <div><div className="slot-k">Score</div><div className="slot-v">{fmt(candidate.score)}</div></div>
                  <div><div className="slot-k">Edge</div><div className="slot-v">{fmt(candidate.edgeScore)}</div></div>
                  <div><div className="slot-k">Source Slot</div><div className="slot-v">{candidate.sourceSlotId ?? "-"}</div></div>
                  <div><div className="slot-k">Executor Eligible</div><div className="slot-v">{yesNo(candidate.targetExecutorEligible)}</div></div>
                  <div><div className="slot-k">Blocked</div><div className="slot-v">{reasonLabel(candidate.blockedReason)}</div></div>
                  <div><div className="slot-k">Reason</div><div className="slot-v">{reasonLabel(candidate.reason)}</div></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ledger-empty">No rotation candidates are currently surfaced by the public dashboard.</div>
        )}
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
        <div className="bay-title">Capital & Rotation</div>
        <div className="bay-note">Treasury balance, wallet readiness, and movement policy in one place.</div>
      </div>

      <div className="card machine-surface panel-frame engine-telemetry capital-panel">
        <div className="engine-telemetry-head">
          <div>
            <div className="engine-telemetry-title">Personal Capital Snapshot</div>
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

  const { rowsAll, rowsAud, snap, meta, capital, slotRows, events, err, refresh } = useEngineData(BASE);

  const [feed, setFeed] = useState<Feed>("aud");
  const [sortKey, setSortKey] = useState<SortKey>("coin");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("simple");
  const [section, setSection] = useState<Section>("focus");
  const [eventsOpen, setEventsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const fixedAllowlist = useMemo(() => meta?.fixedSlots?.allowlist ?? [], [meta?.fixedSlots?.allowlist]);
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

  return (
    <main className="home-shell engine-shell" data-view={view} aria-label="JAL Engine">
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
            </div>

            <div className="engine-divider" aria-hidden="true">
              <div className="engine-divider-line" />
              <div className="engine-divider-label">Engine Ledger</div>
              <div className="engine-divider-line" />
            </div>

            <div className="engine-zone" data-zone="ledger">
              <div className="engine-section-tabs" aria-label="Engine sections">
                <button
                  type="button"
                  className={`engine-section-tab ${section === "focus" ? "active" : ""}`}
                  onClick={() => setSection("focus")}
                >
                  Dashboard
                </button>

                <button
                  type="button"
                  className={`engine-section-tab ${section === "behavior" ? "active" : ""}`}
                  onClick={() => setSection("behavior")}
                >
                  Behavior
                </button>

                <button
                  type="button"
                  className={`engine-section-tab ${section === "slots" ? "active" : ""}`}
                  onClick={() => setSection("slots")}
                >
                  Positions
                </button>

                <button
                  type="button"
                  className={`engine-section-tab ${section === "capital" ? "active" : ""}`}
                  onClick={() => setSection("capital")}
                >
                  Capital
                </button>

                <button
                  type="button"
                  className={`engine-section-tab ${section === "market" ? "active" : ""}`}
                  onClick={() => setSection("market")}
                >
                  Market
                </button>

                <button
                  type="button"
                  className={`engine-section-tab ${section === "events" ? "active" : ""}`}
                  onClick={() => setSection("events")}
                >
                  Activity
                </button>

                <button
                  type="button"
                  className={`engine-section-tab ${section === "about" ? "active" : ""}`}
                  onClick={() => setSection("about")}
                >
                  Advanced
                </button>
              </div>

              {section === "focus" ? (
                <OverviewTable
                  slots={filteredSlots}
                  holding={meta?.manager?.holding}
                  subslotConfig={meta?.manager?.subslot}
                  onOpenSlot={setSelectedSlotId}
                  nowMs={nowMs}
                />
              ) : null}

              {section === "behavior" ? (
                <TradingBehaviorPanel
                  meta={meta}
                  fixedAllowlist={fixedAllowlist}
                  executionMode={executionMode}
                />
              ) : null}

              {section === "slots" ? (
                <LedgerTable
                  slots={filteredSlots}
                  nowMs={nowMs}
                  onOpenSlot={setSelectedSlotId}
                  fixedPresent={fixedPresent}
                  fixedMissing={fixedMissing}
                />
              ) : null}

              {section === "capital" ? (
                <div className="engine-section-grid engine-section-grid--capital" aria-label="Capital and system">
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
                  <RotationPolicyPanel meta={meta} capital={capital} nowMs={nowMs} />
                  <CapitalMobilityPanel capital={capital} nowMs={nowMs} />
                </div>
              ) : null}

              {section === "market" ? (
                <div className="engine-section-grid" aria-label="Market section">
                  <MarketSurface rows={filteredMarketRows} />
                </div>
              ) : null}

              {section === "events" ? (
                <EventsPanel events={events} eventsOpen={eventsOpen} setEventsOpen={setEventsOpen} />
              ) : null}

              {section === "about" ? (
                <AboutPanel aboutOpen={aboutOpen} setAboutOpen={setAboutOpen} />
              ) : null}
            </div>

            <div className="engine-divider" aria-hidden="true">
              <div className="engine-divider-line" />
              <div className="engine-divider-label">Position Spotlight</div>
              <div className="engine-divider-line" />
            </div>

            <div className="engine-zone" data-zone="status">
              <CarouselPanel
                slots={prioritizedSlots}
                holding={meta?.manager?.holding}
                subslotConfig={meta?.manager?.subslot}
                currentIndex={carouselIndex}
                setCurrentIndex={setCarouselIndex}
                onOpenSlot={setSelectedSlotId}
                paused={carouselPaused}
                setPaused={setCarouselPaused}
                nowMs={nowMs}
              />
            </div>
          </div>
        </section>
      </div>

      {selectedSlot ? (
        <SlotModal
          slot={selectedSlot}
          events={selectedSlotEvents}
          subslotConfig={meta?.manager?.subslot}
          nowMs={nowMs}
          onClose={() => setSelectedSlotId(null)}
        />
      ) : null}
    </main>
  );
}

