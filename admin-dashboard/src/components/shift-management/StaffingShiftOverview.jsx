import React from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import './StaffingShiftOverview.css';

const toHoursLabel = (value) => {
	if (!Number.isFinite(value)) {
		return '0 t';
	}

	return `${value.toFixed(1).replace('.', ',')} t`;
};

const StaffingShiftOverview = ({
	selectedDate,
	onPreviousDay,
	onNextDay,
	onDateChange,
	openShifts = 0,
	staffedCount = 0,
	targetStaffing = 0,
	totalWorkHours = 0,
	loading = false,
}) => {
	const coveragePercent =
		targetStaffing > 0 ? Math.round((staffedCount / targetStaffing) * 100) : 0;
	const hasNoOpenShifts = !loading && Number(openShifts) === 0;
	const selectedDateObject = new Date(`${selectedDate}T00:00:00`);
	const dateLabel = Number.isNaN(selectedDateObject.getTime())
		? 'Ukendt dato'
		: format(selectedDateObject, 'EEEE d. MMMM yyyy', { locale: da });
	const valueOrLoading = (value) => (loading ? '...' : value);

	return (
		<section className="staffing-shift-overview" aria-label="Hurtigt overblik over bemanding">
			<div className="staffing-date-nav" role="group" aria-label="Skift dag">
				<button type="button" className="staffing-nav-btn" onClick={onPreviousDay} aria-label="Forrige dag">
					&lt;
				</button>

				<label className="staffing-date-picker-wrap">
					<span className="staffing-date-label">{dateLabel}</span>
					<input
						type="date"
						value={selectedDate}
						onChange={(event) => onDateChange(event.target.value)}
						className="staffing-date-input"
					/>
				</label>

				<button type="button" className="staffing-nav-btn" onClick={onNextDay} aria-label="Naeste dag">
					&gt;
				</button>
			</div>

			<article
				className={`staffing-overview-item ${hasNoOpenShifts
					? 'staffing-overview-item-success'
					: 'staffing-overview-item-critical'}`}
			>
				<span className="staffing-overview-label">Ledige vagter</span>
				<strong className="staffing-overview-value">{valueOrLoading(openShifts)}</strong>
			</article>

			<article className="staffing-overview-item">
				<span className="staffing-overview-label">Bemandet</span>
				<strong className="staffing-overview-value">
					{loading ? '... / ...' : `${staffedCount} / ${targetStaffing}`}
				</strong>
				<span className="staffing-overview-meta">{valueOrLoading(coveragePercent)}% dækning</span>
			</article>

			<article className="staffing-overview-item">
				<span className="staffing-overview-label">Samlet arbejdstimer</span>
				<strong className="staffing-overview-value">{loading ? '...' : toHoursLabel(totalWorkHours)}</strong>
			</article>
		</section>
	);
};

export default StaffingShiftOverview;
