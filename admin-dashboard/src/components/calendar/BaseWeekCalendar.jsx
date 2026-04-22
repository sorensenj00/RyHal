import React, { useState } from 'react';
import { isSameDay, parseISO, getHours, getMinutes } from 'date-fns';
import EmployeeCardForCalendar from '../employee/EmployeeCardForCalendar';
import EditShift from '../shift/EditShift';
import './BaseWeekCalendar.css';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

const BaseWeekCalendar = ({ date = new Date(), employees = [], shifts = [], onRefresh }) => {
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

    const activeCategoryIds = Object.keys(shiftsByCategory).sort((a, b) => a - b);

    return (
        <div className="week-calendar-container">
            <div className="week-calendar">
                {/* Header - flugter med sidebaren */}
                <div className="week-calendar-grid-row week-timeline-header">
                    <div className="week-sidebar-cell sidebar-header-spacer" />
                    <div className="week-timeline-data-container day-labels">
                        {weekDays.map((day, idx) => (
                            <div key={day} className="timeline-week">
                                {day}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="week-calendar-body">
                    {activeCategoryIds.map((catId) => {
                        const shiftsInCat = shiftsByCategory[catId];
                        const allShiftsInCat = Object.values(shiftsInCat).flat();
                        const categoryName = allShiftsInCat[0]?.categoryName || 'Ukendt kategori';

                        return (
                            <React.Fragment key={catId}>
                                {/* Kategori-overskrift række */}
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

export default BaseWeekCalendar;
