import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import "leaflet.offline";
import {
  MdMenu,
  MdClose,
  MdExpandMore,
  MdExpandLess,
  MdMyLocation,
  MdAdd,
  MdSave,
  MdClear,
} from "react-icons/md";
import "./DirectionCityMap.css";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Custom SVG marker
const CustomMarkerIcon = (color) =>
  new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36">
        <path fill="${color}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    `)}`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
    shadowUrl: markerShadow,
    shadowSize: [41, 41],
  });

const defaultCenter = [20.5937, 78.9629]; // India center

function ChangeView({ center, zoom, waypoints }) {
  const map = useMap();
  useEffect(() => {
    if (waypoints.length > 1 && waypoints.every((wp) => wp.coords)) {
      const bounds = L.latLngBounds(waypoints.map((wp) => wp.coords));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView(center, zoom);
    }
  }, [center, zoom, waypoints, map]);
  return null;
}

function Routing({ waypoints, setDistance, setDuration, setAlternatives }) {
  const map = useMap();
  const routeControlRef = useRef(null);

  useEffect(() => {
    // Validate waypoints: at least 2 with valid coordinates
    if (
      !map ||
      !waypoints ||
      waypoints.length < 2 ||
      !waypoints.every(
        (wp) => wp.coords && Array.isArray(wp.coords) && wp.coords.length === 2
      )
    ) {
      // Clear existing control if invalid
      if (routeControlRef.current) {
        try {
          map.removeControl(routeControlRef.current);
        } catch (err) {
          console.warn("Failed to remove routing control:", err);
        }
        routeControlRef.current = null;
      }
      setDistance(null);
      setDuration(null);
      setAlternatives([]);
      return;
    }

    // Remove existing control safely
    if (routeControlRef.current) {
      try {
        map.removeControl(routeControlRef.current);
        routeControlRef.current = null;
      } catch (err) {
        console.warn("Safe removeControl failed:", err);
      }
    }

    // Create new routing control
    try {
      const control = L.Routing.control({
        waypoints: waypoints.map((wp) => L.latLng(wp.coords[0], wp.coords[1])),
        routeWhileDragging: true,
        showAlternatives: true,
        lineOptions: { styles: [{ color: "#26A69A", weight: 4 }] },
        router: L.Routing.osrmv1({
          serviceUrl: "https://router.project-osrm.org/route/v1",
          profile: "driving",
        }),
        createMarker: () => null,
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
              }))
            );
          }
        })
        .on("routingerror", (err) => {
          console.error("Routing error:", err);
          setDistance(null);
          setDuration(null);
          setAlternatives([]);
        })
        .addTo(map);

      routeControlRef.current = control;
    } catch (err) {
      console.error("Failed to create routing control:", err);
      setDistance(null);
      setDuration(null);
      setAlternatives([]);
    }

    // Cleanup on unmount or waypoint change
    return () => {
      if (routeControlRef.current) {
        try {
          map.removeControl(routeControlRef.current);
        } catch (err) {
          console.warn("Cleanup error:", err);
        }
        routeControlRef.current = null;
      }
    };
  }, [waypoints, map, setDistance, setDuration, setAlternatives]);

  return null;
}

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
  const [savedRoutes, setSavedRoutes] = useState(() => {
    const saved = localStorage.getItem("savedRoutes");
    return saved ? JSON.parse(saved) : [];
  });
  const [savedHistory, setSavedHistory] = useState(() => {
    const saved = localStorage.getItem("savedHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [showSidebar, setShowSidebar] = useState(true);
  const [showSavedRoutes, setShowSavedRoutes] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showDistanceMatrix, setShowDistanceMatrix] = useState(false);
  const mapRef = useRef(null);
  const watchIdRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Save routes to localStorage
  useEffect(() => {
    localStorage.setItem("savedRoutes", JSON.stringify(savedRoutes));
  }, [savedRoutes]);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem("savedHistory", JSON.stringify(savedHistory));
  }, [savedHistory]);

  // Offline map tiles
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

  // Real-time location tracking
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

  // Resize map when sidebar toggles
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 100);
    }
  }, [showSidebar]);

  const fetchSuggestions = async (value, type) => {
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          value
        )}&limit=5&addressdetails=1`
      );
      const data = await res.json();
      setSuggestions(data.map((p) => ({ ...p, inputType: type })));
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const handleInputChange = (id, e) => {
    const value = e.target.value;
    setWaypoints((prev) =>
      prev.map((wp) => (wp.id === id ? { ...wp, city: value } : wp))
    );
    setActiveInput(id);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(
      () => fetchSuggestions(value, id),
      500
    );
  };

  const handleSuggestionClick = (place) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    const type = place.inputType;
    setWaypoints((prev) =>
      prev.map((wp) =>
        wp.id === type
          ? { ...wp, city: place.display_name, coords: [lat, lon] }
          : wp
      )
    );
    // Save to history
    setSavedHistory((prev) => {
      const newHistory = [
        {
          id: `hist${Date.now()}`,
          query: place.display_name,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 10); // Limit to 10 items
      return newHistory;
    });
    setSuggestions([]);
    setActiveInput(null);
  };

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

  const handleDragEnd = (id, e) => {
    const { lat, lng } = e.target.getLatLng();
    setWaypoints((prev) =>
      prev.map((wp) => (wp.id === id ? { ...wp, coords: [lat, lng] } : wp))
    );
  };

  const saveRoute = () => {
    if (waypoints.every((wp) => wp.coords)) {
      setSavedRoutes((prev) => [
        ...prev,
        { waypoints, distance, duration, timestamp: new Date().toISOString() },
      ]);
    }
  };

  const loadRoute = (route) => {
    setWaypoints(route.waypoints);
  };

  const deleteRoute = (index) => {
    setSavedRoutes((prev) => prev.filter((_, i) => i !== index));
  };

  const loadHistoryItem = (item) => {
    if (activeInput) {
      setWaypoints((prev) =>
        prev.map((wp) =>
          wp.id === activeInput ? { ...wp, city: item.query } : wp
        )
      );
      fetchSuggestions(item.query, activeInput);
    }
  };

  const deleteHistoryItem = (index) => {
    setSavedHistory((prev) => prev.filter((_, i) => i !== index));
  };

  const useMyLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );
          const data = await res.json();
          const city =
            data.address.city ||
            data.address.town ||
            data.address.village ||
            "My Location";
          setWaypoints((prev) =>
            prev.map((wp) =>
              wp.id === "from" ? { ...wp, city, coords: [lat, lon] } : wp
            )
          );
          // Save to history
          setSavedHistory((prev) => {
            const newHistory = [
              {
                id: `hist${Date.now()}`,
                query: city,
                timestamp: new Date().toISOString(),
              },
              ...prev,
            ].slice(0, 10);
            return newHistory;
          });
        } catch (err) {
          console.error("Reverse geocoding failed:", err);
          alert("Failed to detect city.");
        }
      },
      (err) => {
        alert("Failed to access location.");
        console.error(err);
      }
    );
  };

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

  const formatDistance = (meters) => {
    if (!meters) return "";
    return (meters / 1000).toFixed(1) + " km";
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs > 0 ? hrs + "h " : ""}${mins}m`;
  };

  const selectAlternative = (index) => {
    if (mapRef.current && routeControlRef.current) {
      routeControlRef.current.getPlan().setAlternative(index);
    }
  };

  return (
    <div className="container">
      {/* Sidebar */}
      <div className={`sidebar ${showSidebar ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>Travel-Mate Map</h2>
          <button
            className="sidebar-close"
            onClick={() => setShowSidebar(false)}
            aria-label="Close sidebar"
            title="Close"
          >
            <MdClose />
          </button>
        </div>
        <div className="sidebar-content">
          <form onSubmit={(e) => e.preventDefault()} className="search-form">
            {waypoints.map((wp, idx) => (
              <div key={wp.id} className="input-group">
                <input
                  id={`${wp.id}-input`}
                  type="text"
                  placeholder={
                    wp.id === "from"
                      ? "Starting point"
                      : wp.id === "to"
                      ? "Destination"
                      : `Stop ${idx}`
                  }
                  className="input-field"
                  value={wp.city}
                  onChange={(e) => handleInputChange(wp.id, e)}
                  autoComplete="off"
                  onFocus={() => setActiveInput(wp.id)}
                  onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                  aria-label={`Enter ${
                    wp.id === "from"
                      ? "starting location"
                      : wp.id === "to"
                      ? "destination"
                      : "stop"
                  }`}
                />
                {wp.id === "from" && (
                  <button
                    type="button"
                    onClick={useMyLocation}
                    className="action-button"
                    aria-label="Use my current location"
                    title="Use My Location"
                  >
                    <MdMyLocation />
                  </button>
                )}
                {wp.id !== "from" && wp.id !== "to" && (
                  <button
                    type="button"
                    onClick={() => removeWaypoint(wp.id)}
                    className="action-button remove"
                    aria-label="Remove stop"
                    title="Remove Stop"
                  >
                    <MdClose />
                  </button>
                )}
                {activeInput === wp.id && suggestions.length > 0 && (
                  <ul className="autocomplete-dropdown">
                    {suggestions
                      .filter((s) => s.inputType === wp.id)
                      .map((place, idx) => (
                        <li
                          key={idx}
                          className="autocomplete-item"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSuggestionClick(place)}
                          tabIndex={0}
                          role="option"
                          aria-selected={false}
                        >
                          {place.display_name} ({place.class || "Place"})
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            ))}
            <div className="action-buttons">
              <button
                type="button"
                onClick={addWaypoint}
                className="action-button"
                aria-label="Add stop"
                title="Add Stop"
              >
                <MdAdd />
              </button>
              <button
                type="button"
                onClick={saveRoute}
                className="action-button"
                aria-label="Save route"
                title="Save Route"
              >
                <MdSave />
              </button>
              <button
                type="button"
                onClick={() => setTracking(!tracking)}
                className="action-button"
                aria-label={
                  tracking ? "Stop tracking" : "Start tracking location"
                }
                title={tracking ? "Stop Tracking" : "Track Location"}
              >
                <MdMyLocation />
              </button>
              <button
                type="button"
                onClick={clearRoute}
                className="action-button remove"
                aria-label="Clear route"
                title="Clear Route"
              >
                <MdClear />
              </button>
            </div>
          </form>
          {alternatives.length > 0 && (
            <div className="alternatives">
              <h3
                onClick={() => setShowAlternatives(!showAlternatives)}
                className="collapsible-header"
              >
                Alternative Routes{" "}
                {showAlternatives ? <MdExpandLess /> : <MdExpandMore />}
              </h3>
              {showAlternatives && (
                <ul className="alternatives-list">
                  {alternatives.map((alt) => (
                    <li key={alt.index}>
                      <button
                        onClick={() => selectAlternative(alt.index)}
                        className="alternative-button"
                        title={`Select Route ${alt.index + 1}`}
                      >
                        Route {alt.index + 1}: {formatDistance(alt.distance)},{" "}
                        {formatDuration(alt.duration)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {waypoints.length > 2 && distance && (
            <div className="distance-matrix">
              <h3
                onClick={() => setShowDistanceMatrix(!showDistanceMatrix)}
                className="collapsible-header"
              >
                Segments{" "}
                {showDistanceMatrix ? <MdExpandLess /> : <MdExpandMore />}
              </h3>
              {showDistanceMatrix && (
                <ul>
                  {waypoints.slice(0, -1).map((wp, i) => (
                    <li key={i}>
                      {wp.city} to {waypoints[i + 1].city}:{" "}
                      {formatDistance(distance / (waypoints.length - 1))}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="saved-routes">
            <h3
              onClick={() => setShowSavedRoutes(!showSavedRoutes)}
              className="collapsible-header"
            >
              Saved Routes{" "}
              {showSavedRoutes ? <MdExpandLess /> : <MdExpandMore />}
            </h3>
            {showSavedRoutes && (
              <>
                {savedRoutes.length > 0 ? (
                  <ul>
                    {savedRoutes.map((route, idx) => (
                      <li key={idx}>
                        <button
                          onClick={() => loadRoute(route)}
                          className="load-route"
                          aria-label={`Load route from ${
                            route.waypoints[0].city
                          } to ${
                            route.waypoints[route.waypoints.length - 1].city
                          }`}
                          title="Load Route"
                        >
                          {route.waypoints[0].city} to{" "}
                          {route.waypoints[route.waypoints.length - 1].city} (
                          {formatDistance(route.distance)})
                        </button>
                        <button
                          onClick={() => deleteRoute(idx)}
                          className="delete-route"
                          aria-label="Delete route"
                          title="Delete"
                        >
                          <MdClose />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-message">No saved routes</p>
                )}
              </>
            )}
          </div>
          <div className="search-history">
            <h3
              onClick={() => setShowHistory(!showHistory)}
              className="collapsible-header"
            >
              Search History {showHistory ? <MdExpandLess /> : <MdExpandMore />}
            </h3>
            {showHistory && (
              <>
                {savedHistory.length > 0 ? (
                  <ul>
                    {savedHistory.map((item, idx) => (
                      <li key={item.id}>
                        <button
                          onClick={() => loadHistoryItem(item)}
                          className="load-history"
                          aria-label={`Load search: ${item.query}`}
                          title="Load Search"
                        >
                          {item.query}
                        </button>
                        <button
                          onClick={() => deleteHistoryItem(idx)}
                          className="delete-history"
                          aria-label="Delete search"
                          title="Delete"
                        >
                          <MdClose />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-message">No recent searches</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Open Sidebar Button */}
      {!showSidebar && (
        <button
          className="sidebar-open"
          onClick={() => setShowSidebar(true)}
          aria-label="Open sidebar"
          title="Open Sidebar"
        >
          <MdMenu />
        </button>
      )}

      {/* Route Info */}
      {distance !== null && duration !== null && (
        <div className="route-info">
          {formatDistance(distance)} • {formatDuration(duration)}
        </div>
      )}

      {/* Map Container */}
      <div className={`map-container ${!showSidebar ? "full-width" : ""}`}>
        <MapContainer
          center={waypoints[0].coords || defaultCenter}
          zoom={6}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
          whenCreated={(map) => (mapRef.current = map)}
          zoomControl={false}
          key={waypoints.map((wp) => wp.coords?.join(",") || wp.id).join("-")}
        >
          <ZoomControl position="bottomleft" />
          <ChangeView
            center={waypoints.find((wp) => wp.coords)?.coords || defaultCenter}
            zoom={waypoints.some((wp) => wp.coords) ? 7 : 5}
            waypoints={waypoints}
          />
          <TileLayer
            attribution='© <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {waypoints.map(
            (wp) =>
              wp.coords && (
                <Marker
                  key={wp.id}
                  position={wp.coords}
                  icon={
                    wp.id === "from"
                      ? CustomMarkerIcon("#26A69A")
                      : wp.id === "to"
                      ? CustomMarkerIcon("#2ECC71")
                      : CustomMarkerIcon("#666666")
                  }
                  draggable={true}
                  eventHandlers={{ dragend: (e) => handleDragEnd(wp.id, e) }}
                >
                  <Popup>{wp.city || wp.id}</Popup>
                </Marker>
              )
          )}
          {currentLocation && (
            <Marker
              position={currentLocation}
              icon={CustomMarkerIcon("#EF5350")}
            >
              <Popup>Current Location</Popup>
            </Marker>
          )}
          {waypoints.every((wp) => wp.coords) && (
            <Routing
              waypoints={waypoints}
              setDistance={setDistance}
              setDuration={setDuration}
              setAlternatives={setAlternatives}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
