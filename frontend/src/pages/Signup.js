import { useState, useEffect} from "react";
import axios from "axios";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "../styles/Auth.css";

function Signup() {
  const [formData, setFormData] = useState({
    role: "student",
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    collegeId: "",
    department: "",
    mobileNumber: "",
    gender: "",
    hostelName: "",
    securityQuestion: "What is your pet's name?",
    securityAnswer: ""
  });

  const [message, setMessage] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [userCaptcha, setUserCaptcha] = useState("");
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
  const { name, value } = e.target;

  // mobile number = only digits + max 10
  if (name === "mobileNumber") {
    const cleaned = value.replace(/\D/g, "").slice(0, 10);
    setFormData({ ...formData, mobileNumber: cleaned });
    return;
  }

  setFormData({ ...formData, [name]: value });
};
  const generateCaptcha = () => {
  const a = Math.floor(Math.random() * 10);
  const b = Math.floor(Math.random() * 10);
  setCaptchaQuestion(`${a} + ${b} = ?`);
  setCaptchaAnswer(String(a + b));
};
useEffect(() => {
  generateCaptcha();
}, []);


  const handleSignup = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match ❌");
      return;
    }

    if (formData.mobileNumber.length !== 10) {
    setMessage("Mobile number must be exactly 10 digits ❌");
    return;
  }

    if (userCaptcha !== captchaAnswer) {
      setMessage("Captcha incorrect ❌");
     generateCaptcha();
     return;
   } 

    try {
      const payload = {
     ...formData,
     fullName: `${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim()
     };
      const res = await axios.post("http://localhost:5001/api/auth/signup", payload);
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

           <div className="full-width" style={{ display: "flex", gap: "12px" }}>

  <div className="field-col">
    <label>
      First Name <span className="required-star">*</span>
    </label>
    <input
      type="text"
      name="firstName"
      placeholder="First Name"
      value={formData.firstName}
      onChange={handleChange}
      required
    />
  </div>

   <div className="field-col">
    <label>Middle Name</label>
    <input
      type="text"
      name="middleName"
      placeholder="Middle Name"
      value={formData.middleName}
      onChange={handleChange}
    />
  </div>

  <div className="field-col">
    <label>
      Last Name <span className="required-star">*</span>
    </label>
    <input
      type="text"
      name="lastName"
      placeholder="Last Name"
      value={formData.lastName}
      onChange={handleChange}
      required
    />
  </div>

</div>

<label>
  Email <span className="required-star">*</span>
</label>

  <input
    type="email"
    name="email"
    placeholder="College Email ID"
    value={formData.email}
    onChange={handleChange}
    required
  />


<label>
  Password <span className="required-star">*</span>
</label>

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <label>
           ConfirmPassword <span className="required-star">*</span>
          </label>

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            <label>
             CollegeId <span className="required-star">*</span>
            </label>

            <input
              type="text"
              name="collegeId"
              placeholder="College ID / Employee ID"
              value={formData.collegeId}
              onChange={handleChange}
              required
            />
      <div className="field-col">
  <label>Department</label>
  <input
    type="text"
    name="department"
    placeholder="Department"
    value={formData.department}
    onChange={handleChange}
    required
  />
</div>

{formData.role === "student" && (
  <div className="field-col">
    <label>HostelName</label>
    <input
      type="text"
      name="hostelName"
      placeholder="Hostel Name"
      value={formData.hostelName}
      onChange={handleChange}
      required
    />
  </div>
)}

<label>
  MobileNumber <span className="required-star">*</span>
</label>

<input
  type="tel"
  name="mobileNumber"
  placeholder="Mobile Number (10 digits)"
  value={formData.mobileNumber}
  onChange={handleChange}
  pattern="[0-9]{10}"
  maxLength={10}
  required
/>

           <div className="full-width">
  <label>Gender:</label>

  <div style={{ display: "flex", gap: "20px", marginTop: "6px" }}>
    <label>
      <input
        type="radio"
        name="gender"
        value="male"
        checked={formData.gender === "male"}
        onChange={handleChange}
        required
      />
      Male
    </label>

    <label>
      <input
        type="radio"
        name="gender"
        value="female"
        checked={formData.gender === "female"}
        onChange={handleChange}
      />
      Female
    </label>

    <label>
      <input
        type="radio"
        name="gender"
        value="other"
        checked={formData.gender === "other"}
        onChange={handleChange}
      />
      Other
    </label>
  </div>
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

          <label>
         Captcha <span className="required-star">*</span>
        </label>

          <div className="full-width" style={{ marginTop: "10px" }}>
             <label>Captcha:</label>

             <div style={{
             fontSize: "20px",
             fontWeight: "bold",
             background: "#f2f2f2",
             padding: "8px",
             marginBottom: "6px",
              display: "inline-block"
             }}>
             {captchaQuestion}
          </div>

  <input
    type="text"
    placeholder="Enter captcha answer"
    value={userCaptcha}
    onChange={(e) => setUserCaptcha(e.target.value)}
    required
  />

  <button
    type="button"
    onClick={generateCaptcha}
    style={{ marginTop: "6px" }}
  >
    Refresh Captcha
  </button>
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
