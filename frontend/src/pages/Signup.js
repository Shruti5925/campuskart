import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "../styles/Auth.css";

function Signup() {
  const [formData, setFormData] = useState({
    role: "student",
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    address: "",
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
  const [captchaData, setCaptchaData] = useState({ question: "", token: "" });
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const fetchCaptcha = async () => {
    try {
      console.log("Fetching captcha...");
      const res = await axios.get("http://localhost:5001/api/auth/captcha");
      console.log("Captcha received:", res.data);
      setCaptchaData(res.data);
      setCaptchaAnswer(""); // Clear previous answer
    } catch (err) {
      console.error("Error fetching captcha:", err);
      setMessage("Error loading security check. Please refresh. ❌");
    }
  };

  const securityQuestions = [
    "What is your pet's name?",
    "What is your mother's maiden name?",
    "What was the name of your first school?",
    "What is your favorite book?",
    "In what city were you born?"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Clear hostel name if switching to staff
    if (name === 'role' && value === 'staff') {
      setFormData({ ...formData, role: value, address: '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };


  const handleSignup = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match ❌");
      return;
    }

    if (!formData.email.endsWith("@banasthali.in")) {
      setMessage("Please use your @banasthali.in email ID ❌");
      return;
    }

    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(formData.mobileNumber)) {
      setMessage("Mobile number must be exactly 10 digits ❌");
      return;
    }

    if (!formData.gender) {
      setMessage("Please select your gender ❌");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5001/api/auth/signup", {
        ...formData,
        captchaToken: captchaData.token,
        captchaAnswer: captchaAnswer
      });
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
              name="firstName"
              placeholder="First Name *"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="middleName"
              placeholder="Middle Name"
              value={formData.middleName}
              onChange={handleChange}
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name *"
              value={formData.lastName}
              onChange={handleChange}
              required
            />

            <div className="full-width">
              <label>Gender *:</label>
              <div className="gender-options">
                {["Male", "Female", "Other"].map((g) => (
                  <label key={g} className="gender-option">
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={formData.gender === g}
                      onChange={handleChange}
                      required
                    />
                    {g}
                  </label>
                ))}
              </div>
            </div>

            {formData.role === 'student' && (
              <div className="full-width">
                <input
                  type="text"
                  name="address"
                  placeholder="Hostel Name *"
                  value={formData.address}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                  required
                />
              </div>
            )}


            <div className="full-width">
              <input
                type="email"
                name="email"
                placeholder="College Email ID"
                value={formData.email}
                onChange={handleChange}
                style={{ width: "100%" }}
                required
              />
            </div>

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

            <div className="full-width captcha-section" style={{
              marginTop: '20px',
              padding: '15px',
              border: '2px dashed #00D14E',
              borderRadius: '12px',
              backgroundColor: '#f8fafc'
            }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Verification Check:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div className="captcha-challenge" style={{
                  backgroundColor: '#f1f5f9',
                  padding: '10px 15px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  color: '#334155',
                  border: '1px solid #e2e8f0',
                  flex: '1'
                }}>
                  {captchaData.question ? captchaData.question : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Loading security check...</span>}
                </div>
                <button
                  type="button"
                  onClick={fetchCaptcha}
                  title="Refresh CAPTCHA"
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#334155',
                    flexShrink: 0
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
                </button>

              </div>
              <input
                type="text"
                placeholder="Enter Answer"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                required
                style={{ marginTop: '10px', width: '100%' }}
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
