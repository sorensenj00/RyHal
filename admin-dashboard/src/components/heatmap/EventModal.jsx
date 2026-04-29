import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import './EventModal.css';

const EventModal = ({ event, locations = [], onClose, onSave, onDelete, onOpenAdvancedEdit }) => {
  // Hjælpefunktion til at formatere ISO til 'YYYY-MM-DDTHH:mm' som input feltet kræver
  const formatForInput = (isoString) => {
    if (!isoString) return '';

    try {
      return format(parseISO(isoString), "yyyy-MM-dd'T'HH:mm");
    } catch {
      return String(isoString).slice(0, 16);
    }
  };

  const toLocalApiDateTime = (value) => {
    if (!value) return null;
    return value.length === 16 ? `${value}:00` : value;
  };

  const [formData, setFormData] = useState({
    ...event,
    startTime: formatForInput(event.startTime),
    endTime: formatForInput(event.endTime)
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Bevar lokal tid fra datetime-local input for at undgå timezone-forskydning.
    const updatedEvent = {
      ...formData,
      locationId: parseInt(formData.locationId),
      startTime: toLocalApiDateTime(formData.startTime),
      endTime: toLocalApiDateTime(formData.endTime)
    };
    onSave(updatedEvent);
  };

  return (
    <div className="event-edit-modal-overlay" onClick={onClose}>
      <div className="event-edit-modal" onClick={e => e.stopPropagation()}>
        <div className="event-edit-modal-header">
          <h2>Administrer Event</h2>
          <p className="event-edit-modal-subtitle">Event ID: {event.eventId || event.id}</p>
        </div>

        <form onSubmit={handleSubmit} className="event-edit-form">
          {/* NAVN */}
          <div className="event-edit-field">
            <label>Aktivitetsnavn</label>
            <input name="name" value={formData.name} onChange={handleChange} required />
          </div>

          {/* LOKATION */}
          <div className="event-edit-field">
            <label>Lokation / Hal</label>
            <select name="locationId" value={formData.locationId} onChange={handleChange}>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          {/* KATEGORI */}
          <div className="event-edit-field">
            <label>Kategori</label>
            <select name="category" value={formData.category} onChange={handleChange}>
              <option value="SPORT">Sport</option>
              <option value="MØDE">Møde</option>
              <option value="VEDLIGEHOLDELSE">Vedligehold</option>
              <option value="ANDET">Andet</option>
            </select>
          </div>

          {/* TIDER */}
          <div className="event-edit-time-grid">
            <div className="event-edit-field">
              <label>Start</label>
              <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleChange} required />
            </div>
            <div className="event-edit-field">
              <label>Slut</label>
              <input type="datetime-local" name="endTime" value={formData.endTime} onChange={handleChange} required />
            </div>
          </div>

          {/* KOMMENTAR */}
          <div className="event-edit-field">
            <label>Kommentar (Instrukser til personalet)</label>
            <textarea
              name="comment"
              rows="3"
              value={formData.comment || ""}
              onChange={handleChange}
              placeholder="F.eks. find mål frem, lås dør op..."
            />
          </div>

          <div className="event-edit-actions">
            <button type="button" className="event-edit-btn danger" onClick={() => onDelete(event.eventId || event.id)}>
              Slet Event
            </button>
            <div className="event-edit-actions-right">
              <button
                type="button"
                className="event-edit-btn info"
                onClick={() => onOpenAdvancedEdit?.(event)}
              >
                Avanceret redigering
              </button>
              <button type="button" className="event-edit-btn secondary" onClick={onClose}>Annuller</button>
              <button type="submit" className="event-edit-btn primary">Gem ændringer</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
