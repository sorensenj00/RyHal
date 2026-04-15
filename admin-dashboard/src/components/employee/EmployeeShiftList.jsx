import React, { useState } from 'react';
import { isWithinInterval, parseISO, format, startOfDay, endOfDay } from 'date-fns';
import { da } from 'date-fns/locale';
import { shifts } from '../../data/DummyData';
import SimpleCalendar from '../calendar/SimpleCalendar';
import './EmployeeShiftList.css';

const EmployeeShiftList = ({ employeeId }) => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));
  const [activePicker, setActivePicker] = useState('start');

  const relevantShifts = shifts.filter(shift => {
    const shiftDate = parseISO(shift.date);
    const intervalStart = startDate < endDate ? startOfDay(startDate) : startOfDay(endDate);
    const intervalEnd = startDate < endDate ? endOfDay(endDate) : endOfDay(startDate);

    return shift.employeeId === employeeId && 
           isWithinInterval(shiftDate, { start: intervalStart, end: intervalEnd });
  }).sort((a, b) => parseISO(a.date) - parseISO(b.date));

    return (
    <div className="employee-shifts-container">
        {/* Kalenderen øverst */}
        <div className="calendar-controls-wrapper">
        <div className="integrated-date-picker">
            <div className="picker-row">
            <button className={`mini-picker ${activePicker === 'start' ? 'active' : ''}`} onClick={() => setActivePicker('start')}>
                <span>Fra: {format(startDate, 'dd/MM/yy')}</span>
            </button>
            <button className={`mini-picker ${activePicker === 'end' ? 'active' : ''}`} onClick={() => setActivePicker('end')}>
                <span>Til: {format(endDate, 'dd/MM/yy')}</span>
            </button>
            </div>
            <SimpleCalendar 
            selectedDate={activePicker === 'start' ? startDate : endDate} 
            onDateSelect={activePicker === 'start' ? setStartDate : setEndDate}
            startDate={startDate}
            endDate={endDate}
            />
        </div>
        </div>

        {/* Vagterne lige under */}
        <div className="shifts-list-container">
        <h4>Vagter ({relevantShifts.length})</h4>
        <div className="shifts-list-scrollable">
            <div className="shift-list-grid">
            {relevantShifts.map(shift => (
                <div key={shift.id} className="shift-list-item compact">
                <div className="shift-date-badge mini">
                    <span className="day">{format(parseISO(shift.date), 'dd')}</span>
                    <span className="month">{format(parseISO(shift.date), 'MMM', { locale: da })}</span>
                </div>
                <div className="shift-info">
                    <strong>{shift.category}</strong>
                    <span>{shift.startTime} - {shift.endTime}</span>
                </div>
                </div>
            ))}
            </div>
        </div>
        </div>
    </div>
    );
};

export default EmployeeShiftList;
