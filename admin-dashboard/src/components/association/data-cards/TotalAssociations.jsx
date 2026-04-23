import React from 'react';
import './TotalAssociations.css';

const TotalAssociations = ({ total = 0, filtered = 0, loading = false }) => {
	const showFilteredInfo = !loading && filtered !== total;

	return (
		<article className="total-associations-card" aria-live="polite">
			<p className="total-associations-label">Foreninger</p>
			<div className="total-associations-value-wrap">
				<span className="total-associations-value">
					{loading ? '...' : total}
				</span>
				<span className="total-associations-subtitle">Total oprettet</span>
			</div>

			{showFilteredInfo ? (
				<p className="total-associations-filtered">Viser {filtered} i nuværende filter</p>
			) : (
				<p className="total-associations-filtered">Ingen aktive filtre</p>
			)}
		</article>
	);
};

export default TotalAssociations;
