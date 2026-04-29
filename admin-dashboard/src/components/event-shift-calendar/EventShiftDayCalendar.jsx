import React, { useState } from 'react';
import { isSameDay, parseISO, getHours, getMinutes } from 'date-fns';
import EmployeeCardForCalendar from '../employee/EmployeeCardForCalendar';
import EditShift from '../shift/EditShift';
import './EventShiftDayCalendar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol, faUsers, faTools } from '@fortawesome/free-solid-svg-icons';

const EventShiftDayCalendar = ({ date = new Date(), employees = [], shifts = [], events = [], locations = [], onRefresh }) => {
    const [selectedShift, setSelectedShift] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const CATEGORY_CLASSNAME = {
        SPORT: 'sport',
        MØDE: 'mode',
        VEDLIGEHOLDELSE: 'vedligeholdelse',
        ANDET: 'andet'
    };
  const START_HOUR = 5;
  const TOTAL_HOURS = 24;
  const STEPS_PER_HOUR = 4; // Giver 15-minutters præcision

  const hours = Array.from({ length: TOTAL_HOURS }, (_, idx) => (idx + START_HOUR) % 24);

  //getStyles
  const getShiftStyles = (startStr, endStr) => {
    if (!startStr || !endStr) return { display: 'none' };

    const start = typeof startStr === 'string' ? parseISO(startStr) : new Date(startStr);
    const end = typeof endStr === 'string' ? parseISO(endStr) : new Date(endStr);

    // Beregn decimaltid (f.eks. 8:15 bliver 8.25)
    let startDecimal = getHours(start) + getMinutes(start) / 60;
    let endDecimal = getHours(end) + getMinutes(end) / 60;

    // Juster for start-tidspunktet på kalenderen (kl. 05:00)
    let gridStartOffset = startDecimal - START_HOUR;
    if (gridStartOffset < 0) gridStartOffset += 24;

    let duration = endDecimal - startDecimal;
    if (duration <= 0) duration += 24;

    // Konverter til grid-kolonner (1 time = 4 kolonner)
    const colStart = Math.round(gridStartOffset * STEPS_PER_HOUR) + 1;
    const colSpan = Math.round(duration * STEPS_PER_HOUR);

    return {
      gridColumn: `${colStart} / span ${colSpan}`,
    };
    };

  const getEventStyles = (startStr, endStr) => {
        if (!startStr || !endStr) return { display: 'none' };

        const start = typeof startStr === 'string' ? parseISO(startStr) : new Date(startStr);
        const end = typeof endStr === 'string' ? parseISO(endStr) : new Date(endStr);

        const dayIndex = (start.getDay() + 6) % 7;

        const startMinutes = getHours(start) * 60 + getMinutes(start);
        let endMinutes = getHours(end) * 60 + getMinutes(end);

        let duration = endMinutes - startMinutes;
        if (duration <= 0) duration += 24 * 60;

        const STEPS_PER_HOUR = 4; // 15 min
        const TOTAL_COLUMNS_PER_DAY = 24 * STEPS_PER_HOUR;

        const colStart =
            dayIndex * TOTAL_COLUMNS_PER_DAY +
            Math.round(startMinutes / 15) +
            1;

        const colSpan = Math.max(1, Math.round(duration / 15));

        return {
            gridColumn: `${colStart} / span ${colSpan}`,
            gridRow: '1 / 2'
        };
    };

  //filtrer events og shifts
  const shiftsThisDay = (shifts || []).filter(s => {
    if (!s?.startTime) return false;
    const shiftDate = typeof s.startTime === 'string' ? parseISO(s.startTime) : new Date(s.startTime);
    return isSameDay(shiftDate, date);
  });

  const eventsThisDay = (events || []).filter(e => {
        if (!e?.startTime) return false;
        const eventDate = typeof e.startTime === 'string'
            ? parseISO(e.startTime)
            : new Date(e.startTime);
        return isSameDay(eventDate, date);
    })

  //opdel shifts og events i grupper
  const shiftsByCategory = shiftsThisDay.reduce((groups, shift) => {
    const catId = shift.categoryId || 999;
    if (!groups[catId]) groups[catId] = [];
    groups[catId].push(shift);
    return groups;
  }, {});

  const eventsByLocationAndDay = eventsThisDay.reduce((groups, event) => {

        const bookings = event.locations || [];

        // If no locations → unassigned
        if (!bookings.length) {
            const eventDate = new Date(event.startTime);
            const dayIndex = (eventDate.getDay() + 6) % 7;

            if (!groups['unassigned']) groups['unassigned'] = {};
            if (!groups['unassigned'][dayIndex]) groups['unassigned'][dayIndex] = [];

            groups['unassigned'][dayIndex].push(event);
            return groups;
        }

        // Handle each location booking
        bookings.forEach(loc => {
            const locId = loc.locationId;

            const eventDate = new Date(loc.startTime || event.startTime);
            const dayIndex = (eventDate.getDay() + 6) % 7;

            if (!groups[locId]) groups[locId] = {};
            if (!groups[locId][dayIndex]) groups[locId][dayIndex] = [];

            groups[locId][dayIndex].push({
                ...event,
                startTime: loc.startTime || event.startTime,
                endTime: loc.endTime || event.endTime,
                locationId: locId
            });
        });

        return groups;
    }, {});


  const activeCategoryIds = Object.keys(shiftsByCategory).sort((a, b) => a - b);

  const getEventIcon = (category) => {
        switch (category) {
            case 'SPORT':
                return faFutbol;
            case 'MØDE':
                return faUsers;
            case 'VEDLIGEHOLDELSE':
                return faTools;
            default:
                return faUsers;
        }
    };

  return (
    <div className="day-calendar-container">
      <div className="day-calendar">
        {/* Header - flugter med sidebaren */}
        <div className="calendar-grid-row timeline-header">
          <div className="sidebar-cell sidebar-header-spacer" />
          <div className="timeline-data-container hour-labels">
            {hours.map((hour) => (
              <div key={hour} className="timeline-hour">
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>
        </div>

              <div className="calendar-body">
                  {/* Events section */}
                  <div className="calendar-grid-row week-role-row week-full-width-row">
                      <div className="employee-role-title">
                          Lokationer
                      </div>
                  </div>

                  <div className="timeline-data-container role-placeholder" />

                  {
                      Object.entries(eventsByLocationAndDay).map(([locId, daysObj]) => {
                          const location = locations.find(l => l.id === Number(locId));
                          const locationName = location?.name || 'Mangler lokation';
                          const isUnassigned = locId === 'unassigned';

                          return (
                              <div key={locId} className="calendar-grid-row week-shift-row">
                                  <div className="sidebar-cell">
                                      <div className="employee-role-title">
                                          {locationName}
                                      </div>
                                  </div>

                                  <div className="timeline-data-container">
                                      {Object.entries(daysObj).map(([dayIndex, events]) =>
                                          events.map(event => {
                                              const eventStyle = getEventStyles(event.startTime, event.endTime);

                                              return (
                                                  <div
                                                      key={event.id}
                                                      className={`event-block 
                                                            ${CATEGORY_CLASSNAME[event.category] || 'andet'} 
                                                            ${isUnassigned ? 'unassigned' : ''}`}
                                                      style={eventStyle}
                                                      onClick={() => setSelectedEvent(event)}
                                                  >
                                                      <div className="event-content">
                                                          <FontAwesomeIcon
                                                              icon={getEventIcon(event.category)}
                                                              className="event-icon"
                                                          />
                                                          <span className="event-title">
                                                              {event.name}
                                                          </span>
                                                      </div>
                                                  </div>
                                              );
                                          })
                                      )}
                                  </div>
                              </div>
                          );
                      })
                  }
                  {/* Shifts-sections */}
          {activeCategoryIds.map((catId) => {
            const shiftsInCat = shiftsByCategory[catId];
            const categoryName = shiftsInCat[0]?.categoryName || 'Ukendt kategori';

            return (
              <React.Fragment key={catId}>
                {/* Kategori-overskrift række */}
                <div className="calendar-grid-row role-row full-width-row">
                  <div className="employee-role-title">
                    {categoryName}
                  </div>
                </div>
                <div className="timeline-data-container role-placeholder" />

                {
              shiftsInCat.map((shift) => {
                const employee = shift.employeeId
                  ? employees?.find(e => e.employeeId === shift.employeeId)
                  : null;

                const isUnassigned = !employee;
                const shiftStyle = getShiftStyles(shift.startTime, shift.endTime);

                return (
                  <div key={shift.shiftId} className="calendar-grid-row shift-row">
                    <div className="sidebar-cell">
                      {!isUnassigned ? (
                        <EmployeeCardForCalendar
                          employee={{
                            ...employee,
                            role: categoryName
                          }}
                        />
                      ) : (
                        <div className="unassigned-shift-label">Mangler medarbejder</div>
                      )}
                    </div>

                    <div className="timeline-data-container">
                      <div
                        className={`shift-line ${isUnassigned ? 'unassigned' : ''}`}
                        style={{
                          ...shiftStyle,
                          backgroundColor: isUnassigned ? '#ef4444' : (shift.categoryColor || '#94a3b8')
                        }}
                        onClick={() => setSelectedShift(shift)}
                      >
                        <span className="shift-text">
                          {isUnassigned ? "LEDIG VAGT" : employee?.firstName}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            }
              </React.Fragment>
        );
          })}
      </div>
    </div>

      {
    selectedShift && (
      <EditShift
        shift={selectedShift}
        onClose={() => setSelectedShift(null)}
        onRefresh={onRefresh}
      />
    )
  }
    </div >
  );
};

export default EventShiftDayCalendar;
