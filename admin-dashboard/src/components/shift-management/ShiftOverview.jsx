import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import CreateNewShift from '../shift/CreateNewShift';
import EditShift from '../shift/EditShift';
import { parseDateSafe } from '../../utils/dateUtils';
import './ShiftOverview.css';

const normalizeRoleName = (value) => {
  return String(value || '')
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .replace(/\s+/g, '')
    .replace(/-/g, '');
};

const ROLE_COLOR_BY_KEY = {
  halmand: 'var(--color-hal-mand)',
  haldreng: 'var(--color-hal-dreng)',
  cafemedarbejder: 'var(--color-cafemedarbejder)',
  administration: 'var(--color-administration)',
  rengoering: 'var(--color-rengoering)',
  opvasker: 'var(--color-opvasker)',
  andet: 'var(--color-andet)',
};

const getRoleColor = (roleName) => {
  const key = normalizeRoleName(roleName);
  return ROLE_COLOR_BY_KEY[key] || 'var(--color-andet)';
};

const toTimeRange = (startValue, endValue) => {
  const start = parseDateSafe(startValue);
  const end = parseDateSafe(endValue);

  if (!start || !end) {
    return 'Tid ukendt';
  }

  return `${format(start, 'HH:mm')}-${format(end, 'HH:mm')}`;
};

const ShiftOverview = ({
  shifts = [],
  employeesById = {},
  selectedDate,
  loading = false,
  onRefresh,
}) => {
  const [editingShift, setEditingShift] = useState(null);
  const [selectedRole, setSelectedRole] = useState('all');
  const [sortMode, setSortMode] = useState('open-first');
  const navigate = useNavigate();

  const availableRoles = useMemo(() => {
    const roles = shifts
      .map((shift) => shift.categoryName)
      .filter(Boolean);

    return [...new Set(roles)].sort((a, b) => a.localeCompare(b, 'da'));
  }, [shifts]);

  const filteredShifts = useMemo(() => {
    if (selectedRole === 'all') {
      return shifts;
    }

    return shifts.filter((shift) => shift.categoryName === selectedRole);
  }, [selectedRole, shifts]);

  const sortedShifts = useMemo(() => {
    return [...filteredShifts].sort((a, b) => {
      if (sortMode === 'open-first') {
        const aCovered = Boolean(a.employeeId);
        const bCovered = Boolean(b.employeeId);

        if (aCovered !== bCovered) {
          return aCovered ? 1 : -1;
        }

        const roleA = String(a.categoryName || 'Ukendt kategori');
        const roleB = String(b.categoryName || 'Ukendt kategori');
        const roleCompare = roleA.localeCompare(roleB, 'da');

        if (roleCompare !== 0) {
          return roleCompare;
        }
      }

      const aTime = parseDateSafe(a.startTime)?.getTime() || 0;
      const bTime = parseDateSafe(b.startTime)?.getTime() || 0;
      return aTime - bTime;
    });
  }, [filteredShifts, sortMode]);

  const selectedDateObject = selectedDate ? new Date(`${selectedDate}T00:00:00`) : null;

  return (
    <>
    <section className="shift-overview-card" aria-label="Vagter behov og status">
      <div className="shift-overview-header">
        <h2>Vagter (behov og status)</h2>
        <div className="shift-overview-header-actions">
          <button
            type="button"
            className="btn btn-primary view-calendar-btn"
            onClick={() => navigate('/work-calendar', { state: { view: 'day', selectedDate } })}
          >
            Se i kalenderen
          </button>
          <CreateNewShift initialDate={selectedDateObject} onRefresh={onRefresh} />
        </div>
      </div>

      <div className="shift-overview-filters">
        <label className="shift-filter-field">
          <span>Rolle</span>
          <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)}>
            <option value="all">Alle roller</option>
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        <label className="shift-filter-field">
          <span>Sortering</span>
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
            <option value="open-first">Ledige øverst</option>
            <option value="time">Tidspunkt</option>
          </select>
        </label>
      </div>

      {loading ? (
        <p className="shift-overview-muted">Henter vagter...</p>
      ) : sortedShifts.length === 0 ? (
        <div className="shift-overview-empty">
          <h3>Ingen vagter</h3>
          <p>Der er ingen vagter for den valgte dag.</p>
        </div>
      ) : (
        <ul className="shift-overview-list">
          {sortedShifts.map((shift, index) => {
            const covered = Boolean(shift.employeeId);
            const previousShift = index > 0 ? sortedShifts[index - 1] : null;
            const previousCovered = previousShift ? Boolean(previousShift.employeeId) : covered;
            const showBreakpoint =
              sortMode === 'open-first' &&
              index > 0 &&
              covered &&
              !previousCovered;

            return (
              <React.Fragment key={shift.shiftId}>
                {showBreakpoint && (
                  <li className="shift-overview-breakpoint" role="separator" aria-label="Skift til dækkede vagter">
                    <span>Dækkede vagter</span>
                  </li>
                )}

                <li className="shift-overview-item">
                  <span className="shift-overview-time">{toTimeRange(shift.startTime, shift.endTime)}</span>

                  <span className={covered ? 'shift-status-covered' : 'shift-status-open'}>
                    {covered ? '🟢 Dækket' : '🔴 Ledig'}
                  </span>

                  <span
                    className="shift-overview-category shift-overview-category-badge"
                    style={{
                      backgroundColor: `${getRoleColor(shift.categoryName)}1A`,
                      borderColor: `${getRoleColor(shift.categoryName)}66`,
                      color: getRoleColor(shift.categoryName),
                    }}
                  >
                    {shift.categoryName || 'Ukendt kategori'}
                  </span>

                  <span className="shift-overview-employee">
                    {covered
                      ? employeesById[shift.employeeId] || `Medarbejder ${shift.employeeId}`
                      : 'Ingen medarbejder tildelt'}
                  </span>

                  <button
                    type="button"
                    className="btn btn-secondary shift-overview-edit-btn"
                    onClick={() => setEditingShift(shift)}
                  >
                    Rediger
                  </button>
                </li>
              </React.Fragment>
            );
          })}
        </ul>
      )}
    </section>

    {editingShift && (
      <EditShift
        shift={editingShift}
        onClose={() => setEditingShift(null)}
        onRefresh={onRefresh}
      />
    )}
    </>
  );
};

export default ShiftOverview;
