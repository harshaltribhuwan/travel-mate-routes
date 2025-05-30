import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  MdMyLocation,
  MdAdd,
  MdSave,
  MdClear,
  MdClose,
  MdDirections,
  MdDragIndicator,
} from "react-icons/md";
import { useDirections } from "./DirectionsContext";
import "./SearchForm.scss";

function SearchForm({
  waypoints,
  setWaypoints,
  suggestions,
  setSuggestions,
  activeInput,
  setActiveInput,
  tracking,
  setTracking,
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
  const [draggedId, setDraggedId] = useState(null);
  const [isProgrammaticChange, setIsProgrammaticChange] = useState(false);

  // Use DirectionsContext
  const {
    showDirections,
    setShowDirections,
    hasValidTo,
    handleShowDirections,
  } = useDirections();

  // Memoize suggestions map for performance
  const relevantSuggestionsMap = useMemo(() => {
    const map = {};
    waypoints.forEach((wp) => {
      if (wp.id) {
        map[wp.id] = suggestions.filter((s) => s.inputType === wp.id);
      }
    });
    return map;
  }, [suggestions, waypoints.length]);

  const fetchSuggestions = async (value, type) => {
    if (typeof value !== "string" || value.length < 2 || !type) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          value
        )}&limit=20&addressdetails=1`
      );
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) {
        console.warn("Invalid data:", data);
        setSuggestions([]);
        return;
      }
      setSuggestions(
        data.map((suggestion) => ({ ...suggestion, inputType: type }))
      );
    } catch (error) {
      console.error("Error:", error);
      setSuggestions([]);
    }
  };

  const handleInputChange = (id, event) => {
    const value = event.target.value || "";
    setIsProgrammaticChange(false);
    setWaypoints((prev) =>
      prev.map((wp) => (wp.id === id ? { ...wp, city: value } : wp))
    );
    setActiveInput(id);
    setFocusedSuggestionIndex(-1);

    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(value, id).catch((error) => {
        console.error("Error in fetch suggestions:", error);
        setSuggestions([]);
      });
    }, 200);
  };

  const handleSuggestionClick = useCallback(
    (place) => {
      if (
        !place?.display_name ||
        isNaN(parseFloat(place.lat)) ||
        isNaN(parseFloat(place.lon)) ||
        !place.inputType
      ) {
        console.warn("Invalid suggestion:", place);
        return;
      }

      const lat = parseFloat(place.lat);
      const lon = parseFloat(place.lon);
      const type = place.inputType;

      setIsProgrammaticChange(true);
      setWaypoints((prev) =>
        prev.map((wp) =>
          wp.id === type
            ? { ...wp, city: place.display_name, coords: [lat, lon] }
            : wp
        )
      );
      setSavedHistory((prevHistory) => {
        const newHistory = [
          {
            id: `history-${Date.now()}`,
            query: place.display_name,
            timestamp: new Date().toISOString(),
          },
          ...prevHistory.slice(0, 5),
        ];
        return newHistory;
      });
      setSuggestions([]);
      setActiveInput(null);
      setFocusedSuggestionIndex(-1);
      if (type === "to") {
        setShowSidebar(false);
      }
      setIsProgrammaticChange(false);
    },
    [
      setWaypoints,
      setSavedHistory,
      setSuggestions,
      setActiveInput,
      setShowSidebar,
    ]
  );

  const handleKeyDown = (event, wpId) => {
    const relevantSuggestions = relevantSuggestionsMap[wpId] || [];

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocusedSuggestionIndex((prevIndex) =>
        prevIndex < relevantSuggestions.length - 1 ? prevIndex + 1 : 0
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setFocusedSuggestionIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : relevantSuggestions.length - 1
      );
    } else if (event.key === "Enter" && focusedSuggestionIndex >= 0) {
      event.preventDefault();
      if (relevantSuggestions[focusedSuggestionIndex]) {
        handleSuggestionClick(relevantSuggestions[focusedSuggestionIndex]);
      }
    } else if (event.key === "Escape") {
      setSuggestions([]);
      setActiveInput(null);
      setFocusedSuggestionIndex(-1);
    }
  };

  const useMyLocation = async () => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      alert("Geolocation not supported.");
      return;
    }

    setIsProgrammaticChange(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude: lat, longitude: lon } = position.coords;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.status}`);
      }

      const data = await response.json();
      if (!data?.address) {
        console.warn("Invalid geocoding data:", data);
        throw new Error("Invalid geocoding response");
      }

      const cityName =
        data.address.city ||
        data.address.town ||
        data.address.village ||
        "Current Location";

      setWaypoints((prevWaypoints) =>
        prevWaypoints.map((wp) =>
          wp.id === "from" ? { ...wp, city: cityName, coords: [lat, lon] } : wp
        )
      );
      setSavedHistory((prevHistory) => {
        const newHistory = [
          {
            id: `history-${Date.now()}`,
            query: cityName,
            timestamp: new Date().toISOString(),
          },
          ...prevHistory.slice(0, 5),
        ];
        return newHistory;
      });
      setSuggestions([]);
      setActiveInput(null);
    } catch (error) {
      console.error("Geolocation error:", error);
      alert("Failed to detect location.");
    } finally {
      setIsProgrammaticChange(false);
    }
  };

  useEffect(() => {
    if (!activeInput || isProgrammaticChange) {
      return;
    }

    const waypoint = waypoints.find((wp) => wp.id === activeInput);
    if (!waypoint?.city || waypoint.city.length < 2) {
      setSuggestions([]);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(waypoint.city, activeInput).catch((error) => {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      });
    }, 200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [activeInput, isProgrammaticChange, waypoints]);

  useEffect(() => {
    if (selectedSaved && waypoints.length >= 2) {
      setShowDirections(true);
    }
  }, [selectedSaved, waypoints, setShowDirections]);

  const handleDragStart = (event, id) => {
    if (!id || typeof id !== "string") {
      console.warn("Invalid drag ID:", id);
      return;
    }
    event.dataTransfer.setData("id", id);
    setDraggedId(id);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event, targetId) => {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData("id");
    if (!sourceId || sourceId === targetId || typeof targetId !== "string") {
      console.warn("Invalid drop:", { sourceId, targetId });
      setDraggedId(null);
      return;
    }

    if (
      sourceId === "from" ||
      sourceId === "to" ||
      targetId === "from" ||
      targetId === "to"
    ) {
      setDraggedId(null);
      return;
    }

    setWaypoints((prevWaypoints) => {
      const reorderedWaypoints = [...prevWaypoints];
      const sourceIndex = prevWaypoints.findIndex((wp) => wp.id === sourceId);
      const targetIndex = prevWaypoints.findIndex((wp) => wp.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1) {
        console.warn("Invalid indices:", { sourceIndex, targetIndex });
        return prevWaypoints;
      }

      const [movedWaypoint] = reorderedWaypoints.splice(sourceIndex, 1);
      reorderedWaypoints.splice(targetIndex, 0, movedWaypoint);
      return reorderedWaypoints;
    });
    setDraggedId(null);
  };

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
                wp.id !== "from" && wp.id !== "to" ? handleDragOver : undefined
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
                onBlur={() => {
                  setTimeout(() => {
                    if (
                      !document.activeElement.closest(".autocomplete-dropdown")
                    ) {
                      setSuggestions([]);
                      setActiveInput(null);
                    }
                  }, 150);
                }}
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
              {activeInput === wp.id &&
                relevantSuggestionsMap[wp.id]?.length > 0 && (
                  <ul className="autocomplete-dropdown" role="listbox">
                    {relevantSuggestionsMap[wp.id].map((place, index) => (
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
