import { Outlet, useLocation } from "react-router-dom";
import EmployeeSidebar from "./EmployeeSidebar";
import { useEmployeePortal } from "../../portal/EmployeePortalContext";

const pageMeta = {
  "/home": {
    eyebrow: "Medarbejderportal",
    title: "Velkommen tilbage",
    copy: "Få et hurtigt overblik over dine timer, bytteforespørgsler og de vigtigste genveje for ugen.",
  },
  "/overview": {
    eyebrow: "Oversigt",
    title: "Dit samlede overblik",
    copy: "Her finder du ugens status, dine timer og de seneste hændelser samlet ét sted.",
  },
  "/hours": {
    eyebrow: "Mine timer",
    title: "Timer og vagter",
    copy: "Se registrerede vagter og arbejdstimer for den valgte uge.",
  },
  "/swaps": {
    eyebrow: "Bytteforespørgsler",
    title: "Dine bytter",
    copy: "Hold styr på aktive og historiske bytteforespørgsler.",
  },
  "/profile": {
    eyebrow: "Profil",
    title: "Konto og adgang",
    copy: "Gennemgå dine kontooplysninger og din app-adgang.",
  },
};

function EmployeeShell() {
  const { error, handleLogout, profile } = useEmployeePortal();
  const { pathname } = useLocation();
  const currentPageMeta = pageMeta[pathname] || pageMeta["/home"];

  return (
    <div className="employee-app-shell">
      <EmployeeSidebar onLogout={handleLogout} profile={profile} />

      <main className="employee-main">
        <header className="employee-hero">
          <div>
            <p className="eyebrow">{currentPageMeta.eyebrow}</p>
            <h1>
              {currentPageMeta.title}
              {pathname === "/home" ? `, ${profile?.firstName || "medarbejder"}` : ""}
            </h1>
            <p className="hero-copy">{currentPageMeta.copy}</p>
          </div>

          <div className="employee-hero-badge">
            <span>App-adgang</span>
            <strong>{profile?.appAccess}</strong>
          </div>
        </header>

        {error ? <div className="employee-alert">{error}</div> : null}

        <Outlet />
      </main>
    </div>
  );
}

export default EmployeeShell;
