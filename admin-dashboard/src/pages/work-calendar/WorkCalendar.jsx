import React, { useState, useEffect, useCallback } from 'react';
import { format, addDays, subDays, addMonths, subMonths } from 'date-fns';
import { da } from 'date-fns/locale'; // Korrekt import af dansk sprog
import api from '../../api/axiosConfig';
import BaseDayCalendar from '../../components/calendar/BaseDayCalendar';
import BaseMonthCalendar from '../../components/calendar/BaseMonthCalendar';
import CreateNewShift from '../../components/shift/CreateNewShift';
import './WorkCalendar.css';

const WorkCalendar = () => {
  const [view, setView] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Vi pakker fetchData ind i useCallback, så den kan sendes som prop uden at trigge unødige re-renders
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [empRes, shiftRes] = await Promise.all([
        api.get('/employees'),
        api.get('/shifts')
      ]);
      setEmployees(empRes.data);
      setShifts(shiftRes.data);
      setError(null);
    } catch (err) {
      console.error("Fejl ved hentning af kalenderdata:", err);
      setError("Kunne ikke hente data fra databasen.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setView('day'); // Valgfrit: hop til dagvisning når man klikker på en dato i måneden
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

  if (loading && !shifts.length) return <div className="loader">Henter vagtplan...</div>;
  if (error) return <div className="error-message">{error}</div>;

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
            {/* CreateNewShift får nu også onRefresh så den kan opdatere listen ved ny vagt */}
            <CreateNewShift initialDate={selectedDate} onRefresh={fetchData} />
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
            onRefresh={fetchData}
          />
        )}
      </div>
    </div>
  );
};

export default WorkCalendar;
