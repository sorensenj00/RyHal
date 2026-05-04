import React from 'react';
import './AddWindowSlide.css';
import './AddAssociationWindow.css';

const pickValue = (obj, ...keys) => {
	for (const key of keys) {
		if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
	}
	return null;
};

const AddAssociationWindow = ({
	isOpen,
	onClose,
	isLoadingRelations,
	availableAssociations,
	selectedAssociationId,
	setSelectedAssociationId,
	associationContacts,
	noOverlay
}) => {
	if (!isOpen) {
		return null;
	}

	const panel = (
		<aside
			className="add-window-panel"
			role="dialog"
			aria-modal="true"
			aria-labelledby="association-modal-title"
			onClick={(event) => event.stopPropagation()}
		>
				<div className="add-window-header">
					<h3 id="association-modal-title">Forening og kontaktpersoner</h3>
					<button type="button" className="btn btn-secondary add-window-close" onClick={onClose}>
						Luk
					</button>
				</div>

				<div className="add-window-body">
					{isLoadingRelations && <p className="add-window-muted">Henter foreninger og kontaktpersoner...</p>}

					{!isLoadingRelations && availableAssociations.length === 0 && (
						<p className="add-window-muted">Ingen foreninger fundet endnu.</p>
					)}

					<div className="association-window-picker">
						<label>
							Forening
							<select
								value={selectedAssociationId}
								onChange={(e) => setSelectedAssociationId(Number(e.target.value) || 0)}
							>
								<option value={0}>Ingen forening</option>
								{availableAssociations.map((association) => {
									const associationId = Number(pickValue(association, 'associationId', 'AssociationId')) || 0;
									const associationName = pickValue(association, 'name', 'Name') || 'Ukendt forening';

									return (
										<option key={associationId} value={associationId}>{associationName}</option>
									);
								})}
							</select>
						</label>
					</div>

					{selectedAssociationId > 0 && (
						<div className="association-window-panel">
							<p className="association-window-caption">Kontakter på valgt forening</p>
							{associationContacts.length > 0 ? (
								<div className="association-window-chip-list">
									{associationContacts.map((contact) => {
										const contactId = Number(pickValue(contact, 'contactId', 'ContactId')) || 0;
										const contactName = pickValue(contact, 'name', 'Name') || 'Ukendt kontakt';

										return <span key={contactId} className="association-window-chip">{contactName}</span>;
									})}
								</div>
							) : (
								<p className="add-window-muted">Den valgte forening har ingen kontaktpersoner endnu.</p>
							)}
						</div>
					)}
					</div>
			</aside>
	);

	return noOverlay ? panel : <div className="add-window-overlay" onClick={onClose}>{panel}</div>;
};

export default AddAssociationWindow;
