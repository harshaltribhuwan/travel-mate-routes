import React, { useState, useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  useMap,
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
  const [mapZoom, setMapZoom] = useState(5);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((permissionStatus) => {
        if (permissionStatus.state === "granted") {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setMapCenter([pos.coords.latitude, pos.coords.longitude]);
              setMapZoom(13);
            },
            () => {}
          );
        } else {
          const timeout = setTimeout(() => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                setMapCenter([pos.coords.latitude, pos.coords.longitude]);
                setMapZoom(13);
              },
              () => {}
            );
          }, 5000);

          return () => clearTimeout(timeout);
        }
      })
      .catch(() => {
        const timeout = setTimeout(() => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setMapCenter([pos.coords.latitude, pos.coords.longitude]);
              setMapZoom(13);
            },
            () => {}
          );
        }, 5000);

        return () => clearTimeout(timeout);
      });
  }, []);

  const handleDragEnd = (id, e) => {
    const { lat, lng } = e.target.getLatLng();
    setWaypoints((prev) =>
      prev.map((wp) => (wp.id === id ? { ...wp, coords: [lat, lng] } : wp))
    );
  };

  // Memoized array of all coords for smart zoom
  const allLocations = useMemo(() => {
    const coords = waypoints.filter((wp) => wp.coords).map((wp) => wp.coords);
    if (currentLocation) coords.push(currentLocation);
    return coords;
  }, [waypoints, currentLocation]);

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
        <ChangeView
          center={mapCenter}
          zoom={mapZoom}
          waypoints={waypoints}
          currentLocation={currentLocation}
        />

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
