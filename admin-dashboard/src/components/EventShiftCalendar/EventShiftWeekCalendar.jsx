import React, { useState } from 'react';
import { parseISO, getHours, getMinutes } from 'date-fns';
import EmployeeCardForCalendar from '../employee/EmployeeCardForCalendar';
import EditShift from '../shift/EditShift';
import EventModal from '../heatmap/EventModal.jsx'
import './EventShiftWeekCalendar.css';
import { startOfWeek, endOfWeek, isWithinInterval, addDays } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol, faUsers, faTools } from '@fortawesome/free-solid-svg-icons';
/*import api from '../../api/axiosConfig';*/

const EventShiftWeekCalendar = ({ date = new Date(), onDateSelect, employees = [], shifts = [],events = [], locations = [], onRefresh }) => {
    const [selectedShift, setSelectedShift] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    /*const [allEvents, setAllEvents] = useState([]);*/
    const CATEGORY_CLASSNAME = {
        SPORT: 'sport',
        MØDE: 'mode',
        VEDLIGEHOLDELSE: 'vedligeholdelse',
        ANDET: 'andet'
    };
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
    const TOTAL_DAYS = 7;
    const weekDays = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];


    const days = Array.from({ length: TOTAL_DAYS }, (_, idx) => idx % 7);

    //getStyles
    const getShiftStyles = (startStr, endStr) => {
        if (!startStr || !endStr) return { display: 'none' };

        const start = typeof startStr === 'string' ? parseISO(startStr) : new Date(startStr);
        const end = typeof endStr === 'string' ? parseISO(endStr) : new Date(endStr);

        const dayIndex = (start.getDay() + 6) % 7; // Monday = 0

        const startDecimal = getHours(start) + getMinutes(start) / 60;
        let endDecimal = getHours(end) + getMinutes(end) / 60;

        let duration = endDecimal - startDecimal;
        if (duration <= 0) duration += 24;

        const STEPS_PER_HOUR = 4;
        const COLUMNS_PER_DAY = 24 * STEPS_PER_HOUR;

        const timeOffset = Math.round(startDecimal * STEPS_PER_HOUR);
        const colStart = dayIndex * COLUMNS_PER_DAY + timeOffset + 1;

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

    //filrering af shifts og events
    const shiftsThisWeek = (shifts || []).filter(s => {
        if (!s?.startTime) return false;
        const shiftDate = typeof s.startTime === 'string'
            ? parseISO(s.startTime)
            : new Date(s.startTime);

        return isWithinInterval(shiftDate, {
            start: weekStart,
            end: weekEnd
        });
    });

    const eventsThisWeek = (events || []).filter(e => {
        if (!e?.startTime) return false;
        const eventDate = typeof e.startTime === 'string'
            ? parseISO(e.startTime)
            : new Date(e.startTime);
        return isWithinInterval(eventDate, {
            start: weekStart,
			end: weekEnd
        })
    })

    //opdel shifts og events i grupper
    const shiftsByCategory = shiftsThisWeek.reduce((groups, shift) => {
        const catId = shift.categoryId || 999;
        const shiftDate = typeof shift.startTime === 'string'
            ? parseISO(shift.startTime)
            : new Date(shift.startTime);
        const dayIndex = (shiftDate.getDay() + 6) % 7; // Mandag = 0
        if (!groups[catId]) groups[catId] = {};
        if (!groups[catId][dayIndex]) groups[catId][dayIndex] = [];

        groups[catId][dayIndex].push(shift);
        return groups;
    }, {});

    const eventsByLocationAndDay = eventsThisWeek.reduce((groups, event) => {

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

    //hjælpemetoder
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

    ////crud for event
    //const buildUpdatePayload = (event) => {
    //    const eventDate = (event.startTime || '').slice(0, 10) || event.date || null;

    //    return {
    //        Name: event.name,
    //        Description: event.description || event.comment || '',
    //        StartTime: event.startTime,
    //        EndTime: event.endTime,
    //        Date: eventDate,
    //        Category: CATEGORY_TO_ENUM[event.category] ?? CATEGORY_TO_ENUM.ANDET,
    //        Locations: [
    //            {
    //                LocationId: Number(event.locationId),
    //                StartTime: event.startTime,
    //                EndTime: event.endTime,
    //                Date: eventDate
    //            }
    //        ],
    //        TemplateId: null,
    //        CreatedBy: 'system',
    //        IsRecurring: false,
    //        RecurrenceFrequency: null,
    //        RecurrenceEndDate: null,
    //        IsDraft: false
    //    };
    //};
    //const CATEGORY_TO_ENUM = {
    //    SPORT: 0,
    //    MØDE: 1,
    //    VEDLIGEHOLDELSE: 2,
    //    ANDET: 3
    //};

    //const handleUpdateEvent = async (updatedEvent) => {
    //    const originalEvent = allEvents.find((evt) => evt.id === updatedEvent.id);
    //    setAllEvents(prev => prev.map(evt => evt.id === updatedEvent.id ? updatedEvent : evt));

    //    try {
    //        await api.put(`/events/${updatedEvent.eventId || updatedEvent.id}`, buildUpdatePayload(updatedEvent));
    //        setSelectedEvent(null);
    //    } catch (error) {
    //        console.error('Kunne ikke opdatere event via API:', error?.response?.data || error);
    //        if (originalEvent) {
    //            setAllEvents(prev => prev.map(evt => evt.id === originalEvent.id ? originalEvent : evt));
    //        }
    //        alert('Kunne ikke gemme ændringer på serveren.');
    //    }
    //};

    //const handleDeleteEvent = async (id) => {
    //    if (window.confirm("Er du sikker på, at du vil slette dette event?")) {
    //        const backup = allEvents;
    //        setAllEvents(prev => prev.filter(evt => (evt.eventId || evt.id) !== id));

    //        try {
    //            await api.delete(`/events/${id}`);
    //            setSelectedEvent(null);
    //        } catch (error) {
    //            console.error('Kunne ikke slette event via API:', error);
    //            setAllEvents(backup);
    //            alert('Kunne ikke slette event på serveren.');
    //        }
    //    }
    //};

    //html

    return (
        <div className="week-calendar-container">
            <div className="week-calendar">
                {/* Header - flugter med sidebaren */}
                <div className="week-calendar-grid-row week-timeline-header">
                    <div className="week-sidebar-cell sidebar-header-spacer" />
                    <div className="week-timeline-data-container day-labels">
                        {weekDays.map((label, idx) => {
                            const dayDate = addDays(weekStart, idx);

                            return (
                                <div
                                    className="timeline-day"
                                    key={label}

                                    onClick={() => onDateSelect(dayDate)}
                                >
                                    {label + " d. " + dayDate.getDate() + "/" + (dayDate.getMonth() + 1)}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="week-calendar-body">
                    {/* Events section */}
                    <div className="calendar-grid-row week-role-row week-full-width-row">
                        <div className="week-employee-role-title">
                            Lokationer
                        </div>
                    </div>

                    <div className="week-timeline-data-container role-placeholder" />

                    {
                        Object.entries(eventsByLocationAndDay).map(([locId, daysObj]) => {
                            const location = locations.find(l => l.id === Number(locId));
                            const locationName = location?.name || 'Mangler lokation';
                            const isUnassigned = locId === 'unassigned';

                            return (
                                <div key={locId} className="week-calendar-grid-row week-shift-row">
                                    <div className="week-sidebar-cell">
                                        <div className="week-employee-role-title">
                                            {locationName}
                                        </div>
                                    </div>

                                    <div className="week-timeline-data-container">
                                        {Object.entries(daysObj).map(([dayIndex, events]) =>
                                            events.map(event => {
                                                const eventStyle = getEventStyles(event.startTime, event.endTime);

                                                return (
                                                    <div
                                                        key={event.id}
                                                        className={`week-event-block 
                                                            ${CATEGORY_CLASSNAME[event.category] || 'andet'} 
                                                            ${isUnassigned ? 'unassigned' : ''}`}
                                                        style={eventStyle}
                                                        onClick={() => setSelectedEvent(event)}
                                                    >
                                                        <div className="week-event-content">
                                                            <FontAwesomeIcon
                                                                icon={getEventIcon(event.category)}
                                                                className="week-event-icon"
                                                            />
                                                            <span className="week-event-title">
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
                        const allShiftsInCat = Object.values(shiftsInCat).flat();
                        const categoryName = allShiftsInCat[0]?.categoryName || 'Ukendt kategori';

                        return (
                            
                            <React.Fragment key={catId}>
								
                                
                                <div className="calendar-grid-row week-role-row week-full-width-row">
                                    <div className="week-employee-role-title">
                                        {categoryName}
                                    </div>
                                </div>
                                <div className="week-timeline-data-container role-placeholder" />

                                {
                                    days.map((dayIndex) => {
                                        const shiftsForDay = shiftsInCat[dayIndex] || [];

                                        return shiftsForDay.map((shift) => {
                                            const employee = shift.employeeId
                                                ? employees.find(e => e.employeeId === shift.employeeId)
                                                : null;

                                            const isUnassigned = !employee;
                                            const shiftStyle = getShiftStyles(shift.startTime, shift.endTime);

                                            return (
                                                <div key={shift.shiftId} className="week-calendar-grid-row week-shift-row">
                                                    <div className="week-sidebar-cell">
                                                        {!isUnassigned ? (
                                                            <EmployeeCardForCalendar
                                                                employee={{
                                                                    ...employee,
                                                                    role: categoryName
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="week-unassigned-shift-label">Mangler medarbejder</div>
                                                        )}
                                                    </div>

                                                    <div className="week-timeline-data-container">
                                                        <div
                                                            className={`week-shift-line ${isUnassigned ? 'unassigned' : ''}`}
                                                            style={{
                                                                ...shiftStyle,
                                                                backgroundColor: isUnassigned
                                                                    ? '#ef4444'
                                                                    : (shift.categoryColor || '#94a3b8')
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
                                        });
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
            { 
                selectedEvent && (
                    <EventModal
                        event={selectedEvent}
                        locations={locations}
                        onClose={() => setSelectedEvent(null)}
                        onRefresh={onRefresh}
                        onSave={handleUpdateEvent}
                        onDelete={handleDeleteEvent}
                    />
                )
            }
        </div >
    );
};

export default EventShiftWeekCalendar;
