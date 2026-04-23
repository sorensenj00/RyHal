import React, { useMemo, useState } from 'react';
import CreateNewAssociationTemplate from '../../components/association/CreateNewAssociationTemplate';
import './Association.css';

const pickValue = (obj, ...keys) => {
	for (const key of keys) {
		if (obj && obj[key] !== undefined && obj[key] !== null) {
			return obj[key];
		}
	}

	return null;
};

const Association = () => {
	const [latestAssociation, setLatestAssociation] = useState(null);

	const latestAssociationName = useMemo(
		() => pickValue(latestAssociation, 'name', 'Name') || 'Ingen oprettet endnu',
		[latestAssociation]
	);

	const handleAssociationCreated = (createdAssociation) => {
		setLatestAssociation(createdAssociation);
	};

	return (
		<div className="association-page">
			<header className="association-page-header">
				<div>
					<h1>Foreninger</h1>
					<p>Opret en ny forening og gør den klar til kontaktpersoner og eventkoblinger.</p>
				</div>

				<div className="association-page-highlight">
					<span>Senest oprettet</span>
					<strong>{latestAssociationName}</strong>
				</div>
			</header>

			<div className="association-layout">
				<div className="association-main-column">
					<CreateNewAssociationTemplate onCreated={handleAssociationCreated} />
				</div>

				<aside className="association-info-panel">
					<h2>Næste trin</h2>
					<ul>
						<li>Tilføj kontaktpersoner til foreningen.</li>
						<li>Kobl foreningen på et event eller en eventserie.</li>
						<li>Brug foreningen i aktivitetsformularen ved oprettelse af events.</li>
					</ul>
				</aside>
			</div>
		</div>
	);
};

export default Association;
