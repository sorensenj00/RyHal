import React from 'react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, 
  endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, isWithinInterval, startOfDay, endOfDay 
} from 'date-fns';
import { da } from 'date-fns/locale';
import './SimpleCalendar.css';

const SimpleCalendar = ({ selectedDate, onDateSelect, startDate, endDate }) => {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];

  const getDayClass = (day) => {
    let classes = "simple-day";
    if (!isSameMonth(day, monthStart)) classes += " outside";
    if (isToday(day)) classes += " is-today";
    
    // Tjek om dagen er start eller slut
    if (isSameDay(day, startDate)) classes += " range-start";
    if (isSameDay(day, endDate)) classes += " range-end";

    // Tjek om dagen ligger imellem de to valgte datoer
    try {
      if (startDate && endDate && isWithinInterval(day, { 
        start: startOfDay(startDate < endDate ? startDate : endDate), 
        end: endOfDay(startDate < endDate ? endDate : startDate) 
      })) {
        classes += " in-range";
      }
    } catch (e) { /* Ignorer hvis datoer er ugyldige under valg */ }

    return classes;
  };

  return (
    <div className="simple-calendar-card">
      <div className="simple-calendar-header">
        <button onClick={() => onDateSelect(subMonths(selectedDate, 1))}>&lt;</button>
        <span>{format(selectedDate, 'MMMM yyyy', { locale: da })}</span>
        <button onClick={() => onDateSelect(addMonths(selectedDate, 1))}>&gt;</button>
      </div>
      <div className="simple-calendar-grid">
        {weekDays.map((day, idx) => <div key={`${day}-${idx}`} className="simple-weekday-label">{day}</div>)}
        {calendarDays.map((day, idx) => (
          <div key={idx} className={getDayClass(day)} onClick={() => onDateSelect(day)}>
            {format(day, 'd')}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleCalendar;
