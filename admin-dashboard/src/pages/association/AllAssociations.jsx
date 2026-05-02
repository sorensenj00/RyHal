import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import AssociationList from '../../components/association/AssociationList';
import TotalAssociations from '../../components/association/data-cards/TotalAssociations';
import './AllAssociations.css';

const pickValue = (obj, ...keys) => {
	for (const key of keys) {
		if (obj && obj[key] !== undefined && obj[key] !== null) {
			return obj[key];
		}
	}

	return null;
};

const AllAssociations = () => {
	const navigate = useNavigate();
	const [associations, setAssociations] = useState([]);
	const [loadingAssociations, setLoadingAssociations] = useState(true);
	const [associationsError, setAssociationsError] = useState('');
	const [searchTerm, setSearchTerm] = useState('');
	const [hasContactsFilter, setHasContactsFilter] = useState('ALL');

	const handleOpenAssociation = (associationId) => {
		navigate('/view-association', {
			state: { associationId: Number(associationId) || 0 }
		});
	};

	useEffect(() => {
		const fetchAssociations = async () => {
			try {
				setLoadingAssociations(true);
				setAssociationsError('');
				const response = await api.get('/associations');
				setAssociations(Array.isArray(response.data) ? response.data : []);
			} catch (error) {
				console.error('Kunne ikke hente foreninger:', error);
				setAssociations([]);
				setAssociationsError('Kunne ikke hente foreninger fra serveren.');
			} finally {
				setLoadingAssociations(false);
			}
		};

		fetchAssociations();
	}, []);

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

	return (
		<div className="all-associations-page">
			<header className="all-associations-header">
				<h1>Alle Foreninger</h1>
			</header>

			<div className="all-associations-layout">
				<div className="all-associations-list-column">
					<AssociationList
						associations={filteredAssociations}
						loading={loadingAssociations}
						error={associationsError}
						searchTerm={searchTerm}
						onSearchTermChange={setSearchTerm}
						hasContactsFilter={hasContactsFilter}
						onHasContactsFilterChange={setHasContactsFilter}
						onAssociationOpen={handleOpenAssociation}
					/>
				</div>

				<aside className="all-associations-cards-column">
					<TotalAssociations
						total={associations.length}
						filtered={filteredAssociations.length}
						loading={loadingAssociations}
					/>

					<article className="all-associations-data-card">
						<h2>Data card 2</h2>
						<p>Plads til seneste aktivitet eller trends.</p>
					</article>

					<article className="all-associations-data-card">
						<h2>Data card 3</h2>
						<p>Plads til ekstra foreningsindsigter.</p>
					</article>
				</aside>
			</div>
		</div>
	);
};

export default AllAssociations;
