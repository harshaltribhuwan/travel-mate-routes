import React from "react";
import { MdDirections } from "react-icons/md";
import { useDirections } from "./DirectionsContext";
import "./FloatingDirectionsButton.scss";

function FloatingDirectionsButton() {
  const { hasValidTo, showDirections, handleShowDirections, setShowSidebar } =
    useDirections();

  if (!hasValidTo || showDirections) return null;

  const handleClick = () => {
    handleShowDirections();
    setShowSidebar(true); // Open Sidebar
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="floating-directions-button"
      aria-label="Show directions"
      title="Show Directions"
    >
      <MdDirections />
    </button>
  );
}

export default FloatingDirectionsButton;
