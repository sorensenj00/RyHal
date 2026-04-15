import React from 'react';

const QualificationBox = ({ qualifications }) => {
  if (!qualifications || qualifications.length === 0) {
    return (
      <div className="details-section">
        <h3>Kvalifikationer</h3>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', fontStyle: 'italic' }}>
          Ingen registrerede kvalifikationer.
        </p>
      </div>
    );
  }

  return (
    <div className="qualification-container">
      <h3>Kvalifikationer</h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
        gap: '1rem',
        marginTop: '1rem' 
      }}>
        {qualifications.map((q, index) => (
          <div 
            key={index} 
            style={{
              border: '1px solid var(--gray-200)',
              borderRadius: 'var(--border-radius)',
              padding: '1rem',
              backgroundColor: 'var(--gray-50)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}
          >
            <strong style={{ 
              display: 'block', 
              fontSize: '0.95rem', 
              color: 'var(--gray-800)',
              marginBottom: '0.25rem' 
            }}>
              {q.name}
            </strong>
            <p style={{ 
              margin: 0, 
              fontSize: '0.85rem', 
              color: 'var(--gray-600)',
              lineHeight: '1.4' 
            }}>
              {q.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QualificationBox;
