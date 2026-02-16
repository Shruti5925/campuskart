import { useState } from "react";
import axios from "axios";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "../styles/Auth.css";

function Signup() {
  const [formData, setFormData] = useState({
    role: "student",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    collegeId: "",
    department: "",
    mobileNumber: "",
    securityQuestion: "What is your pet's name?",
    securityAnswer: ""
  });

  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const securityQuestions = [
    "What is your pet's name?",
    "What is your mother's maiden name?",
    "What was the name of your first school?",
    "What is your favorite book?",
    "In what city were you born?"
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match ❌");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5001/api/auth/signup", formData);
      localStorage.setItem("token", res.data.token);
      setMessage("Signup successful! Redirecting... ✅");
      setTimeout(() => navigate(from, { replace: true }), 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.detail
        ? `Error: ${err.response.data.detail}`
        : (err.response?.data?.message || "Signup failed ❌");
      setMessage(errorMsg);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Join CampusKart</h2>
        <form className="auth-form" onSubmit={handleSignup}>
          <div className="auth-form-grid">
            <div className="full-width">
              <label>I am a:</label>
              <select name="role" value={formData.role} onChange={handleChange} required>
                <option value="student">Student</option>
                <option value="staff">Staff</option>
              </select>
            </div>

            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="College Email ID"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="collegeId"
              placeholder="College ID / Employee ID"
              value={formData.collegeId}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="department"
              placeholder="Department"
              value={formData.department}
              onChange={handleChange}
              required
            />

            <div className="full-width">
              <input
                type="tel"
                name="mobileNumber"
                placeholder="Mobile Number"
                value={formData.mobileNumber}
                onChange={handleChange}
                style={{ width: "100%" }}
                required
              />
            </div>

            <div className="full-width">
              <label>Security Question for Recovery:</label>
              <select name="securityQuestion" value={formData.securityQuestion} onChange={handleChange} required>
                {securityQuestions.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>

            <div className="full-width">
              <input
                type="text"
                name="securityAnswer"
                placeholder="Your Answer"
                value={formData.securityAnswer}
                onChange={handleChange}
                style={{ width: "100%" }}
                required
              />
            </div>
          </div>

          <button type="submit" style={{ marginTop: "10px" }}>Sign Up</button>
        </form>
        <p className="auth-message">{message}</p>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
