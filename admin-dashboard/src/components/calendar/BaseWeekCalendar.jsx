import React, { useState } from 'react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, 
  endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday 
} from 'date-fns';
import { da } from 'date-fns/locale'; // Dansk sprog
import './BaseWeekCalendar.css';

const BaseWeekCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'];

  return (
    <div className="calendar-page-container">
      <header className="calendar-header">
        <div>
          <button className="nav-btn" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>Forrige</button>
          <button className="nav-btn" style={{marginLeft: '10px'}} onClick={() => setCurrentDate(addMonths(currentDate, 1))}>Næste</button>
        </div>
        <h2>{format(currentDate, 'MMMM yyyy', { locale: da })}</h2>
        <button className="nav-btn" onClick={() => setCurrentDate(new Date())}>I dag</button>
      </header>

      <div className="calendar-grid">
        {weekDays.map(day => (
          <div key={day} className="weekday-label">{day}</div>
        ))}

        {calendarDays.map((day, idx) => (
          <div
            key={idx}
            className={`calendar-day ${!isSameMonth(day, monthStart) ? 'outside-month' : ''} ${isToday(day) ? 'today' : ''}`}
            onClick={() => setSelectedDate(day)}
          >
            <span className="day-number">{format(day, 'd')}</span>
            {/* Her kan du senere mappe dine events ind */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BaseWeekCalendar;