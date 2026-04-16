import React, { useState } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom"; // 1. Importér denne

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // 2. Initialisér den

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Fejl ved login: " + error.message);
    } else {
      console.log("Logget ind!");
      navigate("/home"); // 3. Send brugeren til forsiden
    }
    setLoading(false);
  };
  return (
    <div className="login-container">
      <h2>Log ind</h2>
      <form onSubmit={handleLogin}>
        <input 
          type="email" 
          placeholder="Email" 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Adgangskode" 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        <button type="submit" disabled={loading}>
          {loading ? "Logger ind..." : "Log ind"}
        </button>
      </form>
    </div>
  );
}

export default Login;
