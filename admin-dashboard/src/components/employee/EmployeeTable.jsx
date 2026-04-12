import React from 'react';
import './EmployeeTable.css';
import defaultAvatar from '../../Assets/images/default-avatar.png';
import { employees as defaultEmployees } from '../../data/DummyData';

const EmployeeTable = ({ employees = defaultEmployees }) => {

  return (
    <div className="employee-table-container">
      <div className="table-wrapper">
        <table className="employee-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(employee => (
              <tr key={employee.id}>
                <td>
                  <img 
                    src={employee.image || defaultAvatar} 
                    alt={`${employee.name} avatar`} 
                    className="employee-avatar"
                  />
                </td>
                <td>{employee.id}</td>
                <td>{employee.name}</td>
                <td>{employee.email}</td>
                <td>{employee.phone}</td>
                <td>{employee.role}</td>
                <td>
                  <button className="btn btn-sm btn-secondary">Edit</button>
                  <button className="btn btn-sm btn-danger">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeTable;
