import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './App.css';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        credentials: 'include', // Session cookies ke liye
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      
      if (res.ok) {
        // 1. Token save karein (Chat.jsx isi ko check karega)
        if (data.token) {
          localStorage.setItem("token", data.token);
        }

        // 2. User info save karein (Chat.jsx ke keys se match kar diya hai)
        if (data.user) {
          localStorage.setItem("userName", data.user.username || "User");
          localStorage.setItem("userEmail", data.user.email);
          if (data.user.photo) localStorage.setItem("userPhoto", data.user.photo);
        }

        // 3. Success message aur Redirect
        alert(data.msg || "Login Successful!");
        
        // Chat page (Home) par bhejein aur refresh karein taaki header update ho jaye
        navigate("/");
        window.location.reload(); 
      } else {
        alert(data.msg || "Login failed. Check credentials.");
      }
    } catch (err) {
      console.error("Login fetch error:", err);
      alert("Server error. Please check if your backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='auth-container'>
      <div className="auth-card fade-in">
        <div className="auth-header">
          <h1 className="brand-title">Kittu AI</h1>
          <h2 className="gradient-text">Welcome Back!</h2>
          <p className="subtitle">Please login to your account</p>
        </div>

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="Enter your email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="auth-footer">
          <p className="forgot-password">
            <Link to="/forgot-password">Forgot Password?</Link>
          </p>
          <p className="footer-text">
            Don’t have an account? <Link to="/signup" className="auth-link">Signup</Link>
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

export default Login;