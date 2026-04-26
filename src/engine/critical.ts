import { addLog } from "./effects";
import type { GameState, PlayerStatKey } from "./types";

export interface CriticalRule {
  key: PlayerStatKey;
  label: string;
  direction: "min" | "max";
  limit: number;
  collapseText: string;
}

export const criticalRules: CriticalRule[] = [
  {
    key: "availableCash",
    label: "可用现金",
    direction: "min",
    limit: 0,
    collapseText: "现金流断裂。房贷、社保和日常支出不再是压力，而是立即到期的现实。",
  },
  {
    key: "mortgagePressure",
    label: "房贷压力",
    direction: "max",
    limit: 100,
    collapseText: "房贷压力顶到满格。你不是没有选择，只是每个选择都开始带着滞纳金。",
  },
  {
    key: "emotion",
    label: "情绪",
    direction: "min",
    limit: 0,
    collapseText: "情绪归零。你还能完成动作，但已经无法继续做决定。",
  },
  {
    key: "stamina",
    label: "体力",
    direction: "min",
    limit: 0,
    collapseText: "体力归零。身体替你按下暂停键，比任何会议纪要都坚决。",
  },
  {
    key: "health",
    label: "健康",
    direction: "min",
    limit: 20,
    collapseText: "健康跌破临界线。中年危机突然从账本问题，变成了医院挂号问题。",
  },
  {
    key: "parentHealth",
    label: "父母健康",
    direction: "min",
    limit: 20,
    collapseText: "父母健康跌破临界线。你突然发现，自己不是一个人在北京扛，还有人正在老家替你变老。",
  },
  {
    key: "familyTrust",
    label: "家庭信任",
    direction: "min",
    limit: 20,
    collapseText: "家庭信任跌破临界线。房子还在同一个地址，家却开始不像同一个阵营。",
  },
  {
    key: "dignity",
    label: "体面",
    direction: "min",
    limit: 10,
    collapseText: "体面跌破临界线。你终于发现体面不是护甲，是一张会透支的信用卡。",
  },
  {
    key: "beijingBelonging",
    label: "北京归属感",
    direction: "min",
    limit: 5,
    collapseText: "北京归属感跌破临界线。你还在这座城市，但心里已经开始查离开的路线。",
  },
  {
    key: "socialSecurityContinuity",
    label: "社保连续性",
    direction: "min",
    limit: 0,
    collapseText: "社保连续性归零。成年人最后的连续剧断更了。",
  },
];

export function getCriticalRule(key: string): CriticalRule | undefined {
  return criticalRules.find((rule) => rule.key === key);
}

export function isCritical(value: number, rule: CriticalRule): boolean {
  return rule.direction === "min" ? value <= rule.limit : value >= rule.limit;
}

export function criticalLabel(rule: CriticalRule): string {
  return rule.direction === "min" ? `临界 ≤ ${formatLimit(rule)}` : `临界 ≥ ${formatLimit(rule)}`;
}

function formatLimit(rule: CriticalRule): string {
  if (rule.key === "availableCash") return `¥${rule.limit.toLocaleString("zh-CN")}`;
  return String(rule.limit);
}

export function enforceCriticalCollapse(state: GameState): GameState {
  if (state.endingId) return state;
  const brokenRule = criticalRules.find((rule) => isCritical(Number(state.player[rule.key]), rule));
  if (!brokenRule) return state;

  const next: GameState = {
    ...state,
    actionPoints: 0,
    pendingEventId: undefined,
    endingId: "ending_critical_collapse",
    flags: {
      ...state.flags,
      collapse_stat: brokenRule.label,
      collapse_reason: brokenRule.collapseText,
    },
  };

  return addLog(next, `${brokenRule.label}崩溃`, brokenRule.collapseText, "ending");
}
