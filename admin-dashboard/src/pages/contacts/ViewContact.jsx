import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axiosConfig';
import ContactInformationCard from '../../components/contacts/ContactInformationCard';
import ContactAssociationsManager from '../../components/contacts/ContactAssociationsManager';
import ContactEventList from '../../components/contacts/ContactEventList';
import ContactsSearchBar from '../../components/search/ContactsSearchBar';
import { getAllAssociations } from '../../api/associationService';
import './ViewContact.css';

const pickValue = (obj, ...keys) => {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) {
      return obj[key];
    }
  }
  return null;
};

const ViewContact = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [allContacts, setAllContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [linkedAssociationIds, setLinkedAssociationIds] = useState([]);
  const [contactSearchTerm, setContactSearchTerm] = useState('');

  useEffect(() => {
    const fetchContact = async () => {
      try {
        setLoading(true);
        setError('');

        if (id) {
          // Hent specifik kontakt
          const response = await api.get(`/contacts/${id}`);
          setContact(response.data);
          
          // Hent associationer for at finde hvilke der er koblet til denne kontakt
          try {
            const associations = await getAllAssociations();
            const contactId = Number(pickValue(response.data, 'contactId', 'ContactId')) || 0;
            
            // Find associationer der indeholder denne kontakt
            const linked = associations
              .filter((assoc) => {
                const contacts = Array.isArray(assoc?.contacts) ? assoc.contacts : [];
                return contacts.some((c) => {
                  const cId = Number(pickValue(c, 'contactId', 'ContactId')) || 0;
                  return cId === contactId;
                });
              })
              .map((assoc) => Number(pickValue(assoc, 'associationId', 'AssociationId')) || 0)
              .filter((associationId) => associationId > 0);
            
            setLinkedAssociationIds(linked);
          } catch (assocError) {
            console.error('Kunne ikke hente associationer:', assocError);
            setLinkedAssociationIds([]);
          }
        } else {
          // Hent alle kontakter og vælg en tilfældig
          const response = await api.get('/contacts');
          const contacts = Array.isArray(response.data) ? response.data : [];
          setAllContacts(contacts);
          
          if (contacts.length > 0) {
            const randomIndex = Math.floor(Math.random() * contacts.length);
            const randomContact = contacts[randomIndex];
            setContact(randomContact);
            
            // Hent associationer for denne tilfældige kontakt
            try {
              const associations = await getAllAssociations();
              const contactId = Number(pickValue(randomContact, 'contactId', 'ContactId')) || 0;
              
              const linked = associations
                .filter((assoc) => {
                  const contacts = Array.isArray(assoc?.contacts) ? assoc.contacts : [];
                  return contacts.some((c) => {
                    const cId = Number(pickValue(c, 'contactId', 'ContactId')) || 0;
                    return cId === contactId;
                  });
                })
                .map((assoc) => Number(pickValue(assoc, 'associationId', 'AssociationId')) || 0)
                .filter((associationId) => associationId > 0);
              
              setLinkedAssociationIds(linked);
            } catch (assocError) {
              console.error('Kunne ikke hente associationer:', assocError);
              setLinkedAssociationIds([]);
            }
          } else {
            setError('Ingen kontakter fundet.');
          }
        }
      } catch (err) {
        console.error('Kunne ikke hente kontakt:', err);
        setError('Kunne ikke hente kontaktinformationer. Prøv igen.');
      } finally {
        setLoading(false);
      }
    };

    fetchContact();
  }, [id]);

  useEffect(() => {
    const fetchAllContacts = async () => {
      try {
        const response = await api.get('/contacts');
        setAllContacts(Array.isArray(response.data) ? response.data : []);
      } catch (fetchError) {
        console.error('Kunne ikke hente kontakter til søgning:', fetchError);
        setAllContacts([]);
      }
    };

    fetchAllContacts();
  }, []);

  const filteredContactOptions = useMemo(() => {
    const normalizedSearch = contactSearchTerm.trim().toLowerCase();
    const currentContactId = Number(pickValue(contact, 'contactId', 'ContactId')) || 0;

    if (!normalizedSearch) {
      return [];
    }

    return allContacts
      .filter((item) => {
        const candidateId = Number(pickValue(item, 'contactId', 'ContactId')) || 0;
        if (!candidateId || candidateId === currentContactId) {
          return false;
        }

        const haystack = [
          pickValue(item, 'name', 'Name'),
          pickValue(item, 'title', 'Title'),
          pickValue(item, 'phone', 'Phone'),
          pickValue(item, 'email', 'Email')
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(normalizedSearch);
      })
      .slice(0, 8);
  }, [allContacts, contact, contactSearchTerm]);

  const handleChooseContact = (selectedContactId) => {
    setContactSearchTerm('');
    navigate(`/view-contact/${selectedContactId}`);
  };

  if (loading) {
    return (
      <div className="view-contact-page">
        <p>Indlæser kontakt...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-contact-page">
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <div className="view-contact-page">
      <header className="view-contact-header">
        <h1>Se Kontakt Person</h1>
        <p>Information om kontaktpersonen.</p>
      </header>

      <div className="view-contact-search-wrap">
        <ContactsSearchBar
          searchTerm={contactSearchTerm}
          onSearchTermChange={setContactSearchTerm}
          inputId="view-contact-switch-search"
          searchLabel="Find en anden kontakt"
          searchPlaceholder="Søg efter navn, titel, telefon eller email"
        />

        {contactSearchTerm.trim() && (
          <div className="view-contact-search-results">
            {filteredContactOptions.length === 0 && (
              <p className="view-contact-search-empty">Ingen kontakter matcher din søgning.</p>
            )}

            {filteredContactOptions.map((candidate) => {
              const candidateId = Number(pickValue(candidate, 'contactId', 'ContactId')) || 0;
              const candidateName = pickValue(candidate, 'name', 'Name') || 'Ukendt';
              const candidateTitle = pickValue(candidate, 'title', 'Title');

              return (
                <button
                  key={candidateId}
                  type="button"
                  className="view-contact-search-result-item"
                  onClick={() => handleChooseContact(candidateId)}
                >
                  <span className="view-contact-search-result-name">{candidateName}</span>
                  {candidateTitle && <span className="view-contact-search-result-meta">{candidateTitle}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="view-contact-layout">
        <aside className="view-contact-sidebar">
          <ContactInformationCard contact={contact} />
        </aside>

        <div className="view-contact-main">
          <div className="view-contact-associations">
            <h2>Associationer</h2>
            <p className="view-contact-associations-help">Vælg hvilke foreninger denne kontakt skal være knyttet til.</p>
            <ContactAssociationsManager
              contactId={Number(contact?.contactId || contact?.ContactId) || 0}
              linkedAssociationIds={linkedAssociationIds}
            />
          </div>

          <div className="view-contact-events">
            <h2>Events</h2>
            <p className="view-contact-events-help">Her kan du se de events, som er knyttet til kontaktpersonen.</p>
            <ContactEventList contactId={Number(contact?.contactId || contact?.ContactId) || 0} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewContact;