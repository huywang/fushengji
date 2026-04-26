export type Period = "morning" | "afternoon" | "evening";

export interface SkillState {
  career: number;
  interview: number;
  codingOrProduct: number;
  sales: number;
  freelance: number;
  selfMedia: number;
  aiTool: number;
  familyCommunication: number;
  cashflowManagement: number;
}

export interface PlayerState {
  cash: number;
  availableCash: number;
  debt: number;
  monthlyMortgage: number;
  monthlyFixedCost: number;
  stamina: number;
  emotion: number;
  health: number;
  dignity: number;
  familyTrust: number;
  spouseSafety: number;
  childBond: number;
  parentHealth: number;
  mortgagePressure: number;
  socialSecurityContinuity: number;
  beijingBelonging: number;
  commuteTolerance: number;
  careerConfidence: number;
  anxiety: number;
  aiAnxiety: number;
  shortVideoNumbness: number;
  midlifeThickSkin: number;
  skills: SkillState;
}

export interface RouteScores {
  job: number;
  freelance: number;
  selfMedia: number;
  gig: number;
  startup: number;
  familyRepair: number;
  leaveBeijing: number;
  collapse: number;
}

export type FlagValue = boolean | number | string;

export interface LogEntry {
  id: string;
  day: number;
  period: Period;
  title: string;
  text: string;
  kind: "system" | "action" | "event" | "day" | "ending";
}

export interface GameState {
  day: number;
  period: Period;
  actionPoints: number;
  currentLocationId: string;
  player: PlayerState;
  flags: Record<string, FlagValue>;
  history: LogEntry[];
  routeScores: RouteScores;
  triggeredEventIds: string[];
  pendingEventId?: string;
  lastEventResult?: string;
  endingId?: string;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  tags: string[];
}

export type PlayerStatKey = Exclude<keyof PlayerState, "skills">;
export type StatKey = PlayerStatKey | keyof SkillState;

export interface Effect {
  type: "stat" | "cash" | "flag" | "route" | "skill";
  key: string;
  delta?: number;
  value?: FlagValue;
  text?: string;
}

export interface Requirement {
  type: "statMin" | "statMax" | "flag" | "dayMin" | "dayMax";
  key: string;
  value: number | boolean | string;
}

export interface GameAction {
  id: string;
  name: string;
  locationId: string;
  description: string;
  requirements?: Requirement[];
  effects: Effect[];
  possibleEventIds?: string[];
  routeScoreEffects?: Partial<RouteScores>;
}

export interface EventTrigger {
  dayMin?: number;
  dayMax?: number;
  statMin?: Partial<Record<PlayerStatKey, number>>;
  statMax?: Partial<Record<PlayerStatKey, number>>;
  flags?: Record<string, FlagValue>;
  routeScoreMin?: Partial<RouteScores>;
  randomWeight?: number;
}

export interface EventOption {
  id: string;
  text: string;
  resultText: string;
  effects: Effect[];
  requirements?: Requirement[];
}

export interface EventCard {
  id: string;
  title: string;
  locationId?: string;
  tags: string[];
  priority?: number;
  once?: boolean;
  trigger: EventTrigger;
  body: string;
  options: EventOption[];
}

export interface Ending {
  id: string;
  title: string;
  conditionDescription: string;
  body: string;
  statsSummary: string[];
}
