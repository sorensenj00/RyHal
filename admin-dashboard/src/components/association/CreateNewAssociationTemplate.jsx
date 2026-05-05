import React, { useEffect, useRef, useState } from 'react';
import api from '../../api/axiosConfig';
import {
	normalizeAssociationColorToken,
	resolveAssociationColorValue,
	toAssociationCssColorValue
} from '../../data/associationColors';
import WebsitePreview from './WebsitePreview';

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

const CreateNewAssociationTemplate = ({ onCreated, onPreviewChange, onLoadingStateChange }) => {
	const [name, setName] = useState('');
	const [websiteUrl, setWebsiteUrl] = useState('');
	const [logoUrl, setLogoUrl] = useState('');
	const [color, setColor] = useState('--color-andet');
	const [loading, setLoading] = useState(false);
	const [successMsg, setSuccessMsg] = useState('');
	const [errorMsg, setErrorMsg] = useState('');
	const colorInputRef = useRef(null);

	useEffect(() => {
		if (!onPreviewChange) {
			return;
		}

		const normalizedName = name.trim();
		const normalizedUrl = normalizeUrl(websiteUrl);

		if (!normalizedName && !normalizedUrl && !color) {
			onPreviewChange(null);
			return;
		}

		const draft = {
			name: normalizedName,
			websiteUrl: normalizedUrl || null,
			color: color,
			colorValue: toAssociationCssColorValue(color)
		};

		onPreviewChange(draft);
	}, [name, websiteUrl, color, onPreviewChange]);

	useEffect(() => {
		if (onLoadingStateChange) {
			onLoadingStateChange(loading);
		}
	}, [loading, onLoadingStateChange]);

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
				websiteUrl: normalizeUrl(websiteUrl),
				color: normalizeAssociationColorToken(color),
				logo: normalizeUrl(logoUrl) || null
			};

			const response = await api.post('/associations', payload);
			const createdAssociation = response?.data || null;

			setSuccessMsg('Foreningen er oprettet og klar til at få kontaktpersoner koblet på.');
			setName('');	
			setWebsiteUrl('');
			setLogoUrl('');
			setColor('--color-andet');

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
			</div>

			{successMsg && <div className="association-feedback success">{successMsg}</div>}
			{errorMsg && <div className="association-feedback error">{errorMsg}</div>}

			<form id="create-association-form" className="association-form" onSubmit={handleSubmit}>
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

				<div className="association-website-preview-wrap">
					<WebsitePreview
						websiteUrl={websiteUrl}
						logoUrl={logoUrl}
						title="Preview af hjemmeside"
						emptyMessage="Tilfoej en hjemmeside for at se preview."
					/>
				</div>

				<label>
					Logo URL (bruges hvis preview er blokeret)
					<input
						type="url"
						value={logoUrl}
						onChange={(e) => setLogoUrl(e.target.value)}
						placeholder="https://..."
					/>
				</label>

				<label>
					Farve (CSS variabel eller hex)
					<input
						type="text"
						value={color}
						onChange={(e) => setColor(e.target.value)}
						placeholder="#94A3B8 eller --color-andet"
					/>
				</label>

				<div className="association-color-preview-row">
					<button
						type="button"
						className="association-color-picker-trigger"
						onClick={() => openColorPicker(colorInputRef.current)}
					>
						<span
							className="association-color-swatch"
							style={{ backgroundColor: toAssociationCssColorValue(color) }}
						/>
						Vælg farve
					</button>
					<input
						ref={colorInputRef}
						type="color"
						className="association-color-wheel-hidden"
						value={getColorPickerValue(color)}
						onChange={(e) => setColor(e.target.value)}
						aria-label="Vælg foreningsfarve"
					/>
					<span
						className="association-color-preview-pill"
						style={{ backgroundColor: toAssociationCssColorValue(color) }}
					>
						{name.trim() || 'Ny forening'}
					</span>
				</div>

				<div className="association-form-note">
					<strong>Bemærk:</strong> Kontaktpersoner og kobling til events sættes op efter oprettelsen.
				</div>

			</form>
		</section>
	);
};

export default CreateNewAssociationTemplate;
