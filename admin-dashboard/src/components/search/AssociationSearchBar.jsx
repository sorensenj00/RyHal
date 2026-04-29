import React from 'react';
import './AssociationSearchBar.css';

const AssociationSearchBar = ({
	searchTerm,
	onSearchTermChange,
	hasContactsFilter,
	onHasContactsFilterChange,
	associationOptions = [],
	selectedAssociationId,
	onSelectedAssociationIdChange
}) => {
	const showAssociationSelector =
		Array.isArray(associationOptions)
		&& associationOptions.length > 0
		&& typeof onSelectedAssociationIdChange === 'function';

	return (
		<section className="association-searchbar" aria-label="Søg og filter foreninger">
			{showAssociationSelector && (
				<div className="association-searchbar-group">
					<label htmlFor="association-picker">Forening</label>
					<select
						id="association-picker"
						value={selectedAssociationId ?? ''}
						onChange={(e) => onSelectedAssociationIdChange(Number(e.target.value) || 0)}
					>
						<option value={0}>Vælg forening...</option>
						{associationOptions.map((association) => {
							const id = Number(association.id) || 0;
							return (
								<option key={id} value={id}>{association.name}</option>
							);
						})}
					</select>
				</div>
			)}

			<div className="association-searchbar-group association-searchbar-text">
				<label htmlFor="association-search-input">Søg</label>
				<input
					id="association-search-input"
					type="text"
					value={searchTerm}
					onChange={(e) => onSearchTermChange(e.target.value)}
					placeholder="Søg efter navn, hjemmeside eller kontaktperson"
				/>
			</div>

			<div className="association-searchbar-group">
				<label htmlFor="association-contact-filter">Kontakter</label>
				<select
					id="association-contact-filter"
					value={hasContactsFilter}
					onChange={(e) => onHasContactsFilterChange(e.target.value)}
				>
					<option value="ALL">Alle</option>
					<option value="WITH_CONTACTS">Har kontaktpersoner</option>
					<option value="WITHOUT_CONTACTS">Ingen kontaktpersoner</option>
				</select>
			</div>

			<button
				type="button"
				className="association-searchbar-reset"
				onClick={() => {
					onSearchTermChange('');
					onHasContactsFilterChange('ALL');
					if (showAssociationSelector) {
						onSelectedAssociationIdChange(0);
					}
				}}
			>
				Nulstil
			</button>
		</section>
	);
};

export default AssociationSearchBar;
