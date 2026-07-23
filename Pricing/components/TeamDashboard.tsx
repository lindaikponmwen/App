import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Users, UserPlus, Shield, Mail, Trash2, Edit3, CheckCircle, XCircle, Copy, Check, X, AlertTriangle, Info, ShieldAlert, Plus } from 'lucide-react';
import { Modal } from './Modal';

interface TeamMember {
  id: number;
  email: string;
  name: string;
  team_role: 'owner' | 'admin' | 'member';
  created_at: string;
}

interface TeamInvite {
  id: number;
  email: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  token: string;
}

interface TeamData {
  id: number;
  name: string;
  role: 'owner' | 'admin' | 'member';
  total_seats: number;
  used_seats: number;
  is_over_limit: boolean;
  isOwner: boolean;
  owner_name: string | null;
  status: 'active' | 'past_due' | 'canceling' | 'canceled' | 'over_limit' | 'transferred';
  cancel_at_period_end: boolean;
  subscription_ends_at: string | null;
  recently_canceled: boolean;
}

interface TransferRequest {
  id: number;
  team_id: number;
  old_owner_id: number;
  new_owner_id: number;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  new_owner_email: string;
}

export const TeamDashboard: React.FC<{ user: any, refreshUser: () => void }> = ({ user, refreshUser }) => {
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmails, setInviteEmails] = useState<string[]>(['']);
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<{ email: string, url: string }[] | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [pendingInvite, setPendingInvite] = useState<{ token: string, teamName: string, teamCancelAtPeriodEnd: boolean } | null>(null);
  const [transferRequest, setTransferRequest] = useState<TransferRequest | null>(null);
  const [isAcceptTransferModalOpen, setIsAcceptTransferModalOpen] = useState(false);
  const [transferToken, setTransferToken] = useState<string | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);

  // Unified Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionLabel: string;
    actionStyle: 'blue' | 'red' | 'black';
    onAction: () => void;
    type: 'success' | 'error' | 'warning' | 'info';
    secondaryLabel?: string;
    secondaryAction?: () => void;
    preventAutoClose?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionLabel: '',
    actionStyle: 'blue',
    onAction: () => {},
    type: 'info',
    preventAutoClose: false
  });

  const [searchParams] = useSearchParams();
  const joinToken = searchParams.get('token');
  const navigate = useNavigate();

  const fetchTeamData = async () => {
    try {
      const response = await fetch('php/get_team_data.php');
      const data = await response.json();
      if (data.hasTeam) {
        setTeamData(data.team);
        setMembers(data.members);
        setInvites(data.invites);
        setTransferRequest(data.transferRequest);
        setNewName(data.team.name);
        setPendingInvite(null);
      } else {
        setTeamData(null);
        setPendingInvite(data.pendingInvite || null);
      }
    } catch (err) {
      setError('Failed to load team data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (joinToken) {
      handleJoinTeam(joinToken);
    } else {
      fetchTeamData();
    }
  }, [joinToken]);

  const showModal = (config: {
    title: string;
    message: string;
    actionLabel: string;
    actionStyle: 'blue' | 'red' | 'black';
    onAction: () => void;
    type?: 'success' | 'error' | 'warning' | 'info';
    secondaryLabel?: string;
    secondaryAction?: () => void;
    preventAutoClose?: boolean;
  }) => {
    setModalConfig({
      ...config,
      isOpen: true,
      type: config.type || 'info',
      preventAutoClose: config.preventAutoClose || false
    });
  };

  const handleJoinTeam = async (token: string, mode: 'manual' | 'immediate' = 'immediate') => {
    setLoading(true);
    try {
      const response = await fetch('php/join_team.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, mode })
      });
      const data = await response.json();
      if (data.success) {
        setLoading(false);
        showModal({
          title: 'Welcome to the Team!',
          message: `You have successfully joined ${data.teamName || 'the team'}.`,
          actionLabel: 'Get Started',
          actionStyle: 'blue',
          type: 'success',
          secondaryLabel: 'none',
          onAction: () => {
            navigate('/team', { replace: true });
            fetchTeamData();
            refreshUser();
          }
        });
      } else {
        showModal({
          title: 'Error Joining Team',
          message: data.error || 'Failed to join team.',
          actionLabel: 'Close',
          actionStyle: 'red',
          type: 'error',
          onAction: () => {}
        });
        setLoading(false);
      }
    } catch (err) {
      showModal({
        title: 'Error',
        message: 'An error occurred while joining the team.',
        actionLabel: 'Close',
        actionStyle: 'red',
        type: 'error',
        onAction: () => {}
      });
      setLoading(false);
    }
  };

  const handleInvite = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const validEmails = inviteEmails.filter(email => email.trim() !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    
    if (validEmails.length === 0) {
      showModal({
        title: 'Invalid Emails',
        message: 'Please provide at least one valid email address.',
        actionLabel: 'Close',
        actionStyle: 'black',
        type: 'warning',
        onAction: () => {}
      });
      return;
    }

    setInviting(true);
    setInviteSuccess(null);
    try {
      const response = await fetch('php/invite_member.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: validEmails })
      });
      const data = await response.json();
      if (data.success) {
        setInviteSuccess(data.invites);
        setInviteEmails(['']);
        fetchTeamData();
        refreshUser();
      } else {
        showModal({
          title: 'Invite Failed',
          message: data.error,
          actionLabel: 'Close',
          actionStyle: 'red',
          type: 'error',
          secondaryLabel: 'none',
          onAction: () => {}
        });
      }
    } catch (err) {
      showModal({
        title: 'Error',
        message: 'Failed to send invitations.',
        actionLabel: 'Close',
        actionStyle: 'red',
        type: 'error',
        onAction: () => {}
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRename = async () => {
    if (!newName.trim() || newName === teamData?.name) {
      setIsRenaming(false);
      return;
    }
    try {
      const response = await fetch('php/update_team_name.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      const data = await response.json();
      if (data.success) {
        setTeamData(prev => prev ? { ...prev, name: newName } : null);
        setIsRenaming(false);
        refreshUser();
      } else {
        showModal({
          title: 'Update Failed',
          message: data.error,
          actionLabel: 'Close',
          actionStyle: 'red',
          type: 'error',
          onAction: () => {}
        });
      }
    } catch (err) {
      showModal({
        title: 'Error',
        message: 'Failed to update team name.',
        actionLabel: 'Close',
        actionStyle: 'red',
        type: 'error',
        onAction: () => {}
      });
    }
  };

  const handleRemoveMember = async (targetUserId: number | number[]) => {
    const isBulk = Array.isArray(targetUserId);
    const userIds = isBulk ? targetUserId : [targetUserId];

    try {
      const response = await fetch('php/remove_member.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds })
      });
      const data = await response.json();
      if (data.success) {
        if (!isBulk && targetUserId === user.id) {
          showModal({
            title: 'Left Team',
            message: 'You have successfully left the team.',
            actionLabel: 'OK',
            actionStyle: 'blue',
            type: 'success',
            onAction: () => window.location.reload()
          });
        } else {
          showModal({
            title: isBulk ? 'Members Removed' : 'Member Removed',
            message: isBulk ? 'Selected members have been removed.' : 'Member has been removed.',
            actionLabel: 'Done',
            actionStyle: 'blue',
            type: 'success',
            onAction: () => {
              setSelectedMemberIds([]);
              fetchTeamData();
              refreshUser();
            }
          });
        }
      } else {
        showModal({
          title: 'Removal Failed',
          message: data.error,
          actionLabel: 'Close',
          actionStyle: 'red',
          type: 'error',
          onAction: () => {}
        });
      }
    } catch (err) {
      showModal({
        title: 'Error',
        message: 'An error occurred.',
        actionLabel: 'Close',
        actionStyle: 'red',
        type: 'error',
        onAction: () => {}
      });
    }
  };

  const handleRemoveAll = async () => {
    const memberIds = members
      .filter(m => m.team_role !== 'owner')
      .map(m => m.id);
    
    if (memberIds.length === 0) return;
    handleRemoveMember(memberIds);
  };

  const handleUpdateRole = async (targetUserId: number, newRole: string) => {
    try {
      const response = await fetch('php/update_member_role.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, role: newRole })
      });
      const data = await response.json();
      if (data.success) {
        fetchTeamData();
        refreshUser();
      } else {
        showModal({
          title: 'Update Failed',
          message: data.error,
          actionLabel: 'Close',
          actionStyle: 'red',
          type: 'error',
          onAction: () => {}
        });
      }
    } catch (err) {
      showModal({
        title: 'Error',
        message: 'An error occurred.',
        actionLabel: 'Close',
        actionStyle: 'red',
        type: 'error',
        onAction: () => {}
      });
    }
  };

  const handleTransferOwnership = async (targetUserId: number) => {
    try {
      const response = await fetch('php/transfer_ownership_request.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOwnerId: targetUserId })
      });
      const data = await response.json();
      if (data.success) {
        fetchTeamData();
        refreshUser();
        showModal({
          title: 'Transfer Requested',
          message: data.message,
          actionLabel: 'Done',
          actionStyle: 'blue',
          type: 'info',
          onAction: () => {}
        });
      } else {
        showModal({
          title: 'Transfer Failed',
          message: data.error,
          actionLabel: 'Close',
          actionStyle: 'red',
          type: 'error',
          onAction: () => {}
        });
      }
    } catch (err) {
      showModal({
        title: 'Error',
        message: 'An error occurred.',
        actionLabel: 'Close',
        actionStyle: 'red',
        type: 'error',
        onAction: () => {}
      });
    }
  };

  const handleAcceptTransfer = async (token: string) => {
    try {
      const response = await fetch('php/transfer_ownership_accept.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await response.json();
      if (data.success) {
        fetchTeamData();
        refreshUser();
        showModal({
          title: 'Ownership Accepted',
          message: data.message,
          actionLabel: 'OK',
          actionStyle: 'blue',
          type: 'success',
          onAction: () => {}
        });
      } else {
        showModal({
          title: 'Acceptance Failed',
          message: data.error,
          actionLabel: 'Close',
          actionStyle: 'red',
          type: 'error',
          onAction: () => {}
        });
      }
    } catch (err) {
      showModal({
        title: 'Error',
        message: 'An error occurred.',
        actionLabel: 'Close',
        actionStyle: 'red',
        type: 'error',
        onAction: () => {}
      });
    }
  };

  const handleCancelInvite = async (inviteId: number) => {
    try {
      const response = await fetch('php/cancel_invite.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId })
      });
      const data = await response.json();
      if (data.success) {
        fetchTeamData();
        refreshUser();
      } else {
        showModal({
          title: 'Error',
          message: data.error,
          actionLabel: 'Close',
          actionStyle: 'red',
          type: 'error',
          onAction: () => {}
        });
      }
    } catch (err) {
      showModal({
        title: 'Error',
        message: 'An error occurred.',
        actionLabel: 'Close',
        actionStyle: 'red',
        type: 'error',
        onAction: () => {}
      });
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const response = await fetch('php/cancel_team_subscription.php', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        fetchTeamData();
        refreshUser();
        showModal({
          title: 'Subscription Canceled',
          message: data.message,
          actionLabel: 'Done',
          actionStyle: 'blue',
          type: 'success',
          onAction: () => {}
        });
      } else {
        showModal({
          title: 'Error',
          message: data.error,
          actionLabel: 'Close',
          actionStyle: 'red',
          type: 'error',
          onAction: () => {}
        });
      }
    } catch (err) {
      showModal({
        title: 'Error',
        message: 'Failed to cancel subscription.',
        actionLabel: 'Close',
        actionStyle: 'red',
        type: 'error',
        onAction: () => {}
      });
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      const response = await fetch('php/reactivate_team_subscription.php', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        fetchTeamData();
        refreshUser();
        showModal({
          title: 'Subscription Reactivated',
          message: data.message,
          actionLabel: 'Done',
          actionStyle: 'blue',
          type: 'success',
          onAction: () => {}
        });
      } else {
        showModal({
          title: 'Error',
          message: data.error,
          actionLabel: 'Close',
          actionStyle: 'red',
          type: 'error',
          onAction: () => {}
        });
      }
    } catch (err) {
      showModal({
        title: 'Error',
        message: 'Failed to reactivate subscription.',
        actionLabel: 'Close',
        actionStyle: 'red',
        type: 'error',
        onAction: () => {}
      });
    }
  };

  const handlePortalRedirect = async () => {
    setBillingLoading(true);
    try {
      const response = await fetch('php/create_portal_session.php', { method: 'POST' });
      const data = await response.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        showModal({
          title: 'Error',
          message: data.error || 'Could not open billing portal.',
          actionLabel: 'Close',
          actionStyle: 'red',
          type: 'error',
          onAction: () => {}
        });
      }
    } catch (error) {
      showModal({
        title: 'Error',
        message: 'Failed to connect to billing portal.',
        actionLabel: 'Close',
        actionStyle: 'red',
        type: 'error',
        onAction: () => {}
      });
    } finally {
      setBillingLoading(false);
    }
  };

  const handleTeamUpgrade = async () => {
    setBillingLoading(true);
    try {
      const response = await fetch('php/start_team_upgrade.php', { method: 'POST' });
      const data = await response.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        showModal({
          title: 'Error',
          message: data.error || 'Failed to start team upgrade.',
          actionLabel: 'Close',
          actionStyle: 'red',
          type: 'error',
          onAction: () => {}
        });
      }
    } catch (error: any) {
      showModal({
        title: 'Error',
        message: 'Checkout initiation failed: ' + error.message,
        actionLabel: 'Close',
        actionStyle: 'red',
        type: 'error',
        onAction: () => {}
      });
    } finally {
      setBillingLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    try {
      const response = await fetch('php/delete_team.php', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        refreshUser();
        showModal({
          title: 'Team Deleted',
          message: 'The team has been successfully deleted.',
          actionLabel: 'OK',
          actionStyle: 'blue',
          type: 'success',
          onAction: () => window.location.reload()
        });
      } else {
        showModal({
          title: 'Error',
          message: data.error,
          actionLabel: 'Close',
          actionStyle: 'red',
          type: 'error',
          onAction: () => {}
        });
      }
    } catch (err) {
      showModal({
        title: 'Error',
        message: 'An error occurred while deleting the team.',
        actionLabel: 'Close',
        actionStyle: 'red',
        type: 'error',
        onAction: () => {}
      });
    }
  };

  const handleCancelTransfer = async (token: string) => {
    try {
      const response = await fetch('php/transfer_ownership_cancel.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await response.json();
      if (data.success) {
        fetchTeamData();
        refreshUser();
      } else {
        showModal({
          title: 'Error',
          message: data.error,
          actionLabel: 'Close',
          actionStyle: 'red',
          type: 'error',
          onAction: () => {}
        });
      }
    } catch (err) {
      showModal({
        title: 'Error',
        message: 'An error occurred.',
        actionLabel: 'Close',
        actionStyle: 'red',
        type: 'error',
        onAction: () => {}
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  const isOwner = teamData?.isOwner;
  const isAdmin = teamData?.role === 'admin';
  const isOwnerOrAdmin = isOwner || isAdmin;

  const endsAt = teamData?.subscription_ends_at ? new Date(teamData.subscription_ends_at) : null;
  const now = new Date();
  const isGracePeriod = teamData ? (
    (teamData.status === 'transferred' || teamData.status === 'canceling') && endsAt && endsAt > now
  ) : false;

  const toggleMemberSelection = (memberId: number) => {
    setSelectedMemberIds(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId) 
        : [...prev, memberId]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-white p-12 rounded-sm border border-gray-200 shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8" />
            </div>
            {pendingInvite ? (
              <>
                <h1 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Invitation Pending</h1>
                <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
                  You have been invited to join <span className="font-bold text-slate-900">"{pendingInvite.teamName}"</span>. Accept the invitation to access team features and collaborate with others.
                </p>
                <button 
                  onClick={() => {
                    if (user && user.plan === 'pro') {
                      if (user.subscription_status === 'past_due') {
                        showModal({
                          title: 'Outstanding Payment Detected',
                          message: 'We noticed your individual Pro subscription has an outstanding payment. By joining this team, your Pro subscription will be canceled immediately.',
                          actionLabel: 'Confirm & Join Team',
                          actionStyle: 'red',
                          type: 'warning',
                          secondaryLabel: 'Cancel',
                          onAction: () => handleJoinTeam(pendingInvite.token, 'immediate')
                        });
                      } else if (user.cancel_at_period_end) {
                        showModal({
                          title: 'Active Pro Subscription (Grace Period)',
                          message: 'You have an active Pro subscription currently in its grace period. Joining this team will immediately terminate your remaining grace period access.',
                          actionLabel: 'Join team',
                          actionStyle: 'red',
                          type: 'warning',
                          secondaryLabel: 'Cancel',
                          onAction: () => handleJoinTeam(pendingInvite.token, 'immediate')
                        });
                      } else {
                        showModal({
                          title: 'Active Pro Subscription',
                          message: 'You have an active Pro subscription. Joining this team will terminate your current subscription.',
                          actionLabel: 'Join team',
                          actionStyle: 'red',
                          type: 'warning',
                          secondaryLabel: 'Manage my subscription',
                          secondaryAction: () => handlePortalRedirect(),
                          onAction: () => setTimeout(() => showModal({
                            title: 'Are you sure?',
                            message: 'Joining this team will immediately terminate your Pro subscription. You will lose access to any remaining days on your current plan.',
                            actionLabel: 'Join team Anyway',
                            actionStyle: 'red',
                            type: 'warning',
                            secondaryLabel: 'Cancel',
                            onAction: () => handleJoinTeam(pendingInvite.token, 'immediate')
                          }), 100),
                          preventAutoClose: true
                        });
                      }
                    } else {
                      showModal({
                        title: 'Join Team?',
                        message: `Do you want to join ${pendingInvite.teamName}?`,
                        actionLabel: 'Accept Invitation',
                        actionStyle: 'blue',
                        onAction: () => handleJoinTeam(pendingInvite.token, 'immediate')
                      });
                    }
                  }}
                  className="px-8 py-4 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors"
                >
                  Accept Invitation
                </button>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">No Active Team</h1>
                <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
                  Collaboration features are exclusive to the Team Plan.
                </p>
                <Link to="/" className="inline-block px-8 py-4 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors">
                  View Pricing
                </Link>
              </>
            )}
          </div>
        </div>
        
        {/* Unified Modal System */}
        <Modal 
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
          title={modalConfig.title}
          message={modalConfig.message}
          actionLabel={modalConfig.actionLabel}
          onAction={modalConfig.onAction}
          actionStyle={modalConfig.actionStyle}
          type={modalConfig.type}
          secondaryLabel={modalConfig.secondaryLabel}
          secondaryAction={modalConfig.secondaryAction}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {isGracePeriod && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-sm flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-800 uppercase tracking-widest">PENDING CANCELLATION</h3>
              <p className="text-xs mt-1 text-amber-700 font-medium italic">
                Your subscription is scheduled to end on {formatDate(teamData?.subscription_ends_at)}.
              </p>
            </div>
          </div>
        )}
        {transferRequest && transferRequest.status === 'pending' && transferRequest.old_owner_id === user.id && (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-sm flex items-start space-x-3">
            <Info className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-yellow-800 uppercase tracking-widest">Ownership Transfer Pending</h3>
              <p className="text-xs mt-1 text-yellow-700 font-medium">
                An ownership transfer request has been sent to {transferRequest.new_owner_email}.
              </p>
              <button 
                onClick={() => showModal({
                  title: 'Cancel Transfer?',
                  message: 'Are you sure you want to cancel the pending ownership transfer request?',
                  actionLabel: 'Cancel Request',
                  actionStyle: 'red',
                  type: 'warning',
                  onAction: () => handleCancelTransfer(transferRequest.token)
                })}
                className="mt-3 px-4 py-2 bg-red-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
              >
                Cancel Request
              </button>
            </div>
          </div>
        )}
        {transferRequest && transferRequest.status === 'pending' && transferRequest.new_owner_id === user.id && (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-sm flex items-start space-x-3">
            <Info className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-yellow-800 uppercase tracking-widest">Ownership Transfer Requested</h3>
              <p className="text-xs mt-1 text-yellow-700 font-medium">
                You have been requested to become the new owner of this team.
              </p>
              <button 
                onClick={() => showModal({
                  title: 'Accept Ownership?',
                  message: 'Are you sure you want to accept ownership of this team?',
                  actionLabel: 'Accept',
                  actionStyle: 'blue',
                  type: 'warning',
                  onAction: () => handleAcceptTransfer(transferRequest.token)
                })}
                className="mt-3 px-4 py-2 bg-yellow-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-yellow-700 transition-colors"
              >
                Accept Ownership
              </button>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-sm flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                {isRenaming ? (
                  <input 
                    type="text" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)}
                    className="text-2xl font-bold text-slate-900 border-b-2 border-blue-600 bg-transparent focus:outline-none"
                    autoFocus
                    onBlur={handleRename}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                  />
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{teamData.name}</h1>
                    {isOwnerOrAdmin && (
                      <button onClick={() => setIsRenaming(true)} className="text-gray-400 hover:text-blue-600 transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
              <p className="text-gray-500 text-sm">Management Console</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center space-y-4 md:space-y-0 md:space-x-4">
            {isOwnerOrAdmin && selectedMemberIds.length > 0 && (
              <button 
                onClick={() => showModal({
                  title: `Remove ${selectedMemberIds.length} Members?`,
                  message: 'Are you sure you want to remove the selected members?',
                  actionLabel: 'Remove Selected',
                  actionStyle: 'red',
                  type: 'warning',
                  onAction: () => handleRemoveMember(selectedMemberIds)
                })}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition-colors border border-red-100 w-full md:w-auto"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove Selected ({selectedMemberIds.length})</span>
              </button>
            )}

            {isOwnerOrAdmin && (
              <button 
                onClick={() => setIsInviteModalOpen(true)}
                disabled={teamData.is_over_limit}
                className={`flex items-center justify-center space-x-2 px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors shadow-lg w-full md:w-auto ${
                  teamData.is_over_limit 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite Members</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Members List */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 md:px-8 py-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50/50 gap-4">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Team Roster</span>
                </h2>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest self-start sm:self-auto ${teamData.used_seats > teamData.total_seats ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                  {teamData.used_seats} / {teamData.total_seats} Seats Used
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      <th className="px-8 py-4 w-12">
                        {isOwnerOrAdmin && (
                          <input 
                            type="checkbox" 
                            checked={selectedMemberIds.length === members.filter(m => m.team_role !== 'owner' && m.id !== user.id).length && members.length > 1}
                            onChange={() => {
                              if (selectedMemberIds.length > 0) setSelectedMemberIds([]);
                              else setSelectedMemberIds(members.filter(m => m.team_role !== 'owner' && m.id !== user.id).map(m => m.id));
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        )}
                      </th>
                      <th className="px-4 py-4">Member</th>
                      <th className="px-4 py-4">Role</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {members.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-4">
                          {isOwnerOrAdmin && member.team_role !== 'owner' && member.id !== user.id && (
                            <input 
                              type="checkbox" 
                              checked={selectedMemberIds.includes(member.id)}
                              onChange={() => toggleMemberSelection(member.id)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                              {(member.name || member.email)[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{member.name || member.email}</p>
                              <p className="text-[10px] text-gray-400 uppercase tracking-widest">Joined {formatDate(member.created_at)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
                            member.team_role === 'owner' ? 'bg-slate-900 text-white' :
                            member.team_role === 'admin' ? 'bg-blue-50 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {member.team_role}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isOwner && member.id !== user.id && (
                              <>
                                <button 
                                  onClick={() => showModal({
                                    title: member.team_role === 'admin' ? 'Demote to Member?' : 'Promote to Admin?',
                                    message: `Are you sure you want to ${member.team_role === 'admin' ? 'demote' : 'promote'} ${member.name || member.email}?`,
                                    actionLabel: member.team_role === 'admin' ? 'Demote' : 'Promote',
                                    actionStyle: 'blue',
                                    type: 'warning',
                                    onAction: () => handleUpdateRole(member.id, member.team_role === 'admin' ? 'member' : 'admin')
                                  })}
                                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                  title={member.team_role === 'admin' ? 'Demote to Member' : 'Promote to Admin'}
                                >
                                  <Shield className="w-4 h-4" />
                                </button>
                                {member.team_role === 'admin' && (
                                  <button 
                                    onClick={() => {
                                      if (['transferred', 'past_due', 'over_limit'].includes(teamData?.status || '')) return;

                                      let message = `Are you sure you want to transfer ownership to ${member.name || member.email}?`;
                                      if (teamData?.status === 'active') {
                                        message = `Are you sure you want to transfer ownership to ${member.name || member.email}? Your subscription will be cancelled. The team will enter a grace period until the billing cycle ends.`;
                                      } else if (teamData?.status === 'canceling') {
                                        message = `Are you sure you want to transfer ownership to ${member.name || member.email}? The team is already cancelling; ownership will transfer and the grace period will continue.`;
                                      } else if (teamData?.status === 'canceled') {
                                        message = `Are you sure you want to transfer ownership to ${member.name || member.email}? The subscription is already cancelled; ownership will transfer in its current state.`;
                                      }

                                      showModal({
                                        title: 'Transfer Ownership?',
                                        message: message,
                                        actionLabel: 'Transfer',
                                        actionStyle: 'black',
                                        type: 'warning',
                                        onAction: () => handleTransferOwnership(member.id)
                                      });
                                    }}
                                    className={`p-2 transition-colors ${!['transferred', 'past_due', 'over_limit'].includes(teamData?.status || '') ? 'text-gray-400 hover:text-slate-900' : 'text-gray-200 cursor-not-allowed'}`}
                                    title={
                                      teamData?.status === 'transferred' ? "Owner must reactivate team billing first." :
                                      teamData?.status === 'past_due' ? "Owner must update team payment method first." :
                                      teamData?.status === 'over_limit' ? "Upgrade your team plan or remove a member first." :
                                      "Transfer Ownership"
                                    }
                                  >
                                    <ShieldAlert className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}
                            {(isOwner || (isAdmin && member.team_role === 'member')) && member.id !== user.id && (
                              <button 
                                onClick={() => showModal({
                                  title: 'Remove Member?',
                                  message: `Are you sure you want to remove ${member.name || member.email} from the team?`,
                                  actionLabel: 'Remove',
                                  actionStyle: 'red',
                                  type: 'warning',
                                  onAction: () => handleRemoveMember(member.id)
                                })}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                title="Remove Member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            {member.id === user.id && member.team_role !== 'owner' && (
                              <button 
                                onClick={() => showModal({
                                  title: 'Leave Team?',
                                  message: 'Are you sure you want to leave this team? You will lose access to all shared resources.',
                                  actionLabel: 'Leave Team',
                                  actionStyle: 'red',
                                  type: 'warning',
                                  onAction: () => handleRemoveMember(user.id)
                                })}
                                className="px-4 py-2 text-red-600 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 transition-colors border border-red-100"
                              >
                                Leave Team
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pending Invitations */}
            {invites.length > 0 && (
              <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 md:px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-amber-500" />
                    <span>Pending Invitations</span>
                  </h2>
                </div>
                <div className="divide-y divide-gray-50 overflow-x-auto">
                  <div className="min-w-[600px]">
                    {invites.map((invite) => (
                      <div key={invite.id} className="px-4 md:px-8 py-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center shrink-0">
                            <Mail className="w-5 h-5 text-amber-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{invite.email}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Sent {formatDate(invite.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => copyToClipboard(`${window.location.origin}/team?token=${invite.token}`)}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
                          >
                            {copiedToken === invite.token ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedToken === invite.token ? 'Copied' : 'Copy Link'}</span>
                          </button>
                          {isOwnerOrAdmin && (
                            <button 
                              onClick={() => showModal({
                                title: 'Cancel Invitation?',
                                message: `Are you sure you want to cancel the invitation for ${invite.email}?`,
                                actionLabel: 'Cancel Invite',
                                actionStyle: 'red',
                                type: 'warning',
                                onAction: () => handleCancelInvite(invite.id)
                              })}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Subscription & Settings */}
          <div className="space-y-8">
            <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Subscription</span>
                </h2>
              </div>
              <div className="p-8">
                {teamData.is_over_limit && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-sm flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-red-800 uppercase tracking-widest">Access Frozen</h3>
                      <p className="text-xs mt-1 text-red-700 font-medium">
                        {teamData.isOwner 
                          ? "Your team is over capacity. Please remove members or upgrade to restore access."
                          : "Your team is over capacity. Please contact your team owner to restore access."
                        }
                      </p>
                    </div>
                  </div>
                )}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Plan</p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-4">
                      <p className="text-2xl font-bold text-slate-900 tracking-tight">Teams</p>
                      {teamData.status === 'active' && !teamData.cancel_at_period_end && !teamData.is_over_limit && (
                        <div className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[9px] font-bold uppercase tracking-widest rounded-sm">
                          Active
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Subscription Status Message */}
                  {teamData.status === 'transferred' && isGracePeriod && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-sm">
                      <p className="text-amber-800 font-black uppercase tracking-widest text-[10px] mb-1">Grace Period</p>
                      <p className="text-amber-700 text-xs font-bold mb-3">
                        {isOwner 
                          ? `Set up team plan by ${formatDate(teamData.subscription_ends_at)}`
                          : `Contact your team owner to set up your team plan by ${formatDate(teamData.subscription_ends_at)}.`
                        }
                      </p>
                    </div>
                  )}
                  {isOwner && teamData.status === 'transferred' && isGracePeriod && (
                    <button 
                      onClick={() => showModal({
                        title: 'Are you sure?',
                        message: 'Setting up a teams plan now will terminate your current grace period access. We suggest making a team plan on the date of grace period end.',
                        actionLabel: 'Proceed',
                        actionStyle: 'blue',
                        type: 'warning',
                        onAction: handleTeamUpgrade
                      })}
                      className="px-3 py-1.5 bg-amber-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-amber-700 transition-colors"
                    >
                      SET UP TEAMS PLAN
                    </button>
                  )}
                  {teamData.status === 'canceling' && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-sm">
                      <p className="text-xs text-amber-800 font-medium">
                        {isOwner 
                          ? `Team subscription is set to cancel on ${formatDate(teamData.subscription_ends_at)}.`
                          : `Your team subscription is set to end on ${formatDate(teamData.subscription_ends_at)}. Please contact your team owner if you wish to keep access.`
                        }
                      </p>
                      {isOwner && (
                        <button 
                          onClick={handlePortalRedirect}
                          className="mt-3 w-full py-2 bg-amber-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-amber-700 transition-colors"
                        >
                          Reactivate Team
                        </button>
                      )}
                    </div>
                  )}
                  {teamData.status === 'past_due' && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-sm">
                      <p className="text-amber-800 font-black uppercase tracking-widest text-[10px] mb-1">PAYMENT FAILED</p>
                      <p className="text-amber-700 text-xs font-bold mb-3">
                        {isOwner 
                          ? "Your last payment was unsuccessful. You still have access, but please update your payment method soon to avoid service interruption for your team."
                          : "Your team's last payment was unsuccessful. You still have access, but please contact your team owner to update their payment method to avoid service interruption."
                        }
                      </p>
                      {isOwner && (
                        <button 
                          onClick={handlePortalRedirect}
                          className="px-3 py-1.5 bg-amber-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-amber-700 transition-colors"
                        >
                          UPDATE PAYMENT
                        </button>
                      )}
                    </div>
                  )}
                  {teamData.status === 'canceled' && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-sm">
                      <p className="text-red-800 font-black uppercase tracking-widest text-[10px] mb-1">Team Subscription Canceled</p>
                      <p className="text-red-700 text-xs font-bold mb-3">
                        {isOwner 
                          ? "The subscription for this team has ended. To restore access to Pro features for everyone, please subscribe to a new Team Plan."
                          : "Your team subscription has ended. Please contact your team owner to restore Pro features."
                        }
                      </p>
                      {isOwner && (
                        <button 
                          onClick={handleTeamUpgrade}
                          className="px-3 py-1.5 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
                        >
                          SUBSCRIBE NOW
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Grace period alert removed as per request */}
                  {teamData.status !== 'transferred' && teamData.status !== 'past_due' && (
                    <>
                      {isOwner && teamData.status !== 'canceling' && teamData.status !== 'canceled' && (
                        <>
                          {teamData.used_seats > teamData.total_seats ? (
                            <button 
                              onClick={handlePortalRedirect}
                              disabled={billingLoading}
                              className="w-full py-4 bg-red-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              {billingLoading ? 'Loading Portal...' : 'Increase Seat Capacity'}
                            </button>
                          ) : (
                            <button 
                              onClick={handlePortalRedirect}
                              disabled={billingLoading}
                              className={`w-full py-4 text-white text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 ${
                                teamData.is_over_limit 
                                  ? 'bg-red-600 hover:bg-red-700' 
                                  : 'bg-slate-900 hover:bg-slate-800'
                              }`}
                            >
                              {billingLoading ? 'Loading Portal...' : (teamData.is_over_limit ? 'Add Seats' : 'Manage Billing')}
                            </button>
                          )}
                        </>
                      )}
                      {!isOwner && (
                        <div className="p-4 bg-gray-50 border border-gray-100 rounded-sm">
                          <p className="text-xs text-gray-500 leading-relaxed">
                            Billing is managed by the team owner. Contact them for subscription changes.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {isOwner && (
              <div className="bg-white rounded-sm border border-red-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-red-50 bg-red-50/30">
                  <h2 className="text-sm font-bold text-red-600 uppercase tracking-widest flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Team Deletion</span>
                  </h2>
                </div>
                <div className="p-8">
                  <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                    Deleting the team will immediately disband all members, cancel your subscription, and permanently remove all team data.
                  </p>
                  <button 
                    onClick={() => showModal({
                      title: 'Delete Team Permanently?',
                      message: 'Are you sure you want to delete this team? This action is permanent and cannot be undone. By proceeding, you will permanently delete your team and all associated data, and immediately cancel your active subscription.',
                      actionLabel: 'Delete Team',
                      actionStyle: 'red',
                      type: 'error',
                      onAction: handleDeleteTeam
                    })}
                    className="w-full py-4 bg-white text-red-600 border border-red-200 text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition-colors"
                  >
                    Delete Team
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-sm shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                      <UserPlus className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight">Invite Members</h2>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                        {teamData.total_seats - teamData.used_seats} Seats Remaining
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setIsInviteModalOpen(false)} className="text-gray-400 hover:text-slate-900 transition-colors">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                {inviteSuccess ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-sm">
                      <p className="text-sm text-emerald-700 font-bold flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Successfully invited {inviteSuccess.length} members!</span>
                      </p>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                      {inviteSuccess.map((inv, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 border border-gray-100 rounded-sm flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 truncate mr-4">{inv.email}</span>
                          <button 
                            onClick={() => copyToClipboard(`${window.location.origin}/team?token=${inv.url}`)}
                            className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-200 text-slate-900 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors shrink-0"
                          >
                            {copiedToken === inv.url ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedToken === inv.url ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => {
                        setIsInviteModalOpen(false);
                        setInviteSuccess(null);
                      }}
                      className="w-full py-4 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleInvite} className="space-y-6">
                    <div className="max-h-80 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                      {inviteEmails.map((email, index) => (
                        <div key={index} className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input 
                            type="email" 
                            value={email}
                            onChange={(e) => {
                              const newEmails = [...inviteEmails];
                              newEmails[index] = e.target.value;
                              setInviteEmails(newEmails);
                            }}
                            placeholder="colleague@company.com"
                            className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                            required
                          />
                          {inviteEmails.length > 1 && (
                            <button 
                              type="button"
                              onClick={() => setInviteEmails(inviteEmails.filter((_, i) => i !== index))}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button 
                      type="button"
                      onClick={() => setInviteEmails([...inviteEmails, ''])}
                      className="flex items-center space-x-2 text-blue-600 text-[10px] font-bold uppercase tracking-widest hover:text-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Another Member</span>
                    </button>

                    <div className="pt-4">
                      <button 
                        type="submit"
                        disabled={inviting}
                        className="w-full py-4 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        {inviting ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            <span>Send {inviteEmails.length} Invitation{inviteEmails.length > 1 ? 's' : ''}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unified Modal System */}
      <Modal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        title={modalConfig.title}
        message={modalConfig.message}
        actionLabel={modalConfig.actionLabel}
        onAction={modalConfig.onAction}
        actionStyle={modalConfig.actionStyle}
        type={modalConfig.type}
        secondaryLabel={modalConfig.secondaryLabel}
        secondaryAction={modalConfig.secondaryAction}
        preventAutoClose={modalConfig.preventAutoClose}
      />
    </div>
  );
};

