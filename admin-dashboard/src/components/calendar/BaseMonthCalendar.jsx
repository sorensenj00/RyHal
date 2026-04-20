import React from 'react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, 
  endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO 
} from 'date-fns';
import './BaseMonthCalendar.css';

const BaseMonthCalendar = ({ currentDate, onDateSelect, shifts = [], employees = [] }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'];

  // Dynamisk udledning af unikke kategorier til legenden baseret på data fra DB
  const uniqueCategories = shifts.reduce((acc, shift) => {
    if (shift.categoryId && !acc.find(c => c.id === shift.categoryId)) {
      acc.push({
        id: shift.categoryId,
        name: shift.categoryName,
        color: shift.categoryColor
      });
    }
    return acc;
  }, []).sort((a, b) => a.id - b.id);

  const getDayStats = (day) => {
    const dayShifts = (shifts || []).filter(s => {
      const shiftDate = typeof s.startTime === 'string' ? parseISO(s.startTime) : new Date(s.startTime);
      return isSameDay(shiftDate, day);
    });
    
    return dayShifts.reduce((acc, shift) => {
      const catId = shift.categoryId;
      if (!acc[catId]) {
        acc[catId] = {
          count: 0,
          color: shift.categoryColor,
          name: shift.categoryName
        };
      }
      acc[catId].count += 1;
      return acc;
    }, {});
  };

  return (
    <div className="calendar-page-container">
      {/* Legenden genereres nu automatisk ud fra databasens kategorier */}
      <div className="calendar-legend">
        {uniqueCategories.map((cat) => (
          <div key={cat.id} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: cat.color }}></span>
            <span className="legend-label">{cat.name}</span>
          </div>
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
                {Object.entries(stats).map(([catId, data]) => (
                  <div key={catId} className="role-stat-badge">
                    <span 
                      className="stat-dot" 
                      style={{ backgroundColor: data.color }}
                    ></span>
                    <span className="stat-count-month-calendar">{data.count}</span>
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
