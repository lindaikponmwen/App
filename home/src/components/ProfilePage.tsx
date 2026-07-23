import React, { useEffect, useState } from 'react';
import { Mail, Briefcase, MessageSquare, User, Clock, Pencil, Check, X, Search, Send, Plus, UserPlus, AlertTriangle, Shield, ChevronRight, Users, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUserProfile, allAvailableTeamMembers } from '../data/mockData';
import { profileService } from '../services/profileService';
import { dataService } from '../services/dataService';
import { getUserTeams, removeTeamMember } from '../services/teamService';
import { format, parseISO } from 'date-fns';
import { Team } from '../types';
import {
  mockUserProfile,
  profileTabs,
  type Message,
  initialMessages
} from '../data/profileData';

// PHP BACKEND INTEGRATION CONST
// Set to true for production deployment with real PHP endpoints
const USE_PHP_BACKEND = true;

export default function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [feedMessages, setFeedMessages] = useState<any[]>([]);
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [showNewChatSearch, setShowNewChatSearch] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showSaveConfirmationModal, setShowSaveConfirmationModal] = useState(false);
  
  // Teams State
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [showLeaveTeamModal, setShowLeaveTeamModal] = useState(false);
  const [teamToLeave, setTeamToLeave] = useState<Team | null>(null);
  
  // Initialize with mock data, will be overwritten if backend is active
  const [allMembers, setAllMembers] = useState<any[]>(allAvailableTeamMembers);

  const currentUser = getCurrentUserProfile();

  const [loading, setLoading] = useState(true);
  
  // Split messages into inbox list and active conversation details
  const [inboxMessages, setInboxMessages] = useState<any[]>([]);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [loadingConversation, setLoadingConversation] = useState(false);

  const [userProfile, setUserProfile] = useState<any>({
    ...currentUser,
    ...mockUserProfile,
    personalInfo: mockUserProfile.personalInfo,
    professionalInfo: mockUserProfile.professionalInfo
  });

  const [editFormData, setEditFormData] = useState({
    name: userProfile.name || '',
    username: userProfile.username || '',
    title: userProfile.professionalInfo?.role || userProfile.personalInfo?.title || '',
  });

  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [newMessage, setNewMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    // Check for conversation in URL params
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    const conversationParam = searchParams.get('conversation') || searchParams.get('user');

    if (tabParam) {
      setActiveTab(tabParam);
    }
    if (conversationParam) {
      setSelectedConversation(conversationParam);
    }
  }, [location.search]);

  // Fetch full conversation history when a thread is selected AND mark as read
  useEffect(() => {
    if (!selectedConversation) {
      setConversationMessages([]);
      return;
    }

    // 1. Mark as read logic
    const markAsRead = async () => {
      try {
        if (USE_PHP_BACKEND) {
          await profileService.markConversationAsRead(selectedConversation);
        }
        
        // Optimistically update local inbox state to remove "unread" status
        setInboxMessages(prevMessages => 
          prevMessages.map(msg => {
            // If the message is from the selected sender AND meant for current user, mark read
            const isFromSender = String(msg.sender?.id || msg.originalSenderId) === String(selectedConversation);
            const isForMe = String(msg.recipientId) === String(userProfile.id);
            
            if (isFromSender && isForMe) {
              return { ...msg, isRead: true };
            }
            return msg;
          })
        );
      } catch (err) {
        console.error('Failed to mark conversation as read', err);
      }
    };
    markAsRead();

    // 2. Fetch thread details
    const fetchThread = async () => {
      setLoadingConversation(true);
      try {
        if (USE_PHP_BACKEND) {
          const response = await profileService.getMessages(selectedConversation);
          if (response.success && response.messages) {
            setConversationMessages(response.messages);
          }
        } else {
          // Mock Mode: Filter from the full inbox list (assuming mock inbox has all history)
          const myId = String(userProfile.id);
          const thread = inboxMessages.filter(m => {
            const senderId = String(m.originalSenderId || m.sender.id);
            const recipientId = String(m.recipientId);
            return (senderId === myId && recipientId === selectedConversation) ||
                   (senderId === selectedConversation && recipientId === myId);
          });
          // If no messages found in inbox list (e.g. new chat), keep empty
          setConversationMessages(thread);
        }
      } catch (err) {
        console.error('Failed to load conversation:', err);
      } finally {
        setLoadingConversation(false);
      }
    };

    fetchThread();
  }, [selectedConversation, userProfile.id]); 

  // Load Teams when the My teams tab is active
  useEffect(() => {
    if (activeTab === 'my-teams') {
      loadTeams();
    }
  }, [activeTab]);

  const loadTeams = async () => {
    setLoadingTeams(true);
    try {
      const teams = await getUserTeams();
      setMyTeams(teams);
    } catch (err) {
      console.error('Failed to load user teams:', err);
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleLeaveTeam = (team: Team) => {
    if (team.isOwner) {
      alert('As the owner of this team, you cannot leave it. You must transfer ownership first.');
      return;
    }
    setTeamToLeave(team);
    setShowLeaveTeamModal(true);
  };

  const executeLeaveTeam = async () => {
    if (!teamToLeave) return;
    
    try {
      if (USE_PHP_BACKEND) {
        await removeTeamMember(teamToLeave.id, userProfile.id);
      }
      
      // Optimistically remove from list
      setMyTeams(prev => prev.filter(t => t.id !== teamToLeave.id));
      setShowLeaveTeamModal(false);
      setTeamToLeave(null);
    } catch (err) {
      console.error('Failed to leave team:', err);
      alert('Failed to leave team. Please try again.');
    }
  };

  useEffect(() => {
    const initProfileData = async () => {
      if (!USE_PHP_BACKEND) {
        // Mock data initialization
        setFeedMessages([
          {
            id: 'feed1',
            type: 'announcement',
            subject: 'Protocol Deviation Identified',
            content: 'A protocol deviation was identified in Study XYZ-123. Please review the attached documentation and provide your input by end of day.',
            priority: 'urgent',
            createdAt: new Date('2026-01-19T14:30:00'),
            fromName: 'Dr. David Kim',
            fromInitials: 'DK'
          },
          {
            id: 'feed2',
            type: 'research_update',
            subject: 'Phase II Trial Update',
            content: 'Enrollment for the Phase II trial has been successfully completed ahead of schedule. Data collection is proceeding as planned, with first interim analysis expected next month.',
            priority: 'normal',
            createdAt: new Date('2026-01-18T11:00:00'),
            fromName: 'Dr. Emily Watson',
            fromInitials: 'EW'
          }
        ]);
        
        // Ensure mock messages have necessary fields for the new logic
        const normalizedMockMessages = initialMessages.map(m => ({
          ...m,
          originalSenderId: m.sender.id, // Map for compatibility
          recipientId: m.recipientId
        }));
        setInboxMessages(normalizedMockMessages);
        setLoading(false);
        return;
      }

      // Real PHP Backend Loading
      try {
        const [profileRes, msgRes, feedRes, membersRes] = await Promise.all([
          profileService.getProfile(),
          profileService.getMessages(), // Gets inbox view (latest msg per conversation)
          profileService.getTeamFeed(),
          dataService.getAllAvailableTeamMembers()
        ]);

        if (profileRes.success && profileRes.data) {
          const profile = profileRes.data.profile;
          setUserProfile(profile);
          setEditFormData({
            name: profile.name,
            username: profile.username,
            title: profile.professionalInfo.role,
          });
        }
        
        if (msgRes.success && msgRes.messages) {
          setInboxMessages(msgRes.messages);
        }

        if (feedRes.success && feedRes.messages) {
          setFeedMessages(feedRes.messages);
        }

        if (membersRes && membersRes.length > 0) {
          setAllMembers(membersRes);
        }
      } catch (err) {
        console.error('Failed to load production profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    initProfileData();
  }, []);

  const validateProfileForm = () => {
    const errors: Record<string, string> = {};
    const { name, username, title } = editFormData;
    if (!name.trim()) errors.name = "Full Legal Name is required.";
    if (!username.trim()) errors.username = "Username is required.";
    if (!title.trim()) errors.title = "Job Title is required.";
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const handleAccountSave = () => {
    if (validateProfileForm()) setShowSaveConfirmationModal(true);
  };

  const executeSave = async () => {
    setLoading(true);
    try {
      if (USE_PHP_BACKEND) {
        // Call production PHP endpoints
        await profileService.updateProfile('contact', { phone: userProfile.personalInfo.phone });
        await profileService.updateProfile('employee', { 
          name: editFormData.name, 
          title: editFormData.title, 
          username: editFormData.username 
        });
      }

      // Update local state
      setUserProfile(prev => ({ 
        ...prev, 
        name: editFormData.name, 
        username: editFormData.username,
        professionalInfo: { ...prev.professionalInfo, role: editFormData.title },
      }));
      
      setIsEditingAccount(false);
      setEditErrors({});
      setShowSaveConfirmationModal(false);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const transmitMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    setSendingMessage(true);
    
    // Optimistic update structure matching backend
    const newMsg = {
      id: Date.now(),
      content: newMessage,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      isRead: false,
      originalSenderId: userProfile.id,
      recipientId: selectedConversation,
      sender: {
        id: userProfile.id,
        name: userProfile.name,
        initials: userProfile.initials,
        avatar: userProfile.avatar
      }
    };

    // Optimistic update for immediate feedback
    setConversationMessages(prev => [...prev, newMsg]);

    try {
      if (USE_PHP_BACKEND) {
        await profileService.sendMessage(selectedConversation, newMessage);
        
        // 1. Refresh the specific conversation to get the official message object (correct ID/timestamp)
        const threadResponse = await profileService.getMessages(selectedConversation);
        if (threadResponse.success && threadResponse.messages) {
          setConversationMessages(threadResponse.messages);
        }

        // 2. Refresh the inbox list to update the sidebar preview/timestamp
        const inboxResponse = await profileService.getMessages();
        if (inboxResponse.success && inboxResponse.messages) {
          setInboxMessages(inboxResponse.messages);
        }
      } else {
        // Mock Mode: Update main list which triggers useEffect
        setInboxMessages(prev => [...prev, newMsg]);
      }
      setNewMessage('');
    } catch (err) {
      console.error('Transmission failed:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const startNewConversation = (member: any) => {
    setSelectedConversation(member.id);
    setShowNewChatSearch(false);
    setChatSearchQuery('');
  };

  // Helper to safely parse date string from SQL or ISO
  const parseMessageDate = (dateStr: string | Date) => {
    if (dateStr instanceof Date) return dateStr;
    // Handle "YYYY-MM-DD HH:mm:ss" from SQL
    return new Date(String(dateStr).replace(' ', 'T'));
  };

  if (loading) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-black border-t-transparent animate-spin mb-4"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Research Data...</p>
        </div>
      </div>
    );
  }

  const initials = userProfile.initials || userProfile.name?.split(' ').map((n:any) => n[0]).join('').substring(0,2).toUpperCase() || '??';

  return (
    <div className="flex-1 bg-white flex flex-col font-inter h-full overflow-hidden">
      {/* Profile Banner & Avatar Section */}
      <div className="relative flex-none">
        <div className="h-32 bg-slate-50 border-b border-slate-100">
          <div className="h-full w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 opacity-90 animate-gradient-slow"></div>
        </div>
        <div className="px-10 -mt-12 relative z-10 flex items-end justify-between pb-6 border-b border-slate-100">
          <div className="flex items-end space-x-8">
            <div className="w-32 h-32 bg-white border-4 border-white shadow-xl flex items-center justify-center rounded-full overflow-hidden">
              <div className="w-full h-full bg-slate-900 flex items-center justify-center rounded-full">
                <span className="text-white text-4xl font-black tracking-tighter">
                  {initials}
                </span>
              </div>
            </div>
            <div className="pb-2">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
                  {userProfile.name}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">
                  {userProfile.professionalInfo?.role || userProfile.title}
                </span>
                <div className="w-1 h-1 bg-slate-300"></div>
                <span className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">
                  {userProfile.professionalInfo?.department || userProfile.department}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT SIDEBAR NAVIGATION */}
        <div className="w-72 flex-none border-r border-slate-100 bg-slate-50/50 flex flex-col p-6">
          <div className="mb-8">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-4">Navigation</h3>
            <nav className="space-y-1">
              {profileTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 transition-all group rounded-none border ${
                      isActive 
                        ? 'bg-white border-slate-200 text-blue-600 shadow-sm' 
                        : 'bg-transparent border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {tab.id === 'overview' && <User className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />}
                      {tab.id === 'inbox' && <MessageSquare className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />}
                      {tab.id === 'my-teams' && <Users className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />}
                      <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3 h-3 text-blue-600" />}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* RIGHT CONTENT AREA */}
        <div className={`flex-1 bg-white ${activeTab === 'inbox' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {activeTab === 'overview' && (
            <div className="p-10 max-w-6xl mx-auto space-y-12">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Account Identification Card */}
                <div className="lg:col-span-5">
                  <div className="bg-white border border-slate-100 p-10 rounded-none shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-8">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-slate-900" />
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Account Identification</h3>
                      </div>
                      <button 
                        onClick={() => isEditingAccount ? handleAccountSave() : setIsEditingAccount(true)}
                        className={`transition-colors p-2 hover:bg-slate-50 ${isEditingAccount ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-900'}`}
                      >
                        {isEditingAccount ? <Check className="w-5 h-5" /> : <Pencil className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    <div className="space-y-8">
                      {isEditingAccount ? (
                        <div className="space-y-6">
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Legal Name</label>
                            <input 
                              type="text" 
                              value={editFormData.name} 
                              onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-200 p-3 text-sm font-bold focus:outline-none focus:border-blue-600"
                            />
                            {editErrors.name && <p className="text-[9px] text-red-500 font-bold mt-1 uppercase">{editErrors.name}</p>}
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Username</label>
                            <input 
                              type="text" 
                              value={editFormData.username} 
                              onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-200 p-3 text-sm font-bold focus:outline-none focus:border-blue-600"
                            />
                            {editErrors.username && <p className="text-[9px] text-red-500 font-bold mt-1 uppercase">{editErrors.username}</p>}
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Academic / Job Title</label>
                            <input 
                              type="text" 
                              value={editFormData.title} 
                              onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-200 p-3 text-sm font-bold focus:outline-none focus:border-blue-600"
                            />
                            {editErrors.title && <p className="text-[9px] text-red-500 font-bold mt-1 uppercase">{editErrors.title}</p>}
                          </div>
                          
                          {/* Non-editable field: Date Joined */}
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Date Joined</label>
                            <div className="w-full bg-slate-50/50 border border-slate-100 p-3 text-sm font-bold text-slate-500 cursor-not-allowed">
                              {userProfile.personalInfo?.hireDate ? format(new Date(userProfile.personalInfo.hireDate), 'MM/dd/yyyy') : 'N/A'}
                            </div>
                          </div>

                          {/* Non-editable field: Transmission Address */}
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Transmission Address (Email)</label>
                            <div className="w-full bg-slate-50/50 border border-slate-100 p-3 text-sm font-bold text-slate-500 cursor-not-allowed truncate">
                              {userProfile.email}
                            </div>
                          </div>

                          <div className="flex space-x-2 pt-4 border-t border-slate-50">
                            <button 
                              onClick={handleAccountSave}
                              className="flex-1 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors"
                            >
                              Update Profile
                            </button>
                            <button 
                              onClick={() => { setIsEditingAccount(false); setEditErrors({}); }}
                              className="px-6 py-3 border border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Legal Name</p>
                            <p className="text-xl font-black text-slate-900 tracking-tight">{userProfile.name}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Username</p>
                            <p className="text-sm font-black text-slate-800 tracking-tight">{userProfile.username}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Academic / Job Title</p>
                            <p className="text-sm font-black text-slate-800 tracking-tight">{userProfile.professionalInfo?.role || userProfile.title}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date Joined</p>
                            <div className="flex items-center space-x-2 text-slate-900">
                              <Clock className="w-4 h-4 text-slate-400" />
                              <p className="text-sm font-black tracking-tight">
                                {userProfile.personalInfo?.hireDate ? format(new Date(userProfile.personalInfo.hireDate), 'MMMM yyyy') : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transmission Address (Email)</p>
                            <div className="flex items-center space-x-2 text-slate-900">
                              <Mail className="w-4 h-4 text-slate-400" />
                              <p className="text-sm font-black tracking-tight truncate">{userProfile.email}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Group Announcements */}
                <div className="lg:col-span-7 space-y-10">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                    <h2 className="text-2xl font-black tracking-tighter text-slate-900">Group Announcements</h2>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Feed</span>
                  </div>
                  
                  <div className="space-y-6">
                    {feedMessages.length > 0 ? feedMessages.map((message) => (
                      <div key={message.id} className={`bg-white border border-slate-100 p-8 hover:shadow-md transition-all rounded-none ${message.priority === 'urgent' ? 'border-l-4 border-l-red-600' : 'border-l-4 border-l-slate-900'}`}>
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight">{message.subject}</h3>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0 ml-4">{format(new Date(message.createdAt), 'MMM dd, yyyy')}</span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed mb-6">
                          {message.content}
                        </p>
                        <div className="pt-6 border-t border-slate-50 flex items-center space-x-3">
                          <div className="w-8 h-8 bg-slate-900 flex items-center justify-center text-[10px] font-black text-white rounded-full">
                            {message.fromInitials}
                          </div>
                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{message.fromName}</span>
                        </div>
                      </div>
                    )) : (
                      <div className="py-20 text-center bg-slate-50 border border-dashed border-slate-200">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">No active announcements</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'my-teams' && (
            <div className="p-10 max-w-5xl mx-auto space-y-10">
              <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                <div>
                  <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">My Research Teams</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Teams you are currently affiliated with</p>
                </div>
                <div className="flex items-center space-x-2">
                   <div className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
                     {myTeams.length} Active
                   </div>
                </div>
              </div>

              {loadingTeams ? (
                <div className="py-20 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-slate-900 border-t-transparent animate-spin mb-3"></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Querying Team Registry...</p>
                </div>
              ) : myTeams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myTeams.map(team => (
                    <div key={team.id} className="bg-white border border-slate-100 p-8 hover:shadow-lg transition-all relative group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                          <Users className="w-6 h-6 text-slate-900" />
                        </div>
                        {team.isOwner ? (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest">Team Owner</span>
                        ) : (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[9px] font-black uppercase tracking-widest">Member</span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">{team.name}</h3>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 line-clamp-2">{team.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-6">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Enrolled On</p>
                          <p className="text-xs font-bold text-slate-900">{format(team.joinedDate, 'MMM yyyy')}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Members</p>
                          <p className="text-xs font-bold text-slate-900">{team.memberCount} Staff</p>
                        </div>
                      </div>

                      {!team.isOwner && (
                        <button 
                          onClick={() => handleLeaveTeam(team)}
                          className="w-full mt-8 py-3 border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-colors flex items-center justify-center space-x-2"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Leave Team</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-24 text-center bg-slate-50/50 border border-dashed border-slate-200">
                  <Users className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">You are not enrolled in any teams</p>
                  <button 
                    onClick={() => navigate('/team-members')}
                    className="mt-6 px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black"
                  >
                    Browse Teams
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'inbox' && (
            <div className="h-full flex flex-col overflow-hidden bg-white border-t border-slate-100">
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                
                {/* Inbox Sidebar */}
                <div className="lg:col-span-4 border-r border-slate-100 flex flex-col bg-white overflow-hidden">
                  <div className="p-6 flex-none bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest">Communications</h3>
                    <button 
                      onClick={() => setShowNewChatSearch(!showNewChatSearch)}
                      className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center hover:bg-black transition-colors"
                    >
                      {showNewChatSearch ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  
                  <div className="p-4 flex-none border-b border-slate-50">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        value={chatSearchQuery}
                        onChange={(e) => setChatSearchQuery(e.target.value)}
                        placeholder={showNewChatSearch ? "SEARCH TEAM MEMBERS..." : "SEARCH DATA STREAM..."}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto scrollbar-hide">
                    <AnimatePresence>
                      {showNewChatSearch ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-2">
                          {allMembers
                            .filter(m => String(m.id) !== String(userProfile.id))
                            .filter(m => m.name.toLowerCase().includes(chatSearchQuery.toLowerCase()) || m.email?.toLowerCase().includes(chatSearchQuery.toLowerCase()))
                            .map(member => (
                              <button key={member.id} onClick={() => startNewConversation(member)} className="w-full flex items-center space-x-3 p-3 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                <div className="w-8 h-8 bg-slate-900 text-white text-[9px] font-black flex items-center justify-center rounded-full">
                                  {member.initials}
                                </div>
                                <div className="text-left">
                                  <p className="text-[10px] font-black uppercase tracking-widest">{member.name}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{member.title}</p>
                                </div>
                              </button>
                            ))
                          }
                        </motion.div>
                      ) : (
                        <div className="divide-y divide-slate-50">
                          {/* Group messages by conversation partner using inboxMessages */}
                          {(() => {
                            const myId = String(userProfile.id);
                            // Identify all unique partners involved in messages
                            const partners = new Set<string>();
                            
                            inboxMessages.forEach(m => {
                              const senderId = String(m.originalSenderId || m.sender.id);
                              const recipientId = String(m.recipientId);
                              
                              if (senderId === myId) partners.add(recipientId);
                              else partners.add(senderId);
                            });

                            return Array.from(partners).map(otherPartyId => {
                              // Filter messages for this specific conversation from the cached inbox list
                              // In backend mode, this might just be 1 item (latest) per partner
                              const threadMessages = inboxMessages.filter(m => {
                                const senderId = String(m.originalSenderId || m.sender.id);
                                const recipientId = String(m.recipientId);
                                return (senderId === myId && recipientId === otherPartyId) ||
                                       (senderId === otherPartyId && recipientId === myId);
                              });

                              if (threadMessages.length === 0) return null;

                              // Sort to find the last message
                              const lastMsg = threadMessages.sort((a,b) => parseMessageDate(b.timestamp).getTime() - parseMessageDate(a.timestamp).getTime())[0];
                              
                              // Check if there are unread messages directed to me in this conversation
                              const hasUnread = threadMessages.some(m => !m.isRead && String(m.recipientId) === myId);

                              // Identify the other user object for display
                              const otherPartyUser = allMembers.find(u => String(u.id) === String(otherPartyId));
                              
                              // If filtered by search
                              if (chatSearchQuery && !otherPartyUser?.name.toLowerCase().includes(chatSearchQuery.toLowerCase())) {
                                return null;
                              }

                              const isActive = String(selectedConversation) === String(otherPartyId);
                              const isMe = String(lastMsg.originalSenderId || lastMsg.sender.id) === myId;

                              return (
                                <div key={otherPartyId} onClick={() => setSelectedConversation(otherPartyId)} className={`p-6 cursor-pointer transition-all border-l-4 ${isActive ? 'bg-slate-50 border-blue-600' : 'hover:bg-slate-50/50 border-transparent'}`}>
                                  <div className="flex items-center space-x-4">
                                    <div className={`w-10 h-10 flex items-center justify-center text-[10px] font-black rounded-full relative ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                                      {otherPartyUser?.initials || '??'}
                                      {/* Unread Indicator */}
                                      {hasUnread && (
                                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-start mb-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest truncate">{otherPartyUser?.name || 'Researcher'}</p>
                                        <span className="text-[9px] font-bold text-slate-400">{format(parseMessageDate(lastMsg.timestamp), 'HH:mm')}</span>
                                      </div>
                                      <p className={`text-xs truncate leading-relaxed ${hasUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-500'}`}>
                                        {isMe ? 'TX: ' : 'RX: '}{lastMsg.content}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Message View Area */}
                <div className="lg:col-span-8 flex flex-col h-full bg-white overflow-hidden">
                  {selectedConversation ? (
                    <div className="flex flex-col h-full">
                      {/* Fixed Chat Header */}
                      <div className="p-6 flex-none border-b border-slate-100 flex items-center justify-between bg-white z-10">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-slate-900 text-white flex items-center justify-center font-black text-[10px] rounded-full">
                            {allMembers.find(u => String(u.id) === String(selectedConversation))?.initials || '??'}
                          </div>
                          <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">
                              {allMembers.find(u => String(u.id) === String(selectedConversation))?.name || 'Researcher'}
                            </h3>
                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center">
                              <span className="w-1 h-1 bg-emerald-500 mr-2"></span> Direct Secure Tunnel
                            </p>
                          </div>
                        </div>
                        {loadingConversation && (
                          <div className="flex items-center space-x-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent animate-spin rounded-full"></div>
                            <span>Syncing...</span>
                          </div>
                        )}
                      </div>

                      {/* Scrollable Message History Area */}
                      <div className="flex-1 p-8 overflow-y-auto space-y-8 bg-slate-50/20">
                        {[...conversationMessages]
                          .sort((a, b) => parseMessageDate(a.timestamp).getTime() - parseMessageDate(b.timestamp).getTime())
                          .map((message) => {
                            // Check ownership using originalSenderId
                            const isMe = String(message.originalSenderId || message.sender.id) === String(userProfile.id);
                            return (
                              <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className="max-w-[70%] space-y-2">
                                  <div className={`p-5 relative border shadow-sm ${isMe ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                                    <p className="text-xs leading-relaxed font-medium">{message.content}</p>
                                  </div>
                                  <p className={`text-[9px] font-black uppercase tracking-widest ${isMe ? 'text-right text-slate-400' : 'text-left text-slate-400'}`}>
                                    {format(parseMessageDate(message.timestamp), 'HH:mm • MMM dd')}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                          {conversationMessages.length === 0 && !loadingConversation && (
                             <div className="text-center py-20">
                               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No messages yet. Start a secure transmission.</p>
                             </div>
                          )}
                      </div>

                      {/* Fixed Chat Input Footer */}
                      <div className="p-6 flex-none bg-white border-t border-slate-100">
                        <div className="flex items-center space-x-3">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={`Send a message to ${allMembers.find(u => String(u.id) === String(selectedConversation))?.name || 'user'}...`}
                            className="flex-1 px-5 py-4 bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white text-xs font-bold"
                            onKeyPress={(e) => e.key === 'Enter' && transmitMessage()}
                          />
                          <button
                            onClick={transmitMessage}
                            disabled={sendingMessage}
                            className="w-14 h-14 flex-none bg-slate-900 text-white flex items-center justify-center hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-center p-20 bg-slate-50/30">
                      <div className="max-w-xs">
                        <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-6" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Terminal Standby</h3>
                        <p className="text-[11px] text-slate-400 font-bold uppercase leading-relaxed">
                          Select a research collaborator from the communication stream to begin secure data transmission.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showSaveConfirmationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowSaveConfirmationModal(false)}/>
            <div className="relative bg-white shadow-2xl w-full max-w-sm p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-6" />
              <h2 className="text-xl font-black uppercase tracking-tight mb-4 text-slate-900">Authorize Changes</h2>
              <p className="text-sm text-slate-600 mb-8 font-medium leading-relaxed">Are you certain you wish to update your research credentials? This action will be logged in the system audit trail and mapped to your digital identity.</p>
              <div className="flex space-x-3">
                <button onClick={() => setShowSaveConfirmationModal(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-900 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">Cancel</button>
                <button onClick={executeSave} className="flex-1 px-4 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-md">Confirm Update</button>
              </div>
            </div>
          </div>
        )}

        {showLeaveTeamModal && teamToLeave && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowLeaveTeamModal(false)}/>
            <div className="relative bg-white shadow-2xl w-full max-w-sm p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-6" />
              <h2 className="text-xl font-black uppercase tracking-tight mb-4 text-slate-900">Leave Team</h2>
              <p className="text-sm text-slate-600 mb-8 font-medium leading-relaxed">
                Are you sure you want to leave <strong>{teamToLeave.name}</strong>? You will lose access to team projects, messages, and the calendar.
              </p>
              <div className="flex space-x-3">
                <button onClick={() => setShowLeaveTeamModal(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-900 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">Stay</button>
                <button onClick={executeLeaveTeam} className="flex-1 px-4 py-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors shadow-md">Leave Team</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}