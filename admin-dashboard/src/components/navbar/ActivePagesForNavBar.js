// ActivePagesForNavBar.js
import {
  faHome,
  faUsers,
  faCalendar,
  faUserCircle,
} from "@fortawesome/free-solid-svg-icons";

export const ActivePagesForNavBar  = [
  { to: "/home", icon: faHome, label: "Home" },
  {
    to: "/employees",
    icon: faUsers,
    label: "Employees",
    children: [
      { to: "/employee-list", label: "All Employees" },
      { to: "/manage-employee", label: "Manage Employee" },
      { to: "/add-employee", label: "Add New Employee" },
    ],
  },
  {
    to: "/work-schedule",
    icon: faCalendar,
    label: "Work Schedule",
    children: [
      { to: "/day-calendar", label: "Day Calendar" },
      { to: "/week-calendar", label: "Week Calendar" },
      { to: "/month-calendar", label: "Month Calendar" },
    ],
  },

];