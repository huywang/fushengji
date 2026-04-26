import type { Dispatch, SetStateAction } from "react";
import { actions } from "../data/actions";
import { locations } from "../data/locations";
import { getAvailableActions, performAction } from "../engine/actionResolver";
import { endDay, setLocation } from "../engine/gameReducer";
import { resolveEvent } from "../engine/eventResolver";
import type { GameState } from "../engine/types";
import { ActionPanel } from "./ActionPanel";
import { CrisisAgenda } from "./CrisisAgenda";
import { EventModal } from "./EventModal";
import { LogPanel } from "./LogPanel";
import { MapPanel } from "./MapPanel";
import { StatusPanel } from "./StatusPanel";

interface GameScreenProps {
  state: GameState;
  setState: Dispatch<SetStateAction<GameState | null>>;
  onRestart: () => void;
}

export function GameScreen({ state, setState, onRestart }: GameScreenProps) {
  const location = locations.find((item) => item.id === state.currentLocationId) ?? locations[0];
  const availableActions = getAvailableActions(state);
  const lockedActionCount = actions.filter((action) => action.locationId === state.currentLocationId).length - availableActions.length;

  return (
    <main className="game-shell">
      <StatusPanel state={state} />

      <section className="main-panel">
        <div className="day-card">
          <div>
            <p className="eyebrow">第 {state.day} 天 · {periodLabel(state.period)}</p>
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

        <div className="result-strip">
          <strong>最近结果</strong>
          <span>{state.lastEventResult ?? state.history[0]?.text ?? "选择行动后，这里会显示新的变化。"}</span>
        </div>

        <MapPanel
          locations={locations}
          currentLocationId={state.currentLocationId}
          disabled={Boolean(state.pendingEventId)}
          onSelect={(locationId) => setState(setLocation(state, locationId))}
        />

        <ActionPanel
          actions={availableActions}
          lockedActionCount={lockedActionCount}
          disabled={Boolean(state.pendingEventId) || state.actionPoints <= 0}
          onAction={(actionId) => setState(performAction(state, actionId))}
        />
      </section>

      <aside className="side-panel">
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
