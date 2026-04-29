import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../../supabaseClient';
import { toCssColorValue } from '../../data/roleColors';
import './RoleSearchBar.css';

const RoleSearchBar = ({ onSelect, initialRole = '' }) => {
	const [roles, setRoles] = useState([]);
	const [searchTerm, setSearchTerm] = useState(initialRole);
	const [showDropdown, setShowDropdown] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const dropdownRef = useRef(null);

	useEffect(() => {
		const fetchRoles = async () => {
			try {
				setLoading(true);
				setError(null);

				if (!supabase) {
					throw new Error('Supabase-klienten er ikke initialiseret.');
				}

				const { data, error: fetchError } = await supabase
					.from('roles')
					.select('role_id, name, color')
					.order('name', { ascending: true });

				if (fetchError) {
					throw fetchError;
				}

				setRoles(data || []);
			} catch (err) {
				console.error('Fejl ved hentning af roller:', err);
				setError('Kunne ikke hente roller.');
			} finally {
				setLoading(false);
			}
		};

		fetchRoles();
	}, []);

	useEffect(() => {
		setSearchTerm(initialRole || '');
	}, [initialRole]);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setShowDropdown(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	const filteredRoles = useMemo(() => {
		const normalizedSearch = searchTerm.trim().toLowerCase();

		if (!normalizedSearch) {
			return roles;
		}

		return roles.filter(role =>
			(role.name || '').toLowerCase().includes(normalizedSearch)
		);
	}, [roles, searchTerm]);

	const handleSelectRole = (role) => {
		const roleName = role?.name || '';
		setSearchTerm(roleName);
		setShowDropdown(false);
		onSelect?.(role || null);
	};

	return (
		<div className="role-search-container" ref={dropdownRef}>
			<div className="role-search-input-box">
				<FontAwesomeIcon icon={faSearch} className="role-search-icon" />
				<input
					type="text"
					placeholder="Søg rolle..."
					value={searchTerm}
					onFocus={() => setShowDropdown(true)}
					onChange={(e) => {
						setSearchTerm(e.target.value);
						setShowDropdown(true);
					}}
					aria-label="Søg rolle"
				/>
				<FontAwesomeIcon
					icon={faChevronDown}
					className={`role-chevron-icon ${showDropdown ? 'open' : ''}`}
					onClick={() => setShowDropdown(prev => !prev)}
				/>
			</div>

			<AnimatePresence>
				{showDropdown && (
					<motion.div
						className="role-dropdown-list"
						initial={{ opacity: 0, y: -5 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -5 }}
					>
						{loading && <div className="role-dropdown-item role-empty">Henter roller...</div>}

						{!loading && error && <div className="role-dropdown-item role-empty">{error}</div>}

						{!loading && !error && filteredRoles.map(role => (
							<button
								key={role.role_id}
								type="button"
								className="role-dropdown-item"
								onClick={() => handleSelectRole(role)}
							>
								<span
									className="role-name"
									style={{
										background: toCssColorValue(role.color),
										color: '#fff',
										padding: '0.2rem 0.5rem',
										borderRadius: '999px',
									}}
								>
									{role.name}
								</span>
							</button>
						))}

						{!loading && !error && filteredRoles.length === 0 && (
							<div className="role-dropdown-item role-empty">Ingen roller fundet</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default RoleSearchBar;
