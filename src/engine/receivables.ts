import type { GameState, Receivable } from "./types";
import { addLog, applyEffect } from "./effects";

export function settleDueReceivables(state: GameState): GameState {
  const due = (state.receivables ?? []).filter((item) => item.dueDay <= state.day);
  if (!due.length) return state;

  let next: GameState = {
    ...state,
    receivables: (state.receivables ?? []).filter((item) => item.dueDay > state.day),
  };

  for (const receivable of due) {
    next = settleOne(next, receivable);
  }

  return next;
}

function settleOne(state: GameState, receivable: Receivable): GameState {
  if (Math.random() * 100 <= receivable.probability) {
    let next = applyEffect(state, { type: "cash", key: "availableCash", delta: receivable.amount });
    next = applyEffect(next, { type: "stat", key: "cash", delta: receivable.amount });
    next = applyEffect(next, { type: "stat", key: "mortgagePressure", delta: -3 });
    return addLog(
      next,
      "尾款到账",
      `${receivable.title} 到账 ¥${receivable.amount.toLocaleString("zh-CN")}。你第一次觉得“流程”两个字也能活着走完。`,
      "day",
    );
  }

  let next = applyEffect(state, { type: "stat", key: "anxiety", delta: 7 });
  next = applyEffect(next, { type: "stat", key: "emotion", delta: -4 });
  next = applyEffect(next, { type: "route", key: "collapse", delta: 2 });
  return addLog(
    next,
    "尾款拖延",
    `${receivable.title} 没有按时到账。对方说“财务在走流程”，你知道流程正在绕北京六环。`,
    "day",
  );
}
