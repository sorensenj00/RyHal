import React, { useEffect, useState } from 'react';
import api from '../../api/axiosConfig';
import { linkContactToAssociation } from '../../api/associationService';
import AssociationSearchBar from '../search/AssociationSearchBar';
import './CreateNewContactTemplate.css';

const normalizeUrl = (value) => {
	const trimmed = value.trim();
	if (!trimmed) {
		return '';
	}

	if (/^https?:\/\//i.test(trimmed)) {
		return trimmed;
	}

	return `https://${trimmed}`;
};

const normalizeText = (value) => value.trim().normalize('NFC');

const pickValue = (obj, ...keys) => {
	for (const key of keys) {
		if (obj && obj[key] !== undefined && obj[key] !== null) {
			return obj[key];
		}
	}

	return null;
};

const CreateNewContactTemplate = ({
	onCreated,
	onPreviewChange,
	associationOptions = [],
	selectedAssociationId = 0,
	onSelectedAssociationIdChange,
	associationSearchTerm = '',
	onAssociationSearchTermChange,
	loadingAssociations = false,
	associationLoadError = ''
}) => {
	const [name, setName] = useState('');
	const [title, setTitle] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [profileImageUrl, setProfileImageUrl] = useState('');
	const [showAssociationSelector, setShowAssociationSelector] = useState(Boolean(selectedAssociationId));
	const [loading, setLoading] = useState(false);
	const [successMsg, setSuccessMsg] = useState('');
	const [errorMsg, setErrorMsg] = useState('');

	const resetMessages = () => {
		setSuccessMsg('');
		setErrorMsg('');
	};

	useEffect(() => {
		if (!onPreviewChange) {
			return;
		}

		const draft = {
			name: normalizeText(name),
			title: normalizeText(title) || null,
			email: normalizeText(email) || null,
			phone: normalizeText(phone) || null,
			profileImageUrl: normalizeUrl(profileImageUrl) || null
		};

		if (!draft.name && !draft.title && !draft.email && !draft.phone && !draft.profileImageUrl) {
			onPreviewChange(null);
			return;
		}

		onPreviewChange(draft);
	}, [name, title, email, phone, profileImageUrl, onPreviewChange]);

	useEffect(() => {
		if ((Number(selectedAssociationId) || 0) > 0) {
			setShowAssociationSelector(true);
		}
	}, [selectedAssociationId]);

	const handleSubmit = async (event) => {
		event.preventDefault();
		resetMessages();
		setLoading(true);

		try {
			const payload = {
				name: normalizeText(name),
				title: normalizeText(title) || null,
				profileImageUrl: normalizeUrl(profileImageUrl) || null,
				phone: normalizeText(phone) || null,
				email: normalizeText(email) || null
			};

			const response = await api.post('/contacts', payload);
			const createdContact = response?.data || null;
			const createdContactId = Number(pickValue(createdContact, 'contactId', 'ContactId', 'id', 'Id')) || 0;
			const selectedAssociation = Number(selectedAssociationId) || 0;

			if (selectedAssociation > 0 && createdContactId > 0) {
				await linkContactToAssociation(selectedAssociation, createdContactId);
				setSuccessMsg('Kontaktpersonen er oprettet og tilknyttet den valgte forening.');
			} else {
				setSuccessMsg('Kontaktpersonen er oprettet. Du kan nu koble personen på en forening eller et event.');
			}

			setName('');
			setTitle('');
			setEmail('');
			setPhone('');
			setProfileImageUrl('');

			if (onCreated) {
				onCreated(createdContact);
			}
		} catch (error) {
			const apiError = error?.response?.data;
			const validationErrors = apiError?.errors
				? Object.values(apiError.errors).flat().join(' ')
				: '';

			setErrorMsg(
				(typeof apiError === 'string' ? apiError : validationErrors || apiError?.message || apiError?.title)
				|| 'Kunne ikke oprette kontaktpersonen.'
			);

			if (error?.response?.status !== 400) {
				const fallbackText = (typeof apiError === 'string' ? apiError : apiError?.message || apiError?.title || '').toString().toLowerCase();
				if (fallbackText.includes('forening') || fallbackText.includes('association')) {
					setErrorMsg('Kontaktpersonen blev oprettet, men kunne ikke tilknyttes den valgte forening.');
				}
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<section className="create-contact-template-card">
			<div className="create-contact-template-header">
				<h2>Opret ny kontakt</h2>
				<p>Kontaktpersonen kan efterfølgende kobles på foreninger og events.</p>
			</div>

			{successMsg && <div className="create-contact-feedback success">{successMsg}</div>}
			{errorMsg && <div className="create-contact-feedback error">{errorMsg}</div>}

			<form className="create-contact-form" onSubmit={handleSubmit}>
				<label>
					Navn
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="F.eks. Anders Jensen"
						required
					/>
				</label>

				<div className="create-contact-form-row">
					<label>
						Titel
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="F.eks. Formand"
						/>
					</label>

					<label>
						Telefon
						<input
							type="tel"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							placeholder="F.eks. 20 30 40 50"
						/>
					</label>
				</div>

				<label>
					Email
					<input
						type="text"
						inputMode="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="navn@mail.dk"
					/>
				</label>

				<label>
					Profilbillede URL
					<input
						type="url"
						value={profileImageUrl}
						onChange={(e) => setProfileImageUrl(e.target.value)}
						placeholder="https://..."
					/>
				</label>

				<div className="create-contact-form-note">
					<strong>Bemærk:</strong> Vælger du en forening nedenfor, bliver kontaktpersonen tilknyttet automatisk ved oprettelse.
				</div>

				<div className="create-contact-association-linker">
					{!showAssociationSelector && (
						<button
							type="button"
							className="create-contact-add-association-btn"
							onClick={() => setShowAssociationSelector(true)}
						>
							Tilføj forening
						</button>
					)}

					{showAssociationSelector && (
						<>
							<AssociationSearchBar
								associationOptions={associationOptions}
								selectedAssociationId={selectedAssociationId}
								onSelectedAssociationIdChange={onSelectedAssociationIdChange}
								searchTerm={associationSearchTerm}
								onSearchTermChange={onAssociationSearchTermChange}
								showContactsFilter={false}
								associationLabel="Forening (valgfrit)"
								searchPlaceholder="Søg efter foreningens navn"
								resetLabel="Ryd valg"
							/>

							{loadingAssociations && <p className="create-contact-association-status">Indlæser foreninger...</p>}
							{associationLoadError && <p className="create-contact-association-status error">{associationLoadError}</p>}
						</>
					)}
				</div>

				<div className="create-contact-form-actions">
					<button type="submit" disabled={loading}>
						{loading ? 'Opretter...' : 'Opret kontakt'}
					</button>
				</div>
			</form>
		</section>
	);
};

export default CreateNewContactTemplate;
