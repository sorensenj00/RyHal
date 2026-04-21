import React, { useState } from 'react';
import { isToday, format } from 'date-fns';
import { da } from 'date-fns/locale';
import EmployeesOnWorkTodayList from '../../components/employee/EmployeesOnWorkTodayList';
import SimpleCalendarForHomePage from '../../components/calendar/SimpleCalendar';
import RoleDistributionGraph from '../../components/employee/data-cards/RoleDistributionGraph';
import './Welcome.css';

const Welcome = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const getTeamHeader = () => {
    if (isToday(selectedDate)) return "Holdet i dag";
    return `Holdet d. ${format(selectedDate, 'd. MMMM', { locale: da })}`;
  };

  return (
    <div className="welcome-page-layout">
      <div className="welcome-main-content">
        <h1 className="welcome-title">Velkommen</h1>

        {/* Øverste sektion til grafer og nøgletal */}
        <div className="dashboard-top-row">
          <div className="dashboard-item">
            <RoleDistributionGraph
              targetDate={selectedDate}
              distributionSource="shift-categories"
            />
          </div>
          {/* Her kan du senere tilføje flere komponenter, f.eks. en BelægningsGraph */}
          <div className="dashboard-item placeholder-item">
             <p className="text-muted">Flere data følger...</p>
          </div>
        </div>

        {/* Nederste sektion til medarbejderlisten */}
        <div className="team-section">
          <h2 className="welcome-team-header">{getTeamHeader()}</h2>
          <EmployeesOnWorkTodayList targetDate={selectedDate} />
        </div>
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
