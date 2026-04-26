import { actions } from "../data/actions";
import type { GameAction, GameState, Period, RouteScores } from "./types";
import { addLog, applyEffects, meetsRequirements } from "./effects";
import { pickRandomEvent } from "./eventResolver";
import { enforceCriticalCollapse } from "./critical";

const periodByActionPoints: Record<number, Period> = {
  3: "morning",
  2: "afternoon",
  1: "evening",
  0: "evening",
};

export function getAvailableActions(state: GameState): GameAction[] {
  return actions.filter(
    (action) => action.locationId === state.currentLocationId && meetsRequirements(state, action.requirements),
  );
}

export function getAction(actionId: string): GameAction | undefined {
  return actions.find((action) => action.id === actionId);
}

export function performAction(state: GameState, actionId: string): GameState {
  if (state.pendingEventId || state.endingId || state.actionPoints <= 0) return state;
  const action = getAction(actionId);
  if (!action || !meetsRequirements(state, action.requirements)) return state;

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
