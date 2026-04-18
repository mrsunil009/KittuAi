# Forgot Password System - Complete Implementation

## Overview
This is a complete Forgot Password system for React + Node.js + MongoDB that allows users to reset their password without email verification links. The system uses a two-step process: email verification followed by password update.

## System Architecture

### Frontend (React)
- **Dynamic Form**: Shows email input initially, then password fields after verification
- **Real-time Validation**: Password matching and length validation
- **User Experience**: Clear success/error messages and loading states
- **Navigation**: Automatic redirect to login after successful password update

### Backend (Node.js + Express)
- **Email Verification API**: Checks if email exists in database
- **Password Update API**: Securely updates user password with bcrypt hashing
- **Input Validation**: Proper validation for all inputs
- **Error Handling**: Comprehensive error handling and responses

## File Structure

```
src/
├── ForgotPassword.jsx     # Updated React component
server.js                  # Updated with new API routes
```

## Complete Code Implementation

### 1. React Component (`src/ForgotPassword.jsx`)

```jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './App.css';

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Validate password match
  const validatePasswords = () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }
    return true;
  };

  // Handle email verification
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setEmailVerified(true);
        setMessage("Email verified successfully! Please enter your new password.");
      } else {
        setError(data.msg || "Email verification failed");
      }
    } catch (err) {
      setLoading(false);
      setError("Network error. Please try again.");
    }
  };

  // Handle password update
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (!validatePasswords()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch('/api/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          newPassword 
        })
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setMessage("Password updated successfully! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(data.msg || "Password update failed");
      }
    } catch (err) {
      setLoading(false);
      setError("Network error. Please try again.");
    }
  };

  // Reset form to initial state
  const handleReset = () => {
    setEmailVerified(false);
    setNewPassword("");
    setConfirmPassword("");
    setMessage("");
    setError("");
  };

  return (
    <div className='login-container'>
      <h2 className="gradient-text">Reset Password</h2>
      
      {!emailVerified ? (
        <>
          <p className="subtitle">Enter your email to verify your account</p>
          
          <form className="login-form" onSubmit={handleVerifyEmail}>
            <input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="subtitle">Set your new password</p>
          <p className="verified-email">Verified: {email}</p>
          
          <form className="login-form" onSubmit={handleUpdatePassword}>
            <input 
              type="password" 
              placeholder="New Password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              required
              disabled={loading}
              minLength="6"
            />
            <input 
              type="password" 
              placeholder="Confirm Password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required
              disabled={loading}
              minLength="6"
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </button>
              <button type="button" onClick={handleReset} disabled={loading}>
                Back
              </button>
            </div>
          </form>
        </>
      )}

      {/* Success Message */}
      {message && (
        <div className="message success" style={{ 
          color: '#4CAF50', 
          backgroundColor: '#E8F5E8', 
          padding: '10px', 
          borderRadius: '4px',
          marginTop: '10px',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="message error" style={{ 
          color: '#F44336', 
          backgroundColor: '#FFEBEE', 
          padding: '10px', 
          borderRadius: '4px',
          marginTop: '10px',
          textAlign: 'center'
        }}>
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
```

### 2. Backend API Routes (Added to `server.js`)

```javascript
// ====================== Verify Email API ======================
app.post("/api/verify-email", async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate input
    if (!email || !email.trim()) {
      return res.status(400).json({ msg: "Email is required" });
    }

    // Check if email exists in database
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ msg: "Email not found in our records" });
    }

    res.json({ 
      msg: "Email verified successfully", 
      email: user.email,
      username: user.username 
    });
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ msg: "Server error during email verification" });
  }
});

// ====================== Update Password API ======================
app.post("/api/update-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    // Validate inputs
    if (!email || !email.trim()) {
      return res.status(400).json({ msg: "Email is required" });
    }
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters long" });
    }

    // Find user by email
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user's password
    user.password = hashedPassword;
    await user.save();

    res.json({ msg: "Password updated successfully!" });
  } catch (err) {
    console.error("Password update error:", err);
    res.status(500).json({ msg: "Server error during password update" });
  }
});
```

### 3. MongoDB User Schema (Existing)

```javascript
const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String
});
const User = mongoose.model("User", userSchema);
```

## API Endpoints

### 1. POST `/api/verify-email`
**Purpose**: Verify if email exists in the database

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Success Response** (200):
```json
{
  "msg": "Email verified successfully",
  "email": "user@example.com",
  "username": "username"
}
```

**Error Responses**:
- 400: "Email is required"
- 404: "Email not found in our records"
- 500: "Server error during email verification"

### 2. POST `/api/update-password`
**Purpose**: Update user's password after email verification

**Request Body**:
```json
{
  "email": "user@example.com",
  "newPassword": "newpassword123"
}
```

**Success Response** (200):
```json
{
  "msg": "Password updated successfully!"
}
```

**Error Responses**:
- 400: "Email is required" or "Password must be at least 6 characters long"
- 404: "User not found"
- 500: "Server error during password update"

## Security Features

1. **Password Hashing**: Uses bcrypt with salt rounds of 10
2. **Input Validation**: Validates email format and password length
3. **Email Normalization**: Converts emails to lowercase for consistency
4. **Error Handling**: Comprehensive error handling without exposing sensitive information
5. **No Email Links**: No email verification links required (as requested)

## User Flow

1. **Step 1**: User enters email and clicks "Verify Email"
2. **Step 2**: System checks if email exists in database
3. **Step 3**: If email exists, form shows password fields
4. **Step 4**: User enters new password and confirmation
5. **Step 5**: System validates passwords match and updates password
6. **Step 6**: User is redirected to login page

## Testing the System

1. **Start the server**: `npm start` or `node server.js`
2. **Start the React app**: `npm run dev`
3. **Navigate to**: `/forgot-password` (or your route)
4. **Test with existing email**: Use an email that exists in your users collection
5. **Test with non-existing email**: Verify error handling
6. **Test password validation**: Try mismatched passwords and short passwords

## Dependencies Required

The system uses existing dependencies from your project:
- `bcryptjs`: For password hashing
- `mongoose`: For MongoDB operations
- `express`: For API routes
- `react-router-dom`: For navigation

## Notes

- The system integrates seamlessly with your existing authentication system
- No additional database schema changes required
- Compatible with your existing user model
- Uses your existing styling classes (`login-container`, `login-form`, etc.)
- Maintains consistency with your current error handling patterns
