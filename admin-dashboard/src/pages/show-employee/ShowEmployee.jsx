import React, { useState } from 'react';
import { employees } from '../../data/DummyData';
import EmployeeSearchBar from '../../components/search/EmployeeSearchBar';
import defaultAvatar from '../../Assets/images/default-avatar.png';
import './ShowEmployee.css';

const ShowEmployee = () => {
  // RETTELSE: Vi starter med det første objekt i listen [0] i stedet for hele arrayet
  const [selectedEmployee, setSelectedEmployee] = useState(employees[0]);

  const handleEmployeeChange = (emp) => {
    if (emp) {
      setSelectedEmployee(emp);
    }
  };

  // Safety check: Hvis der slet ingen medarbejder er valgt, vis en besked i stedet for at crashe
  if (!selectedEmployee) {
    return <div className="show-employee-page">Vælg en medarbejder for at se profilen.</div>;
  }

  return (
    <div className="show-employee-page">
      <header className="page-header">
        <div className="header-text">
          <h1>Medarbejderprofil</h1>
          <p>Søg og se detaljer for ansatte</p>
        </div>
        <div className="header-search">
          { <EmployeeSearchBar onEmployeeSelect={handleEmployeeChange} /> }
        </div>
      </header>

      <div className="employee-profile-container">
        <aside className="profile-sidebar">
          <div className="profile-card">
            <img 
              src={selectedEmployee.image || defaultAvatar} 
              alt={selectedEmployee.name || 'Medarbejder'} 
              className="profile-picture" 
            />
            <h2 className="profile-name">{selectedEmployee.name}</h2>
            <span className={`status-badge ${(selectedEmployee.status || 'inactive').toLowerCase()}`}>
              {selectedEmployee.status || 'Status ukendt'}
            </span>
            <div className="profile-role-tag">{selectedEmployee.role}</div>
          </div>

          <div className="contact-info-card">
            <h3>Kontaktinformation</h3>
            <div className="info-item">
              <label>Email</label>
              <span>{selectedEmployee.email}</span>
            </div>
            <div className="info-item">
              <label>Telefon</label>
              <span>{selectedEmployee.phone || 'Ikke oplyst'}</span>
            </div>
          </div>
        </aside>

        <main className="profile-main">
          <div className="details-section">
            <h3>Arbejdsopgaver & Statistik</h3>
            <div className="stats-grid">
              <div className="stat-box">
                <span className="stat-value">24</span>
                <span className="stat-label">Vagter i denne måned</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">{selectedEmployee.role}</span>
                <span className="stat-label">Primær Rolle</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ShowEmployee;