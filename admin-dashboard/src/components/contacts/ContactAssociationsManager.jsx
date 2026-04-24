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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [linkedIds, setLinkedIds] = useState(new Set(linkedAssociationIds));
  const [savingId, setSavingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLinkedIds(new Set(linkedAssociationIds));
  }, [linkedAssociationIds]);

  useEffect(() => {
    if (!isModalOpen || hasLoaded) {
      return;
    }

    const fetchAssociations = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getAllAssociations();
        setAssociations(data);
        setHasLoaded(true);
      } catch (err) {
        console.error('Fejl ved indlæsning af associationer:', err);
        setError('Kunne ikke indlæse associationerne. Prøv igen.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssociations();
  }, [hasLoaded, isModalOpen]);

  const closeModal = () => {
    setIsModalOpen(false);
    setSearchTerm('');
  };

  useEffect(() => {
    if (!isModalOpen) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isModalOpen]);

  const filteredAssociations = associations.filter((association) => {
    const assocName = (pickValue(association, 'name', 'Name') || '').toString().toLowerCase();
    const assocWebsite = (pickValue(association, 'websiteUrl', 'WebsiteUrl') || '').toString().toLowerCase();
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return true;
    }

    return assocName.includes(normalizedSearchTerm) || assocWebsite.includes(normalizedSearchTerm);
  });

  const handleToggleAssociation = async (associationId) => {
    const isLinked = linkedIds.has(associationId);
    setSavingId(associationId);
    setError('');

    try {
      if (isLinked) {
        await unlinkContactFromAssociation(associationId, contactId);
        const newLinkedIds = new Set(linkedIds);
        newLinkedIds.delete(associationId);
        setLinkedIds(newLinkedIds);
      } else {
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

  return (
    <div className="associations-manager">
      <button
        type="button"
        className="associations-trigger"
        onClick={() => setIsModalOpen(true)}
      >
        <span>Tilknyt foreninger</span>
        <span className="associations-trigger-meta">{linkedIds.size} valgt</span>
      </button>

      {isModalOpen && (
        <div
          className="association-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Tilknyt foreninger"
          onClick={closeModal}
        >
          <div className="association-modal" onClick={(event) => event.stopPropagation()}>
            <div className="association-modal-header">
              <h3>Tilknyt foreninger</h3>
              <button type="button" className="association-modal-close" onClick={closeModal}>
                Luk
              </button>
            </div>

            {error && <p className="error-message">{error}</p>}

            <label className="associations-search">
              <span>Søg efter forening</span>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Søg på navn eller hjemmeside"
              />
            </label>

            {loading && <div className="associations-status">Indlæser associationer...</div>}

            {!loading && associations.length === 0 && (
              <p className="no-associations">Ingen associationer tilgængelig.</p>
            )}

            {!loading && associations.length > 0 && filteredAssociations.length === 0 && (
              <p className="no-associations">Ingen foreninger matcher din søgning.</p>
            )}

            {!loading && filteredAssociations.length > 0 && (
              <div className="associations-list">
                {filteredAssociations.map((association) => {
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
                        type="button"
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactAssociationsManager;
