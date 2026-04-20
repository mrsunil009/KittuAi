# Simplified Forgot Password System - Complete Implementation

## Overview
This is a simplified Forgot Password system for React + Node.js + MongoDB with a single form approach. Users can reset their password by entering their email and new password in one form.

## System Architecture

### Frontend (React)
- **Single Form**: Email, New Password, and Confirm Password in one form
- **Real-time Validation**: Password matching and length validation
- **Error Handling**: Clear error messages for all scenarios
- **Success Feedback**: Success message and automatic redirect

### Backend (Node.js + Express)
- **Single API Route**: `/api/reset-password` handles the complete process
- **Email Verification**: Checks if email exists in MongoDB
- **Password Hashing**: Secure bcrypt hashing before database update
- **Input Validation**: Comprehensive validation for all inputs

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
```

### 2. Backend API Route (`server.js` - Added Section)

```javascript
// ====================== Reset Password API (Simplified) ======================
app.post("/api/reset-password", async (req, res) => {
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
      return res.status(404).json({ msg: "Email not registered" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user's password
    user.password = hashedPassword;
    await user.save();

    res.json({ msg: "Password updated successfully!" });
  } catch (err) {
    console.error("Password reset error:", err);
    res.status(500).json({ msg: "Server error during password reset" });
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

## API Endpoint

### POST `/api/reset-password`
**Purpose**: Reset user password by email and new password

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
- 404: "Email not registered"
- 500: "Server error during password reset"

## Key Features

### Frontend Features
- ✅ **Single Form Layout** - All inputs in one form
- ✅ **Real-time Validation** - Password matching validation
- ✅ **Loading States** - Disabled inputs during API call
- ✅ **Error Handling** - Specific error messages
- ✅ **Success Feedback** - Success message and auto-redirect
- ✅ **Form Clearing** - Form clears after successful reset

### Backend Features
- ✅ **Email Verification** - Checks if email exists in database
- ✅ **Password Hashing** - Secure bcrypt hashing (10 salt rounds)
- ✅ **Input Validation** - Email format and password length validation
- ✅ **Error Handling** - Comprehensive error responses
- ✅ **Database Update** - Secure password update in MongoDB

### Security Features
- ✅ **bcrypt Password Hashing** (10 salt rounds)
- ✅ **Email Format Validation** (regex pattern)
- ✅ **Input Sanitization** (trim, lowercase)
- ✅ **Error Messages** - No sensitive information exposure
- ✅ **No Email Links** - Direct password reset

## User Experience Flow

1. **Form Display** → User sees single form with three inputs
2. **Input Validation** → Real-time validation for password matching
3. **Form Submission** → Single API call to reset password
4. **Email Verification** → Backend checks if email exists
5. **Password Update** → Secure password hashing and database update
6. **Success Feedback** → Success message and automatic redirect to login

## How to Run

### 1. Start Backend Server
```bash
# In PowerShell (Windows)
cd D:\Website\kittuAi; npm start

# In Bash/Terminal (Mac/Linux)
cd /path/to/kittuAi && npm start
```

### 2. Start Frontend
```bash
# In another terminal
npm run dev
```

### 3. Test the System
1. Navigate to `/forgot-password`
2. Enter an email (existing or non-existing)
3. Enter a new password (minimum 6 characters)
4. Confirm the password
5. Click "Reset Password"

## Testing Scenarios

### Valid Reset (Existing Email)
- **Input**: Valid email that exists in database + matching passwords
- **Expected**: Success message + redirect to login

### Invalid Email
- **Input**: Non-existing email + valid passwords
- **Expected**: "Email not registered" error

### Password Mismatch
- **Input**: Valid email + non-matching passwords
- **Expected**: "Passwords do not match" error

### Short Password
- **Input**: Valid email + password less than 6 characters
- **Expected**: "Password must be at least 6 characters long" error

### Network Issues
- **Input**: Valid form + backend server not running
- **Expected**: "Cannot connect to server" error

## Dependencies

The system uses existing dependencies:
- `bcryptjs`: For password hashing
- `mongoose`: For MongoDB operations
- `express`: For API routes
- `react-router-dom`: For navigation

## File Structure

```
src/
├── ForgotPassword.jsx     # Simplified React component
├── App.css               # Existing styles (no changes needed)
server.js                 # Added /api/reset-password route
```

## Notes

- **Simplified Approach**: Single form instead of multi-step process
- **Consistent Styling**: Uses existing CSS classes
- **Backward Compatible**: Keeps existing API routes for other components
- **Mobile Friendly**: Responsive design works on all devices
- **No Email Verification**: Direct password reset without email links
- **Secure**: Proper password hashing and input validation

## Troubleshooting

### Common Issues

1. **"Cannot connect to server"**
   - Make sure backend is running: `npm start`
   - Check if port 5000 is available

2. **"Email not registered"**
   - Verify the email exists in your MongoDB users collection
   - Check email spelling and case

3. **"Passwords do not match"**
   - Ensure both password fields have identical values
   - Check for extra spaces or characters

4. **Form not submitting**
   - Check browser console for JavaScript errors
   - Verify all required fields are filled

The simplified system provides a clean, straightforward password reset experience with proper validation and security measures.
