import React from 'react';
import { useNavigate } from 'react-router-dom';
import './EmployeeTable.css';
import defaultAvatar from '../../Assets/images/default-avatar.png';

const EmployeeTable = ({ employees = [] }) => {
  const navigate = useNavigate();
  
  const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  const roleColorMap = {
    'Hal Mand': getVar('--color-hal-mand') || '#B8BB0B',
    'Hal Dreng': getVar('--color-hal-dreng') || '#D4D700',
    'Cafemedarbejder': getVar('--color-cafemedarbejder') || '#22C55E',
    'Administration': getVar('--color-administration') || '#F59E0B',
    'Rengøring': getVar('--color-rengoering') || '#7C3AED',
    'Opvasker': getVar('--color-opvasker') || '#06B6D4',
    'Andet': getVar('--color-andet') || '#94A3B8'
  };

  // Hjælpefunktion til at håndtere List<Role> fra C#
  const getPrimaryRole = (roles) => {
    if (!roles || roles.length === 0) return 'Ingen rolle';
    // Vi tager den første rolle i listen (eller du kan lave logik for 'vigtigste' rolle)
    return roles[0].name; 
  };

  return (
    <div className="employee-table-card">
      <div className="table-scroll-container">
        <table className="employee-table">
          <thead>
            <tr>
              <th>Medarbejder</th>
              <th>Kontakt</th>
              <th>Rolle</th>
              <th className="text-right">Handlinger</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(employee => {
              // Bemærk: JSON fra C# bruger små bogstaver (camelCase) som standard
              const id = employee.employeeId;
              const roleName = getPrimaryRole(employee.roles);
              const roleColor = roleColorMap[roleName] || roleColorMap['Andet'];
              
              return (
                <tr key={id}>
                  <td className="user-cell">
                    <img 
                      src={employee.profileImageURL || defaultAvatar} 
                      alt="avatar" 
                      className="employee-avatar" 
                    />
                    <div className="user-info">
                      <span className="user-name">
                        {employee.firstName} {employee.lastName}
                      </span>
                    </div>
                  </td>

                  <td>
                    <div className="contact-cell">
                      <span className="user-email">{employee.email}</span>
                      <span className="user-phone">{employee.phone || 'Intet nummer'}</span>
                    </div>
                  </td>

                  <td>
                    <span 
                      className="role-badge" 
                      style={{ 
                        backgroundColor: `${roleColor}26`, 
                        color: roleColor 
                      }}
                    >
                      {roleName}
                    </span>
                  </td>

                  <td className="text-right">
                    <div className="action-buttons">
                      <button 
                        className="btn-action edit"
                        onClick={() => navigate(`/employee/${id}`)}
                      >
                        Rediger
                      </button>
                      <button className="btn-action delete">Slet</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeTable;
