import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import ChangeView from "./ChangeView";
import Routing from "./Routing";
import { CustomMarkerIcon } from "../../utils/utils";
import { defaultCenter } from "../../utils/constants";

function MapView({
  waypoints,
  setWaypoints,
  currentLocation,
  distance,
  setDistance,
  duration,
  setDuration,
  alternatives,
  setAlternatives,
  showSidebar,
  mapRef,
  routeControlRef,
}) {
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(5); // Zoomed-out view of India

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = [
              position.coords.latitude,
              position.coords.longitude,
            ];
            setMapCenter(coords);
            setMapZoom(13); // Zoom in to user location
          },
          () => {
            // Permission denied or error — stay on default center and zoom
          }
        );
      }
    }, 5000); // Delay permission request by 5s

    return () => clearTimeout(timeout);
  }, []);

  const handleDragEnd = (id, e) => {
    const { lat, lng } = e.target.getLatLng();
    setWaypoints((prev) =>
      prev.map((wp) => (wp.id === id ? { ...wp, coords: [lat, lng] } : wp))
    );
  };

  return (
    <div className={`map-container ${!showSidebar ? "full-width" : ""}`}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        whenCreated={(map) => {
          mapRef.current = map;
          map.invalidateSize();
        }}
        zoomControl={false}
        key={mapCenter.join(",") + "-" + mapZoom}
      >
        <ZoomControl position="bottomleft" />
        <ChangeView center={mapCenter} zoom={mapZoom} />

        <TileLayer
          attribution='© <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {currentLocation && (
          <Marker position={currentLocation} icon={CustomMarkerIcon("#EF5350")}>
            <Popup>Current Location</Popup>
          </Marker>
        )}

        {waypoints.map(
          (wp) =>
            wp.coords && (
              <Marker
                key={wp.id}
                position={wp.coords}
                icon={
                  wp.id === "from"
                    ? CustomMarkerIcon("#26A69A")
                    : wp.id === "to"
                    ? CustomMarkerIcon("#2ECC71")
                    : CustomMarkerIcon("#666666")
                }
                draggable={true}
                eventHandlers={{ dragend: (e) => handleDragEnd(wp.id, e) }}
              >
                <Popup>{wp.city || wp.id}</Popup>
              </Marker>
            )
        )}

        {waypoints.every((wp) => wp.coords) && (
          <Routing
            waypoints={waypoints}
            setDistance={setDistance}
            setDuration={setDuration}
            setAlternatives={setAlternatives}
            routeControlRef={routeControlRef}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default MapView;
