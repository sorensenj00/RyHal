import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCakeCandles } from '@fortawesome/free-solid-svg-icons';
import api from '../../api/axiosConfig'; // Din nye Axios instans
import EmployeeTable from '../../components/employee/EmployeeTable';
import TotalEmployeeCard from '../../components/employee/data-cards/TotalEmployeeCard';
import RoleDistributionGraph from '../../components/employee/data-cards/RoleDistributionGraph';
import EmployeeRoleShiftHoursGraph from '../../components/statistics/employee/EmployeeRoleShiftHoursGraph';
import UpcomingBirthdaysWidget from '../../components/statistics/employee/UpcomingBirthdaysWidget';
import './EmployeeListOverview.css';

const EmployeeListOverview = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

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

  useEffect(() => {
    if (!toast) return undefined;

    const timeoutId = setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => clearTimeout(timeoutId);
  }, [toast]);

  const handleDeleteEmployee = async (employeeId, fullName) => {
    try {
      await api.delete(`/employees/${employeeId}`);
      setEmployees(prev => prev.filter(employee => employee.employeeId !== employeeId));
      setToast({
        type: 'success',
        title: 'Medarbejder slettet',
        message: `${fullName} blev slettet.`
      });
    } catch (err) {
      console.error('Fejl ved sletning af medarbejder:', err);

      const status = err?.response?.status;
      const apiMessage = err?.response?.data?.message || err?.response?.data?.Message;
      const apiDetails = err?.response?.data?.details || err?.response?.data?.Details;
      let message = 'Kunne ikke slette medarbejderen. Prøv igen.';

      if (status === 404) {
        message = 'Medarbejderen findes ikke længere.';
      } else if (status === 409) {
        message = apiMessage || apiDetails || 'Medarbejderen kan ikke slettes, fordi der stadig er relaterede data.';
      }

      setToast({
        type: 'error',
        title: 'Sletning mislykkedes',
        message
      });
    }
  };

  if (loading) return <div className="p-3">Henter data fra serveren...</div>;
  if (error) return <div className="p-3 text-danger">{error}</div>;

  return (
    <div className="employee-list-overview">
      {toast && (
        <div className={`employee-toast employee-toast-${toast.type}`} role="status" aria-live="polite">
          <div className="employee-toast-content">
            <strong className="employee-toast-title">{toast.title}</strong>
            <span className="employee-toast-message">{toast.message}</span>
          </div>
          <button
            type="button"
            className="employee-toast-close"
            onClick={() => setToast(null)}
            aria-label="Luk besked"
          >
            ×
          </button>
          <div className="employee-toast-progress" aria-hidden="true" />
        </div>
      )}

      <div className="overview-header">
        <h1>Medarbejder Oversigt</h1>
      </div>

      <div className="stats-parent-grid">
        <div className="div1">
          <TotalEmployeeCard totalEmployees={employees.length} />
        </div>

        <div className="div2">
          <div className="stat-card stat-card-warning">
            <div className="stat-card-inner">
              <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <FontAwesomeIcon icon={faCakeCandles} className="stat-icon-main" />
              </div>
              <div className="stat-content">
                <p className="stat-label">Kommende fødselsdage</p>
                <div className="stat-value-group">
                  <h3 className="stat-number">
                    {employees.filter((e) => {
                      if (!e.birthday) return false;
                      const today = new Date(); today.setHours(0,0,0,0);
                      const bday = new Date(e.birthday);
                      let next = new Date(bday); next.setFullYear(today.getFullYear());
                      if (next < today) next.setFullYear(today.getFullYear() + 1);
                      const diff = Math.round((next - today) / 86400000);
                      return diff <= 30;
                    }).length}
                  </h3>
                </div>
                <small className="stat-sublabel">inden for 30 dage</small>
              </div>
            </div>
          </div>
        </div>

        <div className="div3">
          <RoleDistributionGraph
            employees={employees}
            distributionSource="employee-roles"
          />
        </div>

        <div className="div4">
          <div className="div4-inner">
            <EmployeeRoleShiftHoursGraph />
          </div>
        </div>
      </div>

      <div className="table-section">
        <div className="table-wrapper">
          <EmployeeTable employees={employees} onDeleteEmployee={handleDeleteEmployee} />
        </div>
      </div>
    </div>
  );
};

export default EmployeeListOverview;
