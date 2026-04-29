import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import api from '../../api/axiosConfig'; // Bruges kun hvis du ikke sender listen som prop
import './EmployeeSearchBar.css';

const ROLE_CSS_VARS = {
  'Hal Mand':        '--color-hal-mand',
  'Hal Dreng':       '--color-hal-dreng',
  'Cafemedarbejder': '--color-cafemedarbejder',
  'Administration':  '--color-administration',
  'Rengøring':       '--color-rengoering',
  'Opvasker':        '--color-opvasker',
};

const getRoleStyle = (roleName) => {
  const varName = ROLE_CSS_VARS[roleName] ?? '--color-andet';
  return {
    background: `var(${varName})`,
    color: '#ffffff',
  };
};

const EmployeeSearchBar = ({ onSelect, initialEmployeeId }) => {
  const [employees, setEmployees] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const listRef = useRef(null);

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

  // Reset activeIndex when dropdown opens or search changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [searchTerm, showDropdown]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('.dropdown-item:not(.empty)');
      items[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // 3. Filtreringslogik rettet til de nye database-attributter
  const filteredEmployees = employees.filter(emp => {
    const search = searchTerm.toLowerCase();
    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
    // Vi kigger på den første rolle i arrayet
    const role = emp.roles?.[0]?.name?.toLowerCase() || '';
    return fullName.includes(search) || role.includes(search);
  });

  const handleKeyDown = (e) => {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, filteredEmployees.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < filteredEmployees.length) {
        handleSelect(filteredEmployees[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

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
          onKeyDown={handleKeyDown}
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
            ref={listRef}
          >
            <div className="dropdown-item empty" onClick={() => handleSelect(null)}>
              <em>Vælg ingen (Ledig vagt)</em>
            </div>

            {filteredEmployees.map((emp, index) => {
              const roleName = emp.roles?.[0]?.name || 'Ingen rolle';
              return (
                <div
                  key={emp.employeeId}
                  className={`dropdown-item${activeIndex === index ? ' active' : ''}`}
                  onClick={() => handleSelect(emp)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <div className="emp-info">
                    <span className="emp-name">{emp.firstName} {emp.lastName}</span>
                    <span
                      className="emp-role"
                      style={getRoleStyle(roleName)}
                    >
                      {roleName}
                    </span>
                  </div>
                </div>
              );
            })}

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
