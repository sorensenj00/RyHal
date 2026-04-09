import React, { useState } from 'react';
import { addActivity } from './ActivityService';

const CreateActivity = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState('Weekly');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Brug in-memory service til at gemme
    addActivity({ 
       title, 
       description, 
       startDate, 
       startTime,
       endTime,
       isRecurring, 
       recurrenceFrequency: isRecurring ? recurrenceFrequency : null, 
       recurrenceEndDate: isRecurring ? recurrenceEndDate : null 
    });
    
    setSuccessMsg("Aktivitet oprettet succesfuldt!");
    setTitle('');
    setDescription('');
    setStartDate('');
    setStartTime('');
    setEndTime('');
    setIsRecurring(false);
    setRecurrenceEndDate('');

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
          <label htmlFor="startDate">Start dato</label>
          <input 
            type="date" 
            id="startDate" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            required 
            style={{ padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <label htmlFor="startTime">Starttidspunkt</label>
              <input 
                type="time" 
                id="startTime" 
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)} 
                required 
                style={{ padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <label htmlFor="endTime">Sluttidspunkt</label>
              <input 
                type="time" 
                id="endTime" 
                value={endTime} 
                onChange={(e) => setEndTime(e.target.value)} 
                required 
                style={{ padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input 
            type="checkbox" 
            id="isRecurring" 
            checked={isRecurring} 
            onChange={(e) => setIsRecurring(e.target.checked)} 
          />
          <label htmlFor="isRecurring" style={{fontWeight: 'bold'}}>Er dette en fast/gentagende aktivitet?</label>
        </div>

        {isRecurring && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '15px', backgroundColor: '#f0f4f8', borderRadius: '5px' }}>
               <div style={{ display: 'flex', flexDirection: 'column' }}>
                 <label htmlFor="frequency">Gentagelsesfrekvens</label>
                 <select 
                   id="frequency"
                   value={recurrenceFrequency}
                   onChange={(e) => setRecurrenceFrequency(e.target.value)}
                   style={{ padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                 >
                    <option value="Daily">Dagligt</option>
                    <option value="Weekly">Ugentligt</option>
                    <option value="Monthly">Månedligt</option>
                 </select>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column' }}>
                 <label htmlFor="endDate">Slutdato for serien</label>
                 <input 
                   type="date" 
                   id="endDate" 
                   value={recurrenceEndDate} 
                   onChange={(e) => setRecurrenceEndDate(e.target.value)} 
                   required={isRecurring}
                   style={{ padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                 />
               </div>
            </div>
        )}
        <button type="submit" style={{ padding: '10px', backgroundColor: '#0056b3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Opret Aktivitet
        </button>
      </form>
    </div>
  );
};

export default CreateActivity;
