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

	// Get role color from CSS variables
	const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

	const roleColorMap = {
		'Hal Mand': getVar('--color-hal-mand') || '#B8BB0B',
		'Hal Dreng': getVar('--color-hal-dreng') || '#D4D700',
		'Cafemedarbejder': getVar('--color-cafemedarbejder') || '#22C55E',
		'Administration': getVar('--color-administration') || '#F59E0B',
		'Rengøring': getVar('--color-rengoering') || '#7C3AED',
		'Opvasker': getVar('--color-opvasker') || '#06B6D4',
		'Andet': getVar('--color-andet') || '#94A3B8'
	};

	const getRoleColor = (role) => {
		return roleColorMap[role] || roleColorMap['Andet'];
	};

	const roleColor = getRoleColor(currentRole);

	// Format phone number
	const formatPhone = (phone) => {
		if (!phone) return 'N/A';
		return phone;
	};

	// Format email
	const formatEmail = (email) => {
		if (!email) return 'N/A';
		// Truncate long emails
		return email.length > 25 ? email.substring(0, 22) + '...' : email;
	};

	return (
		<div className="profile-card">
			{/* LEFT COLUMN */}
			<div className="profile-left">
				{/* Profile Picture Section */}
				<div className="profile-header">
					<img src={employee.image || defaultAvatar} alt="Profil" className="profile-picture" />
				</div>

				{/* Name and Status */}
				<div className="profile-name-section">
					<h2 className="profile-name">{employee.firstName} {employee.lastName}</h2>
					{employee.isOver18 !== null && (
						<div className={`profile-age-badge ${employee.isOver18 ? 'over18' : 'under18'}`}>
							{employee.isOver18 ? '18+' : 'Under 18'}
						</div>
					)}
				</div>

				{/* Role Badge */}
				<div 
					className="profile-role-badge"
					style={{
						backgroundColor: `${roleColor}1A`,
						borderColor: roleColor,
						color: roleColor
					}}
				>
					<span className="role-dot" style={{ backgroundColor: roleColor }}></span>
					<span className="role-name">{currentRole}</span>
				</div>

				{/* Role Editor */}
				<div className="profile-role-editor">
					<label className="profile-role-label">Rediger rolle</label>
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
			</div>

			{/* RIGHT COLUMN */}
			<div className="profile-right">
				{/* Contact Information */}
				<div className="profile-info">
					<div className="info-row">
						<span className="info-label">Email</span>
						<span className="info-value" title={employee.email}>{formatEmail(employee.email)}</span>
					</div>
					<div className="info-row">
						<span className="info-label">Telefon</span>
						<span className="info-value">{formatPhone(employee.phone)}</span>
					</div>
					{employee.birthday && (
						<div className="info-row">
							<span className="info-label">Født</span>
							<span className="info-value">{new Date(employee.birthday).toLocaleDateString('da-DK')}</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default EmployeeProfileCard;
