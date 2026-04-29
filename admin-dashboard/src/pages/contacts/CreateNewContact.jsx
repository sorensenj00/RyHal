import React, { useMemo, useState } from 'react';
import CreateNewContactTemplate from '../../components/contacts/CreateNewContactTemplate';
import './CreateNewContact.css';

const pickValue = (obj, ...keys) => {
	for (const key of keys) {
		if (obj && obj[key] !== undefined && obj[key] !== null) {
			return obj[key];
		}
	}

	return null;
};

const CreateNewContact = () => {
	const [latestContact, setLatestContact] = useState(null);

	const latestContactName = useMemo(
		() => pickValue(latestContact, 'name', 'Name') || 'Ingen oprettet endnu',
		[latestContact]
	);

	const handleContactCreated = (createdContact) => {
		setLatestContact(createdContact);
	};

	return (
		<div className="create-contact-page">
			<header className="create-contact-page-header">
				<div>
					<h1>Kontakter</h1>
					<p>Opret en ny kontaktperson til foreninger og events.</p>
				</div>

				<div className="create-contact-page-highlight">
					<span>Senest oprettet</span>
					<strong>{latestContactName}</strong>
				</div>
			</header>

			<div className="create-contact-layout">
				<div className="create-contact-main-column">
					<CreateNewContactTemplate onCreated={handleContactCreated} />
				</div>

				<aside className="create-contact-info-panel">
					<h2>Næste trin</h2>
					<ul>
						<li>Kobl kontaktpersonen på en eller flere foreninger.</li>
						<li>Kobl kontaktpersonen direkte på relevante events.</li>
						<li>Hold kontaktinfo opdateret til planlægning og koordinering.</li>
					</ul>
				</aside>
			</div>
		</div>
	);
};

export default CreateNewContact;
