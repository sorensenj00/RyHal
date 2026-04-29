import { useEmployeePortal } from "../portal/EmployeePortalContext";
import { formatDate, formatMinutes } from "./portalUtils";

function OverviewPage() {
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
          <span>Vagter denne uge</span>
          <strong>{summary.totalShiftCount ?? 0}</strong>
          <p>medregnet i overblikket</p>
        </article>

        <article className="stat-card">
          <span>Profil</span>
          <strong>{profile?.employeeId ?? "-"}</strong>
          <p>medarbejder-ID</p>
        </article>
      </section>

      <section className="employee-grid">
        <article className="panel panel-wide">
          <div className="panel-header">
            <h2>Ugens status</h2>
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
                  <span>Første vagt</span>
                  <strong>{formatDate(firstRow.firstShiftStart)}</strong>
                </div>
                <div>
                  <span>Sidste vagt</span>
                  <strong>{formatDate(firstRow.lastShiftEnd)}</strong>
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
            <span>{swapRequests.length} total</span>
          </div>

          <div className="panel-content">
            {latestSwap ? (
              <div className="stacked-card">
                <strong>Swap #{latestSwap.swapRequestId}</strong>
                <p>Status: {latestSwap.status?.name || "Ukendt"}</p>
                <p>Requester: {latestSwap.requesterId}</p>
                <p>Target: {latestSwap.targetEmployeeId}</p>
              </div>
            ) : (
              <p className="empty-state">Ingen bytteforespørgsler registreret endnu.</p>
            )}
          </div>
        </article>
      </section>
    </>
  );
}

export default OverviewPage;
