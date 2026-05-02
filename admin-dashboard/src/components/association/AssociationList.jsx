import React from 'react';
import AssociationSearchBar from '../search/AssociationSearchBar';
import './AssociationList.css';

const pickValue = (obj, ...keys) => {
	for (const key of keys) {
		if (obj && obj[key] !== undefined && obj[key] !== null) {
			return obj[key];
		}
	}

	return null;
};

const AssociationList = ({
	associations = [],
	loading = false,
	error = '',
	searchTerm,
	onSearchTermChange,
	hasContactsFilter,
	onHasContactsFilterChange,
	onAssociationOpen
}) => {
	return (
		<section className="association-list-card">
			<div className="association-list-header">
				<div>
					<h2>Foreningsliste</h2>
					<p>Få overblik over oprettede foreninger og deres kontaktpersoner.</p>
				</div>
			</div>

			<AssociationSearchBar
				searchTerm={searchTerm}
				onSearchTermChange={onSearchTermChange}
				hasContactsFilter={hasContactsFilter}
				onHasContactsFilterChange={onHasContactsFilterChange}
			/>

			{loading && <p className="association-list-status">Henter foreninger...</p>}
			{!loading && error && <p className="association-list-status error">{error}</p>}

			{!loading && !error && associations.length === 0 && (
				<p className="association-list-status">Ingen foreninger matcher den nuværende søgning.</p>
			)}

			{!loading && !error && associations.length > 0 && (
				<ul className="association-list-grid">
					{associations.map((association) => {
						const associationId = pickValue(association, 'associationId', 'AssociationId');
						const associationName = pickValue(association, 'name', 'Name') || 'Ukendt forening';
						const associationLogo = pickValue(association, 'logo', 'Logo');
						const websiteUrl = pickValue(association, 'websiteUrl', 'WebsiteUrl');
						const contacts = Array.isArray(association?.contacts) ? association.contacts : [];

						return (
							<li key={associationId || associationName} className="association-list-item">
								<div className="association-list-main">
									<div className="association-list-item-header">
										<div className="association-list-title-group">
											{associationLogo ? (
												<img
													src={associationLogo}
													alt={`Logo for ${associationName}`}
													className="association-list-logo"
													onError={(event) => {
														event.currentTarget.style.display = 'none';
													}}
												/>
											) : null}
											<h3>{associationName}</h3>
										</div>
										<span>{contacts.length} kontakter</span>
									</div>

									{websiteUrl ? (
										<a href={websiteUrl} target="_blank" rel="noreferrer" className="association-list-link">
											{websiteUrl}
										</a>
									) : (
										<p className="association-list-muted">Ingen hjemmeside angivet</p>
									)}

									<div className="association-list-actions">
										{typeof onAssociationOpen === 'function' && associationId ? (
											<button
												type="button"
												className="btn btn-secondary association-list-open-button"
												onClick={() => onAssociationOpen(associationId)}
											>
												Se forening
											</button>
										) : null}

									</div>
								</div>

								<div className="association-list-contact-block">
									<p className="association-list-caption">Kontaktpersoner</p>
									{contacts.length > 0 ? (
										<div className="association-list-contact-chips">
											{contacts.map((contact) => {
												const contactId = pickValue(contact, 'contactId', 'ContactId');
												const contactName = pickValue(contact, 'name', 'Name') || 'Ukendt kontakt';
												return (
													<span key={contactId || contactName} className="association-list-chip">
														{contactName}
													</span>
												);
											})}
										</div>
									) : (
										<p className="association-list-muted">Ingen kontaktpersoner endnu</p>
									)}
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</section>
	);
};

export default AssociationList;
