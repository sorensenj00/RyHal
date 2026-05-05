import React from 'react';
import { formatDateOnly, formatTimeOnly } from '../../utils/dateUtils';
import './ActivityPreview.css';

const ActivityPreview = ({
	title,
	description,
	category,
	startDate,
	startTime,
	endTime,
	isRecurring,
	recurrenceFrequency,
	recurrenceEndDate,
	isDraft,
	associationName,
	contacts,
	locations
}) => {
	const contactName = (contact) => (
		contact?.name
		|| contact?.Name
		|| contact?.fullName
		|| contact?.FullName
		|| 'Ukendt kontakt'
	);

	const recurrenceLabel = {
		DAILY: 'Dagligt',
		WEEKLY: 'Ugentligt',
		MONTHLY: 'Månedligt'
	}[recurrenceFrequency] || recurrenceFrequency;

	return (
		<section className="activity-preview-shell" aria-live="polite">
			<p className="activity-preview-title">Preview af aktivitet</p>

			<article className="activity-preview-card">
				<div className="activity-preview-card-header">
					<h3>{title?.trim() || 'Unavngiven aktivitet'}</h3>
					<span className={`activity-preview-badge ${isDraft ? 'draft' : 'ready'}`}>
						{isDraft ? 'Kladde' : 'Klar'}
					</span>
				</div>

				<p className="activity-preview-description">
					{description?.trim() || 'Ingen beskrivelse endnu.'}
				</p>

				<div className="activity-preview-meta-grid">
					<div>
						<span className="activity-preview-meta-label">Kategori</span>
						<span className="activity-preview-meta-value">{category || 'ANDET'}</span>
					</div>
					<div>
						<span className="activity-preview-meta-label">Dato</span>
						<span className="activity-preview-meta-value">{formatDateOnly(startDate)}</span>
					</div>
					<div>
						<span className="activity-preview-meta-label">Tidspunkt</span>
						<span className="activity-preview-meta-value">
							{startTime && endTime
								? `${formatTimeOnly(startTime)} - ${formatTimeOnly(endTime)}`
								: 'Tid ikke angivet'}
						</span>
					</div>
					<div>
						<span className="activity-preview-meta-label">Lokationer</span>
						<span className="activity-preview-meta-value">{Array.isArray(locations) ? locations.length : 0}</span>
					</div>
				</div>

				<div className="activity-preview-extra-grid">
					<p><strong>Forening:</strong> {associationName || 'Ingen valgt'}</p>
					<p><strong>Kontakter:</strong> {contacts?.length || 0}</p>
					{isRecurring && (
						<p>
							<strong>Gentagelse:</strong> {recurrenceLabel} til {formatDateOnly(recurrenceEndDate)}
						</p>
					)}
				</div>

				{Array.isArray(contacts) && contacts.length > 0 && (
					<div className="activity-preview-contacts">
						<h4>Kontaktpersoner</h4>
						<ul>
							{contacts.map((contact, index) => {
								const id = contact?.contactId || contact?.ContactId || index;
								return (
									<li key={id}>
										{contactName(contact)}
									</li>
								);
							})}
						</ul>
					</div>
				)}

				{Array.isArray(locations) && locations.length > 0 && (
					<div className="activity-preview-locations">
						<h4>Lokationsbookinger</h4>
						<ul>
							{locations.map((location, index) => (
								<li key={`${location.name}-${index}`}>
									{location.name} - Tid: {formatTimeOnly(location.startTime)} - {formatTimeOnly(location.endTime)}
								</li>
							))}
						</ul>
					</div>
				)}
			</article>
		</section>
	);
};

export default ActivityPreview;
