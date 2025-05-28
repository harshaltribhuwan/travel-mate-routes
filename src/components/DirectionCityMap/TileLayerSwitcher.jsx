import React, { useEffect } from "react";
import { FaSatelliteDish } from "react-icons/fa";
import { MdMap, MdWbSunny, MdNightsStay } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import "./TileLayerSwitcher.scss";

const iconMap = {
  "Classic Street": <MdMap size={22} />,
  "Standard View": <MdWbSunny size={22} />,
  "Satellite View": <FaSatelliteDish size={22} />,
  "Dark Mode": <MdNightsStay size={22} />,
};

function TileLayerSwitcher({
  tileLayers,
  currentTileLayer,
  setCurrentTileLayer,
}) {
  useEffect(() => {
    const stored = localStorage.getItem("preferredTileLayer");
    if (stored && tileLayers[stored]) {
      setCurrentTileLayer(stored);
    } else {
      setCurrentTileLayer("Classic Street");
    }
  }, []);

  const handleSelect = (key) => {
    setCurrentTileLayer(key);
    localStorage.setItem("preferredTileLayer", key);
  };

  // Animation variants for switcher
  const switcherVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut", delay: 0.5 },
    },
  };

  // Animation variants for buttons
  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      transition: { duration: 0.2, ease: "easeOut", delay: i * 0.1 },
    }),
    hover: { opacity: 0.85 },
    tap: { scale: 0.95 },
  };

  return (
    <AnimatePresence>
      <motion.nav
        className="tile-layer-switcher"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={switcherVariants}
        aria-label="Map layer selector"
      >
        {Object.keys(tileLayers).map((key, idx) => (
          <motion.button
            key={key}
            custom={idx}
            initial="hidden"
            animate="visible"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => handleSelect(key)}
            className={`tile-option ${
              currentTileLayer === key ? "active" : ""
            }`}
            title={tileLayers[key].name}
            type="button"
            aria-pressed={currentTileLayer === key}
            data-title={tileLayers[key].name}
          >
            <span className="icon">{iconMap[key]}</span>
          </motion.button>
        ))}
      </motion.nav>
    </AnimatePresence>
  );
}

export default TileLayerSwitcher;
