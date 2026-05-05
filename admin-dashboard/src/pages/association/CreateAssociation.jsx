import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateNewAssociationTemplate from '../../components/association/CreateNewAssociationTemplate';
import './CreateAssociation.css';

const CreateAssociation = () => {
	const navigate = useNavigate();
	const [previewAssociation, setPreviewAssociation] = useState(null);
	const [latestAssociation, setLatestAssociation] = useState(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleAssociationCreated = useCallback((createdAssociation) => {
		setLatestAssociation(createdAssociation);
		setPreviewAssociation(createdAssociation);
		setIsLoading(false);
	}, []);

	const handlePreviewChange = useCallback((associationDraft) => {
		setPreviewAssociation(associationDraft);
	}, []);

	const handleLoadingStateChange = useCallback((loading) => {
		setIsLoading(loading);
	}, []);

	return (
		<div className="association-page">
			<header className="association-header-fixed">
				<div className="association-header-inner">
					<h1>Opret forening</h1>
				</div>
			</header>

			<div className="association-body">
				<div className="association-layout">
					<div className="association-main-column">
						<section className="association-form-wrapper">
							<CreateNewAssociationTemplate
								onCreated={handleAssociationCreated}
								onPreviewChange={handlePreviewChange}
								onLoadingStateChange={handleLoadingStateChange}
							/>
						</section>
					</div>

					<aside className="association-preview-panel">
						<h2>Forening-preview</h2>
						<div className="association-preview-content">
							{(previewAssociation || latestAssociation) ? (
								<>
									<div className="preview-field">
										<label>Navn</label>
										<p className="preview-value">{previewAssociation?.name || latestAssociation?.name}</p>
									</div>
									<div className="preview-field">
										<label>Farve</label>
										<span
											className="preview-color-badge"
											style={{
												backgroundColor: previewAssociation?.colorValue || latestAssociation?.colorValue || '#94a3b8'
											}}
										>
											{previewAssociation?.color || latestAssociation?.color || '--color-andet'}
										</span>
									</div>
									{(previewAssociation?.websiteUrl || latestAssociation?.websiteUrl) && (
										<div className="preview-field">
											<label>Hjemmeside</label>
											<p className="preview-value" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
												{previewAssociation?.websiteUrl || latestAssociation?.websiteUrl}
											</p>
										</div>
									)}
								</>
							) : (
								<p className="preview-empty">Udfyld formularen for at se preview</p>
							)}
						</div>
					</aside>
				</div>
			</div>

			<footer className="association-button-bar">
				<div className="association-button-bar-inner">
					<button
						type="submit"
						form="create-association-form"
						className="btn btn-primary"
						disabled={isLoading}
					>
						{isLoading ? 'Opretter...' : 'Opret forening'}
					</button>
					<button
						type="button"
						className="btn btn-secondary"
						onClick={() => navigate('/associations')}
						disabled={isLoading}
					>
						Annuller
					</button>
				</div>
			</footer>
		</div>
	);
};

export default CreateAssociation;
