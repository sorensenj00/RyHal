import React, { useState } from 'react';
import { format } from 'date-fns';
import EmployeeCardForCalendar from '../employee/EmployeeCardForCalendar';
import EditShift from '../shift/EditShift';
import './BaseDayCalendar.css';

const BaseDayCalendar = ({ date = new Date(), employees = [], shifts = [] }) => {
  const [selectedShift, setSelectedShift] = useState(null);

  const START_HOUR = 5;
  const TOTAL_HOURS = 24;

  const hours = Array.from({ length: TOTAL_HOURS }, (_, idx) => (idx + START_HOUR) % 24);
  const dateKey = format(date, 'yyyy-MM-dd');
  const roleOrder = ['Hal Mand', 'Cafemedarbejder', 'Administration', 'Rengøring'];

  // --- OPDATERET LOGIK FOR GRID PLACERING ---
  const getShiftStyles = (startHour, endHour) => {
    // gridStart er kolonnen, hvor vagten begynder
    let gridStart = startHour - START_HOUR;
    if (gridStart < 0) gridStart += 24;

    // Varighed i antal timer (kolonner)
    let duration = endHour - startHour;
    if (duration <= 0) duration += 24;

    return {
      // Vi starter ved gridStart + 1 (da grid er 1-indekseret)
      // og spænder over det antal timer, vagten varer.
      gridColumn: `${gridStart + 1} / span ${duration}`,
    };
  };

  const employeesWithShift = employees.filter((employee) =>
    shifts.some((shiftItem) => shiftItem.employeeId === employee.id && shiftItem.date === dateKey)
  );

  const employeesByRole = employeesWithShift.reduce((groups, employee) => {
    const roleKey = employee.role;
    if (!groups[roleKey]) groups[roleKey] = [];
    groups[roleKey].push(employee);
    return groups;
  }, {});

  return (
    <div className="day-calendar-container">
      <div className="day-calendar">
        <div className="timeline-header">
          <div className="sidebar-header-spacer" />
          {hours.map((hour) => (
            <div key={hour} className="timeline-hour">
              {hour.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>

        <div className="calendar-body">
          {roleOrder.map((role) => {
            const employeesForRole = (employeesByRole[role] || []).sort((a, b) =>
              a.name.localeCompare(b.name)
            );

            if (!employeesForRole.length) return null;

            return (
              <React.Fragment key={role}>
                <div className="calendar-row role-row">
                  <div className="sidebar-cell employee-role-title">{role}</div>
                  <div className="timeline-role-container" />
                </div>

                {employeesForRole.map((employee) => {
                  const shift = shifts.find(
                    (s) => s.employeeId === employee.id && s.date === dateKey
                  );

                  const categoryName = shift?.category || 'andet';
                  const safeCategoryName = categoryName.toLowerCase()
                    .replace(/\s+/g, '-') // "Hal Mand" -> "hal-mand"
                    .replace(/ø/g, 'o')   // "Rengøring" -> "rengoring" (bemærk: kun ét 'o')
                    .replace(/æ/g, 'ae')
                    .replace(/å/g, 'aa');

                  const categoryClass = `role-${safeCategoryName}`;
                  const shiftStyle = shift ? getShiftStyles(shift.startHour, shift.endHour) : null;

                  return (
                    <div key={employee.id} className="calendar-row">
                      <div className="sidebar-cell sidebar-row-item">
                        <EmployeeCardForCalendar employee={employee} />
                      </div>

                      <div className="timeline-row-item">
                        {shift && (
                          <div
                            className={`shift-line ${categoryClass}`}
                            style={shiftStyle}
                            onClick={() => setSelectedShift(shift)}
                          >
                            {employee.name}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {selectedShift && (
        <EditShift 
          shift={selectedShift} 
          onClose={() => setSelectedShift(null)} 
        />
      )}
    </div>
  );
};

export default BaseDayCalendar;
