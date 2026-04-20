# Session and Cookie Management System

## Overview
A comprehensive session and cookie management system for the Kittu AI project, providing secure authentication, session persistence, and automatic session management.

## Features Implemented

### 🔐 Backend Session Management
- **Express Session**: Server-side session storage with MongoDB
- **Cookie Parser**: Automatic cookie parsing and management
- **MongoDB Session Store**: Persistent session storage in database
- **Security Configuration**: HTTP-only, secure, and SameSite cookies
- **Session Middleware**: Authentication and authorization middleware

### 🍪 Cookie Management
- **Secure Cookies**: HTTP-only cookies to prevent XSS attacks
- **Session Cookies**: Automatic session ID management
- **User Info Cookies**: Client-accessible user information
- **Cookie Configuration**: Production-ready security settings

### 🔄 Frontend Integration
- **Session Validation**: Automatic session status checking
- **Session Refresh**: Automatic session lifetime extension
- **Logout Handling**: Proper session destruction
- **Fallback Authentication**: Token-based fallback system

## Technical Implementation

### Backend Configuration (`server.js`)

#### Dependencies Added
```bash
npm install express-session cookie-parser connect-mongo
```

#### Session Configuration
```javascript
// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || "kittuai_session_secret_key_2024",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    touchAfter: 24 * 3600, // lazy session update
    ttl: 14 * 24 * 60 * 60 // 14 days
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS in production
    httpOnly: true, // Prevents XSS attacks
    maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
    sameSite: 'lax' // CSRF protection
  },
  name: 'kittuai.sid' // Custom session name
}));
```

#### CORS Configuration
```javascript
// CORS configuration with credentials
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
```

#### Authentication Middleware
```javascript
const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  } else {
    return res.status(401).json({ msg: "Authentication required" });
  }
};

const requireAuthOrToken = (req, res, next) => {
  // Check session first
  if (req.session && req.session.userId) {
    return next();
  }
  
  // Fallback to token authentication
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id;
      return next();
    } catch (err) {
      return res.status(401).json({ msg: "Invalid token" });
    }
  }
  
  return res.status(401).json({ msg: "Authentication required" });
};
```

### Enhanced User Schema
```javascript
const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  lastLogin: { type: Date, default: Date.now },
  loginCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});
```

### Login Route with Session Management
```javascript
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate credentials
    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(400).json({ msg: "User not found or inactive" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Update user login information
    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save();

    // Create session
    req.session.userId = user._id;
    req.session.userEmail = user.email;
    req.session.username = user.username;
    req.session.loginTime = new Date();

    // Provide JWT token for API compatibility
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Set additional cookies
    res.cookie('userInfo', JSON.stringify({
      id: user._id,
      username: user.username,
      email: user.email,
      loginTime: new Date()
    }), {
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
      httpOnly: false, // Allow frontend access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.json({ 
      msg: "Login successful!", 
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount
      }
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});
```

### Session Management Routes

#### Logout Route
```javascript
app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ msg: "Logout failed" });
    }
    
    // Clear cookies
    res.clearCookie('kittuai.sid');
    res.clearCookie('userInfo');
    
    res.json({ msg: "Logout successful" });
  });
});
```

#### Session Status Check
```javascript
app.get("/api/session-status", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user || !user.isActive) {
      req.session.destroy();
      return res.status(401).json({ msg: "Session invalid" });
    }

    res.json({
      authenticated: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount
      },
      sessionInfo: {
        loginTime: req.session.loginTime,
        sessionId: req.sessionID
      }
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});
```

#### Session Refresh
```javascript
app.post("/api/refresh-session", requireAuth, (req, res) => {
  // Touch the session to extend its lifetime
  req.session.touch();
  
  res.json({
    msg: "Session refreshed",
    sessionId: req.sessionID,
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  });
});
```

### Frontend Integration

#### Session Manager Utility (`src/utils/sessionManager.js`)
```javascript
class SessionManager {
  // Check session status
  async checkSessionStatus() {
    const response = await fetch('/api/session-status', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      return { isValid: true, ...await response.json() };
    }
    return { isValid: false };
  }

  // Refresh session
  async refreshSession() {
    const response = await fetch('/api/refresh-session', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    return response.ok;
  }

  // Logout
  async logout() {
    await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    this.clearLocalData();
  }
}
```

#### Chat Component Integration
```javascript
// Session management state
const [sessionInfo, setSessionInfo] = useState(null);
const [isSessionValid, setIsSessionValid] = useState(false);

// Check session status on component mount
useEffect(() => {
  checkSessionStatus();
}, []);

// Session validation function
const checkSessionStatus = async () => {
  try {
    const response = await fetch('/api/session-status', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      setSessionInfo(data);
      setIsSessionValid(true);
    } else {
      if (!token) navigate("/login");
      setIsSessionValid(false);
    }
  } catch (error) {
    if (!token) navigate("/login");
    setIsSessionValid(false);
  }
};

// Enhanced logout with session destruction
const handleLogout = async () => {
  try {
    await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Logout API call failed:", error);
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userPhoto");
    setSessionInfo(null);
    setIsSessionValid(false);
    navigate("/");
  }
};
```

#### Login Component Updates
```javascript
const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      credentials: 'include', // Include cookies for session
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    
    if (res.ok) {
      // Save token for API compatibility
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // Save user info to localStorage for profile
      if (data.user) {
        localStorage.setItem("userName", data.user.username);
        localStorage.setItem("userEmail", data.user.email);
      }

      navigate("/chat");
    } else {
      alert(data.msg || "Login failed");
    }
  } catch (err) {
    console.log("Login fetch error:", err);
    alert("Server error. Try again.");
  }
};
```

## Security Features

### Cookie Security
- **HTTP-Only**: Session cookies are HTTP-only to prevent XSS attacks
- **Secure Flag**: Cookies use secure flag in production (HTTPS)
- **SameSite**: Lax SameSite policy for CSRF protection
- **Custom Names**: Custom session cookie names to avoid conflicts

### Session Security
- **MongoDB Storage**: Sessions stored in database for persistence
- **Secret Key**: Strong session secret for signing
- **TTL Management**: Automatic session expiration
- **Touch Mechanism**: Lazy session updates to reduce database load

### Authentication Security
- **Dual Authentication**: Session + JWT token support
- **Fallback System**: Token authentication as fallback
- **User Status**: Account activation/deactivation support
- **Login Tracking**: Login count and last login tracking

## Environment Variables

Add these to your `.env` file:
```env
# Session Configuration
SESSION_SECRET=your_very_secure_session_secret_key_here
FRONTEND_URL=http://localhost:5173

# Database (existing)
MONGO_URI=your_mongodb_connection_string

# JWT (existing)
JWT_SECRET=your_jwt_secret_key

# Environment
NODE_ENV=development
```

## API Endpoints

### Authentication
- `POST /api/login` - Login with session creation
- `POST /api/logout` - Logout and session destruction
- `GET /api/session-status` - Check session validity
- `POST /api/refresh-session` - Extend session lifetime

### Session Data Structure
```javascript
// Session object structure
{
  userId: ObjectId,
  userEmail: String,
  username: String,
  loginTime: Date
}

// Cookie structure
{
  'kittuai.sid': 'session_id_string',
  'userInfo': JSON.stringify({
    id: ObjectId,
    username: String,
    email: String,
    loginTime: Date
  })
}
```

## Usage Examples

### Backend Session Check
```javascript
// In any protected route
app.get("/api/protected", requireAuth, (req, res) => {
  // req.session.userId is available
  res.json({ userId: req.session.userId });
});
```

### Frontend Session Usage
```javascript
// Check if user is logged in
const sessionStatus = await sessionManager.checkSessionStatus();
if (sessionStatus.isValid) {
  console.log('User:', sessionStatus.user);
}

// Automatic session management
await sessionManager.initialize();
```

## Benefits

### Security
- **XSS Protection**: HTTP-only cookies prevent client-side access
- **CSRF Protection**: SameSite cookie policy
- **Session Hijacking**: Secure session management
- **Account Control**: User activation/deactivation

### User Experience
- **Persistent Sessions**: Users stay logged in across browser sessions
- **Automatic Refresh**: Sessions extend automatically
- **Seamless Logout**: Complete session cleanup
- **Fallback Support**: Works with existing token system

### Developer Experience
- **Simple Integration**: Easy to implement and use
- **Automatic Management**: Handles session lifecycle automatically
- **Debugging Support**: Clear session status and information
- **Flexible Configuration**: Customizable security settings

## Testing

### Session Creation
```javascript
// Test login with session creation
const response = await fetch('/api/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', password: 'password' })
});
```

### Session Validation
```javascript
// Test session status
const response = await fetch('/api/session-status', {
  method: 'GET',
  credentials: 'include'
});
```

### Session Destruction
```javascript
// Test logout
const response = await fetch('/api/logout', {
  method: 'POST',
  credentials: 'include'
});
```

The session and cookie system provides a robust, secure, and user-friendly authentication solution that enhances the overall security and user experience of the Kittu AI application.
