import React, { useEffect, useState } from 'react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, 
  endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday 
} from 'date-fns';
import { da } from 'date-fns/locale'; // Dansk sprog
import './BaseMonthCalendar.css';

const BaseWeekCalendar = ({ currentDate: currentDateProp = new Date(), onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(currentDateProp);
  const [selectedDate, setSelectedDate] = useState(currentDateProp);

  useEffect(() => {
    setCurrentDate(currentDateProp);
    setSelectedDate(currentDateProp);
  }, [currentDateProp]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'];

  const handleDateClick = (day) => {
    setSelectedDate(day);
    if (onDateSelect) {
      onDateSelect(day);
    }
  };

  return (
    <div className="calendar-page-container">
      <header className="calendar-header">
        <h2>{format(currentDate, 'MMMM yyyy', { locale: da })}</h2>
      </header>

      <div className="calendar-grid">
        {weekDays.map(day => (
          <div key={day} className="weekday-label">{day}</div>
        ))}

        {calendarDays.map((day, idx) => (
          <div
            key={idx}
            className={`calendar-day ${!isSameMonth(day, monthStart) ? 'outside-month' : ''} ${isToday(day) ? 'today' : ''} ${isSameDay(day, selectedDate) ? 'selected' : ''}`}
            onClick={() => handleDateClick(day)}
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