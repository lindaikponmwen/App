import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { USE_PHP_BACKEND, STRIPE_PRO_PAYMENT_LINK, STRIPE_TEAM_PAYMENT_LINK } from '../constants';
import { ShieldAlert } from 'lucide-react';
import { Modal } from './Modal';

interface PricingCardProps {
  title: string;
  description: string;
  price: string;
  priceSub?: string;
  features: string[];
  buttonText: string;
  isPopular?: boolean;
  onSelect: () => void;
  loading?: boolean;
  isCurrent?: boolean;
  tooltip?: string;
  hoverMessage?: string;
  buttonStyle?: 'outline' | 'blue' | 'black' | 'red';
  showBillingCycle?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({
  title,
  description,
  price,
  priceSub,
  features,
  buttonText,
  isPopular,
  onSelect,
  loading,
  isCurrent,
  tooltip,
  hoverMessage,
  buttonStyle = 'black',
  showBillingCycle = true
}) => (
  <div className={`relative flex flex-col p-6 md:p-8 bg-white rounded-sm border ${isPopular ? 'border-blue-600 ring-4 ring-blue-600 ring-opacity-10 shadow-2xl scale-100 md:scale-105 z-10' : 'border-gray-100'} transition-all duration-300`}>
    {isPopular && (
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-black px-4 md:px-6 py-1.5 md:py-2 rounded-sm flex items-center space-x-2 uppercase tracking-[0.2em] shadow-lg whitespace-nowrap">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14H11V21L20 10H13Z" /></svg>
        <span>Most Popular</span>
      </div>
    )}
    <div className="mb-6">
      <h3 className={`text-xl md:text-2xl font-black mb-2 tracking-tight ${isPopular ? 'text-blue-600' : 'text-slate-900'}`}>{title}</h3>
      <p className="text-gray-400 text-xs font-medium leading-relaxed">{description}</p>
    </div>
    <div className="mb-8 min-h-[80px]">
      <div className="flex items-baseline">
        <span className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">{price}</span>
        {priceSub && <span className="ml-2 text-gray-400 text-[10px] font-bold uppercase tracking-widest">{priceSub}</span>}
      </div>
      {showBillingCycle && <div className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Billed Monthly</div>}
    </div>
    <div className="flex-grow">
      <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 border-t border-gray-50 pt-6">Everything Included</div>
      <ul className="space-y-4 mb-10">
        {features.map((f, i) => (
          <li key={i} className="flex items-start text-xs font-medium text-slate-600">
            <svg className="w-4 h-4 text-blue-500 mt-0 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
    <div className="relative group w-full mt-auto">
      <button
        onClick={onSelect}
        disabled={loading || isCurrent || !!tooltip}
        className={`w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] border transition-all duration-200 ${
          isCurrent ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-default' :
          !!tooltip ? 'bg-gray-50 text-gray-200 border-gray-100 cursor-not-allowed' :
          buttonStyle === 'outline' ? 'bg-white text-slate-900 border-gray-200 hover:bg-gray-50' :
          buttonStyle === 'blue' ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200' :
          buttonStyle === 'red' ? 'bg-red-600 text-white border-red-600 hover:bg-red-700 shadow-lg shadow-red-200' :
          'bg-slate-900 text-white border-slate-900 hover:bg-slate-800 shadow-lg shadow-gray-200'
        } ${loading ? 'opacity-50' : ''}`}
      >
        {loading ? 'Processing...' : (isCurrent ? 'Your Plan' : buttonText)}
      </button>
      {(tooltip || hoverMessage) && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center leading-normal w-48 z-[60]">
          {tooltip || hoverMessage}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
        </div>
      )}
    </div>
  </div>
);

export const PricingPage: React.FC<{ user: any, onAuthRequired: () => void, refreshUser: () => void }> = ({ user, onAuthRequired, refreshUser }) => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
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
    type: 'info'
  });
  const navigate = useNavigate();
  
  const currentPlan = (user?.plan || 'free').toLowerCase();
  const now = new Date();
  const parseDate = (dateStr: string | null | undefined) => {
    if (!dateStr || dateStr === '0000-00-00 00:00:00') return null;
    const isoStr = dateStr.replace(' ', 'T');
    const date = new Date(isoStr);
    return isNaN(date.getTime()) ? null : date;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  const endsAt = user ? parseDate(user.subscription_ends_at || user.team_subscription_ends_at) : null;
  
  const isActive = user ? (user.subscription_status === 'active' || user.team_status === 'active') : false;
  const isPastDue = user ? (user.subscription_status === 'past_due' || user.team_status === 'past_due') : false;
  const hasAccess = isActive || isPastDue;

  const isCanceling = user ? ((Boolean(user.cancel_at_period_end) && 
                       (user.cancel_at_period_end === true || 
                        user.cancel_at_period_end == 1 || 
                        user.cancel_at_period_end === '1' || 
                        String(user.cancel_at_period_end).toLowerCase() === 'true')) ||
                      (Boolean(user.team_cancel_at_period_end) && 
                       (user.team_cancel_at_period_end === true || 
                        user.team_cancel_at_period_end == 1 || 
                        user.team_cancel_at_period_end === '1' || 
                        String(user.team_cancel_at_period_end).toLowerCase() === 'true'))) : false;

  const isTransferred = user ? (user.team_status === 'transferred' || user.subscription_status === 'transferred') : false;
  const isGracePeriod = user ? (
    ((isActive || user.subscription_status === 'canceling' || user.team_status === 'canceling') && isCanceling && endsAt && endsAt > now) ||
    (isTransferred && endsAt && endsAt > now)
  ) : false;
  const isExpired = user ? (
    (!isActive && !isPastDue && (user.recently_canceled || user.team_recently_canceled || user.team_status === 'canceled')) ||
    (isTransferred && endsAt && endsAt <= now)
  ) : false;
  const isTeamMember = user ? (!!user.team_id && (user.team_role === 'member' || user.team_role === 'admin')) : false;
  const isOwner = user ? (user.team_role === 'owner') : false;

  const showModal = (config: {
    title: string;
    message: string;
    actionLabel: string;
    actionStyle: 'blue' | 'red' | 'black';
    onAction: () => void;
    type?: 'success' | 'error' | 'warning' | 'info';
    secondaryLabel?: string;
    secondaryAction?: () => void;
  }) => {
    setModalConfig({
      ...config,
      isOpen: true,
      type: config.type || 'info',
      secondaryLabel: config.secondaryLabel,
      secondaryAction: config.secondaryAction
    });
  };

  const handlePortalRedirect = async (target: string) => {
    if (!user) {
      onAuthRequired();
      return;
    }
    setLoadingPlan(target);
    try {
      const response = await fetch('/php/create_portal_session.php');
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showModal({
          title: 'Error',
          message: 'Could not open billing portal. Please try again.',
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
      setLoadingPlan(null);
    }
  };

  const handleUpgrade = async () => {
    if (!user) {
      onAuthRequired();
      return;
    }
    setLoadingPlan('pro');
    try {
      if (isGracePeriod) {
        const response = await fetch('/php/create_portal_session.php');
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          showModal({
            title: 'Error',
            message: 'Could not open billing portal. Please try again.',
            actionLabel: 'Close',
            actionStyle: 'red',
            type: 'error',
            onAction: () => {}
          });
        }
        return;
      }

      if (!USE_PHP_BACKEND) {
        window.location.href = STRIPE_PRO_PAYMENT_LINK + "?prefilled_email=" + encodeURIComponent(user.email);
        return;
      }

      const response = await fetch('php/start_upgrade.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to start upgrade');
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
      setLoadingPlan(null);
    }
  };

  const handleCancelProAndRedirect = async () => {
    setLoadingPlan('pro');
    try {
      const response = await fetch('php/cancel_pro_subscription.php', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        window.location.reload();
      } else {
        throw new Error(data.error || 'Failed to cancel Pro subscription');
      }
    } catch (error: any) {
      showModal({
        title: 'Cancellation Error',
        message: 'Failed to cancel Pro subscription: ' + error.message,
        actionLabel: 'Close',
        actionStyle: 'red',
        type: 'error',
        onAction: () => {}
      });
      setLoadingPlan(null);
    }
  };

  const handleTeamUpgrade = async () => {
    if (!user) {
      onAuthRequired();
      return;
    }
    
    const isActivelySubscribedToPro = currentPlan === 'pro' && 
                                      user.subscription_status === 'active' && 
                                      !(user.cancel_at_period_end == 1 || user.cancel_at_period_end === true || user.cancel_at_period_end === '1' || String(user.cancel_at_period_end).toLowerCase() === 'true');

    if (isPastDue && currentPlan === 'pro') {
      showModal({
        title: 'Outstanding Payment Detected',
        message: 'We noticed your individual Pro subscription has an outstanding payment. By joining this team, your Pro subscription will be canceled immediately.',
        actionLabel: 'Proceed to Checkout',
        actionStyle: 'blue',
        type: 'warning',
        secondaryLabel: 'Go Back',
        onAction: async () => {
          setLoadingPlan('team');
          try {
            const response = await fetch('php/start_team_upgrade.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (data.success && data.url) {
              window.location.href = data.url;
            } else {
              throw new Error(data.error || 'Failed to start team upgrade');
            }
          } catch (err: any) {
            showModal({
              title: 'Error',
              message: err.message,
              actionLabel: 'Close',
              actionStyle: 'red',
              type: 'error',
              onAction: () => {}
            });
            setLoadingPlan(null);
          }
        }
      });
      return;
    }

    if (isActivelySubscribedToPro) {
      showModal({
        title: 'Switch to Teams',
        message: 'To switch to Teams, you need to cancel your current Pro subscription. Would you like to cancel your Pro plan now?',
        actionLabel: 'Cancel pro',
        actionStyle: 'red',
        type: 'warning',
        secondaryLabel: 'Go Back',
        secondaryAction: () => {},
        onAction: handleCancelProAndRedirect
      });
      return;
    }

    setLoadingPlan('team');
    try {
      if (isTransferred && isGracePeriod && isOwner) {
        const daysLeft = endsAt ? Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        showModal({
          title: 'Reactivate Now?',
          message: `Your team has ${daysLeft} days of Pro access remaining. If you proceed with a new subscription today, the current grace period will be terminated immediately, and your new billing cycle will begin today. Do you wish to proceed to checkout?`,
          actionLabel: 'Proceed to Checkout',
          actionStyle: 'blue',
          type: 'warning',
          secondaryLabel: 'Go Back',
          secondaryAction: () => {
            setLoadingPlan(null);
          },
          onAction: async () => {
            try {
              const response = await fetch('php/start_team_upgrade.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              });
              const data = await response.json();
              if (data.success && data.url) {
                window.location.href = data.url;
              } else {
                throw new Error(data.error || 'Failed to start team upgrade');
              }
            } catch (err: any) {
              showModal({
                title: 'Error',
                message: err.message,
                actionLabel: 'Close',
                actionStyle: 'red',
                type: 'error',
                onAction: () => {}
              });
              setLoadingPlan(null);
            }
          }
        });
        return;
      }

      if (!USE_PHP_BACKEND) {
        window.location.href = STRIPE_TEAM_PAYMENT_LINK + "?prefilled_email=" + encodeURIComponent(user.email);
        return;
      }

      const response = await fetch('php/start_team_upgrade.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to start team upgrade');
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
      setLoadingPlan(null);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="py-24 px-4">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <h1 className="text-6xl font-black text-slate-900 mb-8 tracking-tighter">Plans & Pricing</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Choose the perfect plan to accelerate your research and team collaboration.
          </p>

          {user && (
            <div className="mt-12 max-w-2xl mx-auto flex flex-col gap-4">
              {user.team_id && user.team_is_over_limit && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-sm text-left flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <div>
                    <span className="font-black text-red-800 uppercase tracking-widest text-[10px]">Access Frozen</span>
                    <p className="text-xs mt-1 text-red-700 font-medium">
                      {user.team_role === 'owner'
                        ? "Your team is over capacity. Please remove members or upgrade to restore access."
                        : "Your team is over capacity. Please contact your team owner to restore access."
                      }
                    </p>
                  </div>
                </div>
              )}
              {isPastDue ? (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-sm">
                  <p className="text-xs mt-1 text-amber-700 font-medium italic">
                    Your last payment failed. You still have access, but please update your card soon. 
                    <br />
                    <span className="text-red-600 font-bold">Warning:</span> Your subscription will be canceled if payment isn't resolved within the next few days.
                  </p>
                </div>
              ) : isGracePeriod ? (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-sm text-center">
                  <span className="font-black text-amber-600 uppercase tracking-widest text-[10px]">PENDING CANCELLATION</span>
                  <p className="text-xs mt-1 text-amber-700 font-medium italic">
                    Your subscription is scheduled to end on {endsAt ? formatDate(endsAt) : 'the end of the period'}.
                    {isOwner && isTransferred && <><br />You can set up a new teams plan on the Dashboard.</>}
                  </p>
                </div>
              ) : !!isExpired && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-sm">
                  <span className="font-black text-red-600 uppercase tracking-widest text-[10px]">Your subscription has expired</span>
                  <p className="text-xs mt-1 text-red-700 font-medium">
                    {user.team_id
                      ? (user.team_role === 'owner'
                          ? "Your team subscription has ended. To restore access for your team, please resubscribe via the dashboard."
                          : "Your team subscription has ended. Please contact your team owner to restore access.")
                      : "Upgrade again to restore your Pro features."
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6 lg:gap-8 items-stretch pt-8 px-4">
          <PricingCard 
            title="FREE"
            description="For anyone just getting started."
            price="$0"
            features={["One project creation", "Access to project app", "Access to data app", "Access to model app"]}
            buttonText={!user ? "CHOOSE FREE" : (isActive ? 'Downgrade to Free' : 'Free Forever')}
            buttonStyle="outline"
            showBillingCycle={true}
            onSelect={!user ? onAuthRequired : (hasAccess ? () => handlePortalRedirect('free') : () => {})}
            loading={loadingPlan === 'free'}
            isCurrent={!!user && currentPlan === 'free' && !hasAccess}
            tooltip={isTeamMember ? (isExpired ? "You are currently in an expired team. Leave the team to restore individual free status" : "Please leave your team to downgrade") : undefined}
          />
          <PricingCard 
            title="PRO"
            isPopular={true}
            description="For individuals or solo professionals."
            price="$19.99"
            priceSub="/MO"
            features={["Everything in Free", "Unlimited project creation", "Access AI agents", "Access to model execution", "Minimal collaboration access"]}
            buttonText={!user ? "Upgrade to Pro" : (
              isTeamMember 
                ? 'Switch to Pro'
                : (isExpired && currentPlan === 'pro'
                    ? 'Restart Pro'
                    : (isPastDue && currentPlan === 'pro'
                        ? 'Fix Payment'
                        : (isPastDue || isGracePeriod || isExpired 
                            ? (currentPlan === 'pro' ? 'Reactivate Pro' : (currentPlan === 'team' ? 'Switch to Pro' : 'Upgrade to Pro')) 
                            : (hasAccess && currentPlan === 'pro' ? 'Your Plan' : (currentPlan === 'team' ? 'Switch to Pro' : 'Upgrade to Pro')))))
            )}
            buttonStyle="blue"
            onSelect={!user ? onAuthRequired : (
              isOwner
                ? () => showModal({
                    title: 'Transfer Ownership Required',
                    message: 'You are currently the owner of a team. To switch to an Individual Pro plan, you must first transfer ownership of your team to another member.',
                    actionLabel: 'Go to Dashboard',
                    actionStyle: 'blue',
                    onAction: () => navigate('/team'),
                    type: 'warning'
                  })
                : (isExpired && currentPlan === 'pro'
                    ? handleUpgrade
                    : ((isPastDue || isGracePeriod) && currentPlan === 'pro' 
                        ? () => handlePortalRedirect('pro') 
                        : handleUpgrade))
            )}
            loading={loadingPlan === 'pro'}
            isCurrent={(currentPlan === 'pro' && (hasAccess || isGracePeriod)) || (isTeamMember && currentPlan === 'pro')}
            hoverMessage={isOwner ? "Transfer team ownership to switch to Pro" : undefined}
            tooltip={isTeamMember ? "Please leave your current team to subscribe to pro" : undefined}
          />
          <PricingCard 
            title="TEAM"
            description="For Groups in academia or industry."
            price="$14.99"
            priceSub="/MO PER USER"
            features={["Everything in Pro", "Unlimited access to collaboration", "Team creation for manager", "Minimum 5 users required"]}
            buttonText={!user ? "Upgrade to Team" : (
              isTeamMember
                ? 'In a Team'
                : (currentPlan === 'pro'
                    ? 'Switch to Teams'
                    : (isExpired && currentPlan === 'team'
                        ? 'Activate Team'
                        : (isPastDue && currentPlan === 'team'
                            ? 'Fix Payment'
                            : (isTransferred && user.team_role === 'owner'
                                ? (isGracePeriod ? 'Upgrade to Teams' : 'Activate Team')
                                : (isPastDue || isGracePeriod || isExpired 
                                    ? (currentPlan === 'team' ? 'Reactivate Team' : 'Upgrade to Teams') 
                                    : (hasAccess && currentPlan === 'team' ? 'Go to Dashboard' : 'Upgrade to Teams'))))))
            )}
            buttonStyle={isExpired && currentPlan === 'team' ? 'red' : (isTransferred && isOwner && isExpired ? 'red' : 'black')}
            onSelect={!user ? onAuthRequired : (
              isTeamMember
                ? () => {}
                : (currentPlan === 'pro'
                    ? handleTeamUpgrade
                    : (hasAccess && currentPlan === 'team' && !isGracePeriod
                        ? () => navigate('/team') 
                        : (isExpired && currentPlan === 'team' 
                            ? handleTeamUpgrade 
                            : (isTransferred && user.team_role === 'owner'
                                ? (isGracePeriod ? () => showModal({
                                    title: 'Are you sure?',
                                    message: 'Setting up a teams plan now will terminate your current grace period access.',
                                    actionLabel: 'Proceed',
                                    actionStyle: 'blue',
                                    type: 'warning',
                                    secondaryLabel: 'X',
                                    secondaryAction: () => {},
                                    onAction: handleTeamUpgrade
                                  }) : handleTeamUpgrade)
                                : ((isPastDue || isGracePeriod) && currentPlan === 'team' ? () => handlePortalRedirect('team') : handleTeamUpgrade)))))
            )}
            loading={loadingPlan === 'team'}
            isCurrent={!!user?.team_id}
            hoverMessage={currentPlan === 'pro' ? "Switching to Teams will immediately cancel your Pro subscription" : undefined}
            tooltip={isTeamMember ? "Please leave your current team to subscribe to teams" : undefined}
          />
          <PricingCard 
            title="ENTERPRISE"
            description="For Custom licensing in academia or industry."
            price="CUSTOM"
            features={["Everything in Team", "Advanced access controls", "Enterprise Packs", "Advanced user management", "Minimum 100 users required"]}
            buttonText="CONTACT SALES"
            buttonStyle="black"
            showBillingCycle={false}
            onSelect={() => navigate('/apply-enterprise', { state: { plan: 'Enterprise' } })}
            isCurrent={currentPlan === 'enterprise' && isActive}
          />
        </div>
      </div>

      <footer className="py-20 border-t border-gray-50 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">
            24/7 ENTERPRISE SUPPORT • SOC 2 TYPE II COMPLIANT • SECURE GLOBAL INFRASTRUCTURE
          </div>
        </div>
      </footer>

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
};

// Remove default export at the end
