import React from 'react';
import './EmployeeCardForCalendar.css';

const EmployeeCardForCalendar = ({ employee }) => {
  const initials = employee.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2); // Sikrer max 2 bogstaver

  const roleClass = `role-${employee.role.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`employee-card-calendar ${roleClass}`}>
      <div className="employee-avatar">{initials}</div>
      <div className="employee-details">
        <div className="employee-name">{employee.name}</div>
        <div className="employee-role">{employee.role}</div>
      </div>
    </div>
  );
};

export default EmployeeCardForCalendar;
