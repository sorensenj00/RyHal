import NavBar from "./components/navbar/NavBar";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';
import BaseWeekCalendar from './components/calendar/BaseWeekCalendar';
import EmployeeBigCard from './components/employee/EmployeeBigCard';
import CreateNewShift from './components/shift/CreateNewShift';
import ActivitiesList from './components/activities/ActivitiesList';
import CreateActivity from './components/activities/CreateActivity';

function App() {
  return (
    <Router>
      <div className="app-container">
        <NavBar /> 
        <main className="app-content">
          <Routes>
            <Route path="/base-calendar" element={<BaseWeekCalendar />} />
            <Route path="/employee-card" element={<EmployeeBigCard />} />
            <Route path="/create-shift" element={<CreateNewShift />} />
            <Route path="/activities-list" element={<ActivitiesList />} />
            <Route path="/create-activity" element={<CreateActivity />} />
            {/* ... Alle andre routes */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;