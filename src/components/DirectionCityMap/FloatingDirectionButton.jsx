import React from "react";
import { MdDirections } from "react-icons/md";
import "./FloatingDirectionsButton.scss";

function FloatingDirectionsButton({
  hasValidTo,
  showDirections,
  handleShowDirections,
}) {
  if (!hasValidTo || showDirections) return null;

  return (
    <button
      type="button"
      onClick={handleShowDirections}
      className="floating-directions-button"
      aria-label="Show directions"
      title="Show Directions"
    >
      <MdDirections />
    </button>
  );
}

export default FloatingDirectionsButton;
