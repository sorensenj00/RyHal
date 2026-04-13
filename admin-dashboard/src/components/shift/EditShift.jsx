import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSearch, faChevronDown, faSave } from '@fortawesome/free-solid-svg-icons';
import { employees } from '../../data/DummyData';
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Find den præcise kategori fra listen der matcher shift.category
  // Vi laver et case-insensitive match for at være på den sikre side
  const initialCategory = SHIFT_CATEGORIES.find(
    cat => cat.toLowerCase() === shift.category?.toLowerCase()
  ) || 'Andet';

  const [formData, setFormData] = useState({
    id: shift.id,
    category: initialCategory, // Her sætter vi den korrekte kategori
    date: shift.date,
    startTime: shift.startTime || (shift.startHour ? `${shift.startHour.toString().padStart(2, '0')}:00` : '08:00'),
    endTime: shift.endTime || (shift.endHour ? `${shift.endHour.toString().padStart(2, '0')}:00` : '16:00'),
    employeeId: shift.employeeId
  });


  // Håndter lukning ved klik udenfor dropdown og find oprindelig medarbejder
  useEffect(() => {
    const emp = employees.find(e => e.id === shift.employeeId);
    if (emp) setSearchTerm(emp.name);
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [shift.employeeId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectEmployee = (emp) => {
    if (emp) {
      setFormData(prev => ({ ...prev, employeeId: emp.id }));
      setSearchTerm(emp.name);
    } else {
      setFormData(prev => ({ ...prev, employeeId: '' }));
      setSearchTerm('');
    }
    setShowDropdown(false);
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = (e) => {
    e.preventDefault();
    console.log("Gemmer rettet vagt:", formData);
    // Her ville dit API kald ligge
    onClose(); // Luk modallen efter gem
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} // Forhindrer lukning når man klikker inde i boksen
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

          {/* Searchable Medarbejder Select */}
          <div className="form-group searchable-select-container" ref={dropdownRef}>
            <label>Medarbejder:</label>
            <div className="search-input-box" onClick={() => setShowDropdown(!showDropdown)}>
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input 
                type="text" 
                placeholder="Søg eller vælg..." 
                value={searchTerm} 
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }} 
              />
              <FontAwesomeIcon icon={faChevronDown} className={`chevron-icon ${showDropdown ? 'open' : ''}`} />
            </div>

            <AnimatePresence>
              {showDropdown && (
                <motion.div 
                  className="custom-dropdown-list"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                >
                  <div className="dropdown-item empty" onClick={() => selectEmployee(null)}>
                    <em>Ingen (Ledig vagt)</em>
                  </div>
                  {filteredEmployees.map(emp => (
                    <div key={emp.id} className="dropdown-item" onClick={() => selectEmployee(emp)}>
                      <span className="emp-name">{emp.name}</span>
                      <span className="emp-role">{emp.role}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
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
