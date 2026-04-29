import React from 'react';
import { useNavigate } from 'react-router-dom';
import './EmployeeTable.css';
import defaultAvatar from '../../Assets/images/default-avatar.png';
import { getPrimaryRole, resolveRoleColorValue } from '../../data/roleColors';

const EmployeeTable = ({ employees = [] }) => {
  const navigate = useNavigate();

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
              const primaryRole = getPrimaryRole(employee.roles);
              const roleName = primaryRole?.name || 'Ingen rolle';
              const roleColor = resolveRoleColorValue(primaryRole?.color);
              
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
                        backgroundColor: roleColor,
                        color: '#fff'
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
