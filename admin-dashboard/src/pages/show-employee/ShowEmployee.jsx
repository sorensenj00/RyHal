import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employees } from '../../data/DummyData';
import EmployeeSearchBar from '../../components/search/EmployeeSearchBar';
import QualificationBox from '../../components/employee/qualifications/QualificationBox';
import EmployeeShiftList from '../../components/employee/EmployeeShiftList';
import defaultAvatar from '../../Assets/images/default-avatar.png';
import './ShowEmployee.css';

const ShowEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    let foundEmployee;

    if (id) {
      // 1. Find medarbejder ud fra ID i URL
      foundEmployee = employees.find(emp => emp.id === parseInt(id));
    }

    // 2. Hvis intet ID (eller forkert ID), vælg en tilfældig
    if (!foundEmployee && employees.length > 0) {
      const randomIndex = Math.floor(Math.random() * employees.length);
      foundEmployee = employees[randomIndex];
      // Vi navigerer til det korrekte ID for at holde URL synkroniseret
      navigate(`/employee/${foundEmployee.id}`, { replace: true });
    }

    if (foundEmployee) {
      setSelectedEmployee(foundEmployee);
    }
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedEmployee(prev => ({ ...prev, [name]: value }));
  };

  const handleEmployeeChange = (emp) => {
    if (emp) navigate(`/employee/${emp.id}`);
  };

  if (!selectedEmployee) return null;

  return (
    <div className="show-employee-page">
      <header className="page-header">
        <div className="header-text">
          <h1>Medarbejderprofil</h1>
          <p>Dashboard for {selectedEmployee.firstName} {selectedEmployee.lastName}</p>
        </div>
        <div className="header-search">
          <EmployeeSearchBar onSelect={handleEmployeeChange} />
        </div>
      </header>

      <div className="employee-profile-container">
        {/* SIDEBAR */}
        <aside className="profile-sidebar">
          <div className="profile-card">
            <img src={selectedEmployee.image || defaultAvatar} alt="Profil" className="profile-picture" />
            <h2 className="profile-name">{selectedEmployee.firstName} {selectedEmployee.lastName}</h2>
            <div className="profile-role-tag">{selectedEmployee.role}</div>
          </div>

          <div className="contact-info-card">
            <h3>Kontaktinformation</h3>
            <div className="info-item">
              <label>Email</label>
              <input 
                type="email" 
                name="email" 
                className="edit-input" 
                value={selectedEmployee.email} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="info-item">
              <label>Telefon</label>
              <input 
                type="text" 
                name="phone" 
                className="edit-input" 
                value={selectedEmployee.phone || ''} 
                onChange={handleInputChange} 
                placeholder="Indtast telefon..." 
              />
            </div>
            <div className="info-item">
              <label>Status</label>
              <div className={`status-indicator ${selectedEmployee.isOver18 ? 'over18' : 'under18'}`}>
                {selectedEmployee.isOver18 ? 'Over 18 år' : 'Under 18 år'}
              </div>
            </div>
            <button className="save-profile-btn" onClick={() => console.log("Gemmer:", selectedEmployee)}>
              Gem ændringer
            </button>
          </div>
        </aside>

        {/* MIDTER KOLONNE: Kompetencer */}
        <main className="profile-main">
          <div className="details-section qualifications-main">
            <h3>Kompetencer & Certifikater</h3>
            <QualificationBox qualifications={selectedEmployee.qualifications} />
          </div>
        </main>

        {/* HØJRE KOLONNE: Vagter */}
        <aside className="profile-shifts-aside">
          <div className="details-section">
            <EmployeeShiftList employeeId={selectedEmployee.id} />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ShowEmployee;
