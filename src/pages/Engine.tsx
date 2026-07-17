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
type Section = "focus" | "rails" | "slots" | "market" | "events" | "diagnostics" | "spotlight" | "books" | "bank";

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
  exitNoLossPeakGivebackPct?: number | null;
  exitNoLossGivebackPct?: number | null;
  exitOrder?: ExitOrderState | null;
};

type ExitOrderState = {
  state?: string | null;
  id?: string | null;
  idMasked?: string | null;
  hasBrokerId?: boolean | null;
  rate?: number | null;
  targetNetPct?: number | null;
  expectedAud?: number | null;
  lastAction?: string | null;
  repriceCount?: number | null;
  lastError?: string | null;
  dryRun?: boolean | null;
  targetProfitAud?: number | null;
  distancePct?: number | null;
  updatedAt?: number | null;
  nextActionAt?: number | null;
  blockReason?: string | null;
};

type ReportingSummary = {
  lastRealizedNetPct?: number | null;
  lastRealizedProfitAud?: number | null;
  lifetimeNetPct?: number | null;
  totalNetGainAud?: number | null;
  capitalLaneAud?: number | null;
  deployedUnitAud?: number | null;
  entryTargetAud?: number | null;
  entryRequestedAud?: number | null;
  cycles?: number | null;
};

type SecondaryReconciliationAttention = {
  duplicateSellMismatchCount?: number | null;
  hasDuplicateSellMismatch?: boolean | null;
};

type SecondaryWalletCoverage = {
  openCount?: number | null;
  liveCount?: number | null;
  pendingSellCount?: number | null;
  pendingBuyCount?: number | null;
  closedCount?: number | null;
  duplicateSellMismatchCount?: number | null;
  trackedSecondaryCoinQty?: number | null;
  walletCoinAvailable?: number | null;
  walletCoinAfterPrimary?: number | null;
  shortageCoin?: number | null;
  shortageAud?: number | null;
  status?: string | null;
  attention?: boolean | null;
};

type ExecutionComparison = {
  compareScope?: string | null;
  fillStatus?: string | null;
  exactFillKnown?: boolean | null;
  netBasisRate?: number | null;
  netBasisSource?: string | null;
  grossBasisMid?: number | null;
  grossBasisSource?: string | null;
  nowBid?: number | null;
  nowAsk?: number | null;
  nowMid?: number | null;
  spreadPct?: number | null;
  feeBps?: number | null;
  roundTripFeeBps?: number | null;
};

type SecondaryTriggerAssessment = {
  basis?: string | null;
  parentGrossPct?: number | null;
  parentNetPct?: number | null;
  parentTriggerPct?: number | null;
  selectedBandIndex?: number | null;
  selectedBandPct?: number | null;
  grossBandOk?: boolean | null;
  spreadOk?: boolean | null;
  netConfirmPct?: number | null;
  netConfirmOk?: boolean | null;
  entryCostRequired?: boolean | null;
  entryCostKnown?: boolean | null;
  entryCostOk?: boolean | null;
  parentEntryRate?: number | null;
  secondaryEntryRate?: number | null;
  parentAllInEntryRate?: number | null;
  secondaryAllInEntryRate?: number | null;
  entryDiscountPct?: number | null;
  minEntryDiscountPct?: number | null;
  entryLawWouldPass?: boolean | null;
  entryLawWouldBlock?: boolean | null;
  entryLawBlockReason?: string | null;
  hybridNetConfirmOk?: boolean | null;
  hybridEntryCostRequired?: boolean | null;
  hybridEntryCostKnown?: boolean | null;
  hybridEntryCostOk?: boolean | null;
  hybridParentEntryRate?: number | null;
  hybridSecondaryEntryRate?: number | null;
  hybridParentAllInEntryRate?: number | null;
  hybridSecondaryAllInEntryRate?: number | null;
  hybridEntryDiscountPct?: number | null;
  hybridMinEntryDiscountPct?: number | null;
  hybridWouldPass?: boolean | null;
  hybridWouldBlock?: boolean | null;
  hybridWouldBlockReason?: string | null;
  openOk?: boolean | null;
  blockReason?: string | null;
};

type PrimarySurface = {
  compareScope?: string | null;
  comparison?: ExecutionComparison | null;
  entry?: {
    targetAud?: number | null;
    requestedAud?: number | null;
    actualAud?: number | null;
  } | null;
};

type SecondarySummary = {
  liveCount?: number | null;
  openCount?: number | null;
  closedCount?: number | null;
  duplicateSellMismatchCount?: number | null;
  reconciliationAttention?: SecondaryReconciliationAttention | null;
  liveNetPct?: number | null;
  totalNetGainAud?: number | null;
  cycles?: number | null;
  triggerAssessment?: SecondaryTriggerAssessment | null;
  decision?: ExitDecision | null;
};

type SubslotRow = {
  subslotId?: string | null;
  subslotSequence?: number | null;
  subslotEntryLaw?: string | null;
  subslotTriggerBasis?: string | null;
  subslotTriggerBandIndex?: number | null;
  subslotTriggerParentNetPct?: number | null;
  subslotTriggerBandPct?: number | null;
  subslotTriggerParentGrossPct?: number | null;
  subslotTriggerParentExecutableNetPct?: number | null;
  subslotTriggerParentTriggerPct?: number | null;
  subslotTriggerGrossBandOk?: boolean | null;
  subslotTriggerSpreadOk?: boolean | null;
  subslotTriggerNetConfirmPct?: number | null;
  subslotTriggerNetConfirmOk?: boolean | null;
  subslotEntryCostRequired?: boolean | null;
  subslotEntryCostKnown?: boolean | null;
  subslotEntryCostOk?: boolean | null;
  subslotEntryParentRate?: number | null;
  subslotEntrySecondaryRate?: number | null;
  subslotEntryParentAllInRate?: number | null;
  subslotEntrySecondaryAllInRate?: number | null;
  subslotEntryDiscountPct?: number | null;
  subslotEntryMinDiscountPct?: number | null;
  subslotEntryLawWouldPass?: boolean | null;
  subslotEntryLawWouldBlock?: boolean | null;
  subslotEntryLawBlockReason?: string | null;
  subslotHybridNetConfirmOk?: boolean | null;
  subslotHybridEntryCostRequired?: boolean | null;
  subslotHybridEntryCostKnown?: boolean | null;
  subslotHybridEntryCostOk?: boolean | null;
  subslotHybridParentEntryRate?: number | null;
  subslotHybridSecondaryEntryRate?: number | null;
  subslotHybridParentAllInEntryRate?: number | null;
  subslotHybridSecondaryAllInEntryRate?: number | null;
  subslotHybridEntryDiscountPct?: number | null;
  subslotHybridMinEntryDiscountPct?: number | null;
  subslotHybridWouldPass?: boolean | null;
  subslotHybridWouldBlock?: boolean | null;
  subslotHybridWouldBlockReason?: string | null;
  subslotTriggerOpenOk?: boolean | null;
  subslotTriggerBlockReason?: string | null;
  subslotEntryParentNetPct?: number | null;
  subslotEntryParentGrossPct?: number | null;
  subslotEntryParentTriggerPct?: number | null;
  subslotState?: string | null;
  subslotIntegrityState?: string | null;
  subslotExcludedFromOccupancy?: boolean | null;
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
  subslotEntryQuoteRate?: number | null;
  subslotEntryQuoteAbsoluteDriftPct?: number | null;
  subslotEntryQuoteAdverseDriftPct?: number | null;
  subslotEntryQuoteUsed?: boolean | null;
  subslotEntryQuoteAdjusted?: boolean | null;
  subslotEntryMarketAgeMs?: number | null;
  subslotEntryMarketMaxAgeMs?: number | null;

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
  subslotExitOrderState?: string | null;
  subslotExitOrderRate?: number | null;
  subslotExitOrderTargetNetPct?: number | null;
  subslotExitOrderExpectedAud?: number | null;
  subslotExitOrderLastAction?: string | null;
  subslotExitOrderRepriceCount?: number | null;
  subslotExitOrderLastError?: string | null;
  subslotExitOrderDryRun?: boolean | null;
  subslotExitOrderTargetProfitAud?: number | null;
  subslotExitOrderDistancePct?: number | null;
  subslotExitOrderUpdatedAt?: number | null;
  subslotExitOrderNextActionAt?: number | null;
  subslotExitOrderBlockReason?: string | null;
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
  subslotExecutableExitAud?: number | null;
  subslotExecutableExitProfitAud?: number | null;
  subslotExecutableExitNetPct?: number | null;
  subslotExitTriggerAt?: number | null;
  subslotExitTriggerReason?: string | null;
  subslotExitGateState?: string | null;
  subslotExitGateReason?: string | null;
  subslotExitWaitGreenSince?: number | null;
  subslotBestExecutableExitNetPct?: number | null;
  subslotBestExecutableExitProfitAud?: number | null;
  subslotExitRequiredNetPct?: number | null;
  subslotExitRequiredProfitAud?: number | null;
  subslotEffectiveTakeProfitNetPct?: number | null;
  subslotGreenStallTicks?: number | null;
  comparison?: ExecutionComparison | null;
  triggerAssessment?: SecondaryTriggerAssessment | null;
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
  primaryEntryTargetAud?: number | null;
  primaryEntryRequestedAud?: number | null;

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
  liveExactBackfillVersion?: string | null;

  liveExitOrderId?: string | null;
  parentExecutableExitAud?: number | null;
  parentExecutableExitProfitAud?: number | null;
  parentExecutableExitNetPct?: number | null;
  parentExitGateState?: string | null;
  parentExitGateReason?: string | null;
  parentExitRequiredNetPct?: number | null;
  parentExitRequiredProfitAud?: number | null;
  parentExitNoLossPeakGivebackPct?: number | null;
  parentExitNoLossGivebackPct?: number | null;
  parentExitOrderState?: string | null;
  parentExitOrderId?: string | null;
  parentExitOrderRate?: number | null;
  parentExitOrderTargetNetPct?: number | null;
  parentExitOrderExpectedAud?: number | null;
  parentExitOrderLastAction?: string | null;
  parentExitOrderRepriceCount?: number | null;
  parentExitOrderLastError?: string | null;
  parentExitOrderDryRun?: boolean | null;
  parentExitOrderTargetProfitAud?: number | null;
  parentExitOrderDistancePct?: number | null;
  parentExitOrderUpdatedAt?: number | null;
  parentExitOrderNextActionAt?: number | null;
  parentExitOrderBlockReason?: string | null;
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
  subslotIntegrityState?: string | null;
  subslotExcludedFromOccupancy?: boolean | null;
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
  subslotExitOrderState?: string | null;
  subslotExitOrderRate?: number | null;
  subslotExitOrderTargetNetPct?: number | null;
  subslotExitOrderExpectedAud?: number | null;
  subslotExitOrderLastAction?: string | null;
  subslotExitOrderRepriceCount?: number | null;
  subslotExitOrderLastError?: string | null;
  subslotExitOrderDryRun?: boolean | null;
  subslotExitOrderTargetProfitAud?: number | null;
  subslotExitOrderDistancePct?: number | null;
  subslotExitOrderUpdatedAt?: number | null;
  subslotExitOrderNextActionAt?: number | null;
  subslotExitOrderBlockReason?: string | null;
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
  subslotEntryQuoteRate?: number | null;
  subslotEntryQuoteAbsoluteDriftPct?: number | null;
  subslotEntryQuoteAdverseDriftPct?: number | null;
  subslotEntryQuoteUsed?: boolean | null;
  subslotEntryQuoteAdjusted?: boolean | null;
  subslotEntryMarketAgeMs?: number | null;
  subslotEntryMarketMaxAgeMs?: number | null;

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
  subslotExecutableExitAud?: number | null;
  subslotExecutableExitProfitAud?: number | null;
  subslotExecutableExitNetPct?: number | null;
  subslotExitTriggerAt?: number | null;
  subslotExitTriggerReason?: string | null;
  subslotExitGateState?: string | null;
  subslotExitGateReason?: string | null;
  subslotExitWaitGreenSince?: number | null;
  subslotBestExecutableExitNetPct?: number | null;
  subslotBestExecutableExitProfitAud?: number | null;
  subslotExitRequiredNetPct?: number | null;
  subslotExitRequiredProfitAud?: number | null;
  subslotEffectiveTakeProfitNetPct?: number | null;
  subslotGreenStallTicks?: number | null;
  subslotSignalState?: string | null;
  subslotSignalReason?: string | null;
  subslotEntryMode?: string | null;
  subslotEntryLaw?: string | null;
  subslotTriggerBasis?: string | null;
  subslotTriggerBandIndex?: number | null;
  subslotTriggerParentNetPct?: number | null;
  subslotTriggerBandPct?: number | null;
  subslotTriggerParentGrossPct?: number | null;
  subslotTriggerParentExecutableNetPct?: number | null;
  subslotTriggerParentTriggerPct?: number | null;
  subslotTriggerGrossBandOk?: boolean | null;
  subslotTriggerSpreadOk?: boolean | null;
  subslotTriggerNetConfirmPct?: number | null;
  subslotTriggerNetConfirmOk?: boolean | null;
  subslotEntryCostRequired?: boolean | null;
  subslotEntryCostKnown?: boolean | null;
  subslotEntryCostOk?: boolean | null;
  subslotEntryParentRate?: number | null;
  subslotEntrySecondaryRate?: number | null;
  subslotEntryParentAllInRate?: number | null;
  subslotEntrySecondaryAllInRate?: number | null;
  subslotEntryDiscountPct?: number | null;
  subslotEntryMinDiscountPct?: number | null;
  subslotEntryLawWouldPass?: boolean | null;
  subslotEntryLawWouldBlock?: boolean | null;
  subslotEntryLawBlockReason?: string | null;
  subslotHybridNetConfirmOk?: boolean | null;
  subslotHybridEntryCostRequired?: boolean | null;
  subslotHybridEntryCostKnown?: boolean | null;
  subslotHybridEntryCostOk?: boolean | null;
  subslotHybridParentEntryRate?: number | null;
  subslotHybridSecondaryEntryRate?: number | null;
  subslotHybridParentAllInEntryRate?: number | null;
  subslotHybridSecondaryAllInEntryRate?: number | null;
  subslotHybridEntryDiscountPct?: number | null;
  subslotHybridMinEntryDiscountPct?: number | null;
  subslotHybridWouldPass?: boolean | null;
  subslotHybridWouldBlock?: boolean | null;
  subslotHybridWouldBlockReason?: string | null;
  subslotTriggerOpenOk?: boolean | null;
  subslotTriggerBlockReason?: string | null;
  subslotEntryParentNetPct?: number | null;
  subslotEntryParentGrossPct?: number | null;
  subslotEntryParentTriggerPct?: number | null;

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
  candidateFundingState?: string | null;
  candidateEntrySizingMode?: string | null;
  candidateAudNeeded?: number | null;
  candidateAudAvailable?: number | null;
  candidateAllocationState?: string | null;
  candidateAllocationBlockedReason?: string | null;
  candidateAllocationReserveMode?: string | null;
  candidateAllocationReserveAdvisoryReason?: string | null;
  candidatePrimarySpendableAud?: number | null;
  candidateSecondaryReserveAud?: number | null;

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
  primary?: PrimarySurface | null;

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
  capital?: {
    entryCapitalMode?: string;
    entryCapitalAllocationMode?: string;
    primaryTargetAud?: number | null;
    primaryReentryRule?: string;
    subslotEntrySizeMode?: string;
    subslotEntryTargetAud?: number | null;
    subslotSizePctOfParent?: number | null;
    subslotEntryRule?: string;
    pairUnitAud?: number | null;
    pairBufferAud?: number | null;
    primaryPoolAud?: number | null;
    secondaryPoolAud?: number | null;
    secondaryMaxPerPrimary?: number | null;
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
      lvl4Net?: ManagerLevelTrailConfig;
      volatility?: ManagerVolatilityTrailConfig;
    };
    exitPolicy?: {
      primaryLockExitMode?: string;
      minWinExitNetPct?: number;
      minWinExitAud?: number;
      greenConfirmTicks?: number;
      lockExitRequireGreen?: boolean;
      floorHarvestEnabled?: boolean;
      floorExitArmBufferPct?: number;
      floorExitPeakGivebackPct?: number;
      floorExitMinNetPct?: number;
      floorExitMinProfitAud?: number;
    };
    coinOverrides?: Record<string, string[]>;
  };
  subslot?: {
    enabled?: boolean;
    maxPerSlot?: number;
    entrySizeMode?: string;
    entryTargetAud?: number | null;
    entrySizeRule?: string;
    sizePctOfParent?: number;
    minAud?: number;
    maxForcedSizePct?: number;
    minWinExitNetPct?: number;
    minWinExitAud?: number;
    exitGreenConfirmTicks?: number;
    triggerParentNetPct?: number;
    triggerParentNetBandsPct?: number[];
    triggerParentNetConfirmPct?: number;
    triggerBasis?: string;
    entryLaw?: string;
    entryParentGrossBandsPct?: number[];
    entryParentNetConfirmPct?: number;
    entryRequireSecondaryCheaper?: boolean;
    entryMinDiscountPct?: number;
    exitOrderManager?: {
      enabled?: boolean;
      dryRun?: boolean;
      requestedDryRun?: boolean;
      liveMutationEnabled?: boolean;
      requireNetGain?: boolean;
      primaryEnabled?: boolean;
      secondaryEnabled?: boolean;
      primaryArmLevel?: number;
      secondaryTargetNetPct?: number;
    };
    requireTriggerBand?: boolean;
    triggerTouchBypassSpread?: boolean;
    coinTriggerBands?: Record<string, number[]>;
    takeProfitEnabled?: boolean;
    takeProfitNetPct?: number;
    recoveryFloorNetPct?: number;
    recoveryConfirmTicks?: number;
    postRecoveryWeaknessTicks?: number;
    postRecoveryGivebackPct?: number;
    postRecoveryProtectFloorNetPct?: number;
    requireRecoveryBeforeExit?: boolean;
    triggerBandReuse?: {
      enabled?: boolean;
      cooldownMs?: number;
    };
    bandSizing?: {
      enabled?: boolean;
      stepMult?: number;
      maxMult?: number;
    };
    entryPacing?: {
      enabled?: boolean;
      pacingMs?: number;
      bypassParentDeltaPct?: number;
    };
    perfReuse?: {
      enabled?: boolean;
      minWinRatePct?: number;
      minEvPct?: number;
      confirmTickReduction?: number;
      minEdgeReliefPct?: number;
      pacingMult?: number;
      sizeBoostMult?: number;
    };
    bandHarvest?: {
      enabled?: boolean;
      stepPct?: number;
      minNetPct?: number;
    };
    greenStall?: {
      enabled?: boolean;
      ticks?: number;
      armFactor?: number;
      minNetPct?: number;
      improveNetEpsilonPct?: number;
      improveProfitAud?: number;
    };
    parentRecoveryExit?: {
      enabled?: boolean;
      recoveryDeltaPct?: number;
      targetParentNetPct?: number;
    };
    requirePrimaryExactFill?: boolean;
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

type ManagerStatusResponse = ManagerStatus & {
  ok?: boolean;
  ts?: number;
  now?: number;
  version?: string;
};

type PublicReadinessResponse = {
  ok?: boolean;
  ts?: number;
  execution?: {
    mode?: string;
    liveTradingEnabled?: boolean;
    liveExecutionAllowed?: boolean;
    writeEnabled?: boolean;
  };
  operator?: {
    tokenConfigured?: boolean;
  };
  coinspot?: {
    readCreds?: boolean;
    tradeCreds?: boolean;
  };
  fixedSlots?: {
    expected?: string[];
    missing?: string[];
    presentCount?: number;
    totalRows?: number;
  };
  workers?: {
    harvesterEnabled?: boolean;
    executorEnabled?: boolean;
    managerEnabled?: boolean;
    rotationEnabled?: boolean;
    rotationExecutorEnabled?: boolean;
    topupEnabled?: boolean;
  };
  blockers?: unknown[];
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
  primaryTrackedAud?: number | null;
  secondaryTrackedAud?: number | null;
  trackedAud?: number | null;
  trackedCoinQty?: number | null;
  quantityDriftCoin?: number | null;
  quantityDriftAud?: number | null;
  quantityDriftAttention?: boolean | null;
  valueVsTrackedCostAud?: number | null;
  untrackedAudApprox?: number | null;
  exposureAttention?: boolean | null;
  secondaryWalletCoverage?: SecondaryWalletCoverage | null;
};

type EntryAllocation = {
  mode?: string | null;
  enabled?: boolean | null;
  audAvailable?: number | null;
  primaryTargetAud?: number | null;
  secondaryTargetAud?: number | null;
  pairUnitAud?: number | null;
  pairBufferAud?: number | null;
  fundedPairCount?: number | null;
  primaryCommittedCount?: number | null;
  secondaryCommittedCount?: number | null;
  primaryCommittedAud?: number | null;
  secondaryCommittedAud?: number | null;
  primarySpendableAud?: number | null;
  secondaryReservedAud?: number | null;
  secondarySpendableAud?: number | null;
  primarySlotsAvailable?: number | null;
  secondarySlotsAvailable?: number | null;
  capitalBaseAud?: number | null;
  nextPrimaryAllowed?: boolean | null;
  nextSecondaryAllowed?: boolean | null;
  blockReason?: string | null;
  primaryBlockReason?: string | null;
  secondaryBlockReason?: string | null;
  firstSecondaryReserveMode?: string | null;
  firstSecondaryReserveHard?: boolean | null;
  firstSecondaryReserveAdvisory?: boolean | null;
  primaryReserveAdvisoryReason?: string | null;
  primaryPoolAud?: number | null;
  primaryPoolRemainingAud?: number | null;
  primarySlotsMax?: number | null;
  primarySlotsCommitted?: number | null;
  secondaryPoolAud?: number | null;
  secondaryPoolRemainingAud?: number | null;
  secondaryMaxPerPrimary?: number | null;
  firstSecondaryDeficitCount?: number | null;
  activeFirstSecondaryReserveAud?: number | null;
  prospectivePrimaryReserveAud?: number | null;
  secondaryRailSlotsTotal?: number | null;
  secondaryRailSlotsAvailable?: number | null;
  secondaryCapacityAud?: number | null;
  secondaryRails?: {
    slotId?: string | null;
    coin?: string | null;
    primaryActive?: boolean | null;
    primaryCommittedAud?: number | null;
    secondaryUsedCount?: number | null;
    secondaryCommittedAud?: number | null;
    secondaryMaxPerPrimary?: number | null;
    secondarySlotsAvailable?: number | null;
    secondaryCapacityAud?: number | null;
    secondarySpendableAud?: number | null;
    nextSecondaryAllowed?: boolean | null;
    blockedReason?: string | null;
  }[] | null;
};

type PublicCapitalResponse = {
  ok?: boolean;
  ts?: number;
  audAvailable?: number | null;
  audBalance?: number | null;
  walletAudValue?: number | null;
  movableAudEstimate?: number | null;
  walletSourceEnabled?: boolean | null;
  entryAllocation?: EntryAllocation | null;
  exposure?: {
    thresholdAud?: number | null;
    attentionCount?: number | null;
    attentionCoins?: string[] | null;
    untrackedAudApprox?: number | null;
    valueVsTrackedCostAud?: number | null;
    quantityDriftCoin?: number | null;
    quantityDriftAud?: number | null;
  } | null;
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

type BooksSummary = {
  ok?: boolean;
  ts?: number;
  error?: string;
  enabled?: boolean;
  fy?: string;
  taxReservePct?: number | null;
  tradingFloatTargetAud?: number | null;
  importYears?: string[];
  importStatus?: {
    importedTradeCount?: number | null;
    filteredTradeCount?: number | null;
    manualEntryCount?: number | null;
    fyManualEntryCount?: number | null;
    apiEntryCount?: number | null;
    fyApiEntryCount?: number | null;
  };
  apiSync?: {
    at?: string | null;
    mode?: string | null;
    financialYears?: string[];
    insertedTrades?: number | null;
    duplicateTrades?: number | null;
    insertedEntries?: number | null;
    duplicateEntries?: number | null;
    insertedWarnings?: number | null;
    duplicateWarnings?: number | null;
    audAvailable?: number | null;
    balancesAsOf?: string | null;
    errors?: Array<{ source?: string; message?: string }>;
    counts?: {
      fetchedTrades?: number | null;
      deposits?: number | null;
      withdrawals?: number | null;
      transferWarnings?: number | null;
      requests?: number | null;
      maxWindowHits?: number | null;
    };
  };
  tradeCounts?: {
    buy?: number | null;
    sell?: number | null;
    audMarket?: number | null;
    cryptoCross?: number | null;
  };
  tradeTotals?: {
    buyTotalAud?: number | null;
    sellTotalAud?: number | null;
    feeAud?: number | null;
    gstAud?: number | null;
    realizedEstimateAud?: number | null;
  };
  ownerTotals?: {
    ownerCapitalInAud?: number | null;
    ownerDrawingAud?: number | null;
    taxReserveAdjustmentAud?: number | null;
    taxPaymentAud?: number | null;
    noteCount?: number | null;
  };
  reserve?: {
    estimatedTaxReserveAud?: number | null;
    availableOwnerDrawingEstimateAud?: number | null;
    note?: string | null;
  };
  warnings?: Array<{
    code?: string;
    asset?: string;
    amount?: number | null;
    direction?: string | null;
    missingQty?: number | null;
    transactionAt?: string | null;
    note?: string | null;
  }>;
  warningCount?: number | null;
  method?: {
    inventory?: string | null;
    treatment?: string | null;
    disclaimer?: string | null;
  };
};

type BooksImportResponse = {
  ok?: boolean;
  error?: string;
  inserted?: number;
  duplicate?: number;
  enriched?: number;
  totalStored?: number;
  rawRowsStored?: boolean;
  rawRowsInserted?: number;
  rawArchiveReused?: boolean;
  duplicateCandidates?: number;
  economicReviewCandidates?: number;
  parsed?: {
    validRows?: number;
    uniqueRows?: number;
    uniqueFingerprints?: number;
    skippedLines?: number;
    duplicateCandidateRows?: number;
    economicReviewRows?: number;
    buys?: number;
    sells?: number;
    audMarket?: number;
    cryptoCross?: number;
    financialYears?: string[];
  };
  warnings?: string[];
};

type BooksSyncResponse = {
  ok?: boolean;
  error?: string;
  at?: string;
  mode?: string;
  financialYears?: string[];
  insertedTrades?: number;
  duplicateTrades?: number;
  totalStoredTrades?: number;
  insertedEntries?: number;
  duplicateEntries?: number;
  totalStoredEntries?: number;
  insertedWarnings?: number;
  duplicateWarnings?: number;
  totalStoredWarnings?: number;
  counts?: {
    fetchedTrades?: number;
    deposits?: number;
    withdrawals?: number;
    transferWarnings?: number;
    requests?: number;
    maxWindowHits?: number;
  };
  errors?: Array<{ source?: string; message?: string }>;
};

type LenderProjectionInputs = {
  loanAmountAud?: number;
  annualRatePct?: number;
  termMonths?: number;
  operatingExpensesAud?: number;
  taxReservePct?: number;
  baseRevenueAud?: number;
  adverseRevenueAud?: number;
  negativeMonthAud?: number;
  openingCashAud?: number;
  assumptionNotice?: string;
};

type LenderMonthlyActual = {
  month?: string;
  label?: string;
  buyCount?: number;
  sellCount?: number;
  buyTotalAud?: number;
  sellTotalAud?: number;
  feeAud?: number;
  gstAud?: number;
  realizedTradingProfitAud?: number;
  taxReserveProvisionAud?: number;
  ownerCapitalInAud?: number;
  ownerDrawingAud?: number;
};

type LenderScenarioRow = {
  month?: number;
  realisedTradingRevenueAud?: number;
  operatingExpensesAud?: number;
  loanInterestAud?: number;
  loanPrincipalAud?: number;
  debtServiceAud?: number;
  taxProvisionAud?: number;
  netCashflowAud?: number;
  endingCashAud?: number;
  cumulativeRetainedEarningsAud?: number;
};

type LenderScenario = {
  key?: string;
  label?: string;
  rows?: LenderScenarioRow[];
  totals?: {
    realisedTradingRevenueAud?: number;
    operatingExpensesAud?: number;
    debtServiceAud?: number;
    taxProvisionAud?: number;
    netOperatingCashflowAud?: number;
    endingCashAud?: number;
    cumulativeRetainedEarningsAud?: number;
    dscr?: number;
    dscrClassification?: string;
  };
};

type EvidenceItemStatus = "missing" | "provided" | "not_applicable";

type EvidenceMonth = {
  month?: string;
  label?: string;
  providedCount?: number;
  requiredCount?: number;
  missingCount?: number;
  complete?: boolean;
  items?: Array<{
    key?: string;
    label?: string;
    status?: EvidenceItemStatus;
    note?: string | null;
    updatedAt?: string | null;
  }>;
};

type LenderReport = {
  ok?: boolean;
  error?: string;
  generatedAt?: string;
  businessName?: string;
  businessStructure?: string;
  systemName?: string;
  period?: {
    fy?: string;
    startDate?: string | null;
    endDate?: string | null;
  };
  sourceStatus?: {
    verifiedActualsSource?: string;
    projectionSource?: string;
    importedTradeCount?: number;
    filteredTradeCount?: number;
    manualEntryCount?: number;
    verifiedTradeHistoryAvailable?: boolean;
    noPerformanceClaims?: boolean;
  };
  verifiedActuals?: {
    annual?: Record<string, number>;
    monthly?: LenderMonthlyActual[];
    warningCount?: number;
  };
  projectionInputs?: LenderProjectionInputs;
  cashflowScenarios?: LenderScenario[];
  dscr?: {
    scenarios?: Record<string, { netOperatingCashflowAud?: number; totalDebtServiceAud?: number; dscr?: number; classification?: string }>;
  };
  stressTests?: Array<{
    key?: string;
    label?: string;
    monthlyRevenueBasis?: string;
    dscr?: number;
    dscrClassification?: string;
    endingCashAud?: number;
    repaymentsServiceableFromOperations?: boolean;
    cashBufferPositiveAfter12Months?: boolean;
  }>;
  evidence?: {
    months?: EvidenceMonth[];
    totals?: {
      provided?: number;
      missing?: number;
      required?: number;
      completeMonths?: number;
      completenessPct?: number;
    };
  };
  assumptions?: Array<{ key?: string; value?: string | number; treatment?: string }>;
  warnings?: Array<{ code?: string; note?: string }>;
  redaction?: { secretsIncluded?: boolean; note?: string };
};

type CgtAtoField = {
  key?: string;
  label?: string;
  value?: string | number | null;
  valueAud?: number | null;
  source?: string | null;
};

type CgtDisposal = {
  id?: string;
  transactionAt?: string;
  fy?: string;
  eventType?: string;
  eventId?: string | null;
  componentIndex?: number | null;
  componentCount?: number | null;
  reason?: string;
  type?: string;
  sourceLine?: number | null;
  asset?: string;
  market?: string;
  quantity?: number | null;
  qty?: number | null;
  proceedsAud?: number | null;
  costBaseAud?: number | null;
  feeAud?: number | null;
  gainLossAud?: number | null;
  capitalGainAud?: number | null;
  capitalLossAud?: number | null;
  discountEligibleGainAud?: number | null;
  discountEligible?: boolean | null;
  acquiredAt?: string | null;
  rowHash?: string | null;
  lotHash?: string | null;
  missingQty?: number | null;
  status?: string;
};

type CgtReviewPack = {
  ok?: boolean;
  error?: string;
  generatedAt?: string;
  fy?: string;
  sourceStatus?: {
    dataSource?: string;
    importedTradeCount?: number | null;
    filteredTradeCount?: number | null;
    apiSyncAt?: string | null;
    method?: BooksSummary["method"];
  };
  atoFields?: CgtAtoField[];
  totals?: {
    disposalCount?: number | null;
    disposalEventCount?: number | null;
    disposalComponentCount?: number | null;
    capitalProceedsAud?: number | null;
    costBaseAud?: number | null;
    feeAud?: number | null;
    grossCapitalGainsAud?: number | null;
    currentYearCapitalLossesAud?: number | null;
    discountEligibleGainAud?: number | null;
    capitalLossesAppliedAud?: number | null;
    cgtDiscountAppliedAud?: number | null;
    netCapitalGainAud?: number | null;
    netCapitalLossesCarriedForwardAud?: number | null;
  };
  sourceReview?: {
    source?: string | null;
    rawRowsObserved?: number | null;
    insertedRows?: number | null;
    duplicateRowsIgnored?: number | null;
    storedDedupedTradeRows?: number | null;
    storedDedupedFyRows?: number | null;
    storedEconomicFyRows?: number | null;
    economicReviewRows?: number | null;
    importRecordsReviewed?: number | null;
    rawRowsStored?: boolean | null;
    rawStoredTradeRows?: number | null;
    rawStoredFyRows?: number | null;
    rawBackedImportRecords?: number | null;
    legacyOrSummaryImportRecords?: number | null;
    rawStorageCoverageComplete?: boolean | null;
    generatedDisposalEvents?: number | null;
    generatedDisposalRows?: number | null;
    swapDisposalRows?: number | null;
    audSellDisposalRows?: number | null;
    missingBasisDisposalRows?: number | null;
    unresolvedCrossQuoteQuantityRows?: number | null;
    zeroAmountCrossAcquisitionRows?: number | null;
    firstSourceLine?: number | null;
    lastSourceLine?: number | null;
    dedupeMethod?: string | null;
    note?: string | null;
  };
  openingBalanceReview?: {
    corrections?: Array<{
      asset?: string;
      quantity?: number | null;
      costBaseAud?: number | null;
      acquiredAt?: string | null;
      note?: string | null;
    }>;
    missingAssets?: Array<{
      asset?: string;
      missingQty?: number | null;
      firstDisposalAt?: string | null;
      count?: number | null;
    }>;
    workflow?: string | null;
  };
  disposals?: CgtDisposal[];
  warnings?: Array<{
    code?: string;
    asset?: string;
    amount?: number | null;
    missingQty?: number | null;
    transactionAt?: string | null;
    note?: string | null;
  }>;
  accountantPack?: {
    disclaimer?: string | null;
  };
};

type EngineData = {
  rowsAll: MarketRow[];
  rowsAud: MarketRow[];
  snap: Snapshot | null;
  meta: PublicMetaResponse | null;
  readiness: PublicReadinessResponse | null;
  managerStatus: ManagerStatusResponse | null;
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

import { supabase } from "../lib/supabase";

/* =========================
   Constants
========================= */

const PROD_DEFAULT = "https://jal-engine-service-production.up.railway.app";
const DEV_DEFAULT = "http://localhost:8787";
const CAROUSEL_INTERVAL_MS = 4500;
const ENGINE_POLL_INTERVAL_MS = 3000;
const CAPITAL_POLL_INTERVAL_MS = 15000;

const PRIMARY_BEHAVIOR_CARDS: BehaviorCard[] = [
  {
    title: "Fixed Universe + Cadence",
    summary:
      "Eight permanent AUD slots stay assigned to BTC, ETH, XRP, SOL, DOGE, ADA, LTC, and TRX. The primary entry target is surfaced from runtime config and resets cleanly to the configured AUD target.",
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
      "Global hold levels arm at 1.5%, 2.5%, 4.0%, and 6.0% net. Default lock floors are 0.70%, 1.40%, and 2.60%, with LVL4 now arming a bid trail plus a retained executable-net floor.",
    detail:
      "Most live behavior is then refined by per-coin trail overrides. Re-entry mode is EXIT_DROP with a 1.0% target below the last confirmed exit.",
  },
  {
    title: "Exit Discipline",
    summary:
      "Jrd Primary normal harvest exits can stay green-first, while breached lock or trailing floors can run in protection mode when the backend disables the green requirement for floor exits.",
    detail:
      "If a parent collapses to -14.0% net the secondary trigger ladder bottoms out. A busy Jrd Secondary can delay a parent from finalizing back to WAITING_ENTRY.",
  },
  {
    title: "Primary Performance Memory",
    summary:
      "Recent primaries are scored over the last 8 trades. After 3 straight losses the affected coin enters a 15-minute cooldown.",
    detail:
      "Negative-EV half-sizing is OFF for primaries in this profile, so the engine prefers either full-size entries or temporary disablement instead of soft clipping.",
  },
];

const SECONDARY_BEHAVIOR_CARDS: BehaviorCard[] = [
  {
    title: "Jrd Secondary Mission",
    summary:
      "Secondaries harvest volatility inside a live primary instead of replacing it. Each entry is a static AUD 1,000 unit, with up to 8 tactical secondary slots available per active Primary.",
    detail:
      "Accounting stays separate during the hold and merges only when the parent returns to WAITING_ENTRY. Entry pacing is ON; performance reuse and trigger-band reuse are OFF.",
  },
  {
    title: "Trigger And Cost Gate",
    summary:
      "The secondary entry law is fixed: gross parent band for market structure, executable parent net for wallet confirmation, then a cheaper-entry check against parent basis.",
    detail:
      "Trigger-touch mode can still skip signal confirmation, EMA gap, expected edge, and net-after-cost checks, but it does not skip live market, spread, wallet exposure, parent-collapse, band availability, executable-net confirmation, or the final cheaper-entry quote fence.",
  },
  {
    title: "Exit Order Manager",
    summary:
      "Primary locks and active secondaries calculate first-class target sell orders from their own net-gain basis. Live exit-order mutation is enabled and dry-run mode is OFF.",
    detail:
      "When a Primary floor breach is blocked by its tracked resting sell order, the engine clears that order first and retries the guarded executable exit on the next tick. Secondary entry remains governed by its own gross/net/spread gates rather than being stopped just because a Primary exit trigger is active.",
  },
  {
    title: "Directional Playbooks",
    summary:
      "Regime profiles still shape entry size, spread ceilings, EMA floors, bounce requirements, and exit target behavior, while the final sell readiness remains executable-green.",
    detail:
      "That makes the dashboard distinction cleaner: structure chooses the setup, executable economics decide whether the wallet can safely enter or exit.",
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
      "Quote guard is required with a 10 second timeout. Global drift tolerance is 1.25%; BTC uses 1.75%, while ETH, XRP, SOL, ADA, and LTC use 2.75% on live buy quotes.",
    detail:
      "Market history and trade telemetry are both enabled, so the UI is backed by replayable quote history plus live submission diagnostics.",
  },
  {
    title: "What Is Disabled",
    summary:
      "Rotation policy and the rotation executor are OFF. Waiting-slot top-up remains ON and restores eligible waiting rails to the configured AUD 50 target.",
    detail:
      "The live system is a fixed eight-slot primary-plus-secondary engine; the Railway telemetry above remains the source of truth for current worker and gate state.",
  },
];

const ENGINE_COIN_BEHAVIOR_PROFILES: BehaviorCoinProfile[] = [
  {
    coin: "BTC",
    personality: "Tightest spread and cleanest secondary filter; the benchmark leader.",
    executor:
      "Primary entry allows spread up to 1.40%, drawdown 0.35%-8.00%, bounce at least 0.08%, and continuation EMA gap >= 0.005%, all with 1-tick confirmation.",
    primary:
      "Primary exits want at least 0.12% net or AUD 0.25. Trail rails keep 40%, 48%, and 58% of move after arming at 0.25%, 0.20%, and 0.25%. Adaptive vol trail is enabled but arm multiplier is 0.00, capped at 0.35%, with 28% minimum retain.",
    secondary:
      "Secondaries use the global parent trigger-band ladder with strict filters: spread <= 0.45%, bounce >= 0.35%, expected edge >= 0.10%, post-cost net >= 0.05%, and min exit AUD 0.08.",
    safeguards:
      "BTC is the most selective coin in the book, favoring thinner spread and continuation clarity over deep oversold harvesting. Its live buy quote-drift ceiling is 1.75%.",
  },
  {
    coin: "ETH",
    personality: "Balanced leader with fast continuation tolerance and moderately tight exits.",
    executor:
      "Primary entry allows spread up to 1.80%, drawdown 0.25%-10.00%, bounce >= 0.12%, continuation drawdown >= 0.04%, EMA gap >= 0.002%, and 1-tick confirmation.",
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
      "Primary entry allows spread up to 1.80%, drawdown 0.40%-10.00%, bounce >= 0.12%, continuation drawdown >= 0.01%, EMA gap >= 0.0004%, and 1-tick confirmation.",
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
      "Primary entry allows spread up to 2.40%, drawdown 0.25%-10.00%, bounce >= 0.10%, continuation drawdown >= 0.08%, EMA gap >= 0.002%, and 1-tick confirmation.",
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
      "Primary entry allows spread up to 2.80%, drawdown 0.45%-12.00%, bounce >= 0.14%, and 1-tick confirmation with no EMA-up requirement.",
    primary:
      "Primary exits want 0.24% net or AUD 0.38. Trail rails arm at 0.22%, 0.30%, and 0.38% and keep 34%, 42%, and 52%. Adaptive vol trail is ON with 1.10 arm mult, 0.65 max arm, and 20% minimum retain.",
    secondary:
      "Secondaries are band-only: -1.5%, -3.0%, -4.75%, -6.5%, -7.75%, -9.75%, -11.75%, and -14.0%. Core filters are spread <= 2.20%, bounce >= 0.25%, EMA gap 0.02, expected edge >= 0.10%, post-cost >= 0.10%, and min exit AUD 0.14. Consolidation spreads can stretch to 3.00% with bull edge 0.12 and bear edge 0.14.",
    safeguards:
      "ADA is tuned for staged underwater recovery rather than shallow noise. The extra banding makes it one of the most deliberate rebound harvesters in the set.",
  },
  {
    coin: "DOGE",
    personality: "Loose spread tolerance and aggressive lock floors for meme-volatility harvesting.",
    executor:
      "Primary entry allows spread up to 3.00%, drawdown 0.35%-12.00%, bounce >= 0.10%, and 1-tick confirmation.",
    primary:
      "Primary exits want 0.32% net or AUD 0.45. Hard locks are 1.00%, 1.85%, and 3.10%, while trails arm at 0.14%, 0.20%, and 0.26% and retain 52%, 62%, and 72%. Adaptive vol trail is OFF.",
    secondary:
      "Secondaries can stay negative on structure: EMA gap -0.20, downtrend EMA gap -0.20, spread <= 3.00%, bounce >= 0.20%, expected edge >= 0.10%, post-cost >= 0.12%, and min exit AUD 0.16. Consolidation lanes allow 3.50% spread with bull edge 0.12 and bear edge 0.14.",
    safeguards:
      "The parent band ladder runs from -1.5% to -14.0%, making DOGE a deep-recovery specialist rather than a neat-trend coin.",
  },
  {
    coin: "LTC",
    personality: "Middle-weight mean-reversion coin with wider secondary spread tolerance.",
    executor:
      "Primary entry allows spread up to 3.00%, drawdown 0.45%-12.00%, bounce >= 0.14%, and 1-tick confirmation.",
    primary:
      "Primary exits want 0.22% net or AUD 0.35. Trail rails arm at 0.18%, 0.24%, and 0.30% and keep 38%, 46%, and 56%. Adaptive vol trail is ON with 1.05 arm mult, 0.50 max arm, and 24% minimum retain.",
    secondary:
      "Secondaries allow EMA gap 0.00, spread <= 2.20%, bounce >= 0.25%, expected edge >= 0.10%, post-cost >= 0.10%, and min exit AUD 0.12.",
    safeguards:
      "LTC is less fussy than BTC or ETH on spread, but it still demands clean net-after-cost recovery before a secondary is worth keeping.",
  },
  {
    coin: "TRX",
    personality: "High-lock, high-noise book end tuned for thinner-market rebounds.",
    executor:
      "Primary entry allows spread up to 4.00%, drawdown 0.35%-12.00%, bounce >= 0.10%, and 1-tick confirmation.",
    primary:
      "Primary exits want 0.36% net or AUD 0.45. Locks step to 1.05%, 1.95%, and 3.20%, while trails arm at 0.14%, 0.20%, and 0.26% and retain 54%, 64%, and 74%. Adaptive vol trail is OFF.",
    secondary:
      "Secondaries use EMA gap 0.015, spread <= 2.80%, bounce >= 0.20%, expected edge >= 0.08%, post-cost >= 0.12%, and min exit AUD 0.16. Consolidation lanes allow 3.80% spread with bull edge 0.10 and bear edge 0.12.",
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

function bpsPctLabel(bps: number | null | undefined) {
  if (bps == null || !Number.isFinite(bps)) return "-";
  return `${(Number(bps) / 100).toFixed(2)}%`;
}

function primaryComparison(slot: SlotRow | null | undefined) {
  return slot?.primary?.comparison ?? null;
}

function secondaryComparison(subslot: SubslotRow | null | undefined) {
  return subslot?.comparison ?? null;
}

function basisSourceLabel(source: string | null | undefined) {
  const normalized = String(source || "").trim().toLowerCase();
  const mapped: Record<string, string> = {
    primary_actual_fill: "Primary actual fill",
    primary_submitted_rate: "Primary submitted rate",
    primary_entry_ask: "Primary entry ask",
    primary_entry_mid: "Primary entry mid",
    secondary_actual_fill: "Secondary actual fill",
    secondary_submitted_rate: "Secondary submitted rate",
    secondary_entry_mid: "Secondary entry mid",
  };
  if (mapped[normalized]) return mapped[normalized];
  return enumLabel(source);
}

function primaryNetBasisRate(slot: SlotRow | null | undefined) {
  const comparison = primaryComparison(slot);
  if (comparison?.netBasisRate != null && Number.isFinite(comparison.netBasisRate)) return comparison.netBasisRate;
  if (slot?.liveEntryActualRate != null && Number.isFinite(slot.liveEntryActualRate)) return slot.liveEntryActualRate;
  if (slot?.liveEntrySubmittedRate != null && Number.isFinite(slot.liveEntrySubmittedRate)) return slot.liveEntrySubmittedRate;
  return null;
}

function primaryGrossBasisMid(slot: SlotRow | null | undefined) {
  const comparison = primaryComparison(slot);
  if (comparison?.grossBasisMid != null && Number.isFinite(comparison.grossBasisMid)) return comparison.grossBasisMid;
  if (slot?.entryMid != null && Number.isFinite(slot.entryMid)) return slot.entryMid;
  return null;
}

function primaryNowBid(slot: SlotRow | null | undefined) {
  const comparison = primaryComparison(slot);
  if (comparison?.nowBid != null && Number.isFinite(comparison.nowBid)) return comparison.nowBid;
  if (slot?.nowBid != null && Number.isFinite(slot.nowBid)) return slot.nowBid;
  return null;
}

function primaryComparisonScopeLabel(slot: SlotRow | null | undefined) {
  if (!slot) return "-";
  if (getSecondaryRows(slot).length) {
    return "Top metrics here are the Primary. Secondary trades below reconcile separately.";
  }
  return "Primary-only slot metrics.";
}

function primaryFillProofLabel(slot: SlotRow | null | undefined) {
  const comparison = primaryComparison(slot);
  if (comparison?.exactFillKnown === true) {
    return `Exact fill | ${enumLabel(comparison.fillStatus)}`;
  }
  if (comparison?.fillStatus) {
    return `Pending exact fill | ${enumLabel(comparison.fillStatus)}`;
  }
  return "-";
}

function primaryHasExactFillProof(slot: SlotRow | null | undefined) {
  const comparison = primaryComparison(slot);
  if (comparison?.exactFillKnown === true) return true;
  const fillStatus = String(slot?.liveEntryFillStatus ?? comparison?.fillStatus ?? "").trim().toUpperCase();
  if (fillStatus === "CONFIRMED") return true;
  return (
    slot?.liveEntryActualAud != null &&
    Number.isFinite(slot.liveEntryActualAud) &&
    slot.liveEntryActualAud > 0 &&
    slot?.liveEntryActualCoinQty != null &&
    Number.isFinite(slot.liveEntryActualCoinQty) &&
    slot.liveEntryActualCoinQty > 0
  );
}

function primaryFeeFrictionLabel(slot: SlotRow | null | undefined) {
  const comparison = primaryComparison(slot);
  const parts: string[] = [];
  if (slot?.frictionModel) parts.push(slot.frictionModel);
  if (comparison?.roundTripFeeBps != null && Number.isFinite(comparison.roundTripFeeBps)) {
    parts.push(`${bpsPctLabel(comparison.roundTripFeeBps)} round-trip fee`);
  } else if (slot?.feeBps != null && Number.isFinite(slot.feeBps)) {
    parts.push(`${bpsPctLabel(Number(slot.feeBps) * 2)} round-trip fee`);
  }
  return parts.length ? parts.join(" | ") : "-";
}

function comparisonNowMid(comparison: ExecutionComparison | null | undefined, fallback: number | null | undefined) {
  if (comparison?.nowMid != null && Number.isFinite(comparison.nowMid)) return comparison.nowMid;
  if (fallback != null && Number.isFinite(fallback)) return fallback;
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

const LVL4_TRAIL_FALLBACK_PCT = 0.03;

function primaryLvl4TrailFloorBid(slot: SlotRow) {
  const peakBid = slot.peakBid;
  if (!(peakBid != null && Number.isFinite(peakBid) && Number(peakBid) > 0)) return null;
  return Number(peakBid) * (1 - LVL4_TRAIL_FALLBACK_PCT);
}

function primaryLvl4NetTrailFloorPct(slot: SlotRow) {
  if (slot.level !== 4) return null;
  const floorPct = primaryDecision(slot)?.exitFloorPct ?? primaryExitFloorPct(slot);
  return floorPct != null && Number.isFinite(floorPct) ? Number(floorPct) : null;
}

function primaryLvl4TrailBufferPct(slot: SlotRow) {
  const floorBid = primaryLvl4TrailFloorBid(slot);
  const nowBid = primaryComparison(slot)?.nowBid ?? slot.nowBid;
  if (
    !(floorBid != null && Number.isFinite(floorBid) && floorBid > 0) ||
    !(nowBid != null && Number.isFinite(nowBid) && Number(nowBid) > 0)
  ) {
    return null;
  }
  return ((Number(nowBid) - floorBid) / Number(nowBid)) * 100;
}

function primaryLvl4NetTrailBufferPct(slot: SlotRow) {
  const floorPct = primaryLvl4NetTrailFloorPct(slot);
  const liveNet = liveParentNetPct(slot);
  if (
    !(floorPct != null && Number.isFinite(floorPct)) ||
    !(liveNet != null && Number.isFinite(liveNet))
  ) {
    return null;
  }
  return Number(liveNet) - Number(floorPct);
}

function primaryTrailLabel(slot: SlotRow) {
  if (slot.level === 4) return "LVL4 armed dual trail";
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
  const lvl4FloorBid = primaryLvl4TrailFloorBid(slot);
  const lvl4FloorNet = primaryLvl4NetTrailFloorPct(slot);
  if (slot.level === 4) {
    const parts: string[] = [];
    if (lvl4FloorBid != null && Number.isFinite(lvl4FloorBid)) {
      parts.push(`Bid ${fmt(lvl4FloorBid)}`);
    }
    if (lvl4FloorNet != null && Number.isFinite(lvl4FloorNet)) {
      parts.push(`Net ${pctNum(lvl4FloorNet)}`);
    }
    if (parts.length) return parts.join(" | ");
  }
  if (slot.levelTrailFloorPct != null && Number.isFinite(slot.levelTrailFloorPct)) {
    return pctNum(slot.levelTrailFloorPct);
  }
  if (slot.level != null && slot.level >= 1 && slot.level <= 3) return "Static lock only";
  return "Not armed";
}

function primaryTrailPeakLabel(slot: SlotRow) {
  if (slot.level === 4) {
    const parts: string[] = [];
    if (slot.peakBid != null && Number.isFinite(slot.peakBid)) {
      parts.push(`Bid ${fmt(slot.peakBid)}`);
    }
    if (slot.levelTrailPeakNetPct != null && Number.isFinite(slot.levelTrailPeakNetPct)) {
      parts.push(`Net ${pctNum(slot.levelTrailPeakNetPct)}`);
    }
    if (parts.length) return parts.join(" | ");
  }
  if (slot.levelTrailPeakNetPct != null && Number.isFinite(slot.levelTrailPeakNetPct)) {
    return pctNum(slot.levelTrailPeakNetPct);
  }
  if (slot.level === 4) return "Awaiting peak";
  return "No peak yet";
}

function primaryTrailFloorTitle(slot: SlotRow) {
  return slot.level === 4 ? "Trail Floors" : "Trail Floor";
}

function primaryTrailPeakTitle(slot: SlotRow) {
  return slot.level === 4 ? "Trail Peaks" : "Trail Peak Net";
}

function primaryLvl4BidBufferLabel(slot: SlotRow) {
  const bufferPct = primaryLvl4TrailBufferPct(slot);
  if (!(bufferPct != null && Number.isFinite(bufferPct))) return "-";
  return bufferPct >= 0 ? `${pctNum(bufferPct)} to exit` : `${pctNum(Math.abs(bufferPct))} below`;
}

function primaryLvl4NetBufferLabel(slot: SlotRow) {
  const bufferPct = primaryLvl4NetTrailBufferPct(slot);
  if (!(bufferPct != null && Number.isFinite(bufferPct))) return "-";
  return bufferPct >= 0 ? `${pctNum(bufferPct)} above` : `${pctNum(Math.abs(bufferPct))} below`;
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
    parent_net_confirm: "Parent executable net confirmation",
    secondary_entry_cost: "Secondary entry is not cheaper",
    secondary_entry_cost_quote: "Secondary quote is not cheaper",
    gross_band: "Gross band not reached",
    bidask_unresolved: "Bid/ask unavailable",
    live_bidask_required: "Live bid/ask required",
    drawdown_not_ready: "Drawdown not ready",
    max_drawdown_context_rebase: "Fresh context started after deep move",
    tracking_age_context_rebase: "Fresh context started after old setup expired",
    tracking_context_rebased: "Fresh entry context started",
    bounce_not_ready: "Bounce not ready",
    trend_not_ready: "Trend not ready",
    priority_score_below_min: "Priority score below minimum",
    wallet_basis_unavailable: "Wallet basis unavailable",
    wallet_basis_avg_cost_unresolved: "Wallet average cost unavailable",
    wallet_source_not_in_profit: "Wallet source not in profit",
    too_profitable_to_rotate: "Source is too profitable to rotate",
    realized_loss_exit_disabled: "Loss exit disabled by policy",
    max_realized_loss_exceeded: "Maximum realized loss exceeded",
    primary_requires_secondary_reserve: "Primary requires secondary reserve",
    first_secondary_reserve_pending: "First secondary reserve pending",
    primary_aud_unavailable: "Primary AUD unavailable",
    primary_pool_exhausted: "Primary pool exhausted",
    primary_pool_blocked: "Primary pool blocked",
    pair_floor_not_funded: "Pair floor not funded",
    pair_secondary_reserve_held: "Secondary reserve held",
    secondary_parent_not_active: "Secondary parent not active",
    secondary_aud_unavailable: "Secondary AUD unavailable",
  };

  if (mapped[normalized]) return mapped[normalized];
  return enumLabel(reason);
}

function reserveAdvisoryLabel(reason: string | null | undefined) {
  const normalized = String(reason || "").trim().toLowerCase();
  if (normalized === "primary_requires_secondary_reserve") return "First-secondary funding is below its advisory target";
  if (normalized === "first_secondary_reserve_pending") return "First-secondary funding is still pending (advisory)";
  return reasonLabel(reason);
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

function capitalExposureAttentionRows(capital: PublicCapitalResponse | null | undefined) {
  const list = Array.isArray(capital?.coins) ? capital.coins.slice() : [];
  return list
    .filter((coin) => coin.exposureAttention === true)
    .sort((a, b) => {
      const aSeverity = Math.max(Math.abs(a.quantityDriftAud ?? 0), Math.abs(a.secondaryWalletCoverage?.shortageAud ?? 0));
      const bSeverity = Math.max(Math.abs(b.quantityDriftAud ?? 0), Math.abs(b.secondaryWalletCoverage?.shortageAud ?? 0));
      return bSeverity - aSeverity;
    });
}

function capitalExposureAttentionCount(capital: PublicCapitalResponse | null | undefined) {
  const explicit = Number(capital?.exposure?.attentionCount);
  if (Number.isFinite(explicit) && explicit >= 0) return explicit;
  return capitalExposureAttentionRows(capital).length;
}

function capitalCoinForSlot(
  capital: PublicCapitalResponse | null | undefined,
  slot: SlotRow | null | undefined
) {
  const coin = String(slot?.coin || "-").toUpperCase();
  if (!coin || coin === "-") return null;
  return (capital?.coins ?? []).find((row) => String(row.coin || "").toUpperCase() === coin) ?? null;
}

function quantityDriftLabel(delta: number | null | undefined) {
  if (delta == null || !Number.isFinite(delta) || Math.abs(delta) < 0.01) return "balanced";
  return delta > 0 ? `${moneyAud(delta)} surplus` : `${moneyAud(Math.abs(delta))} short`;
}

function valueVsCostLabel(delta: number | null | undefined) {
  if (delta == null || !Number.isFinite(delta) || Math.abs(delta) < 0.01) return "at cost";
  return delta > 0 ? `${moneyAud(delta)} above cost` : `${moneyAud(Math.abs(delta))} below cost`;
}

function coinValueVsCost(coin: PublicCapitalCoin | null | undefined) {
  return coin?.valueVsTrackedCostAud ?? coin?.untrackedAudApprox ?? null;
}

function secondaryCoverageAttentionLabel(coverage: SecondaryWalletCoverage | null | undefined) {
  if (!coverage || coverage.attention !== true) return null;
  const status = String(coverage.status || "").toUpperCase();
  const duplicateCount = Number(coverage.duplicateSellMismatchCount);
  const shortageAud = Number(coverage.shortageAud);
  const parts: string[] = [];

  if (Number.isFinite(duplicateCount) && duplicateCount > 0) {
    parts.push(`${duplicateCount} duplicate completed secondary sell${duplicateCount === 1 ? "" : "s"} need reconciliation`);
  }

  if (status === "SHORTAGE" || (Number.isFinite(shortageAud) && shortageAud > 0.01)) {
    parts.push(`wallet coverage is short by ${moneyAud(shortageAud)}`);
  }

  if (!parts.length && status) parts.push(`secondary coverage status ${enumLabel(status)}`);
  return parts.length ? parts.join("; ") : null;
}

function secondaryReconciliationAttentionCount(slot: SlotRow | null | undefined) {
  const duplicateCount = Number(slot?.secondary?.duplicateSellMismatchCount);
  if (Number.isFinite(duplicateCount) && duplicateCount > 0) return duplicateCount;
  const fallback = Number(slot?.secondary?.reconciliationAttention?.duplicateSellMismatchCount);
  return Number.isFinite(fallback) && fallback > 0 ? fallback : 0;
}

function slotHasSecondaryReconciliationAttention(slot: SlotRow | null | undefined) {
  return (
    secondaryReconciliationAttentionCount(slot) > 0 ||
    slot?.secondary?.reconciliationAttention?.hasDuplicateSellMismatch === true
  );
}

function secondaryReconciliationWarningLabel(
  slot: SlotRow | null | undefined,
  capitalCoin?: PublicCapitalCoin | null
) {
  const coverageLabel = secondaryCoverageAttentionLabel(capitalCoin?.secondaryWalletCoverage ?? null);
  const duplicateCount = secondaryReconciliationAttentionCount(slot);
  const parts: string[] = [];

  if (duplicateCount > 0 && !coverageLabel?.toLowerCase().includes("duplicate")) {
    parts.push(`${duplicateCount} duplicate secondary sell mismatch${duplicateCount === 1 ? "" : "es"}`);
  }
  if (coverageLabel) parts.push(coverageLabel);
  return parts.length ? `Secondary reconciliation warning: ${parts.join("; ")}.` : null;
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

function primaryExitOrderData(slot: SlotRow | null | undefined): ExitOrderState | null {
  const structured = primaryDecision(slot)?.exitOrder;
  if (structured && Object.values(structured).some((value) => value != null && value !== "")) return structured;
  if (!slot) return null;
  const hasFlat =
    slot.parentExitOrderState ||
    slot.parentExitOrderRate != null ||
    slot.parentExitOrderTargetNetPct != null ||
    slot.parentExitOrderLastAction;
  if (!hasFlat) return null;
  return {
    state: slot.parentExitOrderState,
    id: slot.parentExitOrderId,
    rate: slot.parentExitOrderRate,
    targetNetPct: slot.parentExitOrderTargetNetPct,
    expectedAud: slot.parentExitOrderExpectedAud,
    lastAction: slot.parentExitOrderLastAction,
    repriceCount: slot.parentExitOrderRepriceCount,
    lastError: slot.parentExitOrderLastError,
    dryRun: slot.parentExitOrderDryRun,
    targetProfitAud: slot.parentExitOrderTargetProfitAud,
    distancePct: slot.parentExitOrderDistancePct,
    updatedAt: slot.parentExitOrderUpdatedAt,
    nextActionAt: slot.parentExitOrderNextActionAt,
    blockReason: slot.parentExitOrderBlockReason,
  };
}

function primaryTrackingState(slot: SlotRow | null | undefined) {
  return String(slot?.trackingState || "").trim().toUpperCase();
}

function isPrimaryNoLossWatch(slot: SlotRow | null | undefined) {
  const tracking = primaryTrackingState(slot);
  const gate = String(primaryDecision(slot)?.exitGateState ?? slot?.parentExitGateState ?? "").trim().toUpperCase();
  return tracking === "PARENT_EXIT_NO_LOSS_WATCH" || tracking === "PARENT_EXIT_FLOOR_WATCH" || gate === "PARENT_EXIT_NO_LOSS_WATCH";
}

function isPrimaryNoLossReady(slot: SlotRow | null | undefined) {
  const tracking = primaryTrackingState(slot);
  const gate = String(primaryDecision(slot)?.exitGateState ?? slot?.parentExitGateState ?? "").trim().toUpperCase();
  return tracking === "PARENT_EXIT_NO_LOSS_READY" || gate === "PARENT_EXIT_NO_LOSS_READY";
}

function isPrimaryNoLossRecovery(slot: SlotRow | null | undefined) {
  const tracking = primaryTrackingState(slot);
  return tracking === "NO_LOSS_EXIT_MISSED_WAIT_RECOVERY" || tracking === "PARENT_EXIT_WAIT_PROFIT_RECOVERY";
}

function primaryExitOrderStateValue(slot: SlotRow | null | undefined) {
  const order = primaryExitOrderData(slot);
  return String(order?.state || order?.lastAction || "").trim().toUpperCase();
}

function primaryExitOrderReasonValue(slot: SlotRow | null | undefined) {
  const order = primaryExitOrderData(slot);
  return String(order?.blockReason || slot?.parentExitOrderBlockReason || "").trim().toLowerCase();
}

function isPrimaryExitOrderClearing(slot: SlotRow | null | undefined) {
  const tracking = primaryTrackingState(slot);
  const orderState = primaryExitOrderStateValue(slot);
  const reason = primaryExitOrderReasonValue(slot);

  return (
    tracking === "PARENT_EXIT_ORDER_CANCEL_NO_LOSS_WATCH" ||
    tracking === "PARENT_EXIT_ORDER_CANCEL_PRE_FLOOR" ||
    tracking === "PARENT_EXIT_ORDER_CANCEL_FLOOR_BLOCKED" ||
    tracking === "PARENT_EXIT_ORDER_CANCEL_FLOOR" ||
    tracking === "PARENT_EXIT_ORDER_CANCEL_SUBSLOT" ||
    orderState === "CANCEL_REQUESTED" ||
    orderState === "CANCELING" ||
    orderState === "CANCELLING" ||
    reason === "floor_exit_order_blocks_executable"
  );
}

function isPrimaryFloorOrderClearing(slot: SlotRow | null | undefined) {
  const tracking = primaryTrackingState(slot);
  const reason = primaryExitOrderReasonValue(slot);
  return (
    tracking === "PARENT_EXIT_ORDER_CANCEL_NO_LOSS_WATCH" ||
    tracking === "PARENT_EXIT_ORDER_CANCEL_PRE_FLOOR" ||
    tracking === "PARENT_EXIT_ORDER_CANCEL_FLOOR_BLOCKED" ||
    tracking === "PARENT_EXIT_ORDER_CANCEL_FLOOR" ||
    reason === "primary_no_loss_watch" ||
    reason === "primary_floor_watch" ||
    reason === "floor_exit_order_blocks_executable"
  );
}

function primaryFloorBreached(slot: SlotRow | null | undefined) {
  if (!slot) return false;
  const floorPct = primaryDecision(slot)?.exitFloorPct ?? primaryExitFloorPct(slot);
  const liveNet = liveParentNetPct(slot);
  return (
    isHoldingFamilyState(slot.state) &&
    floorPct != null &&
    Number.isFinite(floorPct) &&
    liveNet != null &&
    Number.isFinite(liveNet) &&
    Number(liveNet) < Number(floorPct)
  );
}

function primaryExitOrderClearingLabel(slot: SlotRow | null | undefined) {
  if (!slot) return "Clearing tracked sell order";
  if (primaryTrackingState(slot) === "PARENT_EXIT_ORDER_CANCEL_NO_LOSS_WATCH") {
    return "Canceling tracked sell order before no-loss exit retry";
  }
  if (primaryTrackingState(slot) === "PARENT_EXIT_ORDER_CANCEL_PRE_FLOOR") {
    return "Canceling tracked sell order before floor-watch harvest";
  }
  if (primaryTrackingState(slot) === "PARENT_EXIT_ORDER_CANCEL_SUBSLOT") {
    return "Clearing parent sell order while secondary resolves";
  }
  if (isPrimaryFloorOrderClearing(slot)) {
    return "Canceling tracked sell order so the floor exit can retry next tick";
  }
  return "Clearing tracked sell order before retry";
}

function primaryLockPostureLabel(slot: SlotRow | null | undefined) {
  if (!slot) return "-";
  const floorPct = primaryDecision(slot)?.exitFloorPct ?? primaryExitFloorPct(slot);
  const liveNet = liveParentNetPct(slot);
  const levelLabel = slot.level ? `LVL${slot.level}` : "LVL";

  if (!(floorPct != null && Number.isFinite(floorPct))) return "-";

  if (isPrimaryExitOrderClearing(slot)) {
    return `${levelLabel} floor held at ${pctNum(floorPct)} while the tracked order clears.`;
  }

  if (liveNet != null && Number.isFinite(liveNet) && Number(liveNet) < Number(floorPct)) {
    return `${levelLabel} floor is breached; lock remains held while executable exit protection waits.`;
  }

  return `${levelLabel} floor held at ${pctNum(floorPct)}.`;
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

function primaryEntryTargetAudValue(slot: SlotRow | null | undefined) {
  const candidates = [
    slot?.primaryEntryTargetAud,
    slot?.primary?.entry?.targetAud,
    primaryReporting(slot)?.entryTargetAud,
    slot?.candidateAudNeeded,
    slot?.unitAud,
  ];
  for (const value of candidates) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function primaryEntryRequestedAudValue(slot: SlotRow | null | undefined) {
  const candidates = [
    slot?.primaryEntryRequestedAud,
    slot?.primary?.entry?.requestedAud,
    primaryReporting(slot)?.entryRequestedAud,
    slot?.liveEntryRequestedAud,
    slot?.entryAud,
  ];
  for (const value of candidates) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

type PrimaryEntryFundingState = "done" | "pending" | "blocked";

type PrimaryEntryFundingStatus = {
  label: string;
  milestoneLabel: string;
  state: PrimaryEntryFundingState;
  rawReason?: string | null;
  title?: string | null;
};

function primaryEntryFundingStatus(slot: SlotRow | null | undefined): PrimaryEntryFundingStatus {
  const allocationState = String(slot?.candidateAllocationState || "").toUpperCase();
  const explicitAllocationBlocked = String(slot?.candidateAllocationBlockedReason || "").trim();
  const priorityBlocked = String(slot?.candidatePriorityBlockedReason || "").trim();
  const priorityAllocationBlocked = [
    "primary_requires_secondary_reserve",
    "first_secondary_reserve_pending",
    "primary_aud_unavailable",
    "primary_pool_exhausted",
    "primary_pool_blocked",
    "pair_floor_not_funded",
    "pair_secondary_reserve_held",
  ].includes(priorityBlocked.toLowerCase())
    ? priorityBlocked
    : "";
  const allocationBlocked = explicitAllocationBlocked || priorityAllocationBlocked;
  const reserveMode = String(slot?.candidateAllocationReserveMode || "").trim().toUpperCase();
  const reserveAdvisory = String(slot?.candidateAllocationReserveAdvisoryReason || "").trim();
  const titleParts = [
    allocationState ? `allocation=${allocationState}` : null,
    allocationBlocked ? `blocked=${allocationBlocked}` : null,
    reserveMode ? `reserveMode=${reserveMode}` : null,
    reserveAdvisory ? `reserveAdvisory=${reserveAdvisory}` : null,
  ].filter(Boolean);
  const title = titleParts.length ? titleParts.join(" | ") : null;

  if (allocationBlocked) {
    return {
      label: `Blocked: ${reasonLabel(allocationBlocked)}`,
      milestoneLabel: "Capital blocked",
      state: "blocked",
      rawReason: allocationBlocked,
      title,
    };
  }
  if (allocationState === "PAIR_FLOOR_NOT_FUNDED" || allocationState === "PRIMARY_POOL_BLOCKED") {
    const rawReason = allocationState === "PAIR_FLOOR_NOT_FUNDED" ? "pair_floor_not_funded" : "primary_pool_blocked";
    return {
      label: `Blocked: ${reasonLabel(rawReason)}`,
      milestoneLabel: "Capital blocked",
      state: "blocked",
      rawReason,
      title: title || rawReason,
    };
  }
  if (allocationState === "SECONDARY_RESERVE_HELD") {
    return {
      label: "Secondary reserve held",
      milestoneLabel: "Capital blocked",
      state: "blocked",
      rawReason: "pair_secondary_reserve_held",
      title: title || "pair_secondary_reserve_held",
    };
  }
  if (allocationState === "PRIMARY_ALLOWED") {
    if (reserveAdvisory) {
      return {
        label: `Primary allowed; ${reserveAdvisoryLabel(reserveAdvisory)}`,
        milestoneLabel: "Capital allowed",
        state: "done",
        rawReason: reserveAdvisory,
        title,
      };
    }
    return {
      label: "Primary allowed",
      milestoneLabel: "Capital allowed",
      state: "done",
      rawReason: null,
      title,
    };
  }

  const state = String(slot?.candidateFundingState || "").toUpperCase();
  const needed = Number(slot?.candidateAudNeeded);
  const available = Number(slot?.candidateAudAvailable);
  if (state === "INSUFFICIENT" && Number.isFinite(needed) && Number.isFinite(available)) {
    return {
      label: `${moneyAud(available)} free / ${moneyAud(needed)} needed`,
      milestoneLabel: "Funding blocked",
      state: "blocked",
      rawReason: "insufficient_aud_for_entry_target",
      title: title || "insufficient_aud_for_entry_target",
    };
  }
  if (["INVALID", "UNKNOWN", "INSUFFICIENT"].includes(state)) {
    return {
      label: state ? reasonLabel(state.toLowerCase()) : "Funding blocked",
      milestoneLabel: "Funding blocked",
      state: "blocked",
      rawReason: state.toLowerCase(),
      title: title || state,
    };
  }
  if (state) {
    return {
      label: enumLabel(state),
      milestoneLabel: "Funding ready",
      state: "done",
      rawReason: null,
      title,
    };
  }
  return {
    label: "Funding not checked yet",
    milestoneLabel: "Funding pending",
    state: "pending",
    rawReason: null,
    title,
  };
}

function primaryEntryFundingLabel(slot: SlotRow | null | undefined) {
  return primaryEntryFundingStatus(slot).label;
}

function entryAllocationModeLabel(allocation: EntryAllocation | null | undefined) {
  if (!allocation) return "Not published";
  const mode = String(allocation.mode || "RAW_AUD").toUpperCase();
  return allocation.enabled ? mode : `${mode} inactive`;
}


function isAdvisoryFirstSecondaryReserve(allocation: EntryAllocation | null | undefined) {
  return (
    allocation?.firstSecondaryReserveAdvisory === true ||
    String(allocation?.firstSecondaryReserveMode || "").trim().toUpperCase() === "ADVISORY"
  );
}

function secondaryReserveMetricLabel(allocation: EntryAllocation | null | undefined, hardLabel: string) {
  return isAdvisoryFirstSecondaryReserve(allocation) ? "Advisory Coverage Need" : hardLabel;
}
function entryAllocationAllowedLabel(value: boolean | null | undefined) {
  if (value === true) return "YES";
  if (value === false) return "NO";
  return "-";
}

function entryAllocationGateLabel(value: boolean | null | undefined, blockedReason?: string | null) {
  if (value === true) return "Allowed";
  if (value === false) return blockedReason ? `Blocked: ${reasonLabel(blockedReason)}` : "Blocked";
  return "Not published";
}

function isRailPoolAllocation(allocation: EntryAllocation | null | undefined) {
  return allocation?.enabled === true && String(allocation.mode || "").toUpperCase() === "RAIL_POOL";
}

function compactAgeLabel(msSince: number | null | undefined) {
  if (msSince == null || !Number.isFinite(msSince)) return "-";
  if (msSince < 60000) return msToShortLabel(msSince);
  return ageLabel(msSince);
}

function writeGateLabel(meta: PublicMetaResponse | null | undefined) {
  if (meta?.gates?.writeEnabled === true) return "Enabled";
  if (meta?.gates?.writeEnabled === false) return "Disabled";
  return "Unknown";
}

function allocationBlockReason(allocation: EntryAllocation | null | undefined) {
  return allocation?.blockReason ?? allocation?.primaryBlockReason ?? allocation?.secondaryBlockReason ?? null;
}

function countLabel(n: number | null | undefined, fallback = "-") {
  if (n == null || !Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(Number(n))).toLocaleString();
}

function multipliedCount(a: number | null | undefined, b: number | null | undefined) {
  if (a == null || b == null || !Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.floor(Number(a) * Number(b)));
}

function pairAwareAvailableAud(capital: PublicCapitalResponse | null | undefined) {
  const allocation = capital?.entryAllocation;
  if (allocation?.enabled === true) return allocation.primarySpendableAud;
  return capital?.audAvailable;
}

function pairAwareCapitalSubline(capital: PublicCapitalResponse | null | undefined) {
  const allocation = capital?.entryAllocation;
  if (isRailPoolAllocation(allocation)) {
    return `Primary ${moneyAud(allocation?.primarySpendableAud)} free / ${moneyAud(
      allocation?.primaryPoolAud
    )} pool | Secondary ${moneyAud(allocation?.secondarySpendableAud)} rail`;
  }
  if (allocation?.enabled === true) {
    return `Raw ${moneyAud(capital?.audAvailable)} | Pair ${moneyAud(allocation.pairUnitAud)} | Reserve ${moneyAud(
      allocation.secondaryReservedAud
    )}`;
  }
  return `Wallet ${moneyAud(capital?.walletAudValue)} | Movable ${moneyAud(capital?.movableAudEstimate)}`;
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
  const localLiveCount = countActiveSecondaries(slot);
  if (getSecondaryRows(slot).length) return localLiveCount;
  const liveCount = secondarySummaryData(slot)?.liveCount;
  if (liveCount != null && Number.isFinite(liveCount)) return liveCount;
  return localLiveCount;
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
    s === "TRACKING_REBASED" ||
    s === "ARMED" ||
    s === "DRAWDOWN_SEEN" ||
    s === "REVERSAL_CONFIRMING" ||
    s === "DEPLOYING" ||
    s === "BUY_SUBMITTING" ||
    s === "BUY_SUBMITTED" ||
    s === "BUY_LOCK_SUBMITTED" ||
    s === "SELL_SUBMITTED" ||
    s === "PARENT_EXIT_NO_LOSS_WATCH" ||
    s === "NO_LOSS_EXIT_MISSED_WAIT_RECOVERY" ||
    s === "PARENT_EXIT_ORDER_CANCEL_NO_LOSS_WATCH" ||
    s === "PARENT_EXIT_FLOOR_WATCH" ||
    s === "PARENT_EXIT_WAIT_PROFIT_RECOVERY" ||
    s === "PARENT_EXIT_ORDER_CANCEL_PRE_FLOOR" ||
    s === "PARENT_EXIT_ORDER_CANCEL_FLOOR_BLOCKED" ||
    s === "PARENT_EXIT_ORDER_CANCEL_FLOOR" ||
    s === "PARENT_EXIT_ORDER_CANCEL_SUBSLOT" ||
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
      subslotIntegrityState: slot.subslotIntegrityState,
      subslotExcludedFromOccupancy: slot.subslotExcludedFromOccupancy,
      subslotEntryLaw: slot.subslotEntryLaw,
      subslotTriggerBasis: slot.subslotTriggerBasis,
      subslotTriggerBandIndex: slot.subslotTriggerBandIndex,
      subslotTriggerParentNetPct: slot.subslotTriggerParentNetPct,
      subslotTriggerBandPct: slot.subslotTriggerBandPct,
      subslotTriggerParentGrossPct: slot.subslotTriggerParentGrossPct,
      subslotTriggerParentExecutableNetPct: slot.subslotTriggerParentExecutableNetPct,
      subslotTriggerParentTriggerPct: slot.subslotTriggerParentTriggerPct,
      subslotTriggerGrossBandOk: slot.subslotTriggerGrossBandOk,
      subslotTriggerSpreadOk: slot.subslotTriggerSpreadOk,
      subslotTriggerNetConfirmPct: slot.subslotTriggerNetConfirmPct,
      subslotTriggerNetConfirmOk: slot.subslotTriggerNetConfirmOk,
      subslotEntryCostRequired: slot.subslotEntryCostRequired,
      subslotEntryCostKnown: slot.subslotEntryCostKnown,
      subslotEntryCostOk: slot.subslotEntryCostOk,
      subslotEntryParentRate: slot.subslotEntryParentRate,
      subslotEntrySecondaryRate: slot.subslotEntrySecondaryRate,
      subslotEntryParentAllInRate: slot.subslotEntryParentAllInRate,
      subslotEntrySecondaryAllInRate: slot.subslotEntrySecondaryAllInRate,
      subslotEntryDiscountPct: slot.subslotEntryDiscountPct,
      subslotEntryMinDiscountPct: slot.subslotEntryMinDiscountPct,
      subslotEntryLawWouldPass: slot.subslotEntryLawWouldPass,
      subslotEntryLawWouldBlock: slot.subslotEntryLawWouldBlock,
      subslotEntryLawBlockReason: slot.subslotEntryLawBlockReason,
      subslotHybridNetConfirmOk: slot.subslotHybridNetConfirmOk,
      subslotHybridEntryCostRequired: slot.subslotHybridEntryCostRequired,
      subslotHybridEntryCostKnown: slot.subslotHybridEntryCostKnown,
      subslotHybridEntryCostOk: slot.subslotHybridEntryCostOk,
      subslotHybridParentEntryRate: slot.subslotHybridParentEntryRate,
      subslotHybridSecondaryEntryRate: slot.subslotHybridSecondaryEntryRate,
      subslotHybridParentAllInEntryRate: slot.subslotHybridParentAllInEntryRate,
      subslotHybridSecondaryAllInEntryRate: slot.subslotHybridSecondaryAllInEntryRate,
      subslotHybridEntryDiscountPct: slot.subslotHybridEntryDiscountPct,
      subslotHybridMinEntryDiscountPct: slot.subslotHybridMinEntryDiscountPct,
      subslotHybridWouldPass: slot.subslotHybridWouldPass,
      subslotHybridWouldBlock: slot.subslotHybridWouldBlock,
      subslotHybridWouldBlockReason: slot.subslotHybridWouldBlockReason,
      subslotTriggerOpenOk: slot.subslotTriggerOpenOk,
      subslotTriggerBlockReason: slot.subslotTriggerBlockReason,
      subslotEntryParentNetPct: slot.subslotEntryParentNetPct,
      subslotEntryParentGrossPct: slot.subslotEntryParentGrossPct,
      subslotEntryParentTriggerPct: slot.subslotEntryParentTriggerPct,
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
      subslotEntryQuoteRate: slot.subslotEntryQuoteRate,
      subslotEntryQuoteAbsoluteDriftPct: slot.subslotEntryQuoteAbsoluteDriftPct,
      subslotEntryQuoteAdverseDriftPct: slot.subslotEntryQuoteAdverseDriftPct,
      subslotEntryQuoteUsed: slot.subslotEntryQuoteUsed,
      subslotEntryQuoteAdjusted: slot.subslotEntryQuoteAdjusted,
      subslotEntryMarketAgeMs: slot.subslotEntryMarketAgeMs,
      subslotEntryMarketMaxAgeMs: slot.subslotEntryMarketMaxAgeMs,
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
      subslotExitOrderState: slot.subslotExitOrderState,
      subslotExitOrderRate: slot.subslotExitOrderRate,
      subslotExitOrderTargetNetPct: slot.subslotExitOrderTargetNetPct,
      subslotExitOrderExpectedAud: slot.subslotExitOrderExpectedAud,
      subslotExitOrderLastAction: slot.subslotExitOrderLastAction,
      subslotExitOrderRepriceCount: slot.subslotExitOrderRepriceCount,
      subslotExitOrderLastError: slot.subslotExitOrderLastError,
      subslotExitOrderDryRun: slot.subslotExitOrderDryRun,
      subslotExitOrderTargetProfitAud: slot.subslotExitOrderTargetProfitAud,
      subslotExitOrderDistancePct: slot.subslotExitOrderDistancePct,
      subslotExitOrderUpdatedAt: slot.subslotExitOrderUpdatedAt,
      subslotExitOrderNextActionAt: slot.subslotExitOrderNextActionAt,
      subslotExitOrderBlockReason: slot.subslotExitOrderBlockReason,
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
      subslotExecutableExitAud: slot.subslotExecutableExitAud,
      subslotExecutableExitProfitAud: slot.subslotExecutableExitProfitAud,
      subslotExecutableExitNetPct: slot.subslotExecutableExitNetPct,
      subslotExitTriggerAt: slot.subslotExitTriggerAt,
      subslotExitTriggerReason: slot.subslotExitTriggerReason,
      subslotExitGateState: slot.subslotExitGateState,
      subslotExitGateReason: slot.subslotExitGateReason,
      subslotExitWaitGreenSince: slot.subslotExitWaitGreenSince,
      subslotBestExecutableExitNetPct: slot.subslotBestExecutableExitNetPct,
      subslotBestExecutableExitProfitAud: slot.subslotBestExecutableExitProfitAud,
      subslotExitRequiredNetPct: slot.subslotExitRequiredNetPct,
      subslotExitRequiredProfitAud: slot.subslotExitRequiredProfitAud,
      subslotEffectiveTakeProfitNetPct: slot.subslotEffectiveTakeProfitNetPct,
      subslotGreenStallTicks: slot.subslotGreenStallTicks,
    },
  ];
}

function getSecondaryRows(slot: SlotRow) {
  return getSubslots(slot).filter((subslot) => !isExcludedSecondaryOccupancy(subslot));
}

function getPrimarySubslot(slot: SlotRow): SubslotRow | null {
  const subslots = getSecondaryRows(slot);
  return subslots.length ? subslots[0] : null;
}

function secondaryIntegrityState(subslot: SubslotRow | null | undefined) {
  return String(subslot?.subslotIntegrityState || "").trim().toUpperCase();
}

function isExcludedSecondaryOccupancy(subslot: SubslotRow | null | undefined) {
  const integrity = secondaryIntegrityState(subslot);
  return subslot?.subslotExcludedFromOccupancy === true ||
    integrity === "QUARANTINED_DUST_FILL" ||
    integrity === "CLOSED_RECONCILE_REMNANT";
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

function getCurrentSecondaryRow(slot: SlotRow): SubslotRow | null {
  const secondaries = getSecondaryRows(slot);
  if (!secondaries.length) return null;
  const current = secondaries.filter((subslot) => {
    const state = String(subslot.subslotState || "").toUpperCase();
    if (state === "ACTIVE" || state === "BUY_SUBMITTED" || state === "SELL_SUBMITTED") return true;
    return isSubslotBusy(subslot);
  });
  if (!current.length) return null;

  return [...current].sort((a, b) => {
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
  return getCurrentSecondaryRow(slot);
}

function isSubslotBusy(subslot: SubslotRow): boolean {
  if (isExcludedSecondaryOccupancy(subslot)) return false;
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
  return getSecondaryRows(slot).filter((subslot) => String(subslot.subslotState || "").toUpperCase() === "ACTIVE");
}

function getActiveSecondaryRows(slot: SlotRow) {
  return getActiveSubslots(slot);
}

function hasPendingSubslotBuys(slot: SlotRow) {
  return getSecondaryRows(slot).some((subslot) => String(subslot.subslotState || "").toUpperCase() === "BUY_SUBMITTED");
}

function hasPendingSubslotSells(slot: SlotRow) {
  return getSecondaryRows(slot).some((subslot) => String(subslot.subslotState || "").toUpperCase() === "SELL_SUBMITTED");
}

function getSubslotOpenCount(slot: SlotRow) {
  return getSecondaryRows(slot).filter((subslot) => {
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
  return getSecondaryRows(slot).filter((subslot) => String(subslot.subslotState || "").toUpperCase() === "CLOSED").length;
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

  if (isPrimaryExitOrderClearing(slot)) return "is-deploying";

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

function finiteMetric(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function subslotDecisionData(subslot: SubslotRow | null | undefined) {
  return subslot?.decision ?? null;
}

function subslotExitOrderData(subslot: SubslotRow | null | undefined): ExitOrderState | null {
  const structured = subslotDecisionData(subslot)?.exitOrder;
  if (structured && Object.values(structured).some((value) => value != null && value !== "")) return structured;
  if (!subslot) return null;
  const hasFlat =
    subslot.subslotExitOrderState ||
    subslot.subslotExitOrderRate != null ||
    subslot.subslotExitOrderTargetNetPct != null ||
    subslot.subslotExitOrderLastAction;
  if (!hasFlat) return null;
  return {
    state: subslot.subslotExitOrderState,
    id: subslot.subslotExitOrderId,
    rate: subslot.subslotExitOrderRate,
    targetNetPct: subslot.subslotExitOrderTargetNetPct,
    expectedAud: subslot.subslotExitOrderExpectedAud,
    lastAction: subslot.subslotExitOrderLastAction,
    repriceCount: subslot.subslotExitOrderRepriceCount,
    lastError: subslot.subslotExitOrderLastError,
    dryRun: subslot.subslotExitOrderDryRun,
    targetProfitAud: subslot.subslotExitOrderTargetProfitAud,
    distancePct: subslot.subslotExitOrderDistancePct,
    updatedAt: subslot.subslotExitOrderUpdatedAt,
    nextActionAt: subslot.subslotExitOrderNextActionAt,
    blockReason: subslot.subslotExitOrderBlockReason,
  };
}

function exitOrderSummaryLabel(order: ExitOrderState | null | undefined) {
  if (!order) return "-";
  const state = String(order.state || order.lastAction || "").trim().toUpperCase();
  if (!state) return "-";
  const displayId = String(order.idMasked || order.id || "").trim();
  const hasBrokerId = order.hasBrokerId === true || displayId.length > 0;
  const dryRun = order.dryRun === true || state.startsWith("WOULD_") ? "DRY-RUN " : "";
  const brokerNote =
    !dryRun && state === "OPEN" && !hasBrokerId
      ? "PLANNED, NO BROKER ID"
      : !dryRun && (state === "RECONCILING" || state === "SUBMITTED_NO_ID") && !hasBrokerId
      ? "RECONCILING, NO BROKER ID"
      : state.replaceAll("_", " ");
  const rate = order.rate != null && Number.isFinite(order.rate) ? ` @ ${fmt(order.rate)}` : "";
  return `${dryRun}${brokerNote}${hasBrokerId && state === "OPEN" ? ` #${displayId}` : ""}${rate}`;
}

function exitOrderModeLabel(order: ExitOrderState | null | undefined) {
  if (!order) return "-";
  const state = String(order.state || order.lastAction || "").trim().toUpperCase();
  const hasBrokerId = order.hasBrokerId === true || String(order.idMasked || order.id || "").trim().length > 0;
  if (order.dryRun === true || state.startsWith("WOULD_")) return "DRY-RUN";
  if (hasBrokerId) return "LIVE BROKER";
  if (state === "PLACE_READY") return "LIVE PLAN";
  if (state === "RECONCILING" || state === "SUBMITTED_NO_ID") return "LIVE RECONCILING";
  return "LIVE PLAN";
}

function exitOrderTargetLabel(order: ExitOrderState | null | undefined) {
  if (!order) return "-";
  const parts = [
    order.targetNetPct != null && Number.isFinite(order.targetNetPct) ? `net ${pctNum(order.targetNetPct)}` : null,
    order.expectedAud != null && Number.isFinite(order.expectedAud) ? moneyAud(order.expectedAud) : null,
    order.targetProfitAud != null && Number.isFinite(order.targetProfitAud) ? `profit ${moneyAud(order.targetProfitAud)}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" | ") : "-";
}

function exitOrderDistanceLabel(order: ExitOrderState | null | undefined) {
  if (!order || order.distancePct == null || !Number.isFinite(order.distancePct)) return "-";
  if (order.distancePct <= 0) return "at or through target";
  return `${pctNum(order.distancePct)} to order`;
}

function subslotExecutableExitNetPct(subslot: SubslotRow | null | undefined) {
  return finiteMetric(subslotDecisionData(subslot)?.executableExitNetPct ?? subslot?.subslotExecutableExitNetPct);
}

function subslotExecutableExitProfitAud(subslot: SubslotRow | null | undefined) {
  return finiteMetric(subslotDecisionData(subslot)?.executableExitProfitAud ?? subslot?.subslotExecutableExitProfitAud);
}

function subslotExecutableExitAud(subslot: SubslotRow | null | undefined) {
  return finiteMetric(subslotDecisionData(subslot)?.executableExitAud ?? subslot?.subslotExecutableExitAud);
}

function subslotExitGateState(subslot: SubslotRow | null | undefined) {
  const raw = subslotDecisionData(subslot)?.exitGateState ?? subslot?.subslotExitGateState;
  return raw ? String(raw) : null;
}

function subslotExitGateReason(subslot: SubslotRow | null | undefined) {
  const raw = subslotDecisionData(subslot)?.exitGateReason ?? subslot?.subslotExitGateReason;
  return raw ? String(raw) : null;
}

function subslotExitTriggerAt(subslot: SubslotRow | null | undefined) {
  return finiteMetric(subslotDecisionData(subslot)?.exitTriggerAt ?? subslot?.subslotExitTriggerAt);
}

function subslotExitTriggerReason(subslot: SubslotRow | null | undefined) {
  const raw = subslotDecisionData(subslot)?.exitTriggerReason ?? subslot?.subslotExitTriggerReason;
  return raw ? String(raw) : null;
}

function subslotExitWaitGreenSince(subslot: SubslotRow | null | undefined) {
  return finiteMetric(subslotDecisionData(subslot)?.exitWaitGreenSince ?? subslot?.subslotExitWaitGreenSince);
}

function subslotBestExecutableExitNetPct(subslot: SubslotRow | null | undefined) {
  return finiteMetric(
    subslotDecisionData(subslot)?.exitBestExecutableNetPct ?? subslot?.subslotBestExecutableExitNetPct
  );
}

function subslotBestExecutableExitProfitAud(subslot: SubslotRow | null | undefined) {
  return finiteMetric(
    subslotDecisionData(subslot)?.exitBestExecutableProfitAud ?? subslot?.subslotBestExecutableExitProfitAud
  );
}

function subslotExitRequiredNetPct(subslot: SubslotRow | null | undefined) {
  return finiteMetric(subslotDecisionData(subslot)?.exitRequiredNetPct ?? subslot?.subslotExitRequiredNetPct);
}

function subslotExitRequiredProfitAud(subslot: SubslotRow | null | undefined) {
  return finiteMetric(
    subslotDecisionData(subslot)?.exitRequiredProfitAud ?? subslot?.subslotExitRequiredProfitAud
  );
}

function subslotEffectiveTakeProfitNetPct(subslot: SubslotRow | null | undefined) {
  return finiteMetric(subslot?.subslotEffectiveTakeProfitNetPct);
}

function subslotGreenStallTicks(subslot: SubslotRow | null | undefined) {
  return finiteMetric(subslot?.subslotGreenStallTicks);
}

function subslotEntryQuoteRate(subslot: SubslotRow | null | undefined) {
  return finiteMetric(subslot?.subslotEntryQuoteRate);
}

function subslotEntryQuoteAbsoluteDriftPct(subslot: SubslotRow | null | undefined) {
  return finiteMetric(subslot?.subslotEntryQuoteAbsoluteDriftPct);
}

function subslotEntryQuoteAdverseDriftPct(subslot: SubslotRow | null | undefined) {
  return finiteMetric(subslot?.subslotEntryQuoteAdverseDriftPct);
}

function subslotEntryMarketAgeMs(subslot: SubslotRow | null | undefined) {
  return finiteMetric(subslot?.subslotEntryMarketAgeMs);
}

function subslotEntryMarketMaxAgeMs(subslot: SubslotRow | null | undefined) {
  return finiteMetric(subslot?.subslotEntryMarketMaxAgeMs);
}

function subslotHasExitGateData(subslot: SubslotRow | null | undefined) {
  return Boolean(
    subslotExitGateState(subslot) ||
      subslotExitGateReason(subslot) ||
      subslotExitTriggerReason(subslot) ||
      subslotExecutableExitNetPct(subslot) != null ||
      subslotBestExecutableExitNetPct(subslot) != null ||
      subslotExitRequiredNetPct(subslot) != null ||
      subslotExitRequiredProfitAud(subslot) != null ||
      subslotEffectiveTakeProfitNetPct(subslot) != null ||
      subslotGreenStallTicks(subslot) != null
  );
}

function subslotHasEntryQualityData(subslot: SubslotRow | null | undefined) {
  return Boolean(
    subslotEntryQuoteRate(subslot) != null ||
      subslotEntryQuoteAbsoluteDriftPct(subslot) != null ||
      subslotEntryQuoteAdverseDriftPct(subslot) != null ||
      subslot?.subslotEntryQuoteUsed != null ||
      subslot?.subslotEntryQuoteAdjusted != null ||
      subslotEntryMarketAgeMs(subslot) != null ||
      subslotEntryMarketMaxAgeMs(subslot) != null ||
      subslotTriggerAssessment(subslot)?.entryCostOk != null ||
      subslotTriggerAssessment(subslot)?.entryDiscountPct != null ||
      subslotTriggerAssessment(subslot)?.hybridEntryCostOk != null ||
      subslotTriggerAssessment(subslot)?.hybridEntryDiscountPct != null
  );
}

function subslotExitGateStateLabel(subslot: SubslotRow | null | undefined) {
  const gateState = subslotExitGateState(subslot);
  if (gateState) return enumLabel(gateState);
  if (subslot?.subslotRecoveredConfirmed === false) return "Recovery Required";
  if (String(subslot?.subslotState || "").toUpperCase() === "ACTIVE") return "Monitoring Exit";
  return "-";
}

function subslotExitNeedsLabel(subslot: SubslotRow | null | undefined) {
  const netPct = subslotExitRequiredNetPct(subslot);
  const profitAud = subslotExitRequiredProfitAud(subslot);
  if (netPct == null && profitAud == null) return "-";
  return `${pctNum(netPct)} | ${moneyAud(profitAud)}`;
}

function subslotExecutableExitLabel(subslot: SubslotRow | null | undefined) {
  const netPct = subslotExecutableExitNetPct(subslot);
  const profitAud = subslotExecutableExitProfitAud(subslot);
  if (netPct == null && profitAud == null) return "-";
  return `${pctNum(netPct)} | ${moneyAud(profitAud)}`;
}

function subslotBestExecutableExitLabel(subslot: SubslotRow | null | undefined) {
  const netPct = subslotBestExecutableExitNetPct(subslot);
  const profitAud = subslotBestExecutableExitProfitAud(subslot);
  if (netPct == null && profitAud == null) return "-";
  return `${pctNum(netPct)} | ${moneyAud(profitAud)}`;
}

function subslotEntryQuoteStatusLabel(subslot: SubslotRow | null | undefined) {
  const used = subslot?.subslotEntryQuoteUsed;
  const adjusted = subslot?.subslotEntryQuoteAdjusted;

  if (used == null && adjusted == null) return "-";
  if (used === false) return "Snapshot entry";
  if (used === true && adjusted === true) return "Quote adjusted";
  if (used === true) return "Quote used";
  return yesNo(used);
}

function subslotEntryMarketFreshnessLabel(subslot: SubslotRow | null | undefined) {
  const ageMs = subslotEntryMarketAgeMs(subslot);
  const maxMs = subslotEntryMarketMaxAgeMs(subslot);
  if (ageMs == null && maxMs == null) return "-";
  return `${msToShortLabel(ageMs)} / ${msToShortLabel(maxMs)}`;
}

function subslotDecisionLabel(subslot: SubslotRow) {
  const sub = String(subslot.subslotState || "").toUpperCase();
  const signal = String(subslot.subslotSignalState || "").toUpperCase();
  const gateState = String(subslotExitGateState(subslot) || "").toUpperCase();
  const triggerReason = subslotExitTriggerReason(subslot);

  if (sub === "BUY_SUBMITTED") return "Entry pending";
  if (sub === "ACTIVE" && gateState === "WAIT_GREEN") return "Waiting for green exit";
  if (sub === "ACTIVE" && triggerReason) return "Exit trigger armed";
  if (sub === "ACTIVE" && subslot.subslotRecoveredConfirmed === true) return "Recovered and harvesting";
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
  if (primary) return subslotDecisionLabel(primary);
  return getSecondaryRows(slot).length ? "Awaiting primary exit" : "Idle";
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
  if (Number.isInteger(index) && index >= 1) return `Band ${index}`;
  if (subslot.subslotTriggerParentNetPct != null && Number.isFinite(subslot.subslotTriggerParentNetPct)) {
    return "Band trigger";
  }
  return "Legacy trigger";
}

function normalizedSecondaryTriggerBasis(
  subslot?: SubslotRow | null,
  subslotConfig?: ManagerStatus["subslot"] | null
) {
  const raw = String(
    subslot?.subslotEntryLaw ||
      subslot?.subslotTriggerBasis ||
      subslotConfig?.entryLaw ||
      subslotConfig?.triggerBasis ||
      "GROSS_NET_SPREAD"
  ).trim().toUpperCase();
  if (raw === "NET" || raw === "LIVE_NET" || raw === "EXECUTABLE_NET") return "NET";
  if (raw === "GROSS") return "GROSS";
  return "GROSS_NET_SPREAD";
}

function secondaryTriggerBasisLabel(
  subslot?: SubslotRow | null,
  subslotConfig?: ManagerStatus["subslot"] | null
) {
  const basis = normalizedSecondaryTriggerBasis(subslot, subslotConfig);
  if (basis === "GROSS_NET_SPREAD") return "structure + net";
  return basis === "NET" ? "net" : "gross";
}

function secondaryTriggerBasisTitleLabel(
  subslot?: SubslotRow | null,
  subslotConfig?: ManagerStatus["subslot"] | null
) {
  const basis = normalizedSecondaryTriggerBasis(subslot, subslotConfig);
  if (basis === "GROSS_NET_SPREAD") return "Structure + Net";
  return basis === "NET" ? "Net" : "Gross";
}

function secondaryParentAtOpenPct(
  subslot?: SubslotRow | null,
  subslotConfig?: ManagerStatus["subslot"] | null
) {
  return normalizedSecondaryTriggerBasis(subslot, subslotConfig) === "NET"
    ? subslot?.subslotEntryParentTriggerPct ?? subslot?.subslotEntryParentNetPct
    : subslot?.subslotEntryParentTriggerPct ?? subslot?.subslotEntryParentGrossPct;
}

function subslotTriggerAssessment(
  subslot?: SubslotRow | null,
  slot?: SlotRow | null
): SecondaryTriggerAssessment | null {
  const direct = subslot?.triggerAssessment;
  const fromSlot = slot?.secondary?.triggerAssessment;
  const source = direct ?? fromSlot ?? null;
  const hasStructured =
    !!source &&
    Object.values(source).some((value) => value != null && value !== "");

  if (hasStructured) return source;

  const basis = String(
    subslot?.subslotEntryLaw ||
      subslot?.subslotTriggerBasis ||
      slot?.subslotEntryLaw ||
      slot?.subslotTriggerBasis ||
      ""
  ).trim().toUpperCase();
  const selectedBandPct =
    subslot?.subslotTriggerBandPct ??
    subslot?.subslotTriggerParentNetPct ??
    slot?.subslotTriggerBandPct ??
    slot?.subslotTriggerParentNetPct ??
    null;
  const hasLegacy =
    !!basis ||
    selectedBandPct != null ||
    subslot?.subslotTriggerNetConfirmPct != null ||
    slot?.subslotTriggerNetConfirmPct != null;

  if (!hasLegacy) return null;

  return {
    basis: basis || null,
    parentGrossPct:
      subslot?.subslotTriggerParentGrossPct ??
      subslot?.subslotEntryParentGrossPct ??
      slot?.subslotTriggerParentGrossPct ??
      slot?.subslotEntryParentGrossPct ??
      null,
    parentNetPct:
      subslot?.subslotTriggerParentExecutableNetPct ??
      subslot?.subslotEntryParentNetPct ??
      slot?.subslotTriggerParentExecutableNetPct ??
      slot?.subslotEntryParentNetPct ??
      null,
    parentTriggerPct:
      subslot?.subslotTriggerParentTriggerPct ??
      subslot?.subslotEntryParentTriggerPct ??
      slot?.subslotTriggerParentTriggerPct ??
      slot?.subslotEntryParentTriggerPct ??
      null,
    selectedBandIndex: subslot?.subslotTriggerBandIndex ?? slot?.subslotTriggerBandIndex ?? null,
    selectedBandPct,
    grossBandOk: subslot?.subslotTriggerGrossBandOk ?? slot?.subslotTriggerGrossBandOk ?? null,
    spreadOk: subslot?.subslotTriggerSpreadOk ?? slot?.subslotTriggerSpreadOk ?? null,
    netConfirmPct: subslot?.subslotTriggerNetConfirmPct ?? slot?.subslotTriggerNetConfirmPct ?? null,
    netConfirmOk: subslot?.subslotTriggerNetConfirmOk ?? slot?.subslotTriggerNetConfirmOk ?? null,
    entryCostRequired:
      subslot?.subslotEntryCostRequired ??
      slot?.subslotEntryCostRequired ??
      subslot?.subslotHybridEntryCostRequired ??
      slot?.subslotHybridEntryCostRequired ??
      null,
    entryCostKnown:
      subslot?.subslotEntryCostKnown ??
      slot?.subslotEntryCostKnown ??
      subslot?.subslotHybridEntryCostKnown ??
      slot?.subslotHybridEntryCostKnown ??
      null,
    entryCostOk:
      subslot?.subslotEntryCostOk ??
      slot?.subslotEntryCostOk ??
      subslot?.subslotHybridEntryCostOk ??
      slot?.subslotHybridEntryCostOk ??
      null,
    parentEntryRate:
      subslot?.subslotEntryParentRate ??
      slot?.subslotEntryParentRate ??
      subslot?.subslotHybridParentEntryRate ??
      slot?.subslotHybridParentEntryRate ??
      null,
    secondaryEntryRate:
      subslot?.subslotEntrySecondaryRate ??
      slot?.subslotEntrySecondaryRate ??
      subslot?.subslotHybridSecondaryEntryRate ??
      slot?.subslotHybridSecondaryEntryRate ??
      null,
    parentAllInEntryRate:
      subslot?.subslotEntryParentAllInRate ??
      slot?.subslotEntryParentAllInRate ??
      subslot?.subslotHybridParentAllInEntryRate ??
      slot?.subslotHybridParentAllInEntryRate ??
      null,
    secondaryAllInEntryRate:
      subslot?.subslotEntrySecondaryAllInRate ??
      slot?.subslotEntrySecondaryAllInRate ??
      subslot?.subslotHybridSecondaryAllInEntryRate ??
      slot?.subslotHybridSecondaryAllInEntryRate ??
      null,
    entryDiscountPct:
      subslot?.subslotEntryDiscountPct ??
      slot?.subslotEntryDiscountPct ??
      subslot?.subslotHybridEntryDiscountPct ??
      slot?.subslotHybridEntryDiscountPct ??
      null,
    minEntryDiscountPct:
      subslot?.subslotEntryMinDiscountPct ??
      slot?.subslotEntryMinDiscountPct ??
      subslot?.subslotHybridMinEntryDiscountPct ??
      slot?.subslotHybridMinEntryDiscountPct ??
      null,
    entryLawWouldPass:
      subslot?.subslotEntryLawWouldPass ??
      slot?.subslotEntryLawWouldPass ??
      subslot?.subslotHybridWouldPass ??
      slot?.subslotHybridWouldPass ??
      null,
    entryLawWouldBlock:
      subslot?.subslotEntryLawWouldBlock ??
      slot?.subslotEntryLawWouldBlock ??
      subslot?.subslotHybridWouldBlock ??
      slot?.subslotHybridWouldBlock ??
      null,
    entryLawBlockReason:
      subslot?.subslotEntryLawBlockReason ??
      slot?.subslotEntryLawBlockReason ??
      subslot?.subslotHybridWouldBlockReason ??
      slot?.subslotHybridWouldBlockReason ??
      null,
    hybridNetConfirmOk: subslot?.subslotHybridNetConfirmOk ?? slot?.subslotHybridNetConfirmOk ?? null,
    hybridEntryCostRequired: subslot?.subslotHybridEntryCostRequired ?? slot?.subslotHybridEntryCostRequired ?? null,
    hybridEntryCostKnown: subslot?.subslotHybridEntryCostKnown ?? slot?.subslotHybridEntryCostKnown ?? null,
    hybridEntryCostOk: subslot?.subslotHybridEntryCostOk ?? slot?.subslotHybridEntryCostOk ?? null,
    hybridParentEntryRate: subslot?.subslotHybridParentEntryRate ?? slot?.subslotHybridParentEntryRate ?? null,
    hybridSecondaryEntryRate: subslot?.subslotHybridSecondaryEntryRate ?? slot?.subslotHybridSecondaryEntryRate ?? null,
    hybridParentAllInEntryRate:
      subslot?.subslotHybridParentAllInEntryRate ?? slot?.subslotHybridParentAllInEntryRate ?? null,
    hybridSecondaryAllInEntryRate:
      subslot?.subslotHybridSecondaryAllInEntryRate ?? slot?.subslotHybridSecondaryAllInEntryRate ?? null,
    hybridEntryDiscountPct: subslot?.subslotHybridEntryDiscountPct ?? slot?.subslotHybridEntryDiscountPct ?? null,
    hybridMinEntryDiscountPct:
      subslot?.subslotHybridMinEntryDiscountPct ?? slot?.subslotHybridMinEntryDiscountPct ?? null,
    hybridWouldPass: subslot?.subslotHybridWouldPass ?? slot?.subslotHybridWouldPass ?? null,
    hybridWouldBlock: subslot?.subslotHybridWouldBlock ?? slot?.subslotHybridWouldBlock ?? null,
    hybridWouldBlockReason: subslot?.subslotHybridWouldBlockReason ?? slot?.subslotHybridWouldBlockReason ?? null,
    openOk: subslot?.subslotTriggerOpenOk ?? slot?.subslotTriggerOpenOk ?? null,
    blockReason: subslot?.subslotTriggerBlockReason ?? slot?.subslotTriggerBlockReason ?? null,
  };
}

function triggerAssessmentStatusLabel(ok: boolean | null | undefined, passLabel: string, failLabel: string) {
  if (ok === true) return passLabel;
  if (ok === false) return failLabel;
  return "-";
}

function subslotGrossBandStatusLabel(subslot?: SubslotRow | null, slot?: SlotRow | null) {
  const assessment = subslotTriggerAssessment(subslot, slot);
  const bandPct = assessment?.selectedBandPct;
  const bandLabel = bandPct != null && Number.isFinite(bandPct) ? ` at ${pctNum(bandPct)}` : "";
  return triggerAssessmentStatusLabel(assessment?.grossBandOk, `Gross band hit${bandLabel}`, `Gross band waiting${bandLabel}`);
}

function subslotNetConfirmStatusLabel(subslot?: SubslotRow | null, slot?: SlotRow | null) {
  const assessment = subslotTriggerAssessment(subslot, slot);
  const threshold = assessment?.netConfirmPct;
  const thresholdLabel = threshold != null && Number.isFinite(threshold) ? ` <= ${pctNum(threshold)}` : "";
  return triggerAssessmentStatusLabel(
    assessment?.netConfirmOk ?? assessment?.hybridNetConfirmOk,
    `Executable net confirms${thresholdLabel}`,
    `Executable net above confirm${thresholdLabel}`
  );
}

function subslotSpreadStatusLabel(subslot?: SubslotRow | null, slot?: SlotRow | null) {
  const assessment = subslotTriggerAssessment(subslot, slot);
  return triggerAssessmentStatusLabel(assessment?.spreadOk, "Spread pass", "Spread blocked");
}

function subslotHybridAwarenessLabel(subslot?: SubslotRow | null, slot?: SlotRow | null) {
  const assessment = subslotTriggerAssessment(subslot, slot);
  if (!assessment) return "-";
  if ((assessment.entryLawWouldPass ?? assessment.hybridWouldPass) === true) return "Entry law passes";
  if ((assessment.entryLawWouldBlock ?? assessment.hybridWouldBlock) === true) {
    const rawReason = assessment.entryLawBlockReason ?? assessment.hybridWouldBlockReason;
    const reason = rawReason ? `: ${reasonLabel(rawReason)}` : "";
    return `Entry law blocks${reason}`;
  }
  return "-";
}

function subslotHybridEntryCostLabel(subslot?: SubslotRow | null, slot?: SlotRow | null) {
  const assessment = subslotTriggerAssessment(subslot, slot);
  if (!assessment) return "-";
  if ((assessment.entryCostRequired ?? assessment.hybridEntryCostRequired) === false) return "Not required";

  const discount = assessment.entryDiscountPct ?? assessment.hybridEntryDiscountPct;
  const minDiscount = assessment.minEntryDiscountPct ?? assessment.hybridMinEntryDiscountPct ?? 0;
  const detail =
    discount != null && Number.isFinite(discount)
      ? ` (${pctNum(discount)} vs min ${pctNum(minDiscount)})`
      : "";

  if ((assessment.entryCostOk ?? assessment.hybridEntryCostOk) === true) return `Secondary cheaper${detail}`;
  if ((assessment.entryCostOk ?? assessment.hybridEntryCostOk) === false) {
    if ((assessment.entryCostKnown ?? assessment.hybridEntryCostKnown) === false) return "Entry cost unknown";
    return `Secondary not cheaper${detail}`;
  }
  return "-";
}

function subslotHybridEntryRateLabel(subslot?: SubslotRow | null, slot?: SlotRow | null) {
  const assessment = subslotTriggerAssessment(subslot, slot);
  if (!assessment) return "-";
  const parentRate = assessment.parentEntryRate ?? assessment.hybridParentEntryRate;
  const secondaryRate = assessment.secondaryEntryRate ?? assessment.hybridSecondaryEntryRate;
  if (parentRate == null && secondaryRate == null) return "-";
  return `Parent ${fmt(parentRate)} | Secondary ${fmt(secondaryRate)}`;
}

function configuredSubslotTriggerBands(
  subslotConfig: ManagerStatus["subslot"] | null | undefined,
  coin?: string | null
) {
  const normalizedCoin = String(coin || "").trim().toUpperCase();
  const coinBands =
    normalizedCoin && subslotConfig?.coinTriggerBands
      ? subslotConfig.coinTriggerBands[normalizedCoin]
      : null;
  const grossNetSpread = normalizedSecondaryTriggerBasis(null, subslotConfig) === "GROSS_NET_SPREAD";
  const source = Array.isArray(coinBands) && coinBands.length
    ? coinBands
    : grossNetSpread && Array.isArray(subslotConfig?.entryParentGrossBandsPct)
    ? subslotConfig?.entryParentGrossBandsPct
    : subslotConfig?.triggerParentNetBandsPct;

  return Array.isArray(source)
    ? source
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value))
    : [];
}

function normalizedSubslotBandIndex(
  subslot: SubslotRow | null | undefined,
  subslotConfig: ManagerStatus["subslot"] | null | undefined,
  coin?: string | null,
  fallbackBandIndex?: number | null
) {
  const bandIndex = Number(subslot?.subslotTriggerBandIndex);
  if (Number.isInteger(bandIndex) && bandIndex >= 1) {
    return bandIndex - 1;
  }

  const configuredBands = configuredSubslotTriggerBands(subslotConfig, coin);
  const directTriggerPct = Number(subslot?.subslotTriggerBandPct ?? subslot?.subslotTriggerParentNetPct);
  if (configuredBands.length && Number.isFinite(directTriggerPct)) {
    const matchedIndex = configuredBands.findIndex((value) => Math.abs(value - directTriggerPct) <= 0.0005);
    if (matchedIndex >= 0) return matchedIndex;
  }

  const sequenceIndex = Number(subslot?.subslotSequence);
  if (Number.isInteger(sequenceIndex) && sequenceIndex >= 1) {
    return sequenceIndex - 1;
  }

  if (fallbackBandIndex != null && Number.isInteger(fallbackBandIndex) && fallbackBandIndex >= 0) {
    return fallbackBandIndex;
  }

  return null;
}

function subslotTriggerSummary(
  subslot: SubslotRow,
  subslotConfig?: ManagerStatus["subslot"] | null
) {
  const parts: string[] = [];
  const band = subslotTriggerBandLabel(subslot);
  const assessment = subslotTriggerAssessment(subslot);
  const triggerPct = assessment?.selectedBandPct ?? subslot.subslotTriggerBandPct ?? subslot.subslotTriggerParentNetPct;
  if (band !== "Legacy trigger" || triggerPct != null) parts.push(band);
  if (triggerPct != null && Number.isFinite(triggerPct)) {
    parts.push(`${secondaryTriggerBasisLabel(subslot, subslotConfig)} trigger ${pctNum(triggerPct)}`);
  }
  const opened =
    normalizedSecondaryTriggerBasis(subslot, subslotConfig) === "NET"
      ? subslot.subslotEntryParentTriggerPct ?? subslot.subslotEntryParentNetPct
      : subslot.subslotEntryParentTriggerPct ?? subslot.subslotEntryParentGrossPct;
  if (opened != null && Number.isFinite(opened)) {
    parts.push(`opened ${pctNum(opened)}`);
  }
  if (assessment?.netConfirmOk != null || assessment?.hybridNetConfirmOk != null) {
    parts.push(subslotNetConfirmStatusLabel(subslot));
  }
  if (
    assessment?.entryCostOk != null ||
    assessment?.entryDiscountPct != null ||
    assessment?.hybridEntryCostOk != null ||
    assessment?.hybridEntryDiscountPct != null
  ) {
    parts.push(subslotHybridEntryCostLabel(subslot));
  }
  return parts.length ? parts.join(" | ") : "Legacy trigger";
}

function configuredSubslotTriggerPct(
  subslot: SubslotRow | null | undefined,
  subslotConfig: ManagerStatus["subslot"] | null | undefined,
  coin?: string | null,
  fallbackBandIndex?: number | null
) {
  const directTriggerPct = Number(subslot?.subslotTriggerBandPct ?? subslot?.subslotTriggerParentNetPct);
  if (Number.isFinite(directTriggerPct)) return directTriggerPct;

  const configuredBands = configuredSubslotTriggerBands(subslotConfig, coin);
  const bandIndex = normalizedSubslotBandIndex(subslot, subslotConfig, coin, fallbackBandIndex);

  if (configuredBands.length && bandIndex != null && bandIndex >= 0 && bandIndex < configuredBands.length) {
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

  const triggerPct = configuredSubslotTriggerPct(subslot, subslotConfig, parent?.coin, fallbackBandIndex);
  const basis = normalizedSecondaryTriggerBasis(subslot, subslotConfig);
  const parentTriggerPct = basis === "NET" ? liveParentNetPct(parent) : liveParentGrossPct(parent);
  const normalizedTriggerPct = Number(triggerPct);
  if (!Number.isFinite(normalizedTriggerPct) || parentTriggerPct == null || !Number.isFinite(parentTriggerPct)) return null;

  const remainingPct =
    normalizedTriggerPct < 0
      ? Math.max(0, Number(parentTriggerPct) - normalizedTriggerPct)
      : Math.max(0, normalizedTriggerPct - Number(parentTriggerPct));

  return Number(remainingPct.toFixed(3));
}

function subslotLiveCounterLabel(
  subslot: SubslotRow | null | undefined,
  parent: SlotRow | null | undefined,
  subslotConfig?: ManagerStatus["subslot"] | null | undefined,
  fallbackBandIndex?: number | null
) {
  const state = String(subslot?.subslotState || "").toUpperCase();
  const signal = String(subslot?.subslotSignalState || "").toUpperCase();
  const isPlaceholder = !subslot?.subslotId;
  const assessment = subslotTriggerAssessment(subslot, parent ?? null);
  if (state === "ACTIVE") return "Live now";
  if (state === "BUY_SUBMITTED") return "Entry pending";
  if (state === "SELL_SUBMITTED") return "Exit pending";

  const distancePct = subslotLiveDistancePct(subslot, parent, subslotConfig, fallbackBandIndex);
  if (distancePct != null) {
    if (distancePct === 0) {
      if ((assessment?.entryLawWouldBlock ?? assessment?.hybridWouldBlock) === true) return "Threshold met | entry law blocks";
      if (signal === "REVERSAL_CONFIRMING") return "Threshold met | confirming";
      if (signal === "BOUNCE_SEEN") return "Threshold met | bounce seen";
      if (signal === "TRACKING") return "Threshold met | watching";
      if (signal === "ARMED") return "Threshold met";
      if (isPlaceholder || state === "CLOSED") return "Threshold met";
      return "Threshold met";
    }
    return `${pctNum(distancePct)} to trigger`;
  }

  if (signal === "ARMED") return "Armed";
  if (signal === "REVERSAL_CONFIRMING") return "Confirming";
  if (signal === "BOUNCE_SEEN" || signal === "TRACKING") return "Watching";
  if (state === "CLOSED") return "Closed";
  return "-";
}

function readerStatusLabel(s: SlotRow) {
  const state = String(s.state || "").toUpperCase();
  const tracking = String(s.trackingState || "").toUpperCase();
  const liveNet = liveParentNetPct(s);

  if (isPrimaryExitOrderClearing(s)) return "Clearing Order";
  if (tracking === "PARENT_EXIT_NO_LOSS_WATCH") return "No-Loss Watch";
  if (tracking === "NO_LOSS_EXIT_MISSED_WAIT_RECOVERY") return "Recovery Wait";
  if (tracking === "PARENT_EXIT_FLOOR_WATCH") return "Floor Watch";
  if (tracking === "PARENT_EXIT_WAIT_PROFIT_RECOVERY") return "Exit Waiting";
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
  const contextRebased =
    tracking === "TRACKING_REBASED" ||
    ["max_drawdown_context_rebase", "tracking_age_context_rebase"].includes(blockedReason);
  const drawdownReady = !contextRebased && blockedReason !== "drawdown_not_ready";
  const bounceReady = drawdownReady && blockedReason !== "bounce_not_ready";
  const trendReady = bounceReady && blockedReason !== "trend_not_ready";
  const confirm = primaryEntryConfirmProgress(slot);
  const funding = primaryEntryFundingStatus(slot);

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
    label: funding.milestoneLabel,
    state: funding.state,
  });

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
      if (item.label.startsWith("Capital")) return item.state === "blocked" ? "Capital" : item.label;
      if (item.label.startsWith("Funding")) return item.state === "blocked" ? "Funding" : item.label;
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
  if (progress.blocked && progress.waitingLabels.includes("Capital")) return "Capital blocked";
  if (progress.blocked && progress.waitingLabels.includes("Funding")) return "Funding blocked";
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
  const targetAud = primaryEntryTargetAudValue(slot);
  const funding = primaryEntryFundingStatus(slot);

  return (
    <div className={`entry-progress ${toneClass}`} aria-label="Primary entry progress">
      <div className="entry-progress-top">
        <span className="entry-progress-label">Entry progress</span>
        <span className="entry-progress-value">
          {targetAud != null ? `${moneyAud(targetAud)} target` : `${progress.readyCount}/${progress.totalCount} gates`}
        </span>
      </div>
      <div className="entry-progress-bar" aria-hidden="true">
        <span style={{ width: `${fillPct}%` }} />
      </div>
      <div className="entry-progress-meta">
        <span className="entry-progress-meta-main" title={funding.title || funding.rawReason || undefined}>{progress.readyCount}/{progress.totalCount} gates | {funding.label}</span>
        <span className="entry-progress-meta-count">{primaryEntryCountdownLabel(slot)}</span>
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
  if (progress.isTrailing) return "Dual trail active";
  if (!progress.nextStep) return "Protection armed";
  return `${progress.totalCount - progress.currentLevel} levels remaining`;
}

function primaryExitProgressBlock(
  slot: SlotRow,
  holding: ManagerStatus["holding"] | null | undefined
) {
  const progress = primaryExitProgressModel(slot, holding);
  if (!progress.totalCount) return null;

  const showLockPosture = isPrimaryExitOrderClearing(slot) || primaryFloorBreached(slot);
  const toneClass = showLockPosture ? "is-blocked" : progress.isTrailing ? "is-ready" : progress.isArmed ? "is-active" : "is-blocked";

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
          {progress.isTrailing
            ? (() => {
                const lvl4Step = progress.steps.find((step) => step.key === "lvl4");
                return lvl4Step?.armPct != null && Number.isFinite(lvl4Step.armPct)
                  ? `LVL4 armed at ${pctNum(lvl4Step.armPct)}`
                  : "LVL4 armed";
              })()
            : progress.currentFloor != null && Number.isFinite(progress.currentFloor) && progress.currentFloor > 0
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
      {showLockPosture ? <div className="execution-breakdown-copy">{primaryLockPostureLabel(slot)}</div> : null}
    </div>
  );
}

type SecondaryRailItem = {
  key: string;
  label: string;
  stateLabel: string;
  counterLabel: string;
  toneClass: string;
  plannedAud?: number | null;
  plannedLabel?: string | null;
  isActive: boolean;
  isPendingBuy: boolean;
  isPendingSell: boolean;
  isOpen: boolean;
};

function secondaryRailBandContextLabel(
  subslot: SubslotRow | null | undefined,
  parent: SlotRow,
  subslotConfig: ManagerStatus["subslot"] | null | undefined,
  fallbackBandIndex?: number | null
) {
  const triggerPct = configuredSubslotTriggerPct(subslot, subslotConfig, parent.coin, fallbackBandIndex);
  if (triggerPct != null && Number.isFinite(triggerPct)) return `Parent band ${pctNum(triggerPct)}`;
  if (subslot) return subslotTriggerBandLabel(subslot);
  return "Parent band";
}

function secondaryRailItemStateLabel(
  subslot: SubslotRow | null,
  parent: SlotRow,
  subslotConfig: ManagerStatus["subslot"] | null | undefined,
  fallbackBandIndex?: number | null
) {
  const bandLabel = secondaryRailBandContextLabel(subslot, parent, subslotConfig, fallbackBandIndex);
  return bandLabel;
}

function secondaryRailEntryBlockLabel(
  parent: SlotRow,
  subslotConfig: ManagerStatus["subslot"] | null | undefined
) {
  const assessment = subslotTriggerAssessment(null, parent);
  if (assessment?.netConfirmOk === false) {
    return "Band reached | waiting executable net confirm";
  }
  if ((assessment?.entryCostOk ?? assessment?.hybridEntryCostOk) === false) {
    return "Band reached | waiting cheaper entry";
  }
  if ((assessment?.entryLawWouldBlock ?? assessment?.hybridWouldBlock) === true) {
    return "Band reached | entry law blocks";
  }
  if (subslotConfig?.requirePrimaryExactFill !== true) return null;
  if (primaryHasExactFillProof(parent)) return null;
  const fillStatus = primaryComparison(parent)?.fillStatus ?? parent.liveEntryFillStatus;
  const suffix = fillStatus ? ` (${enumLabel(fillStatus)})` : "";
  return `Band reached | waiting exact primary fill${suffix}`;
}

function secondaryRailCounterLabel(
  subslot: SubslotRow | null | undefined,
  parent: SlotRow,
  subslotConfig: ManagerStatus["subslot"] | null | undefined,
  fallbackBandIndex?: number | null
) {
  const state = String(subslot?.subslotState || "").toUpperCase();
  if (state === "ACTIVE") {
    const executableNetPct = subslotExecutableExitNetPct(subslot);
    const requiredNetPct = subslotExitRequiredNetPct(subslot);
    const gateState = String(subslotExitGateState(subslot) || "").toUpperCase();
    const netLabel = executableNetPct != null ? `Now net ${pctNum(executableNetPct)}` : "Now net unavailable";
    if (gateState === "WAIT_GREEN" && requiredNetPct != null) {
      return `${netLabel} | waiting for green sell >= +${pctNum(Math.abs(requiredNetPct))}`;
    }
    if (gateState === "WAIT_CONFIRM") {
      return `${netLabel} | green sell confirming`;
    }
    if (gateState === "READY") {
      return `${netLabel} | green sell ready`;
    }
    if (executableNetPct != null) return `${netLabel} | monitoring`;
    return "Live trade | monitoring";
  }
  if (state === "BUY_SUBMITTED") return "Band reached | buy submitted, awaiting fill";
  if (state === "SELL_SUBMITTED") return "Green sell submitted | awaiting fill";

  const signal = String(subslot?.subslotSignalState || "").toUpperCase();
  const distancePct = subslotLiveDistancePct(subslot, parent, subslotConfig, fallbackBandIndex);
  if (distancePct != null) {
    if (distancePct === 0) {
      const blockLabel = secondaryRailEntryBlockLabel(parent, subslotConfig);
      if (blockLabel) return blockLabel;
      if (signal === "REVERSAL_CONFIRMING") return "Band reached | buy confirming";
      if (signal === "BOUNCE_SEEN") return "Band reached | bounce seen";
      if (signal === "TRACKING") return "Band reached | monitoring buy";
      return "Band reached | buy eligible now";
    }
    const basisLabel =
      normalizedSecondaryTriggerBasis(subslot, subslotConfig) === "GROSS_NET_SPREAD"
        ? "gross band"
        : secondaryTriggerBasisLabel(subslot, subslotConfig);
    return `Parent ${basisLabel} needs ${pctNum(distancePct)} more drawdown`;
  }

  if (signal === "ARMED") return "Waiting for parent band";
  if (signal === "REVERSAL_CONFIRMING") return "Waiting for buy confirm";
  if (signal === "BOUNCE_SEEN" || signal === "TRACKING") return "Watching for buy";
  if (state === "CLOSED") return "Trade closed";
  return "Waiting for parent drawdown";
}

function secondaryRailPlannedAud(
  parent: SlotRow,
  subslotConfig: ManagerStatus["subslot"] | null | undefined
) {
  const sizeMode = String(subslotConfig?.entrySizeMode || "").trim().toUpperCase();
  if (sizeMode === "STATIC_AUD") {
    const targetAud = Number(subslotConfig?.entryTargetAud);
    return Number.isFinite(targetAud) && targetAud > 0 ? roundMoney(targetAud) : null;
  }

  const base = primaryEntryRequestedAudValue(parent) ?? primaryEntryTargetAudValue(parent) ?? parent.unitAud;
  const sizePct = Number(subslotConfig?.sizePctOfParent);
  if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(sizePct) || sizePct <= 0) return null;
  return roundMoney(base * Math.min(1, Math.max(0, sizePct)));
}

function secondaryRailPlannedLabel(
  plannedAud: number | null | undefined,
  subslotConfig: ManagerStatus["subslot"] | null | undefined
) {
  if (plannedAud == null || !Number.isFinite(plannedAud)) return null;
  const sizeMode = String(subslotConfig?.entrySizeMode || "").trim().toUpperCase();
  return sizeMode === "STATIC_AUD"
    ? `${moneyAud(plannedAud)} static secondary plan`
    : `${moneyAud(plannedAud)} plan`;
}

function secondaryRailVisualCounts(items: SecondaryRailItem[]) {
  return items.reduce(
    (acc, item) => {
      if (item.isActive) acc.active += 1;
      if (item.isPendingBuy) acc.pendingBuy += 1;
      if (item.isPendingSell) acc.pendingSell += 1;
      if (item.isOpen) acc.open += 1;
      return acc;
    },
    { active: 0, pendingBuy: 0, pendingSell: 0, open: 0 }
  );
}

function secondaryRailSlotCapacity(
  slot: SlotRow,
  subslotConfig: ManagerStatus["subslot"] | null | undefined
) {
  const railMax = 8;
  const configuredBands = configuredSubslotTriggerBands(subslotConfig, slot.coin);
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
  const configuredBands = configuredSubslotTriggerBands(subslotConfig, slot.coin);
  const currentRows = getSecondaryRows(slot).filter((subslot) => {
    const state = String(subslot.subslotState || "").toUpperCase();
    return state === "ACTIVE" || state === "BUY_SUBMITTED" || state === "SELL_SUBMITTED";
  });

  const assigned = new Map<number, SubslotRow>();
  const grouped = new Map<number, SubslotRow[]>();

  for (const subslot of currentRows) {
    const bandIndex = normalizedSubslotBandIndex(subslot, subslotConfig, slot.coin, null);
    if (bandIndex == null || bandIndex < 0 || bandIndex >= slotCapacity) continue;
    const group = grouped.get(bandIndex) ?? [];
    group.push(subslot);
    grouped.set(bandIndex, group);
  }

  for (const [bandIndex, group] of grouped.entries()) {
    const current = [...group].sort((a, b) => {
      const scoreDelta = secondaryPriorityScore(b) - secondaryPriorityScore(a);
      if (scoreDelta !== 0) return scoreDelta;
      const aAt = Number(a.subslotLastReconcileAt ?? a.subslotClosedAt ?? a.subslotOpenedAt ?? a.subslotSequence ?? 0);
      const bAt = Number(b.subslotLastReconcileAt ?? b.subslotClosedAt ?? b.subslotOpenedAt ?? b.subslotSequence ?? 0);
      return bAt - aAt;
    })[0] ?? null;
    if (current) assigned.set(bandIndex, current);
  }

  const items: SecondaryRailItem[] = [];
  const plannedAud = secondaryRailPlannedAud(slot, subslotConfig);
  const plannedLabel = secondaryRailPlannedLabel(plannedAud, subslotConfig);

  for (let index = 0; index < slotCapacity; index += 1) {
    const liveSubslot = assigned.get(index) ?? null;
    const triggerPct = configuredBands[index] ?? null;
    const subslot =
      liveSubslot ??
      ({
        subslotSequence: index + 1,
        subslotTriggerBandIndex: index + 1,
        subslotTriggerParentNetPct: triggerPct,
      } as SubslotRow);
    const distancePct = subslotLiveDistancePct(subslot, slot, subslotConfig, index);
    items.push({
      key: liveSubslot?.subslotId ?? `${slot.id}-secondary-band-${index + 1}`,
      label: `S${index + 1}`,
      stateLabel: secondaryRailItemStateLabel(subslot, slot, subslotConfig, index),
      counterLabel: secondaryRailCounterLabel(subslot, slot, subslotConfig, index),
      plannedAud,
      plannedLabel,
      toneClass: liveSubslot
        ? subslotToneClass(liveSubslot)
        : distancePct === 0
          ? "is-tracking"
          : "is-muted",
      isActive: String(liveSubslot?.subslotState || "").toUpperCase() === "ACTIVE",
      isPendingBuy: String(liveSubslot?.subslotState || "").toUpperCase() === "BUY_SUBMITTED",
      isPendingSell: String(liveSubslot?.subslotState || "").toUpperCase() === "SELL_SUBMITTED",
      isOpen: ["ACTIVE", "BUY_SUBMITTED", "SELL_SUBMITTED"].includes(String(liveSubslot?.subslotState || "").toUpperCase()),
    });
  }

  return items;
}

function secondaryRailSummary(
  slot: SlotRow,
  items: SecondaryRailItem[],
  subslotConfig: ManagerStatus["subslot"] | null | undefined
) {
  const slotCapacity = secondaryRailSlotCapacity(slot, subslotConfig);
  const counts = secondaryRailVisualCounts(items);
  const realizedAud = getSubslotRealizedProfit(slot);
  const parts: string[] = [];

  if (!getSecondaryRows(slot).length) {
    return `${slotCapacity} tactical secondary slots available during this Primary.`;
  }

  if (counts.open > 0) parts.push(`${counts.open}/${slotCapacity} open`);
  if (counts.active > 0) parts.push(`${counts.active} live`);
  if (counts.pendingBuy > 0) parts.push("entry pending");
  if (counts.pendingSell > 0) parts.push("exit pending");
  if (realizedAud != null) parts.push(`realized ${moneyAud(realizedAud)}`);

  return parts.length ? parts.join(" | ") : "Secondary rail idle.";
}

function primarySecondaryRail(
  slot: SlotRow,
  subslotConfig: ManagerStatus["subslot"] | null | undefined,
  capitalCoin?: PublicCapitalCoin | null
) {
  const slotCapacity = secondaryRailSlotCapacity(slot, subslotConfig);
  const items = secondaryRailItems(slot, subslotConfig);
  const counts = secondaryRailVisualCounts(items);
  const reconciliationWarning = secondaryReconciliationWarningLabel(slot, capitalCoin);
  const railValue =
    counts.open > counts.active ? `${counts.open}/${slotCapacity} open` : `${counts.active}/${slotCapacity} live`;

  return (
    <div className="entry-progress secondary-rail" aria-label="Primary secondary rail">
      <div className="entry-progress-top">
        <span className="entry-progress-label">Secondary rail</span>
        <span className="entry-progress-value">{railValue}</span>
      </div>
      <div className="secondary-rail-track" aria-label="Secondary trade slots">
        {items.map((item) => (
          <div key={item.key} className={`secondary-rail-slot ${item.toneClass}`}>
            <div className="secondary-rail-slot-label">{item.label}</div>
            <div className="secondary-rail-slot-state">{item.stateLabel}</div>
            <div className="secondary-rail-slot-counter">{item.counterLabel}</div>
            {item.plannedLabel ? (
              <div className="secondary-rail-slot-planned">{item.plannedLabel}</div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="secondary-rail-summary">{secondaryRailSummary(slot, items, subslotConfig)}</div>
      {reconciliationWarning ? (
        <div className="secondary-rail-summary is-warn">{reconciliationWarning}</div>
      ) : null}
    </div>
  );
}

function primaryRoundTripFeePct(slot: SlotRow | null | undefined) {
  const comparison = primaryComparison(slot);
  const roundTripFeeBps =
    comparison?.roundTripFeeBps != null && Number.isFinite(comparison.roundTripFeeBps)
      ? comparison.roundTripFeeBps
      : slot?.feeBps != null && Number.isFinite(slot.feeBps)
        ? Number(slot.feeBps) * 2
        : null;
  if (roundTripFeeBps == null || !Number.isFinite(roundTripFeeBps)) return null;
  return Number((Number(roundTripFeeBps) / 100).toFixed(3));
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
    "Live Gross shows the same primary move before friction and fees.",
    "Ledger Net is the primary P/L read; Executable Sell Net is the explicit exit-gate check.",
  ];

  const comparison = primaryComparison(slot);
  if (comparison?.exactFillKnown === true && comparison.netBasisRate != null) {
    parts.push(`Primary net basis is reconciled to actual CoinSpot fill ${fmt(comparison.netBasisRate)}.`);
  } else if (comparison?.netBasisRate != null) {
    parts.push(
      `Primary net basis is still using ${basisSourceLabel(comparison.netBasisSource).toLowerCase()} ${fmt(
        comparison.netBasisRate
      )} while exact fill proof is pending.`
    );
  }

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

function subslotExitGateBlock(
  subslot: SubslotRow | null | undefined,
  nowMs: number,
  variant: "compact" | "full" = "full"
) {
  if (!subslot || !subslotHasExitGateData(subslot)) return null;

  const gateState = subslotExitGateStateLabel(subslot);
  const gateReason = subslotExitGateReason(subslot);
  const triggerReason = subslotExitTriggerReason(subslot);
  const executableNetPct = subslotExecutableExitNetPct(subslot);
  const executableProfitAud = subslotExecutableExitProfitAud(subslot);
  const executableExitAud = subslotExecutableExitAud(subslot);
  const bestExecutableNetPct = subslotBestExecutableExitNetPct(subslot);
  const bestExecutableProfitAud = subslotBestExecutableExitProfitAud(subslot);
  const requiredNetPct = subslotExitRequiredNetPct(subslot);
  const requiredProfitAud = subslotExitRequiredProfitAud(subslot);
  const effectiveTakeProfitPct = subslotEffectiveTakeProfitNetPct(subslot);
  const greenStallTicks = subslotGreenStallTicks(subslot);
  const waitSince = subslotExitWaitGreenSince(subslot);
  const triggerAt = subslotExitTriggerAt(subslot);

  const compactMetrics = [
    { label: "Gate", value: gateState },
    { label: "Needs", value: subslotExitNeedsLabel(subslot) },
    { label: "Exec Exit", value: subslotExecutableExitLabel(subslot) },
    { label: "Best Seen", value: subslotBestExecutableExitLabel(subslot) },
  ];

  const fullMetrics = [
    { label: "Gate", value: gateState },
    { label: "Needs", value: subslotExitNeedsLabel(subslot) },
    { label: "Exec Exit", value: subslotExecutableExitLabel(subslot) },
    { label: "Exit AUD", value: moneyAud(executableExitAud) },
    { label: "Best Seen", value: subslotBestExecutableExitLabel(subslot) },
    { label: "Trigger", value: reasonLabel(triggerReason) },
    { label: "Waiting Since", value: waitSince != null ? ageLabel(nowMs - waitSince) : "-" },
    { label: "Triggered", value: triggerAt != null ? ageLabel(nowMs - triggerAt) : "-" },
    { label: "Take Profit", value: pctNum(effectiveTakeProfitPct) },
    { label: "Green Stall", value: greenStallTicks != null ? `${greenStallTicks}` : "-" },
  ];

  const copyParts = [
    gateReason ? `Gate reason: ${reasonLabel(gateReason)}.` : null,
    triggerReason ? `Trigger: ${reasonLabel(triggerReason)}.` : null,
    requiredNetPct != null || requiredProfitAud != null
      ? `Green requirement stays at ${pctNum(requiredNetPct)} and ${moneyAud(requiredProfitAud)}.`
      : null,
    executableNetPct != null || executableProfitAud != null
      ? `Executable exit is currently ${pctNum(executableNetPct)} and ${moneyAud(executableProfitAud)}.`
      : null,
    bestExecutableNetPct != null || bestExecutableProfitAud != null
      ? `Best executable progress seen is ${pctNum(bestExecutableNetPct)} and ${moneyAud(bestExecutableProfitAud)}.`
      : null,
  ].filter(Boolean);

  return (
    <div className="entry-progress execution-breakdown" aria-label="Secondary exit gate">
      <div className="entry-progress-top">
        <span className="entry-progress-label">Secondary Exit Gate</span>
        <span className="entry-progress-value">{gateState}</span>
      </div>
      <div className="execution-breakdown-grid">
        {(variant === "compact" ? compactMetrics : fullMetrics).map((metric) => (
          <div key={metric.label} className="execution-breakdown-metric">
            <div className="execution-breakdown-k">{metric.label}</div>
            <div className="execution-breakdown-v">{metric.value}</div>
          </div>
        ))}
      </div>
      {copyParts.length ? <div className="execution-breakdown-copy">{copyParts.join(" ")}</div> : null}
    </div>
  );
}

function subslotEntryQualityBlock(subslot: SubslotRow | null | undefined, variant: "compact" | "full" = "full") {
  if (!subslot || !subslotHasEntryQualityData(subslot)) return null;

  const metrics = [
    { label: "Entry Cost", value: subslotHybridEntryCostLabel(subslot) },
    { label: "Entry Rates", value: subslotHybridEntryRateLabel(subslot) },
    { label: "Quote Status", value: subslotEntryQuoteStatusLabel(subslot) },
    { label: "Quote Rate", value: fmt(subslotEntryQuoteRate(subslot)) },
    { label: "Abs Drift", value: pctNum(subslotEntryQuoteAbsoluteDriftPct(subslot)) },
    { label: "Adverse Drift", value: pctNum(subslotEntryQuoteAdverseDriftPct(subslot)) },
    { label: "Market Age", value: subslotEntryMarketFreshnessLabel(subslot) },
  ];

  const compactMetrics = metrics.filter((metric) =>
    ["Entry Cost", "Quote Status", "Abs Drift", "Market Age"].includes(metric.label)
  );

  const copyParts = [
    (subslotTriggerAssessment(subslot)?.entryCostOk ?? subslotTriggerAssessment(subslot)?.hybridEntryCostOk) === true
      ? "Entry law confirmed the secondary entry was cheaper than the parent basis."
      : null,
    (subslotTriggerAssessment(subslot)?.entryCostOk ?? subslotTriggerAssessment(subslot)?.hybridEntryCostOk) === false
      ? "Entry law blocked or flagged this entry because the secondary was not cheaper than the parent basis."
      : null,
    subslot?.subslotEntryQuoteUsed === true ? "Secondary buy used the shared live quote guard." : null,
    subslot?.subslotEntryQuoteAdjusted === true ? "Quote drift forced an adjusted entry rate." : null,
    subslotEntryQuoteAbsoluteDriftPct(subslot) != null
      ? `Recorded absolute drift was ${pctNum(subslotEntryQuoteAbsoluteDriftPct(subslot))}.`
      : null,
  ].filter(Boolean);

  return (
    <div className="entry-progress execution-breakdown" aria-label="Secondary entry quality">
      <div className="entry-progress-top">
        <span className="entry-progress-label">Secondary Entry Quality</span>
        <span className="entry-progress-value">{subslotEntryQuoteStatusLabel(subslot)}</span>
      </div>
      <div className="execution-breakdown-grid">
        {(variant === "compact" ? compactMetrics : metrics).map((metric) => (
          <div key={metric.label} className="execution-breakdown-metric">
            <div className="execution-breakdown-k">{metric.label}</div>
            <div className="execution-breakdown-v">{metric.value}</div>
          </div>
        ))}
      </div>
      {copyParts.length ? <div className="execution-breakdown-copy">{copyParts.join(" ")}</div> : null}
    </div>
  );
}

function exitOrderBlock(
  order: ExitOrderState | null | undefined,
  title: string,
  variant: "compact" | "full" = "full"
) {
  if (!order) return null;
  const state = String(order.state || order.lastAction || "").trim().toUpperCase();
  const hasBrokerId = order.hasBrokerId === true || String(order.idMasked || order.id || "").trim().length > 0;
  if (!state && order.rate == null) return null;
  const metrics = [
    { label: "Order", value: exitOrderSummaryLabel(order) },
    { label: "Target", value: exitOrderTargetLabel(order) },
    { label: "Distance", value: exitOrderDistanceLabel(order) },
    { label: "Reprices", value: order.repriceCount != null ? `${order.repriceCount}` : "-" },
    { label: "Mode", value: exitOrderModeLabel(order) },
    { label: "Last Error", value: order.lastError || "-" },
  ];
  const compactMetrics = metrics.filter((metric) =>
    ["Order", "Target", "Distance", "Mode"].includes(metric.label)
  );
  const copyParts = [
    order.dryRun === true || state.startsWith("WOULD_")
      ? "Dry-run is observing only; no resting CoinSpot sell order has been placed by this manager."
      : null,
    !order.dryRun && state === "OPEN" && !hasBrokerId
      ? "Open state has no broker order id; treat this as a planned target, not confirmed CoinSpot exposure."
      : null,
    !order.dryRun && (state === "RECONCILING" || state === "SUBMITTED_NO_ID") && !hasBrokerId
      ? "Broker id is missing, so the engine is reconciling before another resting sell can be trusted."
      : null,
    !order.dryRun && state.includes("CANCEL")
      ? "Tracked order is being canceled before the next guarded exit attempt."
      : null,
    order.blockReason ? `Block reason: ${reasonLabel(order.blockReason)}.` : null,
  ].filter(Boolean);

  return (
    <div className="entry-progress execution-breakdown" aria-label={title}>
      <div className="entry-progress-top">
        <span className="entry-progress-label">{title}</span>
        <span className="entry-progress-value">{exitOrderModeLabel(order)} | {state || "-"}</span>
      </div>
      <div className="execution-breakdown-grid">
        {(variant === "compact" ? compactMetrics : metrics).map((metric) => (
          <div key={metric.label} className="execution-breakdown-metric">
            <div className="execution-breakdown-k">{metric.label}</div>
            <div className="execution-breakdown-v">{metric.value}</div>
          </div>
        ))}
      </div>
      {copyParts.length ? <div className="execution-breakdown-copy">{copyParts.join(" ")}</div> : null}
    </div>
  );
}

function primarySetupStateLabel(slot: SlotRow) {
  const tracking = String(slot.trackingState || "").toUpperCase();
  const state = String(slot.state || "").toUpperCase();

  if (state === "DEPLOYING") return "Entry submitting";
  if (tracking === "TRACKING_REBASED") return "Fresh context started";
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
  const lvl4FloorBid = primaryLvl4TrailFloorBid(slot);
  const lvl4BidBufferPct = primaryLvl4TrailBufferPct(slot);
  const lvl4FloorNetPct = primaryLvl4NetTrailFloorPct(slot);
  const lvl4NetBufferPct = primaryLvl4NetTrailBufferPct(slot);

  if (state === "EXITING") return "Sell resolving";
  if (state === "DEPLOYING") return "Awaiting entry proof";
  if (isPrimaryExitOrderClearing(slot)) return primaryExitOrderClearingLabel(slot);
  if (isPrimaryNoLossReady(slot)) {
    return "No-loss exit ready | executable sell remains net-positive";
  }
  if (isPrimaryNoLossWatch(slot)) {
    const giveback = primaryNoLossGivebackPct(slot);
    const peakGiveback = primaryNoLossPeakGivebackPct(slot);
    return `No-loss watch | floor/giveback protection${giveback != null ? ` | giveback ${pctNum(giveback)}` : ""}${peakGiveback != null ? ` of ${pctNum(peakGiveback)}` : ""}`;
  }
  if (isPrimaryNoLossRecovery(slot)) {
    return "Missed no-loss window | waiting for net-positive executable recovery";
  }
  if (primaryTrackingState(slot) === "PARENT_EXIT_FLOOR_WATCH") {
    return "Floor watch | waiting for net-positive executable harvest";
  }
  if (primaryTrackingState(slot) === "PARENT_EXIT_WAIT_PROFIT_RECOVERY") {
    return "Floor breached | waiting for net-positive executable recovery";
  }

  if (state === "LVL4_TRAIL") {
    const parts = ["LVL4 armed", "exit on first breach"];
    if (lvl4FloorBid != null && Number.isFinite(lvl4FloorBid)) {
      parts.push(`bid floor ${fmt(lvl4FloorBid)}`);
    }
    if (lvl4FloorNetPct != null && Number.isFinite(lvl4FloorNetPct)) {
      parts.push(`net floor ${pctNum(lvl4FloorNetPct)}`);
    }
    if (lvl4BidBufferPct != null && Number.isFinite(lvl4BidBufferPct)) {
      parts.push(`bid ${pctNum(lvl4BidBufferPct)} left`);
    }
    if (lvl4NetBufferPct != null && Number.isFinite(lvl4NetBufferPct)) {
      parts.push(`net ${pctNum(lvl4NetBufferPct)} above`);
    }
    return parts.join(" | ");
  }

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
  const open = getSubslotOpenCount(slot);
  const totalGainAud = secondaryTotalGainAud(slot);
  const parts: string[] = [];

  if (!total) return "None";
  if (open > 0) parts.push(`${open} open`);
  if (active > 0 && active !== open) parts.push(`${active} live`);
  if (hasPendingSubslotBuys(slot)) parts.push("entry pending");
  if (hasPendingSubslotSells(slot)) parts.push("exit pending");
  if (!parts.length) parts.push(`${total} recorded`);
  if (totalGainAud != null) parts.push(moneyAud(totalGainAud));
  return parts.join(" | ");
}

function nextActionLabel(s: SlotRow) {
  const state = String(s.state || "").toUpperCase();
  const tracking = String(s.trackingState || "").toUpperCase();

  if (isPrimaryExitOrderClearing(s)) return primaryExitOrderClearingLabel(s);
  if (tracking === "PARENT_EXIT_NO_LOSS_WATCH") return "No-loss watch: waiting for net-positive harvest";
  if (tracking === "NO_LOSS_EXIT_MISSED_WAIT_RECOVERY") return "Missed no-loss window, waiting for recovery";
  if (tracking === "PARENT_EXIT_FLOOR_WATCH") return "Floor watch: waiting for net-positive harvest";
  if (tracking === "PARENT_EXIT_WAIT_PROFIT_RECOVERY") return "Floor breached, waiting for net-positive recovery";
  if (tracking === "PARENT_EXIT_WAIT_GREEN") return "Waiting for green exit";
  if (state === "EXITING") return "Confirming exit fill";
  if (state === "DEPLOYING") return "Confirming entry fill";

  if (state === "WAITING_ENTRY") {
    if (tracking === "TRACKING_REBASED") return "Fresh context started; waiting for a new pullback and bounce";
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
    if (primaryFloorBreached(s)) return "Floor breached, waiting for guarded exit";
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
  const comparison = primaryComparison(s);

  // Parent State Analysis
  if (isPrimaryExitOrderClearing(s)) {
    parts.push(`${primaryExitOrderClearingLabel(s)}.`);
  } else if (tracking === "PARENT_EXIT_NO_LOSS_WATCH") {
    parts.push("Jrd Primary is in no-loss watch and will only harvest while executable sell remains net positive.");
  } else if (tracking === "NO_LOSS_EXIT_MISSED_WAIT_RECOVERY") {
    parts.push("Jrd Primary missed the no-loss exit window and is waiting for net-positive executable recovery.");
  } else if (tracking === "PARENT_EXIT_FLOOR_WATCH") {
    parts.push("Jrd Primary is in floor watch and will only harvest if the executable sell remains net positive.");
  } else if (tracking === "PARENT_EXIT_WAIT_PROFIT_RECOVERY") {
    parts.push("Jrd Primary floor is breached, but the executable sell is waiting for net-positive recovery.");
  } else if (state === "EXITING") {
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

  if (comparison?.exactFillKnown === true && comparison.netBasisRate != null) {
    parts.push(`Primary net basis is reconciled to actual CoinSpot fill ${fmt(comparison.netBasisRate)}.`);
  } else if (comparison?.netBasisRate != null) {
    parts.push(
      `Primary net basis is still using ${basisSourceLabel(comparison.netBasisSource).toLowerCase()} ${fmt(
        comparison.netBasisRate
      )} while exact fill proof is pending.`
    );
  }

  if (getSecondaryRows(s).length) {
    parts.push("Secondary trades below reconcile separately from this primary.");
  }

  if (trailMovement) {
    parts.push(trailMovement);
  }

  if (primaryFloorBreached(s)) {
    parts.push(primaryLockPostureLabel(s));
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
  const gateState = subslotExitGateState(subslot);
  const gateReason = subslotExitGateReason(subslot);
  const triggerReason = subslotExitTriggerReason(subslot);
  const executableNetPct = subslotExecutableExitNetPct(subslot);
  const executableProfitAud = subslotExecutableExitProfitAud(subslot);
  const bestExecutableNetPct = subslotBestExecutableExitNetPct(subslot);
  const bestExecutableProfitAud = subslotBestExecutableExitProfitAud(subslot);
  const requiredNetPct = subslotExitRequiredNetPct(subslot);
  const requiredProfitAud = subslotExitRequiredProfitAud(subslot);
  const effectiveTakeProfitPct = subslotEffectiveTakeProfitNetPct(subslot);
  const greenStallTicks = subslotGreenStallTicks(subslot);
  const quoteDriftPct = subslotEntryQuoteAbsoluteDriftPct(subslot);
  const quoteStatus = subslotEntryQuoteStatusLabel(subslot);
  const triggerAssessment = subslotTriggerAssessment(subslot, parent);

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

  const triggerBandPct = triggerAssessment?.selectedBandPct ?? subslot.subslotTriggerBandPct ?? subslot.subslotTriggerParentNetPct;
  if (triggerBandPct != null && Number.isFinite(triggerBandPct)) {
    parts.push(
      `${subslotTriggerBandLabel(subslot)} fired at ${pctNum(triggerBandPct)} parent ${secondaryTriggerBasisLabel(subslot)}.`
    );
  }

  const entryBasis = normalizedSecondaryTriggerBasis(subslot);
  const entryPct =
    entryBasis === "NET"
      ? subslot.subslotEntryParentTriggerPct ?? subslot.subslotEntryParentNetPct
      : subslot.subslotEntryParentTriggerPct ?? subslot.subslotEntryParentGrossPct;
  if (entryPct != null && Number.isFinite(entryPct)) {
    parts.push(`Parent ${secondaryTriggerBasisLabel(subslot)} at entry was ${pctNum(entryPct)}.`);
  }

  if (triggerAssessment?.grossBandOk != null) {
    parts.push(subslotGrossBandStatusLabel(subslot, parent) + ".");
  }

  if (triggerAssessment?.netConfirmOk != null || triggerAssessment?.hybridNetConfirmOk != null) {
    parts.push(subslotNetConfirmStatusLabel(subslot, parent) + ".");
  }

  if (triggerAssessment?.spreadOk != null) {
    parts.push(subslotSpreadStatusLabel(subslot, parent) + ".");
  }

  if (
    triggerAssessment?.entryLawWouldBlock === true ||
    triggerAssessment?.entryLawWouldPass === true ||
    triggerAssessment?.hybridWouldBlock === true ||
    triggerAssessment?.hybridWouldPass === true
  ) {
    parts.push(subslotHybridAwarenessLabel(subslot, parent) + ".");
  }

  if (liveDistancePct != null) {
    if (liveDistancePct > 0) parts.push(`${pctNum(liveDistancePct)} remains before Jrd Secondary goes live.`);
    else parts.push("Band trigger is met. Secondary still needs spread, executable-net confirmation, cheaper-entry confirmation, pacing, and any non-touch signal or edge gates to align.");
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

  if (subslot.subslotRecoveredConfirmed === false) {
    parts.push("Executable-green exit gate is still waiting.");
  } else if (subslot.subslotRecoveredConfirmed === true) {
    parts.push("Executable-green exit tracking is active.");
  }

  if (gateState) {
    parts.push(`Exit gate is ${enumLabel(gateState)}.`);
  }

  if (gateReason && gateReason !== "-") {
    parts.push(`Gate reason: ${reasonLabel(gateReason)}.`);
  }

  if (triggerReason) {
    parts.push(`Exit trigger: ${reasonLabel(triggerReason)}.`);
  }

  if (requiredNetPct != null || requiredProfitAud != null) {
    parts.push(`Green threshold is ${pctNum(requiredNetPct)} and ${moneyAud(requiredProfitAud)}.`);
  }

  if (Number.isFinite(executableNetPct) || Number.isFinite(executableProfitAud)) {
    parts.push(`Executable exit is ${pctNum(executableNetPct)} and ${moneyAud(executableProfitAud)} right now.`);
  }

  if (Number.isFinite(bestExecutableNetPct) || Number.isFinite(bestExecutableProfitAud)) {
    parts.push(`Best executable seen is ${pctNum(bestExecutableNetPct)} and ${moneyAud(bestExecutableProfitAud)}.`);
  }

  if (effectiveTakeProfitPct != null) {
    parts.push(`Effective take-profit target is ${pctNum(effectiveTakeProfitPct)}.`);
  }

  if (greenStallTicks != null && greenStallTicks > 0) {
    parts.push(`Green stall counter is ${greenStallTicks} ticks.`);
  }

  // Bounce and EMA Gap Analysis
  if (Number.isFinite(bouncePct)) {
    parts.push(`Bounce is ${pctNum(bouncePct)}.`);
  }

  if (Number.isFinite(emaGapPct)) {
    parts.push(`EMA gap is ${pctNum(emaGapPct)}.`);
  }

  if (quoteStatus !== "-") {
    parts.push(`Entry quality: ${quoteStatus.toLowerCase()}.`);
  }

  if (quoteDriftPct != null) {
    parts.push(`Quote drift was ${pctNum(quoteDriftPct)} at entry.`);
  }

  // Updated Time
  if (updated !== "-") {
    parts.push(`Updated ${updated} ago.`);
  }

  return parts.join(" ");
}

function primaryLiveSubslotAnalysis(slot: SlotRow, nowMs: number) {
  const primary = getPrimarySecondarySnapshot(slot);
  if (primary) return liveSubslotAnalysis(primary, slot, nowMs);
  return getSecondaryRows(slot).length
    ? "No active Jrd Secondary. Waiting for the next secondary setup or the normal primary exit."
    : "No Jrd Secondary records available.";
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
  const subslots = getSecondaryRows(s);
  const hasPendingSell = subslots.some((subslot) => String(subslot.subslotState || "").toUpperCase() === "SELL_SUBMITTED");
  const hasPendingBuy = subslots.some((subslot) => String(subslot.subslotState || "").toUpperCase() === "BUY_SUBMITTED");
  const hasActive = subslots.some((subslot) => String(subslot.subslotState || "").toUpperCase() === "ACTIVE");

  if (String(s.state || "").toUpperCase() === "EXITING") return 100;
  if (isPrimaryExitOrderClearing(s)) return 98;
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
  | "clearing-exit-order"
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
    key: "clearing-exit-order",
    title: "Clearing Exit Order",
    note: "A tracked resting sell order is being canceled before the floor-protected exit retries.",
  },
  {
    key: "exit-waiting",
    title: "Exit Waiting",
    note: "The Primary wants to exit; the sell gate is watching the floor, waiting for recovery, or confirming executable protection.",
  },
  {
    key: "exiting",
    title: "Exiting",
    note: "Primary sells are resolving live.",
  },
];

function primaryExecutableExitNetPct(slot: SlotRow | null | undefined) {
  return finiteMetric(primaryDecision(slot)?.executableExitNetPct ?? slot?.parentExecutableExitNetPct);
}

function primaryExecutableExitProfitAud(slot: SlotRow | null | undefined) {
  return finiteMetric(primaryDecision(slot)?.executableExitProfitAud ?? slot?.parentExecutableExitProfitAud);
}

function primaryExecutableExitLabel(slot: SlotRow | null | undefined) {
  const netPct = primaryExecutableExitNetPct(slot);
  const profitAud = primaryExecutableExitProfitAud(slot);
  if (netPct == null && profitAud == null) return "-";
  return `${pctNum(netPct)} | ${moneyAud(profitAud)}`;
}

function primaryNoLossGivebackPct(slot: SlotRow | null | undefined) {
  return finiteMetric(primaryDecision(slot)?.exitNoLossGivebackPct ?? slot?.parentExitNoLossGivebackPct);
}

function primaryNoLossPeakGivebackPct(slot: SlotRow | null | undefined) {
  return finiteMetric(primaryDecision(slot)?.exitNoLossPeakGivebackPct ?? slot?.parentExitNoLossPeakGivebackPct);
}

function primaryExitGateState(slot: SlotRow | null | undefined) {
  const raw = primaryDecision(slot)?.exitGateState ?? slot?.parentExitGateState;
  return raw ? String(raw) : null;
}

function primaryExitGateReason(slot: SlotRow | null | undefined) {
  if (isPrimaryExitOrderClearing(slot)) {
    return primaryExitOrderClearingLabel(slot);
  }
  const raw = primaryDecision(slot)?.exitGateReason ?? slot?.parentExitGateReason;
  return raw ? String(raw) : null;
}

function primaryExitGateStateLabel(slot: SlotRow | null | undefined) {
  if (isPrimaryExitOrderClearing(slot)) {
    return primaryTrackingState(slot) === "PARENT_EXIT_ORDER_CANCEL_NO_LOSS_WATCH"
      ? "Canceling Tracked Sell"
      : primaryTrackingState(slot) === "PARENT_EXIT_ORDER_CANCEL_PRE_FLOOR"
      ? "Canceling Resting Order"
      : isPrimaryFloorOrderClearing(slot)
        ? "Clearing Floor Order"
        : "Clearing Exit Order";
  }
  if (isPrimaryNoLossReady(slot)) return "Ready While Net-Positive";
  if (isPrimaryNoLossWatch(slot)) return "No-Loss Watch";
  if (isPrimaryNoLossRecovery(slot)) return "Missed Window Recovery";
  if (primaryTrackingState(slot) === "PARENT_EXIT_FLOOR_WATCH") return "Watching Floor";
  if (primaryTrackingState(slot) === "PARENT_EXIT_WAIT_PROFIT_RECOVERY") return "Waiting Recovery";
  const gateState = primaryExitGateState(slot);
  return gateState ? enumLabel(gateState) : "-";
}

function primaryExitRequiredNetPct(slot: SlotRow | null | undefined) {
  return finiteMetric(primaryDecision(slot)?.exitRequiredNetPct ?? slot?.parentExitRequiredNetPct);
}

function primaryExitRequiredProfitAud(slot: SlotRow | null | undefined) {
  return finiteMetric(primaryDecision(slot)?.exitRequiredProfitAud ?? slot?.parentExitRequiredProfitAud);
}

function positionStageForSlot(slot: SlotRow): PositionStageKey {
  const state = String(slot.state || "").toUpperCase();
  const tracking = String(slot.trackingState || "").toUpperCase();
  const floorPct = primaryDecision(slot)?.exitFloorPct ?? primaryExitFloorPct(slot);
  const hasArmedFloor = floorPct != null && Number.isFinite(floorPct) && Number(floorPct) > 0;

  if (isPrimaryExitOrderClearing(slot)) return "clearing-exit-order";
  if (
    tracking === "PARENT_EXIT_WAIT_GREEN" ||
    tracking === "PARENT_EXIT_NO_LOSS_WATCH" ||
    tracking === "NO_LOSS_EXIT_MISSED_WAIT_RECOVERY" ||
    tracking === "PARENT_EXIT_FLOOR_WATCH" ||
    tracking === "PARENT_EXIT_WAIT_PROFIT_RECOVERY"
  ) return "exit-waiting";
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
    slotHasSecondaryReconciliationAttention(slot) ||
    stage === "entering" ||
    stage === "clearing-exit-order" ||
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

  if (stage === "clearing-exit-order") {
    const parts = [primaryExitOrderClearingLabel(slot)];
    const order = primaryExitOrderData(slot);
    const displayId = String(order?.idMasked || order?.id || "").trim();
    if (displayId) parts.push(`Order #${displayId} is being cleared before the guarded exit retries.`);
    parts.push(primaryLockPostureLabel(slot));
    return parts.filter(Boolean).join(" ");
  }

  if (stage === "exit-waiting") {
    const tracking = primaryTrackingState(slot);
    const gateState = String(primaryExitGateState(slot) || "").toUpperCase();
    const requiredNetPct = primaryExitRequiredNetPct(slot);
    const requiredProfitAud = primaryExitRequiredProfitAud(slot);
    const executableNetPct = primaryExecutableExitNetPct(slot);
    const executableProfitAud = primaryExecutableExitProfitAud(slot);
    const gateReason = primaryExitGateReason(slot);
    const protectionMode =
      gateState === "WAIT_EXECUTABLE" ||
      tracking === "PARENT_EXIT_NO_LOSS_WATCH" ||
      tracking === "NO_LOSS_EXIT_MISSED_WAIT_RECOVERY" ||
      tracking === "PARENT_EXIT_FLOOR_WATCH" ||
      tracking === "PARENT_EXIT_WAIT_PROFIT_RECOVERY" ||
      requiredNetPct == null;
    const parts = [
      tracking === "PARENT_EXIT_NO_LOSS_WATCH"
        ? "Primary is in no-loss watch; any tracked resting sell is cleared before a net-positive harvest attempt."
        : tracking === "NO_LOSS_EXIT_MISSED_WAIT_RECOVERY"
          ? "Primary missed the no-loss exit window; the lock remains held while executable sell waits for net-positive recovery."
          : tracking === "PARENT_EXIT_FLOOR_WATCH"
        ? "Primary is watching the floor zone; any tracked resting sell is cleared before a net-positive harvest attempt."
        : tracking === "PARENT_EXIT_WAIT_PROFIT_RECOVERY"
          ? "Primary floor is breached; the lock remains held while executable sell waits for net-positive recovery."
          : protectionMode
        ? "Protection sell is armed and waiting for the executable sell to clear net-gain protection."
        : "Green exit is still blocked.",
    ];
    if (
      requiredNetPct != null &&
      Number.isFinite(requiredNetPct) &&
      requiredProfitAud != null &&
      Number.isFinite(requiredProfitAud)
    ) {
      parts.push(
        `Needs executable net above ${pctNum(requiredNetPct)} and executable profit above ${moneyAud(requiredProfitAud)}.`
      );
    } else if (requiredNetPct != null && Number.isFinite(requiredNetPct)) {
      parts.push(`Needs executable net above ${pctNum(requiredNetPct)}.`);
    }
    if (
      executableNetPct != null &&
      Number.isFinite(executableNetPct) &&
      executableProfitAud != null &&
      Number.isFinite(executableProfitAud)
    ) {
      parts.push(
        `Current executable sell is ${pctNum(executableNetPct)} and ${moneyAud(executableProfitAud)}.`
      );
    }
    if (gateReason && !/needs\s*>?=/i.test(gateReason)) parts.push(gateReason);
    return parts.join(" ");
  }

  if (stage === "entering") return "Primary entry is confirming live.";
  if (stage === "exiting") return "Primary sell is confirming live.";
  if (slotHasSecondaryReconciliationAttention(slot)) {
    return secondaryReconciliationWarningLabel(slot) ?? "Secondary reconciliation needs attention.";
  }
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
  if (stage === "clearing-exit-order") return actionNeededSummary(slot);
  if (stage === "exit-waiting") return actionNeededSummary(slot);
  if (stage === "exiting") return "Primary sell is resolving live.";
  if (stage === "entering") return "Primary entry is confirming live.";
  if (stage === "protected-primary") return "Protection is armed and the Primary is being defended live.";
  return "Primary is live and still building protection.";
}

function positionStageSummary(slot: SlotRow) {
  const stage = positionStageForSlot(slot);
  if (stage === "waiting-setup" || stage === "reversal-confirming") return waitingPrimarySummary(slot);
  if (stage === "entering" || stage === "clearing-exit-order" || stage === "exit-waiting" || stage === "exiting") {
    return actionNeededSummary(slot);
  }
  return activePrimarySummary(slot);
}

function positionCardToneClass(slot: SlotRow) {
  const stage = positionStageForSlot(slot);
  if (stage === "clearing-exit-order") return "is-deploying";
  if (stage === "exit-waiting") return "is-blocked";
  if (stage === "exiting") return "is-exiting";
  if (stage === "entering" || stage === "reversal-confirming") return "is-deploying";
  if (stage === "protected-primary" || stage === "live-primary") return "is-holding";
  return stateToneClass(slot);
}

function positionMetricsForSlot(slot: SlotRow, nowMs: number): PositionMetric[] {
  const stage = positionStageForSlot(slot);
  const decision = primaryDecision(slot);

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
      { label: "Ledger Net", value: pctNum(liveParentNetPct(slot)), toneClass: "is-holding" },
      { label: "Live Gross", value: pctNum(liveParentGrossPct(slot)), toneClass: "is-tracking" },
      ...(primaryExecutableExitNetPct(slot) != null
        ? [{ label: "Exec Sell Net", value: pctNum(primaryExecutableExitNetPct(slot)), toneClass: "is-blocked" }]
        : []),
      { label: "Protection", value: primaryProtectionLabel(slot) },
      { label: "Secondary Trades", value: secondaryTradesLabel(slot), toneClass: primarySubslotToneClass(slot) },
    ];
  }

  if (stage === "protected-primary") {
    const liveNet = liveParentNetPct(slot);
    const floorPct = decision?.exitFloorPct ?? primaryExitFloorPct(slot);
    const floorGap =
      liveNet != null &&
      floorPct != null &&
      Number.isFinite(liveNet) &&
      Number.isFinite(floorPct) &&
      Number(floorPct) > 0
        ? Number(liveNet) - Number(floorPct)
        : null;
    return [
      { label: "Ledger Net", value: pctNum(liveParentNetPct(slot)), toneClass: "is-holding" },
      { label: "Live Gross", value: pctNum(liveParentGrossPct(slot)), toneClass: "is-tracking" },
      ...(primaryExecutableExitNetPct(slot) != null
        ? [{ label: "Exec Sell Net", value: pctNum(primaryExecutableExitNetPct(slot)), toneClass: "is-blocked" }]
        : []),
      { label: "Exit Floor", value: pctNum(decision?.exitFloorPct ?? primaryExitFloorPct(slot)) },
      {
        label: "Gap To Floor",
        value: floorGap == null ? "-" : floorGap >= 0 ? `${pctNum(floorGap)} above` : `${pctNum(Math.abs(floorGap))} below`,
      },
    ];
  }

  if (stage === "clearing-exit-order") {
    return [
      { label: "Order State", value: exitOrderSummaryLabel(primaryExitOrderData(slot)), toneClass: "is-deploying" },
      { label: "Exit Floor", value: pctNum(decision?.exitFloorPct ?? primaryExitFloorPct(slot)) },
      { label: "Exec Sell Net", value: pctNum(primaryExecutableExitNetPct(slot)), toneClass: "is-blocked" },
      { label: "Next Step", value: "Retry floor exit next tick", toneClass: "is-deploying" },
    ];
  }

  if (stage === "exit-waiting") {
    return [
      { label: "Floor State", value: primaryExitGateStateLabel(slot), toneClass: "is-blocked" },
      {
        label: "Exec Sell Net",
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
      { label: "Giveback", value: pctNum(primaryNoLossGivebackPct(slot)) },
    ];
  }

  return [
    { label: "Ledger Net", value: pctNum(liveParentNetPct(slot)), toneClass: "is-exiting" },
    { label: "Live Gross", value: pctNum(liveParentGrossPct(slot)), toneClass: "is-tracking" },
    ...(primaryExecutableExitNetPct(slot) != null
      ? [{ label: "Exec Sell Net", value: pctNum(primaryExecutableExitNetPct(slot)), toneClass: "is-blocked" }]
      : []),
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
  const [readiness, setReadiness] = useState<PublicReadinessResponse | null>(null);
  const [managerStatus, setManagerStatus] = useState<ManagerStatusResponse | null>(null);
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
    try {
      return await engineDiagnosticsFetch<PublicMetaResponse>("meta", signal);
    } catch {
      return await fetchJson<PublicMetaResponse>("/api/public/meta", signal);
    }
  }, [fetchJson]);

  const fetchReadiness = useCallback(async (signal?: AbortSignal) => {
    return await fetchJson<PublicReadinessResponse>("/api/public/readiness", signal);
  }, [fetchJson]);

  const fetchManagerStatus = useCallback(async (signal?: AbortSignal) => {
    return await fetchJson<ManagerStatusResponse>("/api/manager/status", signal);
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
        readinessRes,
        managerStatusRes,
        slotsRes,
        eventsRes,
      ] = await Promise.allSettled([
        fetchMarketRowsAll(ctrl.signal),
        fetchMarketRowsAud(ctrl.signal),
        fetchSnap(ctrl.signal),
        fetchMeta(ctrl.signal),
        fetchReadiness(ctrl.signal),
        fetchManagerStatus(ctrl.signal),
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

      if (readinessRes.status === "fulfilled") {
        setReadiness(readinessRes.value);
        successCount += 1;
      } else {
        failures.push(`readiness unavailable`);
      }

      if (managerStatusRes.status === "fulfilled") {
        setManagerStatus(managerStatusRes.value);
        successCount += 1;
      } else {
        failures.push(`manager/status unavailable`);
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
  }, [BASE, fetchMarketRowsAll, fetchMarketRowsAud, fetchSnap, fetchMeta, fetchReadiness, fetchManagerStatus, fetchPublicSlots, fetchPublicEvents]);

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

  return { rowsAll, rowsAud, snap, meta, readiness, managerStatus, capital, slotRows, events, err, refresh };
}

function currentAustralianFyLabel() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const start = month >= 7 ? year : year - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

async function engineDiagnosticsFetch<T>(action: string, signal?: AbortSignal) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Engineer sign-in required for diagnostics.");

  const params = new URLSearchParams({ action, ts: String(Date.now()) });
  const response = await fetch(`/api/engine-diagnostics?${params.toString()}`, {
    method: "GET",
    headers: { authorization: `Bearer ${token}` },
    signal,
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`diagnostics ${action} HTTP ${response.status}`);
  return (await response.json()) as T;
}

async function engineBooksFetch<T>(
  action: string,
  options: { fy?: string; method?: "GET" | "POST"; body?: unknown; query?: Record<string, string | number | null | undefined> } = {}
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Engineer sign-in required for Books.");

  const params = new URLSearchParams({ action });
  if (options.fy) params.set("fy", options.fy);
  for (const [key, value] of Object.entries(options.query || {})) {
    if (value != null && String(value).trim()) params.set(key, String(value));
  }

  const response = await fetch(`/api/engine-books?${params.toString()}`, {
    method: options.method || "GET",
    headers: {
      authorization: `Bearer ${token}`,
      ...(options.method === "POST" ? { "content-type": "application/json" } : {}),
    },
    body: options.method === "POST" ? JSON.stringify(options.body || {}) : undefined,
  });

  if (!response.ok) {
    let detail = `${action} HTTP ${response.status}`;
    try {
      const json = (await response.json()) as { error?: string; detail?: string; warnings?: string[] };
      if (json?.detail) detail = json.detail;
      else if (json?.error) detail = json.error;
      else if (json?.warnings?.[0]) detail = json.warnings[0];
    } catch {
      detail = `${action} HTTP ${response.status}`;
    }
    throw new Error(detail);
  }

  return (await response.json()) as T;
}

async function downloadEngineBooksCsv(action: string, fy: string, filename: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Engineer sign-in required for Books export.");
  const params = new URLSearchParams({ action, fy });
  const response = await fetch(`/api/engine-books?${params.toString()}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`${action} HTTP ${response.status}`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function useBooksData() {
  const [fy, setFy] = useState(() => currentAustralianFyLabel());
  const [summary, setSummary] = useState<BooksSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<BooksImportResponse | null>(null);
  const [syncing, setSyncing] = useState<"selected_fy" | "all_since_start" | null>(null);
  const [syncResult, setSyncResult] = useState<BooksSyncResponse | null>(null);
  const [cgtReview, setCgtReview] = useState<CgtReviewPack | null>(null);
  const [cgtLoading, setCgtLoading] = useState(false);
  const [cgtErr, setCgtErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const next = await engineBooksFetch<BooksSummary>("summary", { fy });
      setSummary(next);
    } catch (error) {
      setErr(error instanceof Error ? error.message : String(error));
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [fy]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const refreshCgt = useCallback(async () => {
    setCgtLoading(true);
    setCgtErr(null);
    try {
      const next = await engineBooksFetch<CgtReviewPack>("cgt-review", { fy });
      setCgtReview(next);
    } catch (error) {
      setCgtErr(error instanceof Error ? error.message : String(error));
      setCgtReview(null);
    } finally {
      setCgtLoading(false);
    }
  }, [fy]);

  useEffect(() => {
    void refreshCgt();
  }, [refreshCgt]);

  const importHistory = useCallback(
    async (text: string) => {
      setImporting(true);
      setErr(null);
      setImportResult(null);
      try {
        const result = await engineBooksFetch<BooksImportResponse>("import", {
          method: "POST",
          body: { text },
        });
        if (result.ok === false) {
          throw new Error(result.error || result.warnings?.[0] || "CoinSpot trade history import failed.");
        }

        setImportResult(result);
        await refresh();
        await refreshCgt();
      } catch (error) {
        setErr(error instanceof Error ? error.message : String(error));
      } finally {
        setImporting(false);
      }
    },
    [refresh, refreshCgt]
  );

  const addEntry = useCallback(
    async (entry: {
      type: string;
      amountAud?: string;
      note?: string;
      asset?: string;
      quantity?: string;
      acquiredAt?: string;
      costBaseAud?: string;
    }) => {
      setErr(null);
      try {
        await engineBooksFetch("entry", {
          method: "POST",
          body: entry,
        });
        await refresh();
        await refreshCgt();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setErr(message);
        throw error instanceof Error ? error : new Error(message);
      }
    },
    [refresh, refreshCgt]
  );

  const syncReadOnly = useCallback(
    async (mode: "selected_fy" | "all_since_start") => {
      setSyncing(mode);
      setErr(null);
      setSyncResult(null);
      try {
        const result = await engineBooksFetch<BooksSyncResponse>("sync", {
          method: "POST",
          body: { fy, mode },
        });
        setSyncResult(result);
        await refresh();
        await refreshCgt();
      } catch (error) {
        setErr(error instanceof Error ? error.message : String(error));
      } finally {
        setSyncing(null);
      }
    },
    [fy, refresh, refreshCgt]
  );

  const downloadExport = useCallback(async () => {
    await downloadEngineBooksCsv("export", fy, `jalsol-books-${fy}.csv`);
  }, [fy]);

  const downloadCgtDisposals = useCallback(async () => {
    await downloadEngineBooksCsv("cgt-disposals-csv", fy, `coinspot-cgt-${fy}-disposals.csv`);
  }, [fy]);

  const downloadCgtPack = useCallback(async () => {
    await downloadEngineBooksCsv("cgt-pack-csv", fy, `jalsol-ato-cgt-review-pack-${fy}.csv`);
  }, [fy]);

  return {
    fy,
    setFy,
    summary,
    loading,
    err,
    refresh,
    importing,
    importHistory,
    importResult,
    syncing,
    syncReadOnly,
    syncResult,
    addEntry,
    downloadExport,
    cgtReview,
    cgtLoading,
    cgtErr,
    refreshCgt,
    downloadCgtDisposals,
    downloadCgtPack,
  };
}

/* =========================
   Presentational Components
========================= */

const EngineHealthStrip = React.memo(function EngineHealthStrip(props: {
  snap: Snapshot | null;
  meta: PublicMetaResponse | null;
  capital: PublicCapitalResponse | null;
  executionMode: string;
  snapshotAgeMs: number | null;
  snapshotFresh: boolean;
  err: string | null;
}) {
  const serviceOk = props.snap?.ok === true && !props.err;
  const capitalOk = props.capital != null && !props.capital.refreshError;
  const writeGate = writeGateLabel(props.meta);
  const lastPoll = compactAgeLabel(props.snapshotAgeMs);

  return (
    <div className="engine-health-strip" aria-label="Engine health">
      <div className={`engine-health-pill ${serviceOk ? "ok" : "warn"}`}>
        <span>Service</span>
        <strong>{serviceOk ? "Online" : "Backend Waiting"}</strong>
      </div>
      <div className={`engine-health-pill ${props.snapshotFresh ? "ok" : "warn"}`}>
        <span>Snapshot</span>
        <strong>{props.snapshotFresh ? "Fresh" : props.snapshotAgeMs == null ? "Waiting" : "Stale"}</strong>
      </div>
      <div className="engine-health-pill">
        <span>Execution</span>
        <strong>{props.executionMode || "SIM"}</strong>
      </div>
      <div className={`engine-health-pill ${writeGate === "Enabled" ? "ok" : writeGate === "Disabled" ? "warn" : ""}`}>
        <span>Write Gate</span>
        <strong>{writeGate}</strong>
      </div>
      <div className={`engine-health-pill ${capitalOk ? "ok" : "warn"}`}>
        <span>Capital</span>
        <strong>{capitalOk ? "Published" : "Endpoint Unavailable"}</strong>
      </div>
      <div className="engine-health-pill">
        <span>Last Poll</span>
        <strong>{lastPoll}</strong>
      </div>
    </div>
  );
});

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
            Service <span>{snap?.ok ? "Online" : "Backend Waiting"}</span>
          </span>

          <span className={`indicator status ${snap?.ok ? "ok" : "warn"}`}>
            Snapshot <span>{formatSnapshotLabel(snap, nowMs)}</span>
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
  entryAllocation: EntryAllocation | null | undefined;
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
        <div className="cap-v">{moneyAud(pairAwareAvailableAud({
          audAvailable: props.audAvailable,
          entryAllocation: props.entryAllocation,
        }))}</div>
        <div className="cap-sub">
          <span>{pairAwareCapitalSubline({
            audAvailable: props.audAvailable,
            walletAudValue: props.walletAudValue,
            movableAudEstimate: props.movableAudEstimate,
            entryAllocation: props.entryAllocation,
          })}</span>
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
  sortKey: SortKey;
  sortDir: SortDir;
  setSortKey: React.Dispatch<React.SetStateAction<SortKey>>;
  setSortDir: React.Dispatch<React.SetStateAction<SortDir>>;
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  refresh: () => Promise<void>;
  lastRefreshLabel: string;
}) {
  const sortValue = `${props.sortKey}:${props.sortDir}`;

  return (
    <div className="engine-controls-wrap" aria-label="Controls">
      <div className="engine-controls">
        <div className="engine-control-group" aria-label="View mode">
          <span className="engine-control-label">View</span>
          <div className="engine-segmented">
            <button
              type="button"
              className={props.view === "simple" ? "active" : ""}
              onClick={() => props.setView("simple")}
            >
              Simple
            </button>
            <button
              type="button"
              className={props.view === "advanced" ? "active" : ""}
              onClick={() => props.setView("advanced")}
            >
              Advanced
            </button>
          </div>
        </div>

        <div className="engine-control-group" aria-label="Feed filter">
          <span className="engine-control-label">Feed</span>
          <div className="engine-segmented">
            {(["aud", "engine", "watch", "all"] as Feed[]).map((nextFeed) => (
              <button
                key={nextFeed}
                type="button"
                className={props.feed === nextFeed ? "active" : ""}
                onClick={() => props.setFeed(nextFeed)}
              >
                {nextFeed === "aud" ? "AUD" : nextFeed === "all" ? "All" : nextFeed === "engine" ? "Engine" : "Watch"}
              </button>
            ))}
          </div>
        </div>

        <label className="engine-control-group engine-control-select">
          <span className="engine-control-label">Sort</span>
          <select
            className="engine-select"
            value={sortValue}
            onChange={(event) => {
              const [nextKey, nextDir] = event.target.value.split(":") as [SortKey, SortDir];
              props.setSortKey(nextKey);
              props.setSortDir(nextDir);
            }}
          >
            <option value="coin:asc">A-Z</option>
            <option value="spread:asc">Spread</option>
            <option value="mid:desc">Price High</option>
            <option value="mid:asc">Price Low</option>
          </select>
        </label>

        <input
          className="engine-filter"
          value={props.query}
          onChange={(e) => props.setQuery(e.target.value)}
          placeholder="Filter coins / states / regime..."
          aria-label="Filter"
        />

        <button type="button" className="button ghost engine-refresh-button" onClick={() => void props.refresh()}>
          Refresh <span>{props.lastRefreshLabel}</span>
        </button>
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
            Ledger Net tracks the primary P/L read. Executable Sell Net is shown separately when the exit gate has a live protection check.
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
                <div className="engine-carousel-k">Ledger Net</div>
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
                <>
                  <div className="engine-subslot-grid">
                    <div className="engine-subslot-item">
                      <div className="engine-subslot-k">Band</div>
                      <div className="engine-subslot-v">{subslotTriggerBandLabel(carouselPrimary)}</div>
                    </div>

                    <div className="engine-subslot-item">
                      <div className="engine-subslot-k">
                        Trigger {secondaryTriggerBasisTitleLabel(carouselPrimary, props.subslotConfig)}
                      </div>
                      <div className="engine-subslot-v">{pctNum(carouselPrimary.subslotTriggerBandPct ?? carouselPrimary.subslotTriggerParentNetPct)}</div>
                    </div>

                    <div className="engine-subslot-item">
                      <div className="engine-subslot-k">Trigger / Exit</div>
                      <div className="engine-subslot-v">
                        {subslotLiveCounterLabel(carouselPrimary, carouselSlot, props.subslotConfig)}
                      </div>
                    </div>

                    <div className="engine-subslot-item">
                      <div className="engine-subslot-k">
                        Parent {secondaryTriggerBasisTitleLabel(carouselPrimary, props.subslotConfig)} @ Open
                      </div>
                      <div className="engine-subslot-v">{pctNum(secondaryParentAtOpenPct(carouselPrimary, props.subslotConfig))}</div>
                    </div>

                    <div className="engine-subslot-item">
                      <div className="engine-subslot-k">Signal</div>
                      <div className="engine-subslot-v">{carouselPrimary.subslotSignalState ?? "-"}</div>
                    </div>

                    <div className="engine-subslot-item">
                      <div className="engine-subslot-k">Net Confirm</div>
                      <div className="engine-subslot-v">{subslotNetConfirmStatusLabel(carouselPrimary, carouselSlot)}</div>
                    </div>

                    <div className="engine-subslot-item">
                      <div className="engine-subslot-k">Entry Law</div>
                      <div className="engine-subslot-v">{subslotHybridAwarenessLabel(carouselPrimary, carouselSlot)}</div>
                    </div>

                    <div className="engine-subslot-item">
                      <div className="engine-subslot-k">Confirm</div>
                      <div className="engine-subslot-v">
                        {carouselPrimary.subslotConfirmTicks != null ? carouselPrimary.subslotConfirmTicks : "-"}
                      </div>
                    </div>

                    <div className="engine-subslot-item">
                      <div className="engine-subslot-k">Bounce</div>
                      <div className="engine-subslot-v">{pctNum(carouselPrimary.subslotBouncePct)}</div>
                    </div>

                    <div className="engine-subslot-item">
                      <div className="engine-subslot-k">EMA Gap</div>
                      <div className="engine-subslot-v">{pctNum(carouselPrimary.subslotEmaGapPct)}</div>
                    </div>
                  </div>

                  {subslotExitGateBlock(carouselPrimary, props.nowMs, "compact")}
                  {subslotEntryQualityBlock(carouselPrimary, "compact")}
                </>
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
  capital: PublicCapitalResponse | null;
  onOpenSlot: (id: string) => void;
  nowMs: number;
}) {
  const actionSlots = props.slots.filter(slotNeedsAction);
  const exposureRows = capitalExposureAttentionRows(props.capital);
  const actionCount = actionSlots.length + exposureRows.length;
  const liveSlots = props.slots.filter((slot) => {
    const stage = positionStageForSlot(slot);
    return (
      stage === "entering" ||
      stage === "clearing-exit-order" ||
      stage === "exit-waiting" ||
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
          <div className="dashboard-metric-v">{actionCount}</div>
          <div className="dashboard-metric-sub">Entries, exits, blocked reads, or wallet drift needing attention.</div>
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
              <div className="dashboard-panel-note">Only the live items that are actively moving, blocked, or mismatched.</div>
            </div>
            <div className="dashboard-panel-count">{actionCount}</div>
          </div>

          {actionCount ? (
            <div className="dashboard-list">
              {exposureRows.map((coin) => {
                const slot = props.slots.find((row) => String(row.coin || "").toUpperCase() === String(coin.coin || "").toUpperCase());
                const coverageLabel = secondaryCoverageAttentionLabel(coin.secondaryWalletCoverage);
                return (
                  <button
                    type="button"
                    key={`exposure-${coin.coin || "coin"}`}
                    className="dashboard-row is-exposure"
                    onClick={() => {
                      if (slot?.id) props.onOpenSlot(slot.id);
                    }}
                  >
                    <div className="dashboard-row-top">
                      <div className="dashboard-row-coin">{coin.coin ?? "-"}</div>
                      <div className="dashboard-row-badge">{coverageLabel ? "Secondary Coverage" : "Quantity Drift"}</div>
                    </div>
                    <div className="dashboard-row-copy">
                      {coverageLabel
                        ? `CoinSpot wallet coverage mismatch: ${coverageLabel}.`
                        : `CoinSpot wallet quantity is ${quantityDriftLabel(coin.quantityDriftAud)} versus tracked primary and secondary coin quantities.`}
                    </div>
                    <div className="dashboard-row-meta">
                      <span>Wallet {moneyAud(coin.audValue)}</span>
                      <span>Tracked {moneyAud(coin.trackedAud)}</span>
                      <span>Value vs cost {valueVsCostLabel(coinValueVsCost(coin))}</span>
                      {coin.secondaryWalletCoverage?.shortageAud ? (
                        <span>Secondary short {moneyAud(coin.secondaryWalletCoverage.shortageAud)}</span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
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
                What is already in motion, including protection and exit readiness. Ledger Net is the primary P/L read; Executable Sell Net is the broker-sell readiness check used by exit gates.
              </div>
            </div>
            <div className="dashboard-panel-count">{liveSlots.length}</div>
          </div>

          {liveSlots.length ? (
            <div className="dashboard-list">
              {liveSlots.map((slot) => {
                const capitalCoin = capitalCoinForSlot(props.capital, slot);
                const secondaryWarning = secondaryReconciliationWarningLabel(slot, capitalCoin);
                return (
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
                    <span>Ledger Net {pctNum(liveParentNetPct(slot))}</span>
                    <span>Live Gross {pctNum(liveParentGrossPct(slot))}</span>
                    {primaryExecutableExitNetPct(slot) != null ? (
                      <span>Exec Sell {pctNum(primaryExecutableExitNetPct(slot))}</span>
                    ) : null}
                    {primaryExitGateState(slot) ? (
                      <span>Exit Gate {primaryExitGateStateLabel(slot)}</span>
                    ) : null}
                    <span>{primaryProtectionLabel(slot)}</span>
                    {capitalCoin ? (
                      <span>Qty drift {quantityDriftLabel(capitalCoin.quantityDriftAud)}</span>
                    ) : null}
                    {secondaryWarning ? <span>Secondary mismatch</span> : null}
                  </div>
                  {secondaryWarning ? <div className="dashboard-row-copy">{secondaryWarning}</div> : null}
                  {primaryExitProgressBlock(slot, props.holding)}
                  {primarySecondaryRail(slot, props.subslotConfig, capitalCoin)}
                  <div className="dashboard-row-meta">
                    <span>{slotHeartbeatCardLabel(slot, props.nowMs)}</span>
                  </div>
                </button>
                );
              })}
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
    "clearing-exit-order": 0,
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
          <div className="positions-summary-k">Clearing Orders</div>
          <div className="positions-summary-v">{stageCounts["clearing-exit-order"]}</div>
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
  readiness: PublicReadinessResponse | null;
  managerStatus: ManagerStatusResponse | null;
  fixedAllowlist: string[];
  executionMode: string;
}) {
  const allowlistLabel = props.fixedAllowlist.length
    ? props.fixedAllowlist.join(", ")
    : "BTC, ETH, XRP, SOL, DOGE, ADA, LTC, TRX";
  const gates = props.meta?.gates;
  const manager = props.meta?.manager;
  const subslot = manager?.subslot;
  const capitalConfig = manager?.capital ?? props.managerStatus?.capital;
  const quoteGuard = props.meta?.runtime?.quoteGuard;
  const readinessLabel =
    props.readiness?.ok === true
      ? "READY"
      : props.readiness?.ok === false
      ? `BLOCKED ${Array.isArray(props.readiness?.blockers) ? props.readiness.blockers.length : 0}`
      : "UNKNOWN";
  const managerRuntimeLabel = `${props.managerStatus?.running === true ? "RUNNING" : "STOPPED"} | ${
    props.managerStatus?.mode ?? manager?.mode ?? "-"
  }`;

  const secondarySizeMode = String(
    subslot?.entrySizeMode ?? capitalConfig?.subslotEntrySizeMode ?? "PCT_OF_PARENT"
  ).toUpperCase();
  const secondaryBaseSize =
    secondarySizeMode === "STATIC_AUD"
      ? `${moneyAud(subslot?.entryTargetAud ?? capitalConfig?.subslotEntryTargetAud)} static`
      : subslot?.sizePctOfParent != null && Number.isFinite(subslot.sizePctOfParent)
      ? `${(subslot.sizePctOfParent * 100).toFixed(0)}%`
      : "20%";
  const primaryCapitalLabel = `${String(capitalConfig?.entryCapitalMode || "COMPOUNDING_REENTRY").toUpperCase()} | primary ${moneyAud(
    capitalConfig?.primaryTargetAud
  )}`;
  const secondaryForcedCap =
    subslot?.maxForcedSizePct != null && Number.isFinite(subslot.maxForcedSizePct)
      ? `${(subslot.maxForcedSizePct * 100).toFixed(0)}%`
      : "60%";
  const secondaryBandSizing =
    subslot?.bandSizing?.enabled === true
      ? `ON | step ${(Number(subslot.bandSizing?.stepMult ?? 0) * 100).toFixed(0)}% | cap ${(Number(
          subslot.bandSizing?.maxMult ?? 0
        ) * 100).toFixed(0)}%`
      : "OFF | fixed base sizing";
  const secondaryTriggerReuse = `${yesNo(subslot?.triggerBandReuse?.enabled)} | cooldown ${msToShortLabel(
    subslot?.triggerBandReuse?.cooldownMs
  )}`;
  const secondaryEntryLaw = `${String(subslot?.entryLaw || "GROSS_NET_SPREAD").toUpperCase()} | band required ${yesNo(
    subslot?.requireTriggerBand
  )} | spread bypass ${yesNo(subslot?.triggerTouchBypassSpread)}`;
  const secondaryNetConfirm =
    subslot?.entryParentNetConfirmPct != null && Number.isFinite(subslot.entryParentNetConfirmPct)
      ? `${pctNum(subslot.entryParentNetConfirmPct)} executable net`
      : "0.00% executable net";
  const secondaryEntryCost = `${subslot?.entryRequireSecondaryCheaper === false ? "OFF" : "ON"} | min cheaper ${pctNum(
    subslot?.entryMinDiscountPct ?? 0
  )}`;
  const exitOrderMode =
    subslot?.exitOrderManager?.dryRun === false && subslot?.exitOrderManager?.liveMutationEnabled === true
      ? "LIVE ORDERS"
      : subslot?.exitOrderManager?.requestedDryRun === false && subslot?.exitOrderManager?.liveMutationEnabled !== true
      ? "SAFE DRY-RUN"
      : "DRY-RUN";
  const managerVersionLabel = String(props.managerStatus?.version || manager?.version || "-").replace(
    /exit-order-manager-dry-run/gi,
    exitOrderMode === "LIVE ORDERS" ? "exit-order-manager-live" : "exit-order-manager"
  );
  const exitOrderManager = `${yesNo(subslot?.exitOrderManager?.enabled)} | ${exitOrderMode} | primary ${yesNo(
    subslot?.exitOrderManager?.primaryEnabled
  )} | secondary ${yesNo(subslot?.exitOrderManager?.secondaryEnabled)}`;
  const secondaryEntryPacing = `${yesNo(subslot?.entryPacing?.enabled)} | ${msToShortLabel(
    subslot?.entryPacing?.pacingMs
  )} | bypass ${pctNum(subslot?.entryPacing?.bypassParentDeltaPct)}`;
  const secondaryPrimaryFillGuard =
    subslot?.requirePrimaryExactFill === false ? "balance proof allowed" : "exact fill required";
  const secondaryPerfReuse = `${yesNo(subslot?.perfReuse?.enabled)} | confirm -${
    subslot?.perfReuse?.confirmTickReduction ?? 0
  } | pace x${Number(subslot?.perfReuse?.pacingMult ?? 0).toFixed(2)}`;
  const secondaryExitHarvest = [
    subslot?.takeProfitEnabled === true ? "take profit" : null,
    subslot?.bandHarvest?.enabled === true ? "band harvest" : null,
    subslot?.greenStall?.enabled === true ? "green stall" : null,
    subslot?.parentRecoveryExit?.enabled === true ? "parent recovery" : null,
  ]
    .filter(Boolean)
    .join(" | ");
  const secondaryRecovery = `net floor ${pctNum(subslot?.minWinExitNetPct)} | green confirm ${
    subslot?.exitGreenConfirmTicks ?? "-"
  }`;

  return (
    <div className="engine-bay">
      <div className="bay-head">
        <div className="bay-title">Trading Behavior Blueprint</div>
        <div className="bay-note">
          Current fixed-slot machine profile rendered from live public meta, readiness, and manager status.
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
            <div className="slot-k">Runtime Source</div>
            <div className="slot-v">public meta + readiness + manager status</div>
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
            <div className="slot-k">Readiness</div>
            <div className="slot-v">
              {readinessLabel} | CoinSpot read {yesNo(props.readiness?.coinspot?.readCreds)} | trade{" "}
              {yesNo(props.readiness?.coinspot?.tradeCreds)}
            </div>
          </div>
          <div>
            <div className="slot-k">Manager Runtime</div>
            <div className="slot-v">{managerRuntimeLabel}</div>
          </div>
          <div>
            <div className="slot-k">Manager Version</div>
            <div className="slot-v">{managerVersionLabel}</div>
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
            <div className="slot-v">{primaryCapitalLabel} | quote guard {quoteGuardLabel(quoteGuard)}</div>
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
              {subslot?.enabled === false ? "OFF" : "ON"} | {secondarySizeMode} | {secondaryBaseSize}
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
            <div className="engine-telemetry-title">Secondary Upgrades Live</div>
            <div className="engine-telemetry-note">
              This block reflects the live secondary entry and exit upgrades now active on the backend, including reusable bands, pacing, quote-aware entry telemetry, and {exitOrderMode.toLowerCase()} exit-order management.
            </div>
          </div>
        </div>

        <div className="slot-modal-grid">
          <div>
            <div className="slot-k">Sizing</div>
            <div className="slot-v">
              base {secondaryBaseSize} | forced cap {secondaryForcedCap} | band sizing {secondaryBandSizing}
            </div>
          </div>
          <div>
            <div className="slot-k">Trigger Reuse</div>
            <div className="slot-v">{secondaryTriggerReuse}</div>
          </div>
          <div>
            <div className="slot-k">Entry Law</div>
            <div className="slot-v">{secondaryEntryLaw}</div>
          </div>
          <div>
            <div className="slot-k">Net Confirm</div>
            <div className="slot-v">{secondaryNetConfirm}</div>
          </div>
          <div>
            <div className="slot-k">Entry Cost</div>
            <div className="slot-v">{secondaryEntryCost}</div>
          </div>
          <div>
            <div className="slot-k">Exit Orders</div>
            <div className="slot-v">{exitOrderManager}</div>
          </div>
          <div>
            <div className="slot-k">Entry Pacing</div>
            <div className="slot-v">{secondaryEntryPacing}</div>
          </div>
          <div>
            <div className="slot-k">Parent Fill Guard</div>
            <div className="slot-v">{secondaryPrimaryFillGuard}</div>
          </div>
          <div>
            <div className="slot-k">Perf Reuse</div>
            <div className="slot-v">{secondaryPerfReuse}</div>
          </div>
          <div>
            <div className="slot-k">Exit Harvesting</div>
            <div className="slot-v">{secondaryExitHarvest || "Executable green only"}</div>
          </div>
          <div>
            <div className="slot-k">Executable Green Gate</div>
            <div className="slot-v">{secondaryRecovery}</div>
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
              <div className="slot-k">Ledger Net</div>
              <div className="slot-v">{pctNum(liveParentNetPct(slot))}</div>
            </div>
            <div className="slot-modal-strip-item">
              <div className="slot-k">Exec Sell Net</div>
              <div className="slot-v">{pctNum(primaryExecutableExitNetPct(slot))}</div>
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
          <div className="slot-v">
            Ledger Net is the primary P/L read. Executable Sell Net is the explicit sell-readiness check used by
            exit gates. Live Gross tracks the same primary move before friction and fees.
          </div>
          <div className="slot-v">{primaryComparisonScopeLabel(slot)}</div>

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
                <div className="slot-k">{primaryTrailFloorTitle(slot)}</div>
                <div className="slot-v">{primaryTrailFloorLabel(slot)}</div>
              </div>
              <div className="primary-rail-item">
                <div className="slot-k">{primaryTrailPeakTitle(slot)}</div>
                <div className="slot-v">{primaryTrailPeakLabel(slot)}</div>
              </div>
              {slot.level === 4 ? (
                <>
                  <div className="primary-rail-item">
                    <div className="slot-k">Bid Buffer To Exit</div>
                    <div className="slot-v">{primaryLvl4BidBufferLabel(slot)}</div>
                  </div>
                  <div className="primary-rail-item">
                    <div className="slot-k">Net Buffer To Exit</div>
                    <div className="slot-v">{primaryLvl4NetBufferLabel(slot)}</div>
                  </div>
                </>
              ) : null}
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
              <div><div className="slot-k">Entry Target</div><div className="slot-v">{moneyAud(primaryEntryTargetAudValue(slot))}</div></div>
              <div><div className="slot-k">Requested Buy</div><div className="slot-v">{moneyAud(primaryEntryRequestedAudValue(slot))}</div></div>
              <div><div className="slot-k">Live Deployed</div><div className="slot-v">{moneyAud(primaryDeployedUnitAud(slot))}</div></div>
              <div><div className="slot-k">Cycles</div><div className="slot-v">{slot.cycles ?? 0}</div></div>
              <div><div className="slot-k">{String(slot.state || "").toUpperCase() === "WAITING_ENTRY" ? "Reference From Last Exit" : "Entry Mid"}</div><div className="slot-v">{effectiveEntryLabel(slot)}</div></div>
              <div><div className="slot-k">Now Mid</div><div className="slot-v">{effectiveNowLabel(slot)}</div></div>
              <div><div className="slot-k">Now Bid</div><div className="slot-v">{fmt(primaryNowBid(slot))}</div></div>
              <div><div className="slot-k">Gross Basis Mid</div><div className="slot-v">{fmt(primaryGrossBasisMid(slot))}</div></div>
              <div><div className="slot-k">Net Basis Rate</div><div className="slot-v">{fmt(primaryNetBasisRate(slot))}</div></div>
              <div><div className="slot-k">Basis Source</div><div className="slot-v">{basisSourceLabel(primaryComparison(slot)?.netBasisSource)}</div></div>
              <div><div className="slot-k">Fill Proof</div><div className="slot-v">{primaryFillProofLabel(slot)}</div></div>
              <div><div className="slot-k">Submitted Rate</div><div className="slot-v">{fmt(slot.liveEntrySubmittedRate)}</div></div>
              <div><div className="slot-k">Actual Fill Rate</div><div className="slot-v">{fmt(slot.liveEntryActualRate)}</div></div>
              <div><div className="slot-k">Live Gross</div><div className="slot-v">{pctNum(liveParentGrossPct(slot))}</div></div>
              <div><div className="slot-k">Ledger Net</div><div className="slot-v">{pctNum(liveParentNetPct(slot))}</div></div>
              <div><div className="slot-k">Executable Sell</div><div className="slot-v">{primaryExecutableExitLabel(slot)}</div></div>
              <div><div className="slot-k">Exit Gate</div><div className="slot-v">{primaryExitGateStateLabel(slot)}</div></div>
              <div><div className="slot-k">Exit Gate Reason</div><div className="slot-v">{primaryExitGateReason(slot) ?? "-"}</div></div>
              <div><div className="slot-k">Lifetime Net</div><div className="slot-v">{pctNum(primaryTotalGainPct(slot))}</div></div>
              <div><div className="slot-k">Level</div><div className="slot-v">{slot.level ? `LVL${slot.level}` : "-"}</div></div>
              <div><div className="slot-k">Protection</div><div className="slot-v">{primaryProtectionLabel(slot)}</div></div>
              <div><div className="slot-k">Exit Order</div><div className="slot-v">{exitOrderSummaryLabel(primaryExitOrderData(slot))}</div></div>
              <div><div className="slot-k">Order Target</div><div className="slot-v">{exitOrderTargetLabel(primaryExitOrderData(slot))}</div></div>
              <div><div className="slot-k">Spread</div><div className="slot-v">{pctNum(slot.nowSpreadPct)}</div></div>
              <div><div className="slot-k">Fee / Friction</div><div className="slot-v">{primaryFeeFrictionLabel(slot)}</div></div>
              <div><div className="slot-k">Drawdown</div><div className="slot-v">{pctNum(slot.drawdownPct)}</div></div>
              <div><div className="slot-k">Secondary Trades</div><div className="slot-v">{secondaryTradesLabel(slot)}</div></div>
              <div><div className="slot-k">Reference From Last Exit</div><div className="slot-v">{fmt(slot.reentryTargetMid)}</div></div>
              <div><div className="slot-k">Exit reason</div><div className="slot-v">{slot.exitReason ?? "-"}</div></div>
              <div><div className="slot-k">Created</div><div className="slot-v">{ageLabel(nowMs - slot.createdAt)}</div></div>
              <div><div className="slot-k">Updated</div><div className="slot-v">{slotHeartbeatLabel(slot, nowMs)}</div></div>
            </div>
          </CollapsibleBlock>

          <CollapsibleBlock title="Secondary Trades" defaultOpen>
            {exitOrderBlock(primaryExitOrderData(slot), "Primary Exit Order", "compact")}
            <div className="slot-section">Secondary Summary</div>

              <div className="slot-modal-grid">
              <div><div className="slot-k">Total Secondary Trades</div><div className="slot-v">{getSecondaryRows(slot).length}</div></div>
              <div><div className="slot-k">Active</div><div className="slot-v">{getActiveSecondaryRows(slot).length}</div></div>
              <div><div className="slot-k">Pending Entry</div><div className="slot-v">{hasPendingSubslotBuys(slot) ? "YES" : "NO"}</div></div>
              <div><div className="slot-k">Pending Exit</div><div className="slot-v">{hasPendingSubslotSells(slot) ? "YES" : "NO"}</div></div>
              <div><div className="slot-k">Open Secondary Trades</div><div className="slot-v">{getSubslotOpenCount(slot)}</div></div>
              <div><div className="slot-k">Closed Secondary Trades</div><div className="slot-v">{getClosedSubslotCount(slot)}</div></div>
              <div><div className="slot-k">Total Net Gain (AUD)</div><div className="slot-v">{moneyAud(secondaryTotalGainAud(slot))}</div></div>
              <div><div className="slot-k">Entry Law</div><div className="slot-v">{secondaryTriggerBasisTitleLabel(getPrimarySecondarySnapshot(slot), props.subslotConfig)}</div></div>
              <div><div className="slot-k">Gross Band Status</div><div className="slot-v">{subslotGrossBandStatusLabel(getPrimarySecondarySnapshot(slot), slot)}</div></div>
              <div><div className="slot-k">Executable Net Confirm</div><div className="slot-v">{subslotNetConfirmStatusLabel(getPrimarySecondarySnapshot(slot), slot)}</div></div>
              <div><div className="slot-k">Entry Cost</div><div className="slot-v">{subslotHybridEntryCostLabel(getPrimarySecondarySnapshot(slot), slot)}</div></div>
              <div><div className="slot-k">Entry Rates</div><div className="slot-v">{subslotHybridEntryRateLabel(getPrimarySecondarySnapshot(slot), slot)}</div></div>
              <div><div className="slot-k">Spread Status</div><div className="slot-v">{subslotSpreadStatusLabel(getPrimarySecondarySnapshot(slot), slot)}</div></div>
              <div><div className="slot-k">Entry Decision</div><div className="slot-v">{subslotHybridAwarenessLabel(getPrimarySecondarySnapshot(slot), slot)}</div></div>
              {getSecondaryRows(slot).length ? (
                <>
                  <div><div className="slot-k">Current Secondary State</div><div className={`slot-v slot-subslot ${primarySubslotToneClass(slot)}`}>{primarySubslotDecisionLabel(slot)}</div></div>
                    <div><div className="slot-k">Current Trigger Band</div><div className="slot-v">{getPrimarySecondarySnapshot(slot) ? subslotTriggerBandLabel(getPrimarySecondarySnapshot(slot) as SubslotRow) : "-"}</div></div>
                    <div><div className="slot-k">Current Trigger Summary</div><div className="slot-v">{getPrimarySecondarySnapshot(slot) ? subslotTriggerSummary(getPrimarySecondarySnapshot(slot) as SubslotRow, props.subslotConfig) : "-"}</div></div>
                    <div><div className="slot-k">Current Trigger / Exit</div><div className="slot-v">{getPrimarySecondarySnapshot(slot) ? subslotLiveCounterLabel(getPrimarySecondarySnapshot(slot) as SubslotRow, slot, props.subslotConfig) : "-"}</div></div>
                    <div><div className="slot-k">Current Live Now</div><div className="slot-v">{primarySubslotLiveNowLabel(slot)}</div></div>
                    <div><div className="slot-k">Current Updated</div><div className="slot-v">{primarySubslotHeartbeatLabel(slot, nowMs)}</div></div>
                    <div><div className="slot-k">Current Exit Gate</div><div className="slot-v">{getPrimarySecondarySnapshot(slot) ? subslotExitGateStateLabel(getPrimarySecondarySnapshot(slot) as SubslotRow) : "-"}</div></div>
                    <div><div className="slot-k">Current Exit Order</div><div className="slot-v">{exitOrderSummaryLabel(subslotExitOrderData(getPrimarySecondarySnapshot(slot)))}</div></div>
                    <div><div className="slot-k">Current Order Target</div><div className="slot-v">{exitOrderTargetLabel(subslotExitOrderData(getPrimarySecondarySnapshot(slot)))}</div></div>
                    <div><div className="slot-k">Current Needs</div><div className="slot-v">{getPrimarySecondarySnapshot(slot) ? subslotExitNeedsLabel(getPrimarySecondarySnapshot(slot) as SubslotRow) : "-"}</div></div>
                    <div><div className="slot-k">Current Exec Exit</div><div className="slot-v">{getPrimarySecondarySnapshot(slot) ? subslotExecutableExitLabel(getPrimarySecondarySnapshot(slot) as SubslotRow) : "-"}</div></div>
                    <div><div className="slot-k">Current Quote Quality</div><div className="slot-v">{getPrimarySecondarySnapshot(slot) ? subslotEntryQuoteStatusLabel(getPrimarySecondarySnapshot(slot) as SubslotRow) : "-"}</div></div>
                  </>
              ) : null}
            </div>

            {getSecondaryRows(slot).length ? (
              <>
                <div className="slot-section">Secondary Trade History</div>
                <div><div className="slot-k">Live Analysis</div><div className="slot-v">{primaryLiveSubslotAnalysis(slot, nowMs)}</div></div>
                {subslotExitGateBlock(getPrimarySecondarySnapshot(slot), nowMs)}
                {exitOrderBlock(subslotExitOrderData(getPrimarySecondarySnapshot(slot)), "Secondary Exit Order")}
                {subslotEntryQualityBlock(getPrimarySecondarySnapshot(slot))}

              <div className="secondary-list subslot-list">
                {getSecondaryRows(slot).map((subslot, index) => (
                  <div key={subslot.subslotId ?? `${slot.id}-modal-subslot-${index}`} className="secondary-card subslot-card">
                    <div className="slot-section">
                      Secondary Trade #{subslot.subslotSequence ?? index + 1} | {subslot.subslotId ?? "legacy"} | {subslotStateBadgeLabel(subslot)}
                    </div>

                    <div className="slot-modal-grid secondary-grid">
                        <div><div className="slot-k">Trigger Band</div><div className="slot-v">{subslotTriggerBandLabel(subslot)}</div></div>
                        <div><div className="slot-k">Entry Law</div><div className="slot-v">{secondaryTriggerBasisTitleLabel(subslot, props.subslotConfig)}</div></div>
                        <div><div className="slot-k">Trigger {secondaryTriggerBasisTitleLabel(subslot, props.subslotConfig)} Level</div><div className="slot-v">{pctNum(subslot.subslotTriggerBandPct ?? subslot.subslotTriggerParentNetPct)}</div></div>
                        <div><div className="slot-k">Trigger / Exit</div><div className="slot-v">{subslotLiveCounterLabel(subslot, slot, props.subslotConfig)}</div></div>
                        <div><div className="slot-k">Gross Band Status</div><div className="slot-v">{subslotGrossBandStatusLabel(subslot, slot)}</div></div>
                        <div><div className="slot-k">Net Confirmation</div><div className="slot-v">{subslotNetConfirmStatusLabel(subslot, slot)}</div></div>
                        <div><div className="slot-k">Entry Cost</div><div className="slot-v">{subslotHybridEntryCostLabel(subslot, slot)}</div></div>
                        <div><div className="slot-k">Entry Rates</div><div className="slot-v">{subslotHybridEntryRateLabel(subslot, slot)}</div></div>
                        <div><div className="slot-k">Spread Status</div><div className="slot-v">{subslotSpreadStatusLabel(subslot, slot)}</div></div>
                        <div><div className="slot-k">Entry Decision</div><div className="slot-v">{subslotHybridAwarenessLabel(subslot, slot)}</div></div>
                        <div><div className="slot-k">Exit Order</div><div className="slot-v">{exitOrderSummaryLabel(subslotExitOrderData(subslot))}</div></div>
                        <div><div className="slot-k">Order Rate</div><div className="slot-v">{fmt(subslotExitOrderData(subslot)?.rate)}</div></div>
                        <div><div className="slot-k">Order Target</div><div className="slot-v">{exitOrderTargetLabel(subslotExitOrderData(subslot))}</div></div>
                        <div><div className="slot-k">Distance To Order</div><div className="slot-v">{exitOrderDistanceLabel(subslotExitOrderData(subslot))}</div></div>
                        <div><div className="slot-k">Reprice Count</div><div className="slot-v">{subslotExitOrderData(subslot)?.repriceCount ?? "-"}</div></div>
                        <div><div className="slot-k">Last Action</div><div className="slot-v">{subslotExitOrderData(subslot)?.lastAction ?? "-"}</div></div>
                        <div><div className="slot-k">Parent {secondaryTriggerBasisTitleLabel(subslot, props.subslotConfig)} @ Open</div><div className="slot-v">{pctNum(secondaryParentAtOpenPct(subslot, props.subslotConfig))}</div></div>
                        <div><div className="slot-k">Parent Net @ Open</div><div className="slot-v">{pctNum(subslot.subslotEntryParentNetPct)}</div></div>
                        <div><div className="slot-k">Parent Gross @ Open</div><div className="slot-v">{pctNum(subslot.subslotEntryParentGrossPct)}</div></div>
                        <div><div className="slot-k">State</div><div className="slot-v">{subslot.subslotState ?? "-"}</div></div>
                        <div><div className="slot-k">Mode</div><div className="slot-v">{subslot.subslotEntryMode ?? "-"}</div></div>
                      <div><div className="slot-k">Signal</div><div className="slot-v">{subslot.subslotSignalState ?? "-"}</div></div>
                      <div><div className="slot-k">Confirm Ticks</div><div className="slot-v">{subslot.subslotConfirmTicks ?? "-"}</div></div>
                      <div><div className="slot-k">Entry Mid</div><div className="slot-v">{fmt(subslot.subslotEntryMid)}</div></div>
                      <div><div className="slot-k">Now Mid</div><div className="slot-v">{fmt(comparisonNowMid(secondaryComparison(subslot), subslot.subslotNowMid ?? slot.nowMid))}</div></div>
                      <div><div className="slot-k">Net Basis Rate</div><div className="slot-v">{fmt(secondaryComparison(subslot)?.netBasisRate ?? subslot.subslotActualRate ?? subslot.subslotSubmittedRate)}</div></div>
                      <div><div className="slot-k">Basis Source</div><div className="slot-v">{basisSourceLabel(secondaryComparison(subslot)?.netBasisSource)}</div></div>
                      <div><div className="slot-k">Actual Fill Rate</div><div className="slot-v">{fmt(subslot.subslotActualRate)}</div></div>
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

                    {subslotExitGateBlock(subslot, nowMs)}
                    {exitOrderBlock(subslotExitOrderData(subslot), "Secondary Exit Order")}
                    {subslotEntryQualityBlock(subslot)}

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
              <div><div className="slot-k">Funding</div><div className="slot-v" title={slot.candidateAllocationBlockedReason || slot.candidateAllocationReserveAdvisoryReason || undefined}>{primaryEntryFundingLabel(slot)}</div></div>
              <div><div className="slot-k">Reserve Mode</div><div className="slot-v">{slot.candidateAllocationReserveMode ?? "-"}</div></div>
              <div><div className="slot-k">Reserve Advisory</div><div className="slot-v">{reserveAdvisoryLabel(slot.candidateAllocationReserveAdvisoryReason)}</div></div>
              <div><div className="slot-k">Sizing Mode</div><div className="slot-v">{slot.candidateEntrySizingMode ?? "-"}</div></div>
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
  const summarySubslot = manager?.subslot;
  const costAwareEntry = summarySubslot?.costAwareEntry;
  const secondaryEntryCost = `${summarySubslot?.entryRequireSecondaryCheaper === false ? "OFF" : "ON"} | min cheaper ${pctNum(
    summarySubslot?.entryMinDiscountPct ?? 0
  )}`;
  const exitOrderMode =
    summarySubslot?.exitOrderManager?.dryRun === false &&
    summarySubslot?.exitOrderManager?.liveMutationEnabled === true
      ? "LIVE ORDERS"
      : summarySubslot?.exitOrderManager?.requestedDryRun === false &&
        summarySubslot?.exitOrderManager?.liveMutationEnabled !== true
      ? "SAFE DRY-RUN"
      : "DRY-RUN";
  const exitOrderManager = `${yesNo(summarySubslot?.exitOrderManager?.enabled)} | ${exitOrderMode} | net-gain ${yesNo(
    summarySubslot?.exitOrderManager?.requireNetGain
  )}`;
  const primaryLockExitMode = String(holding?.exitPolicy?.primaryLockExitMode || "NO_LOSS_PROTECTED").toUpperCase();
  const lockFloorExitMode =
    primaryLockExitMode === "NO_LOSS_PROTECTED"
      ? "no-loss protected"
      : "no-loss protected";
  const noLossWatchConfig = `watch ${pctNum(holding?.exitPolicy?.floorExitArmBufferPct)} | giveback ${pctNum(
    holding?.exitPolicy?.floorExitPeakGivebackPct
  )}`;

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
              LVL4 {pctNum(holding?.lvl4Pct)} | bid trail {pctNum(holding?.lvl4TrailPct)} | {lockFloorExitMode}
            </div>
            <div className="engine-upgrade-sub">Levels 1-3 defend their static lock floors with no-loss watch. LVL4 layers a retained net floor over the open bid trail. {noLossWatchConfig}.</div>
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
              <div className="engine-upgrade-line">
                <span className="engine-upgrade-line-label">LVL4 NET</span>
                <span className="engine-upgrade-line-value">{managerLevelTrailLabel(levelTrails?.lvl4Net)}</span>
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

          <div className="engine-upgrade-item">
            <div className="engine-upgrade-k">Cheaper Secondary Entry</div>
            <div className="engine-upgrade-v">{secondaryEntryCost}</div>
            <div className="engine-upgrade-sub">
              Final CoinSpot buy quote must stay no worse than the parent-derived max submitted rate.
            </div>
          </div>

          <div className="engine-upgrade-item">
            <div className="engine-upgrade-k">Exit Order Manager</div>
            <div className="engine-upgrade-v">{exitOrderManager}</div>
            <div className="engine-upgrade-sub">
              Primary locks and active secondaries publish target sell order state. If a Primary no-loss exit is blocked by its tracked resting sell, the order clears first and the guarded exit retries next tick.
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

const CapitalRailsPanel = React.memo(function CapitalRailsPanel(props: {
  capital: PublicCapitalResponse | null;
}) {
  const allocation = props.capital?.entryAllocation ?? null;
  const railPool = isRailPoolAllocation(allocation);
  const primaryPoolUsedAud =
    allocation?.primaryPoolAud != null &&
    allocation?.primaryPoolRemainingAud != null &&
    Number.isFinite(allocation.primaryPoolAud) &&
    Number.isFinite(allocation.primaryPoolRemainingAud)
      ? Math.max(0, allocation.primaryPoolAud - allocation.primaryPoolRemainingAud)
      : allocation?.primaryCommittedAud;
  const secondaryCommittedAud =
    allocation?.secondaryPoolAud != null &&
    allocation?.secondaryPoolRemainingAud != null &&
    Number.isFinite(allocation.secondaryPoolAud) &&
    Number.isFinite(allocation.secondaryPoolRemainingAud)
      ? Math.max(0, allocation.secondaryPoolAud - allocation.secondaryPoolRemainingAud)
      : allocation?.secondaryCommittedAud;
  const primaryCommittedSlots = allocation?.primarySlotsCommitted ?? allocation?.primaryCommittedCount ?? null;
  const primarySlotsMax = allocation?.primarySlotsMax ?? null;
  const secondaryRailUsed = allocation?.secondaryCommittedCount ?? null;
  const secondaryRailTotal = allocation?.secondaryRailSlotsTotal ?? null;
  const totalSecondaryRailCapacity = multipliedCount(primarySlotsMax, allocation?.secondaryMaxPerPrimary);
  const availableAud = allocation?.audAvailable ?? props.capital?.audAvailable ?? null;
  const blockedReason = allocationBlockReason(allocation);

  if (!props.capital) {
    return (
      <section className="engine-rail-panel" aria-label="Capital rails">
        <div className="engine-rail-head">
          <div>
            <div className="slot-section">Current Rail Settings</div>
            <div className="engine-telemetry-note">Published by engine service.</div>
          </div>
        </div>
        <div className="ledger-empty">Capital endpoint unavailable.</div>
      </section>
    );
  }

  if (!allocation) {
    return (
      <section className="engine-rail-panel" aria-label="Capital rails">
        <div className="engine-rail-head">
          <div>
            <div className="slot-section">Current Rail Settings</div>
            <div className="engine-telemetry-note">Published by engine service.</div>
          </div>
        </div>
        <div className="ledger-empty">Configured allocation not published by engine service.</div>
      </section>
    );
  }

  return (
    <section className="engine-rail-panel" aria-label="Capital rails">
      <div className="engine-rail-head">
        <div>
          <div className="slot-section">Current Rail Settings</div>
          <div className="engine-telemetry-note">
            {entryAllocationModeLabel(allocation)} | Published by engine service | {railPool ? "Rail pool allocator" : "Legacy allocation mode"}
          </div>
        </div>
        <div className={`engine-rail-state ${allocation.enabled ? "ok" : "warn"}`}>
          {allocation.enabled ? "Configured" : "Inactive"}
        </div>
      </div>

      <div className="engine-rail-columns">
        <div className="engine-rail-group engine-rail-group--structure">
          <div className="engine-rail-group-title">Rail Structure</div>
          <div className="engine-rail-metrics">
            <div><span>Primary Rails</span><strong>{countLabel(primarySlotsMax, "Not published")}</strong></div>
            <div><span>Secondary / Primary</span><strong>{countLabel(allocation.secondaryMaxPerPrimary, "Not published")}</strong></div>
            <div><span>Total Secondary Capacity</span><strong>{countLabel(totalSecondaryRailCapacity, "Not published")}</strong></div>
            <div><span>Unlocked Now</span><strong>{countLabel(secondaryRailUsed)} used / {countLabel(secondaryRailTotal)} unlocked</strong></div>
          </div>
        </div>

        <div className="engine-rail-group">
          <div className="engine-rail-group-title">Primary Rail</div>
          <div className="engine-rail-metrics">
            <div><span>Target</span><strong>{moneyAud(allocation.primaryTargetAud)}</strong></div>
            <div><span>Pool Used</span><strong>{moneyAud(primaryPoolUsedAud)} / {moneyAud(allocation.primaryPoolAud)}</strong></div>
            <div><span>Spendable</span><strong>{moneyAud(allocation.primarySpendableAud)}</strong></div>
            <div><span>Committed Rails</span><strong>{countLabel(primaryCommittedSlots)} / {countLabel(primarySlotsMax)}</strong></div>
          </div>
        </div>

        <div className="engine-rail-group">
          <div className="engine-rail-group-title">Secondary Rail</div>
          <div className="engine-rail-metrics">
            <div><span>Target</span><strong>{moneyAud(allocation.secondaryTargetAud)}</strong></div>
            <div><span>Available AUD</span><strong>{moneyAud(availableAud)}</strong></div>
            <div><span>Committed AUD</span><strong>{moneyAud(secondaryCommittedAud)}</strong></div>
            <div><span>{secondaryReserveMetricLabel(allocation, "Reserved Now")}</span><strong>{moneyAud(allocation.secondaryReservedAud)}</strong></div>
            <div><span>Spendable Now</span><strong>{moneyAud(allocation.secondarySpendableAud)}</strong></div>
            <div><span>Unlocked Available</span><strong>{countLabel(allocation.secondaryRailSlotsAvailable ?? allocation.secondarySlotsAvailable)}</strong></div>
          </div>
        </div>

        <div className="engine-rail-group engine-rail-group--gate">
          <div className="engine-rail-group-title">Allocation Gate</div>
          <div className="engine-rail-metrics">
            <div><span>Next Primary</span><strong>{entryAllocationGateLabel(allocation.nextPrimaryAllowed, allocation.primaryBlockReason)}</strong></div>
            <div><span>Next Secondary</span><strong>{entryAllocationGateLabel(allocation.nextSecondaryAllowed, allocation.secondaryBlockReason)}</strong></div>
            <div><span>Blocked Reason</span><strong>{blockedReason ? reasonLabel(blockedReason) : "None published"}</strong></div>
            <div><span>Reserve Mode</span><strong>{allocation.firstSecondaryReserveMode ?? "-"}</strong></div>
            <div><span>Reserve Advisory</span><strong>{reserveAdvisoryLabel(allocation.primaryReserveAdvisoryReason)}</strong></div>
            <div><span>Capital Basis</span><strong>{moneyAud(allocation.capitalBaseAud)}</strong></div>
          </div>
        </div>
      </div>
    </section>
  );
});

const EntryAllocationPanel = React.memo(function EntryAllocationPanel(props: {
  allocation: EntryAllocation | null | undefined;
}) {
  const allocation = props.allocation ?? null;
  const railPool = isRailPoolAllocation(allocation);
  const primarySlotsAllowed =
    allocation?.primarySlotsAvailable != null && Number.isFinite(allocation.primarySlotsAvailable)
      ? allocation.primarySlotsAvailable
      : allocation?.primarySpendableAud != null &&
        allocation?.primaryTargetAud != null &&
        Number.isFinite(allocation.primarySpendableAud) &&
        Number.isFinite(allocation.primaryTargetAud) &&
        allocation.primaryTargetAud > 0
      ? Math.floor(allocation.primarySpendableAud / allocation.primaryTargetAud)
      : null;
  const primaryPoolUsedAud =
    railPool &&
    allocation?.primaryPoolAud != null &&
    allocation?.primaryPoolRemainingAud != null &&
    Number.isFinite(allocation.primaryPoolAud) &&
    Number.isFinite(allocation.primaryPoolRemainingAud)
      ? Math.max(0, allocation.primaryPoolAud - allocation.primaryPoolRemainingAud)
      : allocation?.primaryCommittedAud;
  const secondaryCommittedAud =
    railPool &&
    allocation?.secondaryPoolAud != null &&
    allocation?.secondaryPoolRemainingAud != null &&
    Number.isFinite(allocation.secondaryPoolAud) &&
    Number.isFinite(allocation.secondaryPoolRemainingAud)
      ? Math.max(0, allocation.secondaryPoolAud - allocation.secondaryPoolRemainingAud)
      : allocation?.secondaryCommittedAud;
  const secondaryRailUsed = allocation?.secondaryCommittedCount ?? 0;
  const secondaryRailTotal = allocation?.secondaryRailSlotsTotal ?? null;
  const totalSecondaryRailCapacity = multipliedCount(allocation?.primarySlotsMax, allocation?.secondaryMaxPerPrimary);

  return (
    <div className="capital-allocation-surface">
      <div className="slot-section">Entry Allocation</div>
      <div className="engine-telemetry-note">
        {entryAllocationModeLabel(allocation)} | Next primary {entryAllocationAllowedLabel(allocation?.nextPrimaryAllowed)} | Next secondary {entryAllocationAllowedLabel(allocation?.nextSecondaryAllowed)}
      </div>

      <div className="secondary-summary capital-summary">
        {railPool ? (
          <div className="secondary-grid capital-summary-grid">
            <div><div className="slot-k">Allocation Mode</div><div className="slot-v">{entryAllocationModeLabel(allocation)}</div></div>
            <div><div className="slot-k">Reserve Mode</div><div className="slot-v">{allocation?.firstSecondaryReserveMode ?? "-"}</div></div>
            <div><div className="slot-k">Reserve Advisory</div><div className="slot-v">{reserveAdvisoryLabel(allocation?.primaryReserveAdvisoryReason)}</div></div>
            <div><div className="slot-k">Primary Pool</div><div className="slot-v">{moneyAud(primaryPoolUsedAud)} / {moneyAud(allocation?.primaryPoolAud)} used</div></div>
            <div><div className="slot-k">Primary Spendable</div><div className="slot-v">{moneyAud(allocation?.primarySpendableAud)}</div></div>
            <div><div className="slot-k">Primary Slots</div><div className="slot-v">{allocation?.primarySlotsCommitted ?? allocation?.primaryCommittedCount ?? 0} / {allocation?.primarySlotsMax ?? "-"}</div></div>
            <div><div className="slot-k">Rail Structure</div><div className="slot-v">{countLabel(allocation?.primarySlotsMax, "Not published")} x {countLabel(allocation?.secondaryMaxPerPrimary, "Not published")}</div></div>
            <div><div className="slot-k">Total Secondary Capacity</div><div className="slot-v">{countLabel(totalSecondaryRailCapacity, "Not published")}</div></div>
            <div><div className="slot-k">Secondary Committed</div><div className="slot-v">{moneyAud(secondaryCommittedAud)}</div></div>
            <div><div className="slot-k">Secondary Spendable</div><div className="slot-v">{moneyAud(allocation?.secondarySpendableAud)}</div></div>
            <div><div className="slot-k">{secondaryReserveMetricLabel(allocation, "Protected Reserve")}</div><div className="slot-v">{moneyAud(allocation?.secondaryReservedAud)}</div></div>
            <div><div className="slot-k">Unlocked Secondary Rails</div><div className="slot-v">{countLabel(secondaryRailUsed)} / {countLabel(secondaryRailTotal)} used</div></div>
            <div><div className="slot-k">Secondary Max / Primary</div><div className="slot-v">{allocation?.secondaryMaxPerPrimary ?? "-"}</div></div>
            <div><div className="slot-k">{isAdvisoryFirstSecondaryReserve(allocation) ? "First Secondary Advisory" : "First Secondary Pending"}</div><div className="slot-v">{allocation?.firstSecondaryDeficitCount ?? 0}</div></div>
            <div><div className="slot-k">Secondary Slots Available</div><div className="slot-v">{allocation?.secondarySlotsAvailable ?? "-"}</div></div>
            <div><div className="slot-k">Capital Basis</div><div className="slot-v">{moneyAud(allocation?.capitalBaseAud)}</div></div>
            <div><div className="slot-k">Next Primary</div><div className="slot-v">{entryAllocationAllowedLabel(allocation?.nextPrimaryAllowed)}</div></div>
            <div><div className="slot-k">Next Secondary</div><div className="slot-v">{entryAllocationAllowedLabel(allocation?.nextSecondaryAllowed)}</div></div>
            <div><div className="slot-k">Blocked</div><div className="slot-v">{reasonLabel(allocation?.blockReason ?? allocation?.primaryBlockReason ?? allocation?.secondaryBlockReason)}</div></div>
          </div>
        ) : (
          <div className="secondary-grid capital-summary-grid">
            <div><div className="slot-k">Pair Mode</div><div className="slot-v">{entryAllocationModeLabel(allocation)}</div></div>
            <div><div className="slot-k">Pair Unit</div><div className="slot-v">{moneyAud(allocation?.pairUnitAud)}</div></div>
            <div><div className="slot-k">Funded Pairs</div><div className="slot-v">{allocation?.fundedPairCount ?? "-"}</div></div>
            <div><div className="slot-k">Primary Target</div><div className="slot-v">{moneyAud(allocation?.primaryTargetAud)}</div></div>
            <div><div className="slot-k">Secondary Target</div><div className="slot-v">{moneyAud(allocation?.secondaryTargetAud)}</div></div>
            <div><div className="slot-k">Primary Slots Allowed</div><div className="slot-v">{primarySlotsAllowed ?? "-"}</div></div>
            <div><div className="slot-k">Primary Spendable</div><div className="slot-v">{moneyAud(allocation?.primarySpendableAud)}</div></div>
            <div><div className="slot-k">Secondary Reserved</div><div className="slot-v">{moneyAud(allocation?.secondaryReservedAud)}</div></div>
            <div><div className="slot-k">Secondary Spendable</div><div className="slot-v">{moneyAud(allocation?.secondarySpendableAud)}</div></div>
            <div><div className="slot-k">Primary Committed</div><div className="slot-v">{moneyAud(allocation?.primaryCommittedAud)}</div></div>
            <div><div className="slot-k">Secondary Committed</div><div className="slot-v">{moneyAud(allocation?.secondaryCommittedAud)}</div></div>
            <div><div className="slot-k">Capital Basis</div><div className="slot-v">{moneyAud(allocation?.capitalBaseAud)}</div></div>
            <div><div className="slot-k">Next Primary</div><div className="slot-v">{entryAllocationAllowedLabel(allocation?.nextPrimaryAllowed)}</div></div>
            <div><div className="slot-k">Next Secondary</div><div className="slot-v">{entryAllocationAllowedLabel(allocation?.nextSecondaryAllowed)}</div></div>
            <div><div className="slot-k">Blocked</div><div className="slot-v">{reasonLabel(allocation?.blockReason ?? allocation?.primaryBlockReason ?? allocation?.secondaryBlockReason)}</div></div>
          </div>
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
            <div><div className="slot-k">Quantity Drift</div><div className="slot-v">{capitalExposureAttentionCount(props.capital)} watched</div></div>
            <div><div className="slot-k">Net Quantity Drift</div><div className="slot-v">{quantityDriftLabel(props.capital?.exposure?.quantityDriftAud)}</div></div>
            <div><div className="slot-k">Value vs Cost</div><div className="slot-v">{valueVsCostLabel(props.capital?.exposure?.valueVsTrackedCostAud ?? props.capital?.exposure?.untrackedAudApprox)}</div></div>
            <div><div className="slot-k">Wallet Sources</div><div className="slot-v">{props.capital?.walletSourceEnabled ? "ENABLED" : "DISABLED"}</div></div>
            <div><div className="slot-k">Rotation Mode</div><div className="slot-v">{rotationModeLabel(props.capital)}</div></div>
            <div><div className="slot-k">Require Waiting Eligible</div><div className="slot-v">{yesNo(props.capital?.rotation?.requireWaitingEligible)}</div></div>
            <div><div className="slot-k">Require Basis</div><div className="slot-v">{yesNo(props.capital?.rotation?.walletRequireBasis)}</div></div>
            <div><div className="slot-k">Wallet Profit Floor</div><div className="slot-v">{pctNum(props.capital?.rotation?.walletMinSourceNetPct)}</div></div>
          </div>
        </div>

        <EntryAllocationPanel allocation={props.capital?.entryAllocation} />

        {props.capital?.refreshError ? (
          <div className="ledger-empty">Refresh error: {props.capital.refreshError}</div>
        ) : null}

        <div className="ledger-empty">
          Quantity drift reconciles CoinSpot coin balances with tracked quantities. Value vs cost is market movement, not an action alert. Wallet readiness shows available capital; rotation recommendation shows whether policy currently wants to use it.
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
                  <div><div className="slot-k">Tracked AUD</div><div className="slot-v">{moneyAud(coin.trackedAud)}</div></div>
                  <div><div className="slot-k">Quantity Drift</div><div className={`slot-v ${coin.exposureAttention ? "is-warn" : ""}`}>{quantityDriftLabel(coin.quantityDriftAud)}</div></div>
                  <div><div className="slot-k">Value vs Cost</div><div className="slot-v">{valueVsCostLabel(coinValueVsCost(coin))}</div></div>
                  <div><div className="slot-k">Secondary Coverage</div><div className={`slot-v ${coin.secondaryWalletCoverage?.attention ? "is-warn" : ""}`}>{secondaryCoverageAttentionLabel(coin.secondaryWalletCoverage) ?? "OK"}</div></div>
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
                  <div><div className="slot-k">Tracked AUD</div><div className="slot-v">{moneyAud(coin.trackedAud)}</div></div>
                  <div><div className="slot-k">Quantity Drift</div><div className={`slot-v ${coin.exposureAttention ? "is-warn" : ""}`}>{quantityDriftLabel(coin.quantityDriftAud)}</div></div>
                  <div><div className="slot-k">Value vs Cost</div><div className="slot-v">{valueVsCostLabel(coinValueVsCost(coin))}</div></div>
                  <div><div className="slot-k">Secondary Coverage</div><div className={`slot-v ${coin.secondaryWalletCoverage?.attention ? "is-warn" : ""}`}>{secondaryCoverageAttentionLabel(coin.secondaryWalletCoverage) ?? "OK"}</div></div>
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

const BooksPanel = React.memo(function BooksPanel(props: {
  books: ReturnType<typeof useBooksData>;
  capital: PublicCapitalResponse | null;
}) {
  const { books, capital } = props;
  const [historyText, setHistoryText] = useState("");
  const [entryType, setEntryType] = useState("OWNER_CAPITAL_IN");
  const [entryAmount, setEntryAmount] = useState("");
  const [entryNote, setEntryNote] = useState("");
  const [entrySaving, setEntrySaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const summary = books.summary;
  const importYears = summary?.importYears?.length ? summary.importYears : ["2023-24", "2024-25", "2025-26"];
  const reserveAud = summary?.reserve?.estimatedTaxReserveAud ?? null;
  const floatAud = summary?.tradingFloatTargetAud ?? 0;
  const audAvailable = capital?.audAvailable ?? null;
  const availableDrawing =
    audAvailable == null || reserveAud == null
      ? null
      : Math.max(0, Number(audAvailable) - Number(floatAud || 0) - Number(reserveAud || 0));

  const submitEntry = async (event: React.FormEvent) => {
    event.preventDefault();
    setEntrySaving(true);
    try {
      await books.addEntry({
        type: entryType,
        amountAud: entryType === "BOOKS_NOTE" ? "0" : entryAmount,
        note: entryNote,
      });
      setEntryAmount("");
      setEntryNote("");
    } catch {
      // addEntry keeps the backend error visible in the shared Books status.
    } finally {
      setEntrySaving(false);
    }
  };

  const runExport = async () => {
    setExporting(true);
    try {
      await books.downloadExport();
    } catch {
      await books.refresh();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="books-panel card machine-surface panel-frame" aria-label="Books">
      <div className="engine-telemetry-head">
        <div>
          <div className="engine-telemetry-title">Books</div>
          <div className="engine-telemetry-note">
            Private tax-prep records for CoinSpot history, owner capital, drawings, and accountant export.
          </div>
        </div>
        <div className="books-actions">
          <label className="books-fy">
            <span>FY</span>
            <select value={books.fy} onChange={(event) => books.setFy(event.target.value)}>
              {importYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
              {!importYears.includes(books.fy) ? <option value={books.fy}>{books.fy}</option> : null}
            </select>
          </label>
          <button type="button" className="button ghost" onClick={() => void books.refresh()} disabled={books.loading}>
            Refresh
          </button>
          <button
            type="button"
            className="button ghost"
            onClick={() => void books.syncReadOnly("selected_fy")}
            disabled={Boolean(books.syncing)}
          >
            {books.syncing === "selected_fy" ? "Syncing..." : "Sync Selected FY"}
          </button>
          <button
            type="button"
            className="button ghost"
            onClick={() => void books.syncReadOnly("all_since_start")}
            disabled={Boolean(books.syncing)}
          >
            {books.syncing === "all_since_start" ? "Syncing..." : "Sync Since 2023-24"}
          </button>
          <button type="button" className="button ghost" onClick={() => void runExport()} disabled={exporting}>
            Export CSV
          </button>
        </div>
      </div>

      {books.err ? (
        <div className="engine-log" role="status">
          <div className="engine-log-title">Books unavailable</div>
          <pre>{books.err}</pre>
        </div>
      ) : null}

      {books.syncResult || summary?.apiSync ? (
        <div className="books-sync-status">
          <div className="slot-k">CoinSpot Read Only Sync</div>
          <div className="books-sub">
            Last sync {summary?.apiSync?.at ? summary.apiSync.at : books.syncResult?.at || "-"} | Mode{" "}
            {summary?.apiSync?.mode || books.syncResult?.mode || "-"} | Years{" "}
            {(summary?.apiSync?.financialYears || books.syncResult?.financialYears || []).join(", ") || "-"}
          </div>
          <div className="books-sub">
            Inserted trades {summary?.apiSync?.insertedTrades ?? books.syncResult?.insertedTrades ?? 0} | Duplicate
            trades {summary?.apiSync?.duplicateTrades ?? books.syncResult?.duplicateTrades ?? 0} | Entries{" "}
            {summary?.apiSync?.insertedEntries ?? books.syncResult?.insertedEntries ?? 0} | Warnings{" "}
            {summary?.apiSync?.insertedWarnings ?? books.syncResult?.insertedWarnings ?? 0}
          </div>
          {(summary?.apiSync?.errors?.length || books.syncResult?.errors?.length) ? (
            <div className="books-sub books-sub--warn">
              Sync warnings: {(summary?.apiSync?.errors || books.syncResult?.errors || [])
                .map((row) => `${row.source || "source"} ${row.message || "unavailable"}`)
                .join(" | ")}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="books-grid">
        <div className="books-card">
          <div className="slot-k">Imported Trades</div>
          <div className="books-value">{summary?.importStatus?.importedTradeCount ?? "-"}</div>
          <div className="books-sub">
            FY rows {summary?.importStatus?.filteredTradeCount ?? "-"} | Entries {summary?.importStatus?.fyManualEntryCount ?? "-"} | API{" "}
            {summary?.importStatus?.fyApiEntryCount ?? "-"}
          </div>
        </div>
        <div className="books-card">
          <div className="slot-k">Buy / Sell Totals</div>
          <div className="books-value">{moneyAud(summary?.tradeTotals?.sellTotalAud)}</div>
          <div className="books-sub">
            Buys {moneyAud(summary?.tradeTotals?.buyTotalAud)} | Sells {moneyAud(summary?.tradeTotals?.sellTotalAud)}
          </div>
        </div>
        <div className="books-card">
          <div className="slot-k">Realised Estimate</div>
          <div className="books-value">{moneyAud(summary?.tradeTotals?.realizedEstimateAud)}</div>
          <div className="books-sub">FIFO tax-prep estimate only</div>
        </div>
        <div className="books-card">
          <div className="slot-k">Fees / GST</div>
          <div className="books-value">{moneyAud(summary?.tradeTotals?.feeAud)}</div>
          <div className="books-sub">GST {moneyAud(summary?.tradeTotals?.gstAud)}</div>
        </div>
        <div className="books-card">
          <div className="slot-k">Owner Capital</div>
          <div className="books-value">{moneyAud(summary?.ownerTotals?.ownerCapitalInAud)}</div>
          <div className="books-sub">Drawings {moneyAud(summary?.ownerTotals?.ownerDrawingAud)}</div>
        </div>
        <div className="books-card">
          <div className="slot-k">Tax Reserve</div>
          <div className="books-value">{moneyAud(reserveAud)}</div>
          <div className="books-sub">Planning rate {summary?.taxReservePct ?? "-"}%</div>
        </div>
        <div className="books-card">
          <div className="slot-k">Retained Float</div>
          <div className="books-value">{moneyAud(floatAud)}</div>
          <div className="books-sub">Configured bookkeeping target</div>
        </div>
        <div className="books-card">
          <div className="slot-k">Available Drawing Estimate</div>
          <div className="books-value">{availableDrawing == null ? "-" : moneyAud(availableDrawing)}</div>
          <div className="books-sub">Uses current AUD minus reserve and float</div>
        </div>
      </div>

      <CgtReviewPackPanel books={books} />

      <div className="books-grid books-grid--two">
        <section className="books-card books-card--form">
          <div className="engine-telemetry-title">Import CoinSpot History</div>
          <div className="engine-telemetry-note">
            Paste the copied CoinSpot trade-history table. Exact reimports are ignored; repeated
            same-minute fingerprints remain separate ledger rows and are flagged for review.
          </div>
          <textarea
            className="books-textarea"
            value={historyText}
            onChange={(event) => setHistoryText(event.target.value)}
            placeholder="Paste CoinSpot trade history text here..."
          />
          <button
            type="button"
            className="button gold"
            disabled={books.importing || !historyText.trim()}
            onClick={() => void books.importHistory(historyText)}
          >
            {books.importing ? "Importing..." : "Import History"}
          </button>
          {books.importResult ? (
            <div className="books-sync-status" role="status">
              <div className="books-sub">
                Inserted {books.importResult.inserted ?? 0} | Enriched {books.importResult.enriched ?? 0} | Duplicates {books.importResult.duplicate ?? 0} | Stored{" "}
                {books.importResult.totalStored ?? "-"}
              </div>
              <div className="books-sub">
                Observed {books.importResult.parsed?.validRows ?? "-"} | Ledger rows{" "}
                {books.importResult.parsed?.uniqueRows ?? books.importResult.parsed?.validRows ?? "-"} | Fingerprints{" "}
                {books.importResult.parsed?.uniqueFingerprints ?? "-"} | Repeated-fingerprint candidates{" "}
                {books.importResult.parsed?.duplicateCandidateRows ?? books.importResult.duplicateCandidates ?? 0}
              </div>
              <div className="books-sub books-sub--warn">
                Economic review candidates {books.importResult.parsed?.economicReviewRows ?? books.importResult.economicReviewCandidates ?? 0}
              </div>
              <div className="books-sub">
                Normalized source archive{" "}
                {books.importResult.rawRowsStored
                  ? books.importResult.rawArchiveReused
                    ? "reused"
                    : `${books.importResult.rawRowsInserted ?? 0} rows added`
                  : "not persisted"}
              </div>
            </div>
          ) : null}
        </section>

        <section className="books-card books-card--form">
          <div className="engine-telemetry-title">Owner Ledger Entry</div>
          <div className="engine-telemetry-note">
            Record capital introduced, drawings, tax reserve adjustments, tax payments, or notes.
          </div>
          <form className="books-entry-form" onSubmit={submitEntry}>
            <select value={entryType} onChange={(event) => setEntryType(event.target.value)}>
              <option value="OWNER_CAPITAL_IN">Owner Capital In</option>
              <option value="OWNER_DRAWING">Owner Drawing</option>
              <option value="TAX_RESERVE_ADJUSTMENT">Tax Reserve Adjustment</option>
              <option value="TAX_PAYMENT">Tax Payment</option>
              <option value="BOOKS_NOTE">Books Note</option>
            </select>
            {entryType !== "BOOKS_NOTE" ? (
              <input
                value={entryAmount}
                onChange={(event) => setEntryAmount(event.target.value)}
                placeholder="Amount AUD"
                inputMode="decimal"
              />
            ) : null}
            <textarea
              className="books-note"
              value={entryNote}
              onChange={(event) => setEntryNote(event.target.value)}
              placeholder="Note"
            />
            <button type="submit" className="button ghost" disabled={entrySaving || (entryType !== "BOOKS_NOTE" && !entryAmount.trim())}>
              {entrySaving ? "Saving..." : "Add Entry"}
            </button>
          </form>
        </section>
      </div>

      <div className="books-warning-panel">
        <div className="engine-telemetry-title">Reconciliation Warnings</div>
        <div className="engine-telemetry-note">
          {summary?.method?.disclaimer || "Bookkeeping estimate only. Review before lodgement."}
        </div>
        {summary?.warnings?.length ? (
          <div className="books-warning-list">
            {summary.warnings.slice(0, 8).map((warning, index) => (
              <div key={`${warning.code}-${warning.asset}-${index}`} className="books-warning-row">
                <strong>{warning.code || "WARNING"}</strong>
                <span>
                  {warning.asset ? `${warning.asset}: ` : ""}
                  {warning.note || "Review this transaction."}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="ledger-empty">No reconciliation warnings for the selected financial year.</div>
        )}
      </div>
    </div>
  );
});

const LENDER_INPUT_FIELDS = [
  { key: "loanAmountAud", label: "Loan Amount", hint: "Pilot facility" },
  { key: "annualRatePct", label: "Annual Rate", hint: "Percent p.a." },
  { key: "termMonths", label: "Term", hint: "Months" },
  { key: "operatingExpensesAud", label: "Operating Costs", hint: "Monthly AUD" },
  { key: "taxReservePct", label: "Tax Reserve", hint: "Percent" },
  { key: "baseRevenueAud", label: "Base Revenue", hint: "Monthly AUD" },
  { key: "adverseRevenueAud", label: "Adverse Revenue", hint: "Monthly AUD" },
  { key: "negativeMonthAud", label: "Negative Month", hint: "Stress AUD" },
  { key: "openingCashAud", label: "Opening Cash", hint: "AUD" },
] as const;

const DEFAULT_LENDER_INPUT_STATE: Record<(typeof LENDER_INPUT_FIELDS)[number]["key"], string> = {
  loanAmountAud: "20000",
  annualRatePct: "12",
  termMonths: "60",
  operatingExpensesAud: "410",
  taxReservePct: "30",
  baseRevenueAud: "1500",
  adverseRevenueAud: "750",
  negativeMonthAud: "-500",
  openingCashAud: "20000",
};

function dscrLabel(value: number | null | undefined) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return `${n.toFixed(2)}x`;
}

function evidenceStatusLabel(value: string | null | undefined) {
  if (value === "provided") return "Provided";
  if (value === "not_applicable") return "Not Applicable";
  return "Missing";
}

function isoDateLabel(value: string | null | undefined) {
  if (!value) return "-";
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return value;
  return new Date(ms).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function cgtStatusLabel(value: string | null | undefined) {
  if (value === "opening_balance_required") return "Opening Balance Required";
  if (value === "ready_for_review") return "Ready for Review";
  return value || "Review";
}

const CgtReviewPackPanel = React.memo(function CgtReviewPackPanel(props: {
  books: ReturnType<typeof useBooksData>;
}) {
  const { books } = props;
  const cgt = books.cgtReview;
  const [view, setView] = useState<"ato" | "source">("ato");
  const [assetFilter, setAssetFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [correctionAsset, setCorrectionAsset] = useState("");
  const [correctionQty, setCorrectionQty] = useState("");
  const [correctionCost, setCorrectionCost] = useState("");
  const [correctionAcquiredAt, setCorrectionAcquiredAt] = useState("");
  const [correctionNote, setCorrectionNote] = useState("");
  const [savingCorrection, setSavingCorrection] = useState(false);
  const [correctionError, setCorrectionError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  const missingAssets = cgt?.openingBalanceReview?.missingAssets || [];
  const disposalRows = useMemo(() => cgt?.disposals || [], [cgt?.disposals]);
  const sourceReview = cgt?.sourceReview;
  const rawStoredFyRows = sourceReview?.rawStoredFyRows;
  const hasNormalizedRawRows =
    rawStoredFyRows != null ? rawStoredFyRows > 0 : sourceReview?.rawRowsStored === true;
  const rawCoverageMessage = !hasNormalizedRawRows
    ? "No normalized source rows are persisted for this FY; the observed count comes from import/sync summaries."
    : sourceReview?.rawStorageCoverageComplete === true
      ? `${rawStoredFyRows ?? sourceReview?.rawRowsObserved ?? "-"} normalized rows persisted; all reviewed pasted imports have source archives.`
      : sourceReview?.rawStorageCoverageComplete === false
        ? `${rawStoredFyRows ?? sourceReview?.rawRowsObserved ?? "-"} normalized rows persisted; ${sourceReview?.legacyOrSummaryImportRecords ?? 0} legacy or summary-only import records remain.`
        : `${rawStoredFyRows ?? sourceReview?.rawRowsObserved ?? "-"} normalized rows persisted for the selected FY.`;
  const inferredDisposalEventCount = cgt
    ? new Set(
        disposalRows.map(
          (row) =>
            row.eventId ||
            row.rowHash ||
            row.id ||
            `${row.transactionAt || ""}:${row.eventType || row.reason || ""}`
        )
      ).size
    : null;
  const disposalEventCount = cgt?.totals?.disposalEventCount ?? inferredDisposalEventCount;
  const disposalComponentCount =
    cgt?.totals?.disposalComponentCount ?? sourceReview?.generatedDisposalRows ?? (cgt ? disposalRows.length : null);
  const assets = useMemo(
    () => ["ALL", ...Array.from(new Set(disposalRows.map((row) => row.asset).filter(Boolean) as string[])).sort()],
    [disposalRows]
  );
  const statuses = useMemo(
    () => ["ALL", ...Array.from(new Set(disposalRows.map((row) => row.status).filter(Boolean) as string[])).sort()],
    [disposalRows]
  );
  const filteredDisposals = useMemo(
    () =>
      disposalRows
        .filter((row) => assetFilter === "ALL" || row.asset === assetFilter)
        .filter((row) => statusFilter === "ALL" || row.status === statusFilter)
        .slice(0, 40),
    [assetFilter, disposalRows, statusFilter]
  );

  const applyMissingAsset = (row: { asset?: string; missingQty?: number | null; firstDisposalAt?: string | null; count?: number | null }) => {
    setCorrectionError(null);
    setCorrectionAsset(row.asset || "");
    setCorrectionQty(row.missingQty == null ? "" : String(row.missingQty));
    setCorrectionNote(`Opening balance support for ${row.asset || "asset"} before ${isoDateLabel(row.firstDisposalAt)}.`);
  };

  const submitCorrection = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingCorrection(true);
    setCorrectionError(null);
    try {
      await books.addEntry({
        type: "OPENING_BALANCE_CORRECTION",
        asset: correctionAsset,
        quantity: correctionQty,
        amountAud: correctionCost,
        costBaseAud: correctionCost,
        acquiredAt: correctionAcquiredAt,
        note: correctionNote,
      });
      setCorrectionAsset("");
      setCorrectionQty("");
      setCorrectionCost("");
      setCorrectionAcquiredAt("");
      setCorrectionNote("");
      await books.refreshCgt();
    } catch (error) {
      setCorrectionError(error instanceof Error ? error.message : String(error));
    } finally {
      setSavingCorrection(false);
    }
  };

  const runDownload = async (kind: "disposals" | "pack") => {
    setExporting(kind);
    try {
      if (kind === "disposals") await books.downloadCgtDisposals();
      else await books.downloadCgtPack();
    } finally {
      setExporting(null);
    }
  };

  return (
    <section className="books-card books-card--form cgt-pack" aria-label="ATO CGT review pack">
      <div className="cgt-pack-head">
        <div>
          <div className="engine-telemetry-title">ATO CGT Review Pack</div>
          <div className="engine-telemetry-note">
            Tax-prep estimate from saved Books records for ATO capital gains fields, disposal review, and accountant export.
          </div>
        </div>
        <div className="books-actions">
          <button type="button" className="button ghost" onClick={() => void books.refreshCgt()} disabled={books.cgtLoading}>
            {books.cgtLoading ? "Refreshing..." : "Refresh CGT"}
          </button>
          <button type="button" className="button ghost" onClick={() => void runDownload("disposals")} disabled={Boolean(exporting)}>
            {exporting === "disposals" ? "Exporting..." : "Disposals CSV"}
          </button>
          <button type="button" className="button ghost" onClick={() => void runDownload("pack")} disabled={Boolean(exporting)}>
            {exporting === "pack" ? "Exporting..." : "Pack CSV"}
          </button>
          <button type="button" className="button ghost" onClick={() => window.print()}>
            Print / Save PDF
          </button>
        </div>
      </div>

      {books.cgtErr ? (
        <div className="engine-log" role="status">
          <div className="engine-log-title">CGT pack unavailable</div>
          <pre>{books.cgtErr}</pre>
        </div>
      ) : null}

      <div className="cgt-toggle" role="tablist" aria-label="CGT review mode">
        <button type="button" className={view === "ato" ? "active" : ""} onClick={() => setView("ato")}>
          ATO Fields
        </button>
        <button type="button" className={view === "source" ? "active" : ""} onClick={() => setView("source")}>
          Raw vs Deduped
        </button>
      </div>

      {view === "ato" ? (
        <div className="books-grid cgt-field-grid">
          {(cgt?.atoFields || []).map((field) => (
            <div className="books-card cgt-field-card" key={field.key || field.label}>
              <div className="slot-k">{field.label || "ATO field"}</div>
              <div className="books-value">{field.value != null ? field.value : moneyAud(field.valueAud)}</div>
              <div className="books-sub">{field.source || "Generated from disposal rows"}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="books-grid cgt-field-grid">
          <div className="books-card cgt-field-card">
            <div className="slot-k">Source Rows Observed</div>
            <div className="books-value">{cgt?.sourceReview?.rawRowsObserved ?? "-"}</div>
            <div className="books-sub">{rawCoverageMessage}</div>
          </div>
          <div className="books-card cgt-field-card">
            <div className="slot-k">Ledger FY Rows</div>
            <div className="books-value">{cgt?.sourceReview?.storedDedupedFyRows ?? "-"}</div>
            <div className="books-sub">All ledger rows {cgt?.sourceReview?.storedDedupedTradeRows ?? "-"}</div>
            <div className="books-sub">
              Economic rows {sourceReview?.storedEconomicFyRows ?? "-"} | Review candidates {sourceReview?.economicReviewRows ?? 0}
            </div>
          </div>
          <div className="books-card cgt-field-card">
            <div className="slot-k">Rows Not Reinserted</div>
            <div className="books-value">{cgt?.sourceReview?.duplicateRowsIgnored ?? "-"}</div>
            <div className="books-sub">{cgt?.sourceReview?.dedupeMethod || "Books dedupe hash"}</div>
          </div>
          <div className="books-card cgt-field-card">
            <div className="slot-k">Import Records Reviewed</div>
            <div className="books-value">{cgt?.sourceReview?.importRecordsReviewed ?? "-"}</div>
            <div className="books-sub">{cgt?.sourceReview?.note || "Saved Books source review"}</div>
          </div>
          <div className="books-card cgt-field-card">
            <div className="slot-k">FIFO Components</div>
            <div className="books-value">{disposalComponentCount ?? "-"}</div>
            <div className="books-sub">Swaps {sourceReview?.swapDisposalRows ?? 0} | Missing basis {sourceReview?.missingBasisDisposalRows ?? 0}</div>
            <div className="books-sub books-sub--warn">
              Unresolved cross quantities {sourceReview?.unresolvedCrossQuoteQuantityRows ?? 0} | Zero-amount
              quote acquisitions {sourceReview?.zeroAmountCrossAcquisitionRows ?? 0}
            </div>
          </div>
        </div>
      )}

      <div className="books-grid cgt-total-grid">
        <div className="books-card">
          <div className="slot-k">Disposal Events</div>
          <div className="books-value">{disposalEventCount ?? "-"}</div>
          <div className="books-sub">
            FIFO components {disposalComponentCount ?? "-"} | Proceeds {moneyAud(cgt?.totals?.capitalProceedsAud)}
          </div>
        </div>
        <div className="books-card">
          <div className="slot-k">Cost Base / Fees</div>
          <div className="books-value">{moneyAud(cgt?.totals?.costBaseAud)}</div>
          <div className="books-sub">Fees {moneyAud(cgt?.totals?.feeAud)}</div>
        </div>
        <div className="books-card">
          <div className="slot-k">Losses Applied</div>
          <div className="books-value">{moneyAud(cgt?.totals?.capitalLossesAppliedAud)}</div>
          <div className="books-sub">Current losses {moneyAud(cgt?.totals?.currentYearCapitalLossesAud)}</div>
        </div>
        <div className="books-card">
          <div className="slot-k">Discount Estimate</div>
          <div className="books-value">{moneyAud(cgt?.totals?.cgtDiscountAppliedAud)}</div>
          <div className="books-sub">Eligible gains {moneyAud(cgt?.totals?.discountEligibleGainAud)}</div>
        </div>
      </div>

      <div className="engine-telemetry-note">
        Each table row is a FIFO component. One disposal event can span multiple acquisition lots.
      </div>
      <div className="cgt-disposal-controls">
        <label className="books-fy">
          <span>Asset</span>
          <select value={assetFilter} onChange={(event) => setAssetFilter(event.target.value)}>
            {assets.map((asset) => (
              <option key={asset} value={asset}>
                {asset === "ALL" ? "All" : asset}
              </option>
            ))}
          </select>
        </label>
        <label className="books-fy">
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status === "ALL" ? "All" : cgtStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="cgt-table-wrap" role="region" aria-label="CGT FIFO disposal component explorer">
        <table className="cgt-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Asset</th>
              <th>Qty</th>
              <th>Proceeds</th>
              <th>Cost Base</th>
              <th>Gain</th>
              <th>Loss</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredDisposals.length ? (
              filteredDisposals.map((row) => (
                <tr key={row.id || `${row.transactionAt}-${row.asset}-${row.quantity}`}>
                  <td>{isoDateLabel(row.transactionAt)}</td>
                  <td>{row.asset || "-"}</td>
                  <td>{fmt(row.quantity ?? row.qty)}</td>
                  <td>{moneyAud(row.proceedsAud)}</td>
                  <td>{moneyAud(row.costBaseAud)}</td>
                  <td>{moneyAud(row.capitalGainAud)}</td>
                  <td>{moneyAud(row.capitalLossAud)}</td>
                  <td>{cgtStatusLabel(row.status)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8}>No disposal components for the selected financial year.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {missingAssets.length ? (
        <div className="books-warning-panel cgt-opening-panel">
          <div className="engine-telemetry-title">Opening-Balance Corrections</div>
          <div className="engine-telemetry-note">
            Missing lots make the CGT estimate incomplete. Add cost-basis evidence, then refresh the pack.
          </div>
          <div className="books-warning-list">
            {missingAssets.map((row) => (
              <div key={`${row.asset}-${row.firstDisposalAt}`} className="books-warning-row">
                <strong>{row.asset || "ASSET"}</strong>
                <span>
                  Missing {fmt(row.missingQty)} before {isoDateLabel(row.firstDisposalAt)} across {row.count ?? 1} disposal rows.
                </span>
                <button type="button" className="button ghost" onClick={() => applyMissingAsset(row)}>
                  Use
                </button>
              </div>
            ))}
          </div>
          <form className="books-entry-form cgt-correction-form" onSubmit={submitCorrection}>
            <input value={correctionAsset} onChange={(event) => setCorrectionAsset(event.target.value.toUpperCase())} placeholder="Asset" />
            <input value={correctionQty} onChange={(event) => setCorrectionQty(event.target.value)} placeholder="Quantity" inputMode="decimal" />
            <input value={correctionCost} onChange={(event) => setCorrectionCost(event.target.value)} placeholder="Cost base AUD" inputMode="decimal" />
            <input
              value={correctionAcquiredAt}
              onChange={(event) => setCorrectionAcquiredAt(event.target.value)}
              placeholder="Acquired date"
              type="date"
            />
            <textarea
              className="books-note"
              value={correctionNote}
              onChange={(event) => setCorrectionNote(event.target.value)}
              placeholder="Evidence note"
            />
            <button
              type="submit"
              className="button gold"
              disabled={savingCorrection || !correctionAsset.trim() || !correctionQty.trim() || !correctionCost.trim() || !correctionAcquiredAt}
            >
              {savingCorrection ? "Saving..." : "Add Correction"}
            </button>
          </form>
          {correctionError ? (
            <div className="books-sub books-sub--warn" role="status">
              Correction not saved: {correctionError}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="books-warning-panel">
        <div className="engine-telemetry-title">CGT Review Warnings</div>
        <div className="engine-telemetry-note">
          {cgt?.accountantPack?.disclaimer || "Tax-prep estimate only. Accountant review required before lodgement."}
        </div>
        {cgt?.warnings?.length ? (
          <div className="books-warning-list">
            {cgt.warnings.slice(0, 10).map((warning, index) => (
              <div key={`${warning.code}-${warning.asset}-${index}`} className="books-warning-row">
                <strong>{warning.code || "WARNING"}</strong>
                <span>
                  {warning.asset ? `${warning.asset}: ` : ""}
                  {warning.note || "Review this CGT item."}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="ledger-empty">No CGT warnings for the selected financial year.</div>
        )}
      </div>
    </section>
  );
});

const BankReportsPanel = React.memo(function BankReportsPanel(props: {
  books: ReturnType<typeof useBooksData>;
}) {
  const { books } = props;
  const [inputs, setInputs] = useState(DEFAULT_LENDER_INPUT_STATE);
  const [report, setReport] = useState<LenderReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [evidenceMonth, setEvidenceMonth] = useState("");
  const [evidenceSaving, setEvidenceSaving] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const next = await engineBooksFetch<LenderReport>("lender-report", { fy: books.fy, query: inputs });
      setReport(next);
      const preferredMonth =
        next.evidence?.months?.find((month) => !month.complete)?.month ||
        next.evidence?.months?.[0]?.month ||
        "";
      setEvidenceMonth((current) => current || preferredMonth);
    } catch (error) {
      setErr(error instanceof Error ? error.message : String(error));
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [books.fy, inputs]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  const updateInput = (key: keyof typeof DEFAULT_LENDER_INPUT_STATE, value: string) => {
    setInputs((current) => ({ ...current, [key]: value }));
  };

  const downloadLenderCsv = async () => {
    setExporting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Engineer sign-in required for lender export.");
      const params = new URLSearchParams({ action: "lender-report-csv", fy: books.fy });
      for (const [key, value] of Object.entries(inputs)) {
        if (String(value).trim()) params.set(key, value);
      }
      const response = await fetch(`/api/engine-books?${params.toString()}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`lender export HTTP ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `jeremy-aaron-lugg-lender-report-${books.fy}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setErr(error instanceof Error ? error.message : String(error));
    } finally {
      setExporting(false);
    }
  };

  const updateEvidence = async (item: string, status: EvidenceItemStatus) => {
    if (!evidenceMonth) return;
    setEvidenceSaving(item);
    setErr(null);
    try {
      await engineBooksFetch("evidence", {
        method: "POST",
        body: { fy: books.fy, month: evidenceMonth, item, status },
      });
      await fetchReport();
    } catch (error) {
      setErr(error instanceof Error ? error.message : String(error));
    } finally {
      setEvidenceSaving(null);
    }
  };

  const actualAnnual = report?.verifiedActuals?.annual || {};
  const baseDscr = report?.dscr?.scenarios?.base;
  const evidenceMonths = report?.evidence?.months || [];
  const selectedEvidenceMonth = evidenceMonths.find((month) => month.month === evidenceMonth) || evidenceMonths[0] || null;
  const scenarioRows = report?.cashflowScenarios || [];

  return (
    <div className="books-panel bank-panel card machine-surface panel-frame" aria-label="Bank reports">
      <div className="engine-telemetry-head">
        <div>
          <div className="engine-telemetry-title">Bank Reports</div>
          <div className="engine-telemetry-note">
            Lender-facing records for Jeremy Aaron Lugg. Verified actuals come from Books; projections are editable assumptions.
          </div>
        </div>
        <div className="books-actions">
          <label className="books-fy">
            <span>FY</span>
            <select value={books.fy} onChange={(event) => books.setFy(event.target.value)}>
              {(books.summary?.importYears?.length ? books.summary.importYears : ["2023-24", "2024-25", "2025-26"]).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="button ghost" onClick={() => void fetchReport()} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh Report"}
          </button>
          <button type="button" className="button gold" onClick={() => void downloadLenderCsv()} disabled={exporting || !report}>
            {exporting ? "Exporting..." : "Export Bank CSV"}
          </button>
        </div>
      </div>

      {err ? (
        <div className="engine-log" role="status">
          <div className="engine-log-title">Bank report unavailable</div>
          <pre>{err}</pre>
        </div>
      ) : null}

      <div className="books-warning-panel bank-context-panel">
        <div className="engine-telemetry-title">Commercial Lending Context</div>
        <div className="engine-telemetry-note">
          This report separates realised closed-trade evidence from planning assumptions. It does not treat open crypto value,
          strategy settings, or runtime readiness as loan-servicing cashflow.
        </div>
      </div>

      <div className="books-grid">
        <div className="books-card">
          <div className="slot-k">Verified History</div>
          <div className="books-value">{report?.sourceStatus?.verifiedTradeHistoryAvailable ? "Available" : "Not Yet"}</div>
          <div className="books-sub">
            FY trades {report?.sourceStatus?.filteredTradeCount ?? 0} | Source {report?.sourceStatus?.verifiedActualsSource || "Books"}
          </div>
        </div>
        <div className="books-card">
          <div className="slot-k">Realised Actual</div>
          <div className="books-value">{moneyAud(actualAnnual.realizedTradingProfitAud)}</div>
          <div className="books-sub">Closed-trade FIFO estimate, not unrealised portfolio value</div>
        </div>
        <div className="books-card">
          <div className="slot-k">Base DSCR</div>
          <div className="books-value">{dscrLabel(baseDscr?.dscr)}</div>
          <div className="books-sub">{baseDscr?.classification || "Projection required"} | target case only</div>
        </div>
        <div className="books-card">
          <div className="slot-k">Evidence Complete</div>
          <div className="books-value">{report?.evidence?.totals?.completeMonths ?? 0}/12</div>
          <div className="books-sub">
            {report?.evidence?.totals?.missing ?? 0} checklist items missing | {fmt(report?.evidence?.totals?.completenessPct)}%
          </div>
        </div>
      </div>

      <section className="books-card books-card--form">
        <div className="engine-telemetry-title">Projection Inputs</div>
        <div className="engine-telemetry-note">
          These values default to the current memo. They remain assumptions until supported by trading records, invoices, and bank statements.
        </div>
        <div className="bank-input-grid">
          {LENDER_INPUT_FIELDS.map((field) => (
            <label key={field.key} className="bank-input">
              <span>{field.label}</span>
              <input
                value={inputs[field.key]}
                onChange={(event) => updateInput(field.key, event.target.value)}
                inputMode="decimal"
              />
              <small>{field.hint}</small>
            </label>
          ))}
        </div>
      </section>

      {report?.warnings?.length ? (
        <div className="books-warning-panel">
          <div className="engine-telemetry-title">Lender Warnings</div>
          <div className="books-warning-list">
            {report.warnings.map((warning, index) => (
              <div key={`${warning.code}-${index}`} className="books-warning-row">
                <strong>{warning.code || "WARNING"}</strong>
                <span>{warning.note || "Review required before submission."}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="books-grid books-grid--two">
        <section className="books-card">
          <div className="engine-telemetry-title">DSCR Summary</div>
          <div className="bank-table-scroll">
            <table className="bank-table">
              <thead>
                <tr>
                  <th>Scenario</th>
                  <th>Net Operating Cashflow</th>
                  <th>Debt Service</th>
                  <th>DSCR</th>
                  <th>Assessment</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(report?.dscr?.scenarios || {}).map(([key, row]) => (
                  <tr key={key}>
                    <td>{enumLabel(key)}</td>
                    <td>{moneyAud(row.netOperatingCashflowAud)}</td>
                    <td>{moneyAud(row.totalDebtServiceAud)}</td>
                    <td>{dscrLabel(row.dscr)}</td>
                    <td>{row.classification || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="books-card">
          <div className="engine-telemetry-title">Stress Tests</div>
          <div className="bank-stress-list">
            {(report?.stressTests || []).map((stress) => (
              <div key={stress.key || stress.label} className="bank-stress-row">
                <strong>{stress.label}</strong>
                <span>
                  {stress.monthlyRevenueBasis} | DSCR {dscrLabel(stress.dscr)} ({stress.dscrClassification || "-"}) | cash{" "}
                  {moneyAud(stress.endingCashAud)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="books-card">
        <div className="engine-telemetry-title">12-Month Cashflow Scenarios</div>
        <div className="bank-scenario-stack">
          {scenarioRows.map((scenario) => (
            <div key={scenario.key || scenario.label} className="bank-scenario">
              <div className="bank-scenario-head">
                <strong>{scenario.label}</strong>
                <span>
                  DSCR {dscrLabel(scenario.totals?.dscr)} | ending cash {moneyAud(scenario.totals?.endingCashAud)}
                </span>
              </div>
              <div className="bank-table-scroll">
                <table className="bank-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Revenue</th>
                      <th>Expenses</th>
                      <th>Interest</th>
                      <th>Principal</th>
                      <th>Tax Reserve</th>
                      <th>Net Cashflow</th>
                      <th>Ending Cash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(scenario.rows || []).map((row) => (
                      <tr key={`${scenario.key}-${row.month}`}>
                        <td>{row.month}</td>
                        <td>{moneyAud(row.realisedTradingRevenueAud)}</td>
                        <td>{moneyAud(row.operatingExpensesAud)}</td>
                        <td>{moneyAud(row.loanInterestAud)}</td>
                        <td>{moneyAud(row.loanPrincipalAud)}</td>
                        <td>{moneyAud(row.taxProvisionAud)}</td>
                        <td>{moneyAud(row.netCashflowAud)}</td>
                        <td>{moneyAud(row.endingCashAud)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="books-card books-card--form">
        <div className="engine-telemetry-title">Monthly Evidence Checklist</div>
        <div className="engine-telemetry-note">
          Track documents that will matter more to future borrowing capacity than source code alone.
        </div>
        <label className="books-fy bank-month-select">
          <span>Month</span>
          <select value={selectedEvidenceMonth?.month || ""} onChange={(event) => setEvidenceMonth(event.target.value)}>
            {evidenceMonths.map((month) => (
              <option key={month.month} value={month.month}>
                {month.label} ({month.providedCount}/{month.requiredCount})
              </option>
            ))}
          </select>
        </label>
        {selectedEvidenceMonth ? (
          <div className="bank-evidence-list">
            {(selectedEvidenceMonth.items || []).map((item) => (
              <div key={item.key} className="bank-evidence-row">
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.note || "No note recorded."}</span>
                </div>
                <select
                  value={item.status || "missing"}
                  disabled={evidenceSaving === item.key}
                  onChange={(event) => void updateEvidence(String(item.key || ""), event.target.value as EvidenceItemStatus)}
                >
                  <option value="missing">{evidenceStatusLabel("missing")}</option>
                  <option value="provided">{evidenceStatusLabel("provided")}</option>
                  <option value="not_applicable">{evidenceStatusLabel("not_applicable")}</option>
                </select>
              </div>
            ))}
          </div>
        ) : (
          <div className="ledger-empty">Evidence checklist is unavailable for this financial year.</div>
        )}
      </section>
    </div>
  );
});
/* =========================
   Main Component
========================= */

export default function Engine() {
  const BASE = useMemo(() => pickBase(), []);

  const { rowsAll, rowsAud, snap, meta, readiness, managerStatus, capital, slotRows, events, err, refresh } = useEngineData(BASE);

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
  const [carouselPaused, setCarouselPaused] = useState(true);
  const books = useBooksData();
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
          const subslotFields = getSecondaryRows(s).flatMap((subslot) => [
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
    for (const subslot of getSecondaryRows(s)) {
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
              <EngineHealthStrip
                snap={snap}
                meta={meta}
                capital={capital}
                executionMode={executionMode}
                snapshotAgeMs={snapshotAgeMs}
                snapshotFresh={snapshotFresh}
                err={err}
              />

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
                entryAllocation={capital?.entryAllocation}
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

              <CapitalRailsPanel capital={capital} />

              <ControlsBar
                view={view}
                setView={setView}
                feed={feed}
                setFeed={setFeed}
                sortKey={sortKey}
                sortDir={sortDir}
                setSortKey={setSortKey}
                setSortDir={setSortDir}
                query={query}
                setQuery={setQuery}
                refresh={refresh}
                lastRefreshLabel={compactAgeLabel(snapshotAgeMs)}
              />

              {err ? (
                <div className="engine-log" role="status" aria-label="Errors">
                  <div className="engine-log-title">Backend unavailable</div>
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
                  className={`engine-section-tab ${section === "rails" ? "active" : ""}`}
                  onClick={() => setSection("rails")}
                >
                  Rails
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
                  className={`engine-section-tab ${section === "books" ? "active" : ""}`}
                  onClick={() => setSection("books")}
                >
                  Books
                </button>

                <button
                  type="button"
                  className={`engine-section-tab ${section === "bank" ? "active" : ""}`}
                  onClick={() => setSection("bank")}
                >
                  Bank
                </button>

                <button
                  type="button"
                  className={`engine-section-tab ${section === "diagnostics" ? "active" : ""}`}
                  onClick={() => setSection("diagnostics")}
                >
                  Diagnostics
                </button>

                <button
                  type="button"
                  className={`engine-section-tab ${section === "spotlight" ? "active" : ""}`}
                  onClick={() => setSection("spotlight")}
                >
                  Spotlight
                </button>
              </div>

              {section === "focus" ? (
                <OverviewTable
                  slots={filteredSlots}
                  holding={meta?.manager?.holding}
                  subslotConfig={meta?.manager?.subslot}
                  capital={capital}
                  onOpenSlot={setSelectedSlotId}
                  nowMs={nowMs}
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

              {section === "rails" ? (
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

              {section === "books" ? <BooksPanel books={books} capital={capital} /> : null}

              {section === "bank" ? <BankReportsPanel books={books} /> : null}

              {section === "diagnostics" ? (
                view === "advanced" ? (
                  <div className="engine-diagnostics-stack">
                    <TradingBehaviorPanel
                      meta={meta}
                      readiness={readiness}
                      managerStatus={managerStatus}
                      fixedAllowlist={fixedAllowlist}
                      executionMode={executionMode}
                    />
                    <AboutPanel aboutOpen={aboutOpen} setAboutOpen={setAboutOpen} />
                  </div>
                ) : (
                  <div className="dashboard-empty">
                    Diagnostics are hidden in Simple view. Switch to Advanced view when you need the deeper engine proof.
                  </div>
                )
              ) : null}

              {section === "spotlight" ? (
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
              ) : null}
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

