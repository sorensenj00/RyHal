import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { APP_ACCESS, createEmployeeAppTransferUrl, fetchAuthMe, getAppUrlForRedirectTarget } from "../../auth/session";
import "../login/Login.css";
import "./AuthRecovery.css";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("Venter på recovery-session...");
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    let active = true;

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      const session = data?.session;
      setHasRecoverySession(Boolean(session?.access_token));
      setInfoMessage(session?.access_token ? "Vælg din nye adgangskode herunder." : "Åbn linket fra din mail for at fortsætte.");
      setLoading(false);
    };

    syncSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) {
        return;
      }

      if (event === "PASSWORD_RECOVERY" || session?.access_token) {
        setHasRecoverySession(Boolean(session?.access_token));
        setInfoMessage("Vælg din nye adgangskode herunder.");
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    if (password.length < 8) {
      setErrorMessage("Adgangskoden skal være mindst 8 tegn.");
      setSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Adgangskoderne matcher ikke.");
      setSubmitting(false);
      return;
    }

    if (!hasRecoverySession) {
      setErrorMessage("Recovery-sessionen mangler. Åbn linket fra din mail igen.");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setErrorMessage(error.message || "Kunne ikke opdatere adgangskoden.");
      setSubmitting(false);
      return;
    }

    try {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session?.access_token) {
        throw new Error("Kunne ikke hente session efter opdatering.");
      }

      const authMe = await fetchAuthMe(session.access_token);
      const targetUrl = authMe.appAccess === APP_ACCESS.EMPLOYEE
        ? await createEmployeeAppTransferUrl(session)
        : getAppUrlForRedirectTarget(authMe.redirectTarget);

      window.location.assign(targetUrl);
    } catch (redirectError) {
      setErrorMessage(redirectError.message || "Adgangskoden er opdateret, men vi kunne ikke sende dig videre.");
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h2>Opret ny adgangskode</h2>
          <p className="text-muted recovery-helper-text">
            Sæt en ny adgangskode til din medarbejderkonto for at fortsætte.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {errorMessage && <div className="recovery-message error">{errorMessage}</div>}
          {infoMessage && !errorMessage && <div className="recovery-message info">{infoMessage}</div>}

          <div className="input-group">
            <input
              type="password"
              placeholder="Ny adgangskode"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Gentag adgangskode"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="recovery-actions">
            <Link to="/login">Tilbage til login</Link>
          </div>

          <button
            className="btn btn-primary w-100 font-weight-bold"
            type="submit"
            disabled={loading || submitting || !hasRecoverySession}
          >
            {submitting ? "Gemmer..." : "Gem adgangskode"}
          </button>

          <p className="recovery-hint">
            Når adgangskoden er gemt, bliver du sendt til den rigtige app automatisk.
          </p>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
