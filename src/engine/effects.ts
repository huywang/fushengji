import type { Effect, GameState, PlayerState, Requirement, RouteScores, SkillState } from "./types";

const playerRanges: Partial<Record<keyof PlayerState, [number, number]>> = {
  stamina: [0, 100],
  emotion: [0, 100],
  health: [0, 100],
  dignity: [0, 100],
  familyTrust: [0, 100],
  spouseSafety: [0, 100],
  childBond: [0, 100],
  parentHealth: [0, 100],
  mortgagePressure: [0, 100],
  socialSecurityContinuity: [0, 100],
  beijingBelonging: [0, 100],
  commuteTolerance: [0, 100],
  careerConfidence: [0, 100],
  anxiety: [0, 100],
  aiAnxiety: [0, 100],
  shortVideoNumbness: [0, 100],
  midlifeThickSkin: [0, 100],
};

const skillKeys = new Set<keyof SkillState>([
  "career",
  "interview",
  "codingOrProduct",
  "sales",
  "freelance",
  "selfMedia",
  "aiTool",
  "familyCommunication",
  "cashflowManagement",
]);

function clampValue(key: keyof PlayerState, value: number): number {
  const range = playerRanges[key];
  if (!range) return Math.round(value);
  return Math.round(Math.min(range[1], Math.max(range[0], value)));
}

export function addLog(state: GameState, title: string, text: string, kind: GameState["history"][number]["kind"]): GameState {
  return {
    ...state,
    history: [
      {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        day: state.day,
        period: state.period,
        title,
        text,
        kind,
      },
      ...state.history,
    ].slice(0, 80),
  };
}

export function applyEffect(state: GameState, effect: Effect): GameState {
  const next: GameState = structuredClone(state);
  if (effect.type === "stat" || effect.type === "cash") {
    const key = effect.key as keyof PlayerState;
    const current = Number(next.player[key] ?? 0);
    if (typeof next.player[key] === "number") {
      (next.player[key] as number) = clampValue(key, current + (effect.delta ?? 0));
    }
    return next;
  }
  if (effect.type === "skill") {
    const key = effect.key as keyof SkillState;
    if (skillKeys.has(key)) {
      next.player.skills[key] = Math.round(Math.min(100, Math.max(0, next.player.skills[key] + (effect.delta ?? 0))));
    }
    return next;
  }
  if (effect.type === "route") {
    const key = effect.key as keyof RouteScores;
    next.routeScores[key] = Math.round(Math.max(0, (next.routeScores[key] ?? 0) + (effect.delta ?? 0)));
    return next;
  }
  if (effect.type === "flag") {
    if (effect.value !== undefined) {
      next.flags[effect.key] = effect.value;
    } else {
      const current = Number(next.flags[effect.key] ?? 0);
      next.flags[effect.key] = current + (effect.delta ?? 0);
    }
    return next;
  }
  return state;
}

export function applyEffects(state: GameState, effects: Effect[]): GameState {
  return effects.reduce((current, effect) => applyEffect(current, effect), state);
}

export function meetsRequirement(state: GameState, requirement: Requirement): boolean {
  if (requirement.type === "dayMin") return state.day >= Number(requirement.value);
  if (requirement.type === "dayMax") return state.day <= Number(requirement.value);
  if (requirement.type === "flag") return (state.flags[requirement.key] ?? false) === requirement.value;

  const statValue = getNumericValue(state, requirement.key);
  if (requirement.type === "statMin") return statValue >= Number(requirement.value);
  if (requirement.type === "statMax") return statValue <= Number(requirement.value);
  return true;
}

export function meetsRequirements(state: GameState, requirements?: Requirement[]): boolean {
  return !requirements || requirements.every((requirement) => meetsRequirement(state, requirement));
}

export function getNumericValue(state: GameState, key: string): number {
  if (key in state.player && typeof state.player[key as keyof PlayerState] === "number") {
    return Number(state.player[key as keyof PlayerState]);
  }
  if (key in state.player.skills) {
    return Number(state.player.skills[key as keyof SkillState]);
  }
  if (key in state.routeScores) {
    return Number(state.routeScores[key as keyof RouteScores]);
  }
  return Number(state.flags[key] ?? 0);
}
