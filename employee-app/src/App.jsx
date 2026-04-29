import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { EmployeePortalProvider, useEmployeePortal } from "./portal/EmployeePortalContext";
import EmployeeShell from "./components/navigation/EmployeeShell";
import HomePage from "./pages/HomePage";
import OverviewPage from "./pages/OverviewPage";
import HoursPage from "./pages/HoursPage";
import SwapsPage from "./pages/SwapsPage";
import ProfilePage from "./pages/ProfilePage";

function AppRoutes() {
  const { loading, profile, statusMessage } = useEmployeePortal();

  if (loading) {
    return (
      <div className="employee-app">
        <div className="employee-loading">
          <p className="eyebrow">Medarbejderportal</p>
          <h1>{statusMessage}</h1>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="employee-app">
        <div className="employee-loading">
          <p className="eyebrow">Medarbejderportal</p>
          <h1>{statusMessage}</h1>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route element={<EmployeeShell />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/hours" element={<HoursPage />} />
        <Route path="/swaps" element={<SwapsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <EmployeePortalProvider>
        <AppRoutes />
      </EmployeePortalProvider>
    </BrowserRouter>
  );
}

export default App;
