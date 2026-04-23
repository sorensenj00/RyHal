import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axiosConfig';
import AssociationSearchBar from '../../components/search/AssociationSearchBar';
import './ViewAssociation.css';

const pickValue = (obj, ...keys) => {
	for (const key of keys) {
		if (obj && obj[key] !== undefined && obj[key] !== null) {
			return obj[key];
		}
	}

	return null;
};

const ViewAssociation = () => {
	const location = useLocation();
	const preselectedAssociationId = Number(location.state?.associationId) || 0;

	const [associations, setAssociations] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [selectedAssociationId, setSelectedAssociationId] = useState(0);
	const [searchTerm, setSearchTerm] = useState('');
	const [hasContactsFilter, setHasContactsFilter] = useState('ALL');

	useEffect(() => {
		const fetchAssociations = async () => {
			try {
				setLoading(true);
				setError('');

				const response = await api.get('/associations');
				const list = Array.isArray(response.data) ? response.data : [];
				setAssociations(list);

				if (list.length === 0) {
					setSelectedAssociationId(0);
					return;
				}

				if (preselectedAssociationId > 0) {
					const exists = list.some(
						(association) => Number(pickValue(association, 'associationId', 'AssociationId')) === preselectedAssociationId
					);

					if (exists) {
						setSelectedAssociationId(preselectedAssociationId);
						return;
					}
				}

				const randomAssociation = list[Math.floor(Math.random() * list.length)];
				setSelectedAssociationId(Number(pickValue(randomAssociation, 'associationId', 'AssociationId')) || 0);
			} catch (fetchError) {
				console.error('Kunne ikke hente foreninger:', fetchError);
				setAssociations([]);
				setError('Kunne ikke hente foreninger fra serveren.');
			} finally {
				setLoading(false);
			}
		};

		fetchAssociations();
	}, [preselectedAssociationId]);

	const filteredAssociations = useMemo(() => {
		const normalizedSearch = searchTerm.trim().toLowerCase();

		return associations.filter((association) => {
			const contacts = Array.isArray(association?.contacts) ? association.contacts : [];
			const hasContacts = contacts.length > 0;

			if (hasContactsFilter === 'WITH_CONTACTS' && !hasContacts) {
				return false;
			}

			if (hasContactsFilter === 'WITHOUT_CONTACTS' && hasContacts) {
				return false;
			}

			if (!normalizedSearch) {
				return true;
			}

			const haystack = [
				pickValue(association, 'name', 'Name'),
				pickValue(association, 'websiteUrl', 'WebsiteUrl'),
				...contacts.map((contact) => pickValue(contact, 'name', 'Name'))
			]
				.filter(Boolean)
				.join(' ')
				.toLowerCase();

			return haystack.includes(normalizedSearch);
		});
	}, [associations, hasContactsFilter, searchTerm]);

	const associationOptions = filteredAssociations.map((association) => ({
		id: Number(pickValue(association, 'associationId', 'AssociationId')) || 0,
		name: pickValue(association, 'name', 'Name') || 'Ukendt forening'
	}));

	const selectedAssociation = useMemo(() => {
		if (selectedAssociationId > 0) {
			return filteredAssociations.find(
				(association) => Number(pickValue(association, 'associationId', 'AssociationId')) === selectedAssociationId
			) || null;
		}

		return filteredAssociations[0] || null;
	}, [filteredAssociations, selectedAssociationId]);

	return (
		<div className="view-association-page">
			<header className="view-association-header">
				<h1>Se Forening</h1>
				<p>Vælg en forening fra listen og se dens data samlet.</p>
			</header>

			<div className="view-association-search-wrap">
				<AssociationSearchBar
					searchTerm={searchTerm}
					onSearchTermChange={setSearchTerm}
					hasContactsFilter={hasContactsFilter}
					onHasContactsFilterChange={setHasContactsFilter}
					associationOptions={associationOptions}
					selectedAssociationId={selectedAssociationId}
					onSelectedAssociationIdChange={setSelectedAssociationId}
				/>
			</div>

			{loading && <p className="view-association-status">Henter forening...</p>}
			{!loading && error && <p className="view-association-status error">{error}</p>}

			{!loading && !error && !selectedAssociation && (
				<p className="view-association-status">Ingen forening matcher dit filter.</p>
			)}

			{!loading && !error && selectedAssociation && (
				<section className="view-association-card">
					<div className="view-association-card-header">
						<h2>{pickValue(selectedAssociation, 'name', 'Name') || 'Ukendt forening'}</h2>
						<span>
							{(Array.isArray(selectedAssociation?.contacts) ? selectedAssociation.contacts.length : 0)} kontakter
						</span>
					</div>

					{pickValue(selectedAssociation, 'websiteUrl', 'WebsiteUrl') ? (
						<a
							className="view-association-link"
							href={pickValue(selectedAssociation, 'websiteUrl', 'WebsiteUrl')}
							target="_blank"
							rel="noreferrer"
						>
							{pickValue(selectedAssociation, 'websiteUrl', 'WebsiteUrl')}
						</a>
					) : (
						<p className="view-association-muted">Ingen hjemmeside angivet.</p>
					)}

					<div className="view-association-contact-block">
						<p className="view-association-caption">Kontaktpersoner</p>
						{(Array.isArray(selectedAssociation?.contacts) ? selectedAssociation.contacts.length : 0) > 0 ? (
							<ul className="view-association-contact-list">
								{(selectedAssociation.contacts || []).map((contact) => {
									const contactId = Number(pickValue(contact, 'contactId', 'ContactId')) || 0;
									const name = pickValue(contact, 'name', 'Name') || 'Ukendt kontakt';
									const title = pickValue(contact, 'title', 'Title');
									const email = pickValue(contact, 'email', 'Email');
									const phone = pickValue(contact, 'phone', 'Phone');

									return (
										<li key={contactId || name} className="view-association-contact-item">
											<strong>{name}</strong>
											<span>{[title, email, phone].filter(Boolean).join(' · ') || 'Ingen detaljer'}</span>
										</li>
									);
								})}
							</ul>
						) : (
							<p className="view-association-muted">Ingen kontaktpersoner tilknyttet endnu.</p>
						)}
					</div>
				</section>
			)}
		</div>
	);
};

export default ViewAssociation;
