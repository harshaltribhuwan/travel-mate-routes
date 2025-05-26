import React from "react";
import { MdExpandMore, MdExpandLess } from "react-icons/md";
import "../../styles/DirectionCityMap.css";

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
        {title} {isOpen ? <MdExpandLess /> : <MdExpandMore />}
      </h3>
      {isOpen && (
        <>
          {items && items.length > 0 ? (
            <ul>
              {items.map((item, idx) => (
                <li key={item[itemKey] || idx}>{renderItem(item, idx)}</li>
              ))}
            </ul>
          ) : (
            emptyMessage && <p className="empty-message">{emptyMessage}</p>
          )}
        </>
      )}
    </div>
  );
}

export default CollapsibleSection;
