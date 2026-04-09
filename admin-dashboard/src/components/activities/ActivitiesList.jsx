import React, { useState, useEffect } from 'react';
import { getActivities, deleteActivity } from './ActivityService';

const ActivitiesList = ({ type }) => {
  const [activities, setActivities] = useState([]);

  const loadActivities = () => {
    setActivities(getActivities(type));
  };

  useEffect(() => {
    // Hent in-memory aktiviteter baseret på typen "recurring" eller "single"
    loadActivities();
  }, [type]);

  const handleDelete = (id) => {
      if (window.confirm("Er du sikker på du vil slette denne aktivitet?")) {
        deleteActivity(id);
        loadActivities();
      }
  };

  return (
    <div className="activities-list-container" style={{ padding: '20px' }}>
      <h1>{type === 'recurring' ? 'Oversigt: Faste aktiviteter' : 'Oversigt: Selvstændige aktiviteter'}</h1>
      <p>Rediger eller slet dine oprettede aktiviteter herunder.</p>
      
      {activities.length === 0 ? (
        <p>Ingen aktiviteter fundet.</p>
      ) : (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {activities.map(activity => (
            <li key={activity.id} style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #ccc', margin: '10px 0', padding: '15px', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
               <div style={{ flex: 1 }}>
                  <h3 style={{ marginTop: '0' }}>{activity.title}</h3>
                  <p style={{ margin: '5px 0' }}><strong>Beskrivelse:</strong> {activity.description}</p>
                  <p style={{ margin: '5px 0' }}>
                      <strong>Dato:</strong> {activity.startDate} <br/>
                      <strong>Tidspunkt:</strong> {activity.startTime} - {activity.endTime}
                  </p>
                  {activity.isRecurring && (
                      <div style={{ marginTop: '10px' }}>
                          <p style={{ margin: '5px 0', color: '#0056b3' }}><strong>Regel:</strong> {activity.recurrenceFrequency} - frem til {activity.recurrenceEndDate}</p>
                          {activity.occurrences && activity.occurrences.length > 0 && (
                              <details style={{ marginTop: '10px', backgroundColor: 'white', padding: '10px', borderRadius: '4px', border: '1px solid #eee' }}>
                                  <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#0056b3' }}>
                                      Vis alle {activity.occurrences.length} events i serien
                                  </summary>
                                  <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                                      {activity.occurrences.map((occ, idx) => (
                                          <li key={idx} style={{ padding: '3px 0' }}>
                                              {occ.date} <span style={{ color: '#666' }}>({occ.startTime} - {occ.endTime})</span>
                                          </li>
                                      ))}
                                  </ul>
                              </details>
                          )}
                      </div>
                  )}
               </div>
               <div style={{ marginLeft: '15px' }}>
                  <button onClick={() => handleDelete(activity.id)} style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                     Slet
                  </button>
               </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ActivitiesList;
