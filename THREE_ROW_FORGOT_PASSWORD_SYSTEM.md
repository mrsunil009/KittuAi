# Three-Row Forgot Password System - Complete Implementation

## Overview
This is a complete Forgot Password system with a three-row layout for React + Node.js + MongoDB. The system provides a clean, step-by-step interface for password reset without email verification links.

## System Architecture

### Frontend (React)
- **Three-Row Layout**: Email verification → Password entry → Password confirmation
- **Dynamic Form**: Password fields appear only after email verification
- **Real-time Validation**: Password matching and length validation
- **Progressive Disclosure**: Submit button only enabled when all conditions are met
- **Responsive Design**: Mobile-friendly layout

### Backend (Node.js + Express)
- **Email Verification API**: Checks if email exists in MongoDB
- **Password Update API**: Securely updates password with bcrypt hashing
- **Input Validation**: Email format and password strength validation
- **Error Handling**: Comprehensive error responses

## Complete Implementation

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
  const handleVerifyEmail = async () => {
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
        setError("");
      } else {
        setError(data.msg === "Email not found in our records" ? "Email not registered." : data.msg);
      }
    } catch (err) {
      setLoading(false);
      setError("Network error. Please try again.");
    }
  };

  // Handle password update
  const handleUpdatePassword = async () => {
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
        setError("");
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
      <p className="subtitle">Enter your email and set a new password</p>
      
      {/* Three-Row Layout */}
      <div className="forgot-password-form">
        
        {/* Row 1: Email Input and Verify Button */}
        <div className="form-row">
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            disabled={loading}
            className="email-input"
          />
          <button 
            type="button"
            onClick={handleVerifyEmail}
            disabled={loading || !email.trim()}
            className="verify-button"
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </div>

        {/* Row 2: New Password Input (hidden initially) */}
        <div className={`form-row ${emailVerified ? 'visible' : 'hidden'}`}>
          <input 
            type="password" 
            placeholder="New Password" 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            disabled={loading}
            minLength="6"
            className="password-input"
          />
        </div>

        {/* Row 3: Confirm Password Input (hidden initially) */}
        <div className={`form-row ${emailVerified ? 'visible' : 'hidden'}`}>
          <input 
            type="password" 
            placeholder="Confirm Password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            disabled={loading}
            minLength="6"
            className="password-input"
          />
        </div>

        {/* Submit Button - Only enabled when both passwords are visible and matching */}
        <div className={`form-row ${emailVerified && newPassword && confirmPassword ? 'visible' : 'hidden'}`}>
          <button 
            type="button"
            onClick={handleUpdatePassword}
            disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            className="submit-button"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>

        {/* Back Button - Only visible after email verification */}
        {emailVerified && (
          <div className="form-row">
            <button 
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="back-button"
            >
              Back to Email
            </button>
          </div>
        )}
      </div>

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
```

### 2. CSS Styles (`src/App.css` - Added Section)

```css
/* ================= FORGOT PASSWORD THREE-ROW LAYOUT ================= */
.forgot-password-form {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.form-row {
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: all 0.3s ease;
}

.form-row.hidden {
    opacity: 0;
    max-height: 0;
    overflow: hidden;
    margin: 0;
    padding: 0;
}

.form-row.visible {
    opacity: 1;
    max-height: 100px;
}

/* Email input row - special styling for email + verify button */
.form-row:first-child {
    display: flex;
    flex-direction: row;
    gap: 10px;
    align-items: stretch;
}

.email-input {
    flex: 1;
    padding: 12px 15px;
    border-radius: 12px;
    border: none;
    font-size: 16px;
    background-color: rgba(255,255,255,0.1);
    color: #fff;
    outline: none;
    transition: 0.3s;
}

.email-input::placeholder {
    color: #ccc;
}

.email-input:focus {
    background-color: rgba(79, 224,234, 0.1);
    box-shadow: 0 0 10px rgba(79, 224,234, 0.5);
}

.verify-button {
    min-width: 120px;
    padding: 12px 20px;
    border-radius: 12px;
    border: none;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    color: #fff;
    background-color: rgb(79, 224,234);
    box-shadow: 0 0 20px rgb(79, 224,234);
    transition: all 0.3s;
    white-space: nowrap;
}

.verify-button:hover:not(:disabled) {
    background-color: rgb(34, 221, 231);
    box-shadow: 0 0 30px rgb(34, 221, 231);
}

.verify-button:disabled {
    background-color: rgba(79, 224,234, 0.5);
    box-shadow: none;
    cursor: not-allowed;
}

/* Password inputs */
.password-input {
    width: 100%;
    padding: 12px 15px;
    border-radius: 12px;
    border: none;
    font-size: 16px;
    background-color: rgba(255,255,255,0.1);
    color: #fff;
    outline: none;
    transition: 0.3s;
}

.password-input::placeholder {
    color: #ccc;
}

.password-input:focus {
    background-color: rgba(79, 224,234, 0.1);
    box-shadow: 0 0 10px rgba(79, 224,234, 0.5);
}

/* Submit button */
.submit-button {
    width: 100%;
    padding: 12px;
    border-radius: 20px;
    border: none;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    color: #fff;
    background-color: rgb(79, 224,234);
    box-shadow: 0 0 20px rgb(79, 224,234);
    transition: all 0.3s;
}

.submit-button:hover:not(:disabled) {
    background-color: rgb(34, 221, 231);
    box-shadow: 0 0 30px rgb(34, 221, 231);
}

.submit-button:disabled {
    background-color: rgba(79, 224,234, 0.5);
    box-shadow: none;
    cursor: not-allowed;
}

/* Back button */
.back-button {
    width: 100%;
    padding: 10px;
    border-radius: 15px;
    border: 2px solid rgba(79, 224,234, 0.3);
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    color: rgb(79, 224,234);
    background-color: transparent;
    transition: all 0.3s;
}

.back-button:hover:not(:disabled) {
    background-color: rgba(79, 224,234, 0.1);
    border-color: rgb(79, 224,234);
}

.back-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Message styling */
.message {
    padding: 12px 15px;
    border-radius: 8px;
    margin-top: 15px;
    text-align: center;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
}

.message.success {
    color: #4CAF50;
    background-color: rgba(76, 175, 80, 0.1);
    border: 1px solid rgba(76, 175, 80, 0.3);
}

.message.error {
    color: #F44336;
    background-color: rgba(244, 67, 54, 0.1);
    border: 1px solid rgba(244, 67, 54, 0.3);
}

/* Mobile responsive */
@media (max-width: 480px) {
    .form-row:first-child {
        flex-direction: column;
        gap: 10px;
    }
    
    .verify-button {
        min-width: auto;
        width: 100%;
    }
}
```

### 3. Backend API Routes (`server.js` - Added Section)

```javascript
// ====================== Verify Email API ======================
app.post("/api/verify-email", async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate input
    if (!email || !email.trim()) {
      return res.status(400).json({ msg: "Email is required" });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ msg: "Please enter a valid email address" });
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

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ msg: "Please enter a valid email address" });
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

### 4. MongoDB User Schema (Existing)

```javascript
const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String
});
const User = mongoose.model("User", userSchema);
```

## Three-Row Layout Flow

### Row 1: Email Verification
- **Email Input**: User enters their email address
- **Verify Button**: Checks if email exists in MongoDB
- **Error Handling**: Shows "Email not registered" if email doesn't exist

### Row 2: New Password (Hidden Initially)
- **Visibility**: Only appears after successful email verification
- **Validation**: Minimum 6 characters required
- **Styling**: Smooth transition animation

### Row 3: Confirm Password (Hidden Initially)
- **Visibility**: Only appears after successful email verification
- **Validation**: Must match the new password
- **Real-time**: Validates on input change

### Submit Button Logic
- **Visibility**: Only appears when both password fields are visible and filled
- **Enablement**: Only enabled when passwords match and meet requirements
- **Loading State**: Shows "Updating..." during API call

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
- 400: "Email is required" or "Please enter a valid email address"
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
- 400: "Email is required", "Password must be at least 6 characters long", or "Please enter a valid email address"
- 404: "User not found"
- 500: "Server error during password update"

## Key Features

### Frontend Features
- ✅ **Three-Row Progressive Layout**
- ✅ **Dynamic Form Revealing**
- ✅ **Real-time Password Validation**
- ✅ **Smart Button States**
- ✅ **Smooth Animations**
- ✅ **Mobile Responsive**
- ✅ **Loading States**
- ✅ **Error/Success Messages**

### Backend Features
- ✅ **Email Format Validation**
- ✅ **Database Email Verification**
- ✅ **Secure Password Hashing (bcrypt)**
- ✅ **Comprehensive Error Handling**
- ✅ **Input Sanitization**

### Security Features
- ✅ **bcrypt Password Hashing** (10 salt rounds)
- ✅ **Email Format Validation**
- ✅ **Input Length Validation**
- ✅ **No Email Links Required**
- ✅ **Proper Error Messages**

## User Experience Flow

1. **Step 1**: User enters email and clicks "Verify Email"
2. **Step 2**: System validates email format and checks database
3. **Step 3**: If email exists, Row 2 (New Password) appears with animation
4. **Step 4**: User enters new password, Row 3 (Confirm Password) appears
5. **Step 5**: User enters confirmation, Submit button becomes enabled
6. **Step 6**: System validates passwords match and updates password
7. **Step 7**: Success message shown, automatic redirect to login

## Testing the System

1. **Start the server**: `npm start` or `node server.js`
2. **Start the React app**: `npm run dev`
3. **Navigate to**: `/forgot-password`
4. **Test Cases**:
   - Enter non-existing email → Should show "Email not registered"
   - Enter existing email → Should reveal password fields
   - Enter mismatched passwords → Submit button disabled
   - Enter matching passwords → Submit button enabled
   - Complete flow → Should redirect to login

## Dependencies

The system uses existing dependencies:
- `bcryptjs`: For password hashing
- `mongoose`: For MongoDB operations
- `express`: For API routes
- `react-router-dom`: For navigation

## Notes

- **No Email Sending**: As requested, no email verification links
- **Progressive Disclosure**: Password fields appear only after email verification
- **Consistent Styling**: Matches your existing design system
- **Mobile Friendly**: Responsive design for all screen sizes
- **Accessibility**: Proper form labels and keyboard navigation
