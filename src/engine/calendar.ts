import type { GameState } from "./types";

export const TOTAL_DAYS = 60;
export const MORTGAGE_DAYS = [3, 33];
export const BILL_DAYS = [15, 45];
export const COUNTDOWN_DAYS = [25, 55];

export function getStage(day: number): { title: string; description: string } {
  if (day <= 7) {
    return { title: "失业冲击期", description: "会议室、房贷和解释权同时到来。" };
  }
  if (day <= 21) {
    return { title: "现金流暴露期", description: "补偿、账单、父母健康开始排队。" };
  }
  if (day <= 35) {
    return { title: "路线分化期", description: "求职、外包、自媒体、离京开始拉开差距。" };
  }
  if (day <= 50) {
    return { title: "第二轮挤压期", description: "第二个月的账单证明压力不是一次性的。" };
  }
  return { title: "方向判定期", description: "你要决定是稳住、转向，还是承认退路。" };
}

export function nextDeadline(day: number): { label: string; day: number; daysLeft: number } {
  const deadlines = [
    ...MORTGAGE_DAYS.map((target) => ({ label: "房贷扣款", day: target })),
    ...BILL_DAYS.map((target) => ({ label: "月中账单", day: target })),
    ...COUNTDOWN_DAYS.map((target) => ({ label: "下月房贷倒计时", day: target })),
    { label: "阶段结局", day: TOTAL_DAYS },
  ]
    .filter((item) => item.day >= day)
    .sort((a, b) => a.day - b.day);

  const next = deadlines[0] ?? { label: "阶段结局", day: TOTAL_DAYS };
  return { ...next, daysLeft: Math.max(0, next.day - day) };
}

export function cashRunwayDays(state: GameState): number {
  const dailyCost = Math.max(1, Math.round(state.player.monthlyFixedCost / 30));
  return Math.max(0, Math.floor(state.player.availableCash / dailyCost));
}

export function pressureWarnings(state: GameState): string[] {
  const warnings: string[] = [];
  const deadline = nextDeadline(state.day);
  if (deadline.daysLeft <= 3) warnings.push(`${deadline.label}还有 ${deadline.daysLeft} 天`);
  if (state.player.availableCash < state.player.monthlyFixedCost) warnings.push("可用现金低于一个月固定支出");
  if (state.player.parentHealth < 50) warnings.push("父母健康进入风险区");
  if (state.player.mortgagePressure >= 80) warnings.push("房贷压力接近崩溃线");
  if (state.player.emotion <= 25 || state.player.stamina <= 25) warnings.push("身心资源接近透支");
  return warnings.slice(0, 4);
}
