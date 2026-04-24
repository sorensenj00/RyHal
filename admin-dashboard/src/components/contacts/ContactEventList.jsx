import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { da } from 'date-fns/locale';
import api from '../../api/axiosConfig';
import './ContactEventList.css';

const formatEventDate = (event) => {
	const dateValue = event?.date || event?.startTime;

	if (!dateValue) {
		return 'Dato ikke angivet';
	}

	try {
		return format(parseISO(dateValue), 'd. MMMM yyyy', { locale: da });
	} catch {
		return 'Dato ikke angivet';
	}
};

const formatEventTimeRange = (event) => {
	if (!event?.startTime || !event?.endTime) {
		return 'Tidspunkt ikke angivet';
	}

	try {
		return `${format(parseISO(event.startTime), 'HH:mm')} - ${format(parseISO(event.endTime), 'HH:mm')}`;
	} catch {
		return 'Tidspunkt ikke angivet';
	}
};

const ContactEventList = ({ contactId }) => {
	const [events, setEvents] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		if (!contactId) {
			setEvents([]);
			return;
		}

		const fetchEvents = async () => {
			try {
				setLoading(true);
				setError('');
				const response = await api.get(`/contacts/${contactId}/events`);
				setEvents(Array.isArray(response.data) ? response.data : []);
			} catch (err) {
				console.error('Kunne ikke hente kontaktens events:', err);
				setEvents([]);
				setError('Kunne ikke hente kontaktens events. Prøv igen.');
			} finally {
				setLoading(false);
			}
		};

		fetchEvents();
	}, [contactId]);

	if (!contactId) {
		return <div className="contact-events-list">Vælg en kontakt for at se tilknyttede events.</div>;
	}

	if (loading) {
		return <div className="contact-events-list">Indlæser events...</div>;
	}

	if (error) {
		return <div className="contact-events-list contact-events-list-error">{error}</div>;
	}

	if (events.length === 0) {
		return <div className="contact-events-list contact-events-list-empty">Ingen events er koblet til kontaktpersonen endnu.</div>;
	}

	return (
		<div className="contact-events-list">
			{events.map((event) => (
				<article key={event.id} className="contact-event-card">
					<div className="contact-event-header">
						<div>
							<h3>{event.name || 'Ukendt event'}</h3>
							<p>{formatEventDate(event)}</p>
						</div>
						<span className={`contact-event-category contact-event-category-${String(event.category || 'andet').toLowerCase()}`}>
							{event.category || 'ANDET'}
						</span>
					</div>

					<div className="contact-event-meta">
						<span>{formatEventTimeRange(event)}</span>
						{event.isCancelled && <span className="contact-event-flag cancelled">Aflyst</span>}
						{event.isDraft && <span className="contact-event-flag draft">Kladde</span>}
					</div>

					{event.description && <p className="contact-event-description">{event.description}</p>}
				</article>
			))}
		</div>
	);
};

export default ContactEventList;
