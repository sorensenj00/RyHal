import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import { useLocation } from 'react-router-dom';
import api from '../../api/axiosConfig';
import StaffingShiftOverview from '../../components/shift-management/StaffingShiftOverview';
import EventLocation from '../../components/shift-management/EventLocation';
import ShiftOverview from '../../components/shift-management/ShiftOverview';
import { toDateKey, shiftDurationHours } from '../../utils/dateUtils';
import './StaffingOverview.css';


const StaffingOverview = () => {
	const location = useLocation();
	const [selectedDate, setSelectedDate] = useState(location.state?.selectedDate || format(new Date(), 'yyyy-MM-dd'));
	const [shifts, setShifts] = useState([]);
	const [employees, setEmployees] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const fetchOverviewData = useCallback(async () => {
		try {
			setLoading(true);
			const [shiftsResponse, employeesResponse] = await Promise.all([
				api.get('/shifts'),
				api.get('/employees'),
			]);

			setShifts(shiftsResponse.data || []);
			setEmployees(employeesResponse.data || []);
			setError(null);
		} catch (err) {
			console.error('Fejl ved hentning af bemandingsdata:', err);
			setError('Kunne ikke hente vagtdata lige nu.');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchOverviewData();
	}, [fetchOverviewData]);

	const shiftsForSelectedDate = useMemo(() => {
		return shifts.filter((shift) => {
			const shiftStart = shift.startTime ?? shift.StartTime;
			return toDateKey(shiftStart) === selectedDate;
		});
	}, [selectedDate, shifts]);

	const metrics = useMemo(() => {
		const staffedShifts = shiftsForSelectedDate.filter((shift) => Boolean(shift.employeeId));
		const openShifts = shiftsForSelectedDate.length - staffedShifts.length;
		const totalWorkHours = shiftsForSelectedDate.reduce(
			(sum, shift) => sum + shiftDurationHours(shift.startTime, shift.endTime),
			0
		);

		return {
			openShifts,
			staffedCount: staffedShifts.length,
			targetStaffing: shiftsForSelectedDate.length,
			totalWorkHours,
		};
	}, [shiftsForSelectedDate]);

	const employeesById = useMemo(() => {
		const map = {};

		employees.forEach((employee) => {
			const id = Number(employee.employeeId);
			if (!id) {
				return;
			}

			const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
			map[id] = fullName || `Medarbejder ${id}`;
		});

		return map;
	}, [employees]);

	const changeDayBy = (days) => {
		setSelectedDate((prevDate) => {
			const nextDate = addDays(new Date(`${prevDate}T00:00:00`), days);
			return format(nextDate, 'yyyy-MM-dd');
		});
	};

	return (
		<div className="staffing-page">
			<header className="staffing-page-header">
				<div>
					<h1>Bemandingsoversigt</h1>
				</div>

				<StaffingShiftOverview
					selectedDate={selectedDate}
					onPreviousDay={() => changeDayBy(-1)}
					onNextDay={() => changeDayBy(1)}
					onDateChange={setSelectedDate}
					openShifts={metrics.openShifts}
					staffedCount={metrics.staffedCount}
					targetStaffing={metrics.targetStaffing}
					totalWorkHours={metrics.totalWorkHours}
					loading={loading}
				/>
			</header>

			{error && <div className="staffing-inline-error">{error}</div>}

			<section className="staffing-main-split">
				<div className="staffing-main-left">
					<EventLocation selectedDate={selectedDate} />
				</div>

				<aside className="staffing-main-right">
					<ShiftOverview
						shifts={shiftsForSelectedDate}
						employeesById={employeesById}
						selectedDate={selectedDate}
						loading={loading}
						onRefresh={fetchOverviewData}
					/>
				</aside>
			</section>
		</div>
	);
};

export default StaffingOverview;
