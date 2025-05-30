import React, { createContext, useContext, useMemo, useState } from "react";

const DirectionsContext = createContext();

export function DirectionsProvider({
  waypoints,
  setWaypoints,
  setShowSidebar,
  children,
}) {
  if (typeof setShowSidebar !== "function") {
    console.warn("setShowSidebar is not a function:", setShowSidebar);
  }

  const [showDirections, setShowDirections] = useState(false);

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

  const handleShowDirections = () => {
    setShowDirections(true);
    setWaypoints((prevWaypoints) => {
      if (prevWaypoints.some((wp) => wp.id === "from")) {
        return prevWaypoints;
      }
      return [{ id: "from", city: "", coords: null }, ...prevWaypoints];
    });
  };

  return (
    <DirectionsContext.Provider
      value={{
        showDirections,
        setShowDirections,
        hasValidTo,
        handleShowDirections,
        setShowSidebar,
      }}
    >
      {children}
    </DirectionsContext.Provider>
  );
}

export const useDirections = () => {
  const context = useContext(DirectionsContext);
  if (!context) {
    throw new Error("useDirections must be used within a DirectionsProvider");
  }
  return context;
};
