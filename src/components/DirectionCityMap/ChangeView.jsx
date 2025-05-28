import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

function ChangeView({ center, zoom, waypoints, currentLocation }) {
  const map = useMap();

  useEffect(() => {
    const hasValidWaypoints =
      Array.isArray(waypoints) &&
      waypoints.length > 1 &&
      waypoints.every((wp) => Array.isArray(wp.coords));

    const allCoords = [
      ...waypoints
        .filter((wp) => Array.isArray(wp.coords))
        .map((wp) => wp.coords),
    ];

    if (Array.isArray(currentLocation)) {
      allCoords.push(currentLocation);
    }

    const MIN_ZOOM = 5;
    const MAX_ZOOM = 16;

    if (allCoords.length > 1) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, {
        padding: [60, 60],
        animate: true,
        maxZoom: MAX_ZOOM,
      });
    } else {
      const adjustedZoom = Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM);
      map.setView(center, adjustedZoom, { animate: true });
    }
  }, [center, zoom, waypoints, currentLocation, map]);

  return null;
}

export default ChangeView;
