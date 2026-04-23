import React from 'react';
import './ContactInformationCard.css';

const pickValue = (obj, ...keys) => {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) {
      return obj[key];
    }
  }
  return null;
};

const ContactInformationCard = ({ contact }) => {
  if (!contact) {
    return (
      <div className="contact-info-card">
        <p>Ingen kontakt data tilgængelig.</p>
      </div>
    );
  }

  const name = pickValue(contact, 'name', 'Name') || 'Ukendt';
  const title = pickValue(contact, 'title', 'Title');
  const email = pickValue(contact, 'email', 'Email');
  const phone = pickValue(contact, 'phone', 'Phone');
  const profileImageUrl = pickValue(contact, 'profileImageUrl', 'ProfileImageUrl');

  return (
    <div className="contact-info-card">
      <div className="contact-info-header">
        {profileImageUrl && (
          <img
            src={profileImageUrl}
            alt={`${name} profilbillede`}
            className="contact-profile-image"
          />
        )}
        <div className="contact-name-section">
          <h2>{name}</h2>
          {title && <p className="contact-title">{title}</p>}
        </div>
      </div>

      <div className="contact-info-details">
        {email && (
          <div className="contact-info-item">
            <strong>Email:</strong>
            <a href={`mailto:${email}`}>{email}</a>
          </div>
        )}
        {phone && (
          <div className="contact-info-item">
            <strong>Telefon:</strong>
            <a href={`tel:${phone}`}>{phone}</a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactInformationCard;