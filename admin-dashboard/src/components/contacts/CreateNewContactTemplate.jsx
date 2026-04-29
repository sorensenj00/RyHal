import React, { useState } from 'react';
import api from '../../api/axiosConfig';
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

const CreateNewContactTemplate = ({ onCreated }) => {
	const [name, setName] = useState('');
	const [title, setTitle] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [profileImageUrl, setProfileImageUrl] = useState('');
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
				title: title.trim() || null,
				profileImageUrl: normalizeUrl(profileImageUrl) || null,
				phone: phone.trim() || null,
				email: email.trim() || null
			};

			const response = await api.post('/contacts', payload);
			const createdContact = response?.data || null;

			setSuccessMsg('Kontaktpersonen er oprettet. Du kan nu koble personen på en forening eller et event.');
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
						type="email"
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
					<strong>Bemærk:</strong> Tilknytning til forening/event håndteres efter oprettelse.
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
