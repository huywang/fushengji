import type { GameState, PlayerState, RouteScores } from "../engine/types";

export const initialPlayer: PlayerState = {
  cash: 186000,
  availableCash: 92000,
  debt: 5200000,
  monthlyMortgage: 23800,
  monthlyFixedCost: 61000,
  stamina: 70,
  emotion: 58,
  health: 72,
  dignity: 68,
  familyTrust: 70,
  spouseSafety: 62,
  childBond: 65,
  parentHealth: 68,
  mortgagePressure: 72,
  socialSecurityContinuity: 100,
  beijingBelonging: 55,
  commuteTolerance: 62,
  careerConfidence: 64,
  anxiety: 42,
  aiAnxiety: 35,
  shortVideoNumbness: 20,
  midlifeThickSkin: 12,
  skills: {
    career: 75,
    interview: 50,
    codingOrProduct: 72,
    sales: 35,
    freelance: 20,
    selfMedia: 8,
    aiTool: 25,
    familyCommunication: 40,
    cashflowManagement: 30,
  },
};

export const initialRouteScores: RouteScores = {
  job: 0,
  freelance: 0,
  selfMedia: 0,
  gig: 0,
  startup: 0,
  familyRepair: 0,
  leaveBeijing: 0,
  collapse: 0,
};

export function createInitialState(): GameState {
  return {
    day: 1,
    period: "morning",
    actionPoints: 3,
    currentLocationId: "huilongguan",
    player: structuredClone(initialPlayer),
    flags: {},
    history: [
      {
        id: "log_opening",
        day: 1,
        period: "morning",
        title: "上午 10:20，望京",
        text: "你刚把咖啡放到工位上，就收到 HR 的会议邀请。会议室：B3-17。主题：组织沟通。",
        kind: "system",
      },
    ],
    routeScores: { ...initialRouteScores },
    triggeredEventIds: [],
    pendingEventId: "event_001_layoff_room",
  };
}

export function normalizeGameState(state: GameState): GameState {
  return {
    ...state,
    player: {
      ...structuredClone(initialPlayer),
      ...state.player,
      skills: {
        ...initialPlayer.skills,
        ...state.player.skills,
      },
    },
  };
}
