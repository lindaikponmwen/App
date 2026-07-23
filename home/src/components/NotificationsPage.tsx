import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, UserPlus, FolderPlus, FileCheck, Mail, AlertTriangle, Clock, CheckCircle, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notifications, markAllNotificationsAsRead, getNotificationsByPriority, type Notification } from '../data/notificationsData';

interface NotificationsPageProps {
  onBack: () => void;
}

export default function NotificationsPage({ onBack }: NotificationsPageProps) {
  const navigate = useNavigate();
  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');

  useEffect(() => {
    // Mark all notifications as read when the page is opened
    markAllNotificationsAsRead();
    setNotificationsList(getNotificationsByPriority());
  }, []);

  const handleBackClick = () => {
    navigate('/');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'team_member': return UserPlus;
      case 'project': return FolderPlus;
      case 'approval': return FileCheck;
      case 'message': return Mail;
      case 'deadline': return Clock;
      case 'system': return SettingsIcon;
      default: return Bell;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getIconColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-blue-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const filteredNotifications = notificationsList.filter(notification => {
    switch (filter) {
      case 'unread': return !notification.isRead;
      case 'urgent': return notification.priority === 'urgent' || notification.priority === 'high';
      default: return true;
    }
  });

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return timestamp.toLocaleDateString();
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-hidden">
      <div className="h-full overflow-y-auto">
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={handleBackClick}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </button>
              
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                  <p className="text-gray-600">Stay updated with your research activities</p>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="mb-6">
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                {[
                  { id: 'all', label: 'All', count: notificationsList.length },
                  { id: 'unread', label: 'Unread', count: notificationsList.filter(n => !n.isRead).length },
                  { id: 'urgent', label: 'Priority', count: notificationsList.filter(n => n.priority === 'urgent' || n.priority === 'high').length }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id as any)}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      filter === tab.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
              {filteredNotifications.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                  <p className="text-gray-600">
                    {filter === 'unread' ? 'All caught up! No unread notifications.' : 
                     filter === 'urgent' ? 'No priority notifications at this time.' :
                     'You have no notifications yet.'}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  const isClickable = !!notification.actionUrl;
                  
                  return (
                    <div
                      key={notification.id}
                      className={`bg-white rounded-xl border border-gray-200 p-6 transition-all duration-200 ${
                        isClickable ? 'hover:shadow-md cursor-pointer hover:border-gray-300' : ''
                      } ${!notification.isRead ? 'border-l-4 border-l-blue-500' : ''}`}
                      onClick={() => isClickable && handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-4">
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          notification.priority === 'urgent' ? 'bg-red-100' :
                          notification.priority === 'high' ? 'bg-orange-100' :
                          notification.priority === 'medium' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <Icon className={`w-5 h-5 ${getIconColor(notification.priority)}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                              {notification.title}
                            </h3>
                            <div className="flex items-center space-x-2 ml-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(notification.priority)}`}>
                                {notification.priority}
                              </span>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-gray-600 mb-3 leading-relaxed">
                            {notification.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                              {getTimeAgo(notification.timestamp)}
                            </span>
                            
                            {isClickable && (
                              <span className="text-sm text-blue-600 font-medium">
                                View Details →
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Summary Stats */}
            {filteredNotifications.length > 0 && (
              <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {notificationsList.filter(n => n.priority === 'urgent').length}
                    </div>
                    <div className="text-sm text-gray-600">Urgent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {notificationsList.filter(n => n.priority === 'high').length}
                    </div>
                    <div className="text-sm text-gray-600">High Priority</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {notificationsList.filter(n => n.priority === 'medium').length}
                    </div>
                    <div className="text-sm text-gray-600">Medium</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {notificationsList.filter(n => n.priority === 'low').length}
                    </div>
                    <div className="text-sm text-gray-600">Low Priority</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}