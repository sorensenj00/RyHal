import React, { useEffect, useState } from 'react';
import { isWithinInterval, parseISO, format, startOfDay, endOfDay } from 'date-fns';
import { da } from 'date-fns/locale';
import api from '../../api/axiosConfig';
import SimpleCalendar from '../calendar/SimpleCalendar';
import './EmployeeShiftList.css';

const EmployeeShiftList = ({ employeeId }) => {
    const [shifts, setShifts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));
  const [activePicker, setActivePicker] = useState('start');

    useEffect(() => {
        const fetchShifts = async () => {
            try {
                setIsLoading(true);
                const response = await api.get('/shifts');
                setShifts(response.data || []);
            } catch (err) {
                console.error('Kunne ikke hente vagter for medarbejder:', err);
                setShifts([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchShifts();
    }, []);

    const toDate = (value) => {
        if (!value) return null;
        const parsed = typeof value === 'string' ? parseISO(value) : new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

  const relevantShifts = shifts.filter(shift => {
        const shiftDate = toDate(shift.startTime);
        if (!shiftDate) return false;

    const intervalStart = startDate < endDate ? startOfDay(startDate) : startOfDay(endDate);
    const intervalEnd = startDate < endDate ? endOfDay(endDate) : endOfDay(startDate);

    return shift.employeeId === employeeId && 
           isWithinInterval(shiftDate, { start: intervalStart, end: intervalEnd });
    }).sort((a, b) => {
        const dateA = toDate(a.startTime);
        const dateB = toDate(b.startTime);

        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;

        return dateA - dateB;
    });

    if (isLoading) {
        return <div className="employee-shifts-container">Henter vagter...</div>;
    }

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
                                (() => {
                                    const start = toDate(shift.startTime);
                                    const end = toDate(shift.endTime);

                                    if (!start || !end) return null;

                                    return (
                <div key={shift.shiftId} className="shift-list-item compact">
                <div className="shift-date-badge mini">
                                        <span className="day">{format(start, 'dd')}</span>
                                        <span className="month">{format(start, 'MMM', { locale: da })}</span>
                </div>
                <div className="shift-info">
                    <strong>{shift.categoryName || 'Ukendt kategori'}</strong>
                    <span>
                                            {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                    </span>
                </div>
                </div>
                                    );
                                })()
            ))}
            </div>
        </div>
        </div>
    </div>
    );
};

export default EmployeeShiftList;
