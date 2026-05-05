import React, { useEffect, useMemo, useState } from 'react';
import api from '../../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import DraftActivitiesList from '../../../components/activities/drafts/DraftActivitiesList';
import DraftsSearchBar from '../../../components/search/DraftsSearchBar';
import EditEventWindow from '../../../components/activities/EditEventWindow';
import './Draft.css';

const CATEGORY_TO_ENUM = {
	SPORT: 0,
	MØDE: 1,
	VEDLIGEHOLDELSE: 2,
	ANDET: 3
};

const normalizeCategory = (category) => {
	if (typeof category === 'number') {
		const map = ['SPORT', 'MØDE', 'VEDLIGEHOLDELSE', 'ANDET'];
		return map[category] || 'ANDET';
	}

	return String(category || 'ANDET').toUpperCase();
};

const buildUpdatePayload = (draft, isDraft) => {
	const normalizedCategory = normalizeCategory(draft.category);
	const locations = Array.isArray(draft.locations) ? draft.locations : [];
	const eventDate = (draft.startTime || '').slice(0, 10) || draft.date || null;

	return {
		Name: draft.name || 'Unavngiven aktivitet',
		Description: draft.description || '',
		StartTime: draft.startTime || null,
		EndTime: draft.endTime || null,
		Date: eventDate,
		Category: CATEGORY_TO_ENUM[normalizedCategory] ?? CATEGORY_TO_ENUM.ANDET,
		Locations: locations.map((loc) => ({
			LocationId: Number(loc.locationId),
			StartTime: loc.startTime || null,
			EndTime: loc.endTime || null,
			Date: (loc.startTime || '').slice(0, 10) || loc.date || eventDate
		})),
		TemplateId: draft.templateId ?? null,
		CreatedBy: 'admin-dashboard',
		IsRecurring: false,
		RecurrenceFrequency: null,
		RecurrenceEndDate: null,
		IsDraft: isDraft
	};
};

const toFriendlyApiMessage = (apiError, fallbackMessage) => {
	const validationErrors = apiError?.errors
		? Object.values(apiError.errors).flat().join(' ')
		: '';

	const rawMessage = typeof apiError === 'string'
		? apiError
		: validationErrors || apiError?.title || apiError?.message || fallbackMessage;

	if (/lokation\s+\d+\s+er allerede booket/i.test(rawMessage) || /allerede booket/i.test(rawMessage)) {
		return 'Lokationen er optaget i det valgte tidsrum. Vælg et andet tidspunkt eller en anden lokation.';
	}

	return rawMessage || fallbackMessage;
};

const Drafts = () => {
	const navigate = useNavigate();
	const [drafts, setDrafts] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState('');
	const [publishFeedback, setPublishFeedback] = useState(null);
	const [actionLoadingId, setActionLoadingId] = useState(null);
	const [draftToPublish, setDraftToPublish] = useState(null);
	const [searchInput, setSearchInput] = useState('');
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
	const [categoryFilter, setCategoryFilter] = useState('ALL');
	const [timeFilter, setTimeFilter] = useState('ALL');
	const [selectedDraft, setSelectedDraft] = useState(null);
	const [isEditWindowOpen, setIsEditWindowOpen] = useState(false);

	const fetchDrafts = async () => {
		try {
			setIsLoading(true);
			setError('');

			const response = await api.get('/events/drafts');
			const list = Array.isArray(response.data) ? response.data : [];
			const onlyDrafts = list.filter((item) => item?.isDraft === true || item?.IsDraft === true);

			setDrafts(onlyDrafts);
		} catch (err) {
			console.error('Kunne ikke hente kladder fra API:', err?.response?.data || err);
			setError('Kunne ikke hente kladder fra serveren.');
			setDrafts([]);
		} finally {
			setIsLoading(false);
		}
	};

	const handlePublish = (draft) => {
		setDraftToPublish(draft);
	};

	const handleConfirmPublish = async () => {
		if (!draftToPublish) return;

		const draft = draftToPublish;
		setDraftToPublish(null);
		setPublishFeedback(null);
		setActionLoadingId(draft.id);

		try {
			await api.put(`/events/${draft.id}`, buildUpdatePayload(draft, false));
			setPublishFeedback({
				type: 'success',
				title: 'Kladde publiceret',
				message: `Kladde "${draft.name || draft.id}" er publiceret.`
			});
			await fetchDrafts();
		} catch (err) {
			const apiError = err?.response?.data;
			const message = toFriendlyApiMessage(apiError, 'Kunne ikke publicere kladden.');

			setPublishFeedback({
				type: 'error',
				title: 'Kunne ikke publicere',
				message
			});
			console.error('Kunne ikke publicere kladde via API:', apiError || err);
		} finally {
			setActionLoadingId(null);
		}
	};

	const handleEdit = (draft) => {
		setSelectedDraft(draft);
		setIsEditWindowOpen(true);
	};

	const handleCloseEditWindow = () => {
		setIsEditWindowOpen(false);
		setSelectedDraft(null);
	};

	const handleDraftSaved = (updatedDraft) => {
		const updatedId = updatedDraft?.id || updatedDraft?.Id;
		if (!updatedId) return;
		setDrafts((prev) => prev.map((draft) => {
			const currentId = draft?.id || draft?.Id;
			return currentId === updatedId ? { ...draft, ...updatedDraft } : draft;
		}));
	};

	useEffect(() => {
		fetchDrafts();
	}, []);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchTerm(searchInput);
		}, 200);

		return () => clearTimeout(timer);
	}, [searchInput]);

	const totals = useMemo(() => {
		const withTimes = drafts.filter((d) => d?.startTime && d?.endTime).length;
		const withLocations = drafts.filter((d) => Array.isArray(d?.locations) && d.locations.length > 0).length;

		return {
			total: drafts.length,
			withTimes,
			withoutTimes: drafts.length - withTimes,
			withLocations
		};
	}, [drafts]);

	const availableCategories = useMemo(() => {
		const cats = drafts
			.map((d) => normalizeCategory(d?.category))
			.filter(Boolean);

		return [...new Set(cats)];
	}, [drafts]);

	const filteredDrafts = useMemo(() => {
		const normalizedSearch = debouncedSearchTerm.trim().toLowerCase();

		return drafts.filter((draft) => {
			const normalizedCategory = normalizeCategory(draft?.category);
			const hasTimes = Boolean(draft?.startTime && draft?.endTime);

			if (categoryFilter !== 'ALL' && normalizedCategory !== categoryFilter) {
				return false;
			}

			if (timeFilter === 'WITH_TIME' && !hasTimes) {
				return false;
			}

			if (timeFilter === 'WITHOUT_TIME' && hasTimes) {
				return false;
			}

			if (!normalizedSearch) {
				return true;
			}

			const locationText = Array.isArray(draft?.locations)
				? draft.locations.map((loc) => String(loc.locationId ?? '')).join(' ')
				: '';

			const haystack = [
				draft?.name,
				draft?.description,
				normalizedCategory,
				locationText
			]
				.filter(Boolean)
				.join(' ')
				.toLowerCase();

			return haystack.includes(normalizedSearch);
		});
	}, [drafts, debouncedSearchTerm, categoryFilter, timeFilter]);

	return (
		<div className="drafts-page">
			<header className="drafts-header">
				<div>
					<h1>Kladdeaktiviteter</h1>
					<p>Oversigt over events hvor is_draft er sat til true i backend.</p>
				</div>

				<button className="drafts-refresh-btn" onClick={fetchDrafts} type="button" disabled={isLoading}>
					Opdater liste
				</button>
			</header>

			{error && <p className="draft-status error">{error}</p>}

			<section className="drafts-summary-grid">
				<article className="drafts-summary-card">
					<span>Samlet antal kladder</span>
					<strong>{totals.total}</strong>
				</article>
				<article className="drafts-summary-card">
					<span>Med start/slut-tid</span>
					<strong>{totals.withTimes}</strong>
				</article>
				<article className="drafts-summary-card">
					<span>Uden tider</span>
					<strong>{totals.withoutTimes}</strong>
				</article>
				<article className="drafts-summary-card">
					<span>Med lokationer</span>
					<strong>{totals.withLocations}</strong>
				</article>
			</section>

			<section className="drafts-list-section">
				<DraftsSearchBar
					searchTerm={searchInput}
					onSearchTermChange={setSearchInput}
					categoryFilter={categoryFilter}
					onCategoryFilterChange={setCategoryFilter}
					timeFilter={timeFilter}
					onTimeFilterChange={setTimeFilter}
					availableCategories={availableCategories}
				/>

				{isLoading ? (
					<p className="draft-status">Henter kladder...</p>
				) : (
					<DraftActivitiesList
						drafts={filteredDrafts}
						onPublish={handlePublish}
						onEdit={handleEdit}
						actionLoadingId={actionLoadingId}
					/>
				)}
			</section>

			{draftToPublish && (
				<div className="draft-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="publish-draft-title">
					<div className="draft-modal">
						<h3 id="publish-draft-title">Publicer kladde?</h3>
						<p>
							Er du sikker på, at du vil publicere kladden <strong>{draftToPublish.name || draftToPublish.id}</strong>?
						</p>
						<div className="draft-modal-actions">
							<button
								type="button"
								className="draft-action-btn secondary"
								onClick={() => setDraftToPublish(null)}
							>
								Annuller
							</button>
							<button
								type="button"
								className="draft-action-btn primary"
								onClick={handleConfirmPublish}
							>
								Ja, publicer
							</button>
						</div>
					</div>
				</div>
			)}

			{publishFeedback && (
				<div className="draft-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="draft-feedback-title">
					<div className={`draft-modal draft-feedback-modal ${publishFeedback.type}`}>
						<h3 id="draft-feedback-title">{publishFeedback.title}</h3>
						<p>{publishFeedback.message}</p>
						<div className="draft-modal-actions">
							<button
								type="button"
								className="draft-action-btn primary"
								onClick={() => setPublishFeedback(null)}
							>
								Luk
							</button>
						</div>
					</div>
				</div>
			)}

			<EditEventWindow
				isOpen={isEditWindowOpen}
				onClose={handleCloseEditWindow}
				eventData={selectedDraft}
				onSaved={handleDraftSaved}
			/>
		</div>
	);
};

export default Drafts;
