import { cashRunwayDays, getStage, nextDeadline, pressureWarnings, TOTAL_DAYS } from "../engine/calendar";
import type { GameState } from "../engine/types";

export function CrisisAgenda({ state }: { state: GameState }) {
  const stage = getStage(state.day);
  const deadline = nextDeadline(state.day);
  const warnings = pressureWarnings(state);
  const progress = Math.min(100, Math.round((state.day / TOTAL_DAYS) * 100));

  return (
    <section className="crisis-agenda">
      <div className="agenda-main">
        <p className="eyebrow">{stage.title}</p>
        <h2>{stage.description}</h2>
        <div className="calendar-track" aria-label={`进度 ${progress}%`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="agenda-metrics">
          <Metric label="当前进度" value={`${state.day}/${TOTAL_DAYS} 天`} />
          <Metric label="下一压力点" value={`${deadline.label} · ${deadline.daysLeft} 天`} />
          <Metric label="现金续航" value={`${cashRunwayDays(state)} 天`} />
        </div>
      </div>
      <div className="agenda-warnings">
        <h3>今日压力</h3>
        {warnings.length ? (
          warnings.map((warning) => <span key={warning}>{warning}</span>)
        ) : (
          <span>暂时没有新警报。通常这本身就值得怀疑。</span>
        )}
      </div>
      <div className="day-rhythm">
        {["上午", "下午", "晚上"].map((label, index) => {
          const used = 3 - state.actionPoints;
          return (
            <span className={index < used ? "used" : index === used ? "active" : ""} key={label}>
              {label}
            </span>
          );
        })}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
