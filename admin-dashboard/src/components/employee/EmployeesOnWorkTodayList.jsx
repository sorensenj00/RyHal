import React, { useState, useEffect } from 'react';
import { isSameDay, parseISO } from 'date-fns';
import api from '../../api/axiosConfig'; // Sikr dig at stien matcher din opsætning
import defaultAvatar from '../../Assets/images/default-avatar.png';
import './EmployeesOnWorkTodayList.css';

const ROLE_COLORS = {
  'Hal Mand': '#B8BB0B',
  'Cafemedarbejder': '#22C55E',
  'Administration': '#F59E0B',
  'Rengøring': '#7C3AED',
  'default': '#94a3b8'
};

// Hjælpekomponent til visning af den enkelte medarbejder
function EmployeeBriefItem({ employee, roleColor }) {
  return (
    <div className="brief-employee-info">
      <div className="image-wrapper" style={{ borderColor: roleColor }}>
        <img 
          src={employee.image || defaultAvatar} 
          alt={employee.firstName} 
          className="brief-employee-image" 
        />
      </div>
      <span className="brief-employee-name">{employee.firstName} {employee.lastName}</span>
    </div>
  );
}

const EmployeesOnWorkTodayList = ({ targetDate = new Date() }) => {
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Hent både medarbejdere og vagter samtidigt
        const [empRes, shiftRes] = await Promise.all([
          api.get('/employees'),
          api.get('/shifts')
        ]);
        
        setEmployees(empRes.data);
        setShifts(shiftRes.data);
      } catch (err) {
        console.error("Fejl ved hentning af data til overblik:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) return <div className="on-duty-container">Henter overblik...</div>;

  // Filtrer vagter for den valgte dag (håndterer ISO-strenge fra DB)
  const dayShifts = shifts.filter(shift => {
    const shiftDate = typeof shift.startTime === 'string' ? parseISO(shift.startTime) : new Date(shift.startTime);
    return isSameDay(shiftDate, targetDate);
  });

  // Find unikke medarbejdere der har en vagt i dag
  // Vi mapper til selve medarbejderobjektet med det samme
  const employeesOnDuty = employees.filter(emp => 
    dayShifts.some(shift => shift.employeeId === emp.employeeId)
  );

  // Tæl statistikker baseret på roller
  const roleStats = employeesOnDuty.reduce((acc, emp) => {
    const role = emp.roles?.[0]?.name || "Andet"; // Tilpas hvis din DB struktur er anderledes
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="on-duty-container">
      {/* Prik-oversigt */}
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
          {employeesOnDuty.length > 0 ? (
            employeesOnDuty.map(emp => (
              <EmployeeBriefItem 
                key={emp.employeeId} 
                employee={emp} 
                roleColor={ROLE_COLORS[emp.roles?.[0]?.name] || ROLE_COLORS.default}
              />
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
  