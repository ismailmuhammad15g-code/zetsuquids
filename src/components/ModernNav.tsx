"use client";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import "./ModernNav.css";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
}

interface ModernNavProps {
  items: NavItem[];
}

const ModernNav = ({ items }: ModernNavProps) => {
  const pathname = usePathname();
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Sync active index with current route
  useEffect(() => {
    const index = items.findIndex((item) => {
      if (typeof item.isActive !== "undefined") {
        return item.isActive;
      }
      return item.href === pathname;
    });

    if (index !== -1) {
      setActiveIndex(index);
    }
  }, [pathname, items]);

  return (
    <div className="modern-nav-container">
      {items.map((item, index) => {
        const isActive = activeIndex === index;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="modern-nav-item"
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
