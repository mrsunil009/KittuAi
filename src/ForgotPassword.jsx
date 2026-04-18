import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './App.css';

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Validate form inputs
  const validateForm = () => {
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }
    
    if (!newPassword.trim()) {
      setError("New password is required");
      return false;
    }
    
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(),
          newPassword 
        })
      });

      if (!res.ok) {
        // Handle HTTP errors
        const errorText = await res.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { msg: `Server error: ${res.status}` };
        }
        throw new Error(errorData.msg || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setLoading(false);

      setMessage("Password updated successfully! Redirecting to login...");
      setError("");
      
      // Clear form
      setEmail("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Redirect to login after 2 seconds
      setTimeout(() => navigate("/login"), 2000);
      
    } catch (err) {
      setLoading(false);
      console.error("Password reset error:", err);
      
      // More specific error messages
      if (err.message.includes("Failed to fetch")) {
        setError("Cannot connect to server. Please make sure the backend is running on port 5000.");
      } else if (err.message.includes("Email not found") || err.message.includes("not registered")) {
        setError("Email not registered. Please check your email address.");
      } else if (err.message.includes("Server error")) {
        setError("Server error. Please try again.");
      } else {
        setError(err.message || "Network error. Please try again.");
      }
    }
  };

  return (
    <div className='login-container'>
      <h2 className="gradient-text">Reset Password</h2>
      <p className="subtitle">Enter your email and new password</p>
      
      {/* Simplified Single Form */}
      <form className="login-form" onSubmit={handleSubmit}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          disabled={loading}
          required
        />
        
        <input 
          type="password" 
          placeholder="New Password" 
          value={newPassword} 
          onChange={(e) => setNewPassword(e.target.value)} 
          disabled={loading}
          minLength="6"
          required
        />
        
        <input 
          type="password" 
          placeholder="Confirm Password" 
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)} 
          disabled={loading}
          minLength="6"
          required
        />
        
        <button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Reset Password"}
        </button>
      </form>

      {/* Success Message */}
      {message && (
        <div className="message success">
          {message}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="message error">
          {error}
        </div>
      )}

      <p className="footer-text">
        Remembered your password? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default ForgotPassword;
