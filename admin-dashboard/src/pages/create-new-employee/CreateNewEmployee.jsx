import React, { useState } from 'react';

const CreateNewEmployee = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    age: '', // Gemmes som YYYY-MM-DD fra input
  });

  const [qualifications, setQualifications] = useState([]);
  const [newQual, setNewQual] = useState({ name: '', description: '' });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [employees, setEmployees] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddQualification = () => {
    if (newQual.name) {
      setQualifications([...qualifications, newQual]);
      setNewQual({ name: '', description: '' });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Beregn om personen er over 18
    const birthDate = new Date(formData.age);
    const today = new Date();
    let ageDiff = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      ageDiff--;
    }

    const newEmployee = {
      id: employees.length + 1,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      email: formData.email,
      age: formData.age + "T00:00:00", // Formatere til din DateTime streng
      isOver18: ageDiff >= 18,
      qualifications: qualifications,
      image_url: previewUrl 
    };

    setEmployees([...employees, newEmployee]);
    console.log("Gemmer komplet medarbejder:", newEmployee);

    // Nulstil alt
    setFormData({ firstName: '', lastName: '', phone: '', email: '', age: '' });
    setQualifications([]);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', border: '1px solid #eee', borderRadius: '10px' }}>
      <h2>Opret ny medarbejder</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input name="firstName" placeholder="Fornavn" value={formData.firstName} onChange={handleChange} required style={{ flex: 1 }} />
          <input name="lastName" placeholder="Efternavn" value={formData.lastName} onChange={handleChange} required style={{ flex: 1 }} />
        </div>
        
        <input name="phone" placeholder="Telefon" value={formData.phone} onChange={handleChange} />
        <input name="email" type="email" placeholder="E-mail" value={formData.email} onChange={handleChange} required />
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Fødselsdato:</label>
          <input name="age" type="date" value={formData.age} onChange={handleChange} required style={{ width: '100%' }} />
        </div>

        <div style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
          <h4>Tilføj Kvalifikationer</h4>
          <input 
            placeholder="Navn (f.eks. Førstehjælp)" 
            value={newQual.name} 
            onChange={(e) => setNewQual({...newQual, name: e.target.value})} 
            style={{ width: '100%', marginBottom: '5px' }}
          />
          <textarea 
            placeholder="Kort beskrivelse" 
            value={newQual.description} 
            onChange={(e) => setNewQual({...newQual, description: e.target.value})}
            style={{ width: '100%', marginBottom: '5px' }}
          />
          <button type="button" onClick={handleAddQualification} style={{ fontSize: '0.8em' }}>Tilføj til liste</button>
          
          <ul style={{ fontSize: '0.9em', marginTop: '10px' }}>
            {qualifications.map((q, i) => <li key={i}>{q.name}</li>)}
          </ul>
        </div>

        <div>
          <label>Profilbillede:</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>

        {previewUrl && (
          <img src={previewUrl} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%' }} />
        )}

        <button type="submit" style={{ padding: '12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Gem Medarbejder
        </button>
      </form>
    </div>
  );
};

export default CreateNewEmployee;
