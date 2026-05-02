import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getAllAssociations } from '../../api/associationService';
import CreateNewContactTemplate from '../../components/contacts/CreateNewContactTemplate';
import ContactInformationCard from '../../components/contacts/ContactInformationCard';
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
	const [previewContact, setPreviewContact] = useState(null);
	const [latestContact, setLatestContact] = useState(null);
	const [associations, setAssociations] = useState([]);
	const [associationSearchTerm, setAssociationSearchTerm] = useState('');
	const [selectedAssociationId, setSelectedAssociationId] = useState(0);
	const [loadingAssociations, setLoadingAssociations] = useState(false);
	const [associationLoadError, setAssociationLoadError] = useState('');

	useEffect(() => {
		const loadAssociations = async () => {
			try {
				setLoadingAssociations(true);
				setAssociationLoadError('');
				const data = await getAllAssociations();
				setAssociations(Array.isArray(data) ? data : []);
			} catch (error) {
				console.error('Fejl ved indlæsning af foreninger:', error);
				setAssociationLoadError('Kunne ikke hente foreninger. Du kan stadig oprette kontaktpersonen.');
			} finally {
				setLoadingAssociations(false);
			}
		};

		loadAssociations();
	}, []);

	const associationOptions = useMemo(() => {
		const normalizedSearch = associationSearchTerm.trim().toLowerCase();

		return associations
			.map((association) => {
				const id = Number(pickValue(association, 'associationId', 'AssociationId', 'id')) || 0;
				const name = (pickValue(association, 'name', 'Name') || 'Ukendt forening').toString();
				const websiteUrl = (pickValue(association, 'websiteUrl', 'WebsiteUrl') || '').toString();

				return { id, name, websiteUrl };
			})
			.filter((association) => association.id > 0)
			.filter((association) => {
				if (!normalizedSearch) {
					return true;
				}

				const lowerName = association.name.toLowerCase();
				const lowerWebsite = association.websiteUrl.toLowerCase();
				return lowerName.includes(normalizedSearch) || lowerWebsite.includes(normalizedSearch);
			});
	}, [associations, associationSearchTerm]);

	const handleContactCreated = useCallback((createdContact) => {
		setLatestContact(createdContact);
		setPreviewContact(createdContact);
	}, []);

	const handlePreviewChange = useCallback((contactDraft) => {
		setPreviewContact(contactDraft);
	}, []);

	return (
		<div className="create-contact-page">
			<header className="create-contact-page-header">
				<h1>Opret kontakt</h1>
				<p>Udfyld formularen og se et live preview af kontaktpersonen til højre.</p>
			</header>

			<div className="create-contact-layout">
				<div className="create-contact-main-column">
					<CreateNewContactTemplate
						onCreated={handleContactCreated}
						onPreviewChange={handlePreviewChange}
						associationOptions={associationOptions}
						selectedAssociationId={selectedAssociationId}
						onSelectedAssociationIdChange={setSelectedAssociationId}
						associationSearchTerm={associationSearchTerm}
						onAssociationSearchTermChange={setAssociationSearchTerm}
						loadingAssociations={loadingAssociations}
						associationLoadError={associationLoadError}
					/>
				</div>

				<aside className="create-contact-preview-panel">
					<h2>Preview</h2>
					<ContactInformationCard contact={previewContact || latestContact} />
				</aside>
			</div>
		</div>
	);
};

export default CreateNewContact;
