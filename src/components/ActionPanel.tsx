import type { Effect, GameAction } from "../engine/types";

interface ActionPanelProps {
  actions: GameAction[];
  lockedActionCount: number;
  disabled: boolean;
  onAction: (actionId: string) => void;
}

export function ActionPanel({ actions, lockedActionCount, disabled, onAction }: ActionPanelProps) {
  return (
    <section className="action-panel">
      <div className="section-heading">
        <h2>可选行动</h2>
        <span>{lockedActionCount > 0 ? `${lockedActionCount} 个行动条件不足` : "所有行动可选"}</span>
      </div>
      <div className="action-list">
        {actions.map((action) => (
          <button className="action-card" key={action.id} disabled={disabled} onClick={() => onAction(action.id)}>
            <span className="action-title">{action.name}</span>
            <span className="action-desc">{action.description}</span>
            <span className="effect-line">{summarizeEffects(action.effects, action.routeScoreEffects)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function summarizeEffects(effects: Effect[], routeEffects?: GameAction["routeScoreEffects"]) {
  const pieces = effects
    .filter((effect) => effect.delta)
    .slice(0, 4)
    .map((effect) => `${label(effect.key)} ${signed(effect.delta ?? 0)}`);
  if (routeEffects) {
    const route = Object.entries(routeEffects)[0];
    if (route) pieces.push(`${routeLabel(route[0])} +${route[1]}`);
  }
  return pieces.join(" · ");
}

function signed(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function label(key: string) {
  const labels: Record<string, string> = {
    availableCash: "现金",
    cash: "总现金",
    stamina: "体力",
    emotion: "情绪",
    health: "健康",
    parentHealth: "父母健康",
    dignity: "体面",
    familyTrust: "家庭",
    spouseSafety: "安全感",
    childBond: "亲子",
    mortgagePressure: "房贷压力",
    socialSecurityContinuity: "社保",
    beijingBelonging: "归属感",
    commuteTolerance: "通勤",
    careerConfidence: "职业自信",
    anxiety: "焦虑",
    aiAnxiety: "AI 焦虑",
    shortVideoNumbness: "短视频",
    midlifeThickSkin: "厚脸皮",
    monthlyFixedCost: "固定支出",
    interview: "面试",
    freelance: "外包技能",
    selfMedia: "自媒体技能",
    cashflowManagement: "现金流",
  };
  return labels[key] ?? key;
}

function routeLabel(key: string) {
  const labels: Record<string, string> = {
    job: "求职路线",
    freelance: "外包路线",
    selfMedia: "自媒体路线",
    gig: "灵活路线",
    startup: "创业路线",
    familyRepair: "家庭修复",
    leaveBeijing: "离京路线",
    collapse: "崩溃路线",
  };
  return labels[key] ?? key;
}
