import React from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, 'dd.MM.yyyy HH:mm', { locale: da });
};

const formatHours = (minutes) => `${(minutes / 60).toFixed(2)} timer`;

const EmployeeHoursTable = ({ rows, onOpenEmployee }) => {
  if (!rows?.length) {
    return (
      <div className="hours-empty-state">
        <h3>Ingen resultater</h3>
        <p>Der blev ikke fundet timer for den valgte periode og de valgte filtre.</p>
      </div>
    );
  }

  return (
    <div className="hours-table-scroll">
      <table className="hours-table">
        <thead>
          <tr>
            <th>Medarbejder</th>
            <th>Rolle</th>
            <th className="text-right">Antal vagter</th>
            <th className="text-right">Total timer</th>
            <th>Første vagt</th>
            <th>Seneste vagt</th>
            <th className="text-right">Handling</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.employeeId}>
              <td>
                <div className="hours-employee-cell">
                  <strong>{row.fullName}</strong>
                  <span className="hours-employee-id">ID: {row.employeeId}</span>
                </div>
              </td>
              <td>
                <span className="hours-role-badge">{row.roleName || 'Ingen rolle'}</span>
              </td>
              <td className="text-right">{row.shiftCount}</td>
              <td className="text-right">{formatHours(row.totalMinutes)}</td>
              <td>{formatDateTime(row.firstShiftStart)}</td>
              <td>{formatDateTime(row.lastShiftEnd)}</td>
              <td className="text-right">
                <button
                  type="button"
                  className="hours-link-btn"
                  onClick={() => onOpenEmployee?.(row.employeeId)}
                >
                  Se profil
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeHoursTable;
