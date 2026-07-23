import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2, 
  Activity, 
  ExternalLink, 
  Search,
  ShieldAlert,
  Clock,
  Database
} from 'lucide-react';

interface User {
  id: number;
  email: string;
  created_at: string;
  role: string;
  subscription_plan: string;
  subscription_status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_ends_at: string | null;
}

interface WebhookEvent {
  event_type: string;
  payload: string;
  created_at: string;
}

interface AdminData {
  stats: {
    total_users: number;
    pro_users: number;
    active_subs: number;
    past_due_subs: number;
    unpaid_subs: number;
  };
  users: User[];
  webhooks: WebhookEvent[];
}

export const AdminGodMode: React.FC = () => {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/php/admin_stats.php');
        if (!response.ok) throw new Error('Failed to fetch admin data');
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredUsers = data?.users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.stripe_customer_id?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center max-w-md">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-500 mb-6">{error || 'You do not have permission to view this page.'}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="text-emerald-500" />
              Admin God Mode
            </h1>
            <p className="text-slate-500">Real-time revenue and user oversight</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by email or Stripe ID..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Users', value: data.stats.total_users, icon: Users, color: 'text-blue-500' },
            { label: 'Pro Users', value: data.stats.pro_users, icon: CreditCard, color: 'text-indigo-500' },
            { label: 'Active Subs', value: data.stats.active_subs, icon: CheckCircle2, color: 'text-emerald-500' },
            { label: 'Past Due', value: data.stats.past_due_subs, icon: AlertCircle, color: 'text-amber-500' },
            { label: 'Unpaid', value: data.stats.unpaid_subs, icon: Clock, color: 'text-red-500' },
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Recent Users
                </h2>
                <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                  Showing {filteredUsers.length} users
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Plan</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stripe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-4">
                          <div className="font-medium text-slate-900">{user.email}</div>
                          <div className="text-xs text-slate-400">Joined {new Date(user.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-tight ${
                            user.subscription_plan === 'pro' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {user.subscription_plan}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              user.subscription_status === 'active' ? 'bg-emerald-500' :
                              user.subscription_status === 'past_due' ? 'bg-amber-500' :
                              user.subscription_status === 'unpaid' ? 'bg-red-500' : 'bg-slate-300'
                            }`} />
                            <span className="text-sm text-slate-700 capitalize">{user.subscription_status}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {user.stripe_customer_id ? (
                            <a 
                              href={`https://dashboard.stripe.com/customers/${user.stripe_customer_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-900 transition-colors"
                            >
                              {user.stripe_customer_id}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-slate-300 italic">No Stripe ID</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Webhook Log */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Webhook Audit Log
                </h2>
              </div>
              <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                {data.webhooks.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 italic text-sm">
                    No events logged yet.
                  </div>
                ) : (
                  data.webhooks.map((event, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                          {event.event_type}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(event.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-mono break-all line-clamp-2">
                        {event.payload}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold">
                  End of Audit Trail
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};