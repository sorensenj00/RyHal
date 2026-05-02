import React, { useState } from 'react';
import { isSameDay, parseISO, getHours, getMinutes } from 'date-fns';
import EmployeeCardForCalendar from '../employee/EmployeeCardForCalendar';
import EditShift from '../shift/EditShift';
import './BaseDayCalendar.css';

const BaseDayCalendar = ({ date = new Date(), employees = [], shifts = [], onRefresh }) => {
  const [selectedShift, setSelectedShift] = useState(null);

  const START_HOUR = 5;
  const TOTAL_HOURS = 24;
  const STEPS_PER_HOUR = 4; // Giver 15-minutters præcision

  const hours = Array.from({ length: TOTAL_HOURS }, (_, idx) => (idx + START_HOUR) % 24);

  const getShiftStyles = (startStr, endStr) => {
    if (!startStr || !endStr) return { display: 'none' };

    const start = typeof startStr === 'string' ? parseISO(startStr) : new Date(startStr);
    const end = typeof endStr === 'string' ? parseISO(endStr) : new Date(endStr);

    // Beregn decimaltid (f.eks. 8:15 bliver 8.25)
    let startDecimal = getHours(start) + getMinutes(start) / 60;
    let endDecimal = getHours(end) + getMinutes(end) / 60;

    // Juster for start-tidspunktet på kalenderen (kl. 05:00)
    let gridStartOffset = startDecimal - START_HOUR;
    if (gridStartOffset < 0) gridStartOffset += 24;

    let duration = endDecimal - startDecimal;
    if (duration <= 0) duration += 24;

    // Konverter til grid-kolonner (1 time = 4 kolonner)
    const colStart = Math.round(gridStartOffset * STEPS_PER_HOUR) + 1;
    const colSpan = Math.round(duration * STEPS_PER_HOUR);

    return {
      gridColumn: `${colStart} / span ${colSpan}`,
    };
  };

  const formatShiftTime = (timeValue) => {
    if (!timeValue) return '--:--';
    const dateValue = typeof timeValue === 'string' ? parseISO(timeValue) : new Date(timeValue);
    const hh = String(getHours(dateValue)).padStart(2, '0');
    const mm = String(getMinutes(dateValue)).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const shiftsThisDay = (shifts || []).filter(s => {
    if (!s?.startTime) return false;
    const shiftDate = typeof s.startTime === 'string' ? parseISO(s.startTime) : new Date(s.startTime);
    return isSameDay(shiftDate, date);
  });

  const shiftsByCategory = shiftsThisDay.reduce((groups, shift) => {
    const catId = shift.categoryId || 999;
    if (!groups[catId]) groups[catId] = [];
    groups[catId].push(shift);
    return groups;
  }, {});

  // Sortér shifts indenfor hver kategori efter starttid
  Object.keys(shiftsByCategory).forEach(catId => {
    shiftsByCategory[catId].sort((a, b) => {
      const aTime = typeof a.startTime === 'string' ? parseISO(a.startTime) : new Date(a.startTime);
      const bTime = typeof b.startTime === 'string' ? parseISO(b.startTime) : new Date(b.startTime);
      return aTime - bTime;
    });
  });

  const activeCategoryIds = Object.keys(shiftsByCategory).sort((a, b) => a - b);

  return (
    <div className="day-calendar-container">
      <div className="day-calendar">
        {/* Header - flugter med sidebaren */}
        <div className="calendar-grid-row timeline-header">
          <div className="sidebar-cell sidebar-header-spacer" />
          <div className="timeline-data-container hour-labels">
            {hours.map((hour) => (
              <div key={hour} className="timeline-hour">
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>
        </div>

        <div className="calendar-body">
          {activeCategoryIds.map((catId) => {
            const shiftsInCat = shiftsByCategory[catId];
            const categoryName = shiftsInCat[0]?.categoryName || 'Ukendt kategori';

            return (
              <React.Fragment key={catId}>
                {/* Kategori-overskrift række */}
                <div className="calendar-grid-row role-row full-width-row">
                  <div className="employee-role-title">
                    {categoryName}
                  </div>
                </div>
                <div className="timeline-data-container role-placeholder" />

                {
              shiftsInCat.map((shift) => {
                const employee = shift.employeeId
                  ? employees?.find(e => e.employeeId === shift.employeeId)
                  : null;

                const isUnassigned = !employee;
                const shiftStyle = getShiftStyles(shift.startTime, shift.endTime);
                const shiftTimeLabel = `${formatShiftTime(shift.startTime)}-${formatShiftTime(shift.endTime)}`;

                return (
                  <div key={shift.shiftId} className="calendar-grid-row shift-row">
                    <div className="sidebar-cell">
                      {!isUnassigned ? (
                        <EmployeeCardForCalendar
                          employee={{
                            ...employee,
                            role: categoryName
                          }}
                        />
                      ) : (
                        <div className="unassigned-shift-label">Mangler medarbejder</div>
                      )}
                    </div>

                    <div className="timeline-data-container">
                      <div
                        className={`shift-line ${isUnassigned ? 'unassigned' : ''}`}
                        style={{
                          ...shiftStyle,
                          backgroundColor: isUnassigned ? '#ef4444' : (shift.categoryColor || '#94a3b8')
                        }}
                        onClick={() => setSelectedShift(shift)}
                      >
                        <span className="shift-text">
                          {isUnassigned
                            ? `${shiftTimeLabel} | LEDIG VAGT`
                            : `${shiftTimeLabel} | ${employee?.firstName}`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            }
              </React.Fragment>
        );
          })}
      </div>
    </div>

      {
    selectedShift && (
      <EditShift
        shift={selectedShift}
        onClose={() => setSelectedShift(null)}
        onRefresh={onRefresh}
      />
    )
  }
    </div >
  );
};

export default BaseDayCalendar;
