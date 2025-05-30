import React, { useCallback, useEffect, useState } from "react";
import { MdClose, MdMenu } from "react-icons/md";
import L from "leaflet";
import SearchForm from "./SearchForm";
import CollapsibleSection from "./CollapsibleSection";
import { formatDistance, formatDuration } from "../../utils/utils";
import { defaultCenter } from "../../utils/constants";
import "./Sidebar.scss";

function capitalizeWords(str) {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

// Utility to group places by type
const groupByType = (places) => {
  return places.reduce((acc, place) => {
    const type = place.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(place);
    return acc;
  }, {});
};

function Sidebar({
  waypoints,
  setWaypoints,
  suggestions,
  setSuggestions,
  activeInput,
  setActiveInput,
  distance,
  duration,
  alternatives,
  showAlternatives,
  setShowAlternatives,
  showDistanceMatrix,
  setShowDistanceMatrix,
  savedRoutes,
  setSavedRoutes,
  savedHistory,
  setSavedHistory,
  showSavedRoutes,
  setShowSavedRoutes,
  showHistory,
  setShowHistory,
  showSidebar,
  setShowSidebar,
  tracking,
  setTracking,
  mapRef,
  addWaypoint,
  removeWaypoint,
  clearRoute,
  loadRoute,
  loadHistoryItem,
  deleteHistoryItem,
  selectAlternative,
  setDistance,
  setDuration,
  setAlternatives,
  nearbyPlaces,
  showNearbyPlaces,
  setShowNearbyPlaces,
}) {
  const [selectedSaved, setSelectedSaved] = useState(false);
  // State for nested collapsible sections
  const [openCategories, setOpenCategories] = useState({});

  useEffect(() => {
    if (!mapRef.current) return;

    let timeoutId;
    const invalidateMap = () => {
      timeoutId = setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100); // Debounce to prevent rapid calls
    };

    invalidateMap();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [showSidebar, mapRef]);

  const saveRoute = useCallback(() => {
    if (
      waypoints.length < 2 ||
      !waypoints.every(
        (wp) =>
          Array.isArray(wp.coords) &&
          wp.coords.length === 2 &&
          !isNaN(wp.coords[0]) &&
          !isNaN(wp.coords[1])
      ) ||
      waypoints.every(
        (wp, i, arr) =>
          i > 0 &&
          wp.coords[0] === arr[0].coords[0] &&
          wp.coords[1] === arr[0].coords[1]
      ) ||
      distance == null ||
      duration == null
    ) {
      console.warn("Invalid route data, not saving");
      return;
    }

    const isDuplicate = savedRoutes.some(
      (route) =>
        route.waypoints.length === waypoints.length &&
        route.waypoints.every(
          (wp, i) =>
            wp.city === waypoints[i].city &&
            wp.coords[0] === waypoints[i].coords[0] &&
            wp.coords[1] === waypoints[i].coords[1]
        )
    );

    if (isDuplicate) {
      console.warn("Duplicate route, not saving");
      return;
    }

    setSavedRoutes((prev) => [
      {
        waypoints,
        distance,
        duration,
        alternatives: alternatives || [],
        timestamp: new Date().toISOString(),
      },
      ...prev.slice(0, 50),
    ]);
  }, [
    waypoints,
    distance,
    duration,
    alternatives,
    savedRoutes,
    setSavedRoutes,
  ]);

  const deleteRoute = useCallback(
    (index) => {
      if (index < 0 || index >= savedRoutes.length) {
        console.warn("Invalid route index for deletion:", index);
        return;
      }
      setSavedRoutes((prev) => prev.filter((_, i) => i !== index));
    },
    [savedRoutes, setSavedRoutes]
  );

  const handleClearRoute = useCallback(() => {
    try {
      setWaypoints([
        { id: "from", city: "", coords: defaultCenter },
        { id: "to", city: "", coords: null },
      ]);
      setDistance(null);
      setDuration(null);
      setAlternatives([]);
      setTracking(false);

      if (mapRef.current) {
        mapRef.current.setView(defaultCenter, 5);
        mapRef.current.invalidateSize();
      }

      clearRoute();
    } catch (error) {
      console.error("Error clearing route:", error);
    }
  }, [
    setWaypoints,
    setDistance,
    setDuration,
    setAlternatives,
    setTracking,
    mapRef,
    clearRoute,
  ]);

  const handleLoadRoute = useCallback(
    (route) => {
      if (
        !route ||
        !Array.isArray(route.waypoints) ||
        route.waypoints.length === 0 ||
        !route.waypoints.every(
          (wp) =>
            wp.id &&
            wp.city &&
            Array.isArray(wp.coords) &&
            wp.coords.length === 2 &&
            !isNaN(wp.coords[0]) &&
            !isNaN(wp.coords[1])
        )
      ) {
        console.warn("Invalid route data:", route);
        return;
      }

      try {
        setWaypoints(route.waypoints);
        setDistance(route.distance ?? null);
        setDuration(route.duration ?? null);
        setAlternatives(route.alternatives ?? []);
        setSelectedSaved(true);

        if (mapRef.current) {
          const validCoords = route.waypoints.filter((wp) => wp.coords);
          if (validCoords.length > 0) {
            const bounds = L.latLngBounds(validCoords.map((wp) => wp.coords));
            mapRef.current.fitBounds(bounds, { padding: [50, 50] });
          } else {
            mapRef.current.setView(
              route.waypoints[0].coords || defaultCenter,
              10
            );
          }
          mapRef.current.invalidateSize();
        }

        loadRoute(route);
        setShowSidebar(false);
      } catch (error) {
        console.error("Error loading route:", error);
        setWaypoints([
          { id: "from", city: "", coords: defaultCenter },
          { id: "to", city: "", coords: null },
        ]);
        setDistance(null);
        setDuration(null);
        setAlternatives([]);
      }
    },
    [
      setWaypoints,
      setDistance,
      setDuration,
      setAlternatives,
      setSelectedSaved,
      mapRef,
      loadRoute,
      setShowSidebar,
    ]
  );

  const handleSelectAlternative = useCallback(
    (index) => {
      if (index < 0 || index >= alternatives.length) {
        console.warn("Invalid alternative index:", index);
        return;
      }

      try {
        selectAlternative(index);
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      } catch (error) {
        console.error("Error selecting alternative:", error);
      }
    },
    [alternatives, selectAlternative, mapRef]
  );

  const handleSelectNearbyPlace = useCallback(
    (place) => {
      if (
        !place ||
        !place.name ||
        typeof place.lat !== "number" ||
        typeof place.lng !== "number" ||
        isNaN(place.lat) ||
        isNaN(place.lng)
      ) {
        console.warn("Invalid place data:", place);
        return;
      }

      try {
        const hasToWaypoint = waypoints.some((wp) => wp.id === "to");
        const updatedWaypoints = hasToWaypoint
          ? waypoints.map((wp) =>
              wp.id === "to"
                ? { ...wp, city: place.name, coords: [place.lat, place.lng] }
                : wp
            )
          : [
              ...waypoints,
              { id: "to", city: place.name, coords: [place.lat, place.lng] },
            ];

        setWaypoints(updatedWaypoints);
        setSuggestions([]);
        setActiveInput(null);

        if (mapRef.current) {
          mapRef.current.setView([place.lat, place.lng], 14);
          mapRef.current.invalidateSize();
        }

        loadRoute({ waypoints: updatedWaypoints });

        setSavedHistory((prev) => {
          const newHistory = [
            {
              id: `hist${Date.now()}`,
              query: place.name,
              timestamp: new Date().toISOString(),
            },
            ...prev.slice(0, 10),
          ];
          return newHistory;
        });

        setShowSidebar(false);
      } catch (error) {
        console.error("Error selecting nearby place:", error);
      }
    },
    [
      waypoints,
      setWaypoints,
      setSuggestions,
      setActiveInput,
      mapRef,
      loadRoute,
      setSavedHistory,
      setShowSidebar,
    ]
  );

  const toggleCategory = useCallback(
    (category) => {
      if (!category) {
        console.warn("Invalid category:", category);
        return;
      }
      setOpenCategories((prev) => {
        if (prev[category] === undefined && !prev[category]) {
          return { ...prev, [category]: true };
        }
        if (prev[category]) {
          return { ...prev, [category]: false };
        }
        return prev;
      });
    },
    [setOpenCategories]
  );

  // Group nearby places by type
  const groupedPlaces = groupByType(nearbyPlaces);

  return (
    <>
      <div className={`sidebar ${showSidebar ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>TravelMate Routes</h2>
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
          <SearchForm
            setShowSidebar={setShowSidebar}
            waypoints={waypoints}
            setWaypoints={setWaypoints}
            suggestions={suggestions}
            setSuggestions={setSuggestions}
            activeInput={activeInput}
            setActiveInput={setActiveInput}
            tracking={tracking}
            setTracking={setTracking}
            savedHistory={savedHistory}
            setSavedHistory={setSavedHistory}
            addWaypoint={addWaypoint}
            removeWaypoint={removeWaypoint}
            saveRoute={saveRoute}
            clearRoute={handleClearRoute}
            selectedSaved={selectedSaved}
          />
          {alternatives.length > 0 && (
            <CollapsibleSection
              title="Alternatives"
              isOpen={showAlternatives}
              setIsOpen={setShowAlternatives}
              items={alternatives}
              renderItem={(alt) => (
                <button
                  onClick={() => handleSelectAlternative(alt.index)}
                  className="alternative-button"
                  title={`Select Route ${alt.index + 1}`}
                >
                  Route {alt.index + 1}: {formatDistance(alt.distance)},{" "}
                  {formatDuration(alt.duration)}
                </button>
              )}
              itemKey="index"
            />
          )}
          {waypoints.length > 2 && Array.isArray(distance) && (
            <CollapsibleSection
              title="Segments"
              isOpen={showDistanceMatrix}
              setIsOpen={setShowDistanceMatrix}
              items={waypoints.slice(0, -1).map((wp, i) => ({
                id: i,
                content: `${wp.city} to ${
                  waypoints[i + 1].city
                }: ${formatDistance(distance / (waypoints.length - 1))}`,
              }))}
              renderItem={(item) => item.content}
              itemKey="id"
            />
          )}
          <CollapsibleSection
            title="Saved Routes"
            isOpen={showSavedRoutes}
            setIsOpen={setShowSavedRoutes}
            items={savedRoutes}
            renderItem={(route, idx) => (
              <div className="route-item" key={idx}>
                <button
                  onClick={() => handleLoadRoute(route)}
                  className="load-route"
                  aria-label={`Load route from ${
                    route.waypoints[0]?.city || "Unknown"
                  } to ${
                    route.waypoints[route.waypoints.length - 1]?.city ||
                    "Unknown"
                  }`}
                  title="Load Route"
                >
                  {route.waypoints[0]?.city || "Unknown"} to{" "}
                  {route.waypoints[route.waypoints.length - 1]?.city ||
                    "Unknown"}{" "}
                  ({formatDistance(route.distance)},{" "}
                  {formatDuration(route.duration)})
                </button>
                <button
                  onClick={() => deleteRoute(idx)}
                  className="delete-route"
                  aria-label="Delete route"
                  title="Delete"
                >
                  <MdClose />
                </button>
              </div>
            )}
            itemKey="idx"
            emptyMessage="No saved routes"
          />
          <CollapsibleSection
            title="Nearby Places"
            isOpen={showNearbyPlaces}
            setIsOpen={setShowNearbyPlaces}
            items={Object.keys(groupedPlaces)}
            itemKey="type"
            emptyMessage="No nearby places found."
            renderItem={(category) => (
              <CollapsibleSection
                title={`${capitalizeWords(category)} (${
                  groupedPlaces[category].length
                })`}
                isOpen={openCategories[category] || false}
                setIsOpen={() => toggleCategory(category)}
                items={groupedPlaces[category]}
                itemKey="id"
                emptyMessage={`No ${category} found.`}
                renderItem={(place) => (
                  <div
                    className="nearby-place-item"
                    onClick={() => handleSelectNearbyPlace(place)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleSelectNearbyPlace(place);
                      }
                    }}
                    aria-label={`Select ${place.name} as destination`}
                    title={`Set ${place.name} as destination`}
                  >
                    <p className="nearby-place-text">
                      <span className="place-name">{place.name}</span>
                    </p>
                  </div>
                )}
              />
            )}
          />
          <CollapsibleSection
            title="History"
            isOpen={showHistory}
            setIsOpen={setShowHistory}
            items={savedHistory}
            renderItem={(item, idx) => (
              <div className="history-item" key={item.id || idx}>
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
              </div>
            )}
            itemKey="id"
            emptyMessage="No recent searches"
          />
        </div>
      </div>
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
    </>
  );
}

export default Sidebar;
