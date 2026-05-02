import React, { useEffect, useMemo, useState } from 'react';
import './WebsitePreview.css';

const normalizeUrl = (value) => {
	const raw = typeof value === 'string' ? value.trim() : '';
	if (!raw) return '';
	if (/^https?:\/\//i.test(raw)) return raw;
	return `https://${raw}`;
};

const getHostname = (url) => {
	try {
		return new URL(url).hostname;
	} catch {
		return '';
	}
};

const WebsitePreview = ({
	websiteUrl,
	logoUrl,
	title = 'Hjemmeside-preview',
	emptyMessage = 'Ingen hjemmeside angivet.'
}) => {
	const normalizedUrl = useMemo(() => normalizeUrl(websiteUrl), [websiteUrl]);
	const normalizedLogoUrl = useMemo(() => normalizeUrl(logoUrl), [logoUrl]);
	const hostname = useMemo(() => getHostname(normalizedUrl), [normalizedUrl]);
	const [logoFailed, setLogoFailed] = useState(false);
	const fallbackInitial = (hostname || 'F').charAt(0).toUpperCase();

	useEffect(() => {
		setLogoFailed(false);
	}, [normalizedLogoUrl]);

	if (!normalizedUrl) {
		return (
			<section className="website-preview-card">
				<div className="website-preview-header">
					<h3>{title}</h3>
				</div>
				<p className="website-preview-empty">{emptyMessage}</p>
			</section>
		);
	}

	return (
		<section className="website-preview-card website-preview-card--blocked">
			<div className="website-preview-header">
				<h3>{title}</h3>
				{hostname && <span className="website-preview-hostname">{hostname}</span>}
			</div>
			<a
				href={normalizedUrl}
				target="_blank"
				rel="noreferrer"
				className="website-preview-blocked-body"
			>
				{normalizedLogoUrl && !logoFailed ? (
					<img
						src={normalizedLogoUrl}
						alt="Foreningslogo"
						className="website-preview-blocked-logo"
						onError={() => setLogoFailed(true)}
					/>
				) : (
					<div className="website-preview-logo-fallback">{fallbackInitial}</div>
				)}
				<span className="website-preview-blocked-label">Besøg hjemmeside</span>
			</a>
			<a href={normalizedUrl} target="_blank" rel="noreferrer" className="website-preview-link">{normalizedUrl}</a>
		</section>
	);
};

export default WebsitePreview;