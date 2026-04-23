import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axiosConfig';
import AllContactsTable from '../../components/contacts/AllContactsTable';
import './ViewContacts.css';

const pickValue = (obj, ...keys) => {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) {
      return obj[key];
    }
  }
  return null;
};

const ViewContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [contactsError, setContactsError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleDeleteContact = async (contactId, contactName) => {
    try {
      await api.delete(`/contacts/${contactId}`);
      setContacts((previous) =>
        previous.filter((contact) => Number(pickValue(contact, 'contactId', 'ContactId')) !== Number(contactId))
      );
      setContactsError('');
    } catch (error) {
      console.error('Kunne ikke slette kontakt:', error);
      const apiMessage = error?.response?.data?.message;
      const apiDetails = error?.response?.data?.details;
      setContactsError(
        apiMessage
        || apiDetails
        || `Kunne ikke slette kontakten ${contactName}. Prøv igen.`
      );
      throw error;
    }
  };

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoadingContacts(true);
        setContactsError('');
        const response = await api.get('/contacts');
        setContacts(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Kunne ikke hente kontakter:', error);
        setContacts([]);
        setContactsError('Kunne ikke hente kontakter fra serveren.');
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchContacts();
  }, []);

  const filteredContacts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return contacts;
    }

    return contacts.filter((contact) => {
      const haystack = [
        pickValue(contact, 'name', 'Name'),
        pickValue(contact, 'title', 'Title'),
        pickValue(contact, 'phone', 'Phone'),
        pickValue(contact, 'email', 'Email')
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [contacts, searchTerm]);

  return (
    <div className="view-contacts-page">
      <header className="view-contacts-header">
        <div>
          <h1>Alle Kontakter</h1>
          <p>Se og administrer alle kontaktpersoner.</p>
        </div>

        <div className="view-contacts-count">{contacts.length} kontakter</div>
      </header>

      <div className="view-contacts-search-wrap">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Søg efter navn, titel, telefon eller email..."
          className="view-contacts-search-input"
        />
        {searchTerm && (
          <button
            type="button"
            className="view-contacts-search-clear"
            onClick={() => setSearchTerm('')}
          >
            Ryd
          </button>
        )}
      </div>

      <div className="view-contacts-content">
        <AllContactsTable
          contacts={filteredContacts}
          loading={loadingContacts}
          error={contactsError}
          onDeleteContact={handleDeleteContact}
        />
      </div>
    </div>
  );
};

export default ViewContacts;