import React from "react";
import { formatDistance, formatDuration } from "../../utils/utils";
import "../../styles/DirectionCityMap.css";

function RouteInfo({ distance, duration }) {
  return (
    distance !== null &&
    duration !== null && (
      <div className="route-info">
        {formatDistance(distance)} • {formatDuration(duration)}
      </div>
    )
  );
}

export default RouteInfo;
