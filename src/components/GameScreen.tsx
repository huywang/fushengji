import type { Dispatch, SetStateAction } from "react";
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

export function GameScreen({ state, setState, onRestart }: GameScreenProps) {
  const location = locations.find((item) => item.id === state.currentLocationId) ?? locations[0];
  const actionOptions = getLocationActionOptions(state);
  const opportunityOptions = getOpportunityOptions(state);
  const lockedActionCount = actionOptions.filter((option) => !option.available).length;

  return (
    <main className="game-shell">
      <StatusPanel state={state} />

      <section className="main-panel">
        <div className="day-card">
          <div>
            <p className="eyebrow">第 {state.day} 天 · {dayOfWeekLabel(state.day)} · {periodLabel(state.period)}</p>
            <h1>{location.name}</h1>
            <p>{location.description}</p>
          </div>
          <div className="top-actions">
            <button onClick={() => setState(endDay(state))} disabled={Boolean(state.pendingEventId)}>
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
            disabled={Boolean(state.pendingEventId) || state.actionPoints <= 0}
            onTake={(cardId) => setState(performOpportunity(state, cardId))}
          />

          <div className="city-ops">
            <div className="result-strip">
              <strong>刚刚发生</strong>
              <span>{state.lastEventResult ?? state.history[0]?.text ?? "选择行动后，这里会显示新的变化。"}</span>
            </div>

            <MapPanel
              locations={locations}
              currentLocationId={state.currentLocationId}
              disabled={Boolean(state.pendingEventId)}
              onSelect={(locationId) => setState(setLocation(state, locationId))}
            />

            <ActionPanel
              options={actionOptions}
              lockedActionCount={lockedActionCount}
              disabled={Boolean(state.pendingEventId) || state.actionPoints <= 0}
              onAction={(actionId) => setState(performAction(state, actionId))}
            />
          </div>
        </section>
      </section>

      <aside className="side-panel">
        <LedgerPanel state={state} />
        <LogPanel entries={state.history} />
      </aside>

      <EventModal
        state={state}
        onChoose={(optionId) => setState(resolveEvent(state, optionId))}
      />
    </main>
  );
}

function periodLabel(period: GameState["period"]) {
  return period === "morning" ? "上午" : period === "afternoon" ? "下午" : "晚上";
}
