import React, { useState, useEffect, useCallback } from 'react';
import EventHeatmap from '../../components/heatmap/EventHeatmap';
import { locations } from '../../data/DummyData';
import api from '../../api/axiosConfig';
import BaseDayCalendar from '../../components/calendar/BaseDayCalendar';
import BaseWeekCalendar from '../../components/calendar/BaseWeekCalendar';
import { format, addDays, subDays } from 'date-fns';
import { da } from 'date-fns/locale';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFilter,
    faCalendarAlt,
    faChevronLeft,
    faChevronRight
} from '@fortawesome/free-solid-svg-icons';

import './EventShiftOverview.css';



const CATEGORIES = ['SPORT', 'MEETING', 'MAINTENANCE', 'OTHER'];



const EventShiftOverview = () => {
    const [view, setView] = useState('week');
    const [employees, setEmployees] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [selectedDate, setSelectedDate] = useState(Date.now());
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [empRes, shiftRes] = await Promise.all([
                api.get('/employees'),
                api.get('/shifts')
            ]);
            setEmployees(empRes.data);
            setShifts(shiftRes.data);
            setError(null);
        } catch (err) {
            console.error("Fejl ved hentning af kalenderdata:", err);
            setError("Kunne ikke hente data fra databasen.");
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
        setView('day'); // Valgfrit: hop til dagvisning når man klikker på en dato i måneden
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
                            onClick={() => setSelectedDate(prev => subDays(prev, 1))}
                            className="nav-btn"
                        >
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>

                        {/* 📅 date picker */}
                        <input
                            type="date"
                            value={format(selectedDate, 'yyyy-MM-dd')}
                            onChange={(e) => setSelectedDate(new Date(e.target.value))}
                            className="date-input"
                        />

                        {/* ➡️ dag/uge frem */}
                        <button
                            onClick={() => setSelectedDate(prev => addDays(prev, 1))}
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
                    <BaseWeekCalendar
                        currentDate={selectedDate}
                        onDateSelect={handleDateSelect}
                        shifts={shifts}
                        employees={employees}
                    />
                ) : (
                    <BaseDayCalendar
                        date={selectedDate}
                        employees={employees}
                        shifts={shifts}
                        onRefresh={fetchData}
                    />
                )}
            </div>

            {/*<main className="heatmap-section">*/}
            {/*    <EventHeatmap*/}
            {/*        selectedDate={selectedDate}*/}
            {/*        activeCategories={activeCategories}*/}
            {/*        activeLocations={activeLocations}*/}
            {/*    />*/}
            {/*</main>*/}

        </div>
    );
};

export default EventShiftOverview;