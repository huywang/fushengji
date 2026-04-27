import { getLedgerEntries, projectedCashAfterLedger } from "../engine/ledger";
import type { GameState } from "../engine/types";

export function LedgerPanel({ state }: { state: GameState }) {
  const entries = getLedgerEntries(state);
  const projectedCash = projectedCashAfterLedger(state, entries);
  const days = Array.from({ length: 15 }, (_, index) => state.day + index);

  return (
    <section className="ledger-panel">
      <div className="section-heading">
        <h2>14 天雷区</h2>
        <span>账单 / 风险 / 回款</span>
      </div>
      <div className="ledger-summary">
        <span>保守账后现金</span>
        <strong className={projectedCash < state.player.monthlyMortgage ? "danger-text" : ""}>
          ¥{projectedCash.toLocaleString("zh-CN")}
        </strong>
      </div>
      <div className="cash-radar" aria-label="未来 14 天现金流雷区">
        {days.map((day) => {
          const dayEntries = entries.filter((entry) => entry.day === day);
          const danger = dayEntries.some((entry) => entry.kind === "expense");
          const risk = dayEntries.some((entry) => entry.kind === "risk");
          const income = dayEntries.some((entry) => entry.kind === "income");
          return (
            <div className={`radar-day${danger ? " danger" : ""}${risk ? " risk" : ""}${income ? " income" : ""}`} key={day}>
              <span>{day === state.day ? "今" : day}</span>
              <i>{dayEntries.length || ""}</i>
            </div>
          );
        })}
      </div>
      <div className="ledger-list">
        {entries.length ? (
          entries.map((entry) => (
            <div className={`ledger-entry ${entry.kind}`} key={entry.id}>
              <span>{entry.day === state.day ? "今天" : `第 ${entry.day} 天`}</span>
              <strong>{entry.title}</strong>
              <em>
                {entry.amount === undefined ? "非现金" : `${entry.amount > 0 ? "+" : ""}¥${entry.amount.toLocaleString("zh-CN")}`}
                {entry.probability ? ` · ${entry.probability}%` : ""}
              </em>
            </div>
          ))
        ) : (
          <p className="empty-ledger">未来两周账本暂时安静。安静本身不保证安全。</p>
        )}
      </div>
    </section>
  );
}
