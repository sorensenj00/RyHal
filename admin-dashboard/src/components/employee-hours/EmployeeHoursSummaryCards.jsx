import React from 'react';

const formatHours = (minutes) => `${(minutes / 60).toFixed(2)} timer`;

const EmployeeHoursSummaryCards = ({ summary }) => {
  const cards = [
    {
      label: 'Total timer',
      value: formatHours(summary?.totalMinutes || 0),
      hint: `${summary?.totalShiftCount || 0} vagter`,
    },
    {
      label: 'Aktive medarbejdere',
      value: String(summary?.activeEmployees || 0),
      hint: `Ud af ${summary?.totalEmployees || 0}`,
    },
    {
      label: 'Uden timer',
      value: String(summary?.employeesWithoutHours || 0),
      hint: 'I den valgte periode',
    },
  ];

  return (
    <section className="hours-summary-grid" aria-label="Opsummering af timer">
      {cards.map((card) => (
        <article key={card.label} className="hours-summary-card">
          <span className="hours-summary-label">{card.label}</span>
          <strong className="hours-summary-value">{card.value}</strong>
          <span className="hours-summary-hint">{card.hint}</span>
        </article>
      ))}
    </section>
  );
};

export default EmployeeHoursSummaryCards;
