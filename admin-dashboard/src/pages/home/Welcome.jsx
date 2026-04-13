import React, { useState } from 'react';
import { isToday, format } from 'date-fns';
import { da } from 'date-fns/locale';
import EmployeesOnWorkTodayList from '../../components/employee/EmployeesOnWorkTodayList';
import SimpleCalendarForHomePage from '../../components/calendar/SimpleCalendarForHomePage';
import './Welcome.css';

const Welcome = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Logik til at bestemme overskriften
  const getTeamHeader = () => {
    if (isToday(selectedDate)) {
      return "Holdet i dag";
    }
    // Formaterer datoen til f.eks. "Holdet d. 14. april"
    return `Holdet d. ${format(selectedDate, 'd. MMMM', { locale: da })}`;
  };

  return (
    <div className="welcome-page-layout">
      <div className="welcome-main-content">
        <h1 className="welcome-title">Velkommen</h1>
        
        {/* Dynamisk overskrift baseret på valgt dato */}
        <h2 className="welcome-team-header">{getTeamHeader()}</h2>
        
        <EmployeesOnWorkTodayList targetDate={selectedDate} />
      </div>
      
      <aside className="welcome-sidebar">
        <SimpleCalendarForHomePage 
          selectedDate={selectedDate} 
          onDateSelect={setSelectedDate} 
        />
      </aside>
    </div>
  );
};

export default Welcome;
