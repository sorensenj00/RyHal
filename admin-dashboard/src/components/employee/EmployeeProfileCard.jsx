import React from 'react';
import defaultAvatar from '../../Assets/images/default-avatar.png';
import RoleSearchBar from '../search/RoleSearchBar';
import { resolveRoleColorValue } from '../../data/roleColors';
import { APP_ACCESS } from '../../auth/session';
import './EmployeeProfileCard.css';

const EmployeeProfileCard = ({
	employee,
	onRoleChange,
	onProfileChange
}) => {
	if (!employee) return null;

	const currentRole = employee.role || 'Ingen rolle';
	const roleColor = resolveRoleColorValue(employee.roleColor);

	const calculateAge = (birthday) => {
		if (!birthday) return null;

		const birthDate = new Date(birthday);
		if (Number.isNaN(birthDate.getTime())) return null;

		const now = new Date();
		let age = now.getFullYear() - birthDate.getFullYear();
		const monthDiff = now.getMonth() - birthDate.getMonth();

		if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
			age -= 1;
		}

		return age;
	};

	const age = calculateAge(employee.birthday);

	const formatBirthday = (birthday) => {
		if (!birthday) return '';

		const parsed = new Date(birthday);
		if (Number.isNaN(parsed.getTime())) return '';

		return new Intl.DateTimeFormat('da-DK', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		}).format(parsed);
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
					{employee.isOver18 === false && (
						<div className="profile-age-badge under18">
							ungarbejder
						</div>
					)}
				</div>

				{/* Role Badge */}
				<div 
					className="profile-role-badge"
					style={{
						backgroundColor: roleColor,
						borderColor: roleColor,
						color: '#fff'
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
						onSelect={(role) => onRoleChange?.(role || '')}
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
						<label className="info-label" htmlFor="employee-first-name">Fornavn</label>
						<input
							id="employee-first-name"
							name="firstName"
							type="text"
							className="info-input"
							value={employee.firstName || ''}
							onChange={onProfileChange}
							placeholder="Indtast fornavn"
						/>
					</div>
					<div className="info-row">
						<label className="info-label" htmlFor="employee-last-name">Efternavn</label>
						<input
							id="employee-last-name"
							name="lastName"
							type="text"
							className="info-input"
							value={employee.lastName || ''}
							onChange={onProfileChange}
							placeholder="Indtast efternavn"
						/>
					</div>
					<div className="info-row">
						<label className="info-label" htmlFor="employee-app-access">App-adgang</label>
						<select
							id="employee-app-access"
							name="appAccess"
							className="info-input"
							value={employee.appAccess || APP_ACCESS.EMPLOYEE}
							onChange={onProfileChange}
						>
							<option value={APP_ACCESS.EMPLOYEE}>Medarbejder</option>
							<option value={APP_ACCESS.ADMIN}>Admin</option>
						</select>
					</div>
					<div className="info-row">
						<label className="info-label" htmlFor="employee-email">Email</label>
						<input
							id="employee-email"
							name="email"
							type="email"
							className="info-input"
							value={employee.email || ''}
							onChange={onProfileChange}
							placeholder="Indtast email"
						/>
					</div>
					<div className="info-row">
						<label className="info-label" htmlFor="employee-phone">Telefon</label>
						<input
							id="employee-phone"
							name="phone"
							type="tel"
							className="info-input"
							value={employee.phone || ''}
							onChange={onProfileChange}
							placeholder="Indtast telefonnummer"
						/>
					</div>
					{employee.birthday && (
						<div className="info-row">
							<span className="info-label">Født</span>
							<span className="info-value info-value-date">{formatBirthday(employee.birthday)}</span>
						</div>
					)}
					{age !== null && (
						<div className="info-row">
							<span className="info-label">Alder</span>
							<span className="info-value">{age} år</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default EmployeeProfileCard;
