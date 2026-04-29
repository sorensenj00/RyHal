import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import './App.css';
import { fetchAuthMe, getEmployeeAppTransferUrl, APP_ACCESS } from "./auth/session";

// Komponenter
import NavBar from "./components/navbar/NavBar";
import Login from "./pages/login/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Sider
import EmployeeBigCard from './components/employee/EmployeeBigCard';
import EmployeeListOverview from './pages/employee-list/EmployeeListOverview';
import CreateNewShift from './components/shift/CreateNewShift';
import WorkCalendar from "./pages/work-calendar/WorkCalendar";
import EventShiftOverview from "./pages/event-shift-overview/EventShiftOverview";
import CreateNewEmployee from "./pages/create-new-employee/CreateNewEmployee";
import Welcome from "./pages/home/Welcome";
import ShowEmployee from "./pages/show-employee/ShowEmployee";
import EventOverview from "./pages/activities/event-overview/EventOverview";
import CreateNewEvent from "./pages/activities/create-new-event/CreateNewEvent";
import EditEvent from "./pages/activities/edit-event/EditEvent";
import Drafts from "./pages/activities/drafts/Drafts";
import Association from "./pages/association/Association";
import AllAssociations from "./pages/association/AllAssociations";
import ViewAssociation from "./pages/association/ViewAssociation";
import CreateNewContact from "./pages/contacts/CreateNewContact";
import ViewAllContacts from "./pages/contacts/ViewAllContacts";
import ViewContact from "./pages/contacts/ViewContact";
import EmployeeHoursOverview from "./pages/employee-hours/EmployeeHoursOverview";
import StaffingOverview from "./pages/shift-management/StaffingOverview";

function AppContent() {
  const [session, setSession] = useState(null);
  const [authProfile, setAuthProfile] = useState(null);
  const [loading, setLoading] = useState(true); // Tilføjet for at undgå "flicker" ved reload
  const { pathname } = useLocation();
  const currentPath = pathname.replace(/\/+$/, "") || "/";
  const isLoginRoute = currentPath === "/login";
  const isForgotPasswordRoute = currentPath === "/forgot";
  const isResetPasswordRoute = currentPath === "/reset-password";
  const isPublicAuthRoute = isLoginRoute || isForgotPasswordRoute || isResetPasswordRoute;

  useEffect(() => {
    let active = true;

    const resolveSession = async (nextSession) => {
      if (!nextSession?.access_token) {
        if (!active) return;
        setSession(null);
        setAuthProfile(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await fetchAuthMe(nextSession.access_token);
        if (!active) return;

        setSession(nextSession);
        setAuthProfile(profile);
        setLoading(false);

        if (profile.appAccess !== APP_ACCESS.ADMIN && !isResetPasswordRoute && !isLoginRoute) {
          window.location.replace(getEmployeeAppTransferUrl(nextSession));
        }
      } catch (error) {
        if (!active) return;
        setSession(null);
        setAuthProfile(null);
        setLoading(false);
        await supabase.auth.signOut();
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      resolveSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      resolveSession(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [isLoginRoute, isResetPasswordRoute]);

  // Vis ingenting (eller en spinner) mens vi tjekker om brugeren er logget ind
  if (loading) {
    return <div className="loading-screen">Henter session...</div>;
  }

  if (session && authProfile && authProfile.appAccess !== APP_ACCESS.ADMIN && !isResetPasswordRoute && !isLoginRoute) {
    return <div className="loading-screen">Sender dig til medarbejderportalen...</div>;
  }

  const isAdminSession = Boolean(session && authProfile && authProfile.appAccess === APP_ACCESS.ADMIN);
  const shellShouldBeVisible = isAdminSession && !isPublicAuthRoute;

  return (
    <div className="app-container">
      {/* Vis kun NavBar, hvis brugeren er logget ind */}
      {shellShouldBeVisible && <NavBar />}

      <main className={shellShouldBeVisible ? "app-content" : "auth-content"}>
        <Routes>
          {/* Login rute - Hvis man er logget ind, sendes man væk fra login */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot" element={!session ? <ForgotPassword /> : <Navigate to={isAdminSession ? "/home" : getEmployeeAppTransferUrl(session)} replace />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Automatisk redirect ved rod-URL */}
          <Route path="/" element={<Navigate to={isAdminSession ? "/home" : "/login"} replace />} />

          {/* Beskyttede ruter */}
          <Route path="/home" element={isAdminSession ? <Welcome /> : <Navigate to="/login" />} />
          <Route path="/employee-list" element={isAdminSession ? <EmployeeListOverview /> : <Navigate to="/login" />} />
          <Route path="/employee-hours" element={isAdminSession ? <EmployeeHoursOverview /> : <Navigate to="/login" />} />
          <Route path="/employee/:id" element={isAdminSession ? <ShowEmployee /> : <Navigate to="/login" />} />
          <Route path="/show-employee" element={isAdminSession ? <ShowEmployee /> : <Navigate to="/login" />} />
          <Route path="/employee-card" element={isAdminSession ? <EmployeeBigCard /> : <Navigate to="/login" />} />
          <Route path="/create-shift" element={isAdminSession ? <CreateNewShift /> : <Navigate to="/login" />} />
          <Route path="/staffing-overview" element={isAdminSession ? <StaffingOverview /> : <Navigate to="/login" />} />
          <Route path="/activities/drafts" element={isAdminSession ? <Drafts /> : <Navigate to="/login" />} />
          <Route path="/create-activity" element={isAdminSession ? <CreateNewEvent /> : <Navigate to="/login" />} />
          <Route path="/edit-activity" element={isAdminSession ? <EditEvent /> : <Navigate to="/login" />} />
          <Route path="/work-calendar" element={isAdminSession ? <WorkCalendar /> : <Navigate to="/login" />} />
          <Route path="/event-shift-overview" element={isAdminSession ? <EventShiftOverview /> : <Navigate to="/login" />} />
          <Route path="/create-employee" element={isAdminSession ? <CreateNewEmployee /> : <Navigate to="/login" />} />
          <Route path="/event-overview" element={isAdminSession ? <EventOverview /> : <Navigate to="/login" />} />
          <Route path="/association" element={isAdminSession ? <Association /> : <Navigate to="/login" />} />
          <Route path="/associations" element={isAdminSession ? <AllAssociations /> : <Navigate to="/login" />} />
          <Route path="/view-association" element={isAdminSession ? <ViewAssociation /> : <Navigate to="/login" />} />
          <Route path="/create-contact" element={isAdminSession ? <CreateNewContact /> : <Navigate to="/login" />} />
          <Route path="/view-contacts" element={isAdminSession ? <ViewAllContacts /> : <Navigate to="/login" />} />
          <Route path="/view-contact" element={isAdminSession ? <ViewContact /> : <Navigate to="/login" />} />
          <Route path="/view-contact/:id" element={isAdminSession ? <ViewContact /> : <Navigate to="/login" />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to={isAdminSession ? "/home" : "/login"} replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
