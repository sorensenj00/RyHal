import React, { useMemo } from 'react';
import { differenceInCalendarDays, setYear, getYear } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCakeCandles } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { parseDateSafe } from '../../../utils/dateUtils';
import defaultAvatar from '../../../Assets/images/default-avatar.png';
import './UpcomingBirthdaysWidget.css';

const getEmployeeImage = (employee) => {
  return employee?.image
    || employee?.profileImageUrl
    || employee?.profileImageURL
    || employee?.ProfileImageUrl
    || employee?.ProfileImageURL
    || defaultAvatar;
};

const getNextBirthdayEmployee = (employees) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sorted = employees
    .filter((e) => e.birthday)
    .map((e) => {
      const bday = parseDateSafe(e.birthday);
      if (!bday) return null;

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
    .filter(Boolean)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return sorted[0] || null;
};

const UpcomingBirthdaysWidget = ({ employees = [] }) => {
  const nextBirthday = useMemo(() => getNextBirthdayEmployee(employees), [employees]);

  return (
    <div className="birthdays-widget">
      <p className="graph-title">Naeste fodselsdag</p>
      {!nextBirthday ? (
        <p className="birthdays-widget__empty">
          Ingen fodselsdato registreret.
        </p>
      ) : (
        <div className="birthdays-widget__cards">
          <article
            className={`birthdays-widget__card${nextBirthday.daysUntil === 0 ? ' birthdays-widget__card--today' : ''}`}
          >
            <div className="birthdays-widget__card-top">
              <div className="birthdays-widget__avatar-wrap">
                <img
                  src={getEmployeeImage(nextBirthday)}
                  alt={`${nextBirthday.firstName} ${nextBirthday.lastName}`}
                  className="birthdays-widget__avatar"
                />
              </div>

              <div className="birthdays-widget__person">
                <div className="birthdays-widget__card-header">
                  <span className="birthdays-widget__icon">
                    <FontAwesomeIcon icon={faCakeCandles} />
                  </span>
                  <p className="birthdays-widget__name">
                    {nextBirthday.firstName} {nextBirthday.lastName}
                  </p>
                </div>

                <p className="birthdays-widget__days">
                  {nextBirthday.daysUntil === 0
                    ? 'Har fodselsdag i dag'
                    : `Om ${nextBirthday.daysUntil} dag${nextBirthday.daysUntil === 1 ? '' : 'e'}`}
                </p>
              </div>
            </div>

            <p className="birthdays-widget__date">
              Fodselsdag: {format(parseDateSafe(nextBirthday.birthday), 'dd. MMMM', { locale: da })}
            </p>
          </article>
        </div>
      )}
    </div>
  );
};

export default UpcomingBirthdaysWidget;
