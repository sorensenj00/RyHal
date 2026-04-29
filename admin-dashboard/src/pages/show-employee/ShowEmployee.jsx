import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import EmployeeSearchBar from '../../components/search/EmployeeSearchBar';
import EmployeeProfileCard from '../../components/employee/EmployeeProfileCard';
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isShiftPanelOpen, setIsShiftPanelOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

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

  const handleRoleChange = (roleName) => {
    const nextRole = roleName || 'Ingen rolle';

    setSelectedEmployee(prev => {
      if (!prev) return prev;

      if ((prev.role || 'Ingen rolle') === nextRole) {
        return prev;
      }

      return {
        ...prev,
        role: nextRole
      };
    });
  };

  const handleSaveChanges = async () => {
    if (!selectedEmployee?.employeeId) return;

    try {
      setIsSaving(true);
      setSaveMessage(null);

      await api.put(`/employees/${selectedEmployee.employeeId}`, {
        email: selectedEmployee.email,
        phone: selectedEmployee.phone
      });

      await api.put(`/employees/${selectedEmployee.employeeId}/role`, {
        roleName: selectedEmployee.role !== 'Ingen rolle' ? selectedEmployee.role : ''
      });

      setEmployees(prevEmployees => prevEmployees.map(emp => (
        emp.employeeId === selectedEmployee.employeeId
          ? {
              ...emp,
              email: selectedEmployee.email,
              phone: selectedEmployee.phone,
              role: selectedEmployee.role || 'Ingen rolle'
            }
          : emp
      )));

      setSaveMessage({ type: 'success', text: 'Ændringer gemt.' });
    } catch (err) {
      console.error('Fejl ved gem af medarbejder:', err?.response?.data || err);
      setSaveMessage({ type: 'error', text: 'Kunne ikke gemme ændringer.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenHoursOverview = () => {
    if (!selectedEmployee?.employeeId) return;
    navigate(`/employee-hours?employeeId=${selectedEmployee.employeeId}`);
  };

  const handleToggleShiftPanel = () => {
    setIsShiftPanelOpen(prev => !prev);
  };

  const handleCloseShiftPanel = () => {
    setIsShiftPanelOpen(false);
  };

  const openDeleteConfirm = () => {
    if (!selectedEmployee) return;
    setPendingDelete(selectedEmployee);
    setSaveMessage(null);
  };

  const closeDeleteConfirm = () => {
    if (isDeleting) return;
    setPendingDelete(null);
  };

  const handleDeleteEmployee = async () => {
    if (!pendingDelete?.employeeId) return;

    try {
      setIsDeleting(true);
      await api.delete(`/employees/${pendingDelete.employeeId}`);
      setPendingDelete(null);
      setSaveMessage({ type: 'success', text: 'Medarbejder blev slettet.' });
      navigate('/employees');
    } catch (err) {
      console.error('Fejl ved sletning af medarbejder:', err?.response?.data || err);
      setSaveMessage({ type: 'error', text: 'Kunne ikke slette medarbejderen.' });
    } finally {
      setIsDeleting(false);
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
          <label className="search-label">Skift medarbejder</label>
          <EmployeeSearchBar onSelect={handleEmployeeChange} />
        </div>
      </header>

      <div className="employee-profile-container">
        {/* SIDEBAR */}
        <aside className="profile-sidebar">
          <EmployeeProfileCard
            employee={selectedEmployee}
            onRoleChange={handleRoleChange}
            onContactChange={handleInputChange}
          />
        </aside>

        {/* MIDTER KOLONNE: Kompetencer */}
        <main className="profile-main">
          <div className="details-section qualifications-main">
            <h3>Kompetencer & Certifikater</h3>
            <QualificationBox qualifications={selectedEmployee.qualifications} />
          </div>
        </main>

      </div>

      {/* BUTTON ROW */}
      <footer className="employee-actions-footer">
        <div className="button-row">
          <div className="button-row-left">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={isDeleting}
              onClick={handleToggleShiftPanel}
            >
              Se vagter i periode
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              disabled={isDeleting}
              onClick={handleOpenHoursOverview}
            >
              Se timeoversigt
            </button>
          </div>
          <div className="button-row-right">
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleSaveChanges} 
              disabled={isSaving || isDeleting}
            >
              {isSaving ? 'Gemmer...' : 'Gem ændringer'}
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={openDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Sletter...' : 'Slet medarbejder'}
            </button>
          </div>
        </div>
        {saveMessage && (
          <p className={`save-status ${saveMessage.type}`}>{saveMessage.text}</p>
        )}
      </footer>

      {pendingDelete && (
        <div className="delete-modal-overlay" onClick={closeDeleteConfirm}>
          <div
            className="delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-modal-title">Slet medarbejder?</h3>
            <p>
              Er du sikker på, at du vil slette <strong>{pendingDelete.firstName} {pendingDelete.lastName}</strong>?<br />
              Denne handling kan ikke fortrydes.
            </p>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeDeleteConfirm}
                disabled={isDeleting}
              >
                Annuller
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteEmployee}
                disabled={isDeleting}
              >
                {isDeleting ? 'Sletter...' : 'Ja, slet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isShiftPanelOpen && (
        <div className="shift-panel-overlay" onClick={handleCloseShiftPanel}>
          <aside
            className="shift-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shift-panel-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shift-panel-header">
              <h3 id="shift-panel-title">Vagter i periode</h3>
              <button
                type="button"
                className="shift-panel-close"
                onClick={handleCloseShiftPanel}
                aria-label="Luk vagtpanel"
              >
                Luk
              </button>
            </div>
            <div className="shift-panel-body">
              <EmployeeShiftList employeeId={selectedEmployee.employeeId} />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default ShowEmployee;
