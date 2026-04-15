import React, { useState, useEffect } from 'react';
import { getDraftActivities, updateActivity, addActivity, getAllActivities } from './ActivityService';

const DraftActivitiesList = () => {
  const [drafts, setDrafts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    startDate: '',
    startTime: '',
    endTime: '',
    locations: [{ locationId: 1, startTime: '', endTime: '' }]
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadDrafts = () => {
    const draftList = getDraftActivities();
    setDrafts(draftList);
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  const handleEditClick = (draft) => {
    setEditingId(draft.id);
    const datePart = draft.startDate || '';
    const startTime = draft.startTime || '';
    const endTime = draft.endTime || '';
    // Build initial locations from occurrences if any, else single empty
    const initialLocs = draft.occurrences && draft.occurrences.length > 0
      ? draft.occurrences.map(occ => ({
          locationId: 1,
          startTime: occ.startTime || '',
          endTime: occ.endTime || ''
        }))
      : [{ locationId: 1, startTime: '', endTime: '' }];
    setEditForm({
      startDate: datePart,
      startTime,
      endTime,
      locations: initialLocs
    });
    setError('');
  };

  const handleLocationChange = (idx, field, value) => {
    const newLocs = [...editForm.locations];
    newLocs[idx][field] = value;
    setEditForm({ ...editForm, locations: newLocs });
  };

  const addLocation = () => {
    setEditForm({
      ...editForm,
      locations: [...editForm.locations, { locationId: 1, startTime: '', endTime: '' }]
    });
  };

  const removeLocation = (idx) => {
    if (editForm.locations.length > 1) {
      setEditForm({
        ...editForm,
        locations: editForm.locations.filter((_, i) => i !== idx)
      });
    }
  };

  const handlePublish = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!editForm.startDate || !editForm.startTime || !editForm.endTime) {
      setError('Startdato, starttid og sluttid er påkrævet.');
      return;
    }
    const validLocs = editForm.locations.filter(loc => loc.locationId);
    if (validLocs.length === 0) {
      setError('Mindst én lokation skal vælges.');
      return;
    }

    // Build updated activity payload
    const original = drafts.find(d => d.id === editingId);
    if (!original) return;

    const newActivity = {
      ...original,
      startDate: editForm.startDate,
      startTime: editForm.startTime,
      endTime: editForm.endTime,
      isDraft: false,
      // Merge locations into occurrences array expected by ActivityService
      occurrences: validLocs.map(loc => ({
        date: editForm.startDate,
        startTime: loc.startTime,
        endTime: loc.endTime
      }))
    };

    updateActivity(newActivity);
    setSuccess('Aktivitet publiceret!');
    setEditingId(null);
    loadDrafts();

    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="draft-activities-container" style={{ padding: '20px' }}>
      <h1>Oversigt: Kladdeaktiviter</h1>
      <p>Her kan du se og færdiggøre ufuldstændige aktiviteter.</p>

      {success && <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>{success}</div>}
      {error && <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>{error}</div>}

      {drafts.length === 0 ? (
        <p>Ingen kladdeaktiviter.</p>
      ) : (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {drafts.map(draft => (
            <li key={draft.id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '15px', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ marginTop: 0 }}>{draft.title}</h3>
                  <p><strong>Beskrivelse:</strong> {draft.description || '(ingen)'}</p>
                  <p><strong>Oprettet:</strong> {draft.startDate || '(ikke sat)'} {draft.startTime ? `${draft.startTime} - ${draft.endTime}` : ''}</p>
                  {draft.occurrences && draft.occurrences.length > 0 && (
                    <details style={{ marginTop: '10px', backgroundColor: 'white', padding: '10px', borderRadius: '4px', border: '1px solid #eee' }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Vis planlagte forekomster ({draft.occurrences.length})</summary>
                      <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                        {draft.occurrences.map((occ, i) => (
                          <li key={i}>{occ.date} ({occ.startTime} - {occ.endTime})</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
                <button
                  onClick={() => handleEditClick(draft)}
                  style={{ padding: '8px 12px', backgroundColor: '#ffc107', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '10px' }}
                >
                  Rediger & Publicer
                </button>
              </div>

              {editingId === draft.id && (
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e9f5ff', borderRadius: '5px', border: '1px solid #b3d7ff' }}>
                  <h4>Rediger og publicer aktivitet</h4>
                  <form onSubmit={handlePublish}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div>
                        <label>Startdato</label>
                        <input
                          type="date"
                          value={editForm.startDate}
                          onChange={e => setEditForm({ ...editForm, startDate: e.target.value })}
                          required
                          style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                      </div>
                      <div>
                        <label>Slutdato (samme som start for enkelte events)</label>
                        <input type="date" value={editForm.startDate} disabled style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#eee' }} />
                      </div>
                      <div>
                        <label>Starttid</label>
                        <input
                          type="time"
                          value={editForm.startTime}
                          onChange={e => setEditForm({ ...editForm, startTime: e.target.value })}
                          required
                          style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                      </div>
                      <div>
                        <label>Sluttid</label>
                        <input
                          type="time"
                          value={editForm.endTime}
                          onChange={e => setEditForm({ ...editForm, endTime: e.target.value })}
                          required
                          style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ fontWeight: 'bold' }}>Lokationer</label>
                      {editForm.locations.map((loc, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'flex-end' }}>
                          <div style={{ flex: 1 }}>
                            <label>Lokation</label>
                            <select
                              value={loc.locationId}
                              onChange={e => handleLocationChange(idx, 'locationId', Number(e.target.value))}
                              style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                            >
                              <option value={1}>Hal A</option>
                              <option value={2}>Hal B</option>
                              <option value={3}>Fitness</option>
                              <option value={4}>Sprog</option>
                            </select>
                          </div>
                          <div style={{ flex: 1 }}>
                            <label>Starttid</label>
                            <input
                              type="time"
                              value={loc.startTime}
                              onChange={e => handleLocationChange(idx, 'startTime', e.target.value)}
                              required
                              style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label>Sluttid</label>
                            <input
                              type="time"
                              value={loc.endTime}
                              onChange={e => handleLocationChange(idx, 'endTime', e.target.value)}
                              required
                              style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                          </div>
                          {editForm.locations.length > 1 && (
                            <button type="button" onClick={() => removeLocation(idx)} style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '20px' }}>
                              Fjern
                            </button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={addLocation} style={{ marginTop: '10px', padding: '6px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Tilføj lokation
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                      <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Publicer
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Annuller
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DraftActivitiesList;
