import React from 'react';
import './TotalEmployeeCard.css';

const TotalEmployeeCard = ({ totalEmployees }) => {
  return (
    <div className="total-employee-card stat-card stat-card-primary">
      <div className="stat-icon">
        👥
      </div>
      <div className="stat-content">
        <h3 className="stat-value">{totalEmployees}</h3>
        <p className="stat-title">Total Employees</p>
      </div>
    </div>
  );
};

export default TotalEmployeeCard;
