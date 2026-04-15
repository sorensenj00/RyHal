import React from "react";
import NavBar from "./components/navbar/NavBar";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import './App.css';
import EmployeeBigCard from './components/employee/EmployeeBigCard';
import EmployeeListOverview from './pages/employee-list/EmployeeListOverview';
import CreateNewShift from './components/shift/CreateNewShift';
import ActivitiesList from './components/activities/ActivitiesList';
import CreateActivity from './components/activities/CreateActivity';
import WorkCalendar from "./pages/work-calendar/WorkCalendar";
import CreateNewEmployee from "./pages/create-new-employee/CreateNewEmployee";
import Welcome from "./pages/home/Welcome";
import ShowEmployee from "./pages/show-employee/ShowEmployee";
import EventOverview from "./pages/event-overview/EventOverview";

function App() {
  return (
    <Router>
      <div className="app-container">
        <NavBar /> 
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Navigate to="/home" />} />
            <Route path="/home" element={<Welcome />} />
            <Route path="/employee-list" element={<EmployeeListOverview />} />
            
            {/* Ruter til medarbejderprofil */}
            <Route path="/employee/:id" element={<ShowEmployee />} />
            <Route path="/show-employee" element={<ShowEmployee />} />

            <Route path="/employee-card" element={<EmployeeBigCard />} />
            <Route path="/create-shift" element={<CreateNewShift />} />
            <Route path="/activities/recurring" element={<ActivitiesList type="recurring" />} />
            <Route path="/activities/single" element={<ActivitiesList type="single" />} />
            <Route path="/create-activity" element={<CreateActivity />} />
            <Route path="/work-calendar" element={<WorkCalendar />} />
            <Route path="/create-employee" element={<CreateNewEmployee />} />
            <Route path="/event-overview" element={<EventOverview />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
