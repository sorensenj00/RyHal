import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import api from '../../api/axiosConfig';
import EmployeeSearchBar from '../../components/search/EmployeeSearchBar';
import { notifyError, notifySuccess } from '../toast/toastBus';
import './CreateNewShift.css';

const CreateNewShift = ({ initialDate, onRefresh }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    categoryId: '',
    date: '',
    startTime: '08:00',
    endTime: '16:00',
    employeeId: null,
    isRecurring: false,
    endDate: ''
  });

  useEffect(() => {
    if (isOpen) {
      const fetchCategories = async () => {
        try {
          const response = await api.get('/shifts/categories');
          setCategories(response.data);
        } catch (err) {
          console.error("Fejl:", err);
        }
      };
      fetchCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialDate && isOpen) {
      setFormData(prev => ({ ...prev, date: format(initialDate, 'yyyy-MM-dd') }));
    }
  }, [initialDate, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmployeeSelect = (emp) => {
    setFormData(prev => ({ ...prev, employeeId: emp ? emp.employeeId : null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (!formData.date || !formData.categoryId) {
        throw new Error('Vælg dato og kategori før du opretter vagten.');
      }

      // FIX: Send som lokal streng
      const startLocal = `${formData.date}T${formData.startTime}:00`;
      const endLocal = `${formData.date}T${formData.endTime}:00`;

      if (new Date(endLocal) <= new Date(startLocal)) {
        throw new Error('Sluttid skal være efter starttid.');
      }

      const newShift = {
        categoryId: Number(formData.categoryId),
        employeeId: formData.employeeId ? Number(formData.employeeId) : null,
        startTime: startLocal,
        endTime: endLocal,
        isRecurring: formData.isRecurring,
        endDate: formData.isRecurring ? formData.endDate : null
      };

      await api.post('/shifts', newShift, { skipCrudToast: true });
      if (onRefresh) onRefresh();
      setIsOpen(false);
      setFormData({ categoryId: '', date: '', startTime: '08:00', endTime: '16:00', employeeId: null, isRecurring: false, endDate: '' });
      notifySuccess('Vagten blev oprettet.');
    } catch (err) {
      const apiMessage = err?.response?.data;
      const message =
        typeof apiMessage === 'string'
          ? apiMessage
          : apiMessage?.message || err.message || 'Kunne ikke oprette vagt';

      console.error('Fejl ved oprettelse af vagt:', err?.response?.data || err);
      notifyError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button type="button" className="btn btn-primary" onClick={() => setIsOpen(true)}>
        Opret ny vagt
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)}>
            <motion.div className="modal-content" onClick={(e) => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <div className="modal-header">
                <h2>Opret Ny Vagt</h2>
                <button className="close-btn" onClick={() => setIsOpen(false)}><FontAwesomeIcon icon={faTimes} /></button>
              </div>
              <form onSubmit={handleSubmit} className="shift-form">
                <div className="form-group">
                  <label>Kategori:</label>
                  <select name="categoryId" value={formData.categoryId} onChange={handleInputChange} required>
                    <option value="">Vælg kategori</option>
                    {categories.map(cat => <option key={cat.shiftCategoryId} value={cat.shiftCategoryId}>{cat.name}</option>)}
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
                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" name="isRecurring" checked={formData.isRecurring} onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))} />
                    Gentag ugentlig
                  </label>
                </div>
                {formData.isRecurring && (
                  <>
                    <div className="form-group">
                      <label>Slutdato:</label>
                      <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} required />
                    </div>
                  </>
                )}
                <div className="form-actions">
                  <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary cancel-btn">Annuller</button>
                  <button type="submit" className="btn btn-primary submit-btn" disabled={isSaving}>{isSaving ? 'Opretter...' : 'Opret Vagt'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CreateNewShift;
