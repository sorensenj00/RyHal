import {
  faChevronDown,
  faChevronRight,
  faClock,
  faExchangeAlt,
  faHome,
  faIdBadge,
  faUser,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

export {
  faChevronDown,
  faChevronRight,
};

export const employeeNavItems = [
  {
    to: "/home",
    icon: faHome,
    label: "Hjem",
  },
  {
    to: "/employee",
    icon: faUsers,
    label: "Medarbejder",
    children: [
      { to: "/overview", icon: faIdBadge, label: "Oversigt" },
      { to: "/hours", icon: faClock, label: "Mine timer" },
      { to: "/swaps", icon: faExchangeAlt, label: "Bytteforespørgsler" },
      { to: "/profile", icon: faUser, label: "Profil" },
    ],
  },
];
