# Session and Cookie System - Setup Guide

## Quick Setup

### 1. Install Dependencies
```bash
npm install express-session cookie-parser connect-mongo
```

### 2. Environment Variables
Add these to your `.env` file:
```env
# Session Configuration
SESSION_SECRET=your_very_secure_session_secret_key_here
FRONTEND_URL=http://localhost:5173

# Existing variables
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

### 3. Start the Server
```bash
npm start
```

## Testing the System

### 1. Test Backend Endpoints
```bash
# Test login (will fail without valid user)
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Test session status (should return 401)
curl -X GET http://localhost:5000/api/session-status

# Test logout (should return 200)
curl -X POST http://localhost:5000/api/logout
```

### 2. Test Frontend Integration
1. Start frontend: `npm run dev`
2. Navigate to login page
3. Login with valid credentials
4. Check browser cookies (should see `kittuai.sid` and `userInfo`)
5. Refresh page - should stay logged in
6. Test logout - should clear cookies and redirect

## Features Implemented

✅ **Backend Session Management**
- Express Session with MongoDB store
- Cookie parser middleware
- CORS with credentials support
- Session-based authentication
- JWT token fallback

✅ **Security Features**
- HTTP-only session cookies
- Secure cookie flags (production)
- SameSite CSRF protection
- Session expiration (14 days)
- Automatic session refresh

✅ **Frontend Integration**
- Session status checking
- Automatic session refresh (30 min intervals)
- Session validation (5 min intervals)
- Proper logout with session destruction
- Fallback to token authentication

✅ **API Endpoints**
- `POST /api/login` - Login with session creation
- `POST /api/logout` - Logout and session destruction
- `GET /api/session-status` - Check session validity
- `POST /api/refresh-session` - Extend session lifetime

## Session Flow

1. **Login**: User logs in → Session created → Cookies set → User authenticated
2. **Navigation**: User navigates → Session validated → Access granted/denied
3. **Refresh**: Page refresh → Session checked → User stays logged in
4. **Logout**: User logs out → Session destroyed → Cookies cleared

## Security Benefits

- **XSS Protection**: HTTP-only cookies prevent client-side access
- **CSRF Protection**: SameSite cookie policy
- **Session Hijacking**: Secure session management
- **Account Control**: User activation/deactivation support
- **Persistent Sessions**: Users stay logged in across browser sessions

## Troubleshooting

### Common Issues

1. **Session endpoints return 404**
   - Restart the server: `npm start`
   - Check if all dependencies are installed

2. **CORS errors**
   - Ensure `credentials: 'include'` in fetch requests
   - Check CORS configuration in server.js

3. **Session not persisting**
   - Check if MongoDB is connected
   - Verify session store configuration
   - Check browser cookie settings

4. **Login fails**
   - Verify user exists in database
   - Check password hashing
   - Ensure user account is active

### Debug Tips

1. Check browser cookies in DevTools
2. Monitor server logs for session events
3. Use browser Network tab to see cookie headers
4. Test with curl commands for backend debugging

## Next Steps

1. **Production Setup**
   - Set `NODE_ENV=production`
   - Use HTTPS for secure cookies
   - Configure proper CORS origins

2. **Advanced Features**
   - Session analytics
   - Multi-device session management
   - Session timeout warnings
   - Remember me functionality

3. **Monitoring**
   - Session store monitoring
   - User activity tracking
   - Security event logging

The session system is now fully integrated and ready for production use! 🚀
