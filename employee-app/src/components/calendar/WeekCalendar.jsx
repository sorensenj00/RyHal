import React from 'react';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { da } from 'date-fns/locale';
import './WeekCalendar.css';

const WeekCalendar = ({ shifts = [], weekRange }) => {
  if (!weekRange?.start) return null;

  const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(weekRange.start), i));

  const getShiftsForDay = (day) => {
    return (shifts || []).filter((shift) => {
      const shiftDate = typeof shift.startTime === 'string' ? parseISO(shift.startTime) : new Date(shift.startTime);
      return isSameDay(shiftDate, day);
    });
  };

  return (
    <div className="week-calendar-container">
      <div className="calendar-grid">
        {days.map((day) => {
          const dayShifts = getShiftsForDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div key={day.toISOString()} className={`calendar-day ${isToday ? 'is-today' : ''}`}>
              <div className="day-header">
                <span className="day-name">{format(day, 'EEEE', { locale: da })}</span>
                <span className="day-date">{format(day, 'd. MMM', { locale: da })}</span>
              </div>
              
              <div className="day-shifts">
                {dayShifts.length > 0 ? (
                  dayShifts.map((shift) => (
                    <div 
                      key={shift.shiftId} 
                      className="shift-card"
                      style={{ '--accent-color': shift.categoryColor || '#94a3b8' }}
                    >
                      <div className="shift-time">
                        {format(new Date(shift.startTime), 'HH:mm')} - {format(new Date(shift.endTime), 'HH:mm')}
                      </div>
                      <div className="shift-category">{shift.categoryName}</div>
                    </div>
                  ))
                ) : (
                  <div className="no-shifts">Fri</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeekCalendar;
