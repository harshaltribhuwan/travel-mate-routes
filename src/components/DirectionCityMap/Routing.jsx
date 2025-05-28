import React, { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
// import "../../styles/DirectionCityMap.scss";
import "./Routing.scss"

function Routing({
  waypoints,
  setDistance,
  setDuration,
  setAlternatives,
  routeControlRef,
  currentLocation,
}) {
  const map = useMap();
  const controlRef = useRef(null);
  const [activeRoute, setActiveRoute] = useState(null);
  const [hasAltRoute, setHasAltRoute] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);

const getManeuverIcon = (type) => {
  const normalizedType = type?.toLowerCase() || "";

  if (normalizedType.includes("right") && normalizedType.includes("sharp"))
    return "⇗";
  if (normalizedType.includes("right") && normalizedType.includes("slight"))
    return "↱";
  if (normalizedType.includes("right")) return "→";

  if (normalizedType.includes("left") && normalizedType.includes("sharp"))
    return "⇖";
  if (normalizedType.includes("left") && normalizedType.includes("slight"))
    return "↰";
  if (normalizedType.includes("left")) return "←";

  if (normalizedType.includes("uturn")) return "↩";
  if (
    normalizedType.includes("continue") ||
    normalizedType.includes("straight")
  )
    return "↑";
  if (normalizedType.includes("roundabout")) return "↻";
  if (normalizedType.includes("merge")) return "⇉";
  if (normalizedType.includes("ramp")) return "↘";
  if (normalizedType.includes("exit")) return "⤴";
  if (normalizedType.includes("destination")) return "🏁";

  return "→"; // default fallback
};


  // Helper: Get route roads
  const getRouteRoads = (instructions) => {
    const roads = new Set();
    for (const instr of instructions) {
      const text = instr.text.toLowerCase();
      const nhMatch = text.match(/nh\s*[-]?\d+/i);
      const shMatch = text.match(/sh\s*[-]?\d+/i);
      const expresswayMatch = text.includes("expressway");
      const roadNameMatch = text.match(/on\s+([a-z0-9\s-]+)(?:\s+|$)/i);

      if (nhMatch) roads.add(nhMatch[0].toUpperCase());
      if (shMatch) roads.add(shMatch[0].toUpperCase());
      if (expresswayMatch) roads.add("Expressway");
      if (roadNameMatch && roadNameMatch[1].length > 3) {
        roads.add(roadNameMatch[1].trim().replace(/\s+/g, " "));
      }
    }
    return Array.from(roads).slice(0, 3).join(", ") || "Main Roads";
  };

  
  useEffect(() => {
    if (
      currentLocation &&
      controlRef.current &&
      controlRef.current._routes &&
      controlRef.current._routes.length > 0 &&
      waypoints.every((wp) => wp.coords)
    ) {
      const routeIndex = activeRoute === "alt" && controlRef.current._routes.length > 1 ? 1 : 0;
      const currentRoute = controlRef.current._routes[routeIndex];
      const instructions = currentRoute?.instructions || [];
      const coordinates = currentRoute?.coordinates || [];
      let currentStep = -1;
      let minDistance = Infinity;

      instructions.forEach((instr, idx) => {
        const coord = coordinates[instr.index];
        if (coord) {
          const distance = L.latLng(currentLocation).distanceTo([coord.lat, coord.lng]);
          if (distance < minDistance && distance < 300) { // Within 300 meters
            minDistance = distance;
            currentStep = idx;
          }
        }
      });

      setCurrentStepIndex(currentStep);
    }
  }, [currentLocation, activeRoute, waypoints, controlRef.current]);

  // Setup routing control
  useEffect(() => {
    if (
      !map ||
      !waypoints ||
      waypoints.length < 2 ||
      !waypoints.every(
        (wp) => wp.coords && Array.isArray(wp.coords) && wp.coords.length === 2
      )
    ) {
      if (controlRef.current) {
        map.removeControl(controlRef.current);
        controlRef.current = null;
      }
      setDistance(null);
      setDuration(null);
      setAlternatives([]);
      clearRouteInstructions();
      return;
    }

    // Avoid recreating control if it already exists
    if (controlRef.current) {
      controlRef.current.setWaypoints(
        waypoints.map((wp) => L.latLng(wp.coords[0], wp.coords[1]))
      );
      return;
    }

    const control = L.Routing.control({
      waypoints: waypoints.map((wp) => L.latLng(wp.coords[0], wp.coords[1])),
      routeWhileDragging: true,
      showAlternatives: true,
      lineOptions: {
        styles: [{ color: "#1a73e8", opacity: 1, weight: 6 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
      altLineOptions: {
        styles: [{ color: "#757575", opacity: 0.6, weight: 5 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1",
        profile: "driving",
        alternatives: true,
        steps: true,
      }),
      createMarker: () => null,
      containerClassName: "leaflet-routing-container-hidden",
      show: false,
      collapsible: false,
    })
      .on("routesfound", (e) => {
        const routes = e.routes;
        if (routes[0]) {
          setDistance(routes[0].summary.totalDistance);
          setDuration(routes[0].summary.totalTime);
          setAlternatives(
            routes.map((r, idx) => ({
              index: idx,
              distance: r.summary.totalDistance,
              duration: r.summary.totalTime,
              coordinates: r.coordinates,
              instructions: r.instructions,
            }))
          );

          if (activeRoute === "primary") {
            showRouteInstructions("primary", routes[0]);
          } else if (activeRoute === "alt" && routes[1]) {
            showRouteInstructions("alt", routes[1]);
          } else {
            clearRouteInstructions();
          }

          setHasAltRoute(!!routes[1]);
        }
      })
      .addTo(map);

    controlRef.current = control;
    routeControlRef.current = control;

    return () => {
      if (controlRef.current) {
        map.removeControl(controlRef.current);
        controlRef.current = null;
      }
      clearRouteInstructions();
    };
  }, [map, waypoints, setDistance, setDuration, setAlternatives, activeRoute]);

  function showRouteInstructions(type, route) {
    let container = document.querySelector(".leaflet-routing-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "leaflet-routing-container";
      map.getContainer().appendChild(container);
    }
    container.style.display = "block";
    container.innerHTML = "";

    const distanceKm = (route.summary.totalDistance / 1000).toFixed(1);
    const roads = getRouteRoads(route.instructions);
    const totalSeconds = route.summary.totalTime;
    const durationText = totalSeconds < 3600
      ? `${Math.round(totalSeconds / 60)} min`
      : `${(totalSeconds / 3600).toFixed(2)} h`;

    const header = document.createElement("div");
    header.className = "popup-header";
    header.innerHTML = `<h3>${
      type === "primary" ? "Primary Route" : "Alternative Route"
    }</h3><p>${distanceKm} km, ${durationText} via ${roads}</p>`;
    container.appendChild(header);

    const instructionsDiv = document.createElement("div");
    instructionsDiv.className = "instructions-list";
    route.instructions.forEach((instr, idx) => {
      const div = document.createElement("div");
      div.className = `leaflet-routing-instruction leaflet-routing-instruction-text ${
        idx === currentStepIndex ? "current-step" : ""
      }`;
      const maneuverIcon = getManeuverIcon(instr.type);
      div.innerHTML = `<span class="maneuver-icon">${maneuverIcon}</span> ${instr.text} (${(instr.distance / 1000).toFixed(1)} km)`;
      div.onclick = (ev) => {
        ev.stopPropagation();
        const coord = route.coordinates[instr.index];
        if (coord) {
          map.panTo([coord.lat, coord.lng], { animate: true });
        }
      };
      instructionsDiv.appendChild(div);
    });
    container.appendChild(instructionsDiv);

    const closeBtn = document.createElement("button");
    closeBtn.className = "close-button";
    closeBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59L13.41 12z"/></svg>';
    closeBtn.onclick = () => {
      container.style.display = "none";
      setActiveRoute(null);
    };
    container.appendChild(closeBtn);
  }

  function clearRouteInstructions() {
    const container = document.querySelector(".leaflet-routing-container");
    if (container) {
      container.style.display = "none";
      container.innerHTML = "";
    }
  }

  return (
    <div className="route-toggle-buttons">
      <button
        onClick={() =>
          setActiveRoute(activeRoute === "primary" ? null : "primary")
        }
        disabled={!waypoints || waypoints.length < 2}
        aria-label={
          activeRoute === "primary"
            ? "Hide Primary Route"
            : "Show Primary Route"
        }
      >
        {activeRoute === "primary" ? "Hide Route" : "Primary Route"}
      </button>
      {hasAltRoute && (
        <button
          onClick={() => setActiveRoute(activeRoute === "alt" ? null : "alt")}
          disabled={!waypoints || waypoints.length < 2}
          aria-label={
            activeRoute === "alt"
              ? "Hide Alternative Route"
              : "Show Alternative Route"
          }
        >
          {activeRoute === "alt" ? "Hide Route" : "Alternative Route"}
        </button>
      )}
    </div>
  );
}

export default Routing;