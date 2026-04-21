import React from 'react';
import defaultAvatar from '../../Assets/images/default-avatar.png';
import RoleSearchBar from '../search/RoleSearchBar';
import './EmployeeProfileCard.css';

const EmployeeProfileCard = ({
	employee,
	onRoleChange
}) => {
	if (!employee) return null;

	const currentRole = employee.role || 'Ingen rolle';

	return (
		<div className="profile-card">
			<img src={employee.image || defaultAvatar} alt="Profil" className="profile-picture" />
			<h2 className="profile-name">{employee.firstName} {employee.lastName}</h2>

			<div className="profile-role-editor">
				<label className="profile-role-label">Rolle</label>
				<RoleSearchBar
					initialRole={currentRole === 'Ingen rolle' ? '' : currentRole}
					onSelect={(role) => onRoleChange?.(role?.name || '')}
				/>
				<div className="profile-role-actions">
					<button
						type="button"
						className="clear-role-btn"
						onClick={() => onRoleChange?.('')}
					>
						Fjern rolle
					</button>
				</div>
			</div>

			<div className="profile-role-tag">{currentRole}</div>
		</div>
	);
};

export default EmployeeProfileCard;
