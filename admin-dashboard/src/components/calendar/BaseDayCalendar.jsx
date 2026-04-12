import React, { useState } from 'react'; // Tilføjet useState
import { format } from 'date-fns';
import EmployeeCardForCalendar from '../employee/EmployeeCardForCalendar';
import EditShift from '../shift/EditShift';
import './BaseDayCalendar.css';

const BaseDayCalendar = ({ date = new Date(), employees = [], shifts = [] }) => {
  // --- STATE TIL VALGT VAGT ---
  const [selectedShift, setSelectedShift] = useState(null);

  const START_HOUR = 5;
  const TOTAL_HOURS = 24;

  const hours = Array.from({ length: TOTAL_HOURS }, (_, idx) => (idx + START_HOUR) % 24);
  const dateKey = format(date, 'yyyy-MM-dd');
  const roleOrder = ['Hal Mand', 'Cafemedarbejder', 'Administration', 'Rengøring'];

  const getShiftStyles = (startHour, endHour) => {
    let gridStart = startHour - START_HOUR;
    if (gridStart < 0) gridStart += 24;

    let duration = endHour - startHour;
    if (duration <= 0) duration += 24;

    return {
      gridColumn: `${gridStart + 1} / span ${duration}`, // Fjernet +1 i span for præcis grid-match
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
        {/* HEADER AREA */}
        <div className="timeline-header">
          <div className="sidebar-header-spacer" />
          {hours.map((hour) => (
            <div key={hour} className="timeline-hour">
              {hour.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* BODY AREA */}
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
                  const roleClass = `role-${employee.role.toLowerCase().replace(/\s+/g, '-')}`;
                  const shift = shifts.find(
                    (s) => s.employeeId === employee.id && s.date === dateKey
                  );
                  const shiftStyle = shift ? getShiftStyles(shift.startHour, shift.endHour) : null;

                  return (
                    <div key={employee.id} className="calendar-row">
                      <div className="sidebar-cell sidebar-row-item">
                        <EmployeeCardForCalendar employee={employee} />
                      </div>

                      <div className="timeline-row-item">
                        {shift && (
                          <div
                            className={`shift-line ${roleClass}`}
                            style={shiftStyle}
                            onClick={() => setSelectedShift(shift)} // SÆT VALGT VAGT VED KLIK
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

      {/* --- VIS REDIGERINGS-ELEMENT HVIS EN VAGT ER VALGT --- */}
      {/* --- MODAL POP-UP --- */}
      {selectedShift && (
        <div className="modal-backdrop" onClick={() => setSelectedShift(null)}>
          {/* stopPropagation forhindrer at vinduet lukker, når man klikker indeni selve formularen */}
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-button" onClick={() => setSelectedShift(null)}>
              &times;
            </button>
            <EditShift shift={selectedShift} />
          </div>
        </div>
      )}
    </div>
  );
};

export default BaseDayCalendar;
