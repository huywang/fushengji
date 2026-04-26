import type { Location } from "../engine/types";

interface MapPanelProps {
  locations: Location[];
  currentLocationId: string;
  disabled: boolean;
  onSelect: (locationId: string) => void;
}

export function MapPanel({ locations, currentLocationId, disabled, onSelect }: MapPanelProps) {
  return (
    <section className="map-panel">
      <div className="section-heading">
        <h2>北京地图</h2>
        <span>选择地点查看行动</span>
      </div>
      <div className="location-grid">
        {locations.map((location) => (
          <button
            key={location.id}
            className={location.id === currentLocationId ? "location active" : "location"}
            disabled={disabled}
            onClick={() => onSelect(location.id)}
          >
            <strong>{location.name.split("：")[0]}</strong>
            <small>{location.tags.join(" / ")}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
