import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  faBars,
  faChevronDown,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import "./NavBar.css";
import { ActivePagesForNavBar } from "./ActivePagesForNavBar";

const NavBar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [submenuPositions, setSubmenuPositions] = useState({});
  const itemRefs = useRef({});
  const submenuRefs = useRef({});

  // ---------- Luk floating submenu når der klikkes udenfor ----------
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isCollapsed) return;

      let clickedInsideAnySubmenu = false;

      Object.values(submenuRefs.current).forEach((submenuEl) => {
        if (submenuEl && submenuEl.contains(event.target)) {
          clickedInsideAnySubmenu = true;
        }
      });

      Object.values(itemRefs.current).forEach((itemEl) => {
        if (itemEl && itemEl.contains(event.target)) {
          clickedInsideAnySubmenu = true;
        }
      });

      if (!clickedInsideAnySubmenu) {
        setOpenMenus({});
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCollapsed]);

  // ---------- Hjælpefunktion til at lukke alle menuer ----------
  const closeSubmenus = () => {
    setOpenMenus({});
  };

  // ---------- Toggle submenu ----------
  const toggleSubmenu = (label) => {
    if (isCollapsed && itemRefs.current[label]) {
      const rect = itemRefs.current[label].getBoundingClientRect();
      setSubmenuPositions((prev) => ({
        ...prev,
        [label]: rect.top,
      }));
    }

    setOpenMenus((prev) => {
      const newState = { ...prev, [label]: !prev[label] };
      if (isCollapsed) {
        // I collapsed mode må kun én menu være åben ad gangen
        Object.keys(newState).forEach((key) => {
          if (key !== label) newState[key] = false;
        });
      }
      return newState;
    });
  };

  return (
    <>
      <div className={`sidenav ${isCollapsed ? "sidenav-collapsed" : ""}`}>
        {/* ---------- Logo Section ---------- */}
        <div className="logo-container">
          <button
            className={`logo ${isCollapsed ? "rotated" : ""}`}
            onClick={() => {
              setIsCollapsed((prev) => {
                const newState = !prev;
                if (newState) {
                  setOpenMenus({});
                }
                return newState;
              });
            }}
          >
            <FontAwesomeIcon icon={faBars} />
          </button>

          {!isCollapsed && <div className="logo-text">Welcome</div>}
        </div>

        {/* ---------- Nav Links ---------- */}
        <ul className="sidenav-nav">
          {ActivePagesForNavBar.map((item) => (
            <li
              key={item.label}
              className={`sidenav-nav-item ${
                isCollapsed && openMenus[item.label] ? "active-collapsed" : ""
              }`}
              ref={(el) => (itemRefs.current[item.label] = el)}
            >
              {item.children ? (
                <>
                  <div
                    className={`sidenav-nav-link ${
                      openMenus[item.label] ? "active" : ""
                    }`}
                    onClick={() => toggleSubmenu(item.label)}
                    style={{ cursor: "pointer" }}
                  >
                    <FontAwesomeIcon
                      icon={item.icon}
                      className="sidenav-link-icon"
                    />
                    {!isCollapsed && (
                      <>
                        <span className="sidenav-link-text">{item.label}</span>
                        <FontAwesomeIcon
                          icon={
                            openMenus[item.label]
                              ? faChevronDown
                              : faChevronRight
                          }
                          className="submenu-arrow"
                        />
                      </>
                    )}
                  </div>

                  {!isCollapsed && openMenus[item.label] && (
                    <ul className="submenu">
                      {item.children.map((sub) => (
                        <li key={sub.to} className="submenu-item">
                          <NavLink
                            to={sub.to}
                            className="submenu-link"
                          >
                            {sub.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <NavLink
                  to={item.to}
                  className="sidenav-nav-link"
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    className="sidenav-link-icon"
                  />
                  {!isCollapsed && (
                    <span className="sidenav-link-text">{item.label}</span>
                  )}
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* ---------- Floating submenu for collapsed ---------- */}
      {ActivePagesForNavBar.map(
        (item) =>
          isCollapsed &&
          openMenus[item.label] &&
          item.children &&
          createPortal(
            <AnimatePresence key={item.label}>
              <motion.ul
                ref={(el) => (submenuRefs.current[item.label] = el)}
                className="submenu-float"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                style={{
                  top: submenuPositions[item.label] || 0,
                  left: 80,
                }}
              >
                {item.children.map((sub) => (
                  <li key={sub.to} className="submenu-item">
                    <NavLink
                      to={sub.to}
                      className="submenu-link"
                      onClick={closeSubmenus}
                    >
                      {sub.label}
                    </NavLink>
                  </li>
                ))}
              </motion.ul>
            </AnimatePresence>,
            document.body
          )
      )}
    </>
  );
};

export default NavBar;