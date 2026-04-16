// ActivePagesForNavBar.js
import {
  faHome,
  faUsers,
  faCalendar,
  faUserCircle,
  faDumbbell,
} from "@fortawesome/free-solid-svg-icons";

export const ActivePagesForNavBar  = [
  { to: "/home", icon: faHome, label: "Home" },
  {
    to: "/employees",
    icon: faUsers,
    label: "Medarbejdere",
    children: [
      { to: "/employee-list", label: "Medarbejder oversigt" },
      { to: "/show-employee", label: "Vis medarbejder" },
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
  {
    to: "/activities",
    icon: faDumbbell,
    label: "Aktiviteter",
    children: [
      { to: "/activities/recurring", label: "Oversigt: Faste aktiviteter" },
      { to: "/activities/single", label: "Oversigt: Selvst. aktiviteter" },
      { to: "/create-activity", label: "Opret aktivitet" },
      { to: "/event-overview", label: "Event Oversigt" },
      { to: "/activities/drafts", label: "Oversigt: Kladdeaktiviter" },
      { to: "/create-activity", label: "Opret aktivitet" },
    ],
  },
];