import React, { useRef, useEffect, useState } from "react";
import {
  MdMyLocation,
  MdAdd,
  MdSave,
  MdClear,
  MdClose,
  MdDirections,
  MdDragIndicator,
} from "react-icons/md";
import "./SearchForm.scss";
import { defaultCenter } from "../../utils/constants";

function SearchForm({
  waypoints,
  setWaypoints,
  suggestions,
  setSuggestions,
  activeInput,
  setActiveInput,
  tracking,
  setTracking,
  savedHistory,
  setSavedHistory,
  addWaypoint,
  removeWaypoint,
  saveRoute,
  clearRoute,
  setShowSidebar,
  selectedSaved,
}) {
  const debounceTimerRef = useRef(null);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const [showDirections, setShowDirections] = useState(false);
  const [draggedId, setDraggedId] = useState(null);

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
      setSuggestions([]);
    }
  };

  useEffect(() => {
    if (activeInput) {
      const waypoint = waypoints.find((wp) => wp.id === activeInput);
      if (waypoint?.city) {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(
          () => fetchSuggestions(waypoint.city, activeInput),
          500
        );
      }
    }
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [waypoints, activeInput]);

  const handleInputChange = (id, e) => {
    const value = e.target.value;
    setWaypoints((prev) =>
      prev.map((wp) => (wp.id === id ? { ...wp, city: value } : wp))
    );
    setActiveInput(id);
    setFocusedSuggestionIndex(-1);
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
    setSavedHistory((prev) => {
      const newHistory = [
        {
          id: `hist${Date.now()}`,
          query: place.display_name,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 10);
      return newHistory;
    });
    setSuggestions([]);
    setActiveInput(null);
    setFocusedSuggestionIndex(-1);
    if (type === "to") setShowSidebar(false);
  };

  const handleKeyDown = (e, wpId) => {
    const relevantSuggestions = suggestions.filter((s) => s.inputType === wpId);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedSuggestionIndex((prev) =>
        prev < relevantSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedSuggestionIndex((prev) =>
        prev > 0 ? prev - 1 : relevantSuggestions.length - 1
      );
    } else if (e.key === "Enter" && focusedSuggestionIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(relevantSuggestions[focusedSuggestionIndex]);
    } else if (e.key === "Escape") {
      setSuggestions([]);
      setActiveInput(null);
    }
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

  useEffect(() => {
    if (selectedSaved) {
      setShowDirections(true);
    }
  }, [selectedSaved]);

  const handleShowDirections = () => {
    setShowDirections(true);
    if (!waypoints.some((wp) => wp.id === "from")) {
      setWaypoints((prev) => [{ id: "from", city: "", coords: null }, ...prev]);
    }
  };

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggedId(id);
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain");
    if (sourceId === targetId) return;

    // Only allow reordering if both source and target are stops (not "from" or "to")
    if (
      sourceId === "from" ||
      sourceId === "to" ||
      targetId === "from" ||
      targetId === "to"
    ) {
      setDraggedId(null);
      return;
    }

    const reorderedWaypoints = Array.from(waypoints);
    const sourceIndex = waypoints.findIndex((wp) => wp.id === sourceId);
    const targetIndex = waypoints.findIndex((wp) => wp.id === targetId);

    // Reorder only stops
    const [movedWaypoint] = reorderedWaypoints.splice(sourceIndex, 1);
    reorderedWaypoints.splice(targetIndex, 0, movedWaypoint);
    setWaypoints(reorderedWaypoints);
    setDraggedId(null);
  };

  const toWaypoint = waypoints.find((wp) => wp.id === "to");
  const hasValidTo =
    toWaypoint?.coords &&
    Array.isArray(toWaypoint.coords) &&
    toWaypoint.coords.length === 2 &&
    !isNaN(toWaypoint.coords[0]) &&
    !isNaN(toWaypoint.coords[1]);

  return (
    <div className="search-form">
      <div className="waypoints-container">
        {waypoints.map((wp, idx) =>
          wp.id !== "from" || showDirections || selectedSaved ? (
            <div
              key={wp.id}
              className={`input-group ${draggedId === wp.id ? "dragging" : ""}`}
              draggable={wp.id !== "from" && wp.id !== "to"}
              onDragStart={
                wp.id !== "from" && wp.id !== "to"
                  ? (e) => handleDragStart(e, wp.id)
                  : undefined
              }
              onDragOver={
                wp.id !== "from" && wp.id !== "to"
                  ? (e) => handleDragOver(e, wp.id)
                  : undefined
              }
              onDrop={
                wp.id !== "from" && wp.id !== "to"
                  ? (e) => handleDrop(e, wp.id)
                  : undefined
              }
            >
              {wp.id !== "from" && wp.id !== "to" && (
                <div className="drag-handle" title="Drag to reorder">
                  <MdDragIndicator />
                </div>
              )}
              <input
                id={`${wp.id}-input`}
                type="text"
                placeholder={
                  wp.id === "from"
                    ? "From"
                    : wp.id === "to"
                    ? "Destination"
                    : `Stop ${idx - 1}`
                }
                className="input-field"
                value={wp.city}
                onChange={(e) => handleInputChange(wp.id, e)}
                onKeyDown={(e) => handleKeyDown(e, wp.id)}
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
                  className="inside-input-button"
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
                  className="inside-input-button"
                  aria-label="Remove stop"
                  title="Remove Stop"
                >
                  <MdClose />
                </button>
              )}
              {activeInput === wp.id && suggestions.length > 0 && (
                <ul className="autocomplete-dropdown" role="listbox">
                  {suggestions
                    .filter((s) => s.inputType === wp.id)
                    .map((place, index) => (
                      <li
                        key={place.place_id || `${place.display_name}-${index}`}
                        className={`autocomplete-item ${
                          focusedSuggestionIndex === index ? "focused" : ""
                        }`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSuggestionClick(place)}
                        tabIndex={0}
                        role="option"
                        aria-selected={focusedSuggestionIndex === index}
                      >
                        {place.display_name}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          ) : null
        )}
      </div>
      {hasValidTo && !showDirections && (
        <button
          type="button"
          onClick={handleShowDirections}
          className="directions-button"
          aria-label="Show directions"
          title="Show Directions"
        >
          <MdDirections /> Show Directions
        </button>
      )}
      {showDirections && (
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
            aria-label={tracking ? "Stop tracking" : "Start tracking location"}
            title={tracking ? "Stop Tracking" : "Track Location"}
          >
            <MdMyLocation />
          </button>
          <button
            type="button"
            onClick={() => {
              clearRoute();
              setShowDirections(false);
            }}
            className="action-button remove"
            aria-label="Clear route"
            title="Clear Route"
          >
            <MdClear />
          </button>
        </div>
      )}
    </div>
  );
}

export default SearchForm;
