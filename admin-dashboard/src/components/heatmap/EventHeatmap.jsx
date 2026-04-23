import React, { useState, useRef, useEffect } from 'react';
import { format, parseISO, differenceInMinutes, startOfDay, addMinutes, isSameDay } from 'date-fns';
import api from '../../api/axiosConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol, faUsers, faTools, faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import EventModal from './EventModal'; // Importér den nye modal
import './EventHeatmap.css';

const START_HOUR = 5;
const TOTAL_HOURS = 24;
const HOUR_WIDTH = 120;
const CATEGORY_BY_INDEX = ['SPORT', 'MØDE', 'VEDLIGEHOLDELSE', 'ANDET'];
const CATEGORY_CLASSNAME = {
  SPORT: 'sport',
  MØDE: 'mode',
  VEDLIGEHOLDELSE: 'vedligeholdelse',
  ANDET: 'andet'
};
const CATEGORY_TO_ENUM = {
  SPORT: 0,
  MØDE: 1,
  VEDLIGEHOLDELSE: 2,
  ANDET: 3
};

const toApiDateTimeString = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return format(new Date(value), "yyyy-MM-dd'T'HH:mm:ss");
};

const toLocalDateTimeString = (value) => {
  if (!value) return null;
  return format(new Date(value), "yyyy-MM-dd'T'HH:mm:ss");
};

const normalizeEventsForHeatmap = (apiEvents) => {
  const flattened = [];

  (apiEvents || []).forEach((rawEvent) => {
    const eventId = rawEvent.id ?? rawEvent.eventId ?? rawEvent.Id;
    const name = rawEvent.name ?? rawEvent.Name ?? 'Ukendt event';
    const rawCategory = rawEvent.category ?? rawEvent.Category ?? 'ANDET';
    const category = typeof rawCategory === 'number'
      ? (CATEGORY_BY_INDEX[rawCategory] || 'ANDET')
      : String(rawCategory).toUpperCase();
    const description = rawEvent.description ?? rawEvent.Description ?? '';
    const eventStart = toApiDateTimeString(rawEvent.startTime ?? rawEvent.StartTime);
    const eventEnd = toApiDateTimeString(rawEvent.endTime ?? rawEvent.EndTime);

    const locationBookings =
      rawEvent.eventLocations ?? rawEvent.EventLocations ?? rawEvent.locations ?? rawEvent.Locations ?? [];

    if (!locationBookings.length) {
      if (eventStart && eventEnd) {
        flattened.push({
          id: String(eventId),
          eventId,
          locationId: rawEvent.locationId ?? rawEvent.LocationId,
          name,
          category,
          startTime: eventStart,
          endTime: eventEnd,
          comment: description,
          description
        });
      }
      return;
    }

    locationBookings.forEach((booking, index) => {
      const bookingStart = toApiDateTimeString(booking.startTime ?? booking.StartTime ?? eventStart);
      const bookingEnd = toApiDateTimeString(booking.endTime ?? booking.EndTime ?? eventEnd);

      if (!bookingStart || !bookingEnd) return;

      flattened.push({
        id: `${eventId}-${booking.id ?? booking.Id ?? index}`,
        eventId,
        locationId: booking.locationId ?? booking.LocationId,
        name,
        category,
        startTime: bookingStart,
        endTime: bookingEnd,
        comment: booking.comment ?? booking.Comment ?? description,
        description
      });
    });
  });

  return flattened;
};

const buildUpdatePayload = (event) => {
  const eventDate = (event.startTime || '').slice(0, 10) || event.date || null;

  return {
  Name: event.name,
  Description: event.description || event.comment || '',
  StartTime: event.startTime,
  EndTime: event.endTime,
  Date: eventDate,
  Category: CATEGORY_TO_ENUM[event.category] ?? CATEGORY_TO_ENUM.ANDET,
  Locations: [
    {
      LocationId: Number(event.locationId),
      StartTime: event.startTime,
      EndTime: event.endTime,
      Date: eventDate
    }
  ],
  TemplateId: null,
  CreatedBy: 'system',
  IsRecurring: false,
  RecurrenceFrequency: null,
  RecurrenceEndDate: null,
  IsDraft: false
  };
};

const EventHeatmap = ({ selectedDate, activeCategories = [], activeLocations = [], locations = [] }) => {
  const [allEvents, setAllEvents] = useState([]);
  const [allLocations, setAllLocations] = useState(Array.isArray(locations) ? locations : []);
  const [resizingEvent, setResizingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null); // Til Modal CRUD
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const scrollContainerRef = useRef(null);
  const hasAutoCenteredRef = useRef(false);

  const showFeedback = (message) => {
    setFeedbackMsg(message);
    setTimeout(() => setFeedbackMsg(''), 4500);
  };

  const hasOverlap = (startA, endA, startB, endB) => startA < endB && endA > startB;

  useEffect(() => {
    if (Array.isArray(locations) && locations.length > 0) {
      setAllLocations(locations);
    }
  }, [locations]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setLoadError('');

        const eventsRes = await api.get('/events');
        const resolvedLocations = Array.isArray(locations) ? locations : [];

        setAllEvents(normalizeEventsForHeatmap(eventsRes.data));
        setAllLocations(resolvedLocations);
      } catch (error) {
        console.error('Kunne ikke hente events fra API:', error);
        setAllEvents([]);
        setLoadError('Kunne ikke hente events fra serveren.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [locations]);

  useEffect(() => {
    if (isLoading || loadError || hasAutoCenteredRef.current) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const now = new Date();
    const nowDecimal = now.getHours() + now.getMinutes() / 60;
    let offsetHours = nowDecimal - START_HOUR;
    if (offsetHours < 0) offsetHours += 24;

    const targetX = offsetHours * HOUR_WIDTH;
    const centeredX = targetX - container.clientWidth / 2;
    const maxScrollLeft = Math.max(container.scrollWidth - container.clientWidth, 0);
    const nextScrollLeft = Math.max(0, Math.min(centeredX, maxScrollLeft));

    container.scrollLeft = nextScrollLeft;
    hasAutoCenteredRef.current = true;
  }, [isLoading, loadError]);

  // CRUD Funktioner
  const handleUpdateEvent = async (updatedEvent) => {
    const originalEvent = allEvents.find((evt) => evt.id === updatedEvent.id);
    setAllEvents(prev => prev.map(evt => evt.id === updatedEvent.id ? updatedEvent : evt));

    try {
      await api.put(`/events/${updatedEvent.eventId || updatedEvent.id}`, buildUpdatePayload(updatedEvent));
      setSelectedEvent(null);
    } catch (error) {
      console.error('Kunne ikke opdatere event via API:', error?.response?.data || error);
      if (originalEvent) {
        setAllEvents(prev => prev.map(evt => evt.id === originalEvent.id ? originalEvent : evt));
      }
      alert('Kunne ikke gemme ændringer på serveren.');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm("Er du sikker på, at du vil slette dette event?")) {
      const backup = allEvents;
      setAllEvents(prev => prev.filter(evt => (evt.eventId || evt.id) !== id));

      try {
        await api.delete(`/events/${id}`);
        setSelectedEvent(null);
      } catch (error) {
        console.error('Kunne ikke slette event via API:', error);
        setAllEvents(backup);
        alert('Kunne ikke slette event på serveren.');
      }
    }
  };

  const dailyEvents = allEvents.filter(event => {
    if (!event?.startTime || !event?.endTime || !event?.locationId) return false;

    return isSameDay(parseISO(event.startTime), selectedDate) &&
    activeCategories.includes(event.category) &&
    activeLocations.includes(event.locationId);
  });

  const visibleLocations = allLocations.filter(loc => activeLocations.includes(loc.id));
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => (i + START_HOUR) % 24);

  // --- RESIZE LOGIK ---
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!resizingEvent) return;
      const deltaX = e.clientX - resizingEvent.initialX;
      const pixelsPerHour = resizingEvent.pixelsPerHour || 1;
      const deltaMinutes = Math.round((deltaX / pixelsPerHour) * 60 / 15) * 15;

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
          return {
            ...evt,
            startTime: toLocalDateTimeString(newStart),
            endTime: toLocalDateTimeString(newEnd)
          };
        }
        return evt;
      }));
    };
    const handleMouseUp = async () => {
      const changedEvent = allEvents.find((evt) => evt.id === resizingEvent?.id);
      if (changedEvent) {
        try {
          await api.put(`/events/${changedEvent.eventId || changedEvent.id}`, buildUpdatePayload(changedEvent));
        } catch (error) {
          console.error('Kunne ikke gemme resize til server:', error?.response?.data || error);
          setAllEvents(prev => prev.map(evt => {
            if (evt.id !== resizingEvent.id) return evt;
            return {
              ...evt,
              startTime: resizingEvent.originalStartTime,
              endTime: resizingEvent.originalEndTime
            };
          }));
          alert('Kunne ikke gemme ændring af tid på serveren. Ændringen er rullet tilbage.');
        }
      }
      setResizingEvent(null);
    };
    if (resizingEvent) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingEvent, allEvents]);

  const handleResizeStart = (e, event, side) => {
    e.preventDefault();
    e.stopPropagation();
    const rowContentArea = e.currentTarget.closest('.row-content-area');
    const rowWidth = rowContentArea?.getBoundingClientRect().width || 1;
    setResizingEvent({
      id: event.id, side, initialX: e.clientX,
      initialStartTime: parseISO(event.startTime),
      initialEndTime: parseISO(event.endTime),
      originalStartTime: event.startTime,
      originalEndTime: event.endTime,
      pixelsPerHour: rowWidth / TOTAL_HOURS
    });
  };

  const getEventStyle = (startTime, endTime) => {
    const start = parseISO(startTime);
    const startDecimal = start.getHours() + start.getMinutes() / 60;
    let gridStartOffset = startDecimal - START_HOUR;
    if (gridStartOffset < 0) gridStartOffset += 24;

    const minutesFromStart = gridStartOffset * 60;
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

  const onDrop = async (e, locationId) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData("eventId");
    const offsetX = parseFloat(e.dataTransfer.getData("offsetX"));
    const contentArea = e.currentTarget.querySelector('.row-content-area');
    const rect = contentArea.getBoundingClientRect();
    const dropX = e.clientX - rect.left - offsetX;
    const pixelsPerHour = HOUR_WIDTH;
    let minutesFromStart = Math.max(0, Math.round((dropX / pixelsPerHour) * 60 / 15) * 15);

    const originalEvent = allEvents.find((evt) => String(evt.id) === String(eventId));
    if (!originalEvent) return;

    const duration = differenceInMinutes(parseISO(originalEvent.endTime), parseISO(originalEvent.startTime));
    let newStart = addMinutes(startOfDay(selectedDate), START_HOUR * 60 + minutesFromStart);
    while (newStart.getHours() < START_HOUR) {
      newStart = addMinutes(newStart, 24 * 60);
    }

    const updatedEvent = {
      ...originalEvent,
      locationId,
      startTime: toLocalDateTimeString(newStart),
      endTime: toLocalDateTimeString(addMinutes(newStart, duration))
    };

    const updatedStart = parseISO(updatedEvent.startTime);
    const updatedEnd = parseISO(updatedEvent.endTime);

    const conflictEvent = allEvents.find((evt) => {
      if (String(evt.id) === String(updatedEvent.id)) return false;
      if (Number(evt.locationId) !== Number(updatedEvent.locationId)) return false;
      if (!evt.startTime || !evt.endTime) return false;

      return hasOverlap(
        updatedStart,
        updatedEnd,
        parseISO(evt.startTime),
        parseISO(evt.endTime)
      );
    });

    if (conflictEvent) {
      showFeedback(
        `Lokationen er optaget af "${conflictEvent.name}" (${format(parseISO(conflictEvent.startTime), 'HH:mm')} - ${format(parseISO(conflictEvent.endTime), 'HH:mm')}).`
      );
      return;
    }

    setAllEvents(prev => prev.map(evt => String(evt.id) === String(eventId) ? updatedEvent : evt));

    try {
      await api.put(`/events/${updatedEvent.eventId || updatedEvent.id}`, buildUpdatePayload(updatedEvent));
    } catch (error) {
      console.error('Kunne ikke gemme drag/drop til server:', error?.response?.data || error);
      setAllEvents(prev => prev.map(evt => String(evt.id) === String(eventId) ? originalEvent : evt));

      const apiError = error?.response?.data;
      const rawMessage = typeof apiError === 'string'
        ? apiError
        : apiError?.title || apiError?.message || 'Kunne ikke gemme flytningen på serveren. Ændringen er rullet tilbage.';

      if (/allerede booket/i.test(rawMessage)) {
        showFeedback('Lokationen er optaget i det valgte tidsrum. Flyt eventet til et andet tidsrum eller en anden lokation.');
      } else {
        showFeedback(rawMessage);
      }
    }
  };

  if (isLoading) {
    return <div className="p-3">Henter events...</div>;
  }

  if (loadError) {
    return <div className="p-3 text-danger">{loadError}</div>;
  }

  if (!allLocations.length) {
    return <div className="p-3 text-muted">Ingen lokationer fundet.</div>;
  }

  return (
    <div className="heatmap-outer-wrapper">
      {feedbackMsg && <div className="heatmap-feedback-msg">{feedbackMsg}</div>}

      <div className="heatmap-scroll-container" ref={scrollContainerRef}>
        <div className="heatmap-grid-inner" style={{ width: (TOTAL_HOURS * HOUR_WIDTH) + 200 }}>

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
              <div key={loc.id} className="heatmap-location-row" onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, loc.id)}>
                <div className="heatmap-location-name-cell">{loc.name}</div>
                <div className="row-content-area">
                  {dailyEvents.filter(e => e.locationId === loc.id).map(evt => (
                    <div
                      key={evt.id}
                      draggable={!resizingEvent}
                      onDragStart={(e) => onDragStart(e, evt.id)}
                      onClick={() => setSelectedEvent(evt)} // Åben modal ved klik
                      className={`event-item cat-${CATEGORY_CLASSNAME[evt.category] || 'andet'} ${resizingEvent?.id === evt.id ? 'resizing' : ''}`}
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
          locations={allLocations}
          onClose={() => setSelectedEvent(null)}
          onSave={handleUpdateEvent}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  );
};

export default EventHeatmap;
