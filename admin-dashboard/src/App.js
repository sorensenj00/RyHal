import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import './App.css';

// Komponenter
import NavBar from "./components/navbar/NavBar";
import Login from "./pages/login/Login"; 

// Sider
import EmployeeBigCard from './components/employee/EmployeeBigCard';
import EmployeeListOverview from './pages/employee-list/EmployeeListOverview';
import CreateNewShift from './components/shift/CreateNewShift';
import ActivitiesList from './components/activities/ActivitiesList';
import CreateActivity from './components/activities/CreateActivity';
import DraftActivitiesList from './components/activities/DraftActivitiesList';
import WorkCalendar from "./pages/work-calendar/WorkCalendar";
import CreateNewEmployee from "./pages/create-new-employee/CreateNewEmployee";
import Welcome from "./pages/home/Welcome";
import ShowEmployee from "./pages/show-employee/ShowEmployee";
import EventOverview from "./pages/event-overview/EventOverview";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true); // Tilføjet for at undgå "flicker" ved reload

  useEffect(() => {
    // 1. Tjek om der allerede er en aktiv session (f.eks. efter en reload)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Lyt efter ændringer i auth (login, logud, session refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Vis ingenting (eller en spinner) mens vi tjekker om brugeren er logget ind
  if (loading) {
    return <div className="loading-screen">Henter session...</div>;
  }

  return (
    <Router>
      <div className="app-container">
        {/* Vis kun NavBar, hvis brugeren er logget ind */}
        {session && <NavBar />} 
        
        <main className={session ? "app-content" : "auth-content"}>
          <Routes>
            {/* Login rute - Hvis man er logget ind, sendes man væk fra login */}
            <Route path="/login" element={!session ? <Login /> : <Navigate to="/home" />} />

            {/* Automatisk redirect ved rod-URL */}
            <Route path="/" element={<Navigate to={session ? "/home" : "/login"} />} />
            
            {/* Beskyttede ruter */}
            <Route path="/home" element={session ? <Welcome /> : <Navigate to="/login" />} />
            <Route path="/employee-list" element={session ? <EmployeeListOverview /> : <Navigate to="/login" />} />
            <Route path="/employee/:id" element={session ? <ShowEmployee /> : <Navigate to="/login" />} />
            <Route path="/show-employee" element={session ? <ShowEmployee /> : <Navigate to="/login" />} />
            <Route path="/employee-card" element={session ? <EmployeeBigCard /> : <Navigate to="/login" />} />
            <Route path="/create-shift" element={session ? <CreateNewShift /> : <Navigate to="/login" />} />
            <Route path="/activities/recurring" element={session ? <ActivitiesList type="recurring" /> : <Navigate to="/login" />} />
            <Route path="/activities/single" element={session ? <ActivitiesList type="single" /> : <Navigate to="/login" />} />
            <Route path="/activities/drafts" element={session ? <DraftActivitiesList /> : <Navigate to="/login" />} />
            <Route path="/create-activity" element={session ? <CreateActivity /> : <Navigate to="/login" />} />
            <Route path="/work-calendar" element={session ? <WorkCalendar /> : <Navigate to="/login" />} />
            <Route path="/create-employee" element={session ? <CreateNewEmployee /> : <Navigate to="/login" />} />
            <Route path="/event-overview" element={session ? <EventOverview /> : <Navigate to="/login" />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to={session ? "/home" : "/login"} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
