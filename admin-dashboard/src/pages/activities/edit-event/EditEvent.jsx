import React, { useEffect, useState } from 'react';
import api from '../../../api/axiosConfig';
import { useLocation, useNavigate } from 'react-router-dom';
import ContactsSearchBar from '../../../components/search/ContactsSearchBar';
import '../create-new-event/CreateNewEvent.css';

const EVENT_CATEGORIES = ['SPORT', 'MØDE', 'VEDLIGEHOLDELSE', 'ANDET'];
const CATEGORY_TO_ENUM = {
  SPORT: 0,
  MØDE: 1,
  VEDLIGEHOLDELSE: 2,
  ANDET: 3
};
const ENUM_TO_CATEGORY = {
  0: 'SPORT',
  1: 'MØDE',
  2: 'VEDLIGEHOLDELSE',
  3: 'ANDET'
};

const pickValue = (obj, ...keys) => {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return null;
};

const toLocalDateInput = (dateTime) => {
  if (!dateTime) return '';

  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) {
    const str = String(dateTime);
    return str.includes('T') ? str.split('T')[0] : str;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toLocalTimeInput = (dateTime) => {
  if (!dateTime) return '';

  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) {
    const str = String(dateTime);
    if (str.includes('T')) return str.split('T')[1]?.slice(0, 5) || '';
    return str.slice(0, 5);
  }

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const toApiLocalDateTime = (datePart, timePart) => {
  if (!datePart || !timePart) return null;

  // Keep local wall-clock time to avoid timezone drift between frontend and backend.
  return `${datePart}T${timePart}:00`;
};

const getDefaultRecurrenceEndDate = (baseDate) => {
  let seed;

  if (baseDate) {
    const [year, month, day] = String(baseDate).split('-').map(Number);
    seed = new Date(year, (month || 1) - 1, day || 1);
  } else {
    seed = new Date();
  }

  seed.setDate(seed.getDate() + 30);
  const year = seed.getFullYear();
  const month = String(seed.getMonth() + 1).padStart(2, '0');
  const day = String(seed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toFriendlyApiMessage = (apiError, fallbackMessage) => {
  const validationErrors = apiError?.errors
    ? Object.values(apiError.errors).flat().join(' ')
    : '';

  const rawMessage = typeof apiError === 'string'
    ? apiError
    : validationErrors || apiError?.title || apiError?.message || fallbackMessage;

  if (/lokation\s+\d+\s+er allerede booket/i.test(rawMessage) || /allerede booket/i.test(rawMessage)) {
    return 'Lokationen er optaget i det valgte tidsrum. Vælg et andet tidspunkt eller en anden lokation.';
  }

  return rawMessage || fallbackMessage;
};

const normalizeIdList = (values) => [...new Set(
  (values || [])
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0)
)];

const EditEvent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const draftEvent = location.state?.draftEvent || null;
  const returnTo = location.state?.returnTo || '/event-overview';
  const isEditingDraft = Boolean(pickValue(draftEvent, 'isDraft', 'IsDraft'));

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('SPORT');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState('WEEKLY');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [isDraft, setIsDraft] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [availableLocations, setAvailableLocations] = useState([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isLoadingRelations, setIsLoadingRelations] = useState(true);
  const [availableAssociations, setAvailableAssociations] = useState([]);
  const [availableContacts, setAvailableContacts] = useState([]);
  const [selectedAssociationId, setSelectedAssociationId] = useState(0);
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [locations, setLocations] = useState([]);

  const selectedAssociation = availableAssociations.find(
    (association) => Number(pickValue(association, 'associationId', 'AssociationId')) === Number(selectedAssociationId)
  ) || null;

  const associationContacts = Array.isArray(selectedAssociation?.contacts)
    ? selectedAssociation.contacts
    : [];

  const associationContactIds = normalizeIdList(
    associationContacts.map((contact) => pickValue(contact, 'contactId', 'ContactId'))
  );

  const contactAssociationNamesById = availableAssociations.reduce((lookup, association) => {
    const associationName = pickValue(association, 'name', 'Name');
    const contacts = Array.isArray(association?.contacts) ? association.contacts : [];

    contacts.forEach((contact) => {
      const contactId = Number(pickValue(contact, 'contactId', 'ContactId')) || 0;
      if (!contactId || !associationName) {
        return;
      }

      if (!lookup[contactId]) {
        lookup[contactId] = [];
      }

      if (!lookup[contactId].includes(associationName)) {
        lookup[contactId].push(associationName);
      }
    });

    return lookup;
  }, {});

  const filteredContacts = availableContacts.filter((contact) => {
    const normalizedSearchTerm = contactSearchTerm.trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return true;
    }

    const haystack = [
      pickValue(contact, 'name', 'Name'),
      pickValue(contact, 'title', 'Title'),
      pickValue(contact, 'phone', 'Phone'),
      pickValue(contact, 'email', 'Email'),
      ...(contactAssociationNamesById[Number(pickValue(contact, 'contactId', 'ContactId')) || 0] || [])
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedSearchTerm);
  });

  const closeMessageModal = () => {
    setSuccessMsg('');
    setErrorMsg('');
  };

  const closeContactModal = () => {
    setIsContactModalOpen(false);
  };

  useEffect(() => {
    if (!draftEvent) return;

    const rawCategory = pickValue(draftEvent, 'category', 'Category');
    const mappedCategory = typeof rawCategory === 'number'
      ? (ENUM_TO_CATEGORY[rawCategory] || 'ANDET')
      : String(rawCategory || 'ANDET').toUpperCase();

    const rawLocations =
      pickValue(draftEvent, 'locations', 'Locations', 'eventLocations', 'EventLocations') || [];
    const sourceLocations = Array.isArray(rawLocations) ? rawLocations : [];
    const firstLocation = sourceLocations[0] || null;

    const rawDate =
      pickValue(draftEvent, 'date', 'Date') ||
      pickValue(firstLocation, 'date', 'Date');

    const rawStartTime =
      pickValue(draftEvent, 'startTime', 'StartTime') ||
      pickValue(firstLocation, 'startTime', 'StartTime');
    const rawEndTime =
      pickValue(draftEvent, 'endTime', 'EndTime') ||
      pickValue(firstLocation, 'endTime', 'EndTime');

    setTitle(pickValue(draftEvent, 'name', 'Name') || '');
    setDescription(pickValue(draftEvent, 'description', 'Description') || '');
    setCategory(mappedCategory);
    setStartDate(toLocalDateInput(rawStartTime || rawDate));
    setStartTime(toLocalTimeInput(rawStartTime));
    setEndTime(toLocalTimeInput(rawEndTime));
    setIsDraft(Boolean(pickValue(draftEvent, 'isDraft', 'IsDraft')));
    setIsRecurring(Boolean(pickValue(draftEvent, 'isRecurring', 'IsRecurring')));
    setRecurrenceFrequency(String(pickValue(draftEvent, 'recurrenceFrequency', 'RecurrenceFrequency') || 'WEEKLY'));
    setRecurrenceEndDate(toLocalDateInput(pickValue(draftEvent, 'recurrenceEndDate', 'RecurrenceEndDate')));
    setSelectedAssociationId(Number(pickValue(draftEvent, 'associationId', 'AssociationId')) || 0);

    const mappedLocations = sourceLocations.length
      ? sourceLocations.map((loc) => ({
        locationId: Number(pickValue(loc, 'locationId', 'LocationId')) || 0,
        startTime: toLocalTimeInput(pickValue(loc, 'startTime', 'StartTime')),
        endTime: toLocalTimeInput(pickValue(loc, 'endTime', 'EndTime'))
      }))
      : (() => {
        const topLocationId = Number(pickValue(draftEvent, 'locationId', 'LocationId')) || 0;
        if (!topLocationId) return [];

        return [{
          locationId: topLocationId,
          startTime: toLocalTimeInput(rawStartTime),
          endTime: toLocalTimeInput(rawEndTime)
        }];
      })();

    setLocations(mappedLocations);
  }, [draftEvent]);

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setIsLoadingLocations(true);
        setIsLoadingRelations(true);

        const [locationsResult, associationsResult, contactsResult] = await Promise.allSettled([
          api.get('/locations'),
          api.get('/associations'),
          api.get('/contacts')
        ]);

        if (locationsResult.status === 'fulfilled') {
          setAvailableLocations(Array.isArray(locationsResult.value.data) ? locationsResult.value.data : []);
        } else {
          console.error('Kunne ikke hente lokationer:', locationsResult.reason);
          setAvailableLocations([]);
        }

        if (associationsResult.status === 'fulfilled') {
          setAvailableAssociations(Array.isArray(associationsResult.value.data) ? associationsResult.value.data : []);
        } else {
          console.error('Kunne ikke hente foreninger:', associationsResult.reason);
          setAvailableAssociations([]);
        }

        if (contactsResult.status === 'fulfilled') {
          setAvailableContacts(Array.isArray(contactsResult.value.data) ? contactsResult.value.data : []);
        } else {
          console.error('Kunne ikke hente kontaktpersoner:', contactsResult.reason);
          setAvailableContacts([]);
        }
      } catch (error) {
        console.error('Kunne ikke hente formular-data:', error);
        setAvailableLocations([]);
        setAvailableAssociations([]);
        setAvailableContacts([]);
      } finally {
        setIsLoadingLocations(false);
        setIsLoadingRelations(false);
      }
    };

    fetchFormData();
  }, []);

  useEffect(() => {
    const fetchExistingEventContacts = async () => {
      if (!draftEvent?.id) {
        setSelectedContactIds([]);
        return;
      }

      try {
        const response = await api.get(`/contacts/events/${draftEvent.id}`);
        const contactIds = normalizeIdList(
          (Array.isArray(response.data) ? response.data : []).map((contact) => pickValue(contact, 'contactId', 'ContactId'))
        );
        setSelectedContactIds(contactIds);
      } catch (error) {
        console.error('Kunne ikke hente event-kontakter:', error);
        setSelectedContactIds([]);
      }
    };

    fetchExistingEventContacts();
  }, [draftEvent?.id]);

  useEffect(() => {
    if (isRecurring && !recurrenceEndDate) {
      setRecurrenceEndDate(getDefaultRecurrenceEndDate(startDate));
    }
  }, [isRecurring, startDate, recurrenceEndDate]);

  const handleLocationChange = (index, field, value) => {
    const updated = [...locations];
    updated[index][field] = value;
    setLocations(updated);
  };

  const addLocation = () => {
    setLocations((prev) => [...prev, { locationId: 0, startTime: '', endTime: '' }]);
  };

  const toggleContactSelection = (contactId) => {
    const numericId = Number(contactId);
    if (!numericId) return;

    setSelectedContactIds((prev) => (
      prev.includes(numericId)
        ? prev.filter((existingId) => existingId !== numericId)
        : [...prev, numericId]
    ));
  };

  const syncAssociationSelection = async ({ associationId, eventId, seriesId }) => {
    if (associationId) {
      if (seriesId) {
        await api.post(`/associations/${associationId}/series/${seriesId}`);
        return;
      }

      if (eventId) {
        await api.post(`/associations/${associationId}/events/${eventId}`);
      }

      return;
    }

    if (seriesId) {
      await api.delete(`/associations/series/${seriesId}`);
      return;
    }

    if (eventId) {
      await api.delete(`/associations/events/${eventId}`);
    }
  };

  const syncDirectContacts = async (eventId, contactIds) => {
    if (!eventId) {
      return;
    }

    const response = await api.get(`/contacts/events/${eventId}`);
    const existingIds = normalizeIdList(
      (Array.isArray(response.data) ? response.data : []).map((contact) => pickValue(contact, 'contactId', 'ContactId'))
    );
    const targetIds = normalizeIdList(contactIds);

    await Promise.all(existingIds
      .filter((contactId) => !targetIds.includes(contactId))
      .map((contactId) => api.delete(`/contacts/${contactId}/events/${eventId}`)));

    await Promise.all(targetIds
      .filter((contactId) => !existingIds.includes(contactId))
      .map((contactId) => api.post(`/contacts/${contactId}/events/${eventId}`)));
  };

  const removeLocation = (index) => {
    if (locations.length > 1) {
      setLocations((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('SPORT');
    setStartDate('');
    setStartTime('');
    setEndTime('');
    setIsRecurring(false);
    setRecurrenceFrequency('WEEKLY');
    setRecurrenceEndDate('');
    setIsDraft(false);
    setSelectedAssociationId(0);
    setSelectedContactIds([]);
    setLocations([]);
  };

  const toMinuteKey = (value) => {
    if (!value) return '';
    return String(value).replace('Z', '').slice(0, 16);
  };

  const resolveTargetIdsAfterSave = async ({
    savedEvent,
    fallbackEventId,
    fallbackSeriesId,
    payload,
    isEdit
  }) => {
    const responseEventId = Number(pickValue(savedEvent, 'id', 'Id', 'eventId', 'EventId')) || null;
    const responseSeriesId = Number(pickValue(savedEvent, 'seriesId', 'SeriesId')) || null;

    if (responseEventId || responseSeriesId) {
      return { eventId: responseEventId, seriesId: responseSeriesId };
    }

    if (fallbackEventId || fallbackSeriesId) {
      return { eventId: fallbackEventId, seriesId: fallbackSeriesId };
    }

    if (isEdit) {
      return { eventId: null, seriesId: null };
    }

    try {
      const listResponse = await api.get('/events');
      const events = Array.isArray(listResponse.data) ? listResponse.data : [];
      const expectedName = String(payload?.Name || '').trim().toLowerCase();
      const expectedCategory = ENUM_TO_CATEGORY[payload?.Category] || 'ANDET';
      const expectedStart = toMinuteKey(payload?.StartTime);
      const expectedEnd = toMinuteKey(payload?.EndTime);
      const expectedDate = String(payload?.Date || '').slice(0, 10);

      const candidates = events.filter((evt) => {
        const evtName = String(pickValue(evt, 'name', 'Name') || '').trim().toLowerCase();
        if (!evtName || evtName !== expectedName) {
          return false;
        }

        const rawCategory = pickValue(evt, 'category', 'Category');
        const evtCategory = typeof rawCategory === 'number'
          ? (ENUM_TO_CATEGORY[rawCategory] || 'ANDET')
          : String(rawCategory || 'ANDET').toUpperCase();

        if (evtCategory !== expectedCategory) {
          return false;
        }

        const evtStart = toMinuteKey(pickValue(evt, 'startTime', 'StartTime'));
        const evtEnd = toMinuteKey(pickValue(evt, 'endTime', 'EndTime'));
        const evtDate = String(pickValue(evt, 'date', 'Date') || '').slice(0, 10);

        if (expectedStart && evtStart !== expectedStart) {
          return false;
        }

        if (expectedEnd && evtEnd !== expectedEnd) {
          return false;
        }

        if (expectedDate && evtDate && evtDate !== expectedDate) {
          return false;
        }

        return true;
      });

      const bestMatch = [...candidates]
        .sort((a, b) => (Number(pickValue(b, 'id', 'Id', 'eventId', 'EventId')) || 0)
          - (Number(pickValue(a, 'id', 'Id', 'eventId', 'EventId')) || 0))[0] || null;

      return {
        eventId: Number(pickValue(bestMatch, 'id', 'Id', 'eventId', 'EventId')) || null,
        seriesId: Number(pickValue(bestMatch, 'seriesId', 'SeriesId')) || null
      };
    } catch (lookupError) {
      console.warn('Kunne ikke slå oprettet event op til relation-sync:', lookupError);
      return { eventId: null, seriesId: null };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const hasSelectedLocation = locations.some((loc) => loc.locationId);

    const autoDraft = !startDate || !startTime || !endTime || !hasSelectedLocation;
    const draftToSave = isDraft || autoDraft;

    if (isRecurring && !recurrenceEndDate) {
      setErrorMsg('Vælg en slutdato for serie ved gentagende aktivitet.');
      return;
    }

    if (isRecurring && startDate && recurrenceEndDate < startDate) {
      setErrorMsg('Slutdato for serie kan ikke være før startdato.');
      return;
    }

    try {
      const locationsPayload = locations
        .filter((loc) => startDate && loc.locationId)
        .map((loc) => ({
          LocationId: Number(loc.locationId),
          StartTime: toApiLocalDateTime(startDate, loc.startTime),
          EndTime: toApiLocalDateTime(startDate, loc.endTime),
          Date: startDate
        }));

      const payload = {
        Name: title,
        Description: description || '',
        StartTime: toApiLocalDateTime(startDate, startTime),
        EndTime: toApiLocalDateTime(startDate, endTime),
        Date: startDate,
        Category: CATEGORY_TO_ENUM[category],
        Locations: locationsPayload,
        TemplateId: null,
        CreatedBy: 'admin-dashboard',
        IsRecurring: isRecurring,
        RecurrenceFrequency: isRecurring ? recurrenceFrequency : null,
        RecurrenceEndDate: isRecurring && recurrenceEndDate ? toApiLocalDateTime(recurrenceEndDate, '23:59') : null,
        IsDraft: draftToSave
      };

      const eventIdForUpdate = Number(pickValue(draftEvent, 'id', 'Id', 'eventId', 'EventId')) || null;
      if (!eventIdForUpdate) {
        setErrorMsg('Der mangler et event-id. Åbn eventet igen fra oversigten og prøv igen.');
        return;
      }

      const response = await api.put(`/events/${eventIdForUpdate}`, payload);

      const savedEvent = response?.data || {};
      const fallbackEventId = Number(pickValue(draftEvent, 'id', 'Id', 'eventId', 'EventId')) || null;
      const fallbackSeriesId = Number(pickValue(draftEvent, 'seriesId', 'SeriesId')) || null;
      const resolvedIds = await resolveTargetIdsAfterSave({
        savedEvent,
        fallbackEventId: eventIdForUpdate || fallbackEventId,
        fallbackSeriesId,
        payload,
        isEdit: true
      });
      const targetEventId = resolvedIds.eventId;
      const targetSeriesId = resolvedIds.seriesId;

      try {
        if ((Number(selectedAssociationId) || 0) > 0 && !targetEventId && !targetSeriesId) {
          throw new Error('Kunne ikke finde event-id til at gemme foreningskoblingen. Prøv igen.');
        }

        await syncAssociationSelection({
          associationId: Number(selectedAssociationId) || 0,
          eventId: targetEventId,
          seriesId: targetSeriesId
        });

        await syncDirectContacts(targetEventId, selectedContactIds);
      } catch (relationError) {
        const relationApiError = relationError?.response?.data;
        const relationMessage = toFriendlyApiMessage(
          relationApiError,
          'Eventet blev gemt, men forening eller kontaktpersoner kunne ikke synkroniseres.'
        );

        setErrorMsg(relationMessage);
        setTimeout(() => setErrorMsg(''), 5000);
        return;
      }

      setSuccessMsg(
        draftToSave
          ? (isEditingDraft ? 'Kladde opdateret!' : 'Aktivitet opdateret som kladde!')
          : (isEditingDraft ? 'Kladde publiceret!' : 'Aktivitet opdateret!')
      );
      setTimeout(() => {
        setSuccessMsg('');
        navigate(returnTo);
      }, 1200);
    } catch (err) {
      const apiError = err?.response?.data;
      const message = toFriendlyApiMessage(apiError, err.message || 'Kunne ikke oprette aktivitet.');

      setErrorMsg(message);
      setTimeout(() => setErrorMsg(''), 5000);
    }
  };

  return (
    <div className="create-event-page">
      <header className="create-event-header">
        <h1>
          {isEditingDraft ? 'Rediger Kladde' : 'Rediger Aktivitet'}
        </h1>
        <p>
          {isEditingDraft
            ? 'Rediger kladde og publicer direkte til backend.'
            : 'Opdater aktivitet med tid, kategori, lokationer og relationer.'}
        </p>
      </header>

      <form className="create-event-form" onSubmit={handleSubmit}>
        <div className="create-event-columns">
          <div className="event-left-column">
            <section className="form-card">
              <h2>Grundoplysninger</h2>
              <div className="field-grid single">
                <label>
                  Titel
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Beskrivelse
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </label>
                <label>
                  Kategori
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {EVENT_CATEGORIES.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="form-card">
              <h2>Tidspunkt</h2>
              <div className="field-grid three">
                <label>
                  Startdato
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </label>
                <label>
                  Starttidspunkt
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </label>
                <label>
                  Sluttidspunkt
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </label>
              </div>
            </section>

            <section className="form-card">
              <h2>Opsætning</h2>
              <div className="toggle-row">
                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={isDraft}
                    onChange={(e) => setIsDraft(e.target.checked)}
                  />
                  Gem som kladde
                </label>

                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsRecurring(checked);
                      if (checked && !recurrenceEndDate) {
                        setRecurrenceEndDate(getDefaultRecurrenceEndDate(startDate));
                      }
                    }}
                  />
                  Gentagende aktivitet
                </label>
              </div>

              {isRecurring && (
                <div className="field-grid two recurrence-box">
                  <label>
                    Gentagelsesfrekvens
                    <select
                      value={recurrenceFrequency}
                      onChange={(e) => setRecurrenceFrequency(e.target.value)}
                    >
                      <option value="DAILY">Dagligt</option>
                      <option value="WEEKLY">Ugentligt</option>
                      <option value="MONTHLY">Maanedligt</option>
                    </select>
                  </label>
                  <label>
                    Slutdato for serie
                    <input
                      type="date"
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                      required={isRecurring}
                    />
                  </label>
                </div>
              )}
            </section>
          </div>

          <div className="event-right-column">
            <section className="form-card">
              <h2>Forening og kontaktpersoner</h2>

              {isLoadingRelations && <p className="muted">Henter foreninger og kontaktpersoner...</p>}

              {!isLoadingRelations && availableAssociations.length === 0 && (
                <p className="muted">Ingen foreninger fundet endnu.</p>
              )}

              <div className="field-grid single">
                <label>
                  Forening
                  <select
                    value={selectedAssociationId}
                    onChange={(e) => setSelectedAssociationId(Number(e.target.value) || 0)}
                  >
                    <option value={0}>Ingen forening</option>
                    {availableAssociations.map((association) => {
                      const associationId = Number(pickValue(association, 'associationId', 'AssociationId')) || 0;
                      const associationName = pickValue(association, 'name', 'Name') || 'Ukendt forening';

                      return (
                        <option key={associationId} value={associationId}>{associationName}</option>
                      );
                    })}
                  </select>
                </label>
              </div>

              {selectedAssociation && (
                <div className="association-panel">
                  {pickValue(selectedAssociation, 'websiteUrl', 'WebsiteUrl') && (
                    <a
                      className="association-link"
                      href={pickValue(selectedAssociation, 'websiteUrl', 'WebsiteUrl')}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Åbn foreningens hjemmeside
                    </a>
                  )}

                  <div>
                    <p className="section-caption">Kontakter på valgt forening</p>
                    {associationContacts.length > 0 ? (
                      <div className="chip-list">
                        {associationContacts.map((contact) => {
                          const contactId = Number(pickValue(contact, 'contactId', 'ContactId')) || 0;
                          const contactName = pickValue(contact, 'name', 'Name') || 'Ukendt kontakt';

                          return <span key={contactId} className="info-chip">{contactName}</span>;
                        })}
                      </div>
                    ) : (
                      <p className="muted">Den valgte forening har ingen kontaktpersoner endnu.</p>
                    )}
                  </div>
                </div>
              )}

              <div className="contact-picker-block">
                <p className="section-caption">Direkte kontaktpersoner på event</p>
                <p className="muted">Disse kontakter kobles direkte til eventet og kan godt være uafhængige af den valgte forening.</p>

                {availableContacts.length === 0 ? (
                  <p className="muted">Ingen kontaktpersoner fundet endnu.</p>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn-add"
                      onClick={() => setIsContactModalOpen(true)}
                    >
                      Tilføj kontaktperson
                    </button>

                    {selectedContactIds.length > 0 && (
                      <div className="contact-selected-chips">
                        {availableContacts
                          .filter((contact) => selectedContactIds.includes(Number(pickValue(contact, 'contactId', 'ContactId')) || 0))
                          .map((contact) => {
                            const contactId = Number(pickValue(contact, 'contactId', 'ContactId')) || 0;
                            const contactName = pickValue(contact, 'name', 'Name') || 'Ukendt kontakt';

                            return (
                              <button
                                key={contactId}
                                type="button"
                                className="contact-selected-chip"
                                onClick={() => toggleContactSelection(contactId)}
                              >
                                {contactName} ×
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>

            <section className="form-card">
              <div className="section-head">
                <h2>Lokationer</h2>
                <button type="button" className="btn-add" onClick={addLocation}>Tilføj lokation til event</button>
              </div>

              {isLoadingLocations && <p className="muted">Henter lokationer...</p>}
              {!isLoadingLocations && availableLocations.length === 0 && (
                <p className="muted error-text">Ingen lokationer fundet fra backend.</p>
              )}

              {locations.length === 0 && (
                <p className="muted">Ingen lokationer tilføjet endnu. Brug knappen ovenfor for at tilføje en lokation.</p>
              )}

              <div className="location-list">
                {locations.map((loc, index) => (
                  <div key={index} className="location-card">
                    <h3>Lokation {index + 1}</h3>
                    <div className="location-row">
                    <label>
                      Lokation
                      <select
                        value={loc.locationId}
                        onChange={(e) => handleLocationChange(index, 'locationId', Number(e.target.value))}
                      >
                        <option value={0}>Vælg...</option>
                        {availableLocations.map((backendLocation) => (
                          <option key={backendLocation.id} value={backendLocation.id}>
                            {backendLocation.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Starttid
                      <input
                        type="time"
                        value={loc.startTime}
                        onChange={(e) => handleLocationChange(index, 'startTime', e.target.value)}
                      />
                    </label>

                    <label>
                      Sluttid
                      <input
                        type="time"
                        value={loc.endTime}
                        onChange={(e) => handleLocationChange(index, 'endTime', e.target.value)}
                      />
                    </label>
                    </div>

                    {locations.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => removeLocation(index)}
                      >
                        Fjern
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="form-card catering-card">
              <h2>Forplejning</h2>
              <p className="muted">Forplejning til event bliver tilføjet i næste trin.</p>
              <button type="button" className="btn-add" disabled>
                Tilføj forplejning (kommer snart)
              </button>
            </section>

            <div className="submit-row">
              <button type="submit" className="btn-submit">
                {isDraft ? 'Opdater kladde' : 'Opdater og publicer'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {(successMsg || errorMsg) && (
        <div className="event-message-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="event-message-title">
          <div className={`event-message-modal ${errorMsg ? 'error' : 'success'}`}>
            <h3 id="event-message-title">{errorMsg ? 'Kunne ikke gemme' : 'Gemt'}</h3>
            <p>{errorMsg || successMsg}</p>
            <div className="event-message-modal-actions">
              <button type="button" className="event-message-close-btn" onClick={closeMessageModal}>
                Luk
              </button>
            </div>
          </div>
        </div>
      )}

      {isContactModalOpen && (
        <div className="contact-modal-overlay" onClick={closeContactModal}>
          <div
            className="contact-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="contact-modal-header">
              <h3 id="contact-modal-title">Tilføj kontaktperson</h3>
              <button type="button" className="contact-modal-close" onClick={closeContactModal}>
                Luk
              </button>
            </div>

            <ContactsSearchBar
              searchTerm={contactSearchTerm}
              onSearchTermChange={setContactSearchTerm}
              inputId="event-contacts-search"
            />

            {filteredContacts.length === 0 ? (
              <p className="muted">Ingen kontaktpersoner matcher din søgning.</p>
            ) : (
              <div className="contact-selection-list">
                {filteredContacts.map((contact) => {
                  const contactId = Number(pickValue(contact, 'contactId', 'ContactId')) || 0;
                  const contactName = pickValue(contact, 'name', 'Name') || 'Ukendt kontakt';
                  const contactTitle = pickValue(contact, 'title', 'Title');
                  const contactEmail = pickValue(contact, 'email', 'Email');
                  const isSelected = selectedContactIds.includes(contactId);
                  const belongsToSelectedAssociation = associationContactIds.includes(contactId);
                  const associationNames = contactAssociationNamesById[contactId] || [];

                  return (
                    <label key={contactId} className={`contact-option ${isSelected ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleContactSelection(contactId)}
                      />
                      <div className="contact-option-text">
                        <span className="contact-option-name">{contactName}</span>
                        <span className="contact-option-meta">
                          {[
                            contactTitle,
                            contactEmail,
                            associationNames.length > 0 ? `Foreninger: ${associationNames.join(', ')}` : null,
                            belongsToSelectedAssociation ? 'også på valgt forening' : null
                          ]
                            .filter(Boolean)
                            .join(' · ') || 'Ingen ekstra oplysninger'}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditEvent;
