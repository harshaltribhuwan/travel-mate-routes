import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import { FiVolume2, FiVolumeX } from "react-icons/fi";
import "./Routing.scss";
import { speech, initSpeech } from "../../utils/speech";
import Loader from "./Loader";

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
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const voiceEnabledRef = useRef(voiceEnabled);

  // Memoize valid waypoint coordinates
  const validWaypoints = useMemo(
    () =>
      waypoints
        .filter(
          (wp) =>
            wp.coords &&
            Array.isArray(wp.coords) &&
            wp.coords.length === 2 &&
            !isNaN(wp.coords[0]) &&
            !isNaN(wp.coords[1])
        )
        .map((wp) => wp.coords),
    [waypoints]
  );

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      const newValue = !prev;
      if (!newValue && speech?.cancel) {
        speech.cancel(); // Stop voice if being turned off
      }
      return newValue;
    });
  }, []);

  // Helper: Get route roads
  const getRouteRoads = useCallback((instructions) => {
    if (!Array.isArray(instructions)) return "Main Roads";
    const roads = new Set();
    for (const instr of instructions) {
      const text = instr.text?.toLowerCase() || "";
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
  }, []);

  useEffect(() => {
    if (
      !currentLocation ||
      !controlRef.current?._routes?.length ||
      !validWaypoints.length
    ) {
      setCurrentStepIndex(-1);
      return;
    }

    const routeIndex =
      activeRoute === "alt" && controlRef.current._routes.length > 1 ? 1 : 0;
    const currentRoute = controlRef.current._routes[routeIndex];
    const instructions = currentRoute?.instructions || [];
    const coordinates = currentRoute?.coordinates || [];
    let currentStep = -1;
    let minDistance = Infinity;

    instructions.forEach((instr, idx) => {
      const coord = coordinates[instr.index];
      if (
        coord &&
        Array.isArray(currentLocation) &&
        currentLocation.length === 2 &&
        !isNaN(currentLocation[0]) &&
        !isNaN(currentLocation[1])
      ) {
        const distance = L.latLng(currentLocation).distanceTo([
          coord.lat,
          coord.lng,
        ]);
        if (distance < minDistance && distance < 300) {
          minDistance = distance;
          currentStep = idx;
        }
      }
    });

    setCurrentStepIndex(currentStep);
  }, [currentLocation, activeRoute, validWaypoints]);

  useEffect(() => {
    initSpeech().catch((error) =>
      console.warn("Failed to initialize speech:", error)
    );
  }, []);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  useEffect(() => {
    if (!map || validWaypoints.length < 2) {
      if (controlRef.current) {
        map.removeControl(controlRef.current);
        controlRef.current = null;
      }
      setDistance(null);
      setDuration(null);
      setAlternatives([]);
      clearRouteInstructions();
      setLoading(false);
      return;
    }

    setLoading(true);

    if (controlRef.current) {
      controlRef.current.setWaypoints(
        validWaypoints.map((coords) => L.latLng(coords[0], coords[1]))
      );
      return;
    }

    const control = L.Routing.control({
      waypoints: validWaypoints.map((coords) => L.latLng(coords[0], coords[1])),
      routeWhileDragging: true,
      showAlternatives: true,
      lineOptions: {
        styles: [{ color: "#1a73e8", opacity: 1, weight: 6 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
      altLineOptions: {
        styles: [{ color: "#757575", opacity: 0.7, weight: 5 }],
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
        setLoading(false);
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
      .on("routingerror", (error) => {
        setLoading(false);
        console.warn("Routing error:", error);
        setDistance(null);
        setDuration(null);
        setAlternatives([]);
        clearRouteInstructions();
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
      setLoading(false);
    };
  }, [
    map,
    validWaypoints,
    setDistance,
    setDuration,
    setAlternatives,
    activeRoute,
  ]);

  const getSpokenDistance = useCallback((distanceInMeters) => {
    if (!distanceInMeters || isNaN(distanceInMeters)) return "unknown distance";
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)} meters`;
    }
    const km = (distanceInMeters / 1000).toFixed(1);
    return `${km.replace(".", " point ")} kilometers`;
  }, []);

  const getSpokenInstruction = useCallback(
    (instr) => {
      if (!instr?.text) return "";
      const lowerText = instr.text.toLowerCase();
      const dist = getSpokenDistance(instr.distance);

      let connector = "for";
      if (
        instr.type === "Head" ||
        lowerText.startsWith("continue") ||
        lowerText.includes("stay on")
      ) {
        connector = "for";
      } else if (
        lowerText.startsWith("turn") ||
        lowerText.startsWith("make") ||
        lowerText.startsWith("keep")
      ) {
        connector = instr.distance > 200 ? "after" : "at";
      } else if (instr.type === "DestinationReached") {
        return instr.text;
      }

      return `${instr.text} ${connector} ${dist}`;
    },
    [getSpokenDistance]
  );

  function showRouteInstructions(type, route) {
    let container = document.querySelector(".leaflet-routing-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "leaflet-routing-container";
      map.getContainer().appendChild(container);
    }
    container.style.display = "block";
    container.innerHTML = "";

    if (!route?.summary || !Array.isArray(route.instructions)) {
      console.warn("Invalid route data for instructions:", route);
      return;
    }

    const distanceKm = (route.summary.totalDistance / 1000).toFixed(1);
    const roads = getRouteRoads(route.instructions);
    const totalSeconds = route.summary.totalTime;
    const durationText =
      totalSeconds < 3600
        ? `${Math.round(totalSeconds / 60)} min`
        : `${(totalSeconds / 3600).toFixed(2)} h`;

    const header = document.createElement("div");
    header.className = "popup-header";
    header.innerHTML = `<h3>${
      type === "primary" ? "Main Route" : "Alternative Route"
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
      const distance =
        instr.distance < 1000
          ? `${Math.round(instr.distance)} m`
          : `${(instr.distance / 1000).toFixed(1)} km`;

      div.innerHTML = `<span class="maneuver-icon">${maneuverIcon}</span> ${instr.text} (${distance})`;

      const spokenText = getSpokenInstruction(instr);

      div.onclick = (ev) => {
        ev.stopPropagation();
        if (voiceEnabledRef.current && speech?.speak) {
          if (speech.speaking()) {
            speech.cancel();
          }
          speech.speak({ text: spokenText }).catch(console.error);
        }

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

  function getManeuverIcon(type) {
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
    return "→";
  }

  return (
    <>
      <button
        className={`voice-toggle-button ${voiceEnabled ? "active" : ""}`}
        onClick={toggleVoice}
        aria-pressed={voiceEnabled}
        data-title={voiceEnabled ? "Voice Directions" : "Disable Voice"}
        type="button"
      >
        <span className="icon">
          {voiceEnabled ? <FiVolume2 /> : <FiVolumeX />}
        </span>
      </button>

      <div className="route-toggle-buttons">
        {validWaypoints.length >= 2 && (
          <button
            onClick={() =>
              setActiveRoute(activeRoute === "primary" ? null : "primary")
            }
            aria-label={
              activeRoute === "primary"
                ? "Hide Primary Route"
                : hasAltRoute
                ? "Show Primary Route"
                : "View Route Details"
            }
          >
            {activeRoute === "primary"
              ? "Hide Route"
              : hasAltRoute
              ? "Main Route"
              : "View Route Details"}
          </button>
        )}

        {hasAltRoute && (
          <button
            onClick={() => setActiveRoute(activeRoute === "alt" ? null : "alt")}
            aria-label={
              activeRoute === "alt"
                ? "Hide Alternative Route"
                : "Show Alternative Route"
            }
          >
            {activeRoute === "alt" ? "Hide Alt" : "Alternate Route"}
          </button>
        )}

        {loading && <Loader />}
      </div>
    </>
  );
}

export default Routing;
