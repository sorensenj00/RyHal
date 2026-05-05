import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axiosConfig';
import AllContactsTable from '../../components/contacts/AllContactsTable';
import ContactsSearchBar from '../../components/search/ContactsSearchBar';
import './ViewAllContacts.css';

const pickValue = (obj, ...keys) => {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) {
      return obj[key];
    }
  }
  return null;
};

const ViewAllContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [associations, setAssociations] = useState([]);
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
        const [contactsResponse, associationsResponse] = await Promise.all([
          api.get('/contacts'),
          api.get('/associations')
        ]);

        setContacts(Array.isArray(contactsResponse.data) ? contactsResponse.data : []);
        setAssociations(Array.isArray(associationsResponse.data) ? associationsResponse.data : []);
      } catch (error) {
        console.error('Kunne ikke hente kontakter:', error);
        setContacts([]);
        setAssociations([]);
        setContactsError('Kunne ikke hente kontakter fra serveren.');
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchContacts();
  }, []);

  const contactAssociationsByContactId = useMemo(() => {
    return associations.reduce((lookup, association) => {
      const associationName = pickValue(association, 'name', 'Name');
      const associationColor = pickValue(association, 'color', 'Color') || '';
      const linkedContacts = Array.isArray(association?.contacts) ? association.contacts : [];

      linkedContacts.forEach((contact) => {
        const contactId = Number(pickValue(contact, 'contactId', 'ContactId')) || 0;
        if (!contactId || !associationName) {
          return;
        }

        if (!lookup[contactId]) {
          lookup[contactId] = [];
        }

        const alreadyAdded = lookup[contactId].some((a) => a.name === associationName);
        if (!alreadyAdded) {
          lookup[contactId].push({ name: associationName, color: associationColor });
        }
      });

      return lookup;
    }, {});
  }, [associations]);

  const filteredContacts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return contacts;
    }

    return contacts.filter((contact) => {
      const contactId = Number(pickValue(contact, 'contactId', 'ContactId')) || 0;
      const haystack = [
        pickValue(contact, 'name', 'Name'),
        pickValue(contact, 'title', 'Title'),
        pickValue(contact, 'phone', 'Phone'),
        pickValue(contact, 'email', 'Email'),
        ...(contactAssociationsByContactId[contactId] || []).map((a) => a.name)
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [contactAssociationsByContactId, contacts, searchTerm]);

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
        <ContactsSearchBar
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          inputId="view-contacts-search"
          searchLabel="Søg i kontakter"
          searchPlaceholder="Søg efter navn, titel, telefon, email eller forening"
        />
      </div>

      <div className="view-contacts-content">
        <AllContactsTable
          contacts={filteredContacts}
          contactAssociationsByContactId={contactAssociationsByContactId}
          loading={loadingContacts}
          error={contactsError}
          onDeleteContact={handleDeleteContact}
        />
      </div>
    </div>
  );
};

export default ViewAllContacts;