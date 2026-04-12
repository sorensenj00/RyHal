import React, { useState } from 'react';

const CreateNewEmployee = () => {
  // 1. State til tekstfelter
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });

  // 2. State til billedhåndtering
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // 3. Simuleret database-liste (til test)
  const [employees, setEmployees] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Opretter en midlertidig URL så vi kan se billedet i browseren
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Skabelon for det objekt, der senere skal sendes til Supabase
    const newEmployee = {
      id: employees.length + 1, // Midlertidig ID-logik
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone: formData.phone,
      email: formData.email,
      image_url: previewUrl // Her vil den rigtige Supabase-URL ligge senere
    };

    setEmployees([...employees, newEmployee]);
    console.log("Gemmer medarbejder i 'databasen':", newEmployee);

    // Nulstil formen
    setFormData({ firstName: '', lastName: '', phone: '', email: '' });
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px' }}>
      <h2>Opret ny medarbejder</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <input name="firstName" placeholder="Fornavn" value={formData.firstName} onChange={handleChange} required />
        <input name="lastName" placeholder="Efternavn" value={formData.lastName} onChange={handleChange} required />
        <input name="phone" placeholder="Telefon" value={formData.phone} onChange={handleChange} />
        <input name="email" type="email" placeholder="E-mail" value={formData.email} onChange={handleChange} required />

        <div>
          <label>Profilbillede:</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>

        {/* Lille preview af det valgte billede */}
        {previewUrl && (
          <div style={{ marginTop: '10px' }}>
            <img src={previewUrl} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%' }} />
          </div>
        )}

        <button type="submit" style={{ padding: '10px', cursor: 'pointer' }}>
          Gem Medarbejder
        </button>
      </form>
    </div>
  );
};

export default CreateNewEmployee;
