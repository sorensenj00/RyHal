import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPlus, faSearch, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { employees } from '../../data/DummyData';
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    category: '',
    date: '',
    startTime: '',
    endTime: '',
    employeeId: ''
  });

  // Luk dropdown når man klikker udenfor
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Opdater dato når modallen åbnes
    useEffect(() => {
      if (initialDate && isOpen) {
        // Brug format fra date-fns for at sikre, at den lokale dato bevares
        const formattedDate = format(initialDate, 'yyyy-MM-dd');
        setFormData(prev => ({ ...prev, date: formattedDate }));
      }
    }, [initialDate, isOpen]);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Shift gemt:', formData);
    setIsOpen(false);
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

                {/* Dynamisk Searchable Select */}
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
                      <motion.div className="custom-dropdown-list" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
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
