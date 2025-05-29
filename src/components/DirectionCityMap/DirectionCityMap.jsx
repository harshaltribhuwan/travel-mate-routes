import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet.offline";
import MapView from "./MapView";
import Sidebar from "./Sidebar";
import { defaultCenter } from "../../utils/constants";
import "./DirectionCityMap.scss";

export default function DirectionCityMap() {
  const [waypoints, setWaypoints] = useState([
    { id: "from", city: "", coords: defaultCenter },
    { id: "to", city: "", coords: null },
  ]);
  const [suggestions, setSuggestions] = useState([]);
  const [activeInput, setActiveInput] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [tracking, setTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]); // example initial empty array
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

  const fetchNearbyPlaces = async (lat, lng) => {
    if (!lat || !lng) return;
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

      // Map to simpler format
      const places = data.elements.map((el) => ({
        id: el.id,
        name: el.tags.name || "Unnamed",
        lat: el.lat,
        lng: el.lon,
        type: el.tags.amenity || el.tags.shop || "unknown",
      }));

      setNearbyPlaces(places);
    } catch (err) {
      console.error(err);
      setNearbyPlaces([]);
    }
  };

  useEffect(() => {
    const fetchBasedOnToOrGeolocation = () => {
      const toWaypoint = waypoints.find((wp) => wp.id === "to");

      if (toWaypoint?.coords) {
        fetchNearbyPlaces(toWaypoint.coords[0], toWaypoint.coords[1]);
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            fetchNearbyPlaces(latitude, longitude);
          },
          (error) => {
            console.warn("Geolocation failed:", error);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        console.warn("Neither 'to' waypoint nor geolocation available.");
      }
    };

    fetchBasedOnToOrGeolocation();
  }, [waypoints]);

  const clearRoute = () => {
    setWaypoints([
      { id: "from", city: "", coords: defaultCenter },
      { id: "to", city: "", coords: null },
    ]);
    setDistance(null);
    setDuration(null);
    setAlternatives([]);
    setTracking(false);
  };

  const loadRoute = (route) => {
    setWaypoints(route.waypoints);
    setDistance(route.distance);
    setDuration(route.duration);
    setAlternatives([]); // Clear alternatives
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
        console.log(`Switched to alternative route ${index}`); // Debug
      } catch (err) {
        console.error("Failed to switch alternative:", err);
      }
    } else {
      console.warn("Cannot switch alternative:", {
        map: !!mapRef.current,
        routeControl: !!routeControlRef.current,
      });
    }
  };

  return (
    <div className="container">
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
    </div>
  );
}
