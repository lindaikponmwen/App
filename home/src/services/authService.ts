/**
 * Authentication Service
 *
 * Handles secure communication with PHP backend authentication endpoints
 * Features:
 * - Automatic CSRF token management
 * - Secure credential transmission
 * - Session management
 * - Error handling
 */

import { getCurrentUser, users, setCachedUser } from '../data/authData';

const API_BASE_URL = '/auth';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  csrfToken?: string;
}

// [FIX] Define explicit interfaces for expected backend responses
interface VerifyCredentialsResponse {
  requiresTwoFactor?: boolean;
  email?: string;
}

interface UserResponse {
  user: any;
}

interface VerifySessionResponse {
  authenticated: boolean;
  user?: any;
}

interface RoleResponse {
  role: string;
}

class AuthService {
  private csrfToken: string | null = null;

  /**
   * Make secure API request with CSRF protection
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}/${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add CSRF token to non-GET requests
    if (this.csrfToken && options.method !== 'GET') {
      headers['X-CSRF-Token'] = this.csrfToken;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Important: Include cookies for session management
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {
          success: false,
          error: `Server returned non-JSON response. The backend endpoint may not be configured correctly.`,
        };
      }

      const data = await response.json();

      // Update CSRF token if provided
      if (data.csrfToken) {
        this.csrfToken = data.csrfToken;
        localStorage.setItem('csrfToken', data.csrfToken);
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  /**
   * Initialize service and get CSRF token
   */
  async initialize(): Promise<void> {
    // Try to restore CSRF token from localStorage
    const storedToken = localStorage.getItem('csrfToken');
    if (storedToken) {
      this.csrfToken = storedToken;
    }

    // Get fresh CSRF token from server
    try {
      const response = await this.request<{ csrfToken: string }>('csrf.php', {
        method: 'GET',
      });

      if (response.success && response.data?.csrfToken) {
        this.csrfToken = response.data.csrfToken;
        localStorage.setItem('csrfToken', response.data.csrfToken);
      }
    } catch (error) {
      console.error('Failed to initialize CSRF token:', error);
    }
  }

  /**
   * Verify credentials (step 1 of 2FA login)
   */
  async verifyCredentials(credentials: {
    username: string;
    password: string;
  }): Promise<{
    success: boolean;
    requiresTwoFactor?: boolean;
    email?: string;
    error?: string;
  }> {
    // [FIX] Explicitly type request response to VerifyCredentialsResponse
    const response = await this.request<VerifyCredentialsResponse>('verify-credentials.php', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      return {
        success: true,
        requiresTwoFactor: response.data.requiresTwoFactor,
        email: response.data.email,
      };
    }

    return {
      success: false,
      error: response.error || 'Authentication failed',
    };
  }

  /**
   * Verify 2FA code (step 2 of 2FA login)
   */
  async verifyTwoFactorCode(
    username: string,
    code: string
  ): Promise<{ success: boolean; user?: any; error?: string }> {
    // [FIX] Explicitly type request response to UserResponse
    const response = await this.request<UserResponse>('verify-2fa-code.php', {
      method: 'POST',
      body: JSON.stringify({ username, code }),
    });

    if (response.success && response.data) {
      return {
        success: true,
        user: response.data.user,
      };
    }

    return {
      success: false,
      error: response.error || 'Invalid verification code',
    };
  }

  /**
   * Login user (legacy - direct login without 2FA)
   */
  async login(credentials: {
    username: string;
    password: string;
  }): Promise<{ success: boolean; user?: any; error?: string }> {
    // [FIX] Explicitly type request response to UserResponse
    const response = await this.request<UserResponse>('login.php', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      return {
        success: true,
        user: response.data.user,
      };
    }

    return {
      success: false,
      error: response.error || 'Login failed',
    };
  }

  /**
   * Logout user
   */
  async logout(): Promise<{ success: boolean; error?: string }> {
    const response = await this.request('logout.php', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    
    // Always clear CSRF token on logout, regardless of response
    //this.csrfToken = null;
    //localStorage.removeItem('csrfToken');
if (response.success && response.csrfToken) {
        this.csrfToken = response.csrfToken;
        sessionStorage.setItem('csrfToken', response.csrfToken);
    }
    if (response.success) {
      return { success: true };
    }
    
    return {
      success: false,
      error: response.error || 'Logout failed',
    };
  }

  /**
   * Register new user
   */
  async register(data: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    title: string;
    recaptchaToken: string;
  }): Promise<{ success: boolean; error?: string }> {
    const response = await this.request('register.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error || 'Registration failed',
    };
  }

  /**
   * Verify session and get current user
   */
  async verifySession(): Promise<{
    authenticated: boolean;
    user?: any;
    error?: string;
  }> {
    // [FIX] Explicitly type request response to VerifySessionResponse
    const response = await this.request<VerifySessionResponse>('verify.php', {
      method: 'GET',
    });

    if (response.success && response.data) {
      return {
        authenticated: response.data.authenticated || false,
        user: response.data.user,
      };
    }

    return {
      authenticated: false,
      error: response.error,
    };
  }

  /**
   * Unlock session after inactivity
   */
  async unlockSession(password: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const response = await this.request('unlock.php', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error || 'Failed to unlock session',
    };
  }

  /**
   * Get current CSRF token
   */
  getCsrfToken(): string | null {
    return this.csrfToken;
  }

  /**
   * Send email confirmation to user
   */
  async sendConfirmationEmail(email: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const response = await this.request('../email/send-confirmation.php', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error || 'Failed to send confirmation email',
    };
  }

  /**
   * Resend email confirmation to user
   */
  async resendConfirmationEmail(email: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const response = await this.request('../email/resend-confirmation.php', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error || 'Failed to resend confirmation email',
    };
  }

  /**
   * Confirm email with token
   */
  async confirmEmail(token: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const response = await this.request('../email/confirm-email.php', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error || 'Failed to confirm email',
    };
  }

  /**
   * Update user role (for subscription management)
   */
  async updateUserRole(role: string): Promise<{
    success: boolean;
    role?: string;
    error?: string;
  }> {
    // [FIX] Explicitly type request response to RoleResponse
    const response = await this.request<RoleResponse>('update-role.php', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });

    if (response.success && response.data) {
      return {
        success: true,
        role: response.data.role,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to update role',
    };
  }

  /**
   * Update user role to 'waiting' (Free tier)
   */
  async updateUserToWaiting(): Promise<{ success: boolean; error?: string }> {
    // Mock Implementation: Update local state immediately
    const currentUser = getCurrentUser();
    if (currentUser) {
      // Update in global users array
      const userIndex = users.findIndex(u => u.id === currentUser.id);
      
      if (userIndex !== -1) {
        users[userIndex].role = 'waiting';
        // Update cached user
        setCachedUser(users[userIndex]);
      }
    }

    // PHP Backend Integration (commented out)
    
    const response = await this.request('update-to-waiting.php', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error || 'Failed to update user status',
    };
    
    
    return { success: true };
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;