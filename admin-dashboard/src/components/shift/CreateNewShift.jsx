import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPlus } from '@fortawesome/free-solid-svg-icons';
import EmployeeSearchBar from '../../components/search/EmployeeSearchBar'; // Import af søgekomponent
import './CreateNewShift.css';

const SHIFT_CATEGORIES = [
  'Hal dreng',
  'Hal mand',
  'Rengøring',
  'Cafemedarbejder',
  'Administration',
  'Opvasker',
  'Andet'
];  

const CreateNewShift = ({ initialDate }) => {
  const [isOpen, setIsOpen] = useState(false);

  const [formData, setFormData] = useState({
    category: '',
    date: '',
    startTime: '',
    endTime: '',
    employeeId: ''
  });

  // Opdater dato når modallen åbnes
  useEffect(() => {
    if (initialDate && isOpen) {
      const formattedDate = format(initialDate, 'yyyy-MM-dd');
      setFormData(prev => ({ ...prev, date: formattedDate }));
    }
  }, [initialDate, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Håndterer valg fra EmployeeSearchBar
  const handleEmployeeSelect = (emp) => {
    setFormData(prev => ({ 
      ...prev, 
      employeeId: emp ? emp.id : '' 
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Shift gemt:', formData);
    // Her kaldes din backend/Supabase funktion
    setIsOpen(false);
    // Nulstil formen efter gem hvis nødvendigt
    setFormData({ category: '', date: '', startTime: '', endTime: '', employeeId: '' });
  };

  return (
    <>
      <button className="create-shift-btn" onClick={() => setIsOpen(true)}>
        <FontAwesomeIcon icon={faPlus} /> Opret ny vagt
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)}>
            <motion.div className="modal-content" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Opret Ny Vagt</h2>
                <button className="close-btn" onClick={() => setIsOpen(false)}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="shift-form">
                <div className="form-group">
                  <label>Kategori:</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} required>
                    <option value="">Vælg kategori</option>
                    {SHIFT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Dato:</label>
                  <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Starttid:</label>
                    <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Sluttid:</label>
                    <input type="time" name="endTime" value={formData.endTime} onChange={handleInputChange} required />
                  </div>
                </div>

                {/* Genanvendelig Søgekomponent */}
                <div className="form-group">
                  <label>Medarbejder:</label>
                  <EmployeeSearchBar 
                    onSelect={handleEmployeeSelect} 
                    initialEmployeeId={formData.employeeId} 
                  />
                </div>

                <div className="form-actions">
                  <button type="button" onClick={() => setIsOpen(false)} className="cancel-btn">Annuller</button>
                  <button type="submit" className="submit-btn">Opret Vagt</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CreateNewShift;
