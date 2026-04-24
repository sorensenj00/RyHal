import React from 'react';
import './ContactsSearchBar.css';

const ContactsSearchBar = ({
	searchTerm = '',
	onSearchTermChange = () => {},
	inputId = 'contacts-search-input',
	searchLabel = 'Søg kontaktperson',
	searchPlaceholder = 'Søg efter navn, titel, telefon, email eller forening'
}) => {
	return (
		<div className="contacts-searchbar">
			<div className="contacts-searchbar-top">
				<label className="contacts-searchbar-input" htmlFor={inputId}>
					<span>{searchLabel}</span>
					<input
						id={inputId}
						type="search"
						value={searchTerm}
						onChange={(event) => onSearchTermChange(event.target.value)}
						placeholder={searchPlaceholder}
					/>
				</label>

				<button
					type="button"
					className="contacts-searchbar-reset"
					onClick={() => onSearchTermChange('')}
					disabled={!searchTerm}
				>
					Nulstil
				</button>
			</div>
		</div>
	);
};

export default ContactsSearchBar;
