import React from 'react';
import ContactsSearchBar from '../search/ContactsSearchBar';
import './AddWindowSlide.css';
import './AddContactWindow.css';

const pickValue = (obj, ...keys) => {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return null;
};

const AddContactWindow = ({
  isOpen,
  onClose,
  availableContacts,
  selectedContactIds,
  toggleContactSelection,
  contactSearchTerm,
  setContactSearchTerm,
  filteredContacts,
  associationContactIds,
  contactAssociationNamesById,
  noOverlay
}) => {
  if (!isOpen) {
    return null;
  }

  const panel = (
    <aside
      className="add-window-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-window-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="add-window-header">
          <h3 id="contact-window-title">Tilføj kontaktpersoner</h3>
          <button type="button" className="btn btn-secondary add-window-close" onClick={onClose}>
            Luk
          </button>
        </div>

        <div className="add-window-body">
          <div className="contact-window-block">
            <p className="contact-window-caption">Direkte kontaktpersoner på aktiviteten</p>
            <p className="add-window-muted">Kontakter her kobles direkte til aktiviteten.</p>

            {availableContacts.length === 0 ? (
              <p className="add-window-muted">Ingen kontaktpersoner fundet endnu.</p>
            ) : (
              <>
                <ContactsSearchBar
                  searchTerm={contactSearchTerm}
                  onSearchTermChange={setContactSearchTerm}
                  inputId="event-contacts-search"
                />

                {selectedContactIds.length > 0 && (
                  <div className="contact-window-selected-chips">
                    {availableContacts
                      .filter((contact) => selectedContactIds.includes(Number(pickValue(contact, 'contactId', 'ContactId')) || 0))
                      .map((contact) => {
                        const contactId = Number(pickValue(contact, 'contactId', 'ContactId')) || 0;
                        const contactName = pickValue(contact, 'name', 'Name') || 'Ukendt kontakt';

                        return (
                          <button
                            key={contactId}
                            type="button"
                            className="contact-window-selected-chip"
                            onClick={() => toggleContactSelection(contactId)}
                          >
                            {contactName} (fjern)
                          </button>
                        );
                      })}
                  </div>
                )}

                <div className="contact-window-selection-list">
                  {filteredContacts.map((contact) => {
                    const contactId = Number(pickValue(contact, 'contactId', 'ContactId')) || 0;
                    const contactName = pickValue(contact, 'name', 'Name') || 'Ukendt kontakt';
                    const contactTitle = pickValue(contact, 'title', 'Title');
                    const contactEmail = pickValue(contact, 'email', 'Email');
                    const isSelected = selectedContactIds.includes(contactId);
                    const belongsToSelectedAssociation = associationContactIds.includes(contactId);
                    const associationNames = contactAssociationNamesById[contactId] || [];

                    return (
                      <label key={contactId} className={`contact-window-option ${isSelected ? 'selected' : ''}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleContactSelection(contactId)}
                        />
                        <div className="contact-window-option-text">
                          <span className="contact-window-option-name">{contactName}</span>
                          <span className="contact-window-option-meta">
                            {[
                              contactTitle,
                              contactEmail,
                              associationNames.length > 0 ? `Foreninger: ${associationNames.join(', ')}` : null,
                              belongsToSelectedAssociation ? 'også på valgt forening' : null
                            ]
                              .filter(Boolean)
                              .join(' · ') || 'Ingen ekstra oplysninger'}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </aside>
  );

  return noOverlay ? panel : <div className="add-window-overlay" onClick={onClose}>{panel}</div>;
};

export default AddContactWindow;
