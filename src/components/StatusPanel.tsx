import type { GameState } from "../engine/types";
import { criticalLabel, getCriticalRule, isCritical } from "../engine/critical";

const statusItems = [
  ["availableCash", "可用现金", "cash"],
  ["mortgagePressure", "房贷压力", "risk"],
  ["emotion", "情绪", "good"],
  ["stamina", "体力", "good"],
  ["health", "健康", "good"],
  ["parentHealth", "父母健康", "good"],
  ["familyTrust", "家庭信任", "good"],
  ["dignity", "体面", "good"],
  ["beijingBelonging", "北京归属感", "good"],
  ["socialSecurityContinuity", "社保连续性", "good"],
] as const;

export function StatusPanel({ state }: { state: GameState }) {
  return (
    <aside className="status-panel">
      <div className="identity">
        <span>李向前 · 39 岁</span>
        <strong>行动点 {state.actionPoints}/3</strong>
      </div>
      <div className="status-list">
        {statusItems.map(([key, label, type]) => {
          const value = Number(state.player[key]);
          const rule = getCriticalRule(key);
          return (
            <div className={rule && isCritical(value, rule) ? "status-row critical" : "status-row"} key={key}>
              <div>
                <span>{label}</span>
                <strong>{type === "cash" ? currency(value) : value}</strong>
              </div>
              {type !== "cash" && (
                <div className="meter">
                  <span className={statusClass(value, type, rule)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
                </div>
              )}
              {rule && <small className="critical-hint">{criticalLabel(rule)}</small>}
            </div>
          );
        })}
      </div>
      <div className="route-block">
        <h2>路线倾向</h2>
        {Object.entries(state.routeScores).map(([key, value]) => (
          <div className="route-row" key={key}>
            <span>{routeLabel(key)}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </aside>
  );
}

function currency(value: number) {
  return `¥${value.toLocaleString("zh-CN")}`;
}

function statusClass(value: number, type: "risk" | "good", rule?: ReturnType<typeof getCriticalRule>) {
  if (rule) {
    if (isCritical(value, rule)) return "danger";
    if (rule.direction === "min" && value <= rule.limit + 20) return "warning";
    if (rule.direction === "max" && value >= rule.limit - 20) return "warning";
    return "safe";
  }
  if (value <= 25) return "danger";
  if (value <= 50) return "warning";
  return "safe";
}

function routeLabel(key: string) {
  const labels: Record<string, string> = {
    job: "求职",
    freelance: "外包",
    selfMedia: "自媒体",
    gig: "灵活就业",
    startup: "创业",
    familyRepair: "家庭修复",
    leaveBeijing: "离京",
    collapse: "崩溃",
  };
  return labels[key] ?? key;
}
