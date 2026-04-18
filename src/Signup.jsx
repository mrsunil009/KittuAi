import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './App.css';

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Note: Backend URL ko check karein, agar proxy set hai to sirf "/api/signup" likhein
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      });

      const data = await res.json();
      
      if (res.ok) {
        alert(data.msg || "Account created successfully!");
        navigate("/login"); // Signup ke baad Login par bhej do
      } else {
        alert(data.msg || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      alert("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='auth-container'>
      <div className="auth-card fade-in">
        <div className="auth-header">
          <h1 className="brand-title">Kittu AI</h1>
          <h2 className="gradient-text">Create Account</h2>
          <p className="subtitle">Sign up to start chatting with Kittu AI</p>
        </div>

        <form className="auth-form" onSubmit={handleSignup}>
          <div className="input-group">
            <label>Full Name</label>
            <input 
              type="text" 
              placeholder="Enter your username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
          </div>

          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="name@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="Create a strong password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Creating Account..." : "Signup"}
          </button>
        </form>

        <div className="auth-footer">
          <p className="footer-text">
            Already have an account? <Link to="/login" className="auth-link">Login</Link>
          </p>
          <button 
            onClick={() => navigate("/")} 
            style={{background: 'none', border: 'none', color: '#888', marginTop: '15px', cursor: 'pointer', fontSize: '12px'}}
          >
            ← Back to Chat
          </button>
        </div>
      </div>
    </div>
  )
}

export default Signup;