import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { employees } from '../../data/DummyData';
import './EmployeeSearchBar.css'; // Husk at importere din CSS her!

const EmployeeSearchBar = ({ onSelect, initialEmployeeId }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Synkroniser inputfeltet hvis initialEmployeeId ændrer sig (f.eks. når man åbner EditShift)
  useEffect(() => {
    if (initialEmployeeId) {
      const emp = employees.find(e => e.id === initialEmployeeId);
      if (emp) {
        setSearchTerm(`${emp.firstName} ${emp.lastName}`);
      }
    } else {
      setSearchTerm('');
    }
  }, [initialEmployeeId]);

  // Luk dropdown når man klikker udenfor komponenten
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtreringslogik baseret på de nye attributter (firstName, lastName, role)
  const filteredEmployees = employees.filter(emp => {
    const search = searchTerm.toLowerCase();
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const role = emp.role.toLowerCase();
    return fullName.includes(search) || role.includes(search);
  });

  const handleSelect = (emp) => {
    if (emp) {
      setSearchTerm(`${emp.firstName} ${emp.lastName}`);
      onSelect(emp); 
    } else {
      setSearchTerm('');
      onSelect(null);
    }
    setShowDropdown(false);
  };

  return (
    <div className="searchable-select-container" ref={dropdownRef}>
      <div className="search-input-box">
        <FontAwesomeIcon icon={faSearch} className="search-icon" />
        <input 
          type="text" 
          placeholder="Søg efter medarbejder..." 
          value={searchTerm} 
          onFocus={() => setShowDropdown(true)}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }} 
        />
        <FontAwesomeIcon 
          icon={faChevronDown} 
          className={`chevron-icon ${showDropdown ? 'open' : ''}`} 
          onClick={() => setShowDropdown(!showDropdown)}
        />
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div 
            className="custom-dropdown-list"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {/* Mulighed for at nulstille/vælge ledig vagt */}
            <div className="dropdown-item empty" onClick={() => handleSelect(null)}>
              <em>vælg ingen</em>
            </div>

            {filteredEmployees.map(emp => (
              <div key={emp.id} className="dropdown-item" onClick={() => handleSelect(emp)}>
                <span className="emp-name">{emp.firstName} {emp.lastName}</span>
                <span className="emp-role">{emp.role}</span>
              </div>
            ))}

            {filteredEmployees.length === 0 && searchTerm !== '' && (
              <div className="dropdown-item empty">Ingen resultater fundet</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployeeSearchBar;
