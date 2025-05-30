import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import TileLayerSwitcher from "./TileLayerSwitcher";
import "./MapView.scss";

function MapView({
  waypoints,
  setWaypoints,
  currentLocation,
  setDistance,
  setDuration,
  setAlternatives,
  showSidebar,
  mapRef,
  routeControlRef,
}) {
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(5);
  const [currentTileLayer, setCurrentTileLayer] = useState("OpenStreetMap");

  // Memoize tileLayers to avoid re-creation
  const tileLayers = useMemo(
    () => ({
      "Classic Street": {
        name: "Classic Street",
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution:
          '© <a href="https://osm.org/copyright">OpenStreetMap</a> contributors',
      },
      "Standard View": {
        name: "Standard View",
        url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        attribution: '© <a href="https://carto.com/">CartoDB</a>',
      },
      "Satellite View": {
        name: "Satellite View",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution:
          "Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, and others",
      },
      "Dark Mode": {
        name: "Dark Mode",
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attribution: '© <a href="https://carto.com/">CartoDB</a>',
      },
    }),
    []
  );

  // Consolidated geolocation logic
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      return;
    }

    const toWaypoint = waypoints.find((wp) => wp.id === "to");
    const hasValidTo =
      toWaypoint?.coords &&
      Array.isArray(toWaypoint.coords) &&
      toWaypoint.coords.length === 2 &&
      !isNaN(toWaypoint.coords[0]) &&
      !isNaN(toWaypoint.coords[1]);

    if (hasValidTo) return; // Skip geolocation if valid "to" waypoint exists

    const attemptGeolocation = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setMapCenter([latitude, longitude]);
          setMapZoom(13);
        },
        (error) => {
          console.warn("Geolocation failed:", error);
          // Keep defaultCenter, no further action needed
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((permissionStatus) => {
        if (permissionStatus.state === "granted") {
          attemptGeolocation();
        } else {
          const timeout = setTimeout(attemptGeolocation, 5000);
          return () => clearTimeout(timeout);
        }
      })
      .catch((error) => {
        console.warn("Permission query failed:", error);
        const timeout = setTimeout(attemptGeolocation, 5000);
        return () => clearTimeout(timeout);
      });
  }, [waypoints]);

  // Update map center/zoom only on significant waypoint changes
  useEffect(() => {
    const toWaypoint = waypoints.find((wp) => wp.id === "to");
    const fromWaypoint = waypoints.find((wp) => wp.id === "from");
    const hasValidTo =
      toWaypoint?.coords &&
      Array.isArray(toWaypoint.coords) &&
      toWaypoint.coords.length === 2 &&
      !isNaN(toWaypoint.coords[0]) &&
      !isNaN(toWaypoint.coords[1]);
    const hasValidFrom =
      fromWaypoint?.coords &&
      Array.isArray(fromWaypoint.coords) &&
      fromWaypoint.coords.length === 2 &&
      !isNaN(fromWaypoint.coords[0]) &&
      !isNaN(fromWaypoint.coords[1]);

    // Only update if coordinates are new to prevent blinking
    if (
      hasValidTo &&
      JSON.stringify(toWaypoint.coords) !== JSON.stringify(mapCenter)
    ) {
      setMapCenter(toWaypoint.coords);
      setMapZoom(13);
    } else if (
      hasValidFrom &&
      !hasValidTo &&
      JSON.stringify(fromWaypoint.coords) !== JSON.stringify(mapCenter)
    ) {
      setMapCenter(fromWaypoint.coords);
      setMapZoom(13);
    }
  }, [waypoints, mapCenter]);

  const handleDragEnd = useCallback(
    (id, e) => {
      const latLng = e.target?.getLatLng();
      if (!latLng || isNaN(latLng.lat) || isNaN(latLng.lng)) {
        console.warn("Invalid drag coordinates for waypoint:", id);
        return;
      }
      const { lat, lng } = latLng;
      setWaypoints((prev) =>
        prev.map((wp) => (wp.id === id ? { ...wp, coords: [lat, lng] } : wp))
      );
    },
    [setWaypoints]
  );

  const hasValidRoute = useMemo(
    () =>
      waypoints.every((wp) =>
        wp.id === "from" || wp.id === "to"
          ? wp.coords &&
            Array.isArray(wp.coords) &&
            wp.coords.length === 2 &&
            !isNaN(wp.coords[0]) &&
            !isNaN(wp.coords[1])
          : true
      ),
    [waypoints]
  );

  return (
    <div className={`map-container ${!showSidebar ? "full-width" : ""}`}>
      <TileLayerSwitcher
        tileLayers={tileLayers}
        currentTileLayer={currentTileLayer}
        setCurrentTileLayer={setCurrentTileLayer}
      />

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
      >
        <ZoomControl position="bottomleft" />
        <ChangeView
          center={mapCenter}
          zoom={mapZoom}
          waypoints={waypoints}
          currentLocation={currentLocation}
        />

        {tileLayers[currentTileLayer] && (
          <TileLayer
            attribution={tileLayers[currentTileLayer].attribution}
            url={tileLayers[currentTileLayer].url}
          />
        )}

        {currentLocation && (
          <Marker position={currentLocation} icon={CustomMarkerIcon("#d93025")}>
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
                    ? CustomMarkerIcon("#1a73e8")
                    : wp.id === "to"
                    ? CustomMarkerIcon("#34a853", "to")
                    : CustomMarkerIcon("#616161")
                }
                draggable
                eventHandlers={{ dragend: (e) => handleDragEnd(wp.id, e) }}
              >
                <Popup>{wp.city || wp.id}</Popup>
              </Marker>
            )
        )}

        {hasValidRoute && (
          <Routing
            waypoints={waypoints}
            setDistance={setDistance}
            setDuration={setDuration}
            setAlternatives={setAlternatives}
            routeControlRef={routeControlRef}
            currentLocation={currentLocation}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default MapView;
