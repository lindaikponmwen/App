import axios from 'axios';
import { TeamMember, SearchUser, TeamMessage, Team } from '../types';
import { teamMembers as mockTeamMembers, teamMessages as mockTeamMessages } from '../data/teamManagementData';

const API_BASE_URL = '';
/**
 * Get all teams the current user is a member of
 */
export async function getUserTeams(): Promise<Team[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/team/user-teams.php`, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.data.success) {
      return response.data.teams.map((t: any) => ({
        id: String(t.id),
        name: t.name,
        description: t.description,
        ownerUserId: String(t.owner_user_id),
        isOwner: Boolean(t.is_owner),
        memberCount: Number(t.member_count || 0),
        joinedDate: new Date(t.joined_date)
      }));
    } else {
      throw new Error(response.data.message || 'Failed to fetch user teams');
    }
  } catch (error) {
    console.error('Error fetching user teams:', error);
    // Return mock data for development
    return [
      {
        id: '1',
        name: 'Clinical Pharmacology Research Team',
        description: 'Primary research team focused on clinical pharmacology studies.',
        ownerUserId: '1',
        isOwner: true,
        memberCount: 6,
        joinedDate: new Date('2023-01-05')
      },
      {
        id: '2',
        name: 'Data Analytics Team',
        description: 'Team dedicated to analyzing clinical trial data.',
        ownerUserId: '2',
        isOwner: false,
        memberCount: 4,
        joinedDate: new Date('2024-06-01')
      }
    ];
  }
}

/**
 * Get all members of a team
 */
export async function getTeamMembers2(teamId: string): Promise<TeamMember[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/team/list.php`, {
      params: { team_id: teamId },
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.data.success) {
      // Map the backend data to our TeamMember frontend interface
      return response.data.members.map((member: any) => ({
        ...member,
        joinedDate: new Date(member.joined_date || Date.now()),
        permissions: member.permissions || [],
        // Fallback for mock fields if not in DB
        tasksCompleted: member.tasksCompleted || 0,
        tasksInProgress: member.tasksInProgress || 0,
        performanceScore: member.performanceScore || 0,
        attendance: member.attendance || 100,
        hoursThisWeek: member.hoursThisWeek || 0,
        currentProjects: member.currentProjects || []
      }));
    } else {
      throw new Error(response.data.message || 'Failed to fetch team members');
    }
  } catch (error) {
    console.error('Error fetching team members from backend:', error);
    throw error;
  }
}


export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  // PHP Backend Integration
 
  try {
    const response = await axios.get(`${API_BASE_URL}/team/list.php`, {
      params: { team_id: teamId },
      withCredentials: true
    });

    if (response.data.success) {
      return response.data.members;
    } else {
      throw new Error(response.data.message || 'Failed to fetch team members');
    }
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw error;
  }
  

  // Mock data for development
  return mockTeamMembers;
}

export async function addTeamMember(
  teamId: string,
  userId: string,
  role: string = 'Member',
  permissions: string[] = []
): Promise<{ success: boolean; memberId: string }> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/team/add.php`,
      {
        team_id: teamId,
        user_id: userId,
        role,
        permissions
      },
      { withCredentials: true }
    );

    if (response.data.success) {
      return {
        success: true,
        memberId: response.data.member_id
      };
    } else {
      throw new Error(response.data.message || 'Failed to add team member');
    }
  } catch (error) {
    console.error('Error adding team member:', error);
    throw error;
  }
}

export async function removeTeamMember(
  teamId: string,
  userId: string
): Promise<{ success: boolean }> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/team/remove.php`,
      {
        team_id: teamId,
        user_id: userId
      },
      { withCredentials: true }
    );
    
    if (response.data.success) {
      return { success: true };
    } else {
      throw new Error(response.data.message || 'Failed to remove team member');
    }
  } catch (error) {
    console.error('Error removing team member:', error);
    throw error;
  }
}

export async function searchUsers(
  teamId: string,
  query: string,
  limit: number = 10
): Promise<SearchUser[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/team/search.php`, {
      params: {
        team_id: teamId,
        query,
        limit
      },
      withCredentials: true
    });

    if (response.data.success) {
      return response.data.users;
    } else {
      throw new Error(response.data.message || 'Failed to search users');
    }
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
}

export async function inviteUserByEmail(
  teamId: string,
  email: string,
  role: string = 'Member',
  message: string = ''
): Promise<{ success: boolean; invitationId: string }> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/team/invite.php`,
      {
        team_id: teamId,
        email,
        role,
        message
      },
      { withCredentials: true }
    );
    
    if (response.data.success) {
      return {
        success: true,
        invitationId: response.data.invitation_id
      };
    } else {
      throw new Error(response.data.message || 'Failed to send invitation');
    }
  } catch (error) {
    console.error('Error sending invitation:', error);
    throw error;
  }
}

export async function updateTeamMember(
  teamId: string,
  userId: string,
  updates: {
    role?: string;
    status?: 'active' | 'inactive' | 'on-leave';
    permissions?: string[];
  }
): Promise<{ success: boolean }> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/team/update.php`,
      {
        team_id: teamId,
        user_id: userId,
        ...updates
      },
      { withCredentials: true }
    );

    if (response.data.success) {
      return { success: true };
    } else {
      throw new Error(response.data.message || 'Failed to update team member');
    }
  } catch (error) {
    console.error('Error updating team member:', error);
    throw error;
  }
}

/**
 * Get team messages (Inbox or Sent)
 */
export async function getTeamMessages(
  teamId: string, 
  folder: 'inbox' | 'sent' = 'inbox',
  limit: number = 20
): Promise<TeamMessage[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/team/messages-list.php`, {
      params: {
        team_id: teamId,
        folder: folder,
        limit: limit
      },
      withCredentials: true
    });

    

    if (response.data.success) {
      return response.data.messages.map((msg: any) => ({
        ...msg,
        createdAt: new Date(msg.createdAt),
        read: Boolean(msg.read) // Ensure boolean
      }));
    } else {
      throw new Error(response.data.message || 'Failed to fetch messages');
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

/**
 * Send a team message
 */
export async function sendTeamMessage(
  teamId: string,
  recipientId: string,
  subject: string,
  content: string,
  priority: 'normal' | 'important' | 'urgent' = 'normal'
): Promise<{ success: boolean; messageId: string }> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/team/message-send.php`,
      {
        team_id: teamId,
        recipient_id: recipientId,
        subject,
        content,
        priority
      },
      { withCredentials: true }
    );
    
    if (response.data.success) {
      return {
        success: true,
        messageId: response.data.message_id
      };
    } else {
      throw new Error(response.data.message || 'Failed to send message');
    }
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

export async function getTeamStats(teamId: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}/team/stats.php`, {
      params: { team_id: teamId },
      withCredentials: true
    });

    if (response.data.success) {
      return response.data.stats;
    } else {
      throw new Error(response.data.message || 'Failed to fetch team stats');
    }
  } catch (error) {
    console.error('Error fetching team stats:', error);
    // Return safe default to prevent UI crash
    return {
      totalMembers: 0,
      totalProjects: 0,
      completedProjects: 0,
      tasksCompleted: 0,
      activeTasks: 0
    };
  }
}
