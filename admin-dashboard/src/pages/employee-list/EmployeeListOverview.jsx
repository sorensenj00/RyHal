import React from 'react';
import EmployeeTable from '../../components/employee/EmployeeTable';
import TotalEmployeeCard from '../../components/employee/data-cards/TotalEmployeeCard';
import RoleDistributionGraph from '../../components/employee/data-cards/RoleDistributionGraph';
import { employees } from '../../data/DummyData';
import './EmployeeListOverview.css';

const EmployeeListOverview = () => {
  const totalEmployees = employees.length;

  return (
    <div className="employee-list-overview">
      <div className="overview-header">
        <h1>Medarbejder Oversigt</h1>
      </div>

      {/* Grid Layout Sektion */}
      <div className="stats-parent-grid">
        {/* div1: Lille kort øverst til veanstre */}
        <div className="div1">
          <TotalEmployeeCard totalEmployees={totalEmployees} />
        </div>

        {/* div2: Lille kort under div1 */}
        <div className="div2">
          <div className="placeholder-card">
            <div className="stat-content">
              <p>Mere data følger...</p>
            </div>
          </div>
        </div>

        {/* div3: Stor graf ved siden af de små kort (fylder 2 rækker) */}
        <div className="div3">
          <RoleDistributionGraph employees={employees} />
        </div>

        {/* div4: Ekstra plads til fremtidig data (fylder 2 rækker) */}
        <div className="div4">
          <div className="placeholder-card">
            <div className="stat-content text-center">
              <p>Mere data følger...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Sektion nedenunder */}
      <div className="table-section">
        <div className="table-wrapper">
          <EmployeeTable employees={employees} />
        </div>
      </div>
    </div>
  );
};

export default EmployeeListOverview;
