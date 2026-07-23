import React, { useState } from 'react';
import { ArrowLeft, Shield, Users, FileText, Database, AlertTriangle, CheckCircle, Clock, Eye, Download, Search, Filter, MoreHorizontal, Settings, Activity, TrendingUp, Server, Lock, Key, Archive } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  complianceItems,
  auditLogs,
  systemMetrics,
  policyDocuments,
  userPermissions,
  backupStatus,
  administrativeTabs,
  administrativeStats,
  type ComplianceItem,
  type AuditLog,
  type SystemMetric,
  type PolicyDocument,
  type UserPermission,
  type BackupStatus
} from '../data/administrativeData';

interface AdministrativePageProps {
  onBack: () => void;
}

export default function AdministrativePage({ onBack }: AdministrativePageProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const handleBackClick = () => {
    navigate('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'completed':
      case 'active':
      case 'good':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pending':
      case 'running':
      case 'draft':
      case 'warning':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'overdue':
      case 'failed':
      case 'suspended':
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'inactive':
      case 'archived':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'completed':
      case 'active':
      case 'good':
        return CheckCircle;
      case 'pending':
      case 'running':
      case 'draft':
      case 'warning':
        return Clock;
      case 'overdue':
      case 'failed':
      case 'suspended':
      case 'critical':
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-orange-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'security': return Shield;
      case 'data': return Database;
      case 'access': return Key;
      case 'system': return Server;
      default: return Activity;
    }
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-hidden">
      <div className="h-full overflow-y-auto">
        <div className="bg-white border-b border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackClick}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Administrative</h1>
                  <p className="text-gray-600">System administration and compliance management</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6">
            <div className="flex space-x-8 border-b border-gray-200">
              {administrativeTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      isActive 
                        ? 'border-gray-900 text-gray-900' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {tab.label}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-sm text-emerald-600 font-medium">
                      {administrativeStats.activeUsers}/{administrativeStats.totalUsers} Active
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{administrativeStats.totalUsers}</div>
                  <div className="text-sm text-gray-600">Total Users</div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-sm text-emerald-600 font-medium">
                      {administrativeStats.complianceScore}%
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">Compliant</div>
                  <div className="text-sm text-gray-600">Compliance Score</div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                    </div>
                    <span className="text-sm text-red-600 font-medium">
                      {administrativeStats.overdueItems} Overdue
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">Action Items</div>
                  <div className="text-sm text-gray-600">Require Attention</div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-sm text-emerald-600 font-medium">{administrativeStats.uptime}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">System Health</div>
                  <div className="text-sm text-gray-600">{administrativeStats.systemHealth}</div>
                </div>
              </div>

              {/* System Metrics */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">System Metrics</h3>
                  <motion.button
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    View Details
                  </motion.button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {systemMetrics.map((metric) => {
                    const StatusIcon = getStatusIcon(metric.status);
                    return (
                      <div key={metric.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <StatusIcon className={`w-4 h-4 ${
                              metric.status === 'good' ? 'text-emerald-600' :
                              metric.status === 'warning' ? 'text-orange-600' : 'text-red-600'
                            }`} />
                            <span className="font-medium text-gray-900">{metric.name}</span>
                          </div>
                          <span className={`text-lg font-bold ${
                            metric.status === 'good' ? 'text-emerald-600' :
                            metric.status === 'warning' ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {metric.value}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{metric.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Last updated: {metric.lastUpdated.toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  <motion.button
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    View All Logs
                  </motion.button>
                </div>

                <div className="space-y-4">
                  {auditLogs.slice(0, 5).map((log) => {
                    const CategoryIcon = getCategoryIcon(log.category);
                    return (
                      <div key={log.id} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CategoryIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900">{log.action}</span>
                            <span className="text-sm text-gray-500">by {log.user.name}</span>
                          </div>
                          <p className="text-sm text-gray-600">{log.details}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {log.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Compliance Management</h2>
                  <p className="text-gray-600 mt-1">Monitor and manage regulatory compliance requirements</p>
                </div>
                <motion.button
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>New Compliance Item</span>
                </motion.button>
              </div>

              <div className="space-y-4">
                {complianceItems.map((item) => {
                  const StatusIcon = getStatusIcon(item.status);
                  return (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{item.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                            <span className={`text-xs font-medium ${getPriorityColor(item.priority)}`}>
                              {item.priority.toUpperCase()} PRIORITY
                            </span>
                          </div>
                          <p className="text-gray-600 mb-2">{item.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Category: {item.category}</span>
                            <span>Due: {item.dueDate.toLocaleDateString()}</span>
                          </div>
                        </div>
                        <motion.button
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Audit Logs</h2>
                  <p className="text-gray-600 mt-1">System activity and security audit trail</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search logs..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <motion.button
                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Filter className="w-4 h-4" />
                    <span className="text-sm">Filter</span>
                  </motion.button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600 border-b border-gray-200">
                      <th className="pb-3 font-medium">Action</th>
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Category</th>
                      <th className="pb-3 font-medium">Timestamp</th>
                      <th className="pb-3 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {auditLogs
                      .filter(log => 
                        searchQuery === '' || 
                        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        log.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        log.details.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((log) => {
                        const CategoryIcon = getCategoryIcon(log.category);
                        return (
                          <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 font-medium text-gray-900">{log.action}</td>
                            <td className="py-4">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                  {log.user.initials}
                                </div>
                                <span className="text-gray-900">{log.user.name}</span>
                              </div>
                            </td>
                            <td className="py-4">
                              <div className="flex items-center space-x-2">
                                <CategoryIcon className="w-4 h-4 text-gray-600" />
                                <span className="text-gray-600 capitalize">{log.category}</span>
                              </div>
                            </td>
                            <td className="py-4 text-gray-600">{log.timestamp.toLocaleString()}</td>
                            <td className="py-4 text-gray-600 max-w-xs truncate">{log.details}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
                  <p className="text-gray-600 mt-1">Manage user accounts, roles, and permissions</p>
                </div>
                <motion.button
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Users className="w-4 h-4" />
                  <span>Add User</span>
                </motion.button>
              </div>

              <div className="space-y-4">
                {userPermissions.map((user) => (
                  <div key={user.userId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                          {user.userInitials}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{user.userName}</h3>
                          <p className="text-sm text-gray-600">{user.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                              {user.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            Last access: {user.lastAccess.toLocaleDateString()}
                          </p>
                        </div>
                        <motion.button
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Settings className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Permissions:</span>
                        <div className="flex flex-wrap gap-1">
                          {user.permissions.map((permission, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                            >
                              {permission}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'policies' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Policy Documents</h2>
                  <p className="text-gray-600 mt-1">Manage organizational policies and procedures</p>
                </div>
                <motion.button
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FileText className="w-4 h-4" />
                  <span>New Policy</span>
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {policyDocuments.map((policy) => (
                  <div key={policy.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{policy.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(policy.status)}`}>
                            {policy.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{policy.description}</p>
                        <div className="space-y-1 text-xs text-gray-500">
                          <div>Version: {policy.version}</div>
                          <div>Category: {policy.category}</div>
                          <div>Last updated: {policy.lastUpdated.toLocaleDateString()}</div>
                        </div>
                      </div>
                      <motion.button
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Eye className="w-4 h-4" />
                      </motion.button>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <motion.button
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        View Document
                      </motion.button>
                      <motion.button
                        className="flex items-center space-x-1 text-gray-600 hover:text-gray-700 text-sm"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'backups' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Backup Management</h2>
                  <p className="text-gray-600 mt-1">Monitor and manage system backups</p>
                </div>
                <motion.button
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Database className="w-4 h-4" />
                  <span>Manual Backup</span>
                </motion.button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600 border-b border-gray-200">
                      <th className="pb-3 font-medium">Backup ID</th>
                      <th className="pb-3 font-medium">Type</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Size</th>
                      <th className="pb-3 font-medium">Location</th>
                      <th className="pb-3 font-medium">Timestamp</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {backupStatus.map((backup) => {
                      const StatusIcon = getStatusIcon(backup.status);
                      return (
                        <tr key={backup.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 font-medium text-gray-900">{backup.id}</td>
                          <td className="py-4">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium capitalize">
                              {backup.type}
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center space-x-2">
                              <StatusIcon className={`w-4 h-4 ${
                                backup.status === 'completed' ? 'text-emerald-600' :
                                backup.status === 'running' ? 'text-orange-600' : 'text-red-600'
                              }`} />
                              <span className={`capitalize ${
                                backup.status === 'completed' ? 'text-emerald-600' :
                                backup.status === 'running' ? 'text-orange-600' : 'text-red-600'
                              }`}>
                                {backup.status}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 text-gray-600">{backup.size}</td>
                          <td className="py-4 text-gray-600">{backup.location}</td>
                          <td className="py-4 text-gray-600">{backup.timestamp.toLocaleString()}</td>
                          <td className="py-4">
                            <div className="flex items-center space-x-2">
                              {backup.status === 'completed' && (
                                <motion.button
                                  className="text-blue-600 hover:text-blue-700 text-sm"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  Restore
                                </motion.button>
                              )}
                              <motion.button
                                className="text-gray-600 hover:text-gray-700"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}