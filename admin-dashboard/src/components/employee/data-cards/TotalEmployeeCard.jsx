import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faArrowUp } from '@fortawesome/free-solid-svg-icons';
import './TotalEmployeeCard.css';

const TotalEmployeeCard = ({ totalEmployees }) => {
  return (
    <div className="stat-card total-employee-card">
      <div className="stat-card-inner">
        <div className="stat-icon-wrapper">
          <FontAwesomeIcon icon={faUsers} className="stat-icon-main" />
        </div>
        
        <div className="stat-content">
          <p className="stat-label">Total Medarbejdere</p>
          <div className="stat-value-group">
            <h3 className="stat-number">{totalEmployees}</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotalEmployeeCard;
