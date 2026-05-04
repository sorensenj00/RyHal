import React from 'react';
import './AddWindowSlide.css';
import './AddCateringWindow.css';

const AddCateringWindow = ({ isOpen, onClose }) => {
	if (!isOpen) {
		return null;
	}

	return (
		<div className="add-window-overlay" onClick={onClose}>
			<aside
				className="add-window-panel catering-window-panel"
				role="dialog"
				aria-modal="true"
				aria-labelledby="catering-modal-title"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="add-window-header">
					<h3 id="catering-modal-title">Forplejning</h3>
					<button type="button" className="btn btn-secondary add-window-close" onClick={onClose}>
						Luk
					</button>
				</div>

				<div className="add-window-body">
					<p className="add-window-muted catering-window-note">Forplejning bliver tilføjet i næste iteration.</p>
				</div>
			</aside>
		</div>
	);
};

export default AddCateringWindow;
