import { BILL_DAYS, MORTGAGE_DAYS, TOTAL_DAYS } from "./calendar";
import type { GameState } from "./types";

export interface LedgerEntry {
  id: string;
  day: number;
  title: string;
  amount?: number;
  kind: "income" | "expense" | "risk";
  probability?: number;
}

export function getLedgerEntries(state: GameState, horizon = 14): LedgerEntry[] {
  const endDay = Math.min(TOTAL_DAYS, state.day + horizon);
  const entries: LedgerEntry[] = [];

  for (const day of MORTGAGE_DAYS) {
    if (day >= state.day && day <= endDay && !state.flags[`mortgage_processed_${day}`]) {
      entries.push({
        id: `mortgage_${day}`,
        day,
        title: "房贷自动扣款",
        amount: -state.player.monthlyMortgage,
        kind: "expense",
      });
    }
  }

  for (const day of BILL_DAYS) {
    if (day >= state.day && day <= endDay && !state.flags[`midmonth_bills_processed_${day}`]) {
      entries.push({
        id: `bill_${day}`,
        day,
        title: "月中固定账单",
        amount: -6200,
        kind: "expense",
      });
    }
  }

  if (state.player.parentHealth < 58) {
    entries.push({
      id: "parent_health_risk",
      day: Math.min(endDay, state.day + 3),
      title: "父母复查/急诊风险",
      amount: -12000,
      kind: "risk",
      probability: state.player.parentHealth < 45 ? 70 : 40,
    });
  }

  if (state.player.socialSecurityContinuity < 82) {
    entries.push({
      id: "social_security_gap",
      day: Math.min(endDay, state.day + 5),
      title: "社保断缴风险",
      amount: -2500,
      kind: "risk",
      probability: 55,
    });
  }

  for (const active of state.activeOpportunities) {
    if (active.expiresOnDay >= state.day && active.expiresOnDay <= endDay) {
      entries.push({
        id: `opp_${active.id}`,
        day: active.expiresOnDay,
        title: "机会牌过期",
        kind: "risk",
        probability: 100,
      });
    }
  }

  for (const receivable of state.receivables ?? []) {
    if (receivable.dueDay >= state.day && receivable.dueDay <= endDay) {
      entries.push({
        id: `receivable_${receivable.id}`,
        day: receivable.dueDay,
        title: receivable.title,
        amount: receivable.amount,
        kind: "income",
        probability: receivable.probability,
      });
    }
  }

  if (Number(state.flags.pending_consulting_payment ?? 0) > 0) {
    entries.push({
      id: "pending_consulting_payment",
      day: Math.min(endDay, state.day + 7),
      title: "咨询费可能回款",
      amount: Number(state.flags.pending_consulting_payment),
      kind: "income",
      probability: 45,
    });
  }

  return entries.sort((a, b) => a.day - b.day || kindOrder(a.kind) - kindOrder(b.kind)).slice(0, 8);
}

export function projectedCashAfterLedger(state: GameState, entries = getLedgerEntries(state)): number {
  return entries.reduce((cash, entry) => {
    if (entry.kind === "expense") return cash + (entry.amount ?? 0);
    if (entry.kind === "income" && (entry.probability ?? 100) >= 95) return cash + (entry.amount ?? 0);
    return cash;
  }, state.player.availableCash);
}

function kindOrder(kind: LedgerEntry["kind"]): number {
  if (kind === "expense") return 0;
  if (kind === "risk") return 1;
  return 2;
}
