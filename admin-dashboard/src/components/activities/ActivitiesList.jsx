import React, { useState, useEffect } from 'react';
import { getActivities } from './ActivityService';

const ActivitiesList = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // Hent in-memory aktiviteter når komponenten loader
    setActivities(getActivities());
  }, []);

  return (
    <div className="activities-list-container" style={{ padding: '20px' }}>
      <h1>Aktivitets oversigt</h1>
      <p>Her kan du se alle oprettede aktiviteter.</p>
      
      {activities.length === 0 ? (
        <p>Ingen aktiviteter fundet.</p>
      ) : (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {activities.map(activity => (
            <li key={activity.id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '15px', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
              <h3 style={{ marginTop: '0' }}>{activity.title}</h3>
              <p style={{ margin: '5px 0' }}><strong>Beskrivelse:</strong> {activity.description}</p>
              <p style={{ margin: '5px 0' }}><strong>Dato:</strong> {activity.date}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ActivitiesList;
