import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './AllContactsTable.css';
import defaultAvatar from '../../Assets/images/default-avatar.png';

const pickValue = (obj, ...keys) => {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) {
      return obj[key];
    }
  }
  return null;
};

const AllContactsTable = ({ contacts = [], loading = false, error = '', onDeleteContact = async () => {} }) => {
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const openDeleteConfirm = (id, name) => {
    setPendingDelete({ id: Number(id) || 0, name });
  };

  const closeDeleteConfirm = () => {
    if (deletingId !== null) return;
    setPendingDelete(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    try {
      setDeletingId(pendingDelete.id);
      await onDeleteContact(pendingDelete.id, pendingDelete.name);
      setPendingDelete(null);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="contacts-table-card"><p className="contacts-table-status">Henter kontakter...</p></div>;
  }

  if (error) {
    return <div className="contacts-table-card"><p className="contacts-table-status error">{error}</p></div>;
  }

  if (contacts.length === 0) {
    return <div className="contacts-table-card"><p className="contacts-table-status">Ingen kontakter oprettet endnu.</p></div>;
  }

  return (
    <div className="contacts-table-card">
      <div className="table-scroll-container">
        <table className="contacts-table">
          <thead>
            <tr>
              <th>Navn</th>
              <th>Titel</th>
              <th>Telefon</th>
              <th>Email</th>
              <th className="text-right">Handlinger</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => {
              const contactId = Number(pickValue(contact, 'contactId', 'ContactId')) || 0;
              const name = pickValue(contact, 'name', 'Name') || 'Ukendt';
              const title = pickValue(contact, 'title', 'Title');
              const phone = pickValue(contact, 'phone', 'Phone');
              const email = pickValue(contact, 'email', 'Email');
              const profileImageUrl = pickValue(contact, 'profileImageUrl', 'ProfileImageUrl');

              return (
                <tr key={contactId}>
                  <td className="user-cell">
                    <img
                      src={profileImageUrl || defaultAvatar}
                      alt="avatar"
                      className="contact-avatar"
                    />
                    <div className="user-info">
                      <span className="user-name">{name}</span>
                    </div>
                  </td>

                  <td>
                    <span className="contact-title">{title || '-'}</span>
                  </td>

                  <td>
                    <span className="contact-phone">{phone || '-'}</span>
                  </td>

                  <td>
                    <span className="contact-email">{email || '-'}</span>
                  </td>

                  <td className="text-right">
                    <div className="action-buttons">
                      <Link to={`/view-contact/${contactId}`} className="btn-action view">
                        Se
                      </Link>
                      <button
                        className="btn-action delete"
                        onClick={() => openDeleteConfirm(contactId, name)}
                        disabled={deletingId === contactId}
                      >
                        {deletingId === contactId ? 'Sletter...' : 'Slet'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pendingDelete && (
        <div className="delete-modal-overlay" onClick={closeDeleteConfirm}>
          <div
            className="delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-contact-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-contact-modal-title">Slet kontakt?</h3>
            <p>
              Er du sikker på, at du vil slette <strong>{pendingDelete.name}</strong>?<br />
              Denne handling kan ikke fortrydes.
            </p>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="btn-action"
                onClick={closeDeleteConfirm}
                disabled={deletingId !== null}
              >
                Annuller
              </button>
              <button
                type="button"
                className="btn-action delete"
                onClick={confirmDelete}
                disabled={deletingId !== null}
              >
                {deletingId !== null ? 'Sletter...' : 'Ja, slet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllContactsTable;