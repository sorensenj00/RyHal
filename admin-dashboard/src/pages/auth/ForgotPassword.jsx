import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { getResetPasswordUrl } from "../../auth/session";
import "../login/Login.css";
import "./AuthRecovery.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getResetPasswordUrl(),
    });

    if (error) {
      setErrorMessage(error.message || "Kunne ikke sende mailen.");
      setLoading(false);
      return;
    }

    setSuccessMessage("Vi har sendt et link til nulstilling af adgangskode til din email.");
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h2>Glemt adgangskode</h2>
          <p className="text-muted recovery-helper-text">
            Indtast din email, så sender vi et link til at oprette en ny adgangskode.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {errorMessage && <div className="recovery-message error">{errorMessage}</div>}
          {successMessage && <div className="recovery-message success">{successMessage}</div>}

          <div className="input-group">
            <input
              type="email"
              placeholder="Email adresse"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="recovery-actions">
            <Link to="/login">Tilbage til login</Link>
          </div>

          <button
            className="btn btn-primary w-100 font-weight-bold"
            type="submit"
            disabled={loading}
          >
            {loading ? "Sender..." : "Send nulstillingslink"}
          </button>

          <p className="recovery-hint">
            Når du åbner linket, kan du vælge en ny adgangskode direkte i admin-dashboard.
          </p>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
