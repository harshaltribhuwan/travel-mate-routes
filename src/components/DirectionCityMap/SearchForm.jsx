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
  const [showDirections, setShowDirections] = useState(false);
  const [draggedId, setDraggedId] = useState(null);
  const [isProgrammaticChange, setIsProgrammaticChange] = useState(false); // New state to track programmatic changes

  const fetchSuggestions = useCallback(
    async (value, type) => {
      if (typeof value !== "string" || value.length < 2 || !type) {
        setSuggestions([]);
        return;
      }

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            value
          )}&limit=5&addressdetails=1`
        );
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data)) {
          console.warn("Invalid suggestion data:", data);
          setSuggestions([]);
          return;
        }
        setSuggestions(data.map((p) => ({ ...p, inputType: type })));
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      }
    },
    [setSuggestions]
  );

  const handleInputChange = useCallback(
    (id, e) => {
      const value = e.target.value?.trim() || "";
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

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(value, id).catch((error) => {
          console.error("Error in debounced fetchSuggestions:", error);
          setSuggestions([]);
        });
      }, 500);
    },
    [
      setWaypoints,
      setActiveInput,
      setSuggestions,
      setFocusedSuggestionIndex,
      fetchSuggestions,
    ]
  );

  const handleSuggestionClick = useCallback(
    (place) => {
      if (
        !place ||
        !place.display_name ||
        isNaN(parseFloat(place.lat)) ||
        isNaN(parseFloat(place.lon)) ||
        !place.inputType
      ) {
        console.warn("Invalid suggestion data:", place);
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
      setSavedHistory((prev) => {
        const newHistory = [
          {
            id: `hist${Date.now()}`,
            query: place.display_name,
            timestamp: new Date().toISOString(),
          },
          ...prev.slice(0, 10),
        ];
        return newHistory;
      });
      setSuggestions([]);
      setActiveInput(null);
      setFocusedSuggestionIndex(-1);
      if (type === "to") setShowSidebar(false);
      setIsProgrammaticChange(false);
    },
    [
      setWaypoints,
      setSavedHistory,
      setSuggestions,
      setActiveInput,
      setFocusedSuggestionIndex,
      setShowSidebar,
    ]
  );

  const handleKeyDown = useCallback(
    (e, wpId) => {
      const relevantSuggestions = useMemo(
        () => suggestions.filter((s) => s.inputType === wpId),
        [suggestions, wpId]
      );

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
        if (relevantSuggestions[focusedSuggestionIndex]) {
          handleSuggestionClick(relevantSuggestions[focusedSuggestionIndex]);
        }
      } else if (e.key === "Escape") {
        setSuggestions([]);
        setActiveInput(null);
        setFocusedSuggestionIndex(-1);
      }
    },
    [
      suggestions,
      focusedSuggestionIndex,
      setFocusedSuggestionIndex,
      setSuggestions,
      setActiveInput,
      handleSuggestionClick,
    ]
  );

  const useMyLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      alert("Geolocation not supported.");
      return;
    }

    setIsProgrammaticChange(true);
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude: lat, longitude: lon } = pos.coords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      if (!res.ok) throw new Error(`Reverse geocoding failed: ${res.status}`);

      const data = await res.json();
      if (!data?.address) {
        console.warn("Invalid reverse geocoding data:", data);
        throw new Error("Invalid geocoding response");
      }

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
          ...prev.slice(0, 10),
        ];
        return newHistory;
      });
      setSuggestions([]);
      setActiveInput(null);
      setIsProgrammaticChange(false);
    } catch (err) {
      console.error("Error in useMyLocation:", err);
      alert("Failed to detect location.");
      setIsProgrammaticChange(false);
    }
  }, [setWaypoints, setSavedHistory, setSuggestions, setActiveInput]);

  useEffect(() => {
    if (!activeInput || isProgrammaticChange) return;

    const waypoint = waypoints.find((wp) => wp.id === activeInput);
    if (!waypoint?.city || waypoint.city.length < 2) {
      setSuggestions([]);
      return;
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(waypoint.city, activeInput).catch((error) => {
        console.error("Error in debounced fetchSuggestions:", error);
        setSuggestions([]);
      });
    }, 500);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [waypoints, activeInput, isProgrammaticChange, fetchSuggestions]);

  useEffect(() => {
    if (selectedSaved && waypoints.length >= 2) {
      setShowDirections(true);
    }
  }, [selectedSaved, waypoints]);

  const handleShowDirections = useCallback(() => {
    setShowDirections(true);
    setWaypoints((prev) => {
      if (prev.some((wp) => wp.id === "from")) return prev;
      return [{ id: "from", city: "", coords: null }, ...prev];
    });
  }, [setShowDirections, setWaypoints]);

  const handleDragStart = useCallback(
    (e, id) => {
      if (!id) return;
      e.dataTransfer.setData("text/plain", id);
      setDraggedId(id);
    },
    [setDraggedId]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e, targetId) => {
      e.preventDefault();
      const sourceId = e.dataTransfer.getData("text/plain");
      if (!sourceId || sourceId === targetId) return;

      if (
        sourceId === "from" ||
        sourceId === "to" ||
        targetId === "from" ||
        targetId === "to"
      ) {
        setDraggedId(null);
        return;
      }

      setWaypoints((prev) => {
        const reorderedWaypoints = [...prev];
        const sourceIndex = prev.findIndex((wp) => wp.id === sourceId);
        const targetIndex = prev.findIndex((wp) => wp.id === targetId);

        if (sourceIndex === -1 || targetIndex === -1) {
          console.warn("Invalid drag indices:", sourceIndex, targetIndex);
          return prev;
        }

        const [movedWaypoint] = reorderedWaypoints.splice(sourceIndex, 1);
        reorderedWaypoints.splice(targetIndex, 0, movedWaypoint);
        return reorderedWaypoints;
      });
      setDraggedId(null);
    },
    [setWaypoints, setDraggedId]
  );

  const toWaypoint = useMemo(
    () => waypoints.find((wp) => wp.id === "to"),
    [waypoints]
  );

  const hasValidTo = useMemo(
    () =>
      toWaypoint?.coords &&
      Array.isArray(toWaypoint.coords) &&
      toWaypoint.coords.length === 2 &&
      !isNaN(toWaypoint.coords[0]) &&
      !isNaN(toWaypoint.coords[1]),
    [toWaypoint]
  );

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
