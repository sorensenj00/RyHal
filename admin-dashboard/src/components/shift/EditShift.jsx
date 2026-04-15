import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave } from '@fortawesome/free-solid-svg-icons';
import EmployeeSearchBar from '../../components/search/EmployeeSearchBar';
import './EditShift.css';

// Kategorier baseret på din UML ENUM
const SHIFT_CATEGORIES = [
  'Hal dreng',
  'Hal mand',
  'Rengøring',
  'Cafemedarbejder',
  'Administration',
  'Opvasker',
  'Andet'
];

const EditShift = ({ shift, onClose }) => {
  // Find den præcise kategori fra listen der matcher shift.category
  const initialCategory = SHIFT_CATEGORIES.find(
    cat => cat.toLowerCase() === shift.category?.toLowerCase()
  ) || 'Andet';

  const [formData, setFormData] = useState({
    id: shift.id,
    category: initialCategory,
    date: shift.date,
    startTime: shift.startTime || (shift.startHour ? `${shift.startHour.toString().padStart(2, '0')}:00` : '08:00'),
    endTime: shift.endTime || (shift.endHour ? `${shift.endHour.toString().padStart(2, '0')}:00` : '16:00'),
    employeeId: shift.employeeId
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Denne funktion modtager den valgte medarbejder fra din EmployeeSearchBar
  const handleEmployeeSelect = (emp) => {
    setFormData(prev => ({ 
      ...prev, 
      employeeId: emp ? emp.id : '' 
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    console.log("Gemmer rettet vagt:", formData);
    // Her kaldes din backend/Supabase funktion senere
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="modal-header">
          <h2>Rediger Vagt (ID: {shift.id})</h2>
          <button className="close-btn" onClick={onClose} title="Luk">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <form onSubmit={handleSave} className="shift-form">
          {/* Kategori */}
          <div className="form-group">
            <label>Kategori:</label>
            <select 
              name="category" 
              value={formData.category} 
              onChange={handleInputChange} 
              required
            >
              {SHIFT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Dato */}
          <div className="form-group">
            <label>Dato:</label>
            <input 
              type="date" 
              name="date" 
              value={formData.date} 
              onChange={handleInputChange} 
              required 
            />
          </div>

          {/* Tider */}
          <div className="form-row">
            <div className="form-group">
              <label>Starttid:</label>
              <input 
                type="time" 
                name="startTime" 
                value={formData.startTime} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Sluttid:</label>
              <input 
                type="time" 
                name="endTime" 
                value={formData.endTime} 
                onChange={handleInputChange} 
                required 
              />
            </div>
          </div>

          {/* Medarbejder Søgning via din genanvendelige komponent */}
          <div className="form-group">
            <label>Medarbejder:</label>
            <EmployeeSearchBar 
              onSelect={handleEmployeeSelect} 
              initialEmployeeId={formData.employeeId} 
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Annuller
            </button>
            <button type="submit" className="submit-btn">
              <FontAwesomeIcon icon={faSave} /> Gem ændringer
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditShift;
