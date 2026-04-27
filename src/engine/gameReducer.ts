import { createInitialState } from "../data/initialState";
import { narrationLines } from "../data/narration";
import type { GameState, Period } from "./types";
import { addLog, applyEffect } from "./effects";
import { pickRandomEvent } from "./eventResolver";
import { enforceCriticalCollapse } from "./critical";
import { BILL_DAYS, COUNTDOWN_DAYS, MORTGAGE_DAYS, TOTAL_DAYS } from "./calendar";
import { refreshOpportunities } from "./opportunityResolver";
import { settleDueReceivables } from "./receivables";

const nextDayPeriod: Period = "morning";

export function newGame(): GameState {
  return refreshOpportunities(createInitialState());
}

export function setLocation(state: GameState, locationId: string): GameState {
  if (state.pendingEventId || state.endingId) return state;
  return { ...state, currentLocationId: locationId };
}

function applyDailyPressure(state: GameState): GameState {
  let next = state;
  if (!next.flags.has_new_job) {
    next = applyEffect(next, { type: "stat", key: "anxiety", delta: 3 });
    next = applyEffect(next, { type: "stat", key: "careerConfidence", delta: -1 });
  }
  if (next.player.availableCash < next.player.monthlyFixedCost) {
    next = applyEffect(next, { type: "stat", key: "anxiety", delta: 5 });
    next = applyEffect(next, { type: "stat", key: "mortgagePressure", delta: 5 });
    next = applyEffect(next, { type: "stat", key: "spouseSafety", delta: -2 });
  }
  if (next.player.stamina < 20) {
    next = applyEffect(next, { type: "stat", key: "health", delta: -3 });
    next = applyEffect(next, { type: "stat", key: "emotion", delta: -3 });
  }
  if (next.player.emotion < 20) {
    next = applyEffect(next, { type: "stat", key: "shortVideoNumbness", delta: 3 });
    next = applyEffect(next, { type: "stat", key: "familyTrust", delta: -1 });
  }
  if (next.flags.hiding_unemployment) {
    next = applyEffect(next, { type: "stat", key: "anxiety", delta: 2 });
    next = applyEffect(next, { type: "stat", key: "familyTrust", delta: -1 });
  }
  if (next.day >= 25) {
    next = applyEffect(next, { type: "stat", key: "mortgagePressure", delta: 4 });
    next = applyEffect(next, { type: "stat", key: "anxiety", delta: 2 });
  }
  return next;
}

function applyMortgage(state: GameState): GameState {
  const dueDay = MORTGAGE_DAYS.find((day) => day <= state.day && !state.flags[`mortgage_processed_${day}`]);
  if (!dueDay) return state;
  let next = state;
  if (next.player.availableCash >= next.player.monthlyMortgage) {
    const before = next.player.availableCash;
    next = applyEffect(next, { type: "stat", key: "availableCash", delta: -next.player.monthlyMortgage });
    next = applyEffect(next, { type: "stat", key: "cash", delta: -next.player.monthlyMortgage });
    next = applyEffect(next, { type: "stat", key: "mortgagePressure", delta: -8 });
    next = applyEffect(next, { type: "flag", key: "mortgage_success_today", value: true });
    next = {
      ...next,
      pendingEventId: "event_003_mortgage_success",
      lastEventResult: `第 ${dueDay} 天早上，房贷自动扣款 ¥${next.player.monthlyMortgage.toLocaleString("zh-CN")}。可用现金从 ¥${before.toLocaleString("zh-CN")} 变成 ¥${next.player.availableCash.toLocaleString("zh-CN")}。`,
    };
    next = addLog(next, "房贷扣款成功", next.lastEventResult ?? "房贷自动扣款成功。", "day");
  } else {
    next = applyEffect(next, { type: "stat", key: "mortgagePressure", delta: 25 });
    next = applyEffect(next, { type: "stat", key: "dignity", delta: -10 });
    next = applyEffect(next, { type: "stat", key: "spouseSafety", delta: -10 });
    next = applyEffect(next, { type: "stat", key: "anxiety", delta: 15 });
    next = applyEffect(next, { type: "flag", key: "mortgage_failed", value: true });
    next = {
      ...next,
      pendingEventId: "event_004_mortgage_failed",
      lastEventResult: `第 ${dueDay} 天早上，房贷扣款失败。银行短信比闹钟准，也比闹钟冷。`,
    };
    next = addLog(next, "房贷扣款失败", `第 ${dueDay} 天早上，房贷扣款失败。银行短信比闹钟准，也比闹钟冷。`, "day");
  }
  return applyEffect(next, { type: "flag", key: `mortgage_processed_${dueDay}`, value: true });
}

function applyMidMonthBills(state: GameState): GameState {
  if (!BILL_DAYS.includes(state.day) || state.flags[`midmonth_bills_processed_${state.day}`]) return state;
  let next = state;
  next = applyEffect(next, { type: "stat", key: "availableCash", delta: -6200 });
  next = applyEffect(next, { type: "stat", key: "cash", delta: -6200 });
  next = applyEffect(next, { type: "stat", key: "mortgagePressure", delta: 7 });
  next = applyEffect(next, { type: "stat", key: "anxiety", delta: 6 });
  next = applyEffect(next, { type: "flag", key: `midmonth_bills_processed_${state.day}`, value: true });
  return addLog(
    next,
    "月中账单",
    "物业、水电、补课尾款和信用卡最低还款排队进场。北京不是突然变贵，它只是每隔几天提醒你一次。",
    "day",
  );
}

function applyStartOfDaySpecials(state: GameState): GameState {
  let next = settleDueReceivables(state);
  next = applyMortgage(next);
  next = applyMidMonthBills(next);
  if (COUNTDOWN_DAYS.includes(next.day) && !next.flags[`next_mortgage_countdown_logged_${next.day}`]) {
    next = applyEffect(next, { type: "stat", key: "mortgagePressure", delta: 8 });
    next = applyEffect(next, { type: "stat", key: "anxiety", delta: 5 });
    next = applyEffect(next, { type: "flag", key: `next_mortgage_countdown_logged_${next.day}`, value: true });
    next = addLog(
      next,
      "下月房贷倒计时",
      "银行还没扣钱，倒计时已经开始扣你。成年人最怕的不是今天没钱，是下个月已经在门口换鞋。",
      "day",
    );
  }
  return next;
}

export function endDay(state: GameState): GameState {
  if (state.pendingEventId || state.endingId) return state;

  let next = addLog(
    state,
    `第 ${state.day} 天结束`,
    narrationLines[(state.day + state.history.length) % narrationLines.length],
    "day",
  );

  next = applyDailyPressure(next);

  if (next.day >= TOTAL_DAYS) {
    return { ...next, actionPoints: 0, period: "evening", pendingEventId: "event_030_day30_table" };
  }

  next = {
    ...next,
    day: next.day + 1,
    period: nextDayPeriod,
    actionPoints: 3,
    currentLocationId: "huilongguan",
  };

  next = applyStartOfDaySpecials(next);
  next = refreshOpportunities(next);
  next = enforceCriticalCollapse(next);
  if (next.endingId || next.pendingEventId) return next;

  const event = pickRandomEvent(next);
  if (event && Math.random() < 0.74) {
    next = { ...next, pendingEventId: event.id };
  }

  return next;
}
