import React, { useEffect, useMemo, useRef, useState } from 'react';
import { normalizeRoleColorToken, resolveRoleColorValue, toCssColorValue } from '../../../data/roleColors';
import api from '../../../api/axiosConfig';
import './EmployeeRoles.css';

const getRoleStyle = (roleColor) => {
	const cssColor = toCssColorValue(roleColor);
  return {
		backgroundColor: cssColor,
    color: '#fff',
  };
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
	const normalized = normalizeRoleColorToken(value);
	const resolved = resolveRoleColorValue(normalized);
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

const EmployeeRoles = () => {
	const [roles, setRoles] = useState([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [newRoleName, setNewRoleName] = useState('');
	const [newRoleColor, setNewRoleColor] = useState('--color-andet');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isCreating, setIsCreating] = useState(false);
	const [deletingRoleId, setDeletingRoleId] = useState(null);
	const [savingNameRoleId, setSavingNameRoleId] = useState(null);
	const [savingColorRoleId, setSavingColorRoleId] = useState(null);
	const [draftRoleNames, setDraftRoleNames] = useState({});
	const [draftRoleColors, setDraftRoleColors] = useState({});
	const [notice, setNotice] = useState(null);
	const createColorInputRef = useRef(null);
	const rowColorInputRefs = useRef({});

	const fetchRoles = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await api.get('/roles');
			const data = response.data || [];

			const nextRoles = (data || []).map((role) => ({
				role_id: role.roleId,
				name: role.name,
				color: normalizeRoleColorToken(role.color),
			}));

			setRoles(nextRoles);
			setDraftRoleNames(nextRoles.reduce((acc, role) => {
				acc[role.role_id] = role.name || '';
				return acc;
			}, {}));
			setDraftRoleColors(nextRoles.reduce((acc, role) => {
				acc[role.role_id] = normalizeRoleColorToken(role.color);
				return acc;
			}, {}));
		} catch (err) {
			console.error('Fejl ved hentning af roller:', err);
			setError('Kunne ikke hente roller fra systemet.');
		} finally {
			setLoading(false);
		}
	};

	const handleSaveRoleName = async (role) => {
		if (!role?.role_id) return;

		const nextName = (draftRoleNames[role.role_id] || '').trim();

		if (!nextName) {
			setNotice({ type: 'error', text: 'Rollenavn må ikke være tomt.' });
			return;
		}

		if (nextName === (role.name || '').trim()) {
			return;
		}

		try {
			setSavingNameRoleId(role.role_id);
			setNotice(null);

			await api.put(`/roles/${role.role_id}/name`, { name: nextName });

			setRoles((prev) => prev.map((item) => (
				item.role_id === role.role_id ? { ...item, name: nextName } : item
			)));
			setNotice({ type: 'success', text: `Rollen er omdøbt til ${nextName}.` });
		} catch (err) {
			console.error('Fejl ved opdatering af rollenavn:', err);
			const duplicateError = err?.response?.status === 409;
			const apiMessage = err?.response?.data?.message || err?.response?.data?.Message;
			setNotice({
				type: 'error',
				text: duplicateError ? 'Rollen findes allerede.' : (apiMessage || 'Kunne ikke opdatere rollenavnet.'),
			});
		} finally {
			setSavingNameRoleId(null);
		}
	};

	useEffect(() => {
		fetchRoles();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (!notice) return undefined;
		const timeoutId = setTimeout(() => setNotice(null), 3500);
		return () => clearTimeout(timeoutId);
	}, [notice]);

	const filteredRoles = useMemo(() => {
		const normalizedSearch = searchTerm.trim().toLowerCase();

		if (!normalizedSearch) {
			return roles;
		}

		return roles.filter((role) => (role.name || '').toLowerCase().includes(normalizedSearch));
	}, [roles, searchTerm]);

	const handleCreateRole = async (event) => {
		event.preventDefault();
		const normalizedName = newRoleName.trim();
		const normalizedColor = normalizeRoleColorToken(newRoleColor);

		if (!normalizedName) {
			setNotice({ type: 'error', text: 'Rollenavn må ikke være tomt.' });
			return;
		}

		try {
			setIsCreating(true);
			setNotice(null);

			await api.post('/roles', { name: normalizedName, color: normalizedColor });

			setNewRoleName('');
			setNewRoleColor('--color-andet');
			await fetchRoles();

			setNotice({
				type: 'success',
				text: `Rollen ${normalizedName} er oprettet.`,
			});
		} catch (err) {
			console.error('Fejl ved oprettelse af rolle:', err);
			const duplicateError = err?.response?.status === 409;
			const apiMessage = err?.response?.data?.message || err?.response?.data?.Message;
			const message = duplicateError
				? 'Rollen findes allerede.'
				: (apiMessage || 'Kunne ikke oprette rollen.');

			setNotice({
				type: 'error',
				text: message,
			});
		} finally {
			setIsCreating(false);
		}
	};

	const handleSaveRoleColor = async (role) => {
		if (!role?.role_id) return;

		const nextColor = normalizeRoleColorToken(draftRoleColors[role.role_id]);

		if (nextColor === normalizeRoleColorToken(role.color)) {
			return;
		}

		try {
			setSavingColorRoleId(role.role_id);
			setNotice(null);

			await api.put(`/roles/${role.role_id}/color`, { color: nextColor });

			setRoles((prev) => prev.map((item) => (
				item.role_id === role.role_id ? { ...item, color: nextColor } : item
			)));
			setNotice({ type: 'success', text: `Farven for ${role.name} blev opdateret.` });
		} catch (err) {
			console.error('Fejl ved opdatering af rollefarve:', err);
			const apiMessage = err?.response?.data?.message || err?.response?.data?.Message;
			setNotice({ type: 'error', text: apiMessage || 'Kunne ikke gemme rollefarven.' });
		} finally {
			setSavingColorRoleId(null);
		}
	};

	const handleDeleteRole = async (role) => {
		if (!role?.role_id) return;

		try {
			setDeletingRoleId(role.role_id);
			setNotice(null);

			await api.delete(`/roles/${role.role_id}`);

			setRoles((prev) => prev.filter((item) => item.role_id !== role.role_id));
			setNotice({ type: 'success', text: `Rollen ${role.name} blev slettet.` });
		} catch (err) {
			console.error('Fejl ved sletning af rolle:', err);
			const details = `${err?.response?.data?.details || ''} ${err?.message || ''}`.toLowerCase();
			const apiMessage = err?.response?.data?.message || err?.response?.data?.Message;
			const message = details.includes('foreign key') || err?.response?.status === 409
				? `Rollen ${role.name} er i brug og kan ikke slettes.`
				: (apiMessage || 'Kunne ikke slette rollen.');
			setNotice({ type: 'error', text: message });
		} finally {
			setDeletingRoleId(null);
		}
	};

	if (loading) {
		return <div className="employee-roles-page employee-roles-status">Henter roller...</div>;
	}

	if (error) {
		return <div className="employee-roles-page employee-roles-status employee-roles-error">{error}</div>;
	}

	return (
		<div className="employee-roles-page">
			<header className="employee-roles-header">
				<div>
					<p className="employee-roles-eyebrow">Systemopsætning</p>
					<h1>Roller</h1>
					<p className="employee-roles-subtitle">
						Se alle roller med globale farver, og opret eller slet roller i systemet.
					</p>
				</div>
			</header>

			<section className="employee-roles-create-card">
				<form className="employee-roles-create-form" onSubmit={handleCreateRole}>
					<div className="employee-roles-create-layout">
						<div className="employee-roles-create-fields">
							<label htmlFor="new-role-name">Nyt rollenavn</label>
							<div className="employee-roles-create-row">
								<input
									id="new-role-name"
									type="text"
									value={newRoleName}
									onChange={(event) => setNewRoleName(event.target.value)}
									placeholder="Fx Frivilligkoordinator"
									disabled={isCreating}
								/>
								<button type="submit" className="employee-roles-create-btn" disabled={isCreating}>
									{isCreating ? 'Opretter...' : 'Opret rolle'}
								</button>
							</div>
							<label htmlFor="new-role-color">Farve (CSS variabel eller hex)</label>
							<div className="employee-roles-create-row employee-roles-color-row">
								<input
									id="new-role-color"
									type="text"
									value={newRoleColor}
									onChange={(event) => setNewRoleColor(event.target.value)}
									placeholder="#94A3B8 eller --color-andet"
									disabled={isCreating}
								/>
								<div className="employee-roles-color-control">
									<button
										type="button"
										className="employee-roles-color-trigger"
										onClick={() => openColorPicker(createColorInputRef.current)}
										disabled={isCreating}
									>
										<span
											className="employee-roles-color-swatch"
											style={{ backgroundColor: toCssColorValue(newRoleColor) }}
										/>
										Vælg farve
									</button>
									<input
										ref={createColorInputRef}
										type="color"
										className="employee-roles-color-wheel-hidden"
										value={getColorPickerValue(newRoleColor)}
										onChange={(event) => setNewRoleColor(event.target.value)}
										disabled={isCreating}
										aria-label="Vælg farve med farvehjul"
									/>
								</div>
							</div>
						</div>
						<div className="employee-roles-create-preview">
							<p className="employee-roles-preview-label">Preview</p>
							<div className="employee-roles-preview-card">
								<span className="employee-roles-preview-title">Ny rolle</span>
								<span
									className="employee-roles-preview-badge"
									style={getRoleStyle(newRoleColor)}
								>
									{newRoleName.trim() || 'Eksempelrolle'}
								</span>
								<span className="employee-roles-preview-code">{newRoleColor}</span>
							</div>
						</div>
					</div>
				</form>
			</section>

			<section className="employee-roles-filters">
				<label htmlFor="employee-role-search">Søg rolle</label>
				<input
					id="employee-role-search"
					type="text"
					value={searchTerm}
					onChange={(event) => setSearchTerm(event.target.value)}
					placeholder="Fx Hal Mand eller Cafemedarbejder"
				/>
			</section>

			{notice && (
				<div
					className={`employee-roles-notice employee-roles-notice-${notice.type}`}
					role="status"
					aria-live="polite"
				>
					{notice.text}
				</div>
			)}

			<section className="employee-roles-table-card">
				<div className="employee-roles-table-header">
					<h2>Alle roller</h2>
					<span>{filteredRoles.length} roller</span>
				</div>

				<div className="employee-roles-table-wrap">
					<table className="employee-roles-table">
						<thead>
							<tr>
								<th>Rolle</th>
								<th>Opdater navn</th>
								<th>Farve</th>
								<th>Opdater farve</th>
								<th className="employee-roles-actions-col">Handling</th>
							</tr>
						</thead>
						<tbody>
							{filteredRoles.map((role) => {
								const isDeleting = deletingRoleId === role.role_id;
								const isSavingName = savingNameRoleId === role.role_id;
								const isSavingColor = savingColorRoleId === role.role_id;
								const draftName = draftRoleNames[role.role_id] || '';
								const draftColor = draftRoleColors[role.role_id] || '--color-andet';
								return (
									<tr key={role.role_id}>
										<td>
											<strong>{role.name}</strong>
										</td>
										<td>
											<div className="employee-roles-inline-edit employee-roles-inline-name-edit">
												<input
													type="text"
													value={draftName}
													onChange={(event) => setDraftRoleNames((prev) => ({
														...prev,
														[role.role_id]: event.target.value,
													}))}
													placeholder="Nyt rollenavn"
													disabled={isSavingName || isDeleting}
												/>
												<button
													type="button"
													className="employee-roles-save-name-btn"
													onClick={() => handleSaveRoleName(role)}
													disabled={isSavingName || isDeleting || !draftName.trim()}
												>
													{isSavingName ? 'Gemmer...' : 'Gem navn'}
												</button>
											</div>
										</td>
										<td>
											<span className="employee-roles-badge" style={getRoleStyle(role.color)}>
												{role.color || '--color-andet'}
											</span>
										</td>
										<td>
											<div className="employee-roles-inline-edit">
												<input
													type="text"
													value={draftColor}
													onChange={(event) => setDraftRoleColors((prev) => ({
														...prev,
														[role.role_id]: event.target.value,
													}))}
													placeholder="--color-andet eller #94A3B8"
													disabled={isSavingColor || isDeleting || isSavingName}
												/>
												<div className="employee-roles-color-control">
													<button
														type="button"
														className="employee-roles-color-trigger"
														onClick={() => openColorPicker(rowColorInputRefs.current[role.role_id])}
														disabled={isSavingColor || isDeleting || isSavingName}
													>
														<span
															className="employee-roles-color-swatch"
															style={{ backgroundColor: toCssColorValue(draftColor) }}
														/>
														Hjul
													</button>
													<input
														ref={(el) => {
															if (el) rowColorInputRefs.current[role.role_id] = el;
														}}
														type="color"
														className="employee-roles-color-wheel-hidden"
														value={getColorPickerValue(draftColor)}
														onChange={(event) => setDraftRoleColors((prev) => ({
															...prev,
															[role.role_id]: event.target.value,
														}))}
														disabled={isSavingColor || isDeleting || isSavingName}
														aria-label={`Vælg farve med farvehjul for ${role.name}`}
													/>
												</div>
												<button
													type="button"
													className="employee-roles-save-color-btn"
													onClick={() => handleSaveRoleColor(role)}
													disabled={isSavingColor || isDeleting || isSavingName}
												>
													{isSavingColor ? 'Gemmer...' : 'Gem farve'}
												</button>
											</div>
										</td>
										<td className="employee-roles-actions-col">
											<button
												type="button"
												className="employee-roles-delete-btn"
												disabled={isDeleting}
												onClick={() => handleDeleteRole(role)}
											>
												{isDeleting ? 'Sletter...' : 'Slet'}
											</button>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

				{filteredRoles.length === 0 && (
					<div className="employee-roles-empty-state">Ingen roller matcher søgningen.</div>
				)}
			</section>
		</div>
	);
};

export default EmployeeRoles;
