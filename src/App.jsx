import React from "react";
import DirectionCityMap from "./components/DirectionCityMap/DirectionCityMap.jsx";
import "leaflet/dist/leaflet.css";
import "./App.scss";

export default function App() {
  return (
    <div className="App">
      <DirectionCityMap />
    </div>
  );
}
