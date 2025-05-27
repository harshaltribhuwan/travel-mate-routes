import React, { useEffect } from "react";
import { MdClose, MdMenu } from "react-icons/md";
import L from "leaflet";
import SearchForm from "./SearchForm";
import CollapsibleSection from "./CollapsibleSection";
import { formatDistance, formatDuration } from "../../utils/utils";
import { defaultCenter } from "../../utils/constants";
import "../../styles/DirectionCityMap.scss";

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
}) {
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 100);
    }
  }, [showSidebar, mapRef]);

  const saveRoute = () => {
    // Validate waypoints: at least 2 unique, valid coordinates
    if (
      waypoints.length >= 2 &&
      waypoints.every((wp) => wp.coords && wp.coords.length === 2) &&
      !waypoints.every(
        (wp, i) =>
          i > 0 &&
          wp.coords[0] === waypoints[0].coords[0] &&
          wp.coords[1] === waypoints[0].coords[1]
      )
    ) {
      setSavedRoutes((prev) => [
        ...prev,
        {
          waypoints,
          distance,
          duration,
          alternatives,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const deleteRoute = (index) => {
    setSavedRoutes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearRoute = () => {
    // Reset waypoints to a single default point
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
    clearRoute(); // Call parent clearRoute for additional cleanup
  };

  const handleLoadRoute = (route) => {
    setWaypoints(route.waypoints);
    setDistance(route.distance);
    setDuration(route.duration);
    setAlternatives(route.alternatives || []);
    if (mapRef.current) {
      const bounds = L.latLngBounds(route.waypoints.map((wp) => wp.coords));
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      mapRef.current.invalidateSize();
    }
    loadRoute(route); // Call parent loadRoute for additional logic
    setShowSidebar(false); // Hide sidebar after loading route
  };

  const handleSelectAlternative = (index) => {
    selectAlternative(index);
    if (mapRef.current) {
      mapRef.current.invalidateSize();
    }
  };

  return (
    <>
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
          <SearchForm
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
          />
          {alternatives.length > 0 && (
            <CollapsibleSection
              title="Alternative Routes"
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
          {waypoints.length > 2 && distance && (
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
              <>
                <button
                  onClick={() => handleLoadRoute(route)}
                  className="load-route"
                  aria-label={`Load route from ${route.waypoints[0].city} to ${
                    route.waypoints[route.waypoints.length - 1].city
                  }`}
                  title="Load Route"
                >
                  {route.waypoints[0].city} to{" "}
                  {route.waypoints[route.waypoints.length - 1].city} (
                  {formatDistance(route.distance)},{" "}
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
              </>
            )}
            itemKey="idx"
            emptyMessage="No saved routes"
          />
          <CollapsibleSection
            title="Search History"
            isOpen={showHistory}
            setIsOpen={setShowHistory}
            items={savedHistory}
            renderItem={(item, idx) => (
              <>
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
              </>
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
