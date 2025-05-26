import L from "leaflet";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

export const CustomMarkerIcon = (color) =>
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

export const formatDistance = (meters) => {
  if (!meters) return "";
  return (meters / 1000).toFixed(1) + " km";
};

export const formatDuration = (seconds) => {
  if (!seconds) return "";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs > 0 ? hrs + "h " : ""}${mins}m`;
};
