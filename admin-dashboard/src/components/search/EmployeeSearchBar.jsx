import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import api from '../../api/axiosConfig'; // Bruges kun hvis du ikke sender listen som prop
import './EmployeeSearchBar.css';

const EmployeeSearchBar = ({ onSelect, initialEmployeeId }) => {
  const [employees, setEmployees] = useState([]); // Nu henter vi fra DB
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // 1. Hent medarbejdere fra databasen når komponenten mounter
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await api.get('/employees');
        setEmployees(response.data);
      } catch (err) {
        console.error("Fejl ved hentning af medarbejdere til søgefelt:", err);
      }
    };
    fetchEmployees();
  }, []);

  // 2. Synkroniser inputfeltet med initialEmployeeId fra DB
  useEffect(() => {
    if (initialEmployeeId && employees.length > 0) {
      const emp = employees.find(e => e.employeeId === initialEmployeeId);
      if (emp) {
        setSearchTerm(`${emp.firstName} ${emp.lastName}`);
      }
    } else if (!initialEmployeeId) {
      setSearchTerm('');
    }
  }, [initialEmployeeId, employees]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 3. Filtreringslogik rettet til de nye database-attributter
  const filteredEmployees = employees.filter(emp => {
    const search = searchTerm.toLowerCase();
    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
    // Vi kigger på den første rolle i arrayet
    const role = emp.roles?.[0]?.name?.toLowerCase() || '';
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
            <div className="dropdown-item empty" onClick={() => handleSelect(null)}>
              <em>Vælg ingen (Ledig vagt)</em>
            </div>

            {filteredEmployees.map(emp => (
              <div key={emp.employeeId} className="dropdown-item" onClick={() => handleSelect(emp)}>
                <div className="emp-info">
                  <span className="emp-name">{emp.firstName} {emp.lastName}</span>
                  <span className="emp-role">
                    {emp.roles?.[0]?.name || 'Ingen rolle'}
                  </span>
                </div>
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
