import React from 'react';
import EmployeeTable from '../../components/employee/EmployeeTable';
import TotalEmployeeCard from '../../components/employee/data-cards/TotalEmployeeCard';
import { employees } from '../../data/DummyData';
import './EmployeeListOverview.css';
import RoleDistributionGraph from '../../components/employee/data-cards/RoleDistributionGraph';

const EmployeeListOverview = () => {

  const totalEmployees = employees.length;

  return (
    <div className="employee-list-overview">
      <div className="overview-header">
        <h1>Employee Overview</h1>
      </div>

      <div className="stats-grid">
        <TotalEmployeeCard totalEmployees={totalEmployees} />
        <RoleDistributionGraph employees={employees} />
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
