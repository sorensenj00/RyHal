import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axiosConfig';
import ContactInformationCard from '../../components/contacts/ContactInformationCard';
import ContactAssociationsManager from '../../components/contacts/ContactAssociationsManager';
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
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [linkedAssociationIds, setLinkedAssociationIds] = useState([]);

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
            const contactId = Number(response.data.contactId || response.data.ContactId) || 0;
            
            // Find associationer der indeholder denne kontakt
            const linked = associations
              .filter((assoc) => {
                const contacts = Array.isArray(assoc?.contacts) ? assoc.contacts : [];
                return contacts.some((c) => {
                  const cId = Number(c?.contactId || c?.ContactId) || 0;
                  return cId === contactId;
                });
              })
              .map((assoc) => Number(assoc?.associationId || assoc?.AssociationId) || 0)
              .filter((id) => id > 0);
            
            setLinkedAssociationIds(linked);
          } catch (assocError) {
            console.error('Kunne ikke hente associationer:', assocError);
            setLinkedAssociationIds([]);
          }
        } else {
          // Hent alle kontakter og vælg en tilfældig
          const response = await api.get('/contacts');
          const contacts = Array.isArray(response.data) ? response.data : [];
          
          if (contacts.length > 0) {
            const randomIndex = Math.floor(Math.random() * contacts.length);
            const randomContact = contacts[randomIndex];
            setContact(randomContact);
            
            // Hent associationer for denne tilfældige kontakt
            try {
              const associations = await getAllAssociations();
              const contactId = Number(randomContact.contactId || randomContact.ContactId) || 0;
              
              const linked = associations
                .filter((assoc) => {
                  const contacts = Array.isArray(assoc?.contacts) ? assoc.contacts : [];
                  return contacts.some((c) => {
                    const cId = Number(c?.contactId || c?.ContactId) || 0;
                    return cId === contactId;
                  });
                })
                .map((assoc) => Number(assoc?.associationId || assoc?.AssociationId) || 0)
                .filter((id) => id > 0);
              
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

      <div className="view-contact-content">
        <ContactInformationCard contact={contact} />
      </div>

      <div className="view-contact-associations">
        <h2>Associationer</h2>
        <p className="view-contact-associations-help">Vælg hvilke foreninger denne kontakt skal være knyttet til.</p>
        <ContactAssociationsManager 
          contactId={Number(contact?.contactId || contact?.ContactId) || 0}
          linkedAssociationIds={linkedAssociationIds}
        />
      </div>
    </div>
  );
};

export default ViewContact;