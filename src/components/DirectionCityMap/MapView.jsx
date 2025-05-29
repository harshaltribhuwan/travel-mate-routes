import React, { useState, useEffect, useMemo } from "react";
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
  const [currentTileLayer, setCurrentTileLayer] = useState("OpenStreetMap");

  const tileLayers = {
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
  };

  useEffect(() => {
    if (!navigator.geolocation) return;

    // Only set initial center if no waypoints are provided
    const toWaypoint = waypoints.find((wp) => wp.id === "to");
    const hasValidTo =
      toWaypoint?.coords &&
      Array.isArray(toWaypoint.coords) &&
      toWaypoint.coords.length === 2 &&
      !isNaN(toWaypoint.coords[0]) &&
      !isNaN(toWaypoint.coords[1]);

    if (!hasValidTo) {
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
    }
  }, []);

  useEffect(() => {
    // Update map center and zoom based on waypoints
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

    if (hasValidTo) {
      setMapCenter(toWaypoint.coords);
      setMapZoom(13);
    } else if (hasValidFrom) {
      setMapCenter(fromWaypoint.coords);
      setMapZoom(13);
    }
  }, [waypoints]);

  const handleDragEnd = (id, e) => {
    const { lat, lng } = e.target.getLatLng();
    setWaypoints((prev) =>
      prev.map((wp) => (wp.id === id ? { ...wp, coords: [lat, lng] } : wp))
    );
  };

  const allLocations = useMemo(() => {
    const coords = waypoints.filter((wp) => wp.coords).map((wp) => wp.coords);
    if (currentLocation) coords.push(currentLocation);
    return coords;
  }, [waypoints, currentLocation]);

  const hasValidRoute = waypoints.every((wp) =>
    wp.id === "from" || wp.id === "to"
      ? wp.coords &&
        Array.isArray(wp.coords) &&
        wp.coords.length === 2 &&
        !isNaN(wp.coords[0]) &&
        !isNaN(wp.coords[1])
      : true
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
        key={mapCenter.join(",") + "-" + mapZoom}
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
