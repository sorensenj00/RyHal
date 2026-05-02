import React from 'react';
import './AssociationSearchBar.css';

const AssociationSearchBar = ({
	searchTerm,
	onSearchTermChange,
	hasContactsFilter,
	onHasContactsFilterChange,
	associationOptions = [],
	selectedAssociationId,
	onSelectedAssociationIdChange,
	showSearchInput = true,
	showContactsFilter = true,
	showResetButton = true,
	associationLabel = 'Forening',
	searchLabel = 'Søg',
	searchPlaceholder = 'Søg efter navn, hjemmeside eller kontaktperson',
	resetLabel = 'Nulstil'
}) => {
	const showAssociationSelector =
		Array.isArray(associationOptions)
		&& associationOptions.length > 0
		&& typeof onSelectedAssociationIdChange === 'function';
	const canSearch = showSearchInput && typeof onSearchTermChange === 'function';
	const canFilterByContacts = showContactsFilter && typeof onHasContactsFilterChange === 'function';
	const shouldShowResetButton = showResetButton && (showAssociationSelector || canSearch || canFilterByContacts);

	return (
		<section className="association-searchbar" aria-label="Søg og filter foreninger">
			{showAssociationSelector && (
				<div className="association-searchbar-group">
					<label htmlFor="association-picker">{associationLabel}</label>
					<select
						id="association-picker"
						value={selectedAssociationId ?? ''}
						onChange={(e) => onSelectedAssociationIdChange(Number(e.target.value) || 0)}
					>
						<option value={0}>Vælg forening...</option>
						{associationOptions.map((association) => {
							const id = Number(association?.id ?? association?.associationId ?? association?.AssociationId) || 0;
							const name = association?.name ?? association?.Name ?? 'Ukendt forening';
							return (
								<option key={id} value={id}>{name}</option>
							);
						})}
					</select>
				</div>
			)}

			{canSearch && (
				<div className="association-searchbar-group association-searchbar-text">
					<label htmlFor="association-search-input">{searchLabel}</label>
					<input
						id="association-search-input"
						type="text"
						value={searchTerm ?? ''}
						onChange={(e) => onSearchTermChange(e.target.value)}
						placeholder={searchPlaceholder}
					/>
				</div>
			)}

			{canFilterByContacts && (
				<div className="association-searchbar-group">
					<label htmlFor="association-contact-filter">Kontakter</label>
					<select
						id="association-contact-filter"
						value={hasContactsFilter ?? 'ALL'}
						onChange={(e) => onHasContactsFilterChange(e.target.value)}
					>
						<option value="ALL">Alle</option>
						<option value="WITH_CONTACTS">Har kontaktpersoner</option>
						<option value="WITHOUT_CONTACTS">Ingen kontaktpersoner</option>
					</select>
				</div>
			)}

			{shouldShowResetButton && (
				<button
					type="button"
					className="btn btn-secondary association-searchbar-reset"
					onClick={() => {
						if (canSearch) {
							onSearchTermChange('');
						}
						if (canFilterByContacts) {
							onHasContactsFilterChange('ALL');
						}
						if (showAssociationSelector) {
							onSelectedAssociationIdChange(0);
						}
					}}
				>
					{resetLabel}
				</button>
			)}
		</section>
	);
};

export default AssociationSearchBar;
