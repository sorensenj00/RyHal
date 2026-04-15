import NavBar from "./components/navbar/NavBar";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';
import EmployeeBigCard from './components/employee/EmployeeBigCard';
import EmployeeListOverview from './pages/employee-list/Employee-list-overview';
import CreateNewShift from './components/shift/CreateNewShift';
import ActivitiesList from './components/activities/ActivitiesList';
import CreateActivity from './components/activities/CreateActivity';
import DraftActivitiesList from './components/activities/DraftActivitiesList';
import WorkCalendar from "./pages/work-calendar/WorkCalendar";
import CreateNewEmployee from "./pages/create-new-employee/CreateNewEmployee";
import Welcome from "./pages/home/Welcome";
import ShowEmployee from "./pages/show-employee/ShowEmployee";

function App() {
  return (
    <Router>
      <div className="app-container">
        <NavBar /> 
        <main className="app-content">
          <Routes>
            <Route path="/home" element={<Welcome />} />
            <Route path="/employee-list" element={<EmployeeListOverview />} />
            <Route path="/employee-card" element={<EmployeeBigCard />} />
            <Route path="/create-shift" element={<CreateNewShift />} />
            <Route path="/activities/recurring" element={<ActivitiesList type="recurring" />} />
            <Route path="/activities/single" element={<ActivitiesList type="single" />} />
            <Route path="/activities/drafts" element={<DraftActivitiesList />} />
            <Route path="/create-activity" element={<CreateActivity />} />
            <Route path="/work-calendar" element={<WorkCalendar />} />
            <Route path="/create-employee" element={<CreateNewEmployee />} />
            <Route path="/show-employee" element={<ShowEmployee />} />
            {/* ... Alle andre routes */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;