import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave, faTrash } from '@fortawesome/free-solid-svg-icons';
import { format, parseISO } from 'date-fns';
import api from '../../api/axiosConfig';
import EmployeeSearchBar from '../../components/search/EmployeeSearchBar';
import './EditShift.css';

const EditShift = ({ shift, onClose, onRefresh }) => {
  const [categories, setCategories] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const shiftDate = typeof shift.startTime === 'string' ? parseISO(shift.startTime) : new Date(shift.startTime);
  const shiftEndDate = typeof shift.endTime === 'string' ? parseISO(shift.endTime) : new Date(shift.endTime);

  const [formData, setFormData] = useState({
    shiftId: shift.shiftId,
    categoryId: shift.categoryId, 
    date: format(shiftDate, 'yyyy-MM-dd'),
    startTime: format(shiftDate, 'HH:mm'),
    endTime: format(shiftEndDate, 'HH:mm'),
    employeeId: shift.employeeId || null
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/shifts/categories');
        setCategories(response.data);
      } catch (err) {
        console.error("Kunne ikke hente kategorier:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmployeeSelect = (emp) => {
    setFormData(prev => ({ ...prev, employeeId: emp ? emp.employeeId : null }));
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/shifts/${shift.shiftId}`);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      console.error("Fejl ved sletning:", err);
      alert("Kunne ikke slette vagt");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // FIX: Send som lokal streng uden tidszone-konvertering
      const startLocal = `${formData.date}T${formData.startTime}:00`;
      const endLocal = `${formData.date}T${formData.endTime}:00`;

      const updatedShift = {
        ShiftId: Number(formData.shiftId),
        CategoryId: Number(formData.categoryId),
        EmployeeId: formData.employeeId ? Number(formData.employeeId) : null,
        StartTime: startLocal,
        EndTime: endLocal
      };

      await api.put(`/shifts/UpdateShift/${formData.shiftId}`, updatedShift);
      if (onRefresh) onRefresh(); 
      onClose();
    } catch (err) {
      console.error("Fejl ved gem:", err.response?.data);
      alert("Fejl ved gem: " + JSON.stringify(err.response?.data?.errors || "Kunne ikke gemme"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div className="modal-content" onClick={(e) => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div className="modal-header">
          <h2>Rediger Vagt (ID: {shift.shiftId})</h2>
          <button className="close-btn" onClick={onClose}><FontAwesomeIcon icon={faTimes} /></button>
        </div>

        <form onSubmit={handleSave} className="shift-form">
          <div className="form-group">
            <label>Kategori:</label>
            <select name="categoryId" value={formData.categoryId} onChange={handleInputChange} required>
              {categories.map(cat => (
                <option key={cat.shiftCategoryId} value={cat.shiftCategoryId}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Dato:</label>
            <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Starttid:</label>
              <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Sluttid:</label>
              <input type="time" name="endTime" value={formData.endTime} onChange={handleInputChange} required />
            </div>
          </div>

          <div className="form-group">
            <label>Medarbejder:</label>
            <EmployeeSearchBar onSelect={handleEmployeeSelect} initialEmployeeId={formData.employeeId} />
          </div>

          <div className="form-actions edit-actions">
            <button type="button" onClick={handleDelete} className="delete-btn" title="Slet vagt">
              <FontAwesomeIcon icon={faTrash} /> Slet
            </button>
            <div className="right-actions">
              <button type="button" onClick={onClose} className="cancel-btn">Annuller</button>
              <button type="submit" className="submit-btn" disabled={isSaving}>
                <FontAwesomeIcon icon={faSave} /> {isSaving ? 'Gemmer...' : 'Gem ændringer'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditShift;
