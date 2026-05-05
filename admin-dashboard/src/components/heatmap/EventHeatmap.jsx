import React, { useState, useRef, useEffect } from 'react';
import { format, parseISO, differenceInMinutes, startOfDay, addMinutes, isSameDay } from 'date-fns';
import api from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol, faUsers } from '@fortawesome/free-solid-svg-icons';
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
  // value is a Date object — format in local time (ingen new Date() på strings for at undgå UTC-shift)
  return format(value, "yyyy-MM-dd'T'HH:mm:ss");
};

const toLocalDateTimeString = (value) => {
  if (!value) return null;
  // Hvis string: parseISO bevarer lokal tid korrekt (new Date() ville tolke Z/offset forkert)
  const dateObj = typeof value === 'string' ? parseISO(value) : value;
  return format(dateObj, "yyyy-MM-dd'T'HH:mm:ss");
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
    const eventDate = rawEvent.date ?? rawEvent.Date ?? (eventStart ? String(eventStart).slice(0, 10) : null);
    const isRecurring = Boolean(rawEvent.isRecurring ?? rawEvent.IsRecurring);
    const recurrenceFrequency = rawEvent.recurrenceFrequency ?? rawEvent.RecurrenceFrequency ?? null;
    const recurrenceEndDate = toApiDateTimeString(rawEvent.recurrenceEndDate ?? rawEvent.RecurrenceEndDate);
    const isDraft = Boolean(rawEvent.isDraft ?? rawEvent.IsDraft);
    const templateId = rawEvent.templateId ?? rawEvent.TemplateId ?? null;
    const createdBy = rawEvent.createdBy ?? rawEvent.CreatedBy ?? 'system';

    const locationBookings =
      rawEvent.eventLocations ?? rawEvent.EventLocations ?? rawEvent.locations ?? rawEvent.Locations ?? [];

    const normalizedLocations = (Array.isArray(locationBookings) ? locationBookings : []).map((booking, index) => ({
      bookingId: booking.id ?? booking.Id ?? null,
      bookingIndex: index,
      locationId: booking.locationId ?? booking.LocationId ?? rawEvent.locationId ?? rawEvent.LocationId,
      startTime: toApiDateTimeString(booking.startTime ?? booking.StartTime ?? eventStart),
      endTime: toApiDateTimeString(booking.endTime ?? booking.EndTime ?? eventEnd),
      date: booking.date ?? booking.Date ?? eventDate
    })).filter((booking) => booking.startTime && booking.endTime && booking.locationId);

    if (!normalizedLocations.length && eventStart && eventEnd && (rawEvent.locationId ?? rawEvent.LocationId)) {
      normalizedLocations.push({
        bookingId: null,
        bookingIndex: 0,
        locationId: rawEvent.locationId ?? rawEvent.LocationId,
        startTime: eventStart,
        endTime: eventEnd,
        date: eventDate
      });
    }

    if (!normalizedLocations.length) {
      return;
    }

    normalizedLocations.forEach((booking) => {
      flattened.push({
        id: `${eventId}-${booking.bookingId ?? booking.bookingIndex}`,
        eventId,
        bookingId: booking.bookingId,
        bookingIndex: booking.bookingIndex,
        locationId: Number(booking.locationId),
        name,
        category,
        startTime: booking.startTime,
        endTime: booking.endTime,
        date: booking.date,
        comment: description,
        description,
        allLocations: normalizedLocations,
        isRecurring,
        recurrenceFrequency,
        recurrenceEndDate,
        isDraft,
        templateId,
        createdBy,
        sourceEvent: {
          id: eventId,
          eventId,
          name,
          description,
          category,
          startTime: eventStart,
          endTime: eventEnd,
          date: eventDate,
          locations: normalizedLocations,
          isRecurring,
          recurrenceFrequency,
          recurrenceEndDate,
          isDraft,
          templateId,
          createdBy
        }
      });
    });
  });

  return flattened;
};

const buildUpdatePayload = (event) => {
  const eventDate = (event.startTime || '').slice(0, 10) || event.date || null;
  const preservedLocations = Array.isArray(event.allLocations) && event.allLocations.length
    ? event.allLocations
    : [{
      bookingId: event.bookingId ?? null,
      locationId: Number(event.locationId) || 0,
      startTime: event.startTime || null,
      endTime: event.endTime || null,
      date: eventDate
    }];

  const updatedLocations = preservedLocations.map((loc, index) => {
    const isActiveBooking = event.bookingId != null
      ? String(loc.bookingId) === String(event.bookingId)
      : index === (event.bookingIndex || 0);

    if (!isActiveBooking) {
      return {
        LocationId: Number(loc.locationId) || 0,
        StartTime: loc.startTime || null,
        EndTime: loc.endTime || null,
        Date: (loc.startTime || '').slice(0, 10) || loc.date || eventDate
      };
    }

    return {
      LocationId: Number(event.locationId) || 0,
      StartTime: event.startTime || null,
      EndTime: event.endTime || null,
      Date: eventDate
    };
  });

  return {
  Name: event.name,
  Description: event.description || event.comment || '',
  StartTime: event.startTime,
  EndTime: event.endTime,
  Date: eventDate,
  Category: CATEGORY_TO_ENUM[event.category] ?? CATEGORY_TO_ENUM.ANDET,
  Locations: updatedLocations,
  TemplateId: event.templateId ?? null,
  CreatedBy: event.createdBy || 'system',
  IsRecurring: Boolean(event.isRecurring),
  RecurrenceFrequency: event.isRecurring ? (event.recurrenceFrequency || 'WEEKLY') : null,
  RecurrenceEndDate: event.isRecurring ? (event.recurrenceEndDate || null) : null,
  IsDraft: Boolean(event.isDraft)
  };
};

const EventHeatmap = ({ selectedDate, activeCategories = [], activeLocations = [], locations = [], onOpenAdvancedEdit, refreshKey }) => {
  const navigate = useNavigate();
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

  const handleOpenAdvancedEdit = async (event) => {
    const eventId = Number(event?.eventId || event?.id);
    if (!eventId) {
      showFeedback('Kunne ikke åbne redigering, da event-id mangler.');
      return;
    }

    const fallbackEvent = event?.sourceEvent
      ? {
        ...event.sourceEvent,
        id: eventId
      }
      : { id: eventId };

    let eventForEdit = fallbackEvent;

    try {
      const response = await api.get(`/events/${eventId}`);
      if (response?.data) {
        eventForEdit = response.data;
      }
    } catch (error) {
      console.warn('Kunne ikke hente detaljeret event til avanceret redigering. Bruger cachet data.', error?.response?.data || error);
    }

    setSelectedEvent(null);

    if (onOpenAdvancedEdit) {
      onOpenAdvancedEdit(eventForEdit);
    } else {
      navigate('/edit-activity', {
        state: {
          draftEvent: eventForEdit,
          returnTo: '/event-overview'
        }
      });
    }
  };

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
  }, [locations, refreshKey]);

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
      endTime: toLocalDateTimeString(addMinutes(newStart, duration)),
      allLocations: (Array.isArray(originalEvent.allLocations) ? originalEvent.allLocations : []).map((loc, index) => {
        const isActiveBooking = originalEvent.bookingId != null
          ? String(loc.bookingId) === String(originalEvent.bookingId)
          : index === (originalEvent.bookingIndex || 0);

        if (!isActiveBooking) {
          return loc;
        }

        return {
          ...loc,
          locationId,
          startTime: toLocalDateTimeString(newStart),
          endTime: toLocalDateTimeString(addMinutes(newStart, duration)),
          date: format(newStart, 'yyyy-MM-dd')
        };
      })
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
                      onClick={() => handleOpenAdvancedEdit(evt)}
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
          onOpenAdvancedEdit={handleOpenAdvancedEdit}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  );
};

export default EventHeatmap;
