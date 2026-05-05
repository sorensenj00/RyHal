import React from 'react';
import './WelcomeDashboardWidgets.css';

const toHoursLabel = (value) => {
  if (!Number.isFinite(value)) {
    return '0,0 t';
  }

  return `${value.toFixed(1).replace('.', ',')} t`;
};

const valueOrLoading = (value, loading) => (loading ? '...' : value);

const KpiCard = ({ label, value, meta, status = 'neutral', onClick }) => (
  <article
    className={`welcome-kpi-card welcome-kpi-card--${status}${onClick ? ' welcome-kpi-card--interactive' : ''}`}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick();
      }
    } : undefined}
  >
    <span className="welcome-kpi-label">{label}</span>
    <strong className="welcome-kpi-value">{value}</strong>
    {meta ? <span className="welcome-kpi-meta">{meta}</span> : null}
  </article>
);

const WelcomeKpiRow = ({ stats, loading, onOpenShiftsClick, onPendingSwapsClick, onWeeklyHoursClick }) => {
  const coveragePercent = stats.targetStaffing > 0
    ? Math.round((stats.staffedCount / stats.targetStaffing) * 100)
    : 0;

  return (
    <section className="welcome-kpi-grid" aria-label="Hurtigt overblik">
      <KpiCard
        label="Dagens bemanding"
        value={valueOrLoading(`${stats.staffedCount} / ${stats.targetStaffing}`, loading)}
        meta={valueOrLoading(`${coveragePercent}% dækning`, loading)}
        status={coveragePercent < 70 ? 'warning' : 'success'}
      />

      <KpiCard
        label="Ubesatte vagter"
        value={valueOrLoading(stats.openShifts, loading)}
        meta="Kræver handling"
        status={stats.openShifts > 0 ? 'critical' : 'success'}
        onClick={onOpenShiftsClick}
      />

      <KpiCard
        label="Åbne bytteanmodninger"
        value={valueOrLoading(stats.pendingSwaps, loading)}
        meta="Afventer svar"
        status={stats.pendingSwaps > 0 ? 'warning' : 'neutral'}
        onClick={onPendingSwapsClick}
      />

      <KpiCard
        label="Timer denne uge"
        value={valueOrLoading(toHoursLabel(stats.weeklyHours), loading)}
        meta={valueOrLoading(`I dag: ${toHoursLabel(stats.totalWorkHours)}`, loading)}
        status="neutral"
        onClick={onWeeklyHoursClick}
      />
    </section>
  );
};

export default WelcomeKpiRow;
