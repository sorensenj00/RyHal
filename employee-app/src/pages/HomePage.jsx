import { Link } from "react-router-dom";
import { useEmployeePortal } from "../portal/EmployeePortalContext";
import { formatDate, formatMinutes } from "./portalUtils";

function HomePage() {
  const { hoursOverview, profile, swapRequests, weekRange } = useEmployeePortal();
  const summary = hoursOverview?.summary || {};
  const rows = hoursOverview?.rows || [];
  const firstRow = rows[0] || null;
  const latestSwap = swapRequests[0] || null;

  return (
    <>
      <section className="employee-stats">
        <article className="stat-card accent">
          <span>Mine timer</span>
          <strong>{formatMinutes(summary.totalMinutes || 0)}</strong>
          <p>i uge {formatDate(weekRange.start)}</p>
        </article>

        <article className="stat-card">
          <span>Mine vagter</span>
          <strong>{summary.totalShiftCount ?? 0}</strong>
          <p>registreret denne uge</p>
        </article>

        <article className="stat-card">
          <span>Bytteforespørgsler</span>
          <strong>{swapRequests.length}</strong>
          <p>aktive eller historiske</p>
        </article>
      </section>

      <section className="employee-grid">
        <article className="panel panel-wide">
          <div className="panel-header">
            <h2>Din uge</h2>
            <span>
              {formatDate(weekRange.start)} - {formatDate(weekRange.end)}
            </span>
          </div>

          <div className="panel-content">
            {firstRow ? (
              <div className="info-list">
                <div>
                  <span>Navn</span>
                  <strong>{firstRow.fullName}</strong>
                </div>
                <div>
                  <span>Rolle</span>
                  <strong>{firstRow.roleName}</strong>
                </div>
                <div>
                  <span>Seneste vagt</span>
                  <strong>{formatDate(firstRow.lastShiftEnd)}</strong>
                </div>
                <div>
                  <span>Gennemsnit pr. vagt</span>
                  <strong>{firstRow.averageHoursPerShift} timer</strong>
                </div>
              </div>
            ) : (
              <p className="empty-state">Ingen timer fundet for den valgte periode.</p>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>Seneste bytte</h2>
            <span>Opdateres løbende</span>
          </div>

          <div className="panel-content">
            {latestSwap ? (
              <div className="stacked-card">
                <strong># {latestSwap.swapRequestId}</strong>
                <p>Status: {latestSwap.status?.name || "Ukendt"}</p>
                <p>Oprettet: {formatDate(latestSwap.createdAt)}</p>
              </div>
            ) : (
              <p className="empty-state">Ingen bytteforespørgsler endnu.</p>
            )}
          </div>
        </article>
      </section>

      <section className="quick-links-grid">
        <Link to="/overview" className="quick-link-card">
          <span>Overblik</span>
          <strong>Se din uge samlet</strong>
          <p>Få status på timer, vagter og seneste aktivitet.</p>
        </Link>

        <Link to="/hours" className="quick-link-card">
          <span>Mine timer</span>
          <strong>Gå til tidsoversigt</strong>
          <p>Åbn tabellen med dine registrerede vagter.</p>
        </Link>

        <Link to="/swaps" className="quick-link-card">
          <span>Bytter</span>
          <strong>Følg forespørgsler</strong>
          <p>Hold styr på aktive og historiske bytter.</p>
        </Link>

        <Link to="/profile" className="quick-link-card">
          <span>Profil</span>
          <strong>{profile?.firstName} {profile?.lastName}</strong>
          <p>Se dine kontooplysninger og app-adgang.</p>
        </Link>
      </section>
    </>
  );
}

export default HomePage;
