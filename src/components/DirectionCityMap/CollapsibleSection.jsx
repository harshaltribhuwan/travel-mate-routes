import React from "react";
import { MdChevronRight, MdExpandMore } from "react-icons/md";
import "./CollapsibleSection.scss";

function CollapsibleSection({
  title,
  isOpen,
  setIsOpen,
  items = [],
  renderItem,
  itemKey,
  emptyMessage = "No items found.",
  id = null,
}) {
  const sectionId = id || title.toLowerCase().replace(/\s+/g, "-");
  const contentId = `${sectionId}-content`;

  const toggleSection = () => setIsOpen(!isOpen);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleSection();
    }
  };

  return (
    <div className={`collapsible-section ${sectionId}`}>
      <h3
        className="collapsible-header"
        onClick={toggleSection}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        {title} {isOpen ? <MdExpandMore /> : <MdChevronRight />}
      </h3>

      {isOpen && (
        <div className="collapsible-content" id={contentId}>
          {items.length > 0 ? (
            <ul>
              {items.map((item, idx) => (
                <li key={item[itemKey] || `${sectionId}-${idx}`}>
                  {renderItem(item, idx)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-message">{emptyMessage}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default CollapsibleSection;
