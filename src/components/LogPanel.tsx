import type { LogEntry } from "../engine/types";

export function LogPanel({ entries }: { entries: LogEntry[] }) {
  return (
    <section className="log-panel">
      <div className="section-heading">
        <h2>日志</h2>
        <span>最近 {entries.length} 条</span>
      </div>
      <div className="log-list">
        {entries.map((entry) => (
          <article className={`log-entry ${entry.kind}`} key={entry.id}>
            <span>第 {entry.day} 天 · {entry.title}</span>
            <p>{entry.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
