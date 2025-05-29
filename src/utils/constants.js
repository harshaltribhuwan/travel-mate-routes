import L from "leaflet";
export const defaultCenter = [20.5937, 78.9629]; // India center

// utils.js
export const CustomMarkerIcon = (color, heading = null) => {
    const iconSize = [32, 32];
    const iconAnchor = [16, 16];
    const svg = heading
        ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" transform="rotate(${heading})">
         <path fill="${color}" d="M12 2L4 12h6v10h4V12h6L12 2z"/>
       </svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
         <path fill="${color}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
       </svg>`;
    return L.divIcon({
        html: svg,
        className: "custom-marker",
        iconSize,
        iconAnchor,
    });
};