import React, { useState } from 'react';
import { format, addDays, subDays, addMonths, subMonths } from 'date-fns';
import { da } from 'date-fns/locale';
import BaseDayCalendar from '../../components/calendar/BaseDayCalendar';
import BaseMonthCalendar from '../../components/calendar/BaseMonthCalendar';
import CreateNewShift from '../../components/shift/CreateNewShift';
import { employees, shifts } from '../../data/DummyData';
import './WorkCalendar.css';

const WorkCalendar = () => {
  const [view, setView] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handlePrevious = () => {
    setSelectedDate((prev) => view === 'day' ? subDays(prev, 1) : subMonths(prev, 1));
  };

  const handleNext = () => {
    setSelectedDate((prev) => view === 'day' ? addDays(prev, 1) : addMonths(prev, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleDateChange = (event) => {
    const newDate = new Date(`${event.target.value}T00:00:00`);
    if (!Number.isNaN(newDate.getTime())) {
      setSelectedDate(newDate);
    }
  };

  const formatDateLabel = () => {
    return format(selectedDate, 'EEEE d. MMMM yyyy', { locale: da });
  };

  return (
    <div className="work-calendar">
      <div className="view-toggle-bar">
        <button
          className={`toggle-btn ${view === 'month' ? 'active' : ''}`}
          onClick={() => setView('month')}
        >
          Månedsvisning
        </button>
        <button
          className={`toggle-btn ${view === 'day' ? 'active' : ''}`}
          onClick={() => setView('day')}
        >
          Dagvisning
        </button>
      </div>

      <div className="calendar-nav-bar">
        <div className="calendar-nav-left">
          <button className="nav-btn" onClick={handlePrevious}>Forrige</button>
          <button className="nav-btn" onClick={handleNext}>Næste</button>
          <input
            type="date"
            className="date-picker"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={handleDateChange}
          />
          <button className="nav-btn" onClick={handleToday}>I dag</button>
        </div>
        
        <div className="calendar-nav-center">
          <span>{formatDateLabel()}</span>
        </div>

        <div className='calendar-nav-right'>
            {/* Knappen placeres her og får den valgte dato med */}
            <CreateNewShift initialDate={selectedDate} />
        </div>
      </div>

      <div className="calendar-content">
        {view === 'month' ? (
          <BaseMonthCalendar 
            currentDate={selectedDate} 
            onDateSelect={handleDateSelect}
            shifts={shifts}
            employees={employees}
          />
        ) : (
          <BaseDayCalendar 
            date={selectedDate} 
            employees={employees} 
            shifts={shifts} 
          />
        )}
      </div>
    </div>
  );
};

export default WorkCalendar;
