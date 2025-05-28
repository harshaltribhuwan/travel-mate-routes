import L from "leaflet";

export const CustomMarkerIcon = (color, heading = null, type = "default") => {
  const iconSize = [48, 64]; // Consistent size
  const iconAnchor = [24, 62]; // Consistent anchor

  // Google-inspired palette
  const palette = {
    primary: "#1a73e8", // Google Blue
    primaryLight: "#4c8bf5", // Lighter blue
    success: "#34a853", // Google Green
    successLight: "#5bb974", // Lighter green for flag
    danger: "#d93025", // Google Red
    surface: "#ffffff", // Clean white
    textPrimary: "#202124", // Dark text/icon
    accent: "#fbbc04", // Google Yellow
  };

  // Ensure flag color is visible
  let flagColor = color;
  if (color.toLowerCase() === palette.success) {
    flagColor = palette.successLight; // Bright green for flag
  } else if (color.toLowerCase() === palette.primary) {
    flagColor = palette.primaryLight; // Bright blue for flag
  } else {
    flagColor = palette.accent; // Fallback to yellow
  }

  // Default marker SVG: Standardized viewBox
  const defaultSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="64" viewBox="0 0 24 40">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${color}" stop-opacity="1" />
          <stop offset="100%" stop-color="${palette.primaryLight}" stop-opacity="0.9" />
        </linearGradient>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.2"/>
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path
        fill="url(#grad)"
        stroke="${palette.surface}"
        stroke-width="1.5"
        filter="url(#shadow)"
        d="M12 8C7.86 8 4.5 12.5 4.5 17.5 4.5 27 12 38 12 38s7.5-11 7.5-20.5C19.5 12.5 16.14 8 12 8z"
      />
      <circle cx="12" cy="17.5" r="5.5" fill="${palette.surface}" filter="url(#glow)" />
      <circle cx="12" cy="17.5" r="3.5" fill="${color}" />
    </svg>`;

  // Destination marker SVG: Standardized viewBox, enhanced flag
  const destinationSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="64" viewBox="0 0 24 40">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${color}" stop-opacity="1" />
          <stop offset="100%" stop-color="${palette.primaryLight}" stop-opacity="0.85" />
        </linearGradient>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.25"/>
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="flagGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="ringGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <!-- Pin body -->
      <path
        fill="url(#grad)"
        stroke="${palette.surface}"
        stroke-width="1.5"
        filter="url(#shadow)"
        d="M12 8C7.86 8 4.5 12.5 4.5 17.5 4.5 27 12 38 12 38s7.5-11 7.5-20.5C19.5 12.5 16.14 8 12 8z"
      />
      <!-- White center circle -->
      <circle cx="12" cy="17.5" r="5.5" fill="${palette.surface}" filter="url(#ringGlow)" />
      <!-- Inner colored circle -->
      <circle cx="12" cy="17.5" r="3.5" fill="${color}" />
      <!-- Flag pole (left of pin, slightly taller) -->
      <rect x="2" y="2" width="1.5" height="14" fill="${palette.textPrimary}" rx="0.3" ry="0.3" filter="url(#shadow)" />
      <!-- Flag (larger, solid color, bold stroke) -->
      <rect
        x="3.5"
        y="2"
        width="9"
        height="6"
        fill="${flagColor}"
        stroke="${palette.textPrimary}"
        stroke-width="1.2"
        filter="url(#flagGlow)"
      >
        <animate
          attributeName="x"
          values="3.5;4;3.5"
          dur="2s"
          repeatCount="indefinite"
        />
      </rect>
      <!-- Outer ring with glow -->
      <circle cx="12" cy="17.5" r="7" stroke="${color}" stroke-width="1.2" fill="none" filter="url(#ringGlow)" />
    </svg>`;

  const svg = type === "to" ? destinationSVG : defaultSVG;

  return L.divIcon({
    html: svg,
    className: "custom-marker",
    iconSize,
    iconAnchor,
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
