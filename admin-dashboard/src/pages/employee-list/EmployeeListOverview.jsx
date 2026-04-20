import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig'; // Din nye Axios instans
import EmployeeTable from '../../components/employee/EmployeeTable';
import TotalEmployeeCard from '../../components/employee/data-cards/TotalEmployeeCard';
import RoleDistributionGraph from '../../components/employee/data-cards/RoleDistributionGraph';
import './EmployeeListOverview.css';

const EmployeeListOverview = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        // Kalder din C# controller: api/Employees
        const response = await api.get('/employees');
        setEmployees(response.data);
      } catch (err) {
        console.error("Fejl ved hentning af medarbejdere:", err);
        setError("Kunne ikke forbinde til systemet.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  if (loading) return <div className="p-3">Henter data fra serveren...</div>;
  if (error) return <div className="p-3 text-danger">{error}</div>;

  return (
    <div className="employee-list-overview">
      <div className="overview-header">
        <h1>Medarbejder Oversigt</h1>
      </div>

      <div className="stats-parent-grid">
        <div className="div1">
          <TotalEmployeeCard totalEmployees={employees.length} />
        </div>

        <div className="div2">
          <div className="stat-card stat-card-success">
            <div className="stat-content">
              <h3>{employees.length}</h3>
              <p>Total i systemet</p>
            </div>
          </div>
        </div>

        <div className="div3">
          <RoleDistributionGraph employees={employees} />
        </div>

        <div className="div4">
          <div className="placeholder-card">
            <div className="stat-content text-center">
              <p className="text-muted">Detaljeret statistik</p>
              <small>Hentet fra C# Service</small>
            </div>
          </div>
        </div>
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
