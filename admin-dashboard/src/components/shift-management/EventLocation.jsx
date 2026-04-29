import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import api from '../../api/axiosConfig';
import './EventLocation.css';

const toDate = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDateKey = (value) => {
  if (!value) {
    return null;
  }

  // If timestamp has timezone info, convert to local calendar day.
  // If no timezone info is provided, keep the raw YYYY-MM-DD part unchanged.
  const asString = String(value);
  const hasTimeZone = /[zZ]$|[+-]\d{2}:\d{2}$/.test(asString);
  if (hasTimeZone) {
    const parsedWithZone = toDate(asString);
    return parsedWithZone ? format(parsedWithZone, 'yyyy-MM-dd') : null;
  }

  const isoMatch = asString.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) {
    return isoMatch[1];
  }

  const parsed = toDate(value);
  return parsed ? format(parsed, 'yyyy-MM-dd') : null;
};

const toTimeRange = (startValue, endValue) => {
  const start = toDate(startValue);
  const end = toDate(endValue);

  if (!start || !end) {
    return 'Tid ikke angivet';
  }

  return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
};

const toAssociationId = (eventItem, booking) => {
  const value =
    booking?.associationId ??
    booking?.AssociationId ??
    booking?.association_id ??
    eventItem?.associationId ??
    eventItem?.AssociationId ??
    eventItem?.association_id;

  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
};

const normalizeEventBookings = (events, selectedDate) => {
  const rows = [];

  (events || []).forEach((eventItem) => {
    const eventId = eventItem.id ?? eventItem.Id;
    const eventName = eventItem.name ?? eventItem.Name ?? 'Ukendt event';
    const category = String(eventItem.category ?? eventItem.Category ?? 'ANDET');
    const description = eventItem.description ?? eventItem.Description ?? '';
    const locations =
      eventItem.locations ?? eventItem.Locations ?? eventItem.eventLocations ?? eventItem.EventLocations ?? [];

    if (!Array.isArray(locations) || locations.length === 0) {
      return;
    }

    locations.forEach((booking, index) => {
      const locationId = Number(booking.locationId ?? booking.LocationId);
      const startTime = booking.startTime ?? booking.StartTime ?? eventItem.startTime ?? eventItem.StartTime;
      const endTime = booking.endTime ?? booking.EndTime ?? eventItem.endTime ?? eventItem.EndTime;
      const dateKey =
        toDateKey(startTime) ||
        toDateKey(booking.date ?? booking.Date) ||
        toDateKey(eventItem.date ?? eventItem.Date) ||
        toDateKey(eventItem.startTime ?? eventItem.StartTime);

      if (!locationId || dateKey !== selectedDate) {
        return;
      }

      rows.push({
        id: `${eventId || 'event'}-${locationId}-${index}`,
        eventId,
        name: eventName,
        category,
        description,
        locationId,
        startTime,
        endTime,
        associationId: toAssociationId(eventItem, booking),
      });
    });
  });

  return rows;
};

const EventLocation = ({ selectedDate }) => {
  const ASSOCIATION_FILTER_ALL = 'all';
  const ASSOCIATION_FILTER_EXCLUDE = 'exclude-associations';

  const [events, setEvents] = useState([]);
  const [locations, setLocations] = useState([]);
  const [expandedIds, setExpandedIds] = useState([]);
  const [associationFilter, setAssociationFilter] = useState(ASSOCIATION_FILTER_ALL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [eventsResponse, locationsResponse] = await Promise.all([
          api.get('/events'),
          api.get('/locations'),
        ]);

        setEvents(Array.isArray(eventsResponse.data) ? eventsResponse.data : []);
        setLocations(Array.isArray(locationsResponse.data) ? locationsResponse.data : []);
        setError('');
      } catch (err) {
        console.error('Fejl ved hentning af events/lokationer:', err?.response?.data || err?.message || err);
        setError('Kunne ikke hente events og lokationer.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    console.debug('[EventLocation] selectedDate:', selectedDate);
    console.debug(
      '[EventLocation] event date sample:',
      (events || []).slice(0, 5).map((eventItem) => ({
        id: eventItem?.id ?? eventItem?.Id,
        date: eventItem?.date ?? eventItem?.Date,
        startTime: eventItem?.startTime ?? eventItem?.StartTime,
        locationDate: eventItem?.locations?.[0]?.date ?? eventItem?.Locations?.[0]?.Date,
        locationStartTime: eventItem?.locations?.[0]?.startTime ?? eventItem?.Locations?.[0]?.StartTime,
      }))
    );
  }, [events, selectedDate]);

  const locationMap = useMemo(() => {
    const map = {};
    locations.forEach((location) => {
      const id = Number(location.id ?? location.Id);
      if (!id) {
        return;
      }

      map[id] = location.name ?? location.Name ?? `Lokation ${id}`;
    });

    return map;
  }, [locations]);

  const groupedByLocation = useMemo(() => {
    const bookings = normalizeEventBookings(events, selectedDate);
    const grouped = {};

    bookings
      .filter((booking) => {
        if (associationFilter !== ASSOCIATION_FILTER_EXCLUDE) {
          return true;
        }

        return !booking.associationId;
      })
      .forEach((booking) => {
      if (!grouped[booking.locationId]) {
        grouped[booking.locationId] = {
          locationId: booking.locationId,
          locationName: locationMap[booking.locationId] || `Lokation ${booking.locationId}`,
          events: [],
        };
      }

      grouped[booking.locationId].events.push(booking);
      });

    return Object.values(grouped)
      .sort((a, b) => a.locationName.localeCompare(b.locationName, 'da'))
      .map((group) => ({
        ...group,
        events: [...group.events].sort((a, b) => {
          const aTime = toDate(a.startTime)?.getTime() || 0;
          const bTime = toDate(b.startTime)?.getTime() || 0;
          return aTime - bTime;
        }),
      }));
  }, [events, locationMap, selectedDate, associationFilter, ASSOCIATION_FILTER_EXCLUDE]);

  const toggleExpanded = (eventRowId) => {
    setExpandedIds((prev) =>
      prev.includes(eventRowId)
        ? prev.filter((id) => id !== eventRowId)
        : [...prev, eventRowId]
    );
  };

  if (loading) {
    return <section className="event-location-card">Henter events...</section>;
  }

  if (error) {
    return <section className="event-location-card event-location-error">{error}</section>;
  }

  return (
    <section className="event-location-card" aria-label="Events per lokation">
      <div className="event-location-header">
        <h2>Hvad sker der per lokation</h2>
        <div className="event-location-header-actions">
          <label htmlFor="association-filter" className="event-location-filter-label">
            Forenings-events
          </label>
          <select
            id="association-filter"
            className="event-location-filter-select"
            value={associationFilter}
            onChange={(event) => setAssociationFilter(event.target.value)}
          >
            <option value={ASSOCIATION_FILTER_ALL}>Vis alle</option>
            <option value={ASSOCIATION_FILTER_EXCLUDE}>Skjul forenings-events</option>
          </select>
          <span>{groupedByLocation.length} lokationer</span>
        </div>
      </div>

      {groupedByLocation.length === 0 ? (
        <div className="event-location-empty">
          <h3>Ingen events</h3>
          <p>Ingen aktiviteter fundet pa den valgte dag.</p>
        </div>
      ) : (
        <div className="event-location-groups">
          {groupedByLocation.map((group) => (
            <article key={group.locationId} className="event-location-group">
              <div className="event-location-group-head">
                <h3>{group.locationName}</h3>
              </div>

              <ul className="event-location-events">
                {group.events.map((eventItem) => {
                  const expanded = expandedIds.includes(eventItem.id);

                  return (
                    <li key={eventItem.id} className="event-location-event-item">
                      <button
                        type="button"
                        className="event-location-event-btn"
                        onClick={() => toggleExpanded(eventItem.id)}
                        aria-expanded={expanded}
                      >
                        <div className="event-location-event-line">
                          <strong>{eventItem.name}</strong>
                          <span className="event-location-separator">|</span>
                          <span>{toTimeRange(eventItem.startTime, eventItem.endTime)}</span>
                          {eventItem.associationId ? (
                            <>
                              <span className="event-location-separator">|</span>
                              <span className="event-location-association-pill">Forening</span>
                            </>
                          ) : null}
                        </div>
                        <span className="event-location-expand-label">{expanded ? 'Skjul' : 'Vis'}</span>
                      </button>

                      {expanded && (
                        <div className="event-location-expanded">
                          <p>
                            <strong>Kategori:</strong> {eventItem.category}
                          </p>
                          <p>
                            <strong>Beskrivelse:</strong>{' '}
                            {eventItem.description ? eventItem.description : 'Ingen beskrivelse'}
                          </p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default EventLocation;
