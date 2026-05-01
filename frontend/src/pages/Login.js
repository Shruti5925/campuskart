import { useState } from "react";
import axios from "axios";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "../styles/Auth.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.endsWith("@banasthali.in")) {
      setMessage("Please use your @banasthali.in email ID ❌");
      return;
    }

    try {
      const sanitizedEmail = email.trim().toLowerCase();
      const sanitizedPassword = password.trim();

      const res = await axios.post(
        "http://localhost:5001/api/auth/login",
        { email: sanitizedEmail, password: sanitizedPassword }
      );

      sessionStorage.setItem("token", res.data.token);
      sessionStorage.setItem("user", JSON.stringify(res.data.user));
      setMessage("Login successful ✅");
      
      const redirectPath = res.data.role === 'admin' ? '/admin' : from;
      setTimeout(() => navigate(redirectPath, { replace: true }), 1000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed ❌");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="brand-logo-shared" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div className="logo-box-shared">C</div>
          <span className="brand-text-shared">CampusKart</span>
        </div>
        <h2>Login to your account</h2>

        <form className="auth-form" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', paddingRight: '40px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '5px',
                display: 'flex',
                alignItems: 'center',
                color: '#64748b',
                marginTop: '0'
              }}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              )}
            </button>
          </div>

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
