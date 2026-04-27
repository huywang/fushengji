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
  activeOpportunities: ActiveOpportunity[];
  completedOpportunityIds: string[];
  receivables: Receivable[];
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
  type: "stat" | "cash" | "flag" | "route" | "skill" | "receivable";
  key: string;
  delta?: number;
  value?: FlagValue;
  text?: string;
  dueInDays?: number;
  probability?: number;
}

export interface Receivable {
  id: string;
  title: string;
  dueDay: number;
  amount: number;
  probability: number;
  source: string;
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
  availability?: ActionAvailability;
  requirements?: Requirement[];
  effects: Effect[];
  possibleEventIds?: string[];
  routeScoreEffects?: Partial<RouteScores>;
}

export interface ActionAvailability {
  periods?: Period[];
  weekdayPeriods?: Period[];
  weekendPeriods?: Period[];
  weekdaysOnly?: boolean;
  weekendsOnly?: boolean;
  reason?: string;
}

export type OpportunitySource = "job" | "freelance" | "trade" | "family" | "policy" | "gig" | "selfMedia" | "asset" | "trap";

export interface ActiveOpportunity {
  id: string;
  createdDay: number;
  expiresOnDay: number;
}

export interface OpportunityOutcome {
  id: string;
  label: string;
  weight: number;
  resultText: string;
  effects: Effect[];
  routeScoreEffects?: Partial<RouteScores>;
  possibleEventIds?: string[];
}

export interface OpportunityCard {
  id: string;
  title: string;
  source: OpportunitySource;
  description: string;
  flavor: string;
  expiresInDays: number;
  riskLevel: 1 | 2 | 3 | 4 | 5;
  weight?: number;
  unique?: boolean;
  availability?: ActionAvailability;
  requirements?: Requirement[];
  effects: Effect[];
  outcomes?: OpportunityOutcome[];
  possibleEventIds?: string[];
  routeScoreEffects?: Partial<RouteScores>;
  rewardLabel: string;
  costLabel: string;
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
