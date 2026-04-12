import React from 'react';
import EmployeeTable from '../../components/employee/EmployeeTable';
import TotalEmployeeCard from '../../components/employee/data-cards/TotalEmployeeCard';
import RoleDistributionEmployeeCard from '../../components/employee/data-cards/RoleDistributionEmployeeCard';
import { employees } from '../../data/DummyData';
import './Employee-list-overview.css';

const EmployeeListOverview = () => {

  const totalEmployees = employees.length;

  return (
    <div className="employee-list-overview">
      <div className="overview-header">
        <h1>Employee Overview</h1>
        <button className="btn btn-primary">Add New Employee</button>
      </div>

      <div className="stats-grid">
        <TotalEmployeeCard totalEmployees={totalEmployees} />
        <RoleDistributionEmployeeCard employees={employees} />
      </div>

      <div className="table-section">
        <div className="table-wrapper">
          <EmployeeTable employees={employees} />
        </div>
      </div>
    </div>
  );
};

export default EmployeeListOverview;
