import { actions } from "../data/actions";
import type { GameAction, GameState, Period, RouteScores } from "./types";
import { addLog, applyEffects, meetsRequirements } from "./effects";
import { pickRandomEvent } from "./eventResolver";
import { enforceCriticalCollapse } from "./critical";
import { isWeekend } from "./calendar";

export interface ActionOption {
  action: GameAction;
  available: boolean;
  reason?: string;
}

const periodByActionPoints: Record<number, Period> = {
  3: "morning",
  2: "afternoon",
  1: "evening",
  0: "evening",
};

export function getAvailableActions(state: GameState): GameAction[] {
  return getLocationActionOptions(state)
    .filter((option) => option.available)
    .map((option) => option.action);
}

export function getLocationActionOptions(state: GameState): ActionOption[] {
  return actions
    .filter((action) => action.locationId === state.currentLocationId)
    .map((action) => {
      const availabilityReason = getAvailabilityReason(state, action);
      const requirementReason = meetsRequirements(state, action.requirements) ? undefined : "前置条件不足";
      const reason = availabilityReason ?? requirementReason;
      return {
        action,
        available: !reason,
        reason,
      };
    });
}

export function getAction(actionId: string): GameAction | undefined {
  return actions.find((action) => action.id === actionId);
}

export function performAction(state: GameState, actionId: string): GameState {
  if (state.pendingEventId || state.endingId || state.actionPoints <= 0) return state;
  const action = getAction(actionId);
  if (!action || !meetsRequirements(state, action.requirements) || getAvailabilityReason(state, action)) return state;

  let next = applyEffects(state, action.effects);

  if (action.routeScoreEffects) {
    const routeEffects = Object.entries(action.routeScoreEffects).map(([key, delta]) => ({
      type: "route" as const,
      key: key as keyof RouteScores,
      delta: delta ?? 0,
    }));
    next = applyEffects(next, routeEffects);
  }

  const actionPoints = Math.max(0, state.actionPoints - 1);
  next = {
    ...next,
    actionPoints,
    period: periodByActionPoints[actionPoints] ?? "evening",
  };
  next = addLog(next, action.name, action.description, "action");
  next = enforceCriticalCollapse(next);
  if (next.endingId) return next;

  if (action.possibleEventIds && Math.random() < 0.58) {
    const event = pickRandomEvent(next, action.possibleEventIds);
    if (event) {
      next = { ...next, pendingEventId: event.id };
    }
  }

  return next;
}

function getAvailabilityReason(state: GameState, action: GameAction): string | undefined {
  const availability = action.availability;
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
