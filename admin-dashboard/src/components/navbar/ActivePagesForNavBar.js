// ActivePagesForNavBar.js
import {
  faHome,
  faUsers,
  faCalendar,
  faUserCircle,
  faDumbbell,
  faBuilding,
  faAddressBook,
} from "@fortawesome/free-solid-svg-icons";

export const ActivePagesForNavBar  = [
  { to: "/home", icon: faHome, label: "Hjem" },
  {
    to: "/employees",
    icon: faUsers,
    label: "Medarbejdere",
    children: [
      { to: "/employee-list", label: "Medarbejder oversigt" },
      { to: "/employee-hours", label: "Timeoversigt" },
      { to: "/show-employee", label: "Vis medarbejder" },
      { to: "/create-employee", label: "Tilføj ny medarbejder" },
    ],
  },
  {
    to: "/work-schedule",
    icon: faCalendar,
    label: "Kalender",
    children: [
      { to: "/work-calendar", label: "Kalender" },
      { to: "/calendar", label: "Vagtkalender" },
      { to: "/event-shift-overview", label: "Aktivitet og Vagt Oversigt" },
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
    ],
  },
  {
    to: "/associations",
    icon: faBuilding,
    label: "Foreninger",
    children: [
      { to: "/associations", label: "Alle Foreninger" },
      { to: "/view-association", label: "Se Forening" },
      { to: "/association", label: "Opret Forening" },
    ],
  },
  {
    to: "/contacts",
    icon: faAddressBook,
    label: "Kontakter",
    children: [
      { to: "/view-contacts", label: "Alle Kontakter" },
      { to: "/view-contact", label: "Se Kontakt Person" },
      { to: "/create-contact", label: "Opret Kontakt" },
    ],
  },
];
