import React, { useState } from 'react';
import api from '../../api/axiosConfig';

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

const CreateNewAssociationTemplate = ({ onCreated }) => {
	const [name, setName] = useState('');
	const [websiteUrl, setWebsiteUrl] = useState('');
	const [loading, setLoading] = useState(false);
	const [successMsg, setSuccessMsg] = useState('');
	const [errorMsg, setErrorMsg] = useState('');

	const resetMessages = () => {
		setSuccessMsg('');
		setErrorMsg('');
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		resetMessages();
		setLoading(true);

		try {
			const payload = {
				name: name.trim(),
				websiteUrl: normalizeUrl(websiteUrl)
			};

			const response = await api.post('/associations', payload);
			const createdAssociation = response?.data || null;

			setSuccessMsg('Foreningen er oprettet og klar til at få kontaktpersoner koblet på.');
			setName('');
			setWebsiteUrl('');

			if (onCreated) {
				onCreated(createdAssociation);
			}
		} catch (error) {
			const apiError = error?.response?.data;
			const validationErrors = apiError?.errors
				? Object.values(apiError.errors).flat().join(' ')
				: '';

			setErrorMsg(
				(typeof apiError === 'string' ? apiError : validationErrors || apiError?.message || apiError?.title)
				|| 'Kunne ikke oprette foreningen.'
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<section className="association-template-card">
			<div className="association-template-header">
				<h2>Opret ny forening</h2>
				<p>Opret grunddata nu. Kontaktpersoner kan kobles på bagefter.</p>
			</div>

			{successMsg && <div className="association-feedback success">{successMsg}</div>}
			{errorMsg && <div className="association-feedback error">{errorMsg}</div>}

			<form className="association-form" onSubmit={handleSubmit}>
				<label>
					Foreningsnavn
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="F.eks. RyHal Badmintonklub"
						required
					/>
				</label>

				<label>
					Hjemmeside
					<input
						type="url"
						value={websiteUrl}
						onChange={(e) => setWebsiteUrl(e.target.value)}
						placeholder="www.eksempel.dk"
					/>
				</label>

				<div className="association-form-note">
					<strong>Bemærk:</strong> Kontaktpersoner og kobling til events sættes op efter oprettelsen.
				</div>

				<div className="association-form-actions">
					<button type="submit" disabled={loading}>
						{loading ? 'Opretter...' : 'Opret forening'}
					</button>
				</div>
			</form>
		</section>
	);
};

export default CreateNewAssociationTemplate;
