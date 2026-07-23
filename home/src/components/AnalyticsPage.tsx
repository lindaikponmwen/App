import React, { useState } from 'react';
import { ArrowLeft, BarChart3, Users, Eye, Clock, HardDrive, TrendingUp, Activity, Calendar, Download, Filter, ChevronDown, FileText, Folder, User, Globe, Zap, Database, PieChart, LineChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getTeamMembersForUser, getCurrentUserProfile } from '../data/mockData';
import {
  analyticsMetrics,
  visitData,
  pageUsageData,
  projectUsageData,
  teamActivityData,
  storageBreakdown,
  timeRanges,
  growthTrends,
  realtimeMetrics,
  performanceMetrics
} from '../data/analyticsData';

interface AnalyticsPageProps {
  onBack: () => void;
}

export default function AnalyticsPage({ onBack }: AnalyticsPageProps) {
  const navigate = useNavigate();
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('visits');
  
  const currentUser = getCurrentUserProfile();
  const teamMembers = getTeamMembersForUser();

  const handleBackClick = () => {
    navigate('/');
  };

  // Get team member by ID helper function
  const getTeamMemberById = (id: string) => {
    if (id === currentUser.id) return currentUser;
    return teamMembers.find(member => member.id === id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'paused': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const maxVisits = Math.max(...visitData.map(d => d.visits));

  return (
    <div className="flex-1 bg-gray-50 overflow-hidden">
      <div className="h-full overflow-y-auto">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={handleBackClick}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Timeline</span>
              </button>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                    <p className="text-gray-600">Monitor platform usage, team activity, and project performance</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <select
                      value={selectedTimeRange}
                      onChange={(e) => setSelectedTimeRange(e.target.value)}
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {timeRanges.map(range => (
                        <option key={range.value} value={range.value}>{range.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                  </div>
                  
                  <motion.button
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Report</span>
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm text-emerald-600 font-medium">{growthTrends.visits}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{analyticsMetrics.totalVisits.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Visits</div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-sm text-emerald-600 font-medium">{growthTrends.visitors}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{analyticsMetrics.uniqueVisitors.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Unique Visitors</div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm text-emerald-600 font-medium">{growthTrends.sessionDuration}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{analyticsMetrics.avgSessionDuration}</div>
                <div className="text-sm text-gray-600">Avg. Session Duration</div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <HardDrive className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="text-sm text-gray-600 font-medium">{growthTrends.storageUsage}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{analyticsMetrics.storageUsed}</div>
                <div className="text-sm text-gray-600">Storage Used</div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Visits Chart */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Visits Overview</h3>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Visits</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span>Visitors</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {visitData.map((day, index) => (
                    <div key={day.date} className="flex items-center space-x-4">
                      <div className="w-16 text-xs text-gray-600">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex-1 flex items-center space-x-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 relative">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(day.visits / maxVisits) * 100}%` }}
                          ></div>
                          <div 
                            className="bg-emerald-500 h-2 rounded-full absolute top-0"
                            style={{ width: `${(day.visitors / maxVisits) * 100}%`, opacity: 0.7 }}
                          ></div>
                        </div>
                        <div className="w-16 text-right text-sm font-medium text-gray-900">
                          {day.visits.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Storage Usage */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Storage Usage</h3>
                  <span className="text-sm text-gray-600">{analyticsMetrics.storageUsed} / {analyticsMetrics.storageLimit}</span>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Total Usage</span>
                    <span className="text-sm font-medium text-gray-900">24%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full" style={{ width: '24%' }}></div>
                  </div>
                </div>

                <div className="space-y-4">
                  {storageBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                        <span className="text-sm text-gray-700">{item.category}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{item.size}</span>
                        <span className="text-xs text-gray-500">({item.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Page Usage */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Page Usage Analytics</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Globe className="w-4 h-4" />
                  <span>Last 7 days</span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600 border-b border-gray-200">
                      <th className="pb-3 font-medium">Page</th>
                      <th className="pb-3 font-medium">Visits</th>
                      <th className="pb-3 font-medium">Percentage</th>
                      <th className="pb-3 font-medium">Trend</th>
                      <th className="pb-3 font-medium">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {pageUsageData.map((page, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 font-medium text-gray-900">{page.page}</td>
                        <td className="py-4 text-gray-600">{page.visits.toLocaleString()}</td>
                        <td className="py-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${page.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-gray-600">{page.percentage}%</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="text-emerald-600 font-medium">{page.trend}</span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                            <span className="text-emerald-600 text-xs">Good</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Team Activity & Project Usage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Team Activity */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Team Activity</h3>
                  <Activity className="w-5 h-5 text-gray-400" />
                </div>
                
                <div className="space-y-4">
                  {teamActivityData.map((activity, index) => {
                    const member = getTeamMemberById(activity.memberId);
                    if (!member) return null;
                    
                    return (
                    <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {member.initials}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-600">
                          {activity.projectsActive} active projects • {activity.hoursThisWeek}h this week
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{activity.efficiency}%</div>
                        <div className="text-xs text-gray-500">{activity.lastActive}</div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>

              {/* Project Usage */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Project Usage</h3>
                  <Folder className="w-5 h-5 text-gray-400" />
                </div>
                
                <div className="space-y-4">
                  {projectUsageData.map((project, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{project.project}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          <div>{project.totalHours}h total</div>
                          <div>{project.lastAccessed}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Active users:</span>
                        <div className="flex -space-x-1">
                          {project.users.map((userId, userIndex) => {
                            const user = getTeamMemberById(userId);
                            return user ? (
                              <div
                                key={userIndex}
                                className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                                title={user.name}
                              >
                                {user.initials}
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}