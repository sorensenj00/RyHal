import React, { useState } from 'react';
import { parseISO, getHours, getMinutes } from 'date-fns';
import EmployeeCardForCalendar from '../employee/EmployeeCardForCalendar';
import EditShift from '../shift/EditShift';
import './EventShiftWeekCalendar.css';
import { startOfWeek, endOfWeek, isWithinInterval, addDays } from 'date-fns';

const EventShiftWeekCalendar = ({ date = new Date(), onDateSelect, employees = [], shifts = [],events = [], locations = [], onRefresh }) => {
    const [selectedShift, setSelectedShift] = useState(null);


    const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
    const TOTAL_DAYS = 7;
    const weekDays = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];


    const days = Array.from({ length: TOTAL_DAYS }, (_, idx) => idx % 7);

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

    const eventsByLocation = eventsThisWeek.reduce((groups, event) => {
        const locId = event.locationId || 'unassigned';

        if (!groups[locId]) groups[locId] = [];
        groups[locId].push(event);

        return groups;
    }, {});

    const activeCategoryIds = Object.keys(shiftsByCategory).sort((a, b) => a - b);

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
                        Object.entries(eventsByLocation).map(([locId, events]) => {
                            const location = locations.find(l => l.locationId === Number(locId));
                            const locationName = location?.name || 'Mangler lokation';
                            const isUnassigned = locId === 'unassigned';

                            return (
                                <div key={locId} className="week-calendar-grid-row week-shift-row">

                                    {/* Left side: location name */}
                                    <div className="week-sidebar-cell">
                                        <div className="week-employee-role-title">
                                            {locationName}
                                        </div>
                                    </div>

                                    {/* Timeline */}
                                    <div className="week-timeline-data-container">
                                        {events.map(event => {
                                            const eventStyle = getEventStyles(event.startTime, event.endTime);

                                            return (
                                                <div
                                                    key={event.eventId}
                                                    className={`week-shift-line ${isUnassigned ? 'unassigned' : ''}`}
                                                    style={{
                                                        ...eventStyle,
                                                        backgroundColor: isUnassigned
                                                            ? '#ef4444'
                                                            : (event.categoryColor || '#94a3b8')
                                                    }}
                                                    onClick={() => setSelectedShift(event)}
                                                >
                                                    <span className="shift-text" />
                                                </div>
                                            );
                                        })}
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
        </div >
    );
};

export default EventShiftWeekCalendar;
