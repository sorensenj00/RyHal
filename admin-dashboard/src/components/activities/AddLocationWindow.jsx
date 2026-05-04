import React from 'react';
import './AddWindowSlide.css';
import './AddLocationWindow.css';

const AddLocationWindow = ({
	isOpen,
	onClose,
	isLoadingLocations,
	availableLocations,
	locations,
	addLocation,
	removeLocation,
	handleLocationChange,
	noOverlay
}) => {
	if (!isOpen) {
		return null;
	}

	const panel = (
			<aside
				className="add-window-panel"
				role="dialog"
				aria-modal="true"
				aria-labelledby="location-modal-title"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="add-window-header">
					<h3 id="location-modal-title">Tilføj lokationer (valgfrit)</h3>
					<button type="button" className="btn btn-secondary add-window-close" onClick={onClose}>
						Luk
					</button>
				</div>

				<div className="add-window-body">
					<p className="add-window-muted location-window-intro">Et event kan oprettes uden lokation. Kun komplette lokationer bliver gemt.</p>

					<div className="location-window-head">
						<h2>Dine lokationer</h2>
						<button type="button" className="btn btn-secondary" onClick={addLocation}>Tilføj lokation</button>
					</div>

					{isLoadingLocations && <p className="add-window-muted">Henter lokationer...</p>}
				{!isLoadingLocations && availableLocations.length === 0 && (
					<p className="add-window-muted add-window-error">Ingen lokationer fundet fra backend.</p>
				)}

				{locations.length === 0 && (
					<p className="add-window-muted">Ingen lokationer tilføjet endnu.</p>
				)}

					<div className="location-window-list">
					{locations.map((loc, index) => (
						<div key={index} className="location-window-card">
							<h3>Lokation {index + 1}</h3>
							<div className="location-window-row">
								<label>
									Lokation
									<select
										value={loc.locationId}
										onChange={(e) => handleLocationChange(index, 'locationId', Number(e.target.value))}
									>
										<option value={0}>Vælg...</option>
										{availableLocations.map((backendLocation) => (
											<option key={backendLocation.id} value={backendLocation.id}>
												{backendLocation.name}
											</option>
										))}
									</select>
								</label>

								<label>
									Starttid
									<input
										type="time"
										value={loc.startTime}
										onChange={(e) => handleLocationChange(index, 'startTime', e.target.value)}
									/>
								</label>

								<label>
									Sluttid
									<input
										type="time"
										value={loc.endTime}
										onChange={(e) => handleLocationChange(index, 'endTime', e.target.value)}
									/>
								</label>
							</div>

							{locations.length > 1 && (
								<button
									type="button"
									className="btn btn-danger location-window-remove"
									onClick={() => removeLocation(index)}
								>
									Fjern
								</button>
							)}
						</div>
					))}
					</div>
				</div>
			</aside>
	);

	return noOverlay ? panel : <div className="add-window-overlay" onClick={onClose}>{panel}</div>;
};

export default AddLocationWindow;
