import { useEmployeePortal } from "../portal/EmployeePortalContext";
import { formatDate } from "./portalUtils";

function HoursPage() {
  const { hoursOverview } = useEmployeePortal();
  const rows = hoursOverview?.rows || [];

  return (
    <section className="panel panel-full">
      <div className="panel-header">
        <h2>Mine timer</h2>
        <span>{rows.length} række(r)</span>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Navn</th>
              <th>Rolle</th>
              <th>Vagter</th>
              <th>Timer</th>
              <th>Første vagt</th>
              <th>Sidste vagt</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.employeeId}>
                  <td>{row.fullName}</td>
                  <td>{row.roleName}</td>
                  <td>{row.shiftCount}</td>
                  <td>{row.totalHours}</td>
                  <td>{formatDate(row.firstShiftStart)}</td>
                  <td>{formatDate(row.lastShiftEnd)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="table-empty">
                  Ingen timer fundet for den valgte periode.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default HoursPage;
