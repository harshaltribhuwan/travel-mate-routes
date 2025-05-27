import React from "react";
import { MdChevronRight, MdExpandMore } from "react-icons/md";
import "../../styles/DirectionCityMap.scss";

function CollapsibleSection({
  title,
  isOpen,
  setIsOpen,
  items,
  renderItem,
  itemKey,
  emptyMessage,
}) {
  return (
    <div className={title.toLowerCase().replace(/\s/g, "-")}>
      <h3 onClick={() => setIsOpen(!isOpen)} className="collapsible-header">
        {title} {isOpen ? <MdExpandMore /> : <MdChevronRight />}
      </h3>
      {isOpen && (
        <div className="collapsible-content">
          {items && items.length > 0 ? (
            <ul>
              {items.map((item, idx) => (
                <li key={item[itemKey] || idx}>{renderItem(item, idx)}</li>
              ))}
            </ul>
          ) : (
            emptyMessage && <p className="empty-message">{emptyMessage}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default CollapsibleSection;
