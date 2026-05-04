import React from 'react';
import './AllEventsTable.css';

const CATEGORY_CLASS = {
  SPORT: 'sport',
  MØDE: 'mode',
  VEDLIGEHOLDELSE: 'vedligeholdelse',
  ANDET: 'andet'
};

const normalizeCategory = (category) => String(category || 'ANDET').toUpperCase();

const formatDate = (value) => {
  if (!value) return '—';
  const [datePart] = String(value).split('T');
  const [year, month, day] = datePart.split('-');
  if (year && month && day) return `${day}/${month}/${year}`;
  return datePart;
};

const formatTime = (value) => {
  if (!value) return '—';
  const raw = String(value);
  const timePart = raw.includes('T') ? raw.split('T')[1] : raw;
  return timePart.slice(0, 5);
};

const AllEventsTable = ({ rows, onOpenEvent }) => {
  if (rows.length === 0) {
    return <p className="all-events-empty">Ingen events matcher søgningen.</p>;
  }

  return (
    <div className="all-events-table-scroll" role="region" aria-label="Alle events tabel">
      <table className="all-events-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Kategori</th>
            <th>Dato</th>
            <th>Tid</th>
            <th>Lokation</th>
            <th>Forening</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const category = normalizeCategory(row.category);
            const categoryClass = CATEGORY_CLASS[category] || 'andet';
            const locationText = row.locations.length > 0 ? row.locations.join(', ') : 'Uden lokation';
            const assocStyle = row.associationColor
              ? {
                  color: row.associationColor,
                  borderColor: row.associationColor,
                  background: `${row.associationColor}22`
                }
              : undefined;

            return (
              <tr
                key={String(row.id)}
                className="all-events-table-row"
                onClick={() => onOpenEvent(row.rawEvent)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpenEvent(row.rawEvent);
                  }
                }}
                tabIndex={0}
                role="button"
              >
                <td>
                  <div className="all-events-table-title">
                    <strong>{row.name || 'Unavngiven aktivitet'}</strong>
                    {row.description && <span>{row.description}</span>}
                  </div>
                </td>
                <td>
                  <span className={`all-events-table-chip cat-${categoryClass}`}>{category}</span>
                </td>
                <td>{formatDate(row.date)}</td>
                <td>
                  {row.startTime && row.endTime
                    ? `${formatTime(row.startTime)} - ${formatTime(row.endTime)}`
                    : '—'}
                </td>
                <td>{locationText}</td>
                <td>
                  {row.associationName ? (
                    <span className="all-events-table-assoc" style={assocStyle}>
                      {row.associationColor && (
                        <span className="all-events-table-assoc-dot" style={{ background: row.associationColor }} />
                      )}
                      {row.associationName}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  {row.isDraft ? (
                    <span className="all-events-table-chip draft">Kladde</span>
                  ) : (
                    <span className="all-events-table-chip active">Aktiv</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AllEventsTable;
