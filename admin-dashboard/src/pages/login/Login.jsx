import React, { useState } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import './Login.css'; 

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMessage("Forkert email eller adgangskode.");
      setLoading(false);
    } else {
      navigate("/home");
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
          {errorMessage && <div className="error-alert text-center">{errorMessage}</div>}

          <div className="input-group">
            <input
              type="email"
              placeholder="Email adresse"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <input
              type="password"
              placeholder="Adgangskode"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="forgot-link">
            <Link to="/forgot">Glemt adgangskode?</Link>
          </div>

          <button 
            className="btn btn-primary w-100 font-weight-bold" 
            type="submit" 
            disabled={loading}
          >
            {loading ? "Logger ind..." : "Log ind"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
