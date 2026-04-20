// Session Management Utility
// Handles session validation, refresh, and cleanup

class SessionManager {
  constructor() {
    this.sessionCheckInterval = null;
    this.refreshInterval = null;
  }

  // Check if user is authenticated via session
  async checkSessionStatus() {
    try {
      const response = await fetch('/api/session-status', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          isValid: true,
          user: data.user,
          sessionInfo: data.sessionInfo
        };
      } else {
        return { isValid: false };
      }
    } catch (error) {
      console.error('Session check failed:', error);
      return { isValid: false };
    }
  }

  // Refresh session to extend lifetime
  async refreshSession() {
    try {
      const response = await fetch('/api/refresh-session', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Session refreshed:', data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Session refresh failed:', error);
      return false;
    }
  }

  // Logout and destroy session
  async logout() {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Clear local storage regardless of API response
      this.clearLocalData();

      if (response.ok) {
        console.log('Session destroyed successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Logout failed:', error);
      this.clearLocalData();
      return false;
    }
  }

  // Clear all local data
  clearLocalData() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPhoto');
    
    // Clear any other user-related data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('user')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Start automatic session refresh
  startSessionRefresh(intervalMinutes = 30) {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.refreshInterval = setInterval(async () => {
      const refreshed = await this.refreshSession();
      if (!refreshed) {
        console.warn('Session refresh failed, user may need to re-login');
      }
    }, intervalMinutes * 60 * 1000);
  }

  // Stop automatic session refresh
  stopSessionRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  // Start periodic session validation
  startSessionValidation(intervalMinutes = 5) {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    this.sessionCheckInterval = setInterval(async () => {
      const sessionStatus = await this.checkSessionStatus();
      if (!sessionStatus.isValid) {
        console.warn('Session invalid, redirecting to login');
        // Trigger logout or redirect
        this.handleSessionExpired();
      }
    }, intervalMinutes * 60 * 1000);
  }

  // Stop periodic session validation
  stopSessionValidation() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  // Handle session expiration
  handleSessionExpired() {
    this.clearLocalData();
    // You can customize this to trigger a callback or navigate
    window.location.href = '/login';
  }

  // Get user info from cookies (if available)
  getUserInfoFromCookies() {
    try {
      const cookies = document.cookie.split(';');
      const userInfoCookie = cookies.find(cookie => 
        cookie.trim().startsWith('userInfo=')
      );
      
      if (userInfoCookie) {
        const userInfoString = userInfoCookie.split('=')[1];
        return JSON.parse(decodeURIComponent(userInfoString));
      }
    } catch (error) {
      console.error('Error parsing user info from cookies:', error);
    }
    return null;
  }

  // Check if session exists (quick check without API call)
  hasSessionCookie() {
    return document.cookie.includes('kittuai.sid=');
  }

  // Initialize session management
  async initialize() {
    // Check if we have a session cookie
    if (!this.hasSessionCookie()) {
      return { isValid: false, user: null };
    }

    // Validate session with server
    const sessionStatus = await this.checkSessionStatus();
    
    if (sessionStatus.isValid) {
      // Start automatic refresh and validation
      this.startSessionRefresh(30); // Refresh every 30 minutes
      this.startSessionValidation(5); // Check every 5 minutes
    }

    return sessionStatus;
  }

  // Cleanup on component unmount
  cleanup() {
    this.stopSessionRefresh();
    this.stopSessionValidation();
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

export default sessionManager;
