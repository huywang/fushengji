import { endings } from "../data/endings";
import { TOTAL_DAYS } from "../engine/calendar";
import type { GameState } from "../engine/types";

export function EndingScreen({ state, onRestart }: { state: GameState; onRestart: () => void }) {
  const ending = endings.find((item) => item.id === state.endingId) ?? endings[endings.length - 1];
  const collapseReason = typeof state.flags.collapse_reason === "string" ? state.flags.collapse_reason : "";
  const collapseStat = typeof state.flags.collapse_stat === "string" ? state.flags.collapse_stat : "";

  return (
    <main className="ending-screen">
      <section className="ending-copy">
        <p className="eyebrow">{state.day >= TOTAL_DAYS ? `第 ${TOTAL_DAYS} 天结局` : `第 ${state.day} 天崩溃`}</p>
        <h1>{ending.title}</h1>
        <p>{collapseReason ? `${collapseStat}触碰临界值。${collapseReason}` : ending.body}</p>
        <div className="ending-grid">
          <div>
            <h2>关键数值</h2>
            <ul>
              <li>可用现金：¥{state.player.availableCash.toLocaleString("zh-CN")}</li>
              <li>房贷压力：{state.player.mortgagePressure}</li>
              <li>父母健康：{state.player.parentHealth}</li>
              <li>家庭信任：{state.player.familyTrust}</li>
              <li>北京归属感：{state.player.beijingBelonging}</li>
              <li>社保连续性：{state.player.socialSecurityContinuity}</li>
            </ul>
          </div>
          <div>
            <h2>路线分数</h2>
            <ul>
              {Object.entries(state.routeScores).map(([key, value]) => (
                <li key={key}>{routeLabel(key)}：{value}</li>
              ))}
            </ul>
          </div>
        </div>
        <button className="primary" onClick={onRestart}>重新开始</button>
      </section>
    </main>
  );
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
