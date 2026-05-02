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
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState({ type: "", text: "" });
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
      setIsVerified(false); // Reset verification if role changes
    } else {
      if (name === 'email' || name === 'collegeId') {
        setVerificationStatus({ type: "", text: "" });
      }
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleVerify = async () => {
    if (!formData.email || !formData.collegeId) {
      setVerificationStatus({ type: "error", text: "Please enter both Email and College ID to verify ❌" });
      return;
    }

    if (!formData.email.endsWith("@banasthali.in")) {
      setVerificationStatus({ type: "error", text: "Please use your @banasthali.in email ID ❌" });
      return;
    }

    setIsVerifying(true);
    setVerificationStatus({ type: "", text: "" });
    setMessage(""); // Clear bottom message when verifying

    try {
      const res = await axios.post("http://localhost:5001/api/auth/verify-student", {
        email: formData.email,
        collegeId: formData.collegeId,
        role: formData.role
      });

      if (res.data.success) {
        const { student } = res.data;
        setFormData(prev => ({
          ...prev,
          firstName: student.firstName,
          lastName: student.lastName,
          gender: student.gender
        }));
        setIsVerified(true);
        setVerificationStatus({ type: "success", text: "Verification successful! Details auto-filled. ✅" });
      }
    } catch (err) {
      setIsVerified(false);
      setVerificationStatus({ type: "error", text: err.response?.data?.message || "Verification failed ❌" });
    } finally {
      setIsVerifying(false);
    }
  };


  const handleSignup = async (e) => {
    e.preventDefault();

    if ((formData.role === "student" || formData.role === "staff") && !isVerified) {
      setVerificationStatus({ type: "error", text: "Please verify your details first ❌" });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match ❌");
      return;
    }

    if (!formData.email.endsWith("@banasthali.in")) {
      setMessage("Please use your @banasthali.in email ID ❌");
      return;
    }

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).+$/;
    if (!passwordRegex.test(formData.password)) {
      setMessage("Password must contain at least one letter and one number ❌");
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
      const sanitizedData = {
        ...formData,
        email: formData.email.trim().toLowerCase(),
        password: formData.password.trim(),
        confirmPassword: formData.confirmPassword.trim(),
        securityAnswer: formData.securityAnswer.trim(),
        captchaToken: captchaData.token,
        captchaAnswer: captchaAnswer
      };

      const res = await axios.post("http://localhost:5001/api/auth/signup", sanitizedData);
      sessionStorage.setItem("token", res.data.token);
      setMessage("Registration successful! 🎉 Your account is now in the approval queue. An administrator will review your details shortly.");
      setTimeout(() => navigate(from, { replace: true }), 3000);
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
        <div className="brand-logo-shared" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div className="logo-box-shared">C</div>
          <span className="brand-text-shared">CampusKart</span>
        </div>
        <h2>Join the community</h2>
        <form className="auth-form" onSubmit={handleSignup}>
          <div className="auth-form-grid">
            <div className="full-width">
              <label>I am a:</label>
              <select name="role" value={formData.role} onChange={handleChange} required>
                <option value="student">Student</option>
                <option value="staff">Staff</option>
              </select>
            </div>

            {/* Email and College ID at the top for verification */}
            <div className="full-width" style={{ position: 'relative' }}>
              <div className="verification-group" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    type="email"
                    name="email"
                    placeholder="College Email ID *"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isVerified}
                  />
                  <input
                    type="text"
                    name="collegeId"
                    placeholder="College ID / Employee ID *"
                    value={formData.collegeId}
                    onChange={handleChange}
                    required
                    disabled={isVerified}
                  />
                </div>
                {/* Show Verify button for both student and staff */}
                {!isVerified && (
                  <button 
                    type="button" 
                    onClick={handleVerify} 
                    disabled={isVerifying}
                    style={{ 
                      height: 'fit-content', 
                      padding: '12px 20px', 
                      marginTop: '0'
                    }}
                  >
                    {isVerifying ? "Verifying..." : "Verify Details"}
                  </button>
                )}
                {isVerified && (
                   <div style={{ color: '#00D14E', fontWeight: '700', padding: '10px' }}>✓ Verified</div>
                )}
              </div>
              
              {/* Verification Message below the College ID field */}
              {verificationStatus.text && (
                <div style={{ 
                  fontSize: '0.85rem', 
                  marginTop: '8px', 
                  color: verificationStatus.type === 'success' ? '#00D14E' : '#ff4d4d',
                  fontWeight: '500'
                }}>
                  {verificationStatus.text}
                </div>
              )}
            </div>

            {/* Separation between verification and first name */}
            <div className="full-width" style={{ 
              margin: '15px 0 5px 0', 
              paddingBottom: '5px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Personal Details
              </span>
              <div style={{ flex: 1, height: '1.5px', backgroundColor: '#3b82f6', opacity: '0.5' }}></div>
            </div>

            <input
              type="text"
              name="firstName"
              placeholder="First Name *"
              value={formData.firstName}
              onChange={handleChange}
              required
              disabled={isVerified}
            />
            <input
              type="text"
              name="middleName"
              placeholder="Middle Name"
              value={formData.middleName}
              onChange={handleChange}
              disabled={isVerified}
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name *"
              value={formData.lastName}
              onChange={handleChange}
              required
              disabled={isVerified}
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
                      disabled={isVerified}
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
                  placeholder="Hostel Name"
                  value={formData.address}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                />
              </div>
            )}

            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password *"
                value={formData.password}
                onChange={handleChange}
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
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password *"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                style={{ width: '100%', paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                {showConfirmPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>

            <input
              type="text"
              name="department"
              placeholder="Department *"
              value={formData.department}
              onChange={handleChange}
              required
            />

            <div className="full-width">
              <input
                type="tel"
                name="mobileNumber"
                placeholder="Mobile Number *"
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
                placeholder="Your Answer *"
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
