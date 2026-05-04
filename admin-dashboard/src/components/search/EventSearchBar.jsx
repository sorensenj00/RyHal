import React from 'react';
import './EventSearchBar.css';

const EventSearchBar = ({ searchTerm, onSearchTermChange, onReset }) => (
	<section className="event-searchbar" aria-label="Søg events">
		<div className="event-searchbar-group">
			<label htmlFor="event-search-input">Søg</label>
			<input
				id="event-search-input"
				type="text"
				value={searchTerm}
				onChange={(e) => onSearchTermChange(e.target.value)}
				placeholder="Søg efter navn, beskrivelse, kategori eller lokation"
			/>
		</div>

		<button type="button" className="event-searchbar-reset" onClick={onReset}>
			Nulstil
		</button>
	</section>
);

export default EventSearchBar;
