import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";

function Routing({
  waypoints,
  setDistance,
  setDuration,
  setAlternatives,
  routeControlRef,
}) {
  const map = useMap();
  const localRouteControlRef = useRef(null);

  useEffect(() => {
    if (
      !map ||
      !waypoints ||
      waypoints.length < 2 ||
      !waypoints.every(
        (wp) => wp.coords && Array.isArray(wp.coords) && wp.coords.length === 2
      )
    ) {
      if (localRouteControlRef.current) {
        map.removeControl(localRouteControlRef.current);
        console.log("Removed routing control due to invalid waypoints");
        localRouteControlRef.current = null;
      }
      setDistance(null);
      setDuration(null);
      setAlternatives([]);
      return;
    }

    // Remove existing control to prevent overlap
    if (localRouteControlRef.current) {
      map.removeControl(localRouteControlRef.current);
      console.log("Removed existing routing control");
      localRouteControlRef.current = null;
    }

    try {
      const control = L.Routing.control({
        waypoints: waypoints.map((wp) => L.latLng(wp.coords[0], wp.coords[1])),
        routeWhileDragging: true,
        showAlternatives: true,
        lineOptions: {
          styles: [{ color: "#26A69A", opacity: 1, weight: 4 }],
          extendToWaypoints: true,
          missingRouteTolerance: 0,
        },
        altLineOptions: {
          styles: [
            { color: "#26A69A", opacity: 0.6, weight: 4 },
            { color: "#FF9800", opacity: 0.6, weight: 4 },
          ],
          extendToWaypoints: true,
          missingRouteTolerance: 0,
        },
        router: L.Routing.osrmv1({
          serviceUrl: "https://router.project-osrm.org/route/v1",
          profile: "driving",
          alternatives: true,
          steps: true,
        }),
        createMarker: () => null,
        containerClassName: "leaflet-routing-container",
        fitSelectedRoutes: "smart",
        show: true,
        collapsible: true,
        autoRoute: true,
        plan: L.Routing.plan(
          waypoints.map((wp) => L.latLng(wp.coords[0], wp.coords[1])),
          {
            createMarker: () => null,
            routeWhileDragging: true,
          }
        ),
      })
        .on("routesfound", (e) => {
          const routes = e.routes;
          console.log("Routes found:", routes.length, routes); // Debug
          if (routes[0]) {
            setDistance(routes[0].summary.totalDistance);
            setDuration(routes[0].summary.totalTime);
            setAlternatives(
              routes.map((r, idx) => ({
                index: idx,
                distance: r.summary.totalDistance,
                duration: r.summary.totalTime,
                coordinates: r.coordinates, // Store for switching
              }))
            );
          }
        })
        .on("routeselected", (e) => {
          console.log("Route selected:", e.route); // Debug
        })
        .on("routingerror", (err) => {
          console.error("Routing error:", err);
          setDistance(null);
          setDuration(null);
          setAlternatives([]);
        })
        .addTo(map);

      localRouteControlRef.current = control;
      if (routeControlRef) {
        routeControlRef.current = control;
        console.log("Updated routeControlRef");
      }
    } catch (err) {
      console.error("Failed to create routing control:", err);
      setDistance(null);
      setDuration(null);
      setAlternatives([]);
    }

    return () => {
      if (localRouteControlRef.current) {
        map.removeControl(localRouteControlRef.current);
        console.log("Cleaned up routing control");
        localRouteControlRef.current = null;
      }
    };
  }, [
    waypoints,
    map,
    setDistance,
    setDuration,
    setAlternatives,
    routeControlRef,
  ]);

  return null;
}

export default Routing;
