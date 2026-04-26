import { getEvent } from "../engine/eventResolver";
import { meetsRequirements } from "../engine/effects";
import type { GameState } from "../engine/types";

interface EventModalProps {
  state: GameState;
  onChoose: (optionId: string) => void;
}

export function EventModal({ state, onChoose }: EventModalProps) {
  const event = getEvent(state.pendingEventId);
  if (!event) return null;

  return (
    <div className="modal-backdrop">
      <article className="event-modal">
        <p className="eyebrow">事件卡</p>
        <h2>{event.title}</h2>
        <p className="event-body">{event.body}</p>
        <div className="event-options">
          {event.options.map((option) => (
            <button
              key={option.id}
              onClick={() => onChoose(option.id)}
              disabled={!meetsRequirements(state, option.requirements)}
            >
              {option.text}
            </button>
          ))}
        </div>
      </article>
    </div>
  );
}
