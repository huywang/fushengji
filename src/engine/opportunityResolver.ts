import { opportunities } from "../data/opportunities";
import type { GameState, OpportunityCard, OpportunityOutcome, Period, RouteScores } from "./types";
import { addLog, applyEffects, meetsRequirements } from "./effects";
import { enforceCriticalCollapse } from "./critical";
import { isWeekend } from "./calendar";
import { pickRandomEvent } from "./eventResolver";
import { weightedPick } from "./random";

export interface OpportunityOption {
  card: OpportunityCard;
  expiresOnDay: number;
  daysLeft: number;
  available: boolean;
  reason?: string;
}

const periodByActionPoints: Record<number, Period> = {
  3: "morning",
  2: "afternoon",
  1: "evening",
  0: "evening",
};

export function getOpportunity(cardId: string): OpportunityCard | undefined {
  return opportunities.find((card) => card.id === cardId);
}

export function getOpportunityOptions(state: GameState): OpportunityOption[] {
  const options: OpportunityOption[] = [];
  for (const active of state.activeOpportunities) {
    const card = getOpportunity(active.id);
    if (!card) continue;
    const expired = active.expiresOnDay < state.day;
    const availabilityReason = getAvailabilityReason(state, card);
    const requirementReason = meetsRequirements(state, card.requirements) ? undefined : "前置条件不足";
    const reason = expired ? "机会已经过期" : availabilityReason ?? requirementReason;
    options.push({
      card,
      expiresOnDay: active.expiresOnDay,
      daysLeft: Math.max(0, active.expiresOnDay - state.day),
      available: !reason,
      reason,
    });
  }
  return options;
}

export function refreshOpportunities(state: GameState, targetCount = getTargetOpportunityCount(state.day)): GameState {
  const currentIds = new Set(state.activeOpportunities.map((active) => active.id));
  const completedIds = new Set(state.completedOpportunityIds);
  const kept = state.activeOpportunities.filter((active) => active.expiresOnDay >= state.day && getOpportunity(active.id));
  const expired = state.activeOpportunities.filter((active) => active.expiresOnDay < state.day && getOpportunity(active.id));

  let next: GameState = { ...state, activeOpportunities: kept };
  if (expired.length) {
    const titles = expired
      .map((active) => getOpportunity(active.id)?.title)
      .filter(Boolean)
      .join("、");
    next = addLog(next, "机会过期", `${titles} 过期了。北京的机会不会消失，只会换一个更难听的报价回来。`, "day");
  }

  const nextIds = new Set(next.activeOpportunities.map((active) => active.id));
  const pool = opportunities.filter((card) => {
    if (nextIds.has(card.id) || currentIds.has(card.id)) return false;
    if (card.unique && completedIds.has(card.id)) return false;
    if (!meetsRequirements(next, card.requirements)) return false;
    return true;
  });

  while (next.activeOpportunities.length < targetCount && pool.length) {
    const card = weightedPick(pool, (candidate) => candidate.weight ?? 1);
    if (!card) break;
    next.activeOpportunities = [
      ...next.activeOpportunities,
      {
        id: card.id,
        createdDay: next.day,
        expiresOnDay: next.day + card.expiresInDays,
      },
    ];
    pool.splice(pool.indexOf(card), 1);
  }

  return next;
}

export function performOpportunity(state: GameState, cardId: string): GameState {
  if (state.pendingEventId || state.endingId || state.actionPoints <= 0) return state;
  const active = state.activeOpportunities.find((item) => item.id === cardId);
  const card = getOpportunity(cardId);
  if (!active || !card || active.expiresOnDay < state.day || getAvailabilityReason(state, card) || !meetsRequirements(state, card.requirements)) {
    return state;
  }

  const outcome = card.outcomes ? weightedPick(card.outcomes, (candidate) => candidate.weight) : undefined;
  let next = applyEffects(state, card.effects);
  next = applyRouteEffects(next, card.routeScoreEffects);
  if (outcome) {
    next = applyEffects(next, outcome.effects);
    next = applyRouteEffects(next, outcome.routeScoreEffects);
  }

  const actionPoints = Math.max(0, state.actionPoints - 1);
  const resultText = outcome?.resultText ?? card.description;
  next = {
    ...next,
    actionPoints,
    period: periodByActionPoints[actionPoints] ?? "evening",
    activeOpportunities: next.activeOpportunities.filter((item) => item.id !== card.id),
    completedOpportunityIds: next.completedOpportunityIds.includes(card.id)
      ? next.completedOpportunityIds
      : [...next.completedOpportunityIds, card.id],
    lastEventResult: resultText,
  };
  next = addLog(next, card.title, resultText, "action");
  next = enforceCriticalCollapse(next);
  if (next.endingId) return next;

  const eventIds = [...(card.possibleEventIds ?? []), ...((outcome as OpportunityOutcome | undefined)?.possibleEventIds ?? [])];
  const eventChance = Math.min(0.82, 0.18 + card.riskLevel * 0.1);
  if (eventIds.length && Math.random() < eventChance) {
    const event = pickRandomEvent(next, eventIds);
    if (event) next = { ...next, pendingEventId: event.id };
  }

  return next;
}

function applyRouteEffects(state: GameState, effects?: Partial<RouteScores>): GameState {
  if (!effects) return state;
  return applyEffects(
    state,
    Object.entries(effects).map(([key, delta]) => ({
      type: "route" as const,
      key,
      delta: delta ?? 0,
    })),
  );
}

function getAvailabilityReason(state: GameState, card: OpportunityCard): string | undefined {
  const availability = card.availability;
  if (!availability) return undefined;
  const weekend = isWeekend(state.day);
  const defaultReason = availability.reason ?? "当前时间不适合做这件事";

  if (availability.weekdaysOnly && weekend) return defaultReason;
  if (availability.weekendsOnly && !weekend) return defaultReason;

  const periodRules = weekend ? availability.weekendPeriods : availability.weekdayPeriods;
  if (periodRules && !periodRules.includes(state.period)) return defaultReason;
  if (!periodRules && availability.periods && !availability.periods.includes(state.period)) return defaultReason;

  return undefined;
}

function getTargetOpportunityCount(day: number): number {
  if (day >= 36) return 5;
  if (day >= 15) return 4;
  return 3;
}
