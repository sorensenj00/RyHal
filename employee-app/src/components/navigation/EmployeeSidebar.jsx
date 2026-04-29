import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { employeeNavItems, faChevronDown, faChevronRight } from "./employeeNavItems";

function isItemActive(pathname, item) {
  if (item.to && pathname === item.to) {
    return true;
  }

  return item.children?.some((child) => pathname === child.to) || false;
}

function EmployeeSidebar({ onLogout, profile }) {
  const { pathname } = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState(() => {
    const initialState = {};
    employeeNavItems.forEach((item) => {
      if (item.children) {
        initialState[item.label] = true;
      }
    });
    return initialState;
  });
  const [floatingMenu, setFloatingMenu] = useState(null);
  const itemRefs = useRef({});

  useEffect(() => {
    const syncCollapsedState = () => {
      setIsCollapsed(window.innerWidth < 900);
    };

    syncCollapsedState();
    window.addEventListener("resize", syncCollapsedState);
    return () => window.removeEventListener("resize", syncCollapsedState);
  }, []);

  useEffect(() => {
    if (!floatingMenu) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      const anchor = itemRefs.current[floatingMenu.label];
      if (anchor?.contains(event.target)) {
        return;
      }

      setFloatingMenu(null);
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [floatingMenu]);

  const userInitials = useMemo(() => {
    const first = profile?.firstName?.[0] || "";
    const last = profile?.lastName?.[0] || "";
    return `${first}${last}`.trim().toUpperCase() || "M";
  }, [profile]);

  const toggleSubmenu = (item) => {
    if (isCollapsed) {
      const rect = itemRefs.current[item.label]?.getBoundingClientRect();
      if (!rect) return;

      setFloatingMenu((current) =>
        current?.label === item.label
          ? null
          : {
              label: item.label,
              top: rect.top,
              children: item.children,
            }
      );
      return;
    }

    setOpenMenus((prev) => ({
      ...prev,
      [item.label]: !prev[item.label],
    }));
  };

  return (
    <>
      <aside className={`employee-sidenav ${isCollapsed ? "employee-sidenav-collapsed" : ""}`}>
        <div className="employee-logo-container">
          <button
            type="button"
            className={`employee-logo-toggle ${isCollapsed ? "rotated" : ""}`}
            onClick={() => {
              setIsCollapsed((prev) => {
                const next = !prev;
                if (next) {
                  setFloatingMenu(null);
                }
                return next;
              });
            }}
            aria-label="Skjul eller vis navigation"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
          {!isCollapsed && (
            <div className="employee-logo-text">
              <strong>RyHal</strong>
              <span>Medarbejderportal</span>
            </div>
          )}
        </div>

        <ul className="employee-sidenav-nav">
          {employeeNavItems.map((item) => {
            const active = isItemActive(pathname, item);

            return (
              <li
                key={item.label}
                className={`employee-sidenav-item ${active ? "active-group" : ""}`}
                ref={(node) => {
                  itemRefs.current[item.label] = node;
                }}
              >
                {item.children ? (
                  <>
                    <button
                      type="button"
                      className={`employee-sidenav-link employee-sidenav-button ${active ? "active" : ""}`}
                      onClick={() => toggleSubmenu(item)}
                    >
                      <FontAwesomeIcon icon={item.icon} className="employee-sidenav-icon" />
                      {!isCollapsed && (
                        <>
                          <span className="employee-sidenav-text">{item.label}</span>
                          <FontAwesomeIcon
                            icon={openMenus[item.label] ? faChevronDown : faChevronRight}
                            className="employee-sidenav-arrow"
                          />
                        </>
                      )}
                    </button>

                    {!isCollapsed && (openMenus[item.label] || active) && (
                      <ul className="employee-submenu">
                        {item.children.map((child) => (
                          <li key={child.to} className="employee-submenu-item">
                            <NavLink
                              to={child.to}
                              className="employee-submenu-link"
                              onClick={() => setFloatingMenu(null)}
                            >
                              <FontAwesomeIcon icon={child.icon} className="employee-submenu-icon" />
                              <span>{child.label}</span>
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <NavLink
                    to={item.to}
                    className="employee-sidenav-link"
                    onClick={() => setFloatingMenu(null)}
                  >
                    <FontAwesomeIcon icon={item.icon} className="employee-sidenav-icon" />
                    {!isCollapsed && <span className="employee-sidenav-text">{item.label}</span>}
                  </NavLink>
                )}
              </li>
            );
          })}
        </ul>

        <div className="employee-sidenav-footer">
          <div className="employee-user-card">
            <span className="employee-user-avatar">{userInitials}</span>
            {!isCollapsed && (
              <div className="employee-user-copy">
                <strong>
                  {profile?.firstName} {profile?.lastName}
                </strong>
                <p>{profile?.email}</p>
              </div>
            )}
          </div>

          <button type="button" onClick={onLogout} className="employee-logout-button">
            <FontAwesomeIcon icon={faSignOutAlt} className="employee-sidenav-icon" />
            {!isCollapsed && <span className="employee-sidenav-text">Log ud</span>}
          </button>
        </div>
      </aside>

      {isCollapsed && floatingMenu?.children
        ? createPortal(
            <ul
              className="employee-submenu-float"
              style={{
                top: floatingMenu.top,
                left: 92,
              }}
            >
              {floatingMenu.children.map((child) => (
                <li key={child.to} className="employee-submenu-item">
                  <NavLink
                    to={child.to}
                    className="employee-submenu-link"
                    onClick={() => setFloatingMenu(null)}
                  >
                    <FontAwesomeIcon icon={child.icon} className="employee-submenu-icon" />
                    <span>{child.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>,
            document.body
          )
        : null}
    </>
  );
}

export default EmployeeSidebar;
