import L from "leaflet";

import markerShadow from "leaflet/dist/images/marker-shadow.png";

export const CustomMarkerIcon = (color, type = "default") => {
  const iconSize = [36, 44]; // keep same
  const iconAnchor = [18, 44];
  const popupAnchor = [0, -44];

  const baseMarkerSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36">
      <path fill="${color}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>`;

  const flagSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="24" viewBox="0 0 24 24" style="position:absolute; left:14px; top:-10px;">
      <rect x="10" y="0" width="2" height="18" fill="#202124" rx="0.3" ry="0.3" />
      <polygon points="12,0 22,7 12,14" fill="#1a73e8" />
    </svg>`;

  const html =
    type === "to"
      ? `<div style="position:relative; width:36px; height:44px;">${flagSVG}${baseMarkerSVG}</div>`
      : baseMarkerSVG;

  return L.divIcon({
    html,
    className: "custom-marker",
    iconSize,
    iconAnchor,
    popupAnchor,
    shadowUrl: markerShadow,
    shadowSize: [41, 41],
  });
};



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
