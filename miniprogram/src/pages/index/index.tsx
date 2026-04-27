import { useEffect, useMemo, useState } from "react";
import Taro from "@tarojs/taro";
import { Button, ScrollView, Text, View } from "@tarojs/components";
import { locations } from "@game/data/locations";
import { normalizeGameState } from "@game/data/initialState";
import { getLocationActionOptions, performAction } from "@game/engine/actionResolver";
import { dayOfWeekLabel, nextDeadline } from "@game/engine/calendar";
import { enforceCriticalCollapse } from "@game/engine/critical";
import { getEvent, resolveEvent } from "@game/engine/eventResolver";
import { endDay, newGame, setLocation } from "@game/engine/gameReducer";
import { getLedgerEntries, projectedCashAfterLedger } from "@game/engine/ledger";
import { getOpportunityOptions, performOpportunity } from "@game/engine/opportunityResolver";
import type { EventOption, GameState, OpportunitySource } from "@game/engine/types";
import "./index.css";

type TabKey = "inbox" | "radar" | "city" | "status" | "log";

const STORAGE_KEY = "fushengji_miniprogram_save_v1";

export default function IndexPage() {
  const [state, setState] = useState<GameState | null>(() => loadGame());
  const [tab, setTab] = useState<TabKey>("inbox");

  useEffect(() => {
    if (state) Taro.setStorageSync(STORAGE_KEY, state);
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const safeState = enforceCriticalCollapse(state);
    if (safeState !== state) setState(safeState);
  }, [state]);

  if (!state) {
    return <StartView onStart={() => setState(newGame())} onContinue={() => setState(loadGame())} hasSave={Boolean(Taro.getStorageSync(STORAGE_KEY))} />;
  }

  return (
    <View className="page">
      <Header state={state} onEndDay={() => setState(endDay(state))} onRestart={() => setState(newGame())} />
      <Vitals state={state} />

      <ScrollView className="content" scrollY enhanced showScrollbar={false}>
        {tab === "inbox" && <InboxView state={state} setState={setState} />}
        {tab === "radar" && <RadarView state={state} />}
        {tab === "city" && <CityView state={state} setState={setState} />}
        {tab === "status" && <StatusView state={state} />}
        {tab === "log" && <LogView state={state} />}
      </ScrollView>

      <Tabbar current={tab} onChange={setTab} />
      <EventOverlay state={state} setState={setState} />
    </View>
  );
}

function loadGame(): GameState | null {
  try {
    const saved = Taro.getStorageSync(STORAGE_KEY) as GameState | "";
    return saved ? enforceCriticalCollapse(normalizeGameState(saved)) : null;
  } catch {
    return null;
  }
}

function StartView({ hasSave, onContinue, onStart }: { hasSave: boolean; onContinue: () => void; onStart: () => void }) {
  return (
    <View className="start-page">
      <View className="start-card">
        <Text className="eyebrow">60 天文字策略生存游戏</Text>
        <Text className="start-title">北京浮生记：中年优化</Text>
        <Text className="start-copy">39 岁，望京被裁。房贷、社保、父母健康和孩子作业同时开始推送。</Text>
        <View className="start-actions">
          <Button className="primary" onClick={onStart}>开始新游戏</Button>
          <Button disabled={!hasSave} onClick={onContinue}>继续游戏</Button>
        </View>
      </View>
    </View>
  );
}

function Header({ state, onEndDay, onRestart }: { state: GameState; onEndDay: () => void; onRestart: () => void }) {
  const location = locations.find((item) => item.id === state.currentLocationId) ?? locations[0];
  return (
    <View className="top-card">
      <View>
        <Text className="eyebrow">第 {state.day} 天 · {dayOfWeekLabel(state.day)} · {periodLabel(state.period)}</Text>
        <Text className="location-title">{location.name}</Text>
      </View>
      <Text className="ap-pill">{state.actionPoints}/3</Text>
      <View className="top-actions">
        <Button disabled={Boolean(state.pendingEventId)} onClick={onEndDay}>结束当天</Button>
        <Button onClick={onRestart}>重开</Button>
      </View>
    </View>
  );
}

function Vitals({ state }: { state: GameState }) {
  return (
    <View className="vitals">
      <Vital label="现金" value={`¥${state.player.availableCash.toLocaleString("zh-CN")}`} tone={state.player.availableCash < state.player.monthlyMortgage ? "danger" : "safe"} />
      <Vital label="房贷" value={state.player.mortgagePressure} tone={state.player.mortgagePressure >= 80 ? "danger" : "warn"} />
      <Vital label="情绪" value={state.player.emotion} tone={state.player.emotion <= 30 ? "danger" : "safe"} />
      <Vital label="体力" value={state.player.stamina} tone={state.player.stamina <= 30 ? "danger" : "safe"} />
    </View>
  );
}

function Vital({ label, tone, value }: { label: string; tone: "safe" | "warn" | "danger"; value: string | number }) {
  return (
    <View className={`vital ${tone}`}>
      <Text>{label}</Text>
      <Text className="vital-value">{value}</Text>
    </View>
  );
}

function InboxView({ state, setState }: { state: GameState; setState: (state: GameState) => void }) {
  const options = getOpportunityOptions(state);
  const deadline = nextDeadline(state.day);
  const disabled = Boolean(state.pendingEventId) || state.actionPoints <= 0;
  return (
    <View className="stack">
      <View className="crisis-card">
        <Text className="eyebrow">今日压力</Text>
        <Text className="crisis-title">{deadline.label} · {deadline.daysLeft} 天</Text>
        <Text className="muted">现金续航、尾款和家庭消息会一起改变今天的优先级。</Text>
      </View>
      <View className="phone-panel">
        <View className="phone-header">
          <Text className="eyebrow">手机消息流</Text>
          <Text className="badge">{options.length}</Text>
        </View>
        <SystemAlert state={state} />
        {options.map(({ card, available, daysLeft, reason }) => (
          <Button className={`message-card risk-${card.riskLevel}`} disabled={disabled || !available} key={card.id} onClick={() => setState(performOpportunity(state, card.id))}>
            <View className="message-meta">
              <Text>{appName(card.source)}</Text>
              <Text>{daysLeft === 0 ? "今天过期" : `${daysLeft} 天后过期`}</Text>
            </View>
            <Text className="message-title">{card.title}</Text>
            <Text className="message-body">{card.description}</Text>
            <View className="deal-row">
              <Text>{card.rewardLabel}</Text>
              <Text>{card.costLabel}</Text>
            </View>
            <Text className="muted">{available ? `风险 ${card.riskLevel}/5` : reason}</Text>
          </Button>
        ))}
      </View>
    </View>
  );
}

function SystemAlert({ state }: { state: GameState }) {
  if (state.player.mortgagePressure < 70 && state.player.familyTrust >= 55) return null;
  return (
    <View className="system-alert">
      <Text className="eyebrow">银行短信</Text>
      <Text className="message-title">贷款扣款提醒</Text>
      <Text className="message-body">本月房贷很快要扣。银行的温柔，是把刀磨得很准时。</Text>
    </View>
  );
}

function RadarView({ state }: { state: GameState }) {
  const entries = getLedgerEntries(state);
  const projected = projectedCashAfterLedger(state, entries);
  const days = Array.from({ length: 15 }, (_, index) => state.day + index);
  return (
    <View className="panel">
      <View className="section-heading">
        <Text className="section-title">14 天雷区</Text>
        <Text>保守账后现金 ¥{projected.toLocaleString("zh-CN")}</Text>
      </View>
      <View className="radar-grid">
        {days.map((day) => {
          const count = entries.filter((entry) => entry.day === day).length;
          return (
            <View className={count ? "radar-day active" : "radar-day"} key={day}>
              <Text>{day === state.day ? "今" : day}</Text>
              <Text>{count || ""}</Text>
            </View>
          );
        })}
      </View>
      {entries.map((entry) => (
        <View className={`ledger-entry ${entry.kind}`} key={entry.id}>
          <Text>{entry.day === state.day ? "今天" : `第 ${entry.day} 天`}</Text>
          <Text className="ledger-title">{entry.title}</Text>
          <Text>{entry.amount === undefined ? "非现金" : `${entry.amount > 0 ? "+" : ""}¥${entry.amount.toLocaleString("zh-CN")}`}{entry.probability ? ` · ${entry.probability}%` : ""}</Text>
        </View>
      ))}
    </View>
  );
}

function CityView({ state, setState }: { state: GameState; setState: (state: GameState) => void }) {
  const actionOptions = getLocationActionOptions(state);
  const disabled = Boolean(state.pendingEventId) || state.actionPoints <= 0;
  return (
    <View className="stack">
      <View className="panel">
        <Text className="section-title">北京地图</Text>
        <View className="location-grid">
          {locations.map((location) => (
            <Button className={location.id === state.currentLocationId ? "location active" : "location"} disabled={Boolean(state.pendingEventId)} key={location.id} onClick={() => setState(setLocation(state, location.id))}>
              <Text>{location.name}</Text>
              <Text className="muted">{location.tags.join(" / ")}</Text>
            </Button>
          ))}
        </View>
      </View>
      <View className="panel">
        <Text className="section-title">可选行动</Text>
        {actionOptions.map(({ action, available, reason }) => (
          <Button className="action-card" disabled={disabled || !available} key={action.id} onClick={() => setState(performAction(state, action.id))}>
            <Text className="message-title">{action.name}</Text>
            <Text className="message-body">{action.description}</Text>
            {!available && <Text className="danger-text">{reason}</Text>}
          </Button>
        ))}
      </View>
    </View>
  );
}

function StatusView({ state }: { state: GameState }) {
  const items = [
    ["房贷压力", state.player.mortgagePressure],
    ["健康", state.player.health],
    ["父母健康", state.player.parentHealth],
    ["家庭信任", state.player.familyTrust],
    ["体面", state.player.dignity],
    ["社保连续性", state.player.socialSecurityContinuity],
    ["北京归属感", state.player.beijingBelonging],
  ] as const;
  return (
    <View className="panel">
      <Text className="section-title">状态</Text>
      {items.map(([label, value]) => (
        <View className="status-row" key={label}>
          <Text>{label}</Text>
          <Text>{value}</Text>
        </View>
      ))}
      <Text className="section-title space-top">路线倾向</Text>
      {Object.entries(state.routeScores).map(([key, value]) => (
        <View className="status-row" key={key}>
          <Text>{routeLabel(key)}</Text>
          <Text>{value}</Text>
        </View>
      ))}
    </View>
  );
}

function LogView({ state }: { state: GameState }) {
  return (
    <View className="panel">
      <Text className="section-title">日志</Text>
      {state.history.map((entry) => (
        <View className="log-entry" key={entry.id}>
          <Text>第 {entry.day} 天 · {entry.title}</Text>
          <Text className="message-body">{entry.text}</Text>
        </View>
      ))}
    </View>
  );
}

function EventOverlay({ state, setState }: { state: GameState; setState: (state: GameState) => void }) {
  const event = useMemo(() => getEvent(state.pendingEventId), [state.pendingEventId]);
  if (!event) return null;
  return (
    <View className="overlay">
      <View className="event-card">
        <Text className="eyebrow">事件卡</Text>
        <Text className="event-title">{event.title}</Text>
        <Text className="event-body">{event.body}</Text>
        {event.options.map((option: EventOption) => (
          <Button className="event-option" key={option.id} onClick={() => setState(resolveEvent(state, option.id))}>{option.text}</Button>
        ))}
      </View>
    </View>
  );
}

function Tabbar({ current, onChange }: { current: TabKey; onChange: (tab: TabKey) => void }) {
  const tabs: [TabKey, string][] = [["inbox", "消息"], ["radar", "雷区"], ["city", "城市"], ["status", "状态"], ["log", "日志"]];
  return (
    <View className="tabbar">
      {tabs.map(([key, label]) => (
        <Button className={current === key ? "active" : ""} key={key} onClick={() => onChange(key)}>{label}</Button>
      ))}
    </View>
  );
}

function periodLabel(period: GameState["period"]) {
  return period === "morning" ? "上午" : period === "afternoon" ? "下午" : "晚上";
}

function appName(source: OpportunitySource) {
  const labels: Record<OpportunitySource, string> = {
    asset: "闲鱼",
    family: "家庭群",
    freelance: "微信",
    gig: "司机端",
    job: "Boss直聘",
    policy: "北京人社",
    selfMedia: "短视频",
    trade: "闲鱼",
    trap: "银行App",
  };
  return labels[source];
}

function routeLabel(key: string) {
  const labels: Record<string, string> = {
    collapse: "崩溃",
    familyRepair: "家庭修复",
    freelance: "外包",
    gig: "灵活就业",
    job: "求职",
    leaveBeijing: "离京",
    selfMedia: "自媒体",
    startup: "创业",
  };
  return labels[key] ?? key;
}
