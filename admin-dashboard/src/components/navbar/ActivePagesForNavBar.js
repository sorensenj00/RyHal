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
    label: "Medarbejdere",
    children: [
      { to: "/employee-list", label: "Medarbejder oversigt" },
      { to: "/manage-employee", label: "Redigere medarbejder" },
      { to: "/create-employee", label: "Tilføj ny medarbejder" },
    ],
  },
  {
    to: "/work-schedule",
    icon: faCalendar,
    label: "Arbejdskalender",
    children: [
      { to: "/work-calendar", label: "Kalender" },
      { to: "/calendar", label: "Vagtkalender" },
    ],
  },
  {
    to: "/shift-management",
    icon: faUserCircle,
    label: "Vagtstyring",
      children: [
        { to: "/create-shift", label: "Opret Ny Vagt" },
      ]
  },

];