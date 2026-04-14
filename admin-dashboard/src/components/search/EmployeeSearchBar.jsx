import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import { employees } from '../../data/DummyData';
import defaultAvatar from '../../Assets/images/default-avatar.png';
import './EmployeeSearchBar.css';

const EmployeeSearchBar = ({ onEmployeeSelect, placeholder = "Søg medarbejder..." }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (emp) => {
    setSearchTerm(''); 
    setShowResults(false);
    if (onEmployeeSelect) {
      onEmployeeSelect(emp);
    }
  };

  return (
    <div className="employee-search-container" ref={searchRef}>
      <div className="search-input-wrapper">
        <FontAwesomeIcon icon={faSearch} className="search-icon" />
        <input
          type="text"
          className="search-field"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
        />
        {searchTerm && (
          <button className="clear-btn" onClick={() => setSearchTerm('')} type="button">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}
      </div>

      {showResults && searchTerm.length > 0 && (
        <div className="search-results-dropdown">
          {filteredEmployees.length > 0 ? (
            filteredEmployees.map(emp => (
              <div 
                key={emp.id} 
                className="search-result-item" 
                onClick={() => handleSelect(emp)}
              >
                <img 
                  src={emp.image || defaultAvatar} 
                  alt={emp.name} 
                  className="result-avatar" 
                />
                <div className="result-info">
                  <span className="result-name">{emp.name}</span>
                  <span className="result-role">{emp.role}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">Ingen medarbejdere fundet</div>
          )}
        </div>
      )}
    </div>
  );
};


export default EmployeeSearchBar;