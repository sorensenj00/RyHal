import React, { useState } from 'react';
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
	onAssociationOpen,
	onAssociationDelete
}) => {
	const [pendingDelete, setPendingDelete] = useState(null);
	const [deletingId, setDeletingId] = useState(null);

	const openDeleteConfirm = (id, name) => {
		setPendingDelete({ id: Number(id) || 0, name });
	};

	const closeDeleteConfirm = () => {
		if (deletingId !== null) {
			return;
		}

		setPendingDelete(null);
	};

	const confirmDelete = async () => {
		if (!pendingDelete || typeof onAssociationDelete !== 'function') {
			return;
		}

		try {
			setDeletingId(pendingDelete.id);
			await onAssociationDelete(pendingDelete.id, pendingDelete.name);
			setPendingDelete(null);
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<section className="association-list-card">
			<div className="association-list-header">
				<div>
					<h2>Foreningsliste</h2>
					<p>Få overblik over oprettede foreninger og deres kontaktpersoner.</p>
				</div>
				<div className="association-list-count">{associations.length} stk.</div>
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
						const websiteUrl = pickValue(association, 'websiteUrl', 'WebsiteUrl');
						const contacts = Array.isArray(association?.contacts) ? association.contacts : [];

						return (
							<li key={associationId || associationName} className="association-list-item">
								<div className="association-list-main">
									<div className="association-list-item-header">
										<h3>{associationName}</h3>
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
												className="association-list-open-button"
												onClick={() => onAssociationOpen(associationId)}
											>
												Se forening
											</button>
										) : null}

										{typeof onAssociationDelete === 'function' && associationId ? (
											<button
												type="button"
												className="association-list-delete-button"
												onClick={() => openDeleteConfirm(associationId, associationName)}
												disabled={deletingId === Number(associationId)}
											>
												{deletingId === Number(associationId) ? 'Sletter...' : 'Slet'}
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

			{pendingDelete && (
				<div className="delete-modal-overlay" onClick={closeDeleteConfirm}>
					<div
						className="delete-modal"
						role="dialog"
						aria-modal="true"
						aria-labelledby="delete-association-modal-title"
						onClick={(e) => e.stopPropagation()}
					>
						<h3 id="delete-association-modal-title">Slet forening?</h3>
						<p>
							Er du sikker på, at du vil slette <strong>{pendingDelete.name}</strong>?
							<br />
							Denne handling kan ikke fortrydes.
						</p>

						<div className="delete-modal-actions">
							<button
								type="button"
								className="association-btn-action"
								onClick={closeDeleteConfirm}
								disabled={deletingId !== null}
							>
								Annuller
							</button>
							<button
								type="button"
								className="association-btn-action delete"
								onClick={confirmDelete}
								disabled={deletingId !== null}
							>
								{deletingId !== null ? 'Sletter...' : 'Ja, slet'}
							</button>
						</div>
					</div>
				</div>
			)}
		</section>
	);
};

export default AssociationList;
