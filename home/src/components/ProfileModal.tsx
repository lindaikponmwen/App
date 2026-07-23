import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Calendar, User, MapPin, Phone, Award, Briefcase, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User as UserType } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
}

export default function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
  const navigate = useNavigate();

  if (!user) return null;

  const handleSendMessage = () => {
    navigate(`/profile?tab=inbox&user=${encodeURIComponent(user.id)}`);
    onClose();
  };

  const handleViewProjects = () => {
    navigate('/projects');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white">
              <motion.button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5" />
              </motion.button>

              <div className="flex items-center space-x-4">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white/20"
                  />
                ) : (
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-white/20">
                    {user.initials}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <p className="text-white/80">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <User className="w-5 h-5 text-gray-600" />
                  <span>Contact Information</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-900">{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium text-gray-900">+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium text-gray-900">San Francisco, CA</span>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Briefcase className="w-5 h-5 text-gray-600" />
                  <span>Professional</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <Award className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Role:</span>
                    <span className="font-medium text-gray-900">Senior Research Scientist</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Department:</span>
                    <span className="font-medium text-gray-900">Clinical Pharmacology</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Joined:</span>
                    <span className="font-medium text-gray-900">March 2023</span>
                  </div>
                </div>
              </div>

              {/* Expertise */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    Pharmacokinetics
                  </span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                    Clinical Trials
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    Data Analysis
                  </span>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                    Biostatistics
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex space-x-3">
                <motion.button
                  onClick={handleSendMessage}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>Send Message</span>
                  </div>
                </motion.button>
                <motion.button
                  onClick={handleViewProjects}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  View Projects
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}