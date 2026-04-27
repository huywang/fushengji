import type { Effect, OpportunityCard, OpportunityOutcome } from "../engine/types";
import type { OpportunityOption } from "../engine/opportunityResolver";
import type { GameState } from "../engine/types";

interface OpportunityMarketProps {
  state: GameState;
  options: OpportunityOption[];
  disabled: boolean;
  onTake: (cardId: string) => void;
}

export function OpportunityMarket({ state, options, disabled, onTake }: OpportunityMarketProps) {
  const alerts = buildSystemAlerts(state);

  return (
    <section className="opportunity-panel">
      <div className="phone-shell">
        <div className="phone-status">
          <span>09:{String(20 + state.day).slice(-2)}</span>
          <span>生活模式</span>
        </div>
        <div className="phone-header">
          <div>
            <p className="eyebrow">手机消息流</p>
            <h2>今天先处理哪条？</h2>
          </div>
          <span className="unread-count">{options.length + alerts.length}</span>
        </div>
        <div className="system-alerts">
          {alerts.map((alert) => (
            <div className={`system-alert ${alert.tone}`} key={alert.title}>
              <span>{alert.app}</span>
              <strong>{alert.title}</strong>
              <p>{alert.body}</p>
            </div>
          ))}
        </div>
        <div className="opportunity-list">
          {options.map(({ card, available, reason, daysLeft }) => (
            <button
              className={`opportunity-card risk-${card.riskLevel}${available ? "" : " locked"}`}
              disabled={disabled || !available}
              key={card.id}
              onClick={() => onTake(card.id)}
            >
              <span className="message-topline">
                <span className="app-badge">{appName(card.source)}</span>
                <span>{daysLeft === 0 ? "今天过期" : `${daysLeft} 天后过期`}</span>
              </span>
              <span className="opportunity-title">{card.title}</span>
              <span className="action-desc">{card.description}</span>
              <span className="opportunity-flavor">{card.flavor}</span>
              <span className="deal-line">
                <strong>{card.rewardLabel}</strong>
                <span>{card.costLabel}</span>
              </span>
              <span className="message-footer">
                <span>{sourceLabel(card.source)}</span>
                <span>风险 {card.riskLevel}/5</span>
                <span>{card.outcomes ? summarizeOutcomes(card.outcomes) : summarizeEffects(card.effects, card.routeScoreEffects)}</span>
              </span>
              {!available && <span className="locked-reason">{reason}</span>}
            </button>
          ))}
        </div>
        {!options.length && (
          <p className="empty-inbox">今天没有像样机会。手机越安静，越像在憋一条坏消息。</p>
        )}
      </div>
    </section>
  );
}

interface SystemAlert {
  app: string;
  title: string;
  body: string;
  tone: "danger" | "warning" | "quiet";
}

function buildSystemAlerts(state: GameState): SystemAlert[] {
  const alerts: SystemAlert[] = [];
  if (state.player.mortgagePressure >= 70) {
    alerts.push({
      app: "银行短信",
      title: "贷款扣款提醒",
      body: "本月房贷很快要扣。银行的温柔，是把刀磨得很准时。",
      tone: "danger",
    });
  }
  if (state.player.parentHealth < 62) {
    alerts.push({
      app: "家庭群",
      title: "爸妈说不用管",
      body: "这句话通常不代表没事，只代表他们不想让你多花钱。",
      tone: "warning",
    });
  }
  if (state.player.socialSecurityContinuity < 90) {
    alerts.push({
      app: "北京人社",
      title: "社保连续性下降",
      body: "安全感不一定能买到，但断缴提醒一定会发到。",
      tone: "warning",
    });
  }
  if (state.player.familyTrust < 55) {
    alerts.push({
      app: "微信",
      title: "伴侣正在输入...",
      body: "三个点闪了很久。成年人都知道，这比长消息更吓人。",
      tone: "danger",
    });
  }
  return alerts.slice(0, 3);
}

function summarizeOutcomes(outcomes: OpportunityOutcome[]) {
  return outcomes.map((outcome) => outcome.label).join(" / ");
}

function summarizeEffects(effects: Effect[], routeEffects?: OpportunityCard["routeScoreEffects"]) {
  const pieces = effects
    .filter((effect) => effect.delta)
    .slice(0, 4)
    .map((effect) => effect.type === "receivable"
      ? `应收尾款 ¥${(effect.delta ?? 0).toLocaleString("zh-CN")} / ${effect.probability ?? 60}%`
      : `${label(effect.key)} ${signed(effect.delta ?? 0)}`);
  if (routeEffects) {
    const route = Object.entries(routeEffects)[0];
    if (route) pieces.push(`${routeLabel(route[0])} +${route[1]}`);
  }
  return pieces.join(" · ");
}

function signed(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function sourceLabel(source: OpportunityCard["source"]) {
  const labels: Record<OpportunityCard["source"], string> = {
    job: "求职",
    freelance: "外包",
    trade: "倒卖",
    family: "家庭",
    policy: "政策",
    gig: "零工",
    selfMedia: "流量",
    asset: "资产",
    trap: "陷阱",
  };
  return labels[source];
}

function appName(source: OpportunityCard["source"]) {
  const labels: Record<OpportunityCard["source"], string> = {
    job: "Boss直聘",
    freelance: "微信",
    trade: "闲鱼",
    family: "家庭群",
    policy: "北京人社",
    gig: "司机端",
    selfMedia: "短视频",
    asset: "贝壳/闲鱼",
    trap: "银行App",
  };
  return labels[source];
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
    mortgagePressure: "房贷压力",
    socialSecurityContinuity: "社保",
    beijingBelonging: "归属感",
    careerConfidence: "职业自信",
    anxiety: "焦虑",
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
