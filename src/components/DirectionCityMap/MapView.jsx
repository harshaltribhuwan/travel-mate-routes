import React from "react";
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
  const handleDragEnd = (id, e) => {
    const { lat, lng } = e.target.getLatLng();
    setWaypoints((prev) =>
      prev.map((wp) => (wp.id === id ? { ...wp, coords: [lat, lng] } : wp))
    );
  };

  return (
    <div className={`map-container ${!showSidebar ? "full-width" : ""}`}>
      <MapContainer
        center={waypoints[0].coords || defaultCenter}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        whenCreated={(map) => {
          mapRef.current = map;
          map.invalidateSize();
        }}
        zoomControl={false}
        key={waypoints.map((wp) => wp.coords?.join(",") || wp.id).join("-")}
      >
        <ZoomControl position="bottomleft" />
        <ChangeView
          center={waypoints.find((wp) => wp.coords)?.coords || defaultCenter}
          zoom={waypoints.some((wp) => wp.coords) ? 7 : 5}
          waypoints={waypoints}
        />
        <TileLayer
          attribution='© <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
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
        {currentLocation && (
          <Marker position={currentLocation} icon={CustomMarkerIcon("#EF5350")}>
            <Popup>Current Location</Popup>
          </Marker>
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
