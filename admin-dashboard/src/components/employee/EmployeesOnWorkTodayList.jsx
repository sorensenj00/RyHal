import React from 'react';
import { isSameDay } from 'date-fns';
import { employees, shifts } from '../../data/DummyData';
import defaultAvatar from '../../Assets/images/default-avatar.png';
import './EmployeesOnWorkTodayList.css';

// Samme farver som i din kalender
const ROLE_COLORS = {
  'Hal Mand': '#B8BB0B',
  'Cafemedarbejder': '#22C55E',
  'Administration': '#F59E0B',
  'Rengøring': '#7C3AED',
  'default': '#94a3b8'
};

function EmployeeBriefItem({ employeeId }) {
  const employee = employees.find(emp => emp.id === employeeId);
  if (!employee) return null;

  const roleColor = ROLE_COLORS[employee.role] || ROLE_COLORS.default;

  return (
    <div className="brief-employee-info">
      <div className="image-wrapper" style={{ borderColor: roleColor }}>
        <img src={employee.image || defaultAvatar} alt={employee.name} className="brief-employee-image" />
      </div>
      <span className="brief-employee-name">{employee.name}</span>
    </div>
  );
}

const EmployeesOnWorkTodayList = ({ targetDate = new Date() }) => {
  const dayShifts = shifts.filter(shift => isSameDay(new Date(shift.date), targetDate));
  const uniqueEmployeeIds = [...new Set(dayShifts.map(shift => shift.employeeId))];

  // Tæl roller præcis som i BaseMonthCalendar
  const roleStats = uniqueEmployeeIds.reduce((acc, empId) => {
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      acc[emp.role] = (acc[emp.role] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="on-duty-container">
      {/* Prik-oversigt magen til BaseMonthCalendar */}
      <div className="role-dot-legend">
        {Object.entries(roleStats).map(([role, count]) => (
          <div key={role} className="role-dot-badge">
            <span 
              className="stat-dot" 
              style={{ backgroundColor: ROLE_COLORS[role] || ROLE_COLORS.default }}
            ></span>
            <span className="stat-count">{count}</span>
            <span className="role-label">{role}</span>
          </div>
        ))}
      </div>

      <div className="on-duty-card">
        <div className="on-duty-list">
          {uniqueEmployeeIds.length > 0 ? (
            uniqueEmployeeIds.map(empId => (
              <EmployeeBriefItem key={empId} employeeId={empId} />
            ))
          ) : (
            <p className="no-shifts-text">Ingen på arbejde i dag</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeesOnWorkTodayList;
