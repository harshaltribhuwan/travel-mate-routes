import React, { useState } from "react";
import DirectionCityMap from "./components/DirectionCityMap.jsx";
import "leaflet/dist/leaflet.css";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("map"); // "map" or "visa"

  return (
    <div className="App">
      {/* Navbar */}
      <DirectionCityMap />
      {/* <nav className="navbar">
        <ul className="nav-list">
          <li
            className={`nav-item ${activeTab === "map" ? "active" : ""}`}
            onClick={() => setActiveTab("map")}
          >
            Map
          </li>
          <li
            className={`nav-item ${activeTab === "visa" ? "active" : ""}`}
            onClick={() => setActiveTab("visa")}
          >
            Visa & Safety
          </li>
        </ul>
      </nav> */}

      {/* Content */}
      {/* <div className="content">
        {activeTab === "map" && <DirectionCityMap />}
        {activeTab === "visa" && <VisaSafetyChecker />}
      </div> */}
    </div>
  );
}
