import React, { useEffect } from "react";
import { MdClose, MdMenu } from "react-icons/md";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import SearchForm from "./SearchForm";
import CollapsibleSection from "./CollapsibleSection";
import { formatDistance, formatDuration } from "../../utils/utils";
import { defaultCenter } from "../../utils/constants";
import "./Sidebar.scss";

function Sidebar({
  waypoints,
  setWaypoints,
  suggestions,
  setSuggestions,
  activeInput,
  setActiveInput,
  distance,
  duration,
  alternatives,
  showAlternatives,
  setShowAlternatives,
  showDistanceMatrix,
  setShowDistanceMatrix,
  savedRoutes,
  setSavedRoutes,
  savedHistory,
  setSavedHistory,
  showSavedRoutes,
  setShowSavedRoutes,
  showHistory,
  setShowHistory,
  showSidebar,
  setShowSidebar,
  tracking,
  setTracking,
  mapRef,
  addWaypoint,
  removeWaypoint,
  clearRoute,
  loadRoute,
  loadHistoryItem,
  deleteHistoryItem,
  selectAlternative,
  setDistance,
  setDuration,
  setAlternatives,
}) {
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 100);
    }
  }, [showSidebar, mapRef]);

  const saveRoute = () => {
    if (
      waypoints.length >= 2 &&
      waypoints.every((wp) => wp.coords && wp.coords.length === 2) &&
      !waypoints.every(
        (wp, i) =>
          i > 0 &&
          wp.coords[0] === waypoints[0].coords[0] &&
          wp.coords[1] === waypoints[0].coords[1]
      )
    ) {
      setSavedRoutes((prev) => [
        ...prev,
        {
          waypoints,
          distance,
          duration,
          alternatives,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const deleteRoute = (index) => {
    setSavedRoutes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearRoute = () => {
    setWaypoints([
      { id: "from", city: "", coords: defaultCenter },
      { id: "to", city: "", coords: null },
    ]);
    setDistance(null);
    setDuration(null);
    setAlternatives([]);
    setTracking(false);
    if (mapRef.current) {
      mapRef.current.setView(defaultCenter, 5);
      mapRef.current.invalidateSize();
    }
    clearRoute();
  };

  const handleLoadRoute = (route) => {
    setWaypoints(route.waypoints);
    setDistance(route.distance);
    setDuration(route.duration);
    setAlternatives(route.alternatives || []);
    if (mapRef.current) {
      const bounds = L.latLngBounds(route.waypoints.map((wp) => wp.coords));
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      mapRef.current.invalidateSize();
    }
    loadRoute(route);
    setShowSidebar(false);
  };

  const handleSelectAlternative = (index) => {
    selectAlternative(index);
    if (mapRef.current) {
      mapRef.current.invalidateSize();
    }
  };

  // Animation variants for the sidebar
  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "tween",
        ease: "easeOut",
        duration: 0.35,
      },
    },
    closed: {
      x: "-100%",
      transition: {
        type: "tween",
        ease: "easeIn",
        duration: 0.25,
      },
    },
  };

  // Animation variants for the header
  const headerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut", delay: 0.15 },
    },
  };

  // Animation variants for buttons
  const buttonVariants = {
    rest: { scale: 1, opacity: 1 },
    hover: { scale: 1.05, opacity: 0.85 },
    tap: { scale: 0.95 },
  };

  // Animation variants for content items
  const contentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut", delay: i * 0.1 },
    }),
  };

  return (
    <>
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            className={`sidebar ${showSidebar ? "open" : ""}`}
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
          >
            <motion.div
              className="sidebar-header"
              initial="hidden"
              animate="visible"
              variants={headerVariants}
            >
              <h2>TravelMate Routes</h2>
              <motion.button
                className="sidebar-close"
                onClick={() => setShowSidebar(false)}
                aria-label="Close sidebar"
                title="Close"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <MdClose />
              </motion.button>
            </motion.div>
            <div className="sidebar-content">
              <motion.div
                custom={0}
                initial="hidden"
                animate="visible"
                variants={contentVariants}
              >
                <SearchForm
                  setShowSidebar={setShowSidebar}
                  waypoints={waypoints}
                  setWaypoints={setWaypoints}
                  suggestions={suggestions}
                  setSuggestions={setSuggestions}
                  activeInput={activeInput}
                  setActiveInput={setActiveInput}
                  tracking={tracking}
                  setTracking={setTracking}
                  savedHistory={savedHistory}
                  setSavedHistory={setSavedHistory}
                  addWaypoint={addWaypoint}
                  removeWaypoint={removeWaypoint}
                  saveRoute={saveRoute}
                  clearRoute={handleClearRoute}
                />
              </motion.div>
              {alternatives.length > 0 && (
                <motion.div
                  custom={1}
                  initial="hidden"
                  animate="visible"
                  variants={contentVariants}
                >
                  <CollapsibleSection
                    title="Alternatives"
                    isOpen={showAlternatives}
                    setIsOpen={setShowAlternatives}
                    items={alternatives}
                    renderItem={(alt) => (
                      <button
                        onClick={() => handleSelectAlternative(alt.index)}
                        className="alternative-button"
                        title={`Select Route ${alt.index + 1}`}
                      >
                        Route {alt.index + 1}: {formatDistance(alt.distance)},{" "}
                        {formatDuration(alt.duration)}
                      </button>
                    )}
                    itemKey="index"
                  />
                </motion.div>
              )}
              {waypoints.length > 2 && Array.isArray(distance) && (
                <motion.div
                  custom={2}
                  initial="hidden"
                  animate="visible"
                  variants={contentVariants}
                >
                  <CollapsibleSection
                    title="Segments"
                    isOpen={showDistanceMatrix}
                    setIsOpen={setShowDistanceMatrix}
                    items={waypoints.slice(0, -1).map((wp, i) => ({
                      id: i,
                      content: `${wp.city} to ${
                        waypoints[i + 1].city
                      }: ${formatDistance(distance / (waypoints.length - 1))}`,
                    }))}
                    renderItem={(item) => item.content}
                    itemKey="id"
                  />
                </motion.div>
              )}
              <motion.div
                custom={3}
                initial="hidden"
                animate="visible"
                variants={contentVariants}
              >
                <CollapsibleSection
                  title="Saved Routes"
                  isOpen={showSavedRoutes}
                  setIsOpen={setShowSavedRoutes}
                  items={savedRoutes}
                  renderItem={(route, idx) => (
                    <div className="route-item">
                      <button
                        onClick={() => handleLoadRoute(route)}
                        className="load-route"
                        aria-label={`Load route from ${
                          route.waypoints[0].city
                        } to ${
                          route.waypoints[route.waypoints.length - 1].city
                        }`}
                        title="Load Route"
                      >
                        {route.waypoints[0].city} to{" "}
                        {route.waypoints[route.waypoints.length - 1].city} (
                        {formatDistance(route.distance)},{" "}
                        {formatDuration(route.duration)})
                      </button>
                      <button
                        onClick={() => deleteRoute(idx)}
                        className="delete-route"
                        aria-label="Delete route"
                        title="Delete"
                      >
                        <MdClose />
                      </button>
                    </div>
                  )}
                  itemKey="idx"
                  emptyMessage="No saved routes"
                />
              </motion.div>
              <motion.div
                custom={4}
                initial="hidden"
                animate="visible"
                variants={contentVariants}
              >
                <CollapsibleSection
                  title="History"
                  isOpen={showHistory}
                  setIsOpen={setShowHistory}
                  items={savedHistory}
                  renderItem={(item, idx) => (
                    <div className="history-item">
                      <button
                        onClick={() => loadHistoryItem(item)}
                        className="load-history"
                        aria-label={`Load search: ${item.query}`}
                        title="Load Search"
                      >
                        {item.query}
                      </button>
                      <button
                        onClick={() => deleteHistoryItem(idx)}
                        className="delete-history"
                        aria-label="Delete search"
                        title="Delete"
                      >
                        <MdClose />
                      </button>
                    </div>
                  )}
                  itemKey="id"
                  emptyMessage="No recent searches"
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {!showSidebar && (
          <motion.button
            className="sidebar-open"
            onClick={() => setShowSidebar(true)}
            aria-label="Open sidebar"
            title="Open Sidebar"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <MdMenu />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

export default Sidebar;
