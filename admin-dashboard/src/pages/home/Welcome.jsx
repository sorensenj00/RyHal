import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isToday, format } from 'date-fns';
import { da } from 'date-fns/locale';
import EmployeesOnWorkTodayList from '../../components/employee/EmployeesOnWorkTodayList';
import SimpleCalendarForHomePage from '../../components/calendar/SimpleCalendar';
import RoleDistributionGraph from '../../components/employee/data-cards/RoleDistributionGraph';
import UpcomingBirthdaysWidget from '../../components/statistics/employee/UpcomingBirthdaysWidget';
import WelcomeKpiRow from '../../components/home/WelcomeKpiRow';
import CriticalAlertsWidget from '../../components/home/CriticalAlertsWidget';
import useWelcomeDashboardData from './hooks/useWelcomeDashboardData';
import '../../components/home/WelcomeDashboardWidgets.css';
import './Welcome.css';

const Welcome = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const {
    loading,
    error,
    stats,
    alerts,
    employees,
  } = useWelcomeDashboardData(selectedDate);

  const selectedDateKey = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);

  const getTeamHeader = () => {
    if (isToday(selectedDate)) return "Holdet i dag";
    return `Holdet d. ${format(selectedDate, 'd. MMMM', { locale: da })}`;
  };

  const navigateTo = (path, state = {}) => {
    navigate(path, { state: { selectedDate: selectedDateKey, ...state } });
  };

  const quickActions = [
    { label: 'Bemanding', path: '/staffing-overview' },
    { label: 'Vagtoversigt', path: '/work-calendar', state: { view: 'day' } },
    { label: 'Medarbejdere', path: '/employee-list' },
    { label: 'Timer', path: '/employee-hours' },
    { label: 'Opret aktivitet', path: '/create-activity' },
    { label: 'Opret medarbejder', path: '/create-employee' },
  ];

  return (
    <div className="welcome-page-layout">
      <div className="welcome-main-content">
        <h1 className="welcome-title">Velkommen</h1>

        {error ? <div className="welcome-inline-error">{error}</div> : null}

        <WelcomeKpiRow
          stats={stats}
          loading={loading}
          onOpenShiftsClick={() => navigateTo('/staffing-overview')}
          onPendingSwapsClick={() => navigateTo('/event-shift-overview')}
          onWeeklyHoursClick={() => navigateTo('/employee-hours')}
        />

        <div className="welcome-content-grid">
          <div className="welcome-col-main">
            <div className="welcome-section-card">
              <h2 className="welcome-section-heading">Rollefordeling i dagens vagter</h2>
              <RoleDistributionGraph
                targetDate={selectedDate}
                distributionSource="shift-categories"
              />
            </div>

          </div>

          <div className="welcome-col-side">
            <CriticalAlertsWidget
              stats={stats}
              onNavigate={navigateTo}
            />

            <UpcomingBirthdaysWidget employees={employees} />
          </div>
        </div>
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
        <div className="welcome-section-card welcome-quick-actions-card">
          <div className="welcome-quick-actions-header">
            <h2 className="welcome-section-heading">Hurtige genveje</h2>
          </div>

          <div className="welcome-quick-actions-grid welcome-quick-actions-grid--sidebar">
            {quickActions.map((action) => (
              <button
                key={action.path}
                type="button"
                className="btn btn-secondary"
                onClick={() => navigateTo(action.path, action.state)}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

      </aside>
    </div>
  );
};

export default Welcome;
