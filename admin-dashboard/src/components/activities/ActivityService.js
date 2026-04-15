const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5172/api';

// Generic fetch wrapper with error handling
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options
  };
  const res = await fetch(url, config);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res;
}

// In-memory fallback storage (used if API unavailable)
let activities = [
  {
    id: 1, title: 'Fodboldturnering', description: 'Årlig turnering for lokalområdet.',
    startDate: '2026-05-20', startTime: '10:00', endTime: '15:00', isRecurring: false, isDraft: false
  },
  {
    id: 2, title: 'Yoga Hold', description: 'Aftenyoga session.',
    startDate: '2026-06-15', startTime: '19:00', endTime: '20:00',
    isRecurring: true, recurrenceFrequency: 'Weekly', recurrenceEndDate: '2026-06-29',
    occurrences: [
      { date: '2026-06-15', startTime: '19:00', endTime: '20:00' },
      { date: '2026-06-22', startTime: '19:00', endTime: '20:00' },
      { date: '2026-06-29', startTime: '19:00', endTime: '20:00' }
    ],
    isDraft: false
  }
];

export const getActivities = async (type) => {
  try {
    const res = await fetchAPI('/events');
    const data = await res.json();
    // Map backend EventResponseDto to frontend format
    const mapped = data.map(ev => ({
      id: ev.id,
      title: ev.name,
      description: ev.description,
      startDate: ev.startTime ? ev.startTime.split('T')[0] : '',
      startTime: ev.startTime ? ev.startTime.split('T')[1]?.substring(0,5) : '',
      endTime: ev.endTime ? ev.endTime.split('T')[1]?.substring(0,5) : '',
      isRecurring: !!ev.seriesId, // crude; improve if needed
      recurrenceFrequency: null,
      recurrenceEndDate: null,
      occurrences: ev.locations?.map(loc => ({
        date: ev.startTime?.split('T')[0] || '',
        startTime: loc.startTime ? loc.startTime.split('T')[1]?.substring(0,5) : '',
        endTime: loc.endTime ? loc.endTime.split('T')[1]?.substring(0,5) : ''
      })) || [],
      isDraft: ev.isDraft
    }));
    const nonDrafts = mapped.filter(a => !a.isDraft);
    if (type === 'recurring') return nonDrafts.filter(a => a.isRecurring);
    if (type === 'single') return nonDrafts.filter(a => !a.isRecurring);
    return nonDrafts;
  } catch (err) {
    console.warn('API unavailable, using fallback data:', err.message);
    const nonDrafts = activities.filter(a => !a.isDraft);
    if (type === 'recurring') return nonDrafts.filter(a => a.isRecurring);
    if (type === 'single') return nonDrafts.filter(a => !a.isRecurring);
    return [...nonDrafts];
  }
};

export const getDraftActivities = async () => {
  try {
    const res = await fetchAPI('/events/drafts');
    const data = await res.json();
    return data.map(ev => ({
      id: ev.id,
      title: ev.name,
      description: ev.description,
      startDate: ev.startTime ? ev.startTime.split('T')[0] : '',
      startTime: ev.startTime ? ev.startTime.split('T')[1]?.substring(0,5) : '',
      endTime: ev.endTime ? ev.endTime.split('T')[1]?.substring(0,5) : '',
      isRecurring: !!ev.seriesId,
      recurrenceFrequency: null,
      recurrenceEndDate: null,
      occurrences: ev.locations?.map(loc => ({
        date: ev.startTime?.split('T')[0] || '',
        startTime: loc.startTime ? loc.startTime.split('T')[1]?.substring(0,5) : '',
        endTime: loc.endTime ? loc.endTime.split('T')[1]?.substring(0,5) : ''
      })) || [],
      isDraft: true
    }));
  } catch (err) {
    console.warn('API unavailable, using fallback drafts:', err.message);
    return activities.filter(a => a.isDraft);
  }
};

export const deleteActivity = async (id) => {
  try {
    await fetchAPI(`/events/${id}`, { method: 'DELETE' });
    activities = activities.filter(a => a.id !== id);
  } catch (err) {
    console.warn('Delete failed, using fallback:', err.message);
    activities = activities.filter(a => a.id !== id);
  }
};

export const addActivity = async (activity) => {
  // Auto-detect draft
  const autoDraft = !activity.startDate || !activity.startTime || !activity.endTime ||
                    !activity.locations || activity.locations.length === 0 ||
                    !activity.locations.some(loc => loc.locationId);
  const isDraft = activity.isDraft || autoDraft;

  // Build payload for backend
  const startDateTime = activity.startDate && activity.startTime ? `${activity.startDate}T${activity.startTime}` : null;
  const endDateTime = activity.startDate && activity.endTime ? `${activity.startDate}T${activity.endTime}` : null;

  const locationsPayload = (activity.locations || [])
    .filter(loc => loc.locationId)
    .map(loc => ({
      LocationId: Number(loc.locationId),
      StartTime: activity.startDate && loc.startTime ? `${activity.startDate}T${loc.startTime}` : null,
      EndTime: activity.startDate && loc.endTime ? `${activity.startDate}T${loc.endTime}` : null
    }));

  const payload = {
    Name: activity.title,
    Description: activity.description,
    StartTime: startDateTime,
    EndTime: endDateTime,
    Category: 'Other',
    Locations: locationsPayload,
    TemplateId: null,
    CreatedBy: 'System',
    IsRecurring: activity.isRecurring || false,
    RecurrenceFrequency: activity.isRecurring ? activity.recurrenceFrequency : null,
    RecurrenceEndDate: activity.isRecurring ? activity.recurrenceEndDate : null,
    IsDraft: isDraft
  };

  try {
    const res = await fetchAPI('/events', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const created = await res.json();

    // Convert back to frontend format
    return {
      id: created.id,
      title: created.name,
      description: created.description,
      startDate: created.startTime?.split('T')[0] || '',
      startTime: created.startTime?.split('T')[1]?.substring(0,5) || '',
      endTime: created.endTime?.split('T')[1]?.substring(0,5) || '',
      isRecurring: !!created.seriesId,
      recurrenceFrequency: created.recurrenceFrequency,
      recurrenceEndDate: created.recurrenceEndDate,
      occurrences: created.locations?.map(loc => ({
        date: created.startTime?.split('T')[0] || '',
        startTime: loc.startTime?.split('T')[1]?.substring(0,5) || '',
        endTime: loc.endTime?.split('T')[1]?.substring(0,5) || ''
      })) || [],
      isDraft: created.isDraft
    };
  } catch (err) {
    console.warn('API call failed, using fallback storage:', err.message);
    // Fallback: generate in-memory event
    let occurrences = [];
    if (activity.isRecurring && activity.recurrenceEndDate) {
      let currentDate = new Date(activity.startDate || new Date());
      const endDate = new Date(activity.recurrenceEndDate);
      while (currentDate <= endDate) {
        occurrences.push({
          date: currentDate.toISOString().split('T')[0],
          startTime: activity.startTime || '',
          endTime: activity.endTime || ''
        });
        if (activity.recurrenceFrequency === 'Daily') {
          currentDate.setDate(currentDate.getDate() + 1);
        } else if (activity.recurrenceFrequency === 'Weekly') {
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (activity.recurrenceFrequency === 'Monthly') {
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else {
          break;
        }
      }
    }
    const newActivity = {
      ...activity,
      isDraft,
      id: activities.length > 0 ? Math.max(...activities.map(a => a.id)) + 1 : 1,
      occurrences
    };
    activities.push(newActivity);
    return newActivity;
  }
};

export const updateActivity = async (updated) => {
  try {
    // Build payload for publish endpoint
    const startDateTime = `${updated.startDate}T${updated.startTime}`;
    const endDateTime = `${updated.startDate}T${updated.endTime}`;

    const locationsPayload = (updated.occurrences || []).map(occ => ({
      LocationId: 1, // Default; could be passed in occ.locationId
      StartTime: `${updated.startDate}T${occ.startTime}`,
      EndTime: `${updated.startDate}T${occ.endTime}`
    }));

    const payload = {
      Name: updated.title,
      Description: updated.description,
      StartTime: startDateTime,
      EndTime: endDateTime,
      Category: 'Other',
      Locations: locationsPayload,
      TemplateId: null,
      CreatedBy: 'System',
      IsRecurring: updated.isRecurring || false,
      RecurrenceFrequency: updated.isRecurring ? updated.recurrenceFrequency : null,
      RecurrenceEndDate: updated.isRecurring ? updated.recurrenceEndDate : null,
      IsDraft: false
    };

    const res = await fetchAPI(`/events/${updated.id}/publish`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const saved = await res.json();
    // Remove from in-memory array and replace with updated
    activities = activities.filter(a => a.id !== updated.id);
    const newAct = {
      id: saved.id,
      title: saved.name,
      description: saved.description,
      startDate: saved.startTime?.split('T')[0] || '',
      startTime: saved.startTime?.split('T')[1]?.substring(0,5) || '',
      endTime: saved.endTime?.split('T')[1]?.substring(0,5) || '',
      isRecurring: !!saved.seriesId,
      recurrenceFrequency: saved.recurrenceFrequency,
      recurrenceEndDate: saved.recurrenceEndDate,
      occurrences: saved.locations?.map(loc => ({
        date: saved.startTime?.split('T')[0] || '',
        startTime: loc.startTime?.split('T')[1]?.substring(0,5) || '',
        endTime: loc.endTime?.split('T')[1]?.substring(0,5) || ''
      })) || [],
      isDraft: false
    };
    activities.push(newAct);
    return newAct;
  } catch (err) {
    console.warn('Update failed, using fallback:', err.message);
    const newAct = { ...updated, isDraft: false };
    activities = activities.filter(a => a.id !== updated.id);
    activities.push(newAct);
    return newAct;
  }
};

export const getAllActivities = () => activities;
