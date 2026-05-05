import React, { useEffect, useState } from 'react';
import api from '../../api/axiosConfig';
import { toApiLocalDateTime } from '../../utils/dateUtils';
import './CreateActivityTemplate.css';

const EVENT_CATEGORIES = ['SPORT', 'MØDE', 'VEDLIGEHOLDELSE', 'ANDET'];
const CATEGORY_TO_ENUM = {
  SPORT: 0,
  MØDE: 1,
  VEDLIGEHOLDELSE: 2,
  ANDET: 3
};


const CreateActivityTemplate = () => {
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

  const [locations, setLocations] = useState([
    { locationId: 0, startTime: '', endTime: '' }
  ]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoadingLocations(true);
        const response = await api.get('/locations');
        setAvailableLocations(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Kunne ikke hente lokationer:', error);
        setAvailableLocations([]);
      } finally {
        setIsLoadingLocations(false);
      }
    };

    fetchLocations();
  }, []);

  const handleLocationChange = (index, field, value) => {
    const newLocations = [...locations];
    newLocations[index][field] = value;
    setLocations(newLocations);
  };

  const addLocation = () => {
    setLocations([...locations, { locationId: 0, startTime: '', endTime: '' }]);
  };

  const removeLocation = (index) => {
    if (locations.length > 1) {
      setLocations(locations.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const hasCompleteLocation = locations.some(
      (loc) => loc.locationId && loc.startTime && loc.endTime
    );

    const autoDraft = !startDate || !startTime || !endTime || !hasCompleteLocation;
    const draftToSave = isDraft || autoDraft;

    try {
      const locationsPayload = locations
        .filter((loc) => startDate && loc.locationId && loc.startTime && loc.endTime)
        .map((loc) => ({
          LocationId: Number(loc.locationId),
          StartTime: toApiLocalDateTime(startDate, loc.startTime),
          EndTime: toApiLocalDateTime(startDate, loc.endTime)
        }));

      const payload = {
        Name: title,
        Description: description || '',
        StartTime: toApiLocalDateTime(startDate, startTime),
        EndTime: toApiLocalDateTime(startDate, endTime),
        Category: CATEGORY_TO_ENUM[category],
        Locations: locationsPayload,
        TemplateId: null,
        CreatedBy: 'admin-dashboard',
        IsRecurring: isRecurring,
        RecurrenceFrequency: isRecurring ? recurrenceFrequency : null,
        RecurrenceEndDate:
          isRecurring && recurrenceEndDate ? toApiLocalDateTime(recurrenceEndDate, '23:59') : null,
        IsDraft: draftToSave
      };

      await api.post('/events', payload);

      setSuccessMsg(draftToSave ? 'Aktivitet gemt som kladde!' : 'Aktivitet oprettet succesfuldt!');
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
      setLocations([{ locationId: 0, startTime: '', endTime: '' }]);

      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      const apiError = err?.response?.data;
      const validationErrors = apiError?.errors
        ? Object.values(apiError.errors).flat().join(' ')
        : '';
      const message =
        typeof apiError === 'string'
          ? apiError
          : validationErrors || apiError?.title || apiError?.message || err.message || 'Kunne ikke oprette aktivitet.';

      setErrorMsg(message);
      setTimeout(() => setErrorMsg(''), 5000);
    }
  };

  return (
    <div className="create-activity-container">
      <h1>Opret ny aktivitet</h1>
      {successMsg && (
        <div className="template-alert success">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="template-alert error">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="template-form">
        <div className="template-field span-2">
          <label htmlFor="title">Titel</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="template-input"
          />
        </div>

        <div className="template-field span-2">
          <label htmlFor="description">Beskrivelse</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="template-input template-textarea"
          />
        </div>

        <div className="template-field">
          <label htmlFor="category">Kategori</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="template-input"
          >
            {EVENT_CATEGORIES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="template-field">
          <label htmlFor="startDate">Startdato (valgfri for kladde)</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="template-input"
          />
        </div>

        <div className="template-field">
          <label htmlFor="startTime">Starttidspunkt (valgfri for kladde)</label>
          <input
            type="time"
            id="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="template-input"
          />
        </div>

        <div className="template-field">
          <label htmlFor="endTime">Sluttidspunkt (valgfri for kladde)</label>
          <input
            type="time"
            id="endTime"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="template-input"
          />
        </div>

        <div className="template-checkbox-group span-2">
          <label htmlFor="isDraft" className="template-checkbox">
            <input
              type="checkbox"
              id="isDraft"
              checked={isDraft}
              onChange={(e) => setIsDraft(e.target.checked)}
            />
            <span className="template-checkbox-mark" aria-hidden="true" />
            <span className="template-checkbox-label">Gem som kladde</span>
          </label>

          <label htmlFor="isRecurring" className="template-checkbox">
            <input
              type="checkbox"
              id="isRecurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
            />
            <span className="template-checkbox-mark" aria-hidden="true" />
            <span className="template-checkbox-label">Er dette en fast/gentagende aktivitet?</span>
          </label>
        </div>

        {isRecurring && (
          <div className="template-recurrence-box span-2">
            <div className="template-field">
              <label htmlFor="frequency">Gentagelsesfrekvens</label>
              <select
                id="frequency"
                value={recurrenceFrequency}
                onChange={(e) => setRecurrenceFrequency(e.target.value)}
                className="template-input"
              >
                <option value="DAILY">Dagligt</option>
                <option value="WEEKLY">Ugentligt</option>
                <option value="MONTHLY">Månedligt</option>
              </select>
            </div>

            <div className="template-field">
              <label htmlFor="recurrenceEndDate">Slutdato for serien</label>
              <input
                type="date"
                id="recurrenceEndDate"
                value={recurrenceEndDate}
                onChange={(e) => setRecurrenceEndDate(e.target.value)}
                required={isRecurring}
                className="template-input"
              />
            </div>
          </div>
        )}

        <div className="template-locations span-2">
          <label className="template-locations-label">Lokationer (valgfri for kladde)</label>
          {isLoadingLocations && <p className="template-muted">Henter lokationer...</p>}
          {!isLoadingLocations && availableLocations.length === 0 && (
            <p className="template-error">Ingen lokationer fundet fra backend.</p>
          )}

          {locations.map((loc, index) => (
            <div key={index} className="template-location-row">
              <div className="template-field">
                <label htmlFor={`loc-id-${index}`}>Lokation</label>
                <select
                  id={`loc-id-${index}`}
                  value={loc.locationId}
                  onChange={(e) => handleLocationChange(index, 'locationId', Number(e.target.value))}
                  className="template-input"
                >
                  <option value={0}>Vælg...</option>
                  {availableLocations.map((backendLocation) => (
                    <option key={backendLocation.id} value={backendLocation.id}>{backendLocation.name}</option>
                  ))}
                </select>
              </div>

              <div className="template-field">
                <label htmlFor={`loc-start-${index}`}>Starttid</label>
                <input
                  type="time"
                  id={`loc-start-${index}`}
                  value={loc.startTime}
                  onChange={(e) => handleLocationChange(index, 'startTime', e.target.value)}
                  className="template-input"
                />
              </div>

              <div className="template-field">
                <label htmlFor={`loc-end-${index}`}>Sluttid</label>
                <input
                  type="time"
                  id={`loc-end-${index}`}
                  value={loc.endTime}
                  onChange={(e) => handleLocationChange(index, 'endTime', e.target.value)}
                  className="template-input"
                />
              </div>

              {locations.length > 1 && (
                <button type="button" onClick={() => removeLocation(index)} className="btn btn-danger location-remove-btn">
                  Fjern
                </button>
              )}
            </div>
          ))}

          <button type="button" onClick={addLocation} className="btn btn-secondary location-add-btn">
            Tilføj lokation
          </button>
        </div>

        <button type="submit" className="btn btn-primary template-submit-btn span-2">
          {isDraft ? 'Gem kladde' : 'Opret Aktivitet'}
        </button>
      </form>
    </div>
  );
};

export default CreateActivityTemplate;
