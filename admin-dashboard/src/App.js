import NavBar from "./components/navbar/NavBar";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';
import BaseWeekCalendar from './components/calendar/BaseWeekCalendar';
import EmployeeBigCard from './components/employee/EmployeeBigCard';
import CreateNewShift from './components/shift/CreateNewShift';

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
            {/* ... Alle andre routes */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;