import React, { useEffect, useMemo, useState } from 'react';
import api from '../../../api/axiosConfig';
import EventSearchBar from '../../../components/search/EventSearchBar';
import EditEventWindow from '../../../components/activities/EditEventWindow';
import AllEventsTable from '../../../components/activities/AllEventsTable';
import './AllEvents.css';

const pickValue = (obj, ...keys) => {
	for (const key of keys) {
		if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
	}
	return null;
};

const CATEGORY_MAP = ['SPORT', 'MØDE', 'VEDLIGEHOLDELSE', 'ANDET'];

const normalizeCategory = (category) => {
	if (typeof category === 'number') return CATEGORY_MAP[category] || 'ANDET';
	return String(category || 'ANDET').toUpperCase();
};

const getLocationNames = (event) => {
	const rawLocations = pickValue(event, 'locations', 'Locations');
	const locations = Array.isArray(rawLocations) ? rawLocations : [];
	return locations
		.map((loc) => pickValue(loc, 'locationName', 'LocationName', 'name', 'Name'))
		.filter(Boolean);
};

const AllEvents = () => {
	const [events, setEvents] = useState([]);
	const [associations, setAssociations] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState('');
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedEvent, setSelectedEvent] = useState(null);
	const [isEditWindowOpen, setIsEditWindowOpen] = useState(false);

	const associationById = useMemo(() => {
		const map = {};
		associations.forEach((a) => {
			const id = Number(pickValue(a, 'associationId', 'AssociationId')) || 0;
			if (id) map[id] = a;
		});
		return map;
	}, [associations]);

	const openEditWindow = (event) => {
		const eventId = Number(pickValue(event, 'id', 'Id', 'eventId', 'EventId')) || 0;
		if (!eventId) return;
		setSelectedEvent(event);
		setIsEditWindowOpen(true);
	};

	const handleCloseEditWindow = () => {
		setIsEditWindowOpen(false);
		setSelectedEvent(null);
	};

	const handleEventSaved = (updatedEvent) => {
		const updatedId = Number(pickValue(updatedEvent, 'id', 'Id', 'eventId', 'EventId')) || 0;
		if (!updatedId) return;
		setEvents((prev) => prev.map((event) => {
			const currentId = Number(pickValue(event, 'id', 'Id', 'eventId', 'EventId')) || 0;
			return currentId === updatedId ? { ...event, ...updatedEvent } : event;
		}));
	};

	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoading(true);
				setError('');
				const [eventsRes, assocRes] = await Promise.allSettled([
					api.get('/events'),
					api.get('/associations')
				]);
				setEvents(eventsRes.status === 'fulfilled' && Array.isArray(eventsRes.value.data) ? eventsRes.value.data : []);
				setAssociations(assocRes.status === 'fulfilled' && Array.isArray(assocRes.value.data) ? assocRes.value.data : []);
				if (eventsRes.status === 'rejected') setError('Kunne ikke hente eventlisten fra serveren.');
			} catch (err) {
				console.error('Kunne ikke hente data:', err);
				setError('Kunne ikke hente data fra serveren.');
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, []);

	const filteredEvents = useMemo(() => {
		const normalizedSearch = searchTerm.trim().toLowerCase();
		const enriched = events.map((event) => {
			const locationNames = getLocationNames(event);
			const assocId = Number(pickValue(event, 'associationId', 'AssociationId')) || 0;
			const association = associationById[assocId] || null;
			return { event, locationNames, association };
		});

		const searched = normalizedSearch
			? enriched.filter(({ event, locationNames, association }) => {
				const assocName = association ? (pickValue(association, 'name', 'Name') || '') : '';
				const text = [
					pickValue(event, 'name', 'Name'),
					pickValue(event, 'description', 'Description'),
					normalizeCategory(pickValue(event, 'category', 'Category')),
					assocName,
					...locationNames
				].filter(Boolean).join(' ').toLowerCase();
				return text.includes(normalizedSearch);
			})
			: enriched;

		return searched.sort((a, b) => {
			const aTime = Date.parse(pickValue(a.event, 'startTime', 'StartTime') || '') || 0;
			const bTime = Date.parse(pickValue(b.event, 'startTime', 'StartTime') || '') || 0;
			return bTime - aTime;
		});
	}, [events, searchTerm, associationById]);

	const tableRows = useMemo(() => filteredEvents.map(({ event, locationNames, association }) => ({
		id: pickValue(event, 'id', 'Id', 'eventId', 'EventId'),
		name: pickValue(event, 'name', 'Name') || 'Unavngiven aktivitet',
		description: pickValue(event, 'description', 'Description'),
		category: normalizeCategory(pickValue(event, 'category', 'Category')),
		date: pickValue(event, 'date', 'Date') || pickValue(event, 'startTime', 'StartTime'),
		startTime: pickValue(event, 'startTime', 'StartTime'),
		endTime: pickValue(event, 'endTime', 'EndTime'),
		locations: locationNames,
		isDraft: Boolean(pickValue(event, 'isDraft', 'IsDraft')),
		associationName: association ? pickValue(association, 'name', 'Name') : null,
		associationColor: association ? pickValue(association, 'color', 'Color') : null,
		rawEvent: event
	})), [filteredEvents]);

	return (
		<div className="all-events-page">
			<header className="all-events-header">
				<div className="all-events-header-text">
					<h1>Alle Events</h1>
					<p>Liste over events med og uden lokation.</p>
				</div>

				<EventSearchBar
					searchTerm={searchTerm}
					onSearchTermChange={setSearchTerm}
					onReset={() => setSearchTerm('')}
				/>
			</header>

			{/* Placeholder for statistik components (implementeres senere) */}
			{!isLoading && !error && (
				<section className="all-events-stats-placeholder" aria-label="Statistik område">
					<div className="all-events-stats-placeholder-title">Statistik</div>
					<div className="all-events-stats-placeholder-grid">
						<div className="all-events-stats-placeholder-card">Stat-komponent 1</div>
						<div className="all-events-stats-placeholder-card">Stat-komponent 2</div>
						<div className="all-events-stats-placeholder-card">Stat-komponent 3</div>
					</div>
				</section>
			)}

			{error && <p className="all-events-status error">{error}</p>}
			{isLoading && <p className="all-events-status">Henter events...</p>}

			{!isLoading && !error && (
				<section className="all-events-list-section" aria-live="polite">
					<p className="all-events-count">Viser {filteredEvents.length} events</p>
					<AllEventsTable rows={tableRows} onOpenEvent={openEditWindow} />
				</section>
			)}

			<EditEventWindow
				isOpen={isEditWindowOpen}
				onClose={handleCloseEditWindow}
				eventData={selectedEvent}
				onSaved={handleEventSaved}
			/>
		</div>
	);
};

export default AllEvents;
