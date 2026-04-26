import { useEffect, useMemo, useState } from "react";
import { StartScreen } from "./components/StartScreen";
import { GameScreen } from "./components/GameScreen";
import { EndingScreen } from "./components/EndingScreen";
import { normalizeGameState } from "./data/initialState";
import { newGame } from "./engine/gameReducer";
import { clearSave, loadGame, saveGame } from "./engine/storage";
import type { GameState } from "./engine/types";
import { enforceCriticalCollapse } from "./engine/critical";

export default function App() {
  const [state, setState] = useState<GameState | null>(() => {
    const saved = loadGame();
    return saved ? enforceCriticalCollapse(normalizeGameState(saved)) : null;
  });
  const hasExistingSave = useMemo(() => Boolean(loadGame()), [state]);

  useEffect(() => {
    if (state) saveGame(state);
  }, [state]);

  useEffect(() => {
    if (!state || state.endingId) return;
    const checked = enforceCriticalCollapse(state);
    if (checked.endingId) setState(checked);
  }, [state]);

  const startNew = () => {
    const fresh = newGame();
    clearSave();
    saveGame(fresh);
    setState(fresh);
  };

  const continueGame = () => {
    const saved = loadGame();
    if (saved) setState(enforceCriticalCollapse(normalizeGameState(saved)));
  };

  const restart = () => startNew();

  if (!state) {
    return <StartScreen hasSave={hasExistingSave} onStart={startNew} onContinue={continueGame} />;
  }

  if (state.endingId) {
    return <EndingScreen state={state} onRestart={restart} />;
  }

  return <GameScreen state={state} setState={setState} onRestart={restart} />;
}
