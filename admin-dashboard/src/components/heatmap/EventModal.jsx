import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { locations } from '../../data/DummyData';
import './EventModal.css';

const EventModal = ({ event, onClose, onSave, onDelete }) => {
  // Hjælpefunktion til at formatere ISO til 'YYYY-MM-DDTHH:mm' som input feltet kræver
  const formatForInput = (isoString) => {
    return format(parseISO(isoString), "yyyy-MM-dd'T'HH:mm");
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
    // Konvertér tilbage til ISO format før lagring
    const updatedEvent = {
      ...formData,
      locationId: parseInt(formData.locationId),
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString()
    };
    onSave(updatedEvent);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content login-card" onClick={e => e.stopPropagation()}>
        <div className="login-header">
          <h2>Administrer Event</h2>
          <p className="text-muted">Event ID: {event.eventId}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {/* NAVN */}
          <div className="input-group">
            <label className="font-weight-bold">Aktivitetsnavn</label>
            <input name="name" value={formData.name} onChange={handleChange} required />
          </div>

          {/* LOKATION */}
          <div className="input-group">
            <label className="font-weight-bold">Lokation / Hal</label>
            <select name="locationId" value={formData.locationId} onChange={handleChange} className="p-2 border rounded">
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          {/* KATEGORI */}
          <div className="input-group">
            <label className="font-weight-bold">Kategori</label>
            <select name="category" value={formData.category} onChange={handleChange} className="p-2 border rounded">
              <option value="SPORT">Sport</option>
              <option value="MEETING">Møde</option>
              <option value="OTHER">Andet</option>
            </select>
          </div>

          {/* TIDER */}
          <div className="d-flex gap-2">
            <div className="input-group w-100">
              <label className="font-weight-bold">Start</label>
              <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleChange} required />
            </div>
            <div className="input-group w-100">
              <label className="font-weight-bold">Slut</label>
              <input type="datetime-local" name="endTime" value={formData.endTime} onChange={handleChange} required />
            </div>
          </div>

          {/* KOMMENTAR */}
          <div className="input-group">
            <label className="font-weight-bold">Kommentar (Instrukser til personalet)</label>
            <textarea
              name="comment"
              rows="3"
              className="p-2 border rounded"
              value={formData.comment || ""}
              onChange={handleChange}
              placeholder="F.eks. find mål frem, lås dør op..."
            />
          </div>

          <div className="d-flex justify-content-between mt-3">
            <button type="button" className="btn btn-danger" onClick={() => onDelete(event.id)}>
              Slet Event
            </button>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Annuller</button>
              <button type="submit" className="btn btn-primary">Gem ændringer</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
