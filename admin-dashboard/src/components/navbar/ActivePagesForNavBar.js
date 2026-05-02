// ActivePagesForNavBar.js
import {
  faHome,
  faUsers,
  faCalendar,
  faUserCircle,
  faBuilding,
  faAddressBook,
  faCalendarAlt,
} from "@fortawesome/free-solid-svg-icons";

export const ActivePagesForNavBar  = [
  { to: "/home", icon: faHome, label: "Hjem" },
  {
    to: "/employees",
    icon: faUsers,
    label: "Medarbejdere",
    children: [
      { to: "/employee-list", label: "Oversigt" },
      { to: "/employee-hours", label: "Timeoversigt" },
      { to: "/show-employee", label: "Find Medarbejder" },
      { to: "/create-employee", label: "Opret Medarbejder" },
      { to: "/employee-roles", label: "Roller" },
    ],
  },
  {
    to: "/work-schedule",
    icon: faCalendar,
    label: "Kalender",
    children: [
      { to: "/work-calendar", label: "Vagtkalender" },
      { to: "/event-shift-overview", label: "Aktivitet og Vagt Oversigt" },
    ],
  },
  {
    to: "/shift-management",
    icon: faUserCircle,
    label: "Vagtstyring",
      children: [
        { to: "/staffing-overview", label: "Bemandingsoversigt" },
      ]
  },
  {
    to: "/Events",
    icon: faCalendarAlt,
    label: "Events",
    children: [
      { to: "/create-activity", label: "Opret Event" },
      { to: "/event-overview", label: "Event Oversigt" },
      { to: "/activities/drafts", label: "Kladder" },
      { to: "/locations", label: "Lokationer" },
    ],
  },
  {
    to: "/associations",
    icon: faBuilding,
    label: "Foreninger",
    children: [
      { to: "/associations", label: "Alle Foreninger" },
      { to: "/view-association", label: "Find Forening" },
      { to: "/create-association", label: "Opret Forening" },
    ],
  },
  {
    to: "/contacts",
    icon: faAddressBook,
    label: "Kontakter",
    children: [
      { to: "/view-contacts", label: "Alle Kontakter" },
      { to: "/view-contact", label: "Find Kontakt" },
      { to: "/create-contact", label: "Opret Kontakt" },
    ],
  },
];
