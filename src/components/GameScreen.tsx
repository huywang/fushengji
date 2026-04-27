import { useState, type Dispatch, type SetStateAction } from "react";
import { locations } from "../data/locations";
import { getLocationActionOptions, performAction } from "../engine/actionResolver";
import { dayOfWeekLabel } from "../engine/calendar";
import { endDay, setLocation } from "../engine/gameReducer";
import { getOpportunityOptions, performOpportunity } from "../engine/opportunityResolver";
import { resolveEvent } from "../engine/eventResolver";
import type { GameState } from "../engine/types";
import { ActionPanel } from "./ActionPanel";
import { CrisisAgenda } from "./CrisisAgenda";
import { EventModal } from "./EventModal";
import { LedgerPanel } from "./LedgerPanel";
import { LogPanel } from "./LogPanel";
import { MapPanel } from "./MapPanel";
import { OpportunityMarket } from "./OpportunityMarket";
import { StatusPanel } from "./StatusPanel";

interface GameScreenProps {
  state: GameState;
  setState: Dispatch<SetStateAction<GameState | null>>;
  onRestart: () => void;
}

type MobileTab = "inbox" | "radar" | "city" | "status" | "log";

export function GameScreen({ state, setState, onRestart }: GameScreenProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>("inbox");
  const location = locations.find((item) => item.id === state.currentLocationId) ?? locations[0];
  const actionOptions = getLocationActionOptions(state);
  const opportunityOptions = getOpportunityOptions(state);
  const lockedActionCount = actionOptions.filter((option) => !option.available).length;
  const actionDisabled = Boolean(state.pendingEventId) || state.actionPoints <= 0;
  const endCurrentDay = () => setState(endDay(state));
  const chooseLocation = (locationId: string) => setState(setLocation(state, locationId));
  const takeOpportunity = (cardId: string) => setState(performOpportunity(state, cardId));
  const takeAction = (actionId: string) => setState(performAction(state, actionId));

  return (
    <>
      <main className="game-shell desktop-game-shell">
        <StatusPanel state={state} />

        <section className="main-panel">
          <div className="day-card">
            <div>
              <p className="eyebrow">第 {state.day} 天 · {dayOfWeekLabel(state.day)} · {periodLabel(state.period)}</p>
              <h1>{location.name}</h1>
              <p>{location.description}</p>
            </div>
            <div className="top-actions">
              <button onClick={endCurrentDay} disabled={Boolean(state.pendingEventId)}>
                结束当天
              </button>
              <button className="ghost" onClick={onRestart}>重开</button>
            </div>
          </div>

          <CrisisAgenda state={state} />

          <section className="interaction-stage">
            <OpportunityMarket
              state={state}
              options={opportunityOptions}
              disabled={actionDisabled}
              onTake={takeOpportunity}
            />

            <div className="city-ops">
              <ResultStrip state={state} />

              <MapPanel
                locations={locations}
                currentLocationId={state.currentLocationId}
                disabled={Boolean(state.pendingEventId)}
                onSelect={chooseLocation}
              />

              <ActionPanel
                options={actionOptions}
                lockedActionCount={lockedActionCount}
                disabled={actionDisabled}
                onAction={takeAction}
              />
            </div>
          </section>
        </section>

        <aside className="side-panel">
          <LedgerPanel state={state} />
          <LogPanel entries={state.history} />
        </aside>
      </main>

      <main className="mobile-game-shell">
        <header className="mobile-topbar">
          <div>
            <p className="eyebrow">第 {state.day} 天 · {dayOfWeekLabel(state.day)} · {periodLabel(state.period)}</p>
            <h1>{location.name}</h1>
          </div>
          <strong>{state.actionPoints}/3</strong>
        </header>

        <div className="mobile-command-row">
          <button onClick={endCurrentDay} disabled={Boolean(state.pendingEventId)}>结束当天</button>
          <button className="ghost" onClick={onRestart}>重开</button>
        </div>

        <div className="mobile-vitals" aria-label="关键状态">
          <Vital label="现金" value={`¥${state.player.availableCash.toLocaleString("zh-CN")}`} tone={state.player.availableCash <= state.player.monthlyMortgage ? "danger" : "safe"} />
          <Vital label="房贷" value={state.player.mortgagePressure} tone={state.player.mortgagePressure >= 80 ? "danger" : "warn"} />
          <Vital label="情绪" value={state.player.emotion} tone={state.player.emotion <= 30 ? "danger" : "safe"} />
          <Vital label="体力" value={state.player.stamina} tone={state.player.stamina <= 30 ? "danger" : "safe"} />
        </div>

        <section className="mobile-tab-panel">
          {mobileTab === "inbox" && (
            <>
              <CrisisAgenda state={state} />
              <OpportunityMarket
                state={state}
                options={opportunityOptions}
                disabled={actionDisabled}
                onTake={takeOpportunity}
              />
            </>
          )}
          {mobileTab === "radar" && <LedgerPanel state={state} />}
          {mobileTab === "city" && (
            <>
              <ResultStrip state={state} />
              <MapPanel
                locations={locations}
                currentLocationId={state.currentLocationId}
                disabled={Boolean(state.pendingEventId)}
                onSelect={chooseLocation}
              />
              <ActionPanel
                options={actionOptions}
                lockedActionCount={lockedActionCount}
                disabled={actionDisabled}
                onAction={takeAction}
              />
            </>
          )}
          {mobileTab === "status" && <StatusPanel state={state} />}
          {mobileTab === "log" && <LogPanel entries={state.history} />}
        </section>

        <nav className="mobile-tabbar" aria-label="主导航">
          <TabButton current={mobileTab} id="inbox" label="消息" onSelect={setMobileTab} />
          <TabButton current={mobileTab} id="radar" label="雷区" onSelect={setMobileTab} />
          <TabButton current={mobileTab} id="city" label="城市" onSelect={setMobileTab} />
          <TabButton current={mobileTab} id="status" label="状态" onSelect={setMobileTab} />
          <TabButton current={mobileTab} id="log" label="日志" onSelect={setMobileTab} />
        </nav>
      </main>

      <EventModal
        state={state}
        onChoose={(optionId) => setState(resolveEvent(state, optionId))}
      />
    </>
  );
}

function periodLabel(period: GameState["period"]) {
  return period === "morning" ? "上午" : period === "afternoon" ? "下午" : "晚上";
}

function ResultStrip({ state }: { state: GameState }) {
  return (
    <div className="result-strip">
      <strong>刚刚发生</strong>
      <span>{state.lastEventResult ?? state.history[0]?.text ?? "选择行动后，这里会显示新的变化。"}</span>
    </div>
  );
}

function Vital({ label, value, tone }: { label: string; value: string | number; tone: "safe" | "warn" | "danger" }) {
  return (
    <div className={`mobile-vital ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TabButton({
  current,
  id,
  label,
  onSelect,
}: {
  current: MobileTab;
  id: MobileTab;
  label: string;
  onSelect: (tab: MobileTab) => void;
}) {
  return (
    <button className={current === id ? "active" : ""} onClick={() => onSelect(id)}>
      {label}
    </button>
  );
}
