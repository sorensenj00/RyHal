import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { supabase } from '../../supabaseClient';
import AssociationSearchBar from '../../components/search/AssociationSearchBar';
import ContactInformationCard from '../../components/contacts/ContactInformationCard';
import WebsitePreview from '../../components/association/WebsitePreview';
import {
	getAssociationTextColor,
	normalizeAssociationColorToken,
	resolveAssociationColorValue,
	toAssociationCssColorValue
} from '../../data/associationColors';
import './ViewAssociation.css';

const pickValue = (obj, ...keys) => {
	for (const key of keys) {
		if (obj && obj[key] !== undefined && obj[key] !== null) {
			return obj[key];
		}
	}

	return null;
};

const FALLBACK_PICKER_COLOR = '#94a3b8';

const expandHex = (hex) => {
	if (!hex) return null;
	const normalized = hex.trim().toLowerCase();
	if (/^#[0-9a-f]{6}$/i.test(normalized)) return normalized;
	if (!/^#[0-9a-f]{3}$/i.test(normalized)) return null;
	const r = normalized[1];
	const g = normalized[2];
	const b = normalized[3];
	return `#${r}${r}${g}${g}${b}${b}`;
};

const rgbToHex = (value) => {
	const match = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
	if (!match) return null;
	const [r, g, b] = [Number(match[1]), Number(match[2]), Number(match[3])];
	if ([r, g, b].some((channel) => Number.isNaN(channel) || channel < 0 || channel > 255)) {
		return null;
	}
	return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
};

const getColorPickerValue = (value) => {
	const normalized = normalizeAssociationColorToken(value);
	const resolved = resolveAssociationColorValue(normalized);

	return expandHex(resolved) || rgbToHex(resolved) || FALLBACK_PICKER_COLOR;
};

const openColorPicker = (input) => {
	if (!input) {
		return;
	}

	if (typeof input.showPicker === 'function') {
		input.showPicker();
		return;
	}

	input.focus();
	input.click();
};

const normalizeUrl = (value) => {
	const raw = typeof value === 'string' ? value.trim() : '';
	if (!raw) {
		return null;
	}

	if (/^https?:\/\//i.test(raw)) {
		return raw;
	}

	return `https://${raw}`;
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
	const [draftName, setDraftName] = useState('');
	const [draftWebsiteUrl, setDraftWebsiteUrl] = useState('');
	const [draftColor, setDraftColor] = useState('--color-andet');
	const [draftLogoUrl, setDraftLogoUrl] = useState('');
	const [savingAssociation, setSavingAssociation] = useState(false);
	const [deletingAssociation, setDeletingAssociation] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [uploadingLogo, setUploadingLogo] = useState(false);
	const [uploadError, setUploadError] = useState('');
	const colorInputRef = useRef(null);
	const logoFileInputRef = useRef(null);

	const handleLogoUpload = async (event) => {
		const file = event.target.files?.[0];
		if (!file || !supabase) return;

		const ext = file.name.split('.').pop();
		const fileName = `association-${Date.now()}.${ext}`;

		try {
			setUploadingLogo(true);
			setUploadError('');

			const { error } = await supabase.storage
				.from('association-logo')
				.upload(fileName, file, { upsert: true });

			if (error) throw error;

			const { data: { publicUrl } } = supabase.storage
				.from('association-logo')
				.getPublicUrl(fileName);

			setDraftLogoUrl(publicUrl);
		} catch (err) {
			console.error('Logo upload fejlede:', err);
			setUploadError('Upload fejlede. Prøv igen.');
		} finally {
			setUploadingLogo(false);
			event.target.value = '';
		}
	};

	const handleSaveAssociation = async () => {
		if (!selectedAssociation) {
			return;
		}

		const associationId = Number(pickValue(selectedAssociation, 'associationId', 'AssociationId')) || 0;
		if (!associationId) {
			return;
		}

		const trimmedName = draftName.trim();
		if (!trimmedName) {
			setError('Foreningsnavn må ikke være tomt.');
			return;
		}

		try {
			setSavingAssociation(true);
			setError('');
			const nextColor = normalizeAssociationColorToken(draftColor);
			const nextWebsiteUrl = normalizeUrl(draftWebsiteUrl);
			const nextLogoUrl = normalizeUrl(draftLogoUrl);

			await api.put(`/associations/${associationId}`, {
				name: trimmedName,
				websiteUrl: nextWebsiteUrl,
				color: nextColor,
				logo: nextLogoUrl
			});

			setAssociations((prev) => prev.map((association) => {
				const id = Number(pickValue(association, 'associationId', 'AssociationId')) || 0;
				if (id !== associationId) {
					return association;
				}

				return {
					...association,
					name: trimmedName,
					Name: trimmedName,
					websiteUrl: nextWebsiteUrl,
					WebsiteUrl: nextWebsiteUrl,
					color: nextColor,
					Color: nextColor,
					logo: nextLogoUrl,
					Logo: nextLogoUrl
				};
			}));
		} catch (saveError) {
			console.error('Kunne ikke opdatere forening:', saveError);
			setError('Kunne ikke gemme foreningen. Prøv igen.');
		} finally {
			setSavingAssociation(false);
		}
	};

	const handleDeleteAssociation = async () => {
		if (!selectedAssociation) {
			return;
		}

		const associationId = Number(pickValue(selectedAssociation, 'associationId', 'AssociationId')) || 0;
		const associationName = pickValue(selectedAssociation, 'name', 'Name') || 'foreningen';

		if (!associationId) {
			return;
		}

		try {
			setDeletingAssociation(true);
			setError('');

			await api.delete(`/associations/${associationId}`);

			setAssociations((previous) => previous.filter(
				(association) => Number(pickValue(association, 'associationId', 'AssociationId')) !== associationId
			));
			setShowDeleteConfirm(false);
		} catch (deleteError) {
			console.error('Kunne ikke slette forening:', deleteError);
			const apiMessage = deleteError?.response?.data?.message;
			const apiDetails = deleteError?.response?.data?.details;
			setError(apiMessage || apiDetails || `Kunne ikke slette ${associationName}. Prøv igen.`);
		} finally {
			setDeletingAssociation(false);
		}
	};

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

	useEffect(() => {
		if (filteredAssociations.length === 0) {
			if (selectedAssociationId !== 0) {
				setSelectedAssociationId(0);
			}
			return;
		}

		if (selectedAssociationId === 0) {
			return;
		}

		const exists = filteredAssociations.some(
			(association) => Number(pickValue(association, 'associationId', 'AssociationId')) === selectedAssociationId
		);

		if (!exists) {
			setSelectedAssociationId(Number(pickValue(filteredAssociations[0], 'associationId', 'AssociationId')) || 0);
		}
	}, [filteredAssociations, selectedAssociationId]);

	useEffect(() => {
		const selectedName = pickValue(selectedAssociation, 'name', 'Name') || '';
		const selectedWebsiteUrl = pickValue(selectedAssociation, 'websiteUrl', 'WebsiteUrl') || '';
		const selectedColor = pickValue(selectedAssociation, 'color', 'Color');
		const selectedLogo = pickValue(selectedAssociation, 'logo', 'Logo') || '';
		setDraftName(selectedName);
		setDraftWebsiteUrl(selectedWebsiteUrl);
		setDraftColor(normalizeAssociationColorToken(selectedColor));
		setDraftLogoUrl(selectedLogo);
	}, [selectedAssociation]);

	const selectedAssociationContacts = Array.isArray(selectedAssociation?.contacts) ? selectedAssociation.contacts : [];

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
						<div className="view-association-title-wrap">
							<h2
								className="view-association-colored-title"
								style={{
									backgroundColor: toAssociationCssColorValue(draftColor),
									color: getAssociationTextColor(draftColor)
								}}
							>
								{draftName || pickValue(selectedAssociation, 'name', 'Name') || 'Ukendt forening'}
							</h2>
						</div>
						<span>{selectedAssociationContacts.length} kontakter</span>
					</div>

					<div className="view-association-editor">
						<div className="view-association-editor-grid">
							<label>
								Foreningsnavn
								<input
									type="text"
									value={draftName}
									onChange={(event) => setDraftName(event.target.value)}
									placeholder="Foreningsnavn"
								/>
							</label>

							<label>
								Hjemmeside
								<input
									type="url"
									value={draftWebsiteUrl}
									onChange={(event) => setDraftWebsiteUrl(event.target.value)}
									placeholder="https://..."
								/>
							</label>

							<label>
							Logo
							<button
								type="button"
								className="view-association-logo-upload-btn"
								onClick={() => logoFileInputRef.current?.click()}
								disabled={uploadingLogo}
							>
								{draftLogoUrl ? (
									<img src={draftLogoUrl} alt="Logo" className="view-association-logo-thumb" />
								) : null}
								<span>{uploadingLogo ? 'Uploader...' : draftLogoUrl ? 'Skift logo' : 'Upload logo'}</span>
							</button>
							<input
								ref={logoFileInputRef}
								type="file"
								accept="image/*"
								style={{ display: 'none' }}
								onChange={handleLogoUpload}
							/>
							{uploadError && <span className="view-association-upload-error">{uploadError}</span>}
						</label>

						<label htmlFor="view-association-color-input">
							Foreningsfarve
							<input
								id="view-association-color-input"
								type="text"
								value={draftColor}
								onChange={(event) => setDraftColor(event.target.value)}
								placeholder="#94A3B8 eller --color-andet"
							/>
						</label>
						<button
							type="button"
							className="btn btn-secondary view-association-color-picker-trigger"
							onClick={() => openColorPicker(colorInputRef.current)}
							disabled={savingAssociation || deletingAssociation}
						>
							<span
								className="view-association-color-swatch"
								style={{ backgroundColor: toAssociationCssColorValue(draftColor) }}
							/>
							Vælg farve
						</button>
						<input
							ref={colorInputRef}
							type="color"
							className="view-association-color-wheel-hidden"
							value={getColorPickerValue(draftColor)}
							onChange={(event) => setDraftColor(event.target.value)}
							disabled={savingAssociation || deletingAssociation}
							aria-label="Vælg foreningsfarve"
						/>
					</div>
				</div>

				<div className="view-association-content-layout">
					<aside className="view-association-website-panel">
							<WebsitePreview
								websiteUrl={draftWebsiteUrl}
								logoUrl={draftLogoUrl}
								title="Foreningens hjemmeside"
								emptyMessage="Ingen hjemmeside angivet for denne forening."
							/>
						</aside>

						<div className="view-association-contact-block">
							<p className="view-association-caption">Kontaktpersoner</p>
							{selectedAssociationContacts.length > 0 ? (
								<div className="view-association-contact-cards">
									{selectedAssociationContacts.map((contact, index) => {
										const contactId = Number(pickValue(contact, 'contactId', 'ContactId')) || 0;
										const contactName = pickValue(contact, 'name', 'Name') || `kontakt-${index}`;

										return <ContactInformationCard key={contactId || contactName} contact={contact} />;
									})}
								</div>
							) : (
								<p className="view-association-muted">Ingen kontaktpersoner tilknyttet endnu.</p>
							)}
						</div>
					</div>

				</section>
			)}
					<div className="view-association-button-bar">
						<div className="view-association-button-bar-left" aria-hidden="true" />
						<div className="view-association-button-bar-right">
							<button
								type="button"
								className="btn btn-primary view-association-color-save"
								onClick={handleSaveAssociation}
								disabled={savingAssociation || deletingAssociation}
							>
								{savingAssociation ? 'Gemmer...' : 'Gem forening'}
							</button>
							<button
								type="button"
								className="btn btn-danger view-association-delete-action"
								onClick={() => setShowDeleteConfirm(true)}
								disabled={savingAssociation || deletingAssociation}
							>
								Slet forening
							</button>
						</div>
					</div>

			{showDeleteConfirm && selectedAssociation && (
				<div className="view-association-delete-modal-overlay" onClick={() => {
					if (!deletingAssociation) {
						setShowDeleteConfirm(false);
					}
				}}>
					<div
						className="view-association-delete-modal"
						role="dialog"
						aria-modal="true"
						aria-labelledby="view-association-delete-title"
						onClick={(event) => event.stopPropagation()}
					>
						<h3 id="view-association-delete-title">Slet forening?</h3>
						<p>
							Er du sikker på, at du vil slette <strong>{pickValue(selectedAssociation, 'name', 'Name')}</strong>?
							<br />
							Denne handling kan ikke fortrydes.
						</p>
						<div className="view-association-delete-modal-actions">
							<button
								type="button"
								className="btn btn-secondary"
								onClick={() => setShowDeleteConfirm(false)}
								disabled={deletingAssociation}
							>
								Annuller
							</button>
							<button
								type="button"
								className="btn btn-danger"
								onClick={handleDeleteAssociation}
								disabled={deletingAssociation}
							>
								{deletingAssociation ? 'Sletter...' : 'Ja, slet'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ViewAssociation;
