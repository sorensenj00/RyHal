import React, { useState, useRef, useEffect } from 'react';
import { format, parseISO, differenceInMinutes, startOfDay, addMinutes, isSameDay } from 'date-fns';
import { locations, eventLocations as initialEvents } from '../../data/DummyData';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol, faUsers, faTools, faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import EventModal from './EventModal'; // Importér den nye modal
import './EventHeatmap.css';

const START_HOUR = 0;
const END_HOUR = 23;
const HOUR_WIDTH = 120;

const EventHeatmap = ({ selectedDate, activeCategories = [], activeLocations = [] }) => {
  const [allEvents, setAllEvents] = useState(initialEvents);
  const [resizingEvent, setResizingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null); // Til Modal CRUD
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 6 * HOUR_WIDTH;
    }
  }, []);

  // CRUD Funktioner
  const handleUpdateEvent = (updatedEvent) => {
    setAllEvents(prev => prev.map(evt => evt.id === updatedEvent.id ? updatedEvent : evt));
    setSelectedEvent(null);
  };

  const handleDeleteEvent = (id) => {
    if (window.confirm("Er du sikker på, at du vil slette dette event?")) {
      setAllEvents(prev => prev.filter(evt => evt.id !== id));
      setSelectedEvent(null);
    }
  };

  const dailyEvents = allEvents.filter(event =>
    isSameDay(parseISO(event.startTime), selectedDate) &&
    activeCategories.includes(event.category) &&
    activeLocations.includes(event.locationId)
  );

  const visibleLocations = locations.filter(loc => activeLocations.includes(loc.id));
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  // --- RESIZE LOGIK ---
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!resizingEvent) return;
      const deltaX = e.clientX - resizingEvent.initialX;
      const deltaMinutes = Math.round((deltaX / HOUR_WIDTH) * 60 / 15) * 15;

      setAllEvents(prev => prev.map(evt => {
        if (evt.id === resizingEvent.id) {
          let newStart = resizingEvent.initialStartTime;
          let newEnd = resizingEvent.initialEndTime;

          if (resizingEvent.side === 'left') {
            newStart = addMinutes(resizingEvent.initialStartTime, deltaMinutes);
            if (newStart >= newEnd) newStart = addMinutes(newEnd, -15);
          } else {
            newEnd = addMinutes(resizingEvent.initialEndTime, deltaMinutes);
            if (newEnd <= newStart) newEnd = addMinutes(newStart, 15);
          }
          return { ...evt, startTime: newStart.toISOString(), endTime: newEnd.toISOString() };
        }
        return evt;
      }));
    };
    const handleMouseUp = () => setResizingEvent(null);
    if (resizingEvent) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingEvent]);

  const handleResizeStart = (e, event, side) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingEvent({
      id: event.id, side, initialX: e.clientX,
      initialStartTime: parseISO(event.startTime),
      initialEndTime: parseISO(event.endTime)
    });
  };

  const getEventStyle = (startTime, endTime) => {
    const start = parseISO(startTime);
    const dayBegin = startOfDay(start);
    const minutesFromStart = differenceInMinutes(start, dayBegin);
    const durationMinutes = differenceInMinutes(parseISO(endTime), start);

    return {
      left: `${(minutesFromStart / 60) * HOUR_WIDTH}px`,
      width: `${(durationMinutes / 60) * HOUR_WIDTH}px`
    };
  };

  const onDragStart = (e, eventId) => {
    if (resizingEvent) return;
    const rect = e.target.getBoundingClientRect();
    e.dataTransfer.setData("eventId", eventId);
    e.dataTransfer.setData("offsetX", e.clientX - rect.left);
  };

  const onDrop = (e, locationId) => {
    e.preventDefault();
    const eventId = parseInt(e.dataTransfer.getData("eventId"));
    const offsetX = parseFloat(e.dataTransfer.getData("offsetX"));
    const contentArea = e.currentTarget.querySelector('.row-content-area');
    const rect = contentArea.getBoundingClientRect();
    const dropX = e.clientX - rect.left - offsetX;
    let minutesFromStart = Math.max(0, Math.round((dropX / HOUR_WIDTH) * 60 / 15) * 15);

    setAllEvents(prev => prev.map(evt => {
      if (evt.id === eventId) {
        const duration = differenceInMinutes(parseISO(evt.endTime), parseISO(evt.startTime));
        let newStart = addMinutes(startOfDay(selectedDate), minutesFromStart);
        return { ...evt, locationId, startTime: newStart.toISOString(), endTime: addMinutes(newStart, duration).toISOString() };
      }
      return evt;
    }));
  };

  return (
    <div className="heatmap-outer-wrapper">
      <div className="heatmap-scroll-container" ref={scrollContainerRef}>
        <div className="heatmap-grid-inner" style={{ width: (hours.length * HOUR_WIDTH) + 200 }}>

          <div className="heatmap-timeline">
            <div className="location-corner">Lokationer</div>
            <div className="time-labels-wrapper">
              {hours.map(hour => (
                <div key={hour} className="time-label">
                  {hour.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>
          </div>

          <div className="heatmap-rows-container">
            {visibleLocations.map(loc => (
              <div key={loc.id} className="location-row" onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, loc.id)}>
                <div className="location-name-cell">{loc.name}</div>
                <div className="row-content-area">
                  {dailyEvents.filter(e => e.locationId === loc.id).map(evt => (
                    <div
                      key={evt.id}
                      draggable={!resizingEvent}
                      onDragStart={(e) => onDragStart(e, evt.id)}
                      onClick={() => setSelectedEvent(evt)} // Åben modal ved klik
                      className={`event-item cat-${evt.category.toLowerCase()} ${resizingEvent?.id === evt.id ? 'resizing' : ''}`}
                      style={getEventStyle(evt.startTime, evt.endTime)}
                    >
                      <div className="resize-handle left" onMouseDown={(e) => handleResizeStart(e, evt, 'left')}></div>
                      <div className="event-content">
                        <div className="event-main-info">
                          <FontAwesomeIcon icon={evt.category === 'SPORT' ? faFutbol : faUsers} className="event-icon" />
                          <span className="event-name">{evt.name}</span>
                        </div>

                        {/* VIS PREVIEW AF KOMMENTAR */}
                        {evt.comment && (
                          <div className="event-comment-preview">
                            {evt.comment}
                          </div>
                        )}

                        <span className="event-time">
                          {format(parseISO(evt.startTime), 'HH:mm')} - {format(parseISO(evt.endTime), 'HH:mm')}
                        </span>
                      </div>

                      <div className="resize-handle right" onMouseDown={(e) => handleResizeStart(e, evt, 'right')}></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Render */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onSave={handleUpdateEvent}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  );
};

export default EventHeatmap;
