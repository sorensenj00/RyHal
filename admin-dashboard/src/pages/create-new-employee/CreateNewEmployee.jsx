import React, { useState } from 'react';
import api from '../../api/axiosConfig'; // Din Axios instans
import { useNavigate } from 'react-router-dom'; // Til at sende brugeren tilbage til oversigten

const CreateNewEmployee = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    birthDate: '', // Vi omdøber 'age' til birthDate for klarhed
    appAccess: 'employee',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Vi sender dataen i det format, som din C# DTO forventer
      // Bemærk: Vi sender fødselsdatoen direkte, så kan backenden selv beregne alder/isOver18
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        birthDate: formData.birthDate,
        appAccess: formData.appAccess
      };

      // POST kald til din Controller: [HttpPost] i EmployeesController
      await api.post('/employees', payload);
      
      console.log("Medarbejder oprettet succesfuldt!");
      
      // Naviger tilbage til oversigten så man kan se den nye medarbejder i tabellen
      navigate('/employees'); 

    } catch (err) {
      console.error("Fejl ved oprettelse:", err);
      setError(
        err.response?.data?.message
        || err.response?.data?.Message
        || err.response?.data
        || "Der skete en fejl ved gem af medarbejder."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', border: '1px solid #eee', borderRadius: '10px', backgroundColor: '#fff' }}>
      <h2>Opret ny medarbejder</h2>
      
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            name="firstName" 
            placeholder="Fornavn" 
            value={formData.firstName} 
            onChange={handleChange} 
            required 
            style={{ flex: 1, padding: '8px' }} 
          />
          <input 
            name="lastName" 
            placeholder="Efternavn" 
            value={formData.lastName} 
            onChange={handleChange} 
            required 
            style={{ flex: 1, padding: '8px' }} 
          />
        </div>
        
        <input 
          name="phone" 
          placeholder="Telefon" 
          value={formData.phone} 
          onChange={handleChange} 
          style={{ padding: '8px' }} 
        />
        
        <input 
          name="email" 
          type="email" 
          placeholder="E-mail" 
          value={formData.email} 
          onChange={handleChange} 
          required 
          style={{ padding: '8px' }} 
        />
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Fødselsdato:</label>
          <input 
            name="birthDate" 
            type="date" 
            value={formData.birthDate} 
            onChange={handleChange} 
            required 
            style={{ width: '100%', padding: '8px' }} 
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>App-adgang:</label>
          <select
            name="appAccess"
            value={formData.appAccess}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px' }}
          >
            <option value="employee">Medarbejder</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '12px', 
            backgroundColor: loading ? '#ccc' : '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Gemmer...' : 'Gem Medarbejder'}
        </button>
      </form>
    </div>
  );
};

export default CreateNewEmployee;
