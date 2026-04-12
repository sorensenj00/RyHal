import React from 'react';
import './RoleDistributionEmployeeCard.css';

const RoleDistributionEmployeeCard = ({ employees }) => {
  const roleCounts = employees.reduce((acc, employee) => {
    acc[employee.role] = (acc[employee.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="role-distribution-card">
      <h3>Role Distribution</h3>
      <div className="role-list">
        {Object.entries(roleCounts).map(([role, count]) => (
          <div key={role} className="role-item">
            <span className="role-name">{role}</span>
            <span className="role-count">{count}</span>
            <div className="role-bar">
              <div
                className="role-bar-fill"
                style={{ width: `${(count / employees.length) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoleDistributionEmployeeCard;
