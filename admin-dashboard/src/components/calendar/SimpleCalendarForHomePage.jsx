import React from 'react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, 
  endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths 
} from 'date-fns';
import { da } from 'date-fns/locale';
import './SimpleCalendarForHomePage.css';

const SimpleCalendarForHomePage = ({ selectedDate, onDateSelect }) => {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];

  return (
    <div className="simple-calendar-card">
      <div className="simple-calendar-header">
        <button onClick={() => onDateSelect(subMonths(selectedDate, 1))}>&lt;</button>
        <span>{format(selectedDate, 'MMMM yyyy', { locale: da })}</span>
        <button onClick={() => onDateSelect(addMonths(selectedDate, 1))}>&gt;</button>
      </div>

      <div className="simple-calendar-grid">
        {weekDays.map(day => (
          <div key={day} className="simple-weekday-label">{day}</div>
        ))}
        {calendarDays.map((day, idx) => (
          <div
            key={idx}
            className={`simple-day ${!isSameMonth(day, monthStart) ? 'outside' : ''} 
              ${isToday(day) ? 'is-today' : ''} 
              ${isSameDay(day, selectedDate) ? 'is-selected' : ''}`}
            onClick={() => onDateSelect(day)}
          >
            {format(day, 'd')}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleCalendarForHomePage;

