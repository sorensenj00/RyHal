import React from 'react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, 
  endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday 
} from 'date-fns';
import './BaseMonthCalendar.css';

// Opdaterede farver der matcher din BaseDayCalendar.css
const ROLE_COLORS = {
  'Hal Mand': '#B8BB0B',
  'Cafemedarbejder': '#22C55E',
  'Administration': '#F59E0B',
  'Rengøring': '#7C3AED',
  'default': '#94a3b8'
};

const BaseMonthCalendar = ({ currentDate, onDateSelect, shifts = [], employees = [] }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'];

  const getDayStats = (day) => {
    // Sikrer at vi ikke crasher hvis shifts er undefined
    const dayShifts = (shifts || []).filter(s => isSameDay(new Date(s.date), day));
    
    return dayShifts.reduce((acc, shift) => {
      const employee = employees.find(e => e.id === shift.employeeId);
      const role = employee ? employee.role : 'default';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
  };

  return (
    <div className="calendar-page-container">
      {/* Legend med de korrekte farver */}
      <div className="calendar-legend">
        {Object.entries(ROLE_COLORS).map(([role, color]) => (
          role !== 'default' && (
            <div key={role} className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: color }}></span>
              <span className="legend-label">{role}</span>
            </div>
          )
        ))}
      </div>

      <div className="calendar-grid">
        {weekDays.map(day => (
          <div key={day} className="weekday-label">{day}</div>
        ))}

        {calendarDays.map((day, idx) => {
          const stats = getDayStats(day);

          return (
            <div
              key={idx}
              className={`calendar-day ${!isSameMonth(day, monthStart) ? 'outside-month' : ''} ${isToday(day) ? 'today' : ''} ${isSameDay(day, currentDate) ? 'selected' : ''}`}
              onClick={() => onDateSelect(day)}
            >
              <span className="day-number">{format(day, 'd')}</span>
              
              <div className="day-stats-container">
                {Object.entries(stats).map(([role, count]) => (
                  <div key={role} className="role-stat-badge">
                    <span 
                      className="stat-dot" 
                      style={{ backgroundColor: ROLE_COLORS[role] || ROLE_COLORS.default }}
                    ></span>
                    <span className="stat-count-month-calendar">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BaseMonthCalendar;
