import React, { useState } from 'react';
import { ArrowLeft, Palette, Monitor, Sun, Moon, Type, LayoutGrid as Layout, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface AppearanceSettingsProps {
  onBack: () => void;
}

export default function AppearanceSettings({ onBack }: AppearanceSettingsProps) {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState('medium');
  const [density, setDensity] = useState('comfortable');
  const [sidebarWidth, setSidebarWidth] = useState('default');

  const handleBackClick = () => {
    navigate('/');
  };

  const themeOptions = [
    { id: 'light', label: 'Light', icon: Sun, description: 'Clean and bright interface' },
    { id: 'dark', label: 'Dark', icon: Moon, description: 'Easy on the eyes in low light' },
    { id: 'system', label: 'System', icon: Monitor, description: 'Matches your system preference' }
  ];

  const fontSizeOptions = [
    { id: 'small', label: 'Small', size: '13px' },
    { id: 'medium', label: 'Medium', size: '14px' },
    { id: 'large', label: 'Large', size: '16px' }
  ];

  const densityOptions = [
    { id: 'compact', label: 'Compact', description: 'More content, less spacing' },
    { id: 'comfortable', label: 'Comfortable', description: 'Balanced spacing' },
    { id: 'spacious', label: 'Spacious', description: 'More breathing room' }
  ];

  const sidebarOptions = [
    { id: 'narrow', label: 'Narrow', width: '48px' },
    { id: 'default', label: 'Default', width: '64px' },
    { id: 'wide', label: 'Wide', width: '80px' }
  ];

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
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Palette className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Appearance</h1>
                  <p className="text-gray-600">Customize how DrLevy.Ai looks and feels</p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Theme Selection */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Palette className="w-5 h-5 text-gray-600" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Theme</h2>
                    <p className="text-sm text-gray-600">Choose your preferred color scheme</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {themeOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = theme === option.id;
                    
                    return (
                      <motion.button
                        key={option.id}
                        onClick={() => setTheme(option.id)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                          <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                            {option.label}
                          </span>
                        </div>
                        <p className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                          {option.description}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Font Size */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Type className="w-5 h-5 text-gray-600" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Font Size</h2>
                    <p className="text-sm text-gray-600">Adjust text size for better readability</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {fontSizeOptions.map((option) => {
                    const isSelected = fontSize === option.id;
                    
                    return (
                      <motion.button
                        key={option.id}
                        onClick={() => setFontSize(option.id)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={`font-medium mb-1 ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                          {option.label}
                        </div>
                        <div 
                          className={`${isSelected ? 'text-blue-700' : 'text-gray-600'}`}
                          style={{ fontSize: option.size }}
                        >
                          Sample text at {option.size}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Layout Density */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Layout className="w-5 h-5 text-gray-600" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Layout Density</h2>
                    <p className="text-sm text-gray-600">Control spacing and information density</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {densityOptions.map((option) => {
                    const isSelected = density === option.id;
                    
                    return (
                      <motion.button
                        key={option.id}
                        onClick={() => setDensity(option.id)}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                              {option.label}
                            </div>
                            <div className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                              {option.description}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar Width */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Eye className="w-5 h-5 text-gray-600" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Sidebar Width</h2>
                    <p className="text-sm text-gray-600">Adjust the navigation sidebar width</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sidebarOptions.map((option) => {
                    const isSelected = sidebarWidth === option.id;
                    
                    return (
                      <motion.button
                        key={option.id}
                        onClick={() => setSidebarWidth(option.id)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={`font-medium mb-1 ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                          {option.label}
                        </div>
                        <div className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                          {option.width} width
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Preview Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Eye className="w-5 h-5 text-gray-600" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
                    <p className="text-sm text-gray-600">See how your changes will look</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <div className="w-4 h-4 bg-white rounded" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900" style={{ fontSize: fontSizeOptions.find(f => f.id === fontSize)?.size }}>
                        Sample Interface Element
                      </div>
                      <div className="text-sm text-gray-600">
                        This shows how your settings will appear
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 bg-white rounded px-2 py-1 inline-block">
                    Theme: {theme} • Font: {fontSize} • Density: {density} • Sidebar: {sidebarWidth}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <motion.button
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Save Changes
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}