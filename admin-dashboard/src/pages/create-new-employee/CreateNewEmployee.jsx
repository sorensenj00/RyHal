import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import './CreateNewEmployee.css';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  birthDate: '',
  appAccess: 'employee',
};

const CreateNewEmployee = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdEmployee, setCreatedEmployee] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        birthDate: formData.birthDate,
        appAccess: formData.appAccess,
      };

      const response = await api.post('/employees', payload);
      setCreatedEmployee(response.data);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.Message ||
        (typeof err.response?.data === 'string' ? err.response.data : null) ||
        'Der skete en fejl ved oprettelse af medarbejder.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnother = () => {
    setCreatedEmployee(null);
    setError(null);
    setFormData(EMPTY_FORM);
  };

  if (createdEmployee) {
    return (
      <div className="create-employee-page">
        <header className="create-employee-page-header">
          <h1>Opret medarbejder</h1>
          <p>Ny medarbejder er blevet oprettet i systemet.</p>
        </header>

        <div className="create-employee-card">
          <div className="create-employee-success-state">
            <div className="create-employee-success-icon" aria-hidden="true">✓</div>
            <h2>
              {createdEmployee.firstName} {createdEmployee.lastName} er oprettet
            </h2>
            <p className="create-employee-success-sub">
              Medarbejderen har fået adgang som{' '}
              <strong>
                {createdEmployee.appAccess === 'admin' ? 'administrator' : 'medarbejder'}
              </strong>
              {createdEmployee.supabaseUserId && ' og er tilknyttet Supabase-kontoen'}.
            </p>

            <div className="create-employee-success-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate(`/employees/${createdEmployee.employeeId}`)}
              >
                Se medarbejder
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCreateAnother}
              >
                Opret en til
              </button>
              <button
                type="button"
                className="btn btn-light"
                onClick={() => navigate('/employees')}
              >
                Gå til oversigten
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-employee-page">
      <header className="create-employee-header-fixed">
        <div className="create-employee-header-inner">
          <h1>Opret medarbejder</h1>
        </div>
      </header>

      <div className="create-employee-body">
        <div className="create-employee-card">
          <div className="create-employee-card-header">
            <h2>Medarbejderoplysninger</h2>
            <p>Alle felter markeret med * er påkrævede.</p>
          </div>

          {error && (
            <div className="create-employee-feedback error" role="alert">
              {error}
            </div>
          )}

          <form id="create-employee-form" className="create-employee-form" onSubmit={handleSubmit} noValidate>
            <div className="create-employee-row">
              <label htmlFor="ce-firstName">
                Fornavn *
                <input
                  id="ce-firstName"
                  name="firstName"
                  type="text"
                  placeholder="Fx. Anders"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  autoComplete="given-name"
                />
              </label>
              <label htmlFor="ce-lastName">
                Efternavn *
                <input
                  id="ce-lastName"
                  name="lastName"
                  type="text"
                  placeholder="Fx. Hansen"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  autoComplete="family-name"
                />
              </label>
            </div>

            <label htmlFor="ce-email">
              E-mailadresse *
              <input
                id="ce-email"
                name="email"
                type="email"
                placeholder="Fx. anders@sportcenter.dk"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </label>

            <label htmlFor="ce-phone">
              Telefonnummer
              <input
                id="ce-phone"
                name="phone"
                type="tel"
                placeholder="Fx. 12 34 56 78"
                value={formData.phone}
                onChange={handleChange}
                autoComplete="tel"
              />
            </label>

            <label htmlFor="ce-birthDate">
              Fødselsdato *
              <input
                id="ce-birthDate"
                name="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={handleChange}
                required
              />
            </label>

            <label htmlFor="ce-appAccess">
              App-adgang *
              <select
                id="ce-appAccess"
                name="appAccess"
                value={formData.appAccess}
                onChange={handleChange}
              >
                <option value="employee">Medarbejder</option>
                <option value="admin">Administrator</option>
              </select>
              <span className="create-employee-field-hint">
                Administrator-adgang giver fuld adgang til admin-dashboardet.
              </span>
            </label>
          </form>
        </div>
      </div>

      <footer className="create-employee-button-bar">
        <div className="create-employee-button-bar-inner">
          <button
            type="submit"
            form="create-employee-form"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Opretter…' : 'Opret medarbejder'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/employees')}
            disabled={loading}
          >
            Annuller
          </button>
        </div>
      </footer>
    </div>
  );
};

export default CreateNewEmployee;
