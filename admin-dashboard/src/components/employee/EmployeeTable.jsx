import React from 'react';
import { useNavigate } from 'react-router-dom';
import './EmployeeTable.css';
import defaultAvatar from '../../Assets/images/default-avatar.png';
import { employees as defaultEmployees } from '../../data/DummyData';

const EmployeeTable = ({ employees = defaultEmployees }) => {
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

  return (
    <div className="employee-table-card">
      <div className="table-header-info">
        <h3>Alle Medarbejdere</h3>
        <span className="count-badge">{employees.length} i alt</span>
      </div>
      
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
              const roleColor = roleColorMap[employee.role] || roleColorMap['Andet'];
              
              return (
                <tr key={employee.id}>
                  {/* BRUGER INFO CELL */}
                  <td className="user-cell">
                    <img src={employee.image || defaultAvatar} alt="avatar" className="employee-avatar" />
                    <div className="user-info">
                      <span className="user-name">{employee.firstName} {employee.lastName}</span>
                      <span className="user-id">ID: #{employee.id}</span>
                    </div>
                  </td>

                  {/* KONTAKT CELL */}
                  <td>
                    <div className="contact-cell">
                      <span className="user-email">{employee.email}</span>
                      <span className="user-phone">{employee.phone || 'Intet nummer'}</span>
                    </div>
                  </td>

                  {/* ROLLE BADGE (Bruger samme farve-logik som grafen) */}
                  <td>
                    <span 
                      className="role-badge" 
                      style={{ 
                        backgroundColor: `${roleColor}26`, 
                        color: roleColor 
                      }}
                    >
                      {employee.role}
                    </span>
                  </td>

                  {/* HANDLINGER */}
                  <td className="text-right">
                    <div className="action-buttons">
                      <button 
                        className="btn-action edit"
                        onClick={() => navigate(`/employee/${employee.id}`)}
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
