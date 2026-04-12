import React, { useState } from 'react';
import './EditShift.css'; // Importér din nye CSS

const EditShift = ({ shift }) => {
  const [shiftData, setShiftData] = useState({
    date: shift.date,
    startHour: shift.startHour,
    endHour: shift.endHour,
    employeeId: shift.employeeId
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShiftData({ ...shiftData, [name]: value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    console.log("Gemmer ændringer:", shift.id, shiftData);
  };

  return (
    <div className="edit-shift-container">
      <h3>Rediger Vagt</h3>
      <span className="employee-id-label">ID: {shift.id} | Medarbejder: {shift.employeeId}</span>
      
      <form onSubmit={handleSave} className="edit-shift-form">
        <div className="form-group">
          <label>Dato</label>
          <input type="date" name="date" value={shiftData.date} onChange={handleChange} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Start (time)</label>
            <input type="number" name="startHour" min="0" max="23" value={shiftData.startHour} onChange={handleChange} />
          </div>
          
          <div className="form-group">
            <label>Slut (time)</label>
            <input type="number" name="endHour" min="0" max="23" value={shiftData.endHour} onChange={handleChange} />
          </div>
        </div>

        <button type="submit" className="save-button">Gem ændringer</button>
      </form>
    </div>
  );
};

export default EditShift;
