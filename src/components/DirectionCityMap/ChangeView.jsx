import { useEffect, useMemo } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

function ChangeView({ center, zoom, waypoints, currentLocation }) {
  const map = useMap();

  // Memoize valid coordinates to avoid redundant processing
  const allCoords = useMemo(() => {
    const coords = waypoints
      .filter(
        (wp) =>
          Array.isArray(wp.coords) &&
          wp.coords.length === 2 &&
          !isNaN(wp.coords[0]) &&
          !isNaN(wp.coords[1])
      )
      .map((wp) => wp.coords);

    if (
      Array.isArray(currentLocation) &&
      currentLocation.length === 2 &&
      !isNaN(currentLocation[0]) &&
      !isNaN(currentLocation[1])
    ) {
      coords.push(currentLocation);
    }

    return coords;
  }, [waypoints, currentLocation]);

  useEffect(() => {
    if (!map) {
      console.warn("Map instance not available");
      return;
    }

    const MIN_ZOOM = 5;
    const MAX_ZOOM = 16;

    if (allCoords.length > 1) {
      try {
        const bounds = L.latLngBounds(allCoords);
        map.fitBounds(bounds, {
          padding: [60, 60],
          animate: true,
          maxZoom: MAX_ZOOM,
        });
      } catch (error) {
        console.warn("Failed to fit bounds:", error);
        const adjustedZoom = Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM);
        map.setView(center, adjustedZoom, { animate: true });
      }
    } else if (allCoords.length === 1) {
      const adjustedZoom = Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM);
      map.setView(allCoords[0], adjustedZoom, { animate: true });
    } else {
      const adjustedZoom = Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM);
      map.setView(center, adjustedZoom, { animate: true });
    }
  }, [allCoords, center, zoom]); // Removed map from dependencies

  return null;
}

export default ChangeView;
