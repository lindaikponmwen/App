import React, { useState, useEffect } from 'react';
import {
  Search, Users, ArrowLeft, Plus, X, UserPlus, Mail, Settings,
  BarChart3, Clock, Calendar, FileText, MessageSquare, Award,
  Filter, Download, Upload, Eye, Edit, Trash2, CheckCircle,
  AlertCircle, TrendingUp, Target, Briefcase, Phone, MapPin,
  CheckSquare, Circle, RefreshCw, AlertTriangle, Send, Paperclip,
  Inbox, Send as SendIcon, ShieldAlert, Zap, Check
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TeamMember, Task, TeamMessage, TimeEntry, TeamDocument, CalendarEvent, SearchUser } from '../types';
import { teamMembers as initialTeamMembers, tasks as initialTasks, teamMessages as initialTeamMessages, timeEntries, teamDocuments, calendarEvents } from '../data/teamManagementData';
import { format } from 'date-fns';
import { getCurrentUser } from '../data/authData';
import dataService from '../services/dataService';

// PHP Backend Integration Service Imports
import {
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
  inviteUserByEmail,
  searchUsers,
  // updateTeamMember,
  getTeamMessages,
  sendTeamMessage
} from '../services/teamService';

interface TeamMembersPageProps {
  onBack: () => void;
}

type TabType = 'overview' | 'members' | 'messages' | 'calendar';

// PHP BACKEND INTEGRATION CONST
// Set to true for production deployment with real PHP endpoints
const USE_PHP_BACKEND = true;

export default function TeamMembersPage({ onBack }: TeamMembersPageProps) {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [teamMessagesList, setTeamMessagesList] = useState<TeamMessage[]>(initialTeamMessages);
  const [messageFolder, setMessageFolder] = useState<'inbox' | 'sent'>('sent');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  
  // Modals
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  
  // Selection States
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  
  // Form States
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [addMemberMethod, setAddMemberMethod] = useState<'search' | 'email'>('search');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [isProcessingAdd, setIsProcessingAdd] = useState(false);

  const [composeMessage, setComposeMessage] = useState({
    recipientId: 'all', // Forced default for broadcast
    subject: '',
    content: '',
    priority: 'normal' as 'normal' | 'important' | 'urgent'
  });
  const [sendingMessage, setSendingMessage] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    type: 'meeting' as 'meeting' | 'deadline' | 'event' | 'leave',
    location: '',
    attendees: [] as string[],
  });

  // Ensuring authUser is used correctly and IDs are always strings
  const authUser = getCurrentUser();

  // Ensure currentTeamId is a string to match service parameters
  const currentTeamId = authUser?.id || '';
  // Ensure currentUserId is a string
  const currentUserId = authUser?.id || ''; 

  // PHP Integration: Load Team Members on Mount
  useEffect(() => {
    const loadTeamData = async () => {
      setLoading(true);
      try {
        if (USE_PHP_BACKEND) {
          // Fetch fresh team members data immediately from backend
          const members = await getTeamMembers(currentTeamId);
          setTeamMembers(members);
        } else {
          // Fallback to mock data
          setTeamMembers(initialTeamMembers);
        }
      } catch (err) {
        console.error('Failed to load team members:', err);
        // Fallback to mock on error
        setTeamMembers(initialTeamMembers);
      } finally{
        setLoading(false);
      }
    };

    loadTeamData();
  }, [currentTeamId]);

  // PHP Integration: Load Messages
  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        if (USE_PHP_BACKEND) {
          const messages = await getTeamMessages(currentTeamId, messageFolder);
          setTeamMessagesList(messages);
        } else {
          // Mock data logic
          const mockFiltered = initialTeamMessages.filter(msg => {
             if (messageFolder === 'inbox') return msg.toId === currentUserId || msg.toId === 'all';
             if (messageFolder === 'sent') return msg.fromId === currentUserId;
             return true;
          });
          setTeamMessagesList(mockFiltered);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'messages' || activeTab === 'overview') {
      loadMessages();
    }
  }, [activeTab, messageFolder, currentTeamId, currentUserId]);

  const handleBackClick = () => {
    navigate('/');
  };

  // PHP Integration: Search Users for Adding
  const handleMemberSearch = async (query: string) => {
    setMemberSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      if (USE_PHP_BACKEND) {
        // Fetch all available organizational members from the database
        const allOrgMembers = await dataService.getAllAvailableTeamMembers();
        
        // Filter out members who are already in the current team to avoid duplicates
        const currentTeamMemberIds = new Set(teamMembers.map(m => m.id));
        
        const filtered = allOrgMembers
          .filter(u => !currentTeamMemberIds.has(u.id))
          .filter(u => 
            u.name.toLowerCase().includes(query.toLowerCase()) || 
            u.email.toLowerCase().includes(query.toLowerCase())
          )
          .map(u => ({
            ...u,
            location: (u as any).location || 'Unknown' // Map optional location for SearchUser type
          })) as SearchUser[];
          
        setSearchResults(filtered);
      } else {
        // Mock search logic
        // Return dummy users for demo
        setSearchResults([
          { id: '101', name: 'Dr. Alice Johnson', email: 'alice@research.com', initials: 'AJ' },
          { id: '102', name: 'Dr. Bob Williams', email: 'bob@research.com', initials: 'BW' }
        ].filter(u => u.name.toLowerCase().includes(query.toLowerCase())));
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!composeMessage.subject || !composeMessage.content) {
      alert('Please fill in all fields');
      return;
    }

    setSendingMessage(true);
    try {
      const targetRecipientId = 'all'; // Forced team-wide
      if (USE_PHP_BACKEND) {
        await sendTeamMessage(
          currentTeamId,
          targetRecipientId,
          composeMessage.subject,
          composeMessage.content,
          composeMessage.priority
        );
        
        // Refresh message list if in sent folder
        if (messageFolder === 'sent') {
          const messages = await getTeamMessages(currentTeamId, 'sent');
          setTeamMessagesList(messages);
        }
      } else {
        // Mock Implementation
        console.log('Broadcasting message:', composeMessage);
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
        
        // Add to local state for immediate feedback
        const newMsg: TeamMessage = {
          id: Date.now().toString(),
          fromId: currentUserId,
          toId: targetRecipientId,
          subject: composeMessage.subject,
          content: composeMessage.content,
          priority: composeMessage.priority,
          type: 'announcement',
          read: true,
          createdAt: new Date()
        };
        
        if (messageFolder === 'sent') {
          setTeamMessagesList([newMsg, ...teamMessagesList]);
        }
      }
      
      // If not in sent, switch to sent to show the new message (optional, but good UX)
      if (messageFolder !== 'sent') {
        setMessageFolder('sent');
      }

      setShowMessageModal(false);
      setComposeMessage({
        recipientId: 'all',
        subject: '',
        content: '',
        priority: 'normal'
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    return matchesSearch && matchesStatus && matchesRole;
  });

  // Only show Calendar tab if user is administrator
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'members', label: 'Team Members', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    ...(currentUser?.role === 'administrator' ? [{ id: 'calendar', label: 'Calendar', icon: Calendar }] : []),
  ] as const;

  // Calculate total projects based on owner
  const teamOwner = teamMembers.find(m => m.id === '1') || teamMembers[0];
  const totalProjects = teamOwner?.currentProjects?.length || 0;
  const completedProjects = 12; // This would typically come from stats endpoint
  const totalBroadcasts = teamMessagesList.length;
  
  const projectCounts = teamMembers.length > 0 ? teamMembers.map(member => ({
    member,
    count: (member.currentProjects || []).length
  })) : [];
  
  const memberWithMostProjects = projectCounts.length > 0 
    ? projectCounts.reduce((max, curr) => curr.count > max.count ? curr : max, projectCounts[0])
    : null;
  const memberWithLeastProjects = projectCounts.length > 0
    ? projectCounts.reduce((min, curr) => curr.count < min.count ? curr : min, projectCounts[0])
    : null;

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{teamMembers.length - 1}</div>
          <div className="text-sm text-gray-600">Total Team Members</div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-100 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{totalProjects}</div>
          <div className="text-sm text-gray-600">Total Projects</div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-cyan-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{completedProjects}</div>
          <div className="text-sm text-gray-600">Completed Projects</div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 flex items-center justify-center">
              <SendIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{totalBroadcasts}</div>
          <div className="text-sm text-gray-600">Team Broadcasts</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Contributors</h3>
          <div className="space-y-4">
            {memberWithMostProjects && (
              <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {memberWithMostProjects.member.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{memberWithMostProjects.member.name}</div>
                    <div className="text-sm text-gray-600">{memberWithMostProjects.member.role}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{memberWithMostProjects.count}</div>
                  <div className="text-xs text-gray-600">Most Projects</div>
                </div>
              </div>
            )}

            {memberWithLeastProjects && (
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {memberWithLeastProjects.member.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{memberWithLeastProjects.member.name}</div>
                    <div className="text-sm text-gray-600">{memberWithLeastProjects.member.role}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{memberWithLeastProjects.count}</div>
                  <div className="text-xs text-gray-600">Least Projects</div>
                </div>
              </div>
            )}
            
            {!memberWithMostProjects && (
              <div className="text-center py-8 text-gray-500">
                No contributor data available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMembers = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 w-full sm:max-w-md">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on-leave">On Leave</option>
          </select>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="Principal Investigator">Principal Investigator</option>
            <option value="Senior Research Scientist">Senior Research Scientist</option>
            <option value="Research Scientist">Research Scientist</option>
            <option value="Data Analyst">Data Analyst</option>
            <option value="Research Coordinator">Research Coordinator</option>
          </select>
          <button
            onClick={() => {
              setAddMemberError(null);
              setShowAddMemberModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
          >
            <UserPlus className="w-5 h-5" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map(member => (
          <div
            key={member.id}
            className="bg-white border border-gray-200 p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {member.avatar ? (
                  <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {member.initials}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{member.name}</h3>
                  <p className="text-sm text-gray-600">{member.role}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                member.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                member.status === 'on-leave' ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {member.status === 'on-leave' ? 'On Leave' : member.status.charAt(0).toUpperCase() + member.status.slice(1)}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                {member.email}
              </div>
              {member.phoneNumber && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  {member.phoneNumber}
                </div>
              )}
              {member.location && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  {member.location}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <div className="text-2xl font-bold text-gray-900">{(member.currentProjects || []).length}</div>
                <div className="text-xs text-gray-600">Active Projects</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{Math.floor((member.currentProjects || []).length * 0.7)}</div>
                <div className="text-xs text-gray-600">Completed</div>
              </div>
            </div>

            <button
              onClick={() => {
                setMemberToRemove(member);
                setShowRemoveMemberModal(true);
              }}
              className="w-full mt-4 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Remove Member</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Sent Broadcasts</h2>
        <button
          onClick={() => setShowMessageModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium shadow-sm"
        >
          <Send className="w-5 h-5" />
          <span>New Broadcast</span>
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading messages...</div>
        ) : teamMessagesList.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <SendIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No sent broadcasts found.</p>
          </div>
        ) : (
          teamMessagesList.map(message => {
            const isSender = messageFolder === 'sent';
            const displayUser = isSender 
              ? teamMembers.find(m => m.id === message.toId) 
              : teamMembers.find(m => m.id === message.fromId);
            
            const displayName = message.toId === 'all' && isSender ? 'All Team Members' : (displayUser?.name || 'Unknown User');
            const displayInitials = message.toId === 'all' && isSender ? 'ALL' : (displayUser?.initials || 'U');

            return (
              <div 
                key={message.id} 
                className={`bg-white border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer ${
                  !message.read && !isSender ? 'border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg ${
                      message.toId === 'all' ? 'bg-purple-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'
                    }`}>
                      {displayInitials}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{isSender ? 'To:' : 'From:'}</span>
                        <h3 className="font-semibold text-gray-900">{displayName}</h3>
                        {message.type === 'announcement' && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            Announcement
                          </span>
                        )}
                        {message.priority === 'urgent' && (
                          <div className="flex items-center space-x-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            <AlertCircle className="w-3 h-3" />
                            <span>Urgent</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{format(message.createdAt, 'MMM d, yyyy • h:mm a')}</p>
                    </div>
                  </div>
                  {!isSender && !message.read && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                      New
                    </span>
                  )}
                </div>
                
                <div className="pl-16">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">{message.subject}</h4>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const renderCalendar = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Team Calendar</h2>
        <button
          onClick={() => setShowAddEventModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Add Event</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {calendarEvents.map(event => (
          <div key={event.id} className="bg-white border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start space-x-4">
              <div className={`w-12 h-12 flex items-center justify-center ${
                event.type === 'meeting' ? 'bg-blue-100' :
                event.type === 'deadline' ? 'bg-red-100' :
                event.type === 'leave' ? 'bg-amber-100' :
                'bg-emerald-100'
              }`}>
                <Calendar className={`w-6 h-6 ${
                  event.type === 'meeting' ? 'text-blue-600' :
                  event.type === 'deadline' ? 'text-red-600' :
                  event.type === 'leave' ? 'text-amber-600' :
                  'text-emerald-600'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{event.title}</h3>
                  <span className={`px-2 py-1 text-xs font-medium ${
                    event.type === 'meeting' ? 'bg-blue-100 text-blue-700' :
                    event.type === 'deadline' ? 'bg-red-100 text-red-700' :
                    event.type === 'leave' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{format(event.startDate, 'MMM d, yyyy • h:mm a')}</span>
                  </div>
                  {event.location && (
                    <>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    </>
                  )}
                  <span>•</span>
                  <span>{event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-gray-50 overflow-hidden">
      <div className="h-full overflow-y-auto">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <button
                onClick={handleBackClick}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Dashboard</span>
              </button>

              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Group Management</h1>
                  <p className="text-gray-600">Comprehensive team oversight and collaboration</p>
                </div>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Settings className="w-6 h-6" />
                </button>
              </div>

              <div className="bg-white border border-gray-200 p-2 mb-8">
                <div className="flex items-center space-x-1 overflow-x-auto">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`flex items-center space-x-2 px-4 py-2 transition-colors whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {loading && activeTab === 'overview' ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
                {error}
              </div>
            ) : (
              <>
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'members' && renderMembers()}
                {activeTab === 'messages' && renderMessages()}
                {activeTab === 'calendar' && renderCalendar()}
              </>
            )}
          </div>
        </div>
      </div>

       <AnimatePresence>
        {showRemoveMemberModal && memberToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => setShowRemoveMemberModal(false)}
            />
            <div className="relative bg-white shadow-2xl w-full max-w-xs">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Remove Team Member</h2>
                <p className="text-gray-600 text-center mb-6 text-sm">
                  Are you sure you want to remove <strong>{memberToRemove.name}</strong> from the team? This action cannot be undone.
                </p>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowRemoveMemberModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (USE_PHP_BACKEND) {
                        try {
                          await removeTeamMember(currentTeamId, memberToRemove.id);
                          // Refresh list
                          const updatedMembers = await getTeamMembers(currentTeamId);
                          setTeamMembers(updatedMembers);
                        } catch (err) {
                          console.error("Failed to remove member:", err);
                        }
                      } else {
                        setTeamMembers(prev => prev.filter(m => m.id !== memberToRemove.id));
                      }
                      setShowRemoveMemberModal(false);
                      setMemberToRemove(null);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors font-medium text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Redesigned Add Team Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowAddMemberModal(false)}
          />
          <div className="relative bg-white w-full max-w-2xl border-4 border-slate-900 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-slate-900 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter text-white">Add Personnel Unit</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center">
                    <ShieldAlert className="w-3 h-3 mr-1.5 text-blue-400" /> 
                    Team Registry Expansion Protocol
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto scrollbar-hide bg-white">
              {/* Tabs */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => { setAddMemberMethod('search'); setAddMemberError(null); }}
                  className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-2 transition-colors ${
                    addMemberMethod === 'search'
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400'
                  }`}
                >
                  Registry Search
                </button>
                <button
                  onClick={() => { setAddMemberMethod('email'); setAddMemberError(null); }}
                  className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-2 transition-colors ${
                    addMemberMethod === 'email'
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400'
                  }`}
                >
                  External Invitation
                </button>
              </div>

              {/* Modal Errors */}
              {addMemberError && (
                <div className="p-4 bg-red-50 border-l-4 border-red-600">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1">TX INTERRUPTED</p>
                  <p className="text-xs font-bold text-red-900 uppercase">{addMemberError}</p>
                </div>
              )}

              {addMemberMethod === 'search' ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Lookup Identity</label>
                    <div className="relative">
                      <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={memberSearchQuery}
                        onChange={(e) => handleMemberSearch(e.target.value)}
                        placeholder="SEARCH BY NAME OR EMAIL..."
                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-slate-200 focus:border-slate-900 focus:outline-none text-xs font-black tracking-wider placeholder:text-slate-300 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="border-2 border-slate-100 max-h-60 overflow-y-auto">
                    {memberSearchQuery ? (
                      <div className="divide-y-2 divide-slate-100">
                        {searchResults.length > 0 ? (
                          searchResults.map(user => (
                            <div key={user.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-slate-900 flex items-center justify-center text-white text-[10px] font-black">
                                  {user.initials}
                                </div>
                                <div>
                                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-900">{user.name}</div>
                                  <div className="text-[9px] font-bold uppercase text-slate-400">{user.email}</div>
                                </div>
                              </div>
                              <button
                                onClick={async () => {
                                  setIsProcessingAdd(true);
                                  setAddMemberError(null);
                                  try {
                                    if (USE_PHP_BACKEND) {
                                      await addTeamMember(currentTeamId, user.id);
                                      const members = await getTeamMembers(currentTeamId);
                                      setTeamMembers(members);
                                    } else {
                                      // Mock logic
                                      console.log('Adding user:', user.id);
                                      // Simulate "user already exists" for demo if name is Dr. Alice Johnson
                                      if (user.name.includes('Alice')) {
                                        throw new Error("This personnel unit is already assigned to the target team.");
                                      }
                                      setTeamMembers([...teamMembers, { ...initialTeamMembers[0], id: user.id, name: user.name, email: user.email, initials: user.initials }]);
                                    }
                                    setShowAddMemberModal(false);
                                  } catch (err: any) {
                                    setAddMemberError(err.message || "Failed to add personnel. Verification failed.");
                                  } finally {
                                    setIsProcessingAdd(false);
                                  }
                                }}
                                className="px-5 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-black"
                              >
                                {isProcessingAdd ? 'Syncing...' : 'Assign'}
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">No matching personnel found</div>
                        )}
                      </div>
                    ) : (
                      <div className="p-12 text-center">
                        <Users className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Enter transmission data above to scan registry</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Transmission Email Address</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="teammember@gmail.com..."
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 focus:border-slate-900 focus:outline-none text-xs font-black tracking-wider placeholder:text-slate-300 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Assigned Role (Optional)</label>
                    <select className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 focus:border-slate-900 focus:outline-none text-[10px] font-black uppercase tracking-widest">
                      <option value="">SELECT PROTOCOL...</option>
                      <option value="Principal Investigator">Principal Investigator</option>
                      <option value="Senior Research Scientist">Senior Research Scientist</option>
                      <option value="Research Scientist">Research Scientist</option>
                      <option value="Data Analyst">Data Analyst</option>
                      <option value="Research Coordinator">Member</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Invitation Payload (Optional)</label>
                    <textarea
                      placeholder="TYPE SECURE TRANSMISSION DATA HERE..."
                      rows={4}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 focus:border-slate-900 focus:outline-none text-xs font-bold leading-relaxed placeholder:text-slate-300 resize-none transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 border-t-2 border-slate-100 flex items-center justify-between bg-slate-50">
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="px-8 py-4 text-slate-400 hover:text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
              >
                Abort
              </button>
              <button
                onClick={async () => {
                  if (addMemberMethod === 'search') return; // Handled inline above
                  
                  setIsProcessingAdd(true);
                  setAddMemberError(null);
                  try {
                    if (USE_PHP_BACKEND) {
                      await inviteUserByEmail(currentTeamId, inviteEmail);
                    } else {
                      // Mock validation
                      if (inviteEmail === 'sarah.mitchell@research.org') {
                        throw new Error("Personnel record already exists in this team unit.");
                      }
                      console.log('Invite sent to:', inviteEmail);
                    }
                    setShowAddMemberModal(false);
                    setInviteEmail('');
                  } catch (err: any) {
                    setAddMemberError(err.message || "Failed to initiate invitation protocol.");
                  } finally {
                    setIsProcessingAdd(false);
                  }
                }}
                disabled={isProcessingAdd || (addMemberMethod === 'email' && !inviteEmail)}
                className="px-10 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center space-x-3 hover:bg-black transition-all active:scale-95 disabled:opacity-50"
              >
                {isProcessingAdd ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synchronizing...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>{addMemberMethod === 'search' ? 'Confirm Addition' : 'Execute Invitation'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Redesigned Broadcast Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowMessageModal(false)}
          />
          <div className="relative bg-white w-full max-w-2xl border-4 border-slate-900 flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter text-white">Broadcast Transmission</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center">
                    <ShieldAlert className="w-3 h-3 mr-1.5 text-blue-400" /> 
                    Secure Data Stream: All Team Members
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMessageModal(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto scrollbar-hide bg-white">
              {/* Force Broadcast Indicator instead of Recipient Select */}
              <div className="p-4 bg-slate-50 border-l-4 border-blue-600">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">TX DESTINATION</p>
                <p className="text-sm font-bold text-slate-900 uppercase">System-Wide Broadcast (All Enrolled Members)</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Transmission Subject</label>
                  <input
                    type="text"
                    value={composeMessage.subject}
                    onChange={(e) => setComposeMessage({...composeMessage, subject: e.target.value})}
                    placeholder="ENTER DATA SUBJECT..."
                    className="w-full px-5 py-4 bg-white border-2 border-slate-200 focus:border-slate-900 focus:outline-none text-xs font-black tracking-wider placeholder:text-slate-300 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Priority Protocol</label>
                  <div className="flex items-center space-x-6">
                    {['normal', 'important', 'urgent'].map((p) => (
                      <button 
                        key={p}
                        onClick={() => setComposeMessage({...composeMessage, priority: p as any})}
                        className={`flex items-center space-x-2 group cursor-pointer`}
                      >
                        <div className={`w-4 h-4 border-2 border-slate-900 flex items-center justify-center ${composeMessage.priority === p ? 'bg-slate-900' : 'bg-transparent'}`}>
                          {composeMessage.priority === p && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${composeMessage.priority === p ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>{p}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Message Payload</label>
                  <textarea
                    value={composeMessage.content}
                    onChange={(e) => setComposeMessage({...composeMessage, content: e.target.value})}
                    rows={8}
                    placeholder="TYPE SECURE TRANSMISSION DATA HERE..."
                    className="w-full px-5 py-4 bg-white border-2 border-slate-200 focus:border-slate-900 focus:outline-none text-xs font-bold leading-relaxed placeholder:text-slate-300 resize-none transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="p-8 border-t-2 border-slate-100 flex items-center justify-between bg-slate-50">
              <button
                onClick={() => setShowMessageModal(false)}
                className="px-8 py-4 text-slate-400 hover:text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
              >
                Abort
              </button>
              <button
                onClick={handleSendMessage}
                disabled={sendingMessage}
                className="px-10 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center space-x-3 hover:bg-black transition-all active:scale-95 disabled:opacity-50"
              >
                {sendingMessage ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synchronizing...</span>
                  </>
                ) : (
                  <>
                    <SendIcon className="w-4 h-4" />
                    <span>Execute Broadcast</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showAddEventModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => setShowAddEventModal(false)}
            />
            <div className="relative bg-white shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Add Calendar Event</h2>
                <button
                  onClick={() => setShowAddEventModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Enter event title"
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Enter event description"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={newEvent.startDate}
                      onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={newEvent.endDate}
                      onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                    <input
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as 'meeting' | 'deadline' | 'event' | 'leave' })}
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="meeting">Meeting</option>
                    <option value="deadline">Deadline</option>
                    <option value="event">Event</option>
                    <option value="leave">Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location (Optional)</label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    placeholder="Enter location"
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Attendees</label>
                  <div className="border border-gray-300 p-4 max-h-48 overflow-y-auto">
                    {teamMembers.map(member => (
                      <label key={member.id} className="flex items-center space-x-3 py-2 cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={newEvent.attendees.includes(member.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewEvent({ ...newEvent, attendees: [...newEvent.attendees, member.id] });
                            } else {
                              setNewEvent({ ...newEvent, attendees: newEvent.attendees.filter(id => id !== member.id) });
                            }
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {member.initials}
                          </div>
                          <span className="text-sm text-gray-900">{member.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setShowAddEventModal(false)}
                  className="px-6 py-3 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowAddEventModal(false);
                    setNewEvent({
                      title: '',
                      description: '',
                      startDate: '',
                      startTime: '',
                      endDate: '',
                      endTime: '',
                      type: 'meeting',
                      location: '',
                      attendees: [],
                    });
                  }}
                  className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
                >
                  Add Event
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
