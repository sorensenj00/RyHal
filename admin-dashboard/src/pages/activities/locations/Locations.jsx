import React, { useEffect, useMemo, useState } from 'react';
import api from '../../../api/axiosConfig';
import './Locations.css';

const Locations = () => {
	const [locations, setLocations] = useState([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [newLocationName, setNewLocationName] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isCreating, setIsCreating] = useState(false);
	const [deletingLocationId, setDeletingLocationId] = useState(null);
	const [savingNameLocationId, setSavingNameLocationId] = useState(null);
	const [draftLocationNames, setDraftLocationNames] = useState({});

	const fetchLocations = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await api.get('/locations');
			const data = response.data || [];

			const nextLocations = data.map((loc) => ({
				location_id: loc.id,
				name: loc.name,
			}));

			setLocations(nextLocations);
			setDraftLocationNames(nextLocations.reduce((acc, loc) => {
				acc[loc.location_id] = loc.name || '';
				return acc;
			}, {}));
		} catch (err) {
			console.error('Fejl ved hentning af lokationer:', err);
			setError('Kunne ikke hente lokationer fra systemet.');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLocations();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const filteredLocations = useMemo(() => {
		const normalizedSearch = searchTerm.trim().toLowerCase();
		if (!normalizedSearch) return locations;
		return locations.filter((loc) => (loc.name || '').toLowerCase().includes(normalizedSearch));
	}, [locations, searchTerm]);

	const handleCreateLocation = async (event) => {
		event.preventDefault();
		const normalizedName = newLocationName.trim();

		if (!normalizedName) return;

		try {
			setIsCreating(true);

			await api.post('/locations', { name: normalizedName });

			setNewLocationName('');
			await fetchLocations();
		} catch (err) {
			console.error('Fejl ved oprettelse af lokation:', err);
		} finally {
			setIsCreating(false);
		}
	};

	const handleSaveLocationName = async (loc) => {
		if (!loc?.location_id) return;

		const nextName = (draftLocationNames[loc.location_id] || '').trim();

		if (!nextName) return;

		if (nextName === (loc.name || '').trim()) return;

		try {
			setSavingNameLocationId(loc.location_id);

			await api.put(`/locations/${loc.location_id}/name`, { name: nextName });

			setLocations((prev) => prev.map((item) => (
				item.location_id === loc.location_id ? { ...item, name: nextName } : item
			)));
		} catch (err) {
			console.error('Fejl ved opdatering af lokationsnavn:', err);
		} finally {
			setSavingNameLocationId(null);
		}
	};

	const handleDeleteLocation = async (loc) => {
		if (!loc?.location_id) return;

		try {
			setDeletingLocationId(loc.location_id);

			await api.delete(`/locations/${loc.location_id}`);

			setLocations((prev) => prev.filter((item) => item.location_id !== loc.location_id));
		} catch (err) {
			console.error('Fejl ved sletning af lokation:', err);
		} finally {
			setDeletingLocationId(null);
		}
	};

	if (loading) {
		return <div className="locations-page locations-status">Henter lokationer...</div>;
	}

	if (error) {
		return <div className="locations-page locations-status locations-error">{error}</div>;
	}

	return (
		<div className="locations-page">
			<header className="locations-header">
				<div>
					<h1>Lokationer</h1>
				</div>
			</header>

			<section className="locations-create-card">
				<form className="locations-create-form" onSubmit={handleCreateLocation}>
					<div className="locations-create-fields">
						<label htmlFor="new-location-name">Ny lokation</label>
						<div className="locations-create-row">
							<input
								id="new-location-name"
								type="text"
								value={newLocationName}
								onChange={(event) => setNewLocationName(event.target.value)}
								placeholder="Fx Hal 1 eller Mødelokale A"
								disabled={isCreating}
							/>
							<button type="submit" className="locations-create-btn" disabled={isCreating}>
								{isCreating ? 'Opretter...' : 'Opret lokation'}
							</button>
						</div>
					</div>
				</form>
			</section>

			<section className="locations-filters">
				<label htmlFor="location-search">Søg lokation</label>
				<input
					id="location-search"
					type="text"
					value={searchTerm}
					onChange={(event) => setSearchTerm(event.target.value)}
					placeholder="Fx Hal 1 eller Mødelokale A"
				/>
			</section>

			<section className="locations-table-card">
				<div className="locations-table-header">
					<h2>Alle lokationer</h2>
					<span>{filteredLocations.length} lokationer</span>
				</div>

				<div className="locations-table-wrap">
					<table className="locations-table">
						<thead>
							<tr>
								<th>Lokation</th>
								<th>Opdater navn</th>
								<th className="locations-actions-col">Handling</th>
							</tr>
						</thead>
						<tbody>
							{filteredLocations.map((loc) => {
								const isDeleting = deletingLocationId === loc.location_id;
								const isSavingName = savingNameLocationId === loc.location_id;
								const draftName = draftLocationNames[loc.location_id] || '';
								return (
									<tr key={loc.location_id}>
										<td>
											<strong>{loc.name}</strong>
										</td>
										<td>
											<div className="locations-inline-edit">
												<input
													type="text"
													value={draftName}
													onChange={(event) => setDraftLocationNames((prev) => ({
														...prev,
														[loc.location_id]: event.target.value,
													}))}
													placeholder="Nyt lokationsnavn"
													disabled={isSavingName || isDeleting}
												/>
												<button
													type="button"
													className="locations-save-name-btn"
													onClick={() => handleSaveLocationName(loc)}
													disabled={isSavingName || isDeleting || !draftName.trim()}
												>
													{isSavingName ? 'Gemmer...' : 'Gem navn'}
												</button>
											</div>
										</td>
										<td className="locations-actions-col">
											<button
												type="button"
												className="locations-delete-btn"
												disabled={isDeleting}
												onClick={() => handleDeleteLocation(loc)}
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

				{filteredLocations.length === 0 && (
					<div className="locations-empty-state">Ingen lokationer matcher søgningen.</div>
				)}
			</section>
		</div>
	);
};

export default Locations;
