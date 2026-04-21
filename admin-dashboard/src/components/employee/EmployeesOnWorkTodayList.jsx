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

// Hjælpekomponent til visning af den enkelte vagt-slot
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

function EmptyShiftItem() {
  return (
    <div className="brief-employee-info">
      <div className="image-wrapper image-wrapper-empty">
        <span className="empty-shift-icon">?</span>
      </div>
      <span className="brief-employee-name">Mangler medarbejder</span>
    </div>
  );
}

function UnknownEmployeeItem() {
  return (
    <div className="brief-employee-info">
      <div className="image-wrapper image-wrapper-unknown">
        <span className="empty-shift-icon">!</span>
      </div>
      <span className="brief-employee-name">Ukendt medarbejder</span>
    </div>
  );
}

const EmployeesOnWorkTodayList = ({ targetDate = new Date() }) => {
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const employeesById = employees.reduce((acc, emp) => {
    const employeeKey = emp.employeeId ?? emp.id ?? emp.EmployeeId;
    if (employeeKey !== undefined && employeeKey !== null) {
      acc[String(employeeKey)] = emp;
    }
    return acc;
  }, {});

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

  // Brug kategori-data direkte fra dagens vagter (ikke employee.roles)
  const categoryMetaByName = dayShifts.reduce((acc, shift) => {
    const roleName = shift.categoryName || 'Andet';
    if (!acc[roleName]) {
      acc[roleName] = shift.categoryColor || ROLE_COLORS[roleName] || ROLE_COLORS.default;
    }
    return acc;
  }, {});

  const employeeRoleColorById = dayShifts.reduce((acc, shift) => {
    const shiftEmployeeId = shift.employeeId ?? shift.EmployeeId;
    if (!shiftEmployeeId || acc[shiftEmployeeId]) return acc;

    const roleName = shift.categoryName || 'Andet';
    acc[shiftEmployeeId] = categoryMetaByName[roleName] || ROLE_COLORS.default;
    return acc;
  }, {});

  const shiftSlots = dayShifts.map((shift) => {
    const categoryName = shift.categoryName || 'Andet';
    const shiftEmployeeId = shift.employeeId ?? shift.EmployeeId;
    const employee = shiftEmployeeId ? employeesById[String(shiftEmployeeId)] : null;

    return {
      shiftId: shift.shiftId,
      categoryName,
      categoryColor: categoryMetaByName[categoryName] || ROLE_COLORS.default,
      shiftEmployeeId,
      employee
    };
  });

  // Tæl statistikker baseret på shift categories for den valgte dag
  const roleStats = dayShifts.reduce((acc, shift) => {
    const role = shift.categoryName || 'Andet';

    if (!acc[role]) {
      acc[role] = {
        count: 0,
        color: categoryMetaByName[role] || ROLE_COLORS.default
      };
    }

    acc[role].count += 1;
    return acc;
  }, {});

  return (
    <div className="on-duty-container">
      {/* Prik-oversigt */}
      <div className="role-dot-legend">
        {Object.entries(roleStats).map(([role, stat]) => (
          <div key={role} className="role-dot-badge">
            <span 
              className="stat-dot" 
              style={{ backgroundColor: stat.color }}
            ></span>
            <span className="stat-count">{stat.count}</span>
            <span className="role-label">{role}</span>
          </div>
        ))}
      </div>

      <div className="on-duty-card">
        {shiftSlots.length > 0 ? (
          <div className="on-duty-list">
            {shiftSlots.map((slot, index) => {
              if (!slot.shiftEmployeeId) {
                return (
                  <EmptyShiftItem
                    key={`empty-${slot.shiftId || index}`}
                  />
                );
              }

              if (!slot.employee) {
                return (
                  <UnknownEmployeeItem
                    key={`unknown-${slot.shiftId || index}`}
                  />
                );
              }

              return (
                <EmployeeBriefItem
                  key={`slot-${slot.shiftId || `${slot.shiftEmployeeId}-${index}`}`}
                  employee={slot.employee}
                  roleColor={slot.categoryColor || employeeRoleColorById[slot.shiftEmployeeId] || ROLE_COLORS.default}
                />
              );
            })}
          </div>
          ) : (
            <p className="no-shifts-text">Ingen på arbejde i dag</p>
          )}
        
      </div>
    </div>
  );
};

export default EmployeesOnWorkTodayList;
  