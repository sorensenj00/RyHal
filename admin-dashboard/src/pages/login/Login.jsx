import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Link } from "react-router-dom";
import './Login.css'; 
import { fetchAuthMe, getAdminAppUrl, createEmployeeAppTransferUrl } from "../../auth/session";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resettingSession, setResettingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    const clearExistingSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (session) {
        await supabase.auth.signOut();
      }

      if (!active) {
        return;
      }

      setResettingSession(false);
    };

    clearExistingSession();

    return () => {
      active = false;
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (resettingSession) return;
    setLoading(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMessage("Forkert email eller adgangskode.");
      setLoading(false);
    } else {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session?.access_token) {
        setErrorMessage("Kunne ikke hente login-sessionen.");
        setLoading(false);
        return;
      }

      try {
        const authMe = await fetchAuthMe(session.access_token);
        if (authMe.appAccess === "employee") {
          const transferUrl = await createEmployeeAppTransferUrl(session);
          window.location.assign(transferUrl);
          return;
        }

        window.location.assign(`${getAdminAppUrl().replace(/\/$/, "")}/home`);
      } catch (authError) {
        await supabase.auth.signOut();
        setErrorMessage(authError.message || "Du har ikke adgang til en app endnu.");
        setLoading(false);
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h2>Log ind</h2>
          <p className="text-muted">Indtast dine oplysninger nedenfor</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          {resettingSession && <div className="session-alert text-center">Forbereder login...</div>}
          {errorMessage && <div className="error-alert text-center">{errorMessage}</div>}

          <div className="input-group">
            <input
              type="email"
              placeholder="Email adresse"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              disabled={resettingSession}
            />
            <input
              type="password"
              placeholder="Adgangskode"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={resettingSession}
            />
          </div>

          <div className="forgot-link">
            <Link to="/forgot">Glemt adgangskode?</Link>
          </div>

          <button 
            className="btn btn-primary w-100 font-weight-bold" 
            type="submit" 
            disabled={loading || resettingSession}
          >
            {resettingSession ? "Forbereder..." : loading ? "Logger ind..." : "Log ind"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
