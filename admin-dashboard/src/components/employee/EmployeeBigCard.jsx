import React from 'react';
import { Mail, Phone, MapPin, Calendar } from 'lucide-react';
import './EmployeeBigCard.css';

/**
 * EmployeeBigCard Component
 * A reusable card template for displaying employee information
 * 
 * Props:
 *  - id: string - Employee ID
 *  - name: string - Employee full name
 *  - title: string - Job title
 *  - department: string - Department name
 *  - email: string - Email address
 *  - phone: string - Phone number
 *  - avatar: string - URL to profile image
 */

const dummyEmployee = {
  id : '12345',
  name : 'John Doe',
  title : 'Job Title',
  department : 'Department',
  email : 'john.doe@example.com',
  phone : '+1 (555) 123-4567',
  avatar : 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
};

export default function EmployeeBigCard(employee) {
  const {
    id,
    name,
    title,
    department,
    email,
    phone,
    avatar,
  } = employee || dummyEmployee; // Fallback til dummy data hvis ingen props er gitt

  return (
    <div className="employee-big-card">
      <div className="card-header">
        <div className="avatar-container">
          <img src={avatar} alt={employee.name} className="avatar" />
        </div>
        <div className="header-info">
          <h2 className="employee-name">{name}</h2>
          <p className="employee-title">{title}</p>
          <span className="employee-department">{department}</span>
        </div>
      </div>

      <div className="card-body">
        <div className="contact-info">
          <div className="contact-item">
            <Mail size={16} className="contact-icon" />
            <a href={`mailto:${email}`} className="contact-value">
              {email}
            </a>
          </div>
          <div className="contact-item">
            <Phone size={16} className="contact-icon" />
            <a href={`tel:${phone}`} className="contact-value">
              {phone}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
