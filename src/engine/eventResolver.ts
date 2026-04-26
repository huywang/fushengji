import { events } from "../data/events";
import type { EventCard, EventOption, GameState, PlayerStatKey, RouteScores } from "./types";
import { applyEffects, meetsRequirements } from "./effects";
import { evaluateEnding } from "../data/endings";
import { weightedPick } from "./random";
import { addLog } from "./effects";
import { enforceCriticalCollapse } from "./critical";

export function getEvent(eventId?: string): EventCard | undefined {
  return events.find((event) => event.id === eventId);
}

export function isEventAvailable(state: GameState, event: EventCard): boolean {
  if (event.once && state.triggeredEventIds.includes(event.id)) return false;
  const trigger = event.trigger;
  if (trigger.dayMin !== undefined && state.day < trigger.dayMin) return false;
  if (trigger.dayMax !== undefined && state.day > trigger.dayMax) return false;

  if (trigger.flags) {
    for (const [key, expected] of Object.entries(trigger.flags)) {
      const actual = state.flags[key] ?? false;
      if (actual !== expected) return false;
    }
  }

  if (trigger.statMin) {
    for (const [key, value] of Object.entries(trigger.statMin) as [PlayerStatKey, number][]) {
      if (Number(state.player[key]) < value) return false;
    }
  }

  if (trigger.statMax) {
    for (const [key, value] of Object.entries(trigger.statMax) as [PlayerStatKey, number][]) {
      if (Number(state.player[key]) > value) return false;
    }
  }

  if (trigger.routeScoreMin) {
    for (const [key, value] of Object.entries(trigger.routeScoreMin) as [keyof RouteScores, number][]) {
      if (state.routeScores[key] < value) return false;
    }
  }

  return true;
}

export function pickRandomEvent(state: GameState, allowedIds?: string[]): EventCard | null {
  const pool = events
    .filter((event) => (allowedIds ? allowedIds.includes(event.id) : true))
    .filter((event) => isEventAvailable(state, event));

  if (!pool.length) return null;
  const priorityMax = Math.max(...pool.map((event) => event.priority ?? 0));
  const priorityPool = priorityMax > 0 ? pool.filter((event) => (event.priority ?? 0) === priorityMax) : pool;
  return weightedPick(priorityPool, (event) => event.trigger.randomWeight ?? event.priority ?? 1) ?? null;
}

export function resolveEvent(state: GameState, optionId: string): GameState {
  const event = getEvent(state.pendingEventId);
  if (!event) return state;
  const option = event.options.find((candidate: EventOption) => candidate.id === optionId);
  if (!option || !meetsRequirements(state, option.requirements)) return state;

  let next = applyEffects(state, option.effects);
  next = {
    ...next,
    pendingEventId: undefined,
    lastEventResult: option.resultText,
    triggeredEventIds: next.triggeredEventIds.includes(event.id)
      ? next.triggeredEventIds
      : [...next.triggeredEventIds, event.id],
  };
  next = addLog(next, event.title, option.resultText, "event");
  next = enforceCriticalCollapse(next);
  if (next.endingId) return next;

  if (event.id === "event_030_day30_table" || next.flags.ready_for_ending) {
    const ending = evaluateEnding(next);
    next = {
      ...next,
      endingId: ending.id,
      pendingEventId: undefined,
    };
    next = addLog(next, ending.title, ending.body, "ending");
  }

  return next;
}
