import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Auth.css";

function ForgotPassword() {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [securityQuestion, setSecurityQuestion] = useState("");
    const [securityAnswer, setSecurityAnswer] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleFetchQuestion = async (e) => {
        e.preventDefault();
        try {
            const sanitizedEmail = email.trim().toLowerCase();
            const res = await axios.post("http://localhost:5001/api/auth/get-security-question", { email: sanitizedEmail });
            setSecurityQuestion(res.data.question);
            setStep(2);
            setMessage("");
        } catch (err) {
            setMessage(err.response?.data?.message || "User not found");
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
                securityAnswer: securityAnswer.trim(),
                newPassword: newPassword.trim()
            });
            setMessage("Password reset successful! Redirecting to login... ✅");
            setTimeout(() => navigate("/login"), 2000);
        } catch (err) {
            setMessage(err.response?.data?.message || "Reset failed. Check answer.");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Reset Password</h2>

                {step === 1 && (
                    <form className="auth-form" onSubmit={handleFetchQuestion}>
                        <p>Enter your email to find your account.</p>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <button type="submit">Continue</button>
                    </form>
                )}

                {step === 2 && (
                    <form className="auth-form" onSubmit={handleResetPassword}>
                        <p><strong>Question:</strong> {securityQuestion}</p>
                        <input
                            type="text"
                            placeholder="Your Answer"
                            value={securityAnswer}
                            onChange={(e) => setSecurityAnswer(e.target.value)}
                            required
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
