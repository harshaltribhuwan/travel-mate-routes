import React, { useEffect, useRef, useState, lazy, Suspense, useCallback } from "react";
import L from "leaflet";
import "leaflet.offline";
const MapView = lazy(() => import("./MapView"));
const Sidebar = lazy(() => import("./Sidebar"));
import { defaultCenter } from "../../utils/constants";
import "./DirectionCityMap.scss";
import Loader from "./Loader";

export default function DirectionCityMap() {
const [waypoints, setWaypoints] = useState([
  { id: "from", city: "", coords: null },
  { id: "to", city: "", coords: null },
]);
  const [suggestions, setSuggestions] = useState([]);
  const [activeInput, setActiveInput] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [tracking, setTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [showNearbyPlaces, setShowNearbyPlaces] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState(() => {
    const saved = localStorage.getItem("savedRoutes");
    return saved ? JSON.parse(saved) : [];
  });
  const [savedHistory, setSavedHistory] = useState(() => {
    const saved = localStorage.getItem("savedHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSavedRoutes, setShowSavedRoutes] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showDistanceMatrix, setShowDistanceMatrix] = useState(false);
  const mapRef = useRef(null);
  const watchIdRef = useRef(null);
  const routeControlRef = useRef(null);
  const lastFetchedCoordsRef = useRef(null);
  const lastGeolocationAttemptRef = useRef(null);

const fetchNearbyPlaces = useCallback(async (lat, lng) => {
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;
  try {
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="cafe"](around:1000,${lat},${lng});
        node["amenity"="restaurant"](around:1000,${lat},${lng});
        node["amenity"="bar"](around:1000,${lat},${lng});
        node["shop"](around:1000,${lat},${lng});
        node["amenity"="pharmacy"](around:1000,${lat},${lng});
        node["tourism"="attraction"](around:1000,${lat},${lng});
        node["tourism"="hotel"](around:1000,${lat},${lng});
        node["leisure"="park"](around:1000,${lat},${lng});
        node["historic"](around:1000,${lat},${lng});
      );
      out body;
    `;
    const url =
      "https://overpass-api.de/api/interpreter?data=" +
      encodeURIComponent(query);
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch nearby places");
    const data = await response.json();
    const places = data.elements.map((el) => ({
      id: el.id,
      name: el.tags.name || "Unnamed",
      lat: el.lat,
      lng: el.lon,
      type:
        el.tags.amenity ||
        el.tags.shop ||
        el.tags.tourism ||
        el.tags.leisure ||
        el.tags.historic ||
        "unknown",
    }));

    const filteredPlaces = places.filter(
      (place) => place.name !== "Unnamed" && place.type !== "butcher"
    );

    const grouped = filteredPlaces.reduce((acc, place) => {
      if (!acc[place.type]) acc[place.type] = [];
      acc[place.type].push(place);
      return acc;
    }, {});

    const priority = [
      "restaurant",
      "cafe",
      "hotel",
      "bakery",
      "pharmacy",
      "chemist",
      "jwelery",
    ];

    const sortedGroupedPlaces = [
      ...priority.flatMap((type) => grouped[type] || []),
      ...Object.entries(grouped)
        .filter(([type]) => !priority.includes(type))
        .sort(([a], [b]) => a.localeCompare(b))
        .flatMap(([, places]) => places),
    ];

    setNearbyPlaces(sortedGroupedPlaces);
    lastFetchedCoordsRef.current = [lat, lng];
  } catch (err) {
    console.error(err);
    setNearbyPlaces([]);
    lastFetchedCoordsRef.current = null;
  }
}, []);

useEffect(() => {
  const toWaypoint = waypoints.find((wp) => wp.id === "to");
  const hasValidToCoords =
    toWaypoint &&
    Array.isArray(toWaypoint.coords) &&
    toWaypoint.coords.length === 2 &&
    typeof toWaypoint.coords[0] === "number" &&
    typeof toWaypoint.coords[1] === "number" &&
    !isNaN(toWaypoint.coords[0]) &&
    !isNaN(toWaypoint.coords[1]);

  let debounceTimer;
  const fetchWithDebounce = () => {
    if (
      hasValidToCoords &&
      (!lastFetchedCoordsRef.current ||
        lastFetchedCoordsRef.current[0] !== toWaypoint.coords[0] ||
        lastFetchedCoordsRef.current[1] !== toWaypoint.coords[1])
    ) {
      fetchNearbyPlaces(toWaypoint.coords[0], toWaypoint.coords[1]);
    }
  };

  if (hasValidToCoords) {
    debounceTimer = setTimeout(fetchWithDebounce, 500);
  } else if (
    navigator.geolocation &&
    (!lastGeolocationAttemptRef.current ||
      Date.now() - lastGeolocationAttemptRef.current > 60000) // Limit to once per minute
  ) {
    lastGeolocationAttemptRef.current = Date.now();
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (
          !lastFetchedCoordsRef.current ||
          lastFetchedCoordsRef.current[0] !== latitude ||
          lastFetchedCoordsRef.current[1] !== longitude
        ) {
          fetchNearbyPlaces(latitude, longitude);
        }
      },
      (error) => {
        console.warn("Geolocation failed:", error);
        setNearbyPlaces([]); // Clear places if geolocation fails
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  } else if (!hasValidToCoords) {
    setNearbyPlaces([]); // Clear places if no valid coordinates
  }

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
  };
}, [waypoints, fetchNearbyPlaces]);

  useEffect(() => {
    localStorage.setItem("savedRoutes", JSON.stringify(savedRoutes));
  }, [savedRoutes]);

  useEffect(() => {
    localStorage.setItem("savedHistory", JSON.stringify(savedHistory));
  }, [savedHistory]);

  useEffect(() => {
    if (mapRef.current) {
      const offlineLayer = L.tileLayer.offline(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '© <a href="https://osm.org/copyright">OpenStreetMap</a> contributors',
          minZoom: 0,
          maxZoom: 18,
        }
      );
      offlineLayer.addTo(mapRef.current);
    }
  }, []);

  useEffect(() => {
    if (tracking && navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setCurrentLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.error("Tracking error:", err);
          alert("Failed to track location.");
          setTracking(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [tracking]);

  useEffect(() => {
    if (mapRef.current) {
      const toWaypoint = waypoints.find((wp) => wp.id === "to");
      const fromWaypoint = waypoints.find((wp) => wp.id === "from");
      const hasValidTo =
        toWaypoint?.coords &&
        Array.isArray(toWaypoint.coords) &&
        toWaypoint.coords.length === 2 &&
        !isNaN(toWaypoint.coords[0]) &&
        !isNaN(toWaypoint.coords[1]);
      const hasValidFrom =
        fromWaypoint?.coords &&
        Array.isArray(fromWaypoint.coords) &&
        fromWaypoint.coords.length === 2 &&
        !isNaN(fromWaypoint.coords[0]) &&
        !isNaN(fromWaypoint.coords[1]);

      if (hasValidTo && !hasValidFrom) {
        mapRef.current.setView(toWaypoint.coords, 13);
      } else if (hasValidTo && hasValidFrom) {
        const bounds = L.latLngBounds([fromWaypoint.coords, toWaypoint.coords]);
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      } else {
        mapRef.current.setView(defaultCenter, 5);
      }
      mapRef.current.invalidateSize();
    }
  }, [waypoints]);

  const addWaypoint = () => {
    const newId = `wp${waypoints.length}`;
    setWaypoints((prev) => [
      ...prev.slice(0, -1),
      { id: newId, city: "", coords: null },
      prev[prev.length - 1],
    ]);
  };

  const removeWaypoint = (id) => {
    if (waypoints.length <= 2) return;
    setWaypoints((prev) => prev.filter((wp) => wp.id !== id));
  };

const clearRoute = () => {
  setWaypoints([
    { id: "from", city: "", coords: null },
    { id: "to", city: "", coords: null },
  ]);
  setDistance(null);
  setDuration(null);
  setAlternatives([]);
  setTracking(false);
  setNearbyPlaces([]); // Clear nearby places
};

  const loadRoute = (route) => {
    setWaypoints(route.waypoints);
    setDistance(route.distance);
    setDuration(route.duration);
    setAlternatives([]);
    if (mapRef.current && route.waypoints.every((wp) => wp.coords)) {
      const bounds = L.latLngBounds(route.waypoints.map((wp) => wp.coords));
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  const loadHistoryItem = (item) => {
    if (activeInput) {
      setWaypoints((prev) =>
        prev.map((wp) =>
          wp.id === activeInput ? { ...wp, city: item.query } : wp
        )
      );
    }
  };

  const deleteHistoryItem = (index) => {
    setSavedHistory((prev) => prev.filter((_, i) => i !== index));
  };

  const selectAlternative = (index) => {
    if (mapRef.current && routeControlRef.current) {
      try {
        routeControlRef.current.getPlan().setAlternative(index);
        console.log(`Switched to alternative route ${index}`);
      } catch (err) {
        console.error("Failed to switch alternative:", err);
      }
    }
  };

  return (
    <div className="container">
      <Suspense fallback={<Loader />}>
        <Sidebar
          waypoints={waypoints}
          setWaypoints={setWaypoints}
          suggestions={suggestions}
          setSuggestions={setSuggestions}
          activeInput={activeInput}
          setActiveInput={setActiveInput}
          distance={distance}
          duration={duration}
          alternatives={alternatives}
          showAlternatives={showAlternatives}
          setShowAlternatives={setShowAlternatives}
          showDistanceMatrix={showDistanceMatrix}
          setShowDistanceMatrix={setShowDistanceMatrix}
          savedRoutes={savedRoutes}
          setSavedRoutes={setSavedRoutes}
          savedHistory={savedHistory}
          setSavedHistory={setSavedHistory}
          showSavedRoutes={showSavedRoutes}
          setShowSavedRoutes={setShowSavedRoutes}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          tracking={tracking}
          setTracking={setTracking}
          mapRef={mapRef}
          addWaypoint={addWaypoint}
          removeWaypoint={removeWaypoint}
          clearRoute={clearRoute}
          loadRoute={loadRoute}
          loadHistoryItem={loadHistoryItem}
          deleteHistoryItem={deleteHistoryItem}
          selectAlternative={selectAlternative}
          setDistance={setDistance}
          setDuration={setDuration}
          setAlternatives={setAlternatives}
          nearbyPlaces={nearbyPlaces}
          showNearbyPlaces={showNearbyPlaces}
          setShowNearbyPlaces={setShowNearbyPlaces}
        />
      </Suspense>
      <Suspense fallback={<Loader />}>
        <MapView
          waypoints={waypoints}
          setWaypoints={setWaypoints}
          currentLocation={currentLocation}
          distance={distance}
          setDistance={setDistance}
          duration={duration}
          setDuration={setDuration}
          alternatives={alternatives}
          setAlternatives={setAlternatives}
          showSidebar={showSidebar}
          mapRef={mapRef}
          routeControlRef={routeControlRef}
        />
      </Suspense>
    </div>
  );
}
