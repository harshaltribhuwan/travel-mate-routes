import React from "react";
import { MdChevronRight, MdExpandMore } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import "./CollapsibleSection.scss";

function CollapsibleSection({
  title,
  isOpen,
  setIsOpen,
  items,
  renderItem,
  itemKey,
  emptyMessage,
}) {
  // Animation variants for the header
  const headerVariants = {
    rest: { opacity: 1 },
    hover: { opacity: 0.9 },
    tap: { opacity: 0.95 },
  };

  // Animation variants for the chevron icon
  const chevronVariants = {
    closed: { rotate: 0 },
    open: { rotate: 90, transition: { duration: 0.2, ease: "easeOut" } },
  };

  // Animation variants for the content
  const contentVariants = {
    hidden: {
      height: 0,
      opacity: 0,
      transition: { duration: 0.25, ease: "easeIn" },
    },
    visible: {
      height: "auto",
      opacity: 1,
      transition: {
        height: { duration: 0.35, ease: "easeOut" },
        opacity: { duration: 0.2, ease: "easeOut", delay: 0.1 },
      },
    },
    exit: {
      height: 0,
      opacity: 0,
      transition: {
        height: { duration: 0.25, ease: "easeIn" },
        opacity: { duration: 0.15, ease: "easeIn" },
      },
    },
  };

  // Animation variants for list items
  const itemVariants = {
    hidden: { opacity: 0, y: -5 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: "easeOut", delay: i * 0.05 },
    }),
  };

  // Animation variants for empty message
  const emptyVariants = {
    hidden: { opacity: 0, y: -5 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: "easeOut", delay: 0.15 },
    },
  };

  return (
    <div className={title.toLowerCase().replace(/\s/g, "-")}>
      <motion.h3
        onClick={() => setIsOpen(!isOpen)}
        className="collapsible-header"
        variants={headerVariants}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
      >
        {title}
        <motion.span
          variants={chevronVariants}
          animate={isOpen ? "open" : "closed"}
        >
          {isOpen ? <MdExpandMore /> : <MdChevronRight />}
        </motion.span>
      </motion.h3>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="collapsible-content"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={contentVariants}
          >
            {items && items.length > 0 ? (
              <ul>
                {items.map((item, idx) => (
                  <motion.li
                    key={item[itemKey] || idx}
                    custom={idx}
                    initial="hidden"
                    animate="visible"
                    variants={itemVariants}
                  >
                    {renderItem(item, idx)}
                  </motion.li>
                ))}
              </ul>
            ) : (
              emptyMessage && (
                <motion.p
                  className="empty-message"
                  initial="hidden"
                  animate="visible"
                  variants={emptyVariants}
                >
                  {emptyMessage}
                </motion.p>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CollapsibleSection;
