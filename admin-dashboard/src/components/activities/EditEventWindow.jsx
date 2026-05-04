import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axiosConfig';
import { notifyError, notifySuccess } from '../toast/toastBus';
import AddAssociationWindow from './AddAssociationWindow';
import AddContactWindow from './AddContactWindow';
import AddLocationWindow from './AddLocationWindow';
import './AddWindowSlide.css';
import './EditEventWindow.css';

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

const normalizeIdList = (values) => [...new Set(
  (values || [])
    .map((v) => Number(v))
    .filter((v) => Number.isInteger(v) && v > 0)
)];

const toLocalDateInput = (dateTime) => {
  if (!dateTime) return '';
  const raw = String(dateTime);
  const datePart = raw.includes('T') ? raw.split('T')[0] : raw;
  return datePart;
};

const toLocalTimeInput = (dateTime) => {
  if (!dateTime) return '';
  const raw = String(dateTime);
  const timePart = raw.includes('T') ? raw.split('T')[1] : raw;
  return timePart.slice(0, 5);
};

const toApiLocalDateTime = (datePart, timePart) => {
  if (!datePart || !timePart) return null;
  return `${datePart}T${timePart}:00`;
};

const normalizeCategory = (category) => {
  if (typeof category === 'number') {
    return ENUM_TO_CATEGORY[category] || 'ANDET';
  }

  return String(category || 'ANDET').toUpperCase();
};

const EditEventWindow = ({ isOpen, onClose, eventData, onSaved }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('SPORT');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isDraft, setIsDraft] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Relations
  const [availableAssociations, setAvailableAssociations] = useState([]);
  const [availableContacts, setAvailableContacts] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [selectedAssociationId, setSelectedAssociationId] = useState(0);
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isLoadingRelations, setIsLoadingRelations] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [isAssociationWindowOpen, setIsAssociationWindowOpen] = useState(false);
  const [isContactWindowOpen, setIsContactWindowOpen] = useState(false);
  const [isLocationWindowOpen, setIsLocationWindowOpen] = useState(false);

  const eventId = useMemo(
    () => Number(pickValue(eventData, 'id', 'Id', 'eventId', 'EventId')) || 0,
    [eventData]
  );

  const selectedAssociation = availableAssociations.find(
    (a) => Number(pickValue(a, 'associationId', 'AssociationId')) === Number(selectedAssociationId)
  ) || null;

  const associationContacts = Array.isArray(selectedAssociation?.contacts)
    ? selectedAssociation.contacts
    : [];

  const associationContactIds = normalizeIdList(
    associationContacts.map((c) => pickValue(c, 'contactId', 'ContactId'))
  );

  const contactAssociationNamesById = availableAssociations.reduce((lookup, assoc) => {
    const assocName = pickValue(assoc, 'name', 'Name');
    (Array.isArray(assoc?.contacts) ? assoc.contacts : []).forEach((c) => {
      const cId = Number(pickValue(c, 'contactId', 'ContactId')) || 0;
      if (!cId || !assocName) return;
      if (!lookup[cId]) lookup[cId] = [];
      if (!lookup[cId].includes(assocName)) lookup[cId].push(assocName);
    });
    return lookup;
  }, {});

  const filteredContacts = availableContacts.filter((c) => {
    const term = contactSearchTerm.trim().toLowerCase();
    if (!term) return true;
    const cId = Number(pickValue(c, 'contactId', 'ContactId')) || 0;
    const haystack = [
      pickValue(c, 'name', 'Name'),
      pickValue(c, 'title', 'Title'),
      pickValue(c, 'phone', 'Phone'),
      pickValue(c, 'email', 'Email'),
      ...(contactAssociationNamesById[cId] || [])
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(term);
  });

  useEffect(() => {
    if (!isOpen || !eventData) return;

    const rawCategory = pickValue(eventData, 'category', 'Category');
    const rawStartTime = pickValue(eventData, 'startTime', 'StartTime');
    const rawEndTime = pickValue(eventData, 'endTime', 'EndTime');
    const rawDate = pickValue(eventData, 'date', 'Date') || rawStartTime;

    setTitle(pickValue(eventData, 'name', 'Name') || '');
    setDescription(pickValue(eventData, 'description', 'Description') || '');
    setCategory(normalizeCategory(rawCategory));
    setStartDate(toLocalDateInput(rawDate));
    setStartTime(toLocalTimeInput(rawStartTime));
    setEndTime(toLocalTimeInput(rawEndTime));
    setIsDraft(Boolean(pickValue(eventData, 'isDraft', 'IsDraft')));
    setErrorMsg('');

    // Association
    setSelectedAssociationId(Number(pickValue(eventData, 'associationId', 'AssociationId')) || 0);

    // Locations from event data
    const rawLocations = pickValue(eventData, 'locations', 'Locations');
    const sourceLocs = Array.isArray(rawLocations) ? rawLocations : [];
    const mappedLocs = sourceLocs.map((loc) => ({
      locationId: Number(pickValue(loc, 'locationId', 'LocationId', 'id', 'Id')) || 0,
      startTime: toLocalTimeInput(pickValue(loc, 'startTime', 'StartTime')),
      endTime: toLocalTimeInput(pickValue(loc, 'endTime', 'EndTime'))
    })).filter((loc) => loc.locationId > 0);
    setLocations(mappedLocs);

    setContactSearchTerm('');
    setIsAssociationWindowOpen(false);
    setIsContactWindowOpen(false);
    setIsLocationWindowOpen(false);
  }, [isOpen, eventData]);

  // Fetch available data and existing contacts when window opens
  useEffect(() => {
    if (!isOpen || !eventData) return;

    const fetchData = async () => {
      setIsLoadingRelations(true);
      setIsLoadingLocations(true);
      try {
        const [locRes, assocRes, contactsRes] = await Promise.allSettled([
          api.get('/locations'),
          api.get('/associations'),
          api.get('/contacts')
        ]);
        setAvailableLocations(locRes.status === 'fulfilled' && Array.isArray(locRes.value.data) ? locRes.value.data : []);
        setAvailableAssociations(assocRes.status === 'fulfilled' && Array.isArray(assocRes.value.data) ? assocRes.value.data : []);
        setAvailableContacts(contactsRes.status === 'fulfilled' && Array.isArray(contactsRes.value.data) ? contactsRes.value.data : []);
      } catch (err) {
        console.error('Kunne ikke hente relationsdata:', err);
      } finally {
        setIsLoadingRelations(false);
        setIsLoadingLocations(false);
      }
    };

    const fetchEventContacts = async () => {
      const id = Number(pickValue(eventData, 'id', 'Id', 'eventId', 'EventId')) || 0;
      if (!id) { setSelectedContactIds([]); return; }
      try {
        const res = await api.get(`/contacts/events/${id}`);
        setSelectedContactIds(normalizeIdList(
          (Array.isArray(res.data) ? res.data : []).map((c) => pickValue(c, 'contactId', 'ContactId'))
        ));
      } catch (err) {
        console.error('Kunne ikke hente event-kontakter:', err);
        setSelectedContactIds([]);
      }
    };

    fetchData();
    fetchEventContacts();
  }, [isOpen, eventData]);

  if (!isOpen || !eventData) {
    return null;
  }

  const toggleContactSelection = (contactId) => {
    const numId = Number(contactId);
    if (!numId) return;
    setSelectedContactIds((prev) =>
      prev.includes(numId) ? prev.filter((id) => id !== numId) : [...prev, numId]
    );
  };

  const handleLocationChange = (index, field, value) => {
    setLocations((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addLocation = () => setLocations((prev) => [...prev, { locationId: 0, startTime: '', endTime: '' }]);

  const removeLocation = (index) => {
    setLocations((prev) => prev.filter((_, i) => i !== index));
  };

  const syncAssociationSelection = async ({ associationId, eventId: evId }) => {
    if (associationId) {
      await api.post(`/associations/${associationId}/events/${evId}`, {}, { skipCrudToast: true });
    } else {
      await api.delete(`/associations/events/${evId}`, { skipCrudToast: true });
    }
  };

  const syncDirectContacts = async (evId, contactIds) => {
    if (!evId) return;
    const res = await api.get(`/contacts/events/${evId}`);
    const existingIds = normalizeIdList(
      (Array.isArray(res.data) ? res.data : []).map((c) => pickValue(c, 'contactId', 'ContactId'))
    );
    const targetIds = normalizeIdList(contactIds);

    await Promise.all(
      existingIds
        .filter((id) => !targetIds.includes(id))
        .map((id) => api.delete(`/contacts/${id}/events/${evId}`, { skipCrudToast: true }))
    );
    await Promise.all(
      targetIds
        .filter((id) => !existingIds.includes(id))
        .map((id) => api.post(`/contacts/${id}/events/${evId}`, {}, { skipCrudToast: true }))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!eventId) {
      setErrorMsg('Event-id mangler. Prøv at åbne eventet igen.');
      return;
    }

    setIsSaving(true);

    try {
      const locationsPayload = locations
        .filter((loc) => loc.locationId > 0 && startDate && loc.startTime && loc.endTime)
        .map((loc) => ({
          LocationId: loc.locationId,
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
        Category: CATEGORY_TO_ENUM[category] ?? CATEGORY_TO_ENUM.ANDET,
        Locations: locationsPayload,
        TemplateId: pickValue(eventData, 'templateId', 'TemplateId') ?? null,
        CreatedBy: pickValue(eventData, 'createdBy', 'CreatedBy') || 'admin-dashboard',
        IsRecurring: Boolean(pickValue(eventData, 'isRecurring', 'IsRecurring')),
        RecurrenceFrequency: pickValue(eventData, 'recurrenceFrequency', 'RecurrenceFrequency') || null,
        RecurrenceEndDate: pickValue(eventData, 'recurrenceEndDate', 'RecurrenceEndDate') || null,
        IsDraft: isDraft
      };

      await api.put(`/events/${eventId}`, payload, { skipCrudToast: true });

      try {
        await syncAssociationSelection({ associationId: Number(selectedAssociationId) || 0, eventId });
        await syncDirectContacts(eventId, selectedContactIds);
      } catch (relErr) {
        const relApiErr = relErr?.response?.data;
        const relMsg = relApiErr?.title || relApiErr?.message || 'Eventet blev gemt, men relationer kunne ikke synkroniseres.';
        notifyError(relMsg);
        setErrorMsg(relMsg);
        setIsSaving(false);
        return;
      }

      notifySuccess('Eventet er opdateret.');

      const updatedEvent = {
        ...eventData,
        name: title,
        Name: title,
        description,
        Description: description,
        category,
        Category: category,
        startTime: payload.StartTime,
        StartTime: payload.StartTime,
        endTime: payload.EndTime,
        EndTime: payload.EndTime,
        date: startDate,
        Date: startDate,
        isDraft,
        IsDraft: isDraft
      };

      onSaved?.(updatedEvent);
      onClose();
    } catch (err) {
      const apiError = err?.response?.data;
      const validationErrors = apiError?.errors
        ? Object.values(apiError.errors).flat().join(' ')
        : '';
      const message = typeof apiError === 'string'
        ? apiError
        : validationErrors || apiError?.title || apiError?.message || 'Kunne ikke opdatere eventet.';

      setErrorMsg(message);
      notifyError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="add-window-overlay" onClick={onClose}>
      <AddAssociationWindow
        noOverlay
        isOpen={isAssociationWindowOpen}
        onClose={() => setIsAssociationWindowOpen(false)}
        isLoadingRelations={isLoadingRelations}
        availableAssociations={availableAssociations}
        selectedAssociationId={selectedAssociationId}
        setSelectedAssociationId={setSelectedAssociationId}
        associationContacts={associationContacts}
      />

      <AddContactWindow
        noOverlay
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
        noOverlay
        isOpen={isLocationWindowOpen}
        onClose={() => setIsLocationWindowOpen(false)}
        isLoadingLocations={isLoadingLocations}
        availableLocations={availableLocations}
        locations={locations}
        addLocation={addLocation}
        removeLocation={removeLocation}
        handleLocationChange={handleLocationChange}
      />

      <aside
        className="add-window-panel"
        role="dialog"
          aria-modal="true"
          aria-labelledby="edit-event-window-title"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="add-window-header">
            <h3 id="edit-event-window-title">Rediger event</h3>
            <button type="button" className="btn btn-secondary add-window-close" onClick={onClose}>
              Luk
            </button>
          </div>

          <div className="add-window-body">
            <form className="edit-event-window-form" onSubmit={handleSubmit}>
              <div className="edit-event-window-badges">
                <span className="edit-event-window-badge">ID: {eventId}</span>
                <span className={`edit-event-window-badge ${isDraft ? 'warning' : 'success'}`}>
                  {isDraft ? 'Kladde' : 'Aktiv'}
                </span>
              </div>

              <div className="edit-event-window-field">
                <label htmlFor="edit-event-title">Titel</label>
                <input
                  id="edit-event-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="edit-event-window-field">
                <label htmlFor="edit-event-description">Beskrivelse</label>
                <textarea
                  id="edit-event-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="edit-event-window-grid">
                <div className="edit-event-window-field">
                  <label htmlFor="edit-event-category">Kategori</label>
                  <select
                    id="edit-event-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {EVENT_CATEGORIES.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div className="edit-event-window-field">
                  <label htmlFor="edit-event-date">Dato</label>
                  <input
                    id="edit-event-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="edit-event-window-field">
                  <label htmlFor="edit-event-start">Starttidspunkt</label>
                  <input
                    id="edit-event-start"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>

                <div className="edit-event-window-field">
                  <label htmlFor="edit-event-end">Sluttidspunkt</label>
                  <input
                    id="edit-event-end"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <label className="toggle-item" htmlFor="edit-event-draft-toggle">
                <input
                  id="edit-event-draft-toggle"
                  type="checkbox"
                  checked={isDraft}
                  onChange={(e) => setIsDraft(e.target.checked)}
                />
                Gem som kladde
              </label>

              {/* Relations section */}
              <div className="edit-event-window-relations">
                <p className="edit-event-window-relations-label">Relationer</p>
                <div className="edit-event-window-relation-btns">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsAssociationWindowOpen(true)}
                  >
                    Forening
                    {selectedAssociationId > 0 && (
                      <span className="edit-event-window-rel-badge">
                        {pickValue(selectedAssociation, 'name', 'Name') || '1'}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsContactWindowOpen(true)}
                  >
                    Kontakter
                    {selectedContactIds.length > 0 && (
                      <span className="edit-event-window-rel-badge">{selectedContactIds.length}</span>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsLocationWindowOpen(true)}
                  >
                    Lokationer
                    {locations.filter((l) => l.locationId > 0).length > 0 && (
                      <span className="edit-event-window-rel-badge">
                        {locations.filter((l) => l.locationId > 0).length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {errorMsg && <p className="edit-event-window-inline-status error">{errorMsg}</p>}

              <div className="edit-event-window-actions">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Annuller
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Gemmer...' : 'Gem ændringer'}
                </button>
              </div>
            </form>
          </div>
        </aside>
    </div>
  );
};

export default EditEventWindow;
