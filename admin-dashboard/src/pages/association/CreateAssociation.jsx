import React from 'react';
import CreateNewAssociationTemplate from '../../components/association/CreateNewAssociationTemplate';
import './CreateAssociation.css';

const CreateAssociation = () => {
	return (
		<div className="association-page">
			<header className="association-page-header">
				<h1>Opret forening</h1>
				<p>Udfyld formularen nedenfor for at oprette en ny forening.</p>
			</header>

			<section className="association-form-wrapper">
				<CreateNewAssociationTemplate />
			</section>
		</div>
	);
};

export default CreateAssociation;
