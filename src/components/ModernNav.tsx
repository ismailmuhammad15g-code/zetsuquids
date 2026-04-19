// Type definitions for ModernNav

interface ModernNavProps {
  // Add prop types here
}

// Event handler types
type HandleEvent = (e: React.SyntheticEvent<any>) => void;

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./ModernNav.css";

const ModernNav = ({ items }) => {
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);

  // Sync active index with current route
  useEffect(() => {
    const index = items.findIndex((item) => {
      if (typeof item.isActive !== "undefined") {
        return item.isActive;
      }
      return item.href === location.pathname;
    });

    if (index !== -1) {
      setActiveIndex(index);
    }
  }, [location.pathname, items]);

  return (
    <div className="modern-nav-container">
      {items.map((item, index) => {
        const isActive = activeIndex === index;
        
        return (
          <Link
            key={item.href}
            to={item.href}
            className={`modern-nav-item ${isActive ? "active" : ""}`}
            onClick={() => setActiveIndex(index)}
          >
            {item.icon}
            <span>{item.label}</span>
            
            {isActive && (
              <motion.div
                layoutId="modern-pill"
                className="modern-nav-pill"
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 30,
                }}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default ModernNav;

