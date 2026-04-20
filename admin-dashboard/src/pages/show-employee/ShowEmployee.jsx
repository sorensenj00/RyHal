import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import EmployeeSearchBar from '../../components/search/EmployeeSearchBar';
import QualificationBox from '../../components/employee/qualifications/QualificationBox';
import EmployeeShiftList from '../../components/employee/EmployeeShiftList';
import defaultAvatar from '../../Assets/images/default-avatar.png';
import './ShowEmployee.css';

const ShowEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  const calculateIsOver18 = (birthday) => {
    if (!birthday) return null;

    const birthDate = new Date(birthday);
    if (Number.isNaN(birthDate.getTime())) return null;

    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    return age >= 18;
  };

  const normalizeEmployee = (emp) => {
    const primaryRole = emp.roles?.[0]?.name || 'Ingen rolle';

    return {
      ...emp,
      role: primaryRole,
      image: emp.profileImageURL || defaultAvatar,
      qualifications: emp.qualifications || [],
      isOver18: calculateIsOver18(emp.birthday)
    };
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await api.get('/employees');
        const normalized = (response.data || []).map(normalizeEmployee);
        setEmployees(normalized);
        setError(null);
      } catch (err) {
        console.error('Kunne ikke hente medarbejdere:', err);
        setError('Kunne ikke hente medarbejderdata.');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    if (!employees.length) {
      setSelectedEmployee(null);
      return;
    }

    let foundEmployee;
    const parsedId = id ? Number.parseInt(id, 10) : null;

    if (parsedId) {
      // 1. Find medarbejder ud fra ID i URL
      foundEmployee = employees.find(emp => emp.employeeId === parsedId);
    }

    // 2. Hvis intet ID (eller forkert ID), vælg en tilfældig
    if (!foundEmployee && employees.length > 0) {
      const randomIndex = Math.floor(Math.random() * employees.length);
      foundEmployee = employees[randomIndex];
      // Vi navigerer til det korrekte ID for at holde URL synkroniseret
      navigate(`/employee/${foundEmployee.employeeId}`, { replace: true });
    }

    if (foundEmployee) {
      setSelectedEmployee(foundEmployee);
    }
  }, [id, employees, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedEmployee(prev => ({ ...prev, [name]: value }));
  };

  const handleEmployeeChange = (emp) => {
    if (emp) navigate(`/employee/${emp.employeeId}`);
  };

  const handleSaveChanges = async () => {
    if (!selectedEmployee?.employeeId) return;

    try {
      setIsSaving(true);
      setSaveMessage(null);

      await api.put(`/employees/${selectedEmployee.employeeId}`, {
        email: selectedEmployee.email || null,
        phone: selectedEmployee.phone || null
      });

      setSaveMessage({ type: 'success', text: 'Ændringer gemt.' });
    } catch (err) {
      console.error('Fejl ved gem af medarbejder:', err);
      setSaveMessage({ type: 'error', text: 'Kunne ikke gemme ændringer.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="show-employee-page">Henter medarbejderprofil...</div>;
  if (error) return <div className="show-employee-page">{error}</div>;
  if (!selectedEmployee) return <div className="show-employee-page">Ingen medarbejder fundet.</div>;

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
              {selectedEmployee.isOver18 === null ? (
                <div className="status-indicator">Ukendt</div>
              ) : (
                <div className={`status-indicator ${selectedEmployee.isOver18 ? 'over18' : 'under18'}`}>
                  {selectedEmployee.isOver18 ? 'Over 18 år' : 'Under 18 år'}
                </div>
              )}
            </div>
            <button className="save-profile-btn" onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? 'Gemmer...' : 'Gem ændringer'}
            </button>
            {saveMessage && (
              <p className={`save-status ${saveMessage.type}`}>{saveMessage.text}</p>
            )}
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
            <EmployeeShiftList employeeId={selectedEmployee.employeeId} />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ShowEmployee;
