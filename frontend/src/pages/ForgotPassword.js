import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Auth.css";

function ForgotPassword() {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleSendOtp = async (e) => {
        e.preventDefault();
        try {
            const sanitizedEmail = email.trim().toLowerCase();
            setMessage("Checking email and sending code...");
            await axios.post("http://localhost:5001/api/auth/send-otp", { 
                email: sanitizedEmail,
                checkExists: true 
            });
            setStep(2);
            setMessage("A verification code was sent to your registered email address. ✅");
        } catch (err) {
            setMessage(err.response?.data?.message || "Error sending code. Please verify your email.");
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage("Passwords do not match ❌");
            return;
        }

        const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).+$/;
        if (!passwordRegex.test(newPassword)) {
            setMessage("Password must contain at least one letter and one number ❌");
            return;
        }

        try {
            await axios.post("http://localhost:5001/api/auth/reset-password", {
                email: email.trim().toLowerCase(),
                otp: otp.trim(),
                newPassword: newPassword.trim()
            });
            setMessage("Password reset successful! Redirecting to login... ✅");
            setTimeout(() => navigate("/login"), 2000);
        } catch (err) {
            setMessage(err.response?.data?.message || "Reset failed. Please verify your OTP code.");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Reset Password</h2>

                {step === 1 && (
                    <form className="auth-form" onSubmit={handleSendOtp}>
                        <p>Enter your email to receive a recovery verification code.</p>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <button type="submit">Send OTP Code</button>
                    </form>
                )}

                {step === 2 && (
                    <form className="auth-form" onSubmit={handleResetPassword}>
                        <p>Enter the 6-digit OTP code sent to <strong>{email}</strong> and your new password.</p>
                        <input
                            type="text"
                            placeholder="Enter 6-Digit OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                            maxLength="6"
                        />
                        <input
                            type="password"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        <button type="submit">Reset Password</button>
                    </form>
                )}

                <p className="auth-message">{message}</p>
                <p className="auth-footer">
                    Remembered? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}

export default ForgotPassword;
