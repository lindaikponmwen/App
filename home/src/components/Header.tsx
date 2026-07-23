import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Search, Command, HelpCircle, Settings, Bell, LogOut, User, Shield, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, setCachedUser } from '../data/authData';
import { getUnreadNotificationsCount } from '../data/notificationsData';
import { authService } from '../services/authService';

interface HeaderProps {
  onSettingsClick: () => void;
  onSearchClick: () => void;
  onProfileClick: () => void;
  onHelpClick: () => void;
  hideSearchBar?: boolean;
}

export default function Header({ onSettingsClick, onSearchClick, onProfileClick, onHelpClick, hideSearchBar = false }: HeaderProps) {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const currentUser = getCurrentUser();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUnreadCount(getUnreadNotificationsCount());
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleProfileClick = () => {
    setShowUserMenu(false);
    navigate('/profile');
  };

  const handleNotificationClick = () => {
    setUnreadCount(0); // Clear the count when notifications are viewed
    navigate('/notifications');
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setCachedUser(null);
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      setCachedUser(null);
      navigate('/login', { replace: true });
    }
  };

  const getLastActiveTime = () => {
    if (!currentUser?.lastLogin) return 'Never';
    const now = new Date();
    const lastLogin = new Date(currentUser.lastLogin);
    const diffMs = now.getTime() - lastLogin.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (!currentUser) {
    return null;
  }

  const isAdmin = currentUser.role === 'administrator';

  return (
    <div className="h-12 bg-black border-b border-gray-800 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <img
          src="https://drlevy.ai/logo2.png"
          alt="DrLevy.Ai"
          className="object-contain h-[25px] w-auto filter invert(1)"
        />
        <div className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded-full">
          {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Search Bar - Hidden on Projects page */}
        {!hideSearchBar && (
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Projects"
              className="w-80 pl-9 pr-16 py-1.5 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm cursor-pointer text-white placeholder-gray-500"
              onClick={onSearchClick}
              readOnly
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 text-xs text-gray-500">
              <Command className="w-3 h-3" />
              <span>Ctrl + K</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <motion.button
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          onClick={onHelpClick}
        >
          <HelpCircle className="w-5 h-5" />
        </motion.button>

        {isAdmin && (
          <motion.button
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            onClick={onSettingsClick}
          >
            <Settings className="w-5 h-5" />
          </motion.button>
        )}

        {isAdmin && (
          <motion.button
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors relative"
            onClick={handleNotificationClick}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </motion.button>
        )}

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <motion.button
            className="flex items-center space-x-2 cursor-pointer p-1 rounded-lg hover:bg-gray-800 transition-colors"
            whileHover={{ scale: 1.02 }}
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent hover:ring-blue-500 transition-all"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium ring-2 ring-transparent hover:ring-blue-500 transition-all">
                {currentUser.initials}
              </div>
            )}
          </motion.button>

          {/* User Dropdown Menu */}
          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-80 bg-gradient-to-br from-gray-900 to-gray-950 shadow-2xl border border-gray-800/50 backdrop-blur-xl z-50 overflow-hidden"
              >
                <div className="p-5 border-b border-gray-800/50 bg-gradient-to-r from-blue-600/10 to-cyan-600/10">
                  <div className="flex items-start space-x-4">
                    {currentUser.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-500/30"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-lg font-semibold ring-2 ring-blue-500/30">
                        {currentUser.initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-base truncate">{currentUser.name}</h3>
                      <p className="text-sm text-gray-400 truncate">{currentUser.email}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-gray-800/80 rounded-full">
                          <Shield className="w-3 h-3 text-emerald-400" />
                          <span className="text-xs text-gray-300 font-medium">
                            {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                          </span>
                        </div>
                        {currentUser.isOnline && (
                          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-500/10 rounded-full">
                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                            <span className="text-xs text-emerald-400 font-medium">Active</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <div className="px-3 py-2 mb-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5 text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Last active</span>
                      </div>
                      <span className="text-gray-300 font-medium">{getLastActiveTime()}</span>
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent my-2"></div>

                  <button
                    onClick={handleProfileClick}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-800/50 transition-all group"
                  >
                    <div className="w-8 h-8 bg-gray-800/50 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <User className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium group-hover:text-white transition-colors">View Profile</p>
                      <p className="text-xs text-gray-500">Manage your account</p>
                    </div>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={onSettingsClick}
                      className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-800/50 transition-all group"
                    >
                      <div className="w-8 h-8 bg-gray-800/50 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                        <Settings className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium group-hover:text-white transition-colors">Settings</p>
                        <p className="text-xs text-gray-500">Preferences & privacy</p>
                      </div>
                    </button>
                  )}

                  <div className="h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent my-2"></div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-all group"
                  >
                    <div className="w-8 h-8 bg-gray-800/50 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                      <LogOut className="w-4 h-4 group-hover:text-red-300 transition-colors" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium group-hover:text-red-300 transition-colors">Sign Out</p>
                      <p className="text-xs text-gray-500">End your session</p>
                    </div>
                  </button>
                </div>

                <div className="px-5 py-3 bg-gray-900/50 border-t border-gray-800/50">
                  <p className="text-xs text-gray-500 text-center">
                    {currentUser.department} · {currentUser.title}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
