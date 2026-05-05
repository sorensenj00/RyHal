import React from 'react';
import { formatDateTime, formatDateOnly, formatTimeOnly } from '../../../utils/dateUtils';


const DraftActivitiesList = ({ drafts = [], onPublish, onEdit, actionLoadingId = null }) => {
  if (!drafts.length) {
    return <p className="draft-empty-state">Ingen kladder fundet.</p>;
  }

  return (
    <ul className="draft-list">
      {drafts.map((draft) => (
        <li key={draft.id} className="draft-card">
          {(() => {
            const firstLoc = Array.isArray(draft.locations) ? draft.locations[0] : null;
            const draftDate = draft.date || firstLoc?.date || draft.startTime || firstLoc?.startTime;
            const startClock = draft.startTime || firstLoc?.startTime;
            const endClock = draft.endTime || firstLoc?.endTime;

            return (
              <>
          <div className="draft-card-header">
            <h3>{draft.name || 'Unavngiven aktivitet'}</h3>
            <span className="draft-badge">Kladde</span>
          </div>

          <p className="draft-description">
            {draft.description || 'Ingen beskrivelse endnu.'}
          </p>

          <div className="draft-meta-grid">
            <div>
              <span className="draft-meta-label">Kategori</span>
              <span className="draft-meta-value">{draft.category || 'ANDET'}</span>
            </div>
            <div>
              <span className="draft-meta-label">Dato</span>
              <span className="draft-meta-value">{formatDateOnly(draftDate)}</span>
            </div>
            <div>
              <span className="draft-meta-label">Tidspunkt</span>
              <span className="draft-meta-value">
                {startClock && endClock
                  ? `${formatTimeOnly(startClock)} - ${formatTimeOnly(endClock)}`
                  : 'Tid ikke angivet'}
              </span>
            </div>
            <div>
              <span className="draft-meta-label">Lokationer</span>
              <span className="draft-meta-value">{Array.isArray(draft.locations) ? draft.locations.length : 0}</span>
            </div>
          </div>

          {!!draft.locations?.length && (
            <div className="draft-locations">
              <h4>Lokationsbookinger</h4>
              <ul>
                {draft.locations.map((loc, index) => (
                  <li key={`${draft.id}-${loc.locationId || 'loc'}-${index}`}>
                    Lokation #{loc.locationId || 'ukendt'} - Dato: {formatDateOnly(loc.date || loc.startTime || draftDate)}
                    {loc.startTime && loc.endTime
                      ? `, Tid: ${formatTimeOnly(loc.startTime)} - ${formatTimeOnly(loc.endTime)}`
                      : ', Tid: ikke angivet'}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="draft-actions">
            <button
              type="button"
              className="draft-action-btn secondary"
              onClick={() => onEdit?.(draft)}
            >
              Åbn i redigering
            </button>
            <button
              type="button"
              className="draft-action-btn primary"
              onClick={() => onPublish?.(draft)}
              disabled={String(actionLoadingId) === String(draft.id)}
            >
              {String(actionLoadingId) === String(draft.id) ? 'Publicerer...' : 'Publicer'}
            </button>
          </div>
              </>
            );
          })()}
        </li>
      ))}
    </ul>
  );
};

export default DraftActivitiesList;
