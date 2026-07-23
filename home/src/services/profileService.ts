/**
 * Profile Service
 *
 * Handles secure communication with PHP backend profile endpoints
 * Features:
 * - Profile data retrieval
 * - Profile updates
 * - Messages/inbox management
 * - Document approvals
 * - Personal files management
 * - Automatic CSRF token management
 */

const API_BASE_URL = '';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ProfileData {
  profile: {
    id: string;
    name: string;
    username: string;
    email: string;
    initials: string;
    avatar?: string;
    role: string;
    personalInfo: {
      phone: string;
      dateOfBirth: string;
      nationalId: string;
      title: string;
      hireDate: string;
      address: string;
      cityState: string;
      postcode: string;
    };
    professionalInfo: {
      role: string;
      department: string;
      memberSince: string;
    };
  };
  jobInformation: Array<{
    department: string;
    division: string;
    manager: string;
    hire_date_formatted: string;
    location: string;
  }>;
  recentActivity: Array<{
    id: number;
    user: {
      name: string;
      initials: string;
      avatar?: string;
    };
    action: string;
    date: string;
    time: string;
  }>;
  compensationData: Array<{
    amount: string;
    effectiveDate: string;
  }>;
}

interface Message {
  id: number;
  sender: {
    id: string;
    name: string;
    initials: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface Approval {
  id: number;
  document: string;
  project: string;
  status: 'approved' | 'rejected' | 'pending';
  approver: string;
  date: string;
  comments: string;
}

interface PersonalFile {
  id: number;
  name: string;
  type: string;
  size: string;
  category: string;
  path: string;
  modified: string;
}

class ProfileService {
  /**
   * Make secure API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}/profiles/${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add CSRF token from localStorage
    const csrfToken = localStorage.getItem('csrfToken');
    if (csrfToken && options.method !== 'GET') {
      headers['X-CSRF-Token'] = csrfToken;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {
          success: false,
          error: 'Server returned non-JSON response. The backend endpoint may not be configured correctly.',
        };
      }

      const data = await response.json();

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
   * Get complete profile data
   */
  async getProfile(): Promise<{
    success: boolean;
    data?: ProfileData;
    error?: string;
  }> {
    const response = await this.request<ProfileData>('get-profile.php', {
      method: 'GET',
    });

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch profile',
    };
  }

  /**
   * Update profile section
   */
  async updateProfile(
    section: 'contact' | 'address' | 'employee' | 'avatar',
    data: any
  ): Promise<{ success: boolean; error?: string }> {
    const response = await this.request('update-profile.php', {
      method: 'POST',
      body: JSON.stringify({ section, ...data }),
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error || 'Failed to update profile',
    };
  }

  /**
   * Get user messages
   */
  async getMessages(
    conversationId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    success: boolean;
    messages?: Message[];
    error?: string;
  }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (conversationId) {
      params.append('conversation_id', conversationId);
    }

    const response = await this.request<{ messages: Message[] }>(
      `get-messages.php?${params.toString()}`,
      {
        method: 'GET',
      }
    );

    if (response.success && response.data) {
      return {
        success: true,
        messages: response.data.messages,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch messages',
    };
  }

  // [FIX] Added getTeamFeed method to fetch team announcements and feed messages
  /**
   * Get team feed messages
   */
  async getTeamFeed(): Promise<{
    success: boolean;
    messages?: any[];
    error?: string;
  }> {
    const response = await this.request<{ messages: any[] }>('get-team-feed.php', {
      method: 'GET',
    });

    if (response.success && response.data) {
      return {
        success: true,
        messages: response.data.messages,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch team feed',
    };
  }

  /**
   * Send message
   */
  async sendMessage(
    recipientId: string,
    content: string
  ): Promise<{
    success: boolean;
    message?: Message;
    error?: string;
  }> {
    const response = await this.request<{ message: Message }>('send-message.php', {
      method: 'POST',
      body: JSON.stringify({ recipientId, content }),
    });

    if (response.success && response.data) {
      return {
        success: true,
        message: response.data.message,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to send message',
    };
  }

  /**
   * Mark all messages in a conversation as read
   */
  async markConversationAsRead(
    senderId: string
  ): Promise<{ success: boolean; error?: string }> {
    const response = await this.request('mark-messages-read.php', {
      method: 'POST',
      body: JSON.stringify({ senderId }),
    });

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error || 'Failed to mark messages as read',
    };
  }

  /**
   * Get document approvals
   */
  async getApprovals(): Promise<{
    success: boolean;
    approvals?: Approval[];
    error?: string;
  }> {
    const response = await this.request<{ approvals: Approval[] }>(
      'get-approvals.php',
      {
        method: 'GET',
      }
    );

    if (response.success && response.data) {
      return {
        success: true,
        approvals: response.data.approvals,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch approvals',
    };
  }

  /**
   * Get personal files
   */
  async getFiles(): Promise<{
    success: boolean;
    files?: PersonalFile[];
    error?: string;
  }> {
    const response = await this.request<{ files: PersonalFile[] }>('get-files.php', {
      method: 'GET',
    });

    if (response.success && response.data) {
      return {
        success: true,
        files: response.data.files,
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to fetch files',
    };
  }
}

// Export singleton instance
export const profileService = new ProfileService();
export default profileService;
