import React, { useState, useEffect, useCallback } from 'react';
import { locations } from '../../data/DummyData';
import api from '../../api/axiosConfig';
import EventShiftDayCalendar from '../../components/event-shift-calendar/EventShiftDayCalendar';
import EventShiftWeekCalendar from '../../components/event-shift-calendar/EventShiftWeekCalendar';
import { format, addDays, subDays, setWeek } from 'date-fns';
import { da } from 'date-fns/locale';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFilter,
    faChevronLeft,
    faChevronRight
} from '@fortawesome/free-solid-svg-icons';

import './EventShiftOverview.css';



const CATEGORIES = ['SPORT', 'MEETING', 'MAINTENANCE', 'OTHER'];



const EventShiftOverview = () => {
    const [view, setView] = useState('week');
    const [employees, setEmployees] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(Date.now());
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [empRes, shiftRes, eventRes] = await Promise.all([
                api.get('/employees'),
                api.get('/shifts'),
                api.get('/events')
            ]);
            setEmployees(empRes.data);
            setShifts(shiftRes.data);
            setEvents(eventRes.data);
            setError(null);
        } catch (err) {
            console.error("Fejl ved hentning af kalenderdata:", err);
            setError("Kunne ikke hente data fra databasen.");
            if (err.response) {
                console.error("Server Error Data:", err.response.data);
                console.error("Server Status:", err.response.status);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const [activeCategories, setActiveCategories] = useState(CATEGORIES);
    const [activeLocations, setActiveLocations] = useState(
        locations.map(l => l.id)
    );

    const toggleCategory = (cat) => {
        setActiveCategories(prev =>
            prev.includes(cat)
                ? prev.filter(c => c !== cat)
                : [...prev, cat]
        );
    };

    const toggleLocation = (locId) => {
        setActiveLocations(prev =>
            prev.includes(locId)
                ? prev.filter(id => id !== locId)
                : [...prev, locId]
        );
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setView('day');
    };

    return (
        <div className="event-overview-page">

            {/* HEADER */}
            <header className="overview-header">
                <div className="header-title-section">
                    <h1>Aktivitet- og Vagtoversigt</h1>
                    {/*<p>mulig fremtidig tekst</p>*/}
                    
                </div>
                <div className="view-toggle-bar">
                        <button
                            className={`toggle-btn ${view === 'week' ? 'active' : ''}`}
                            onClick={() => setView('week')}
                        >
                            Ugeskema
                        </button>
                        <button
                            className={`toggle-btn ${view === 'day' ? 'active' : ''}`}
                            onClick={() => setView('day')}
                        >
                            Dagskema
                        </button>
                </div>    
                
                <div className="header-controls">
                    <div className="date-navigation">

                        {/* ⬅️ dag/uge tilbage */}
                        <button
                            onClick={() => setSelectedDate(prev =>
                                subDays(prev, view === 'week' ? 7 : 1)
                            )}
                            className="nav-btn"
                        >
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>

                        {/* 📅 date picker */}
                        {view === 'week' ? (
                            <input
                                type="week"
                                value={format(selectedDate, "yyyy-'W'II")}
                                onChange={(e) => {
                                    const [year, week] = e.target.value.split('-W');

                                    const newDate = setWeek(new Date(Number(year), 0, 1), Number(week), { locale: da });

                                    setSelectedDate(newDate);
                                }}
                                className="date-input"
                        />) : (
                        <input
                            type="date"
                            value={format(selectedDate, 'yyyy-MM-dd')}
                            onChange={(e) => setSelectedDate(new Date(e.target.value))}
                            className="date-input"
                        />)}

                        {/* ➡️ dag/uge frem */}
                        <button
                            onClick={() =>
                                setSelectedDate(prev =>
                                    addDays(prev, view === 'week' ? 7 : 1)
                                )}
                        className="nav-btn"
                        >
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>

                    </div>
                </div>
            </header>

            {/* FILTERS */}
            <div className="ESO-filter-section card">
                <div className="ESO-filter-group">
                    <label>
                        <FontAwesomeIcon icon={faFilter} /> Kategorier:
                    </label>

                    <div className="filter-chips">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                className={`filter-chip cat-${cat.toLowerCase()} ${activeCategories.includes(cat) ? 'active' : ''
                                    }`}
                                onClick={() => toggleCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="ESO-filter-group">
                    <label>Lokationer:</label>

                    <div className="filter-chips">
                        {locations.map(loc => (
                            <button
                                key={loc.id}
                                className={`filter-chip loc-chip ${activeLocations.includes(loc.id) ? 'active' : ''
                                    }`}
                                onClick={() => toggleLocation(loc.id)}
                            >
                                {loc.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            
            <div className="calendar-content">
                {view === 'week' ? (
                    <EventShiftWeekCalendar
                        date={selectedDate}
                        onDateSelect={handleDateSelect}
                        shifts={shifts}
                        employees={employees}
                        events={events}
                        locations={locations}
                        onRefresh={fetchData}
                    />
                ) : (
                    <EventShiftDayCalendar
                        date={selectedDate}
                        employees={employees}
                        shifts={shifts}
                        onRefresh={fetchData}
                    />
                )}
            </div>

        </div>
    );
};

export default EventShiftOverview;