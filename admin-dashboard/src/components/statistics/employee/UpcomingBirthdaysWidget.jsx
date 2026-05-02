import React, { useMemo } from 'react';
import { differenceInCalendarDays, setYear, getYear } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCakeCandles } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import './UpcomingBirthdaysWidget.css';

const DAYS_AHEAD = 30;

const getUpcomingBirthdays = (employees) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return employees
    .filter((e) => e.birthday)
    .map((e) => {
      const bday = new Date(e.birthday);
      let thisYearBday = setYear(bday, getYear(today));
      thisYearBday.setHours(0, 0, 0, 0);

      let daysUntil = differenceInCalendarDays(thisYearBday, today);
      if (daysUntil < 0) {
        thisYearBday = setYear(bday, getYear(today) + 1);
        daysUntil = differenceInCalendarDays(thisYearBday, today);
      }

      const turnsAge = getYear(today) + (daysUntil === 0 ? 0 : 1) - getYear(bday);

      return { ...e, daysUntil, turnsAge };
    })
    .filter((e) => e.daysUntil <= DAYS_AHEAD)
    .sort((a, b) => a.daysUntil - b.daysUntil);
};

const UpcomingBirthdaysWidget = ({ employees = [] }) => {
  const upcoming = useMemo(() => getUpcomingBirthdays(employees), [employees]);

  return (
    <div className="birthdays-widget">
      <p className="graph-title">Kommende fødselsdage</p>
      {upcoming.length === 0 ? (
        <p className="birthdays-widget__empty">
          Ingen fødselsdage inden for de næste {DAYS_AHEAD} dage.
        </p>
      ) : (
        <div className="birthdays-widget__cards">
          {upcoming.map((emp) => {
            const birthdayDate = new Date(emp.birthday);
            const birthdayLabel = format(birthdayDate, 'dd. MMMM', { locale: da });

            return (
              <article
                key={emp.employeeId}
                className={`birthdays-widget__card${emp.daysUntil === 0 ? ' birthdays-widget__card--today' : ''}`}
              >
                <div className="birthdays-widget__card-header">
                  <span className="birthdays-widget__icon">
                    <FontAwesomeIcon icon={faCakeCandles} />
                  </span>
                  <p className="birthdays-widget__name">
                    {emp.firstName} {emp.lastName}
                  </p>
                </div>
                <p className="birthdays-widget__date">Fodselsdag: {birthdayLabel}</p>
                <p className="birthdays-widget__days">
                  {emp.daysUntil === 0
                    ? 'Har fodselsdag i dag'
                    : `Om ${emp.daysUntil} dag${emp.daysUntil === 1 ? '' : 'e'}`}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UpcomingBirthdaysWidget;
