export interface User {
  id: string;
  username: string;
  password: string; // In production, this would be hashed
  email: string;
  name: string;
  initials: string;
  avatar?: string;
  role: 'administrator' | 'owner' | 'member' | 'unsubscribed' | 'waiting' | 'free';
  department: string;
  title: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  hireDate: string;
  lastLogin?: Date;
  isOnline: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
  emailConfirmed?: boolean;
  confirmationToken?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  loginAttempts: number;
  lastLoginAttempt?: Date;
  sessionExpiry?: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  name: string;
  department: string;
  title: string;
}

export interface PasswordResetRequest {
  email: string;
  username: string;
}

// PHP Backend Integration (commented out)
import { authService } from '../services/authService';
import axios from 'axios';

// Mock users database (for development without PHP backend)
export const users: User[] = [
  {
    id: '1',
    username: 'sarah',
    password: 'command12',
    email: 'sarah.chen@research.com',
    name: 'Dr. Sarah Chen',
    initials: 'SC',
    avatar: 'https://images.pexels.com/photos/3823488/pexels-photo-3823488.jpeg?auto=compress&cs=tinysrgb&w=400',
    role: 'owner',
    department: 'Clinical Pharmacology',
    title: 'Principal Investigator',
    phone: '(629) 555-0123',
    address: '990 Market Street, Suite 200, San Francisco CA 94102',
    dateOfBirth: '1988-09-26',
    hireDate: '2023-01-05',
    lastLogin: new Date('2025-01-15T09:30:00'),
    isOnline: true,
    permissions: ['read', 'write', 'delete', 'manage_projects', 'manage_team', 'export'],
    createdAt: new Date('2023-01-05'),
    updatedAt: new Date('2025-01-15')
  }
];
var pdata = [
    'dashboard',      // 0
    'projects',       // 1 *
    'search',         // 2
    'team-members',    // 3 *
    'profile',        // 4
    'analytics',      // 5
    'administrative', // 6 *
    'settings',       // 7 *
    'help',           // 8
    'notifications'   // 9
];
// Authentication state - cached from server, never stored in localStorage
let authState: AuthState = {
  isAuthenticated: false,
  currentUser: null,
  loginAttempts: 0,
  lastLoginAttempt: undefined,
  sessionExpiry: undefined
};

// Cache for current session user (in memory only, not persisted)
let cachedUser: User | null = null;

// Permission Type
export interface RolePermissionsMap {
  [role: string]: string[];
}

// Local variable to store permissions fetched from server
let serverRolePermissions: RolePermissionsMap | null = null;

// Fallback (Mock) Role-based page access control
export var rolePermissions: RolePermissionsMap = {
  administrator: pdata,
  owner: [0,1,2,3,4,8].map(index => pdata[index]),
  member: [0,1,2,4,8].map(index => pdata[index]),
  free: [0,1,2,4,8].map(index => pdata[index]),
  unsubscribed: pdata[4],
  waiting: pdata[4]
};

// PHP Backend Integration: Function to load permissions from DB
// Uncomment this block to enable dynamic permissions

export const loadRolePermissions = async (): Promise<void> => {
  try {
    const API_BASE_URL = import.meta.env?.VITE_AUTH_API_URL || '/auth';
    // Requires axios to be imported
    const response = await axios.get(`${API_BASE_URL}/get-role-permissions.php`, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.data.success && response.data.rolePermissions) {
      rolePermissions = response.data.rolePermissions;
      console.log('Role permissions loaded from server');
    }
  } catch (error) {
    console.error('Failed to load role permissions from server:', error);
    // serverRolePermissions remains null, falling back to rolePermissions const
  }
};


// Two-factor authentication storage
interface TwoFactorSession {
  username: string;
  code: string;
  expiresAt: Date;
  attempts: number;
}

let twoFactorSessions: Map<string, TwoFactorSession> = new Map();

// Generate 10-digit verification code
const generateVerificationCode = (): string => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};
var use_mock = true;
// Verify credentials and send 2FA code
export const verifyCredentials = async (credentials: LoginCredentials): Promise<{
  success: boolean;
  requiresTwoFactor?: boolean;
  email?: string;
  error?: string
}> => {
  // For development/testing with mock data
  if (use_mock) {
    const user = users.find(u => u.username === credentials.username && u.password === credentials.password);

    if (!user) {
      authState.loginAttempts++;
      authState.lastLoginAttempt = new Date();
      return { success: false, error: 'Invalid username or password' };
    }

    if (user.emailConfirmed === false) {
      return { success: false, error: 'Please confirm your email before logging in. Check your inbox for the confirmation link.' };
    }

    const code = generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    twoFactorSessions.set(user.username, {
      username: user.username,
      code,
      expiresAt,
      attempts: 0
    });

    //console.log(`[2FA] Verification code for ${user.email}: ${code}`);

    return {
      success: true,
      requiresTwoFactor: true,
      email: user.email
    };
  }

  // Production: Use PHP backend
  return { success: false, error: 'Mock auth disabled. Use PHP backend.' };
};

// Verify 2FA code and complete login
export const verifyTwoFactorCode = async (username: string, code: string): Promise<{
  success: boolean;
  user?: User;
  error?: string;
}> => {
  // For development/testing with mock data
  if (use_mock) {
    const session = twoFactorSessions.get(username);

    if (!session) {
      return { success: false, error: 'No verification session found. Please try logging in again.' };
    }

    if (new Date() > session.expiresAt) {
      twoFactorSessions.delete(username);
      return { success: false, error: 'Verification code has expired. Please try logging in again.' };
    }

    if (session.attempts >= 3) {
      twoFactorSessions.delete(username);
      return { success: false, error: 'Too many failed attempts. Please try logging in again.' };
    }

    const isDevelopmentBypass = code === '0000000000';

    if (session.code !== code && !isDevelopmentBypass) {
      session.attempts++;
      return { success: false, error: 'Invalid verification code. Please try again.' };
    }

    twoFactorSessions.delete(username);

    const user = users.find(u => u.username === username);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    user.lastLogin = new Date();
    user.isOnline = true;
    user.updatedAt = new Date();

    const sessionExpiry = new Date();
    sessionExpiry.setHours(sessionExpiry.getHours() + 24);

    authState = {
      isAuthenticated: true,
      currentUser: user,
      loginAttempts: 0,
      lastLoginAttempt: undefined,
      sessionExpiry
    };

    cachedUser = user;

    return { success: true, user };
  }

  // Production: Use PHP backend
  return { success: false, error: 'Mock auth disabled. Use PHP backend.' };
};

// Legacy login function (not used with server-side sessions)
export const login = (credentials: LoginCredentials): { success: boolean; user?: User; error?: string } => {
  return { success: false, error: 'Use authService for authentication' };
};

export const logout = (): void => {
  // Clear in-memory cache
  authState = {
    isAuthenticated: false,
    currentUser: null,
    loginAttempts: 0,
    lastLoginAttempt: undefined,
    sessionExpiry: undefined
  };
  cachedUser = null;
  
  // Clear server permissions on logout
  serverRolePermissions = null;

  // For mock auth, update user status
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_AUTH === 'true') {
    if (authState.currentUser) {
      const user = users.find(u => u.id === authState.currentUser!.id);
      if (user) {
        user.isOnline = false;
        user.updatedAt = new Date();
      }
    }
  }
};

export const register = (data: RegisterData): { success: boolean; user?: User; error?: string } => {
  // PHP Backend Integration (commented out)
  // Uncomment below to use PHP backend authentication
  return authService.register(data);

  // Mock implementation (remove when using PHP backend)
  // Check if username or email already exists
  const existingUser = users.find(u => u.username === data.username || u.email === data.email);
  if (existingUser) {
    return { success: false, error: 'Username or email already exists' };
  }

  // Validate password confirmation
  if (data.password !== data.confirmPassword) {
    return { success: false, error: 'Passwords do not match' };
  }

  // PHP Backend Integration (commented out)
  // When using PHP backend, the backend will:
  // 1. Create user in database with emailConfirmed = false
  // 2. Generate confirmation token
  // 3. Send confirmation email with link
  // 4. Return success without logging user in

  // Create new user
  const confirmationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  const newUser: User = {
    id: (users.length + 1).toString(),
    username: data.username,
    password: data.password,
    email: data.email,
    name: data.name,
    initials: data.name.split(' ').map(n => n[0]).join('').toUpperCase(),
    role: 'member', // Default role
    department: data.department,
    title: data.title,
    phone: '',
    address: '',
    dateOfBirth: '',
    hireDate: new Date().toISOString().split('T')[0],
    isOnline: false,
    permissions: ['read', 'write'],
    createdAt: new Date(),
    updatedAt: new Date(),
    emailConfirmed: false,
    confirmationToken: confirmationToken
  };

  users.push(newUser);

  // Mock: In real implementation, send email here via PHP backend
  //console.log(`Email confirmation link: /confirm-email?token=${confirmationToken}`);

  return { success: true, user: newUser };
};

export const requestPasswordReset = async (data: PasswordResetRequest): Promise<{ success: boolean; error?: string }> => {
  // PHP Backend Integration
  try {
    const response = await fetch('/auth/request-password-reset.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to process password reset request' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
};

export const getCurrentUser = (): User | null => {
  return cachedUser || authState.currentUser;
};

export const isAuthenticated = (): boolean => {
  return authState.isAuthenticated || cachedUser !== null;
};

// Update cached user from server session
export const setCachedUser = (user: User | null): void => {
  cachedUser = user;
  if (user) {
    authState.isAuthenticated = true;
    authState.currentUser = user;
  } else {
    authState.isAuthenticated = false;
    authState.currentUser = null;
  }
};

export const hasPageAccess = (page: string, userRole?: string): boolean => {
  if (!userRole && !authState.currentUser) return false;
  
  const role = userRole || authState.currentUser!.role;
  
  // Use server permissions if loaded, otherwise fall back to mock const
  const activePermissions = serverRolePermissions || rolePermissions;
  const allowedPages = activePermissions[role] || [];
  
  return allowedPages.includes(page);
};

export const initializeAuth = async (): Promise<void> => {
  // For production and development without mock auth,
  // session is managed entirely server-side
  // No localStorage initialization needed

  // PHP Backend Integration (commented out)
  // Uncomment to load permissions on initialization
  await loadRolePermissions();

  // For development with mock auth
  if (use_mock) {
    // Mock users stay in memory, no localStorage
    //console.log('[Mock Auth] Using in-memory authentication');
  }
};

export const getAuthState = (): AuthState => {
  return authState;
};

export const getAllUsers = (): User[] => {
  return users;
};

export const getUserById = (id: string): User | undefined => {
  return users.find(u => u.id === id);
};

export const getOnlineUsers = (): User[] => {
  return users.filter(u => u.isOnline);
};

export const getUsersByRole = (role: string): User[] => {
  return users.filter(u => u.role === role);
};

// Session management - handled server-side
export const checkSession = (): boolean => {
  // Session validity is checked server-side via authService.verifySession()
  // This function is kept for backward compatibility
  return authState.isAuthenticated || cachedUser !== null;
};

export const extendSession = (): void => {
  // Session extension is handled server-side automatically
  // No action needed on client
};

// Email confirmation
export const confirmEmail = (token: string): { success: boolean; error?: string } => {
  // PHP Backend Integration (commented out)
  // Uncomment below to use PHP backend
  return authService.confirmEmail(token);

  // Mock implementation (remove when using PHP backend)
  const user = users.find(u => u.confirmationToken === token);

  if (!user) {
    return { success: false, error: 'Invalid or expired confirmation token' };
  }

  if (user.emailConfirmed) {
    return { success: false, error: 'Email already confirmed' };
  }

  user.emailConfirmed = true;
  user.confirmationToken = undefined;
  user.updatedAt = new Date();

  return { success: true };
};

export const resendConfirmationEmail = (email: string): { success: boolean; error?: string } => {
  // PHP Backend Integration (commented out)
  // Uncomment below to use PHP backend
  return authService.resendConfirmationEmail(email);

  // Mock implementation (remove when using PHP backend)
  const user = users.find(u => u.email === email);

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  if (user.emailConfirmed) {
    return { success: false, error: 'Email already confirmed' };
  }

  // Generate new token
  const newToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  user.confirmationToken = newToken;
  user.updatedAt = new Date();

  // Mock: In real implementation, send email here via PHP backend
  console.log(`New email confirmation link: /confirm-email?token=${newToken}`);

  return { success: true };
};

