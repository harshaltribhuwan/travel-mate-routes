import React, { useEffect } from "react";
import { FaSatelliteDish } from "react-icons/fa";
import { MdMap, MdWbSunny, MdNightsStay } from "react-icons/md";
import "./TileLayerSwitcher.scss";

const iconMap = {
  "Classic Street": <MdMap size={22} />,
  "Standard View": <MdWbSunny size={22} />,
  "Satellite View": <FaSatelliteDish size={22} />,
  "Dark Mode": <MdNightsStay size={22} />,
};

function TileLayerSwitcher({
  tileLayers,
  currentTileLayer,
  setCurrentTileLayer,
}) {
useEffect(() => {
  const stored = localStorage.getItem("preferredTileLayer");
  if (stored && tileLayers[stored]) {
    setCurrentTileLayer(stored);
  } else {
    setCurrentTileLayer("Classic Street"); // your new default
  }
}, []);


  const handleSelect = (key) => {
    setCurrentTileLayer(key);
    localStorage.setItem("preferredTileLayer", key);
  };

  return (
    <nav className="tile-layer-switcher" aria-label="Map layer selector">
      {Object.keys(tileLayers).map((key) => (
        <button
          key={key}
          onClick={() => handleSelect(key)}
          className={`tile-option ${currentTileLayer === key ? "active" : ""}`}
          title={tileLayers[key].name}
          type="button"
          aria-pressed={currentTileLayer === key}
        >
          <span className="icon">{iconMap[key]}</span>
        </button>
      ))}
    </nav>
  );
}

export default TileLayerSwitcher;
