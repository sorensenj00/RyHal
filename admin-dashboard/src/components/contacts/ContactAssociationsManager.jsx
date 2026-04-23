import React, { useEffect, useState } from 'react';
import {
  getAllAssociations,
  linkContactToAssociation,
  unlinkContactFromAssociation
} from '../../api/associationService';
import './ContactAssociationsManager.css';

const pickValue = (obj, ...keys) => {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) {
      return obj[key];
    }
  }
  return null;
};

const ContactAssociationsManager = ({ contactId, linkedAssociationIds = [] }) => {
  const [associations, setAssociations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [linkedIds, setLinkedIds] = useState(new Set(linkedAssociationIds));
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    const fetchAssociations = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getAllAssociations();
        setAssociations(data);
      } catch (err) {
        console.error('Fejl ved indlæsning af associationer:', err);
        setError('Kunne ikke indlæse associationerne. Prøv igen.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssociations();
  }, []);

  const handleToggleAssociation = async (associationId) => {
    const isLinked = linkedIds.has(associationId);
    setSavingId(associationId);

    try {
      if (isLinked) {
        // Desvincula
        await unlinkContactFromAssociation(associationId, contactId);
        const newLinkedIds = new Set(linkedIds);
        newLinkedIds.delete(associationId);
        setLinkedIds(newLinkedIds);
      } else {
        // Vincula
        await linkContactToAssociation(associationId, contactId);
        const newLinkedIds = new Set(linkedIds);
        newLinkedIds.add(associationId);
        setLinkedIds(newLinkedIds);
      }
    } catch (err) {
      console.error('Erro ao atualizar vínculo:', err);
      setError('Erro ao salvar a alteração. Tente novamente.');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div className="associations-manager">Indlæser associationer...</div>;
  }

  if (associations.length === 0) {
    return (
      <div className="associations-manager">
        <p className="no-associations">Ingen associationer tilgængelig.</p>
      </div>
    );
  }

  return (
    <div className="associations-manager">
      {error && <p className="error-message">{error}</p>}
      
      <div className="associations-list">
        {associations.map((association) => {
          const assocId = Number(pickValue(association, 'associationId', 'AssociationId')) || 0;
          const assocName = pickValue(association, 'name', 'Name') || 'Ukendt forening';
          const assocWebsite = pickValue(association, 'websiteUrl', 'WebsiteUrl');
          const isLinked = linkedIds.has(assocId);
          const isProcessing = savingId === assocId;

          return (
            <div key={assocId} className="association-item">
              <div className="association-info">
                <h4>{assocName}</h4>
                {assocWebsite && (
                  <a href={assocWebsite} target="_blank" rel="noreferrer" className="association-link">
                    {assocWebsite}
                  </a>
                )}
              </div>
              <button
                className={`association-toggle-btn ${isLinked ? 'linked' : 'unlinked'}`}
                onClick={() => handleToggleAssociation(assocId)}
                disabled={isProcessing}
                title={isLinked ? 'Fjern fra denne forening' : 'Tilknyt til denne forening'}
              >
                {isProcessing ? '...' : isLinked ? '✓ Tilknyttet' : '+ Tilknyt'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContactAssociationsManager;
