import React, { useState } from 'react';
import { addActivity } from './ActivityService';

const CreateActivity = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Brug in-memory service til at gemme
    addActivity({ title, description, date });
    
    setSuccessMsg("Aktivitet oprettet succesfuldt!");
    setTitle('');
    setDescription('');
    setDate('');

    // Fjern besked efter 3 sekunder
    setTimeout(() => {
        setSuccessMsg('');
    }, 3000);
  };

  return (
    <div className="create-activity-container" style={{ padding: '20px' }}>
      <h1>Opret ny aktivitet</h1>
      {successMsg && (
        <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '5px', marginBottom: '15px', maxWidth: '400px' }}>
          {successMsg}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', maxWidth: '400px', gap: '15px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="title">Titel</label>
          <input 
            type="text" 
            id="title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
            style={{ padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="description">Beskrivelse</label>
          <textarea 
            id="description" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            style={{ padding: '8px', marginTop: '5px', minHeight: '100px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="date">Dato</label>
          <input 
            type="date" 
            id="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            required 
            style={{ padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px', backgroundColor: '#0056b3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Opret Aktivitet
        </button>
      </form>
    </div>
  );
};

export default CreateActivity;
