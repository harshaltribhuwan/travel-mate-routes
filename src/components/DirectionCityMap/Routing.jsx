import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";

function Routing({
  waypoints,
  setDistance,
  setDuration,
  setAlternatives,
  routeControlRef,
}) {
  const map = useMap();
  const controlRef = useRef(null);
  const popupStateRef = useRef({ primary: true, alt: true });

  // Helper to extract key roads from instructions
  const getRouteRoads = (instructions) => {
    const roads = new Set();
    for (const instr of instructions) {
      const text = instr.text.toLowerCase();
      // Match NH (e.g., NH-44), SH, Expressway, or named roads
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
    // Return up to 3 major roads, joined with commas
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
      return;
    }

    if (controlRef.current) {
      map.removeControl(controlRef.current);
      console.log("Removed existing routing control");
      controlRef.current = null;
    }

    try {
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
          console.log("Routes found:", routes.length, routes);
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

            // Create primary route popup
            let primaryContainer = document.querySelector(
              ".leaflet-routing-container-primary"
            );
            if (!primaryContainer) {
              primaryContainer = document.createElement("div");
              primaryContainer.className =
                "leaflet-routing-container leaflet-routing-container-primary";
              map.getContainer().appendChild(primaryContainer);
            }
            primaryContainer.innerHTML = "";
            const primaryHeader = document.createElement("div");
            primaryHeader.className = "popup-header";
            const distanceKm = (routes[0].summary.totalDistance / 1000).toFixed(
              1
            );
            const durationMin = Math.round(routes[0].summary.totalTime / 60);
            const primaryRoads = getRouteRoads(routes[0].instructions);
            primaryHeader.innerHTML = `<h3>Primary Route</h3><p>${distanceKm} km, ${durationMin} min via ${primaryRoads}</p>`;
            primaryContainer.appendChild(primaryHeader);
            const primaryInstructions = document.createElement("div");
            primaryInstructions.className = "instructions-list";
            routes[0].instructions.forEach((instr, idx) => {
              const div = document.createElement("div");
              div.className = "leaflet-routing-instruction";
              div.innerHTML = `${instr.text} (${(instr.distance / 1000).toFixed(
                1
              )} km)`;
              div.onclick = () => {
                const coord = routes[0].coordinates[instr.index];
                if (coord) map.panTo([coord.lat, coord.lng]);
              };
              primaryInstructions.appendChild(div);
            });
            primaryContainer.appendChild(primaryInstructions);
            const primaryCloseBtn = document.createElement("button");
            primaryCloseBtn.className = "close-button";
            primaryCloseBtn.innerHTML =
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="#000000" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
            primaryCloseBtn.onclick = () => {
              primaryContainer.style.display = "none";
              popupStateRef.current.primary = false;
            };
            primaryContainer.prepend(primaryCloseBtn);
            primaryContainer.addEventListener("wheel", (e) => {
              e.stopPropagation();
              e.preventDefault();
              primaryContainer.scrollTop += e.deltaY;
            });

            // Create alternative route popup (if available)
            let altContainer = document.querySelector(
              ".leaflet-routing-container-alt"
            );
            if (routes[1]) {
              if (!altContainer) {
                altContainer = document.createElement("div");
                altContainer.className =
                  "leaflet-routing-container leaflet-routing-container-alt";
                map.getContainer().appendChild(altContainer);
              }
              altContainer.innerHTML = "";
              const altHeader = document.createElement("div");
              altHeader.className = "popup-header";
              const altDistanceKm = (
                routes[1].summary.totalDistance / 1000
              ).toFixed(1);
              const altDurationMin = Math.round(
                routes[1].summary.totalTime / 60
              );
              const altRoads = getRouteRoads(routes[1].instructions);
              altHeader.innerHTML = `<h3>Alternative Route</h3><p>${altDistanceKm} km, ${altDurationMin} min via ${altRoads}</p>`;
              altContainer.appendChild(altHeader);
              const altInstructions = document.createElement("div");
              altInstructions.className = "instructions-list";
              routes[1].instructions.forEach((instr, idx) => {
                const div = document.createElement("div");
                div.className = "leaflet-routing-instruction";
                div.innerHTML = `${instr.text} (${(
                  instr.distance / 1000
                ).toFixed(1)} km)`;
                div.onclick = () => {
                  const coord = routes[1].coordinates[instr.index];
                  if (coord) map.panTo([coord.lat, coord.lng]);
                };
                altInstructions.appendChild(div);
              });
              altContainer.appendChild(altInstructions);
              const altCloseBtn = document.createElement("button");
              altCloseBtn.className = "close-button";
              altCloseBtn.innerHTML =
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="#000000" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
              altCloseBtn.onclick = () => {
                altContainer.style.display = "none";
                popupStateRef.current.alt = false;
              };
              altContainer.prepend(altCloseBtn);
              altContainer.addEventListener("wheel", (e) => {
                e.stopPropagation();
                e.preventDefault();
                altContainer.scrollTop += e.deltaY;
              });
            } else if (altContainer) {
              altContainer.remove();
            }
          }
        })
        .on("routeselected", (e) => {
          const selectedRoute = e.route;
          console.log("Route selected:", selectedRoute);
          setDistance(selectedRoute.summary.totalDistance);
          setDuration(selectedRoute.summary.totalTime);
          setAlternatives((prev) =>
            prev.map((alt) => ({
              ...alt,
              selected: alt.coordinates === selectedRoute.coordinates,
            }))
          );
          const primaryContainer = document.querySelector(
            ".leaflet-routing-container-primary"
          );
          const altContainer = document.querySelector(
            ".leaflet-routing-container-alt"
          );
          if (primaryContainer && popupStateRef.current.primary)
            primaryContainer.style.display = "block";
          if (altContainer && popupStateRef.current.alt)
            altContainer.style.display = "block";
        })
        .on("routingerror", (err) => {
          console.error("Routing error:", err);
          setDistance(null);
          setDuration(null);
          setAlternatives([]);
        })
        .addTo(map);

      // Add reopen button
      const reopenBtn = document.createElement("button");
      reopenBtn.className = "reopen-button";
      reopenBtn.innerHTML = "Show Routes";
      reopenBtn.onclick = () => {
        const primaryContainer = document.querySelector(
          ".leaflet-routing-container-primary"
        );
        const altContainer = document.querySelector(
          ".leaflet-routing-container-alt"
        );
        if (primaryContainer) {
          primaryContainer.style.display = "block";
          popupStateRef.current.primary = true;
        }
        if (altContainer) {
          altContainer.style.display = "block";
          popupStateRef.current.alt = true;
        }
      };
      map.getContainer().appendChild(reopenBtn);

      controlRef.current = control;
      if (routeControlRef) {
        routeControlRef.current = control;
        console.log("Updated routeControlRef");
      }

      return () => {
        if (controlRef.current) {
          map.removeControl(controlRef.current);
          controlRef.current = null;
        }
        const primaryContainer = document.querySelector(
          ".leaflet-routing-container-primary"
        );
        const altContainer = document.querySelector(
          ".leaflet-routing-container-alt"
        );
        const reopenBtn = document.querySelector(".reopen-button");
        if (primaryContainer) primaryContainer.remove();
        if (altContainer) altContainer.remove();
        if (reopenBtn) reopenBtn.remove();
      };
    } catch (err) {
      console.error("Failed to create routing control:", err);
      setDistance(null);
      setDuration(null);
      setAlternatives([]);
    }
  }, [
    waypoints,
    map,
    setDistance,
    setDuration,
    setAlternatives,
    routeControlRef,
  ]);

  return null;
}

export default Routing;
