import { useState } from "react";
import axios from "axios";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "../styles/Auth.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:5001/api/auth/login",
        { email, password }
      );

      localStorage.setItem("token", res.data.token);
      setMessage("Login successful ✅");
      setTimeout(() => navigate(from, { replace: true }), 1000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed ❌");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>CampusKart Login</h2>

        <form className="auth-form" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Login</button>
        </form>

        <p className="auth-message">{message}</p>
        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up</Link>
          <br />
          <Link to="/forgot-password">Forgot Password?</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
