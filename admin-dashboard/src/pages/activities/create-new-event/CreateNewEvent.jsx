import React, { useEffect, useMemo, useState } from 'react';
import api from '../../../api/axiosConfig';
import AddAssociationWindow from '../../../components/activities/AddAssociationWindow';
import AddContactWindow from '../../../components/activities/AddContactWindow';
import AddLocationWindow from '../../../components/activities/AddLocationWindow';
import AddCateringWindow from '../../../components/activities/AddCateringWindow';
import ActivityPreview from '../../../components/activities/ActivityPreview';
import { notifySuccess } from '../../../components/toast/toastBus';
import './CreateNewEvent.css';

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

const toApiLocalDateTime = (datePart, timePart) => {
  if (!datePart || !timePart) return null;
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

const toMinuteKey = (value) => {
  if (!value) return '';
  return String(value).replace('Z', '').slice(0, 16);
};

const resolveEventIdAfterSave = async ({ savedEvent, payload }) => {
  const responseEventId = Number(pickValue(savedEvent, 'id', 'Id', 'eventId', 'EventId')) || null;
  const responseSeriesId = Number(pickValue(savedEvent, 'seriesId', 'SeriesId')) || null;

  if (responseEventId || responseSeriesId) {
    return { eventId: responseEventId, seriesId: responseSeriesId };
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

const CreateNewEvent = () => {
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

  const [errorMsg, setErrorMsg] = useState('');

  const [availableLocations, setAvailableLocations] = useState([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isLoadingRelations, setIsLoadingRelations] = useState(true);
  const [availableAssociations, setAvailableAssociations] = useState([]);
  const [availableContacts, setAvailableContacts] = useState([]);

  const [selectedAssociationId, setSelectedAssociationId] = useState(0);
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [contactSearchTerm, setContactSearchTerm] = useState('');

  const [locations, setLocations] = useState([]);

  const [isAssociationWindowOpen, setIsAssociationWindowOpen] = useState(false);
  const [isContactWindowOpen, setIsContactWindowOpen] = useState(false);
  const [isLocationWindowOpen, setIsLocationWindowOpen] = useState(false);
  const [isCateringWindowOpen, setIsCateringWindowOpen] = useState(false);

  const selectedAssociation = useMemo(
    () => (
      availableAssociations.find(
        (association) => Number(pickValue(association, 'associationId', 'AssociationId')) === Number(selectedAssociationId)
      ) || null
    ),
    [availableAssociations, selectedAssociationId]
  );

  const associationContacts = Array.isArray(selectedAssociation?.contacts)
    ? selectedAssociation.contacts
    : [];

  const associationContactIds = normalizeIdList(
    associationContacts.map((contact) => pickValue(contact, 'contactId', 'ContactId'))
  );

  const contactAssociationNamesById = useMemo(
    () => availableAssociations.reduce((lookup, association) => {
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
    }, {}),
    [availableAssociations]
  );

  const filteredContacts = useMemo(
    () => availableContacts.filter((contact) => {
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
    }),
    [availableContacts, contactAssociationNamesById, contactSearchTerm]
  );

  const completeLocationsCount = locations.filter(
    (loc) => loc.locationId && loc.startTime && loc.endTime
  ).length;

  const selectedContacts = useMemo(
    () => availableContacts.filter((contact) => (
      selectedContactIds.includes(Number(pickValue(contact, 'contactId', 'ContactId')) || 0)
    )),
    [availableContacts, selectedContactIds]
  );

  const previewLocations = useMemo(
    () => locations
      .filter((loc) => loc.locationId && loc.startTime && loc.endTime)
      .map((loc) => {
        const locationMatch = availableLocations.find(
          (candidate) => Number(candidate.id) === Number(loc.locationId)
        );

        return {
          name: locationMatch?.name || `Lokation #${loc.locationId}`,
          startTime: loc.startTime,
          endTime: loc.endTime
        };
      }),
    [locations, availableLocations]
  );

  const closeMessageModal = () => {
    setErrorMsg('');
  };

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

  const removeLocation = (index) => {
    if (locations.length > 1) {
      setLocations((prev) => prev.filter((_, i) => i !== index));
    }
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
        await api.post(`/associations/${associationId}/series/${seriesId}`, null, { skipCrudToast: true });
        return;
      }

      if (eventId) {
        await api.post(`/associations/${associationId}/events/${eventId}`, null, { skipCrudToast: true });
      }

      return;
    }

    if (seriesId) {
      await api.delete(`/associations/series/${seriesId}`, { skipCrudToast: true });
      return;
    }

    if (eventId) {
      await api.delete(`/associations/events/${eventId}`, { skipCrudToast: true });
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
      .map((contactId) => api.delete(`/contacts/${contactId}/events/${eventId}`, { skipCrudToast: true })));

    await Promise.all(targetIds
      .filter((contactId) => !existingIds.includes(contactId))
      .map((contactId) => api.post(`/contacts/${contactId}/events/${eventId}`, null, { skipCrudToast: true })));
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
    setContactSearchTerm('');
    setLocations([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const autoDraft = !startDate || !startTime || !endTime;
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
        .filter((loc) => startDate && loc.locationId && loc.startTime && loc.endTime)
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

      const response = await api.post('/events', payload, { skipCrudToast: true });
      const savedEvent = response?.data || {};
      const { eventId, seriesId } = await resolveEventIdAfterSave({
        savedEvent,
        payload
      });

      try {
        if ((Number(selectedAssociationId) || 0) > 0 && !eventId && !seriesId) {
          throw new Error('Kunne ikke finde event-id til at gemme foreningskoblingen. Prøv igen.');
        }

        await syncAssociationSelection({
          associationId: Number(selectedAssociationId) || 0,
          eventId,
          seriesId
        });

        await syncDirectContacts(eventId, selectedContactIds);
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

      notifySuccess(draftToSave ? 'Aktivitet gemt som kladde!' : 'Aktivitet oprettet succesfuldt!');
      resetForm();
    } catch (err) {
      const apiError = err?.response?.data;
      const message = toFriendlyApiMessage(apiError, err.message || 'Kunne ikke oprette aktivitet.');

      setErrorMsg(message);
      setTimeout(() => setErrorMsg(''), 5000);
    }
  };

  return (
    <div className="create-event-page">
      <header className="create-event-header create-event-header-fixed">
        <div className="create-event-header-inner">
          <h1>Opret Ny Aktivitet</h1>
          <p>Start med de rå event-data til venstre og se live preview til højre.</p>
        </div>
      </header>

      <div className="create-event-body-grid">
        <section className="create-event-left-panel">
          <form id="create-event-form" className="create-event-form" onSubmit={handleSubmit}>
            <section className="form-card raw-data-card">
              <h2>1) Rå event-data</h2>
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

              <div className="field-grid three raw-time-grid">
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
                      <option value="MONTHLY">Månedligt</option>
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

            <section className="form-card optional-data-card">
              <h2>2) Tilføj valgfri data</h2>
              <p className="muted">Klik på en knap for at åbne et pop-out vindue.</p>

              <div className="optional-actions-grid">
                <button
                  type="button"
                  className="btn btn-secondary optional-action-btn"
                  onClick={() => setIsAssociationWindowOpen(true)}
                >
                  Tilføj forening
                </button>
                <button
                  type="button"
                  className="btn btn-secondary optional-action-btn"
                  onClick={() => setIsContactWindowOpen(true)}
                >
                  Tilføj kontaktpersoner
                </button>
                <button
                  type="button"
                  className="btn btn-secondary optional-action-btn"
                  onClick={() => {
                    if (locations.length === 0) {
                      addLocation();
                    }
                    setIsLocationWindowOpen(true);
                  }}
                >
                  Tilføj lokation (valgfrit)
                </button>
                <button
                  type="button"
                  className="btn btn-secondary optional-action-btn"
                  onClick={() => setIsCateringWindowOpen(true)}
                >
                  Tilføj forplejning
                </button>
              </div>

              <div className="optional-summary-grid">
                <div className="summary-pill">
                  <span className="summary-label">Forening</span>
                  <strong>{selectedAssociation ? (pickValue(selectedAssociation, 'name', 'Name') || 'Valgt') : 'Ingen'}</strong>
                </div>
                <div className="summary-pill">
                  <span className="summary-label">Kontaktpersoner</span>
                  <strong>{selectedContactIds.length}</strong>
                </div>
                <div className="summary-pill">
                  <span className="summary-label">Lokationer</span>
                  <strong>{completeLocationsCount}</strong>
                </div>
              </div>
            </section>
          </form>
        </section>

        <aside className="create-event-right-panel">
          <ActivityPreview
            title={title}
            description={description}
            category={category}
            startDate={startDate}
            startTime={startTime}
            endTime={endTime}
            isRecurring={isRecurring}
            recurrenceFrequency={recurrenceFrequency}
            recurrenceEndDate={recurrenceEndDate}
            isDraft={isDraft}
            associationName={selectedAssociation ? (pickValue(selectedAssociation, 'name', 'Name') || 'Valgt forening') : ''}
            contacts={selectedContacts}
            locations={previewLocations}
          />
        </aside>
      </div>

      <footer className="create-event-button-bar">
        <div className="create-event-button-bar-inner">
          <p className="button-bar-note">
            {isDraft ? 'Aktiviteten gemmes som kladde.' : 'Aktiviteten oprettes direkte.'}
          </p>
          <button type="submit" form="create-event-form" className="btn btn-primary btn-submit">
            {isDraft ? 'Gem Kladde' : 'Opret Aktivitet'}
          </button>
        </div>
      </footer>

      <AddAssociationWindow
        isOpen={isAssociationWindowOpen}
        onClose={() => setIsAssociationWindowOpen(false)}
        isLoadingRelations={isLoadingRelations}
        availableAssociations={availableAssociations}
        selectedAssociationId={selectedAssociationId}
        setSelectedAssociationId={setSelectedAssociationId}
        associationContacts={associationContacts}
      />

      <AddContactWindow
        isOpen={isContactWindowOpen}
        onClose={() => setIsContactWindowOpen(false)}
        availableContacts={availableContacts}
        selectedContactIds={selectedContactIds}
        toggleContactSelection={toggleContactSelection}
        contactSearchTerm={contactSearchTerm}
        setContactSearchTerm={setContactSearchTerm}
        filteredContacts={filteredContacts}
        associationContactIds={associationContactIds}
        contactAssociationNamesById={contactAssociationNamesById}
      />

      <AddLocationWindow
        isOpen={isLocationWindowOpen}
        onClose={() => setIsLocationWindowOpen(false)}
        isLoadingLocations={isLoadingLocations}
        availableLocations={availableLocations}
        locations={locations}
        addLocation={addLocation}
        removeLocation={removeLocation}
        handleLocationChange={handleLocationChange}
      />

      <AddCateringWindow
        isOpen={isCateringWindowOpen}
        onClose={() => setIsCateringWindowOpen(false)}
      />

      {errorMsg && (
        <div className="event-message-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="event-message-title">
          <div className="event-message-modal error">
            <h3 id="event-message-title">Kunne ikke gemme</h3>
            <p>{errorMsg}</p>
            <div className="event-message-modal-actions">
              <button type="button" className="btn btn-primary event-message-close-btn" onClick={closeMessageModal}>
                Luk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateNewEvent;
