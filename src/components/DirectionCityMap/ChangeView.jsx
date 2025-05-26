import React, { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

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

export default ChangeView;
