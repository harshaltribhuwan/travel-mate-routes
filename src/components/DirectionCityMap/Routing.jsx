import React, { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";

function Routing({ waypoints, setDistance, setDuration, setAlternatives }) {
  const map = useMap();
  const controlRef = useRef(null);

  // State for showing/hiding route instructions
  const [showPrimary, setShowPrimary] = useState(false);
  const [showAlt, setShowAlt] = useState(false);
  const [hasAltRoute, setHasAltRoute] = useState(false);


  // Helper: Extract main roads from instructions (old logic)
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
      clearRouteInstructions("primary");
      clearRouteInstructions("alt");
      return;
    }

    if (controlRef.current) {
      map.removeControl(controlRef.current);
      controlRef.current = null;
    }

    const control = L.Routing.control({
      waypoints: waypoints.map((wp) => L.latLng(wp.coords[0], wp.coords[1])),
      routeWhileDragging: true,
      showAlternatives: true,
      lineOptions: {
        styles: [{ color: "#26A69A", opacity: 1, weight: 4 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
      altLineOptions: {
        styles: [{ color: "#2ECC71", opacity: 0.6, weight: 4 }],
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

          if (showPrimary) {
            showRouteInstructions("primary", routes[0]);
          } else {
            clearRouteInstructions("primary");
          }

         if (routes[1]) {
           setHasAltRoute(true);
           if (showAlt) {
             showRouteInstructions("alt", routes[1]);
           } else {
             clearRouteInstructions("alt");
           }
         } else {
           setHasAltRoute(false);
           clearRouteInstructions("alt");
         }

        }
      })
      .addTo(map);

    controlRef.current = control;

    return () => {
      if (controlRef.current) {
        map.removeControl(controlRef.current);
        controlRef.current = null;
      }
      clearRouteInstructions("primary");
      clearRouteInstructions("alt");
    };
  }, [
    map,
    waypoints,
    setDistance,
    setDuration,
    setAlternatives,
    showPrimary,
    showAlt
  ]);

  // Show route instructions container (old + click to pan fix)
  function showRouteInstructions(type, route) {
    let container = document.querySelector(
      `.leaflet-routing-container-${type}`
    );
    if (!container) {
      container = document.createElement("div");
      container.className = `leaflet-routing-container leaflet-routing-container-${type}`;
      map.getContainer().appendChild(container);
    }
    container.style.display = "block";
    container.innerHTML = "";

    const distanceKm = (route.summary.totalDistance / 1000).toFixed(1);
    const durationMin = Math.round(route.summary.totalTime / 60);
    const roads = getRouteRoads(route.instructions);

    // Header with distance, duration, roads
    const header = document.createElement("div");
    header.className = "popup-header";
    header.innerHTML = `<h3>${
      type === "primary" ? "Primary Route" : "Alternative Route"
    }</h3><p>${distanceKm} km, ${durationMin} min via ${roads}</p>`;
    container.appendChild(header);

    // Instructions list with clickable pan-to
    const instructionsDiv = document.createElement("div");
    instructionsDiv.className = "instructions-list";

    route.instructions.forEach((instr) => {
      const div = document.createElement("div");
      div.className =
        "leaflet-routing-instruction leaflet-routing-instruction-text";
      div.textContent = `${instr.text} (${(instr.distance / 1000).toFixed(
        1
      )} km)`;
      div.style.cursor = "pointer";
      div.onclick = (ev) => {
        ev.stopPropagation();
        const coord = route.coordinates[instr.index];
        if (coord) {
          map.panTo([coord.lat, coord.lng]);
        }
      };
      instructionsDiv.appendChild(div);
    });

    container.appendChild(instructionsDiv);

    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.className = "close-button";
    closeBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="#000000" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
    closeBtn.onclick = () => {
      container.style.display = "none";
      if (type === "primary") setShowPrimary(false);
      else setShowAlt(false);
    };
    container.prepend(closeBtn);

    // Prevent scroll propagation in container
    container.addEventListener("wheel", (e) => {
      e.stopPropagation();
      e.preventDefault();
      container.scrollTop += e.deltaY;
    });
  }

  // Clear route instructions container
  function clearRouteInstructions(type) {
    const container = document.querySelector(
      `.leaflet-routing-container-${type}`
    );
    if (container) {
      container.style.display = "none";
      container.innerHTML = "";
    }
  }

  // Your old buttons to toggle routes visibility (reopen/show)
  return (
    <>
      <div
        className="route-toggle-buttons"
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 1000,
          background: "rgba(255, 255, 255, 0.95)",
          padding: "8px 10px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          display: "flex",
          gap: "8px",
        }}
      >
        <button
          onClick={() => setShowPrimary(true)}
          disabled={showPrimary}
          aria-label="Show Primary Route Instructions"
          style={{
            cursor: showPrimary ? "not-allowed" : "pointer",
            opacity: showPrimary ? 0.6 : 1,
          }}
        >
          View Primary Route
        </button>
        {hasAltRoute && (
          <button
            onClick={() => setShowAlt(true)}
            disabled={showAlt}
            aria-label="Show Alternative Route Instructions"
            style={{
              cursor: showAlt ? "not-allowed" : "pointer",
              opacity: showAlt ? 0.6 : 1,
            }}
          >
            View Alternative Route
          </button>
        )}
      </div>
    </>
  );
}

export default Routing;
