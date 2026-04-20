import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import './App.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (res.ok) {
        alert("OTP sent to your email!");
        // Email ko save kar lete hain taaki OTP verify karte waqt kaam aaye
        localStorage.setItem("resetEmail", email); 
        navigate("/verify-otp");
      } else {
        alert(data.msg || "User not found");
      }
    } catch (err) {
      alert("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <h1 className="brand-title">Kittu AI</h1>
          <h2 className="gradient-text">Forgot Password?</h2>
          <p className="subtitle">Enter your email to receive a 6-digit OTP</p>
        </div>

        <form className="auth-form" onSubmit={handleForgot}>
          <div className="input-group">
            <label>Registered Email</label>
            <input 
              type="email" 
              placeholder="name@example.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="auth-link">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}