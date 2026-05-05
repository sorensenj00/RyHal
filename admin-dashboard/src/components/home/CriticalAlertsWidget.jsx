import React from 'react';
import './WelcomeDashboardWidgets.css';

const CriticalAlertsWidget = ({ stats = {}, onNavigate }) => {
  const { openShifts = 0, pendingSwaps = 0 } = stats;

  const checks = [
    {
      id: 'staffing',
      label: 'Alle vagter besat',
      ok: openShifts === 0,
      detail: openShifts > 0 ? `${openShifts} ubesatte vagt${openShifts !== 1 ? 'er' : ''}` : null,
      actionTo: '/staffing-overview',
      actionLabel: 'Vis vagter',
    },
    {
      id: 'swaps',
      label: 'Ingen åbne bytteanmodninger',
      ok: pendingSwaps === 0,
      detail: pendingSwaps > 0 ? `${pendingSwaps} afventer` : null,
      actionTo: '/swap-requests',
      actionLabel: 'Se anmodninger',
    },
  ];

  const allOk = checks.every((c) => c.ok);

  return (
    <section className="welcome-widget welcome-alerts-widget" aria-label="Vigtige handlinger">
      <div className="welcome-widget-header">
        <p className="welcome-widget-title">Status</p>
        {allOk && <span className="welcome-checklist-all-ok">Alt er i orden</span>}
      </div>

      <ul className="welcome-checklist">
        {checks.map((check) => (
          <li key={check.id} className={`welcome-checklist-item ${check.ok ? 'welcome-checklist-item--ok' : 'welcome-checklist-item--fail'}`}>
            <span className="welcome-checklist-icon" aria-hidden="true">
              {check.ok ? '✓' : '✗'}
            </span>
            <div className="welcome-checklist-text">
              <span className="welcome-checklist-label">{check.label}</span>
              {!check.ok && check.detail && (
                <span className="welcome-checklist-detail">{check.detail}</span>
              )}
            </div>
            {!check.ok && (
              <button
                type="button"
                className="welcome-checklist-action"
                onClick={() => onNavigate(check.actionTo)}
              >
                {check.actionLabel}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default CriticalAlertsWidget;
