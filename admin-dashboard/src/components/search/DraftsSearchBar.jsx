import React from 'react';
import './DraftsSearchBar.css';

const DraftsSearchBar = ({
	searchTerm,
	onSearchTermChange,
	categoryFilter,
	onCategoryFilterChange,
	timeFilter,
	onTimeFilterChange,
	availableCategories = []
}) => {
	return (
		<section className="drafts-searchbar" aria-label="Søg og filter kladder">
			<div className="drafts-searchbar-group text">
				<label htmlFor="draft-search-input">Søg</label>
				<input
					id="draft-search-input"
					type="text"
					value={searchTerm}
					onChange={(e) => onSearchTermChange(e.target.value)}
					placeholder="Søg efter navn, beskrivelse eller lokation"
				/>
			</div>

			<div className="drafts-searchbar-group">
				<label htmlFor="draft-category-filter">Kategori</label>
				<select
					id="draft-category-filter"
					value={categoryFilter}
					onChange={(e) => onCategoryFilterChange(e.target.value)}
				>
					<option value="ALL">Alle</option>
					{availableCategories.map((cat) => (
						<option key={cat} value={cat}>{cat}</option>
					))}
				</select>
			</div>

			<div className="drafts-searchbar-group">
				<label htmlFor="draft-time-filter">Tidstatus</label>
				<select
					id="draft-time-filter"
					value={timeFilter}
					onChange={(e) => onTimeFilterChange(e.target.value)}
				>
					<option value="ALL">Alle</option>
					<option value="WITH_TIME">Med start/slut tid</option>
					<option value="WITHOUT_TIME">Uden start/slut tid</option>
				</select>
			</div>

			<button
				type="button"
				className="drafts-searchbar-reset"
				onClick={() => {
					onSearchTermChange('');
					onCategoryFilterChange('ALL');
					onTimeFilterChange('ALL');
				}}
			>
				Nulstil
			</button>
		</section>
	);
};

export default DraftsSearchBar;
