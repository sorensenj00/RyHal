import React, { useState } from 'react';
import EventHeatmap from '../../components/heatmap/EventHeatmap';
import { locations } from '../../data/DummyData';

import { format, addDays, subDays } from 'date-fns';
import { da } from 'date-fns/locale';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilter,
  faCalendarAlt,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';

import './EventOverview.css';

const CATEGORIES = ['SPORT', 'MEETING', 'MAINTENANCE', 'OTHER'];

const EventOverview = () => {
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 3, 15));

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

  return (
    <div className="event-overview-page">

      {/* HEADER */}
      <header className="overview-header">
        <div className="header-title-section">
          <h1>Event Heatmap</h1>
          <p>Administrer bookinger og lokationer</p>
        </div>

        <div className="header-controls">
          <div className="date-navigation">

            {/* ⬅️ dag tilbage */}
            <button
              onClick={() => setSelectedDate(prev => subDays(prev, 1))}
              className="nav-btn"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>

            {/* 📅 date picker */}
            <div className="date-display">
              <FontAwesomeIcon icon={faCalendarAlt} className="cal-icon" />

              <input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="date-input"
              />
            </div>

            {/* ➡️ dag frem */}
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
      <div className="filter-section card">
        <div className="filter-group">
          <label>
            <FontAwesomeIcon icon={faFilter} /> Kategorier:
          </label>

          <div className="filter-chips">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`filter-chip cat-${cat.toLowerCase()} ${
                  activeCategories.includes(cat) ? 'active' : ''
                }`}
                onClick={() => toggleCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Lokationer:</label>

          <div className="filter-chips">
            {locations.map(loc => (
              <button
                key={loc.id}
                className={`filter-chip loc-chip ${
                  activeLocations.includes(loc.id) ? 'active' : ''
                }`}
                onClick={() => toggleLocation(loc.id)}
              >
                {loc.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* HEATMAP */}
      <main className="heatmap-section">
        <EventHeatmap
          selectedDate={selectedDate}
          activeCategories={activeCategories}
          activeLocations={activeLocations}
        />
      </main>

    </div>
  );
};

export default EventOverview;