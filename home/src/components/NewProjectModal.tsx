
import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Search, Check, Sparkles, PenTool, ArrowLeft, Lock } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { teamMembers, currentUser, availableAnalysisTypes } from '../data/mockData';
import { getCurrentUser } from '../data/authData';
import { projectStorage } from '../utils/projectStorage';
import { ExperimentItem, User } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { dataService } from '../services/dataService';

// --- Reusable MultiSelect Component (Sharp Edges) ---
interface MultiSelectOption {
  id: string;
  label: string;
  subLabel?: string;
  avatar?: string;
  initials?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selectedIds: string[];
  onChange: (newIds: string[]) => void;
  placeholder?: string;
  renderOption?: (option: MultiSelectOption) => React.ReactNode;
  disabled?: boolean;
}

function MultiSelect({ options, selectedIds, onChange, placeholder = "Search...", renderOption, disabled = false }: MultiSelectProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (opt.subLabel && opt.subLabel.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleToggle = (id: string) => {
    if (disabled) return;
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(sid => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeSelected = (id: string) => {
    if (disabled) return;
    onChange(selectedIds.filter(sid => sid !== id));
  };

  return (
    <div className={`w-full space-y-3 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
      {/* Selected Pills Area */}
      <div className="flex flex-wrap gap-2 min-h-[32px]">
        {selectedIds.length > 0 ? selectedIds.map(id => {
          const option = options.find(o => o.id === id);
          if (!option) return null;
          return (
            <span
              key={id}
              className={`inline-flex items-center px-3 py-1 text-sm font-medium border ${
                disabled ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-blue-100 text-blue-800 border-blue-200'
              }`}
            >
              {option.label}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeSelected(id); }}
                  className="ml-2 p-0.5 hover:bg-blue-200 text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          );
        }) : (
          <span className="text-sm text-gray-400 py-1">No items selected</span>
        )}
      </div>

      {/* Search & List Container */}
      {!disabled ? (
        <div className="border border-gray-300 overflow-hidden bg-white shadow-sm">
          {/* Search Input */}
          <div className="relative border-b border-gray-200 bg-gray-50">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-3 bg-transparent text-sm outline-none focus:bg-white"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
              {filteredOptions.length} results
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => {
                const isSelected = selectedIds.includes(option.id);
                return (
                  <div
                    key={option.id}
                    onClick={() => handleToggle(option.id)}
                    className={`flex items-center px-4 py-3 cursor-pointer border-b last:border-b-0 border-gray-50 ${
                      isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-5 h-5 border mr-3 flex items-center justify-center ${
                      isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    
                    <div className="flex-1">
                      {renderOption ? renderOption(option) : (
                        <span className={`text-sm ${isSelected ? 'font-medium text-blue-900' : 'text-gray-700'}`}>
                          {option.label}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                No matching options found.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 border border-dashed border-gray-200 bg-gray-50 text-center">
           <p className="text-xs text-gray-400 italic">Member selection disabled for your account level.</p>
        </div>
      )}
    </div>
  );
}

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: () => void;
}

type ModalMode = 'selection' | 'ai-input' | 'form';

export default function NewProjectModal({ isOpen, onClose, onProjectCreated }: NewProjectModalProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const authUser = getCurrentUser();

  const canManageMembers = authUser?.role === 'owner' || authUser?.role === 'administrator';
  const isMember = authUser?.role === 'free';

  const [mode, setMode] = useState<ModalMode>('selection');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [allMembersList, setAllMembersList] = useState<User[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    selectedMembers: [currentUser.id],
    keywords: '',
    analysisTypes: [] as string[],
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // --- Load Members from Registry ---
  useEffect(() => {
    const fetchRegistry = async () => {
      // Initialize with combined mock data
      const initialList = [currentUser, ...teamMembers];
      //setAllMembersList(initialList);

      // PHP Backend Integration (Commented Out for Development)
      
      try {
        const response = await dataService.getTeamMembersForUser();
        if (response && response.length > 0) {
          setAllMembersList(response);
        }
      } catch (err) {
        console.error('Failed to fetch organizational members from PHP registry:', err);
      }
      
    };

    if (isOpen) {
      fetchRegistry();
    }
  }, [isOpen]);

  let __persistentToken: string | null = null;

async function _fetchRemoteHandshake(): Promise<string> {
  if (__persistentToken) return __persistentToken;

  try {

    const response = await fetch('/auth/auth_drlevy.php', {
      method: 'POST', // or POST if required by your script
      headers: {
        'Content-Type': 'application/json',
        // 'X-Auth-Token': '...' // Add any required app-level authentication
      },
      cache: 'no-store' // Ensure we don't get a stale cached response
    });
    if (!response.ok) {
      throw new Error(`Auth server returned status ${response.status}`);
    }

    const payload = await response.json();
    
    if (!payload || !payload.kok) {
      throw new Error("Handshake payload missing expected 'token' property.");
    }

    __persistentToken = payload.kok;
    return __persistentToken;
  } catch (err) {
    console.error("Critical: Remote service handshake failed.", err);
    throw new Error("Unable to establish secure connection to the reasoning engine.");
  }
}

  // --- AI Generation Logic ---
  const generateProjectDetails = async () => {
    if (authUser?.role === 'free') {
        setErrors({ ai: "The drlevy.AI Assistant is a premium feature. Please upgrade your plan to use it." });
        return;
    }

    if (!aiPrompt.trim()) {
      setErrors({ ai: 'Please enter a description.' });
      return;
    }

    setIsGenerating(true);
    setErrors({});

    try {
      const serviceKey = await _fetchRemoteHandshake();
      if (!serviceKey) {
        throw new Error("API Key not configured");
      }

      const ai = new GoogleGenAI({ apiKey: serviceKey });
      const model = 'gemini-3-flash-preview'; 

      const systemPrompt = `
        You are an expert research project manager in pharmacokinetics, pharmacodynamics and clinical trials.
        Based on the user's short description, generate a professional project title, a detailed technical description, 
        a list of relevant keywords (comma separated), and select strictly from the provided list of analysis types.
        
        Available Analysis Types: ${availableAnalysisTypes.join(', ')}
      `;

      const response = await ai.models.generateContent({
        model,
        contents: aiPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              keywords: { type: Type.STRING, description: "Comma separated string of keywords" },
              analysisTypes: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              }
            },
            required: ['title', 'description', 'keywords', 'analysisTypes']
          }
        }
      });

      const resultText = response.text;
      if (resultText) {
        const result = JSON.parse(resultText);
        setFormData(prev => ({
          ...prev,
          title: result.title,
          description: result.description,
          keywords: result.keywords,
          analysisTypes: result.analysisTypes
        }));
        setMode('form');
      }

    } catch (error) {
      console.error("AI Generation Error:", error);
      setErrors({ ai: "Failed to generate project details. Please try again or switch to manual entry." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    // Members are now optional, but we keep the current user if they are the creator
    // We don't throw an error if no other members are selected

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else {
      const start = new Date(formData.startDate);
      if (isNaN(start.getTime())) {
        newErrors.startDate = 'Invalid start date';
      }
    }

    if (formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setSaving(true);
      setErrors({}); 

      try {
        // Mock Implementation (Active)
        const newProject: ExperimentItem = {
          id: Date.now().toString(),
          title: formData.title,
          description: formData.description,
          status: 'active',
          selectedMembers: formData.selectedMembers,
          keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
          analysisTypes: formData.analysisTypes,
          startDate: new Date(formData.startDate),
          endDate: formData.endDate ? new Date(formData.endDate) : undefined,
          files: []
        };

        projectStorage.saveProject(newProject);

        // --- PHP Backend Integration (Commented Out for Development) ---
        const backendProjectData = {
          title: formData.title,
          description: formData.description,
          status: 'active' as 'active',
          startDate: formData.startDate,
          endDate: formData.endDate,
          selectedMembers: formData.selectedMembers.map(id => parseInt(id, 10)).filter(n => !isNaN(n)),
          keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
          analysisTypes: formData.analysisTypes
        };

        const API_BASE_URL = '';
        const response = await fetch(`${API_BASE_URL}/project1/create.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': localStorage.getItem('csrfToken') || ''
          },
          body: JSON.stringify(backendProjectData),
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to create project on server');
        }


        // Notify application via custom event
        window.dispatchEvent(new CustomEvent('project-created'));
        
        if (onProjectCreated) onProjectCreated();
        
        handleReset();
        onClose();

        // Redirect logic
        const currentPath = location.pathname;
        if (currentPath !== '/' && currentPath !== '/projects') {
          navigate('/');
        }
      } catch (error) {
        console.error('Error creating project:', error);
        setErrors({ submit: 'Failed to create project. Please try again.' });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleReset = () => {
    setFormData({
      title: '',
      description: '',
      selectedMembers: [currentUser.id],
      keywords: '',
      analysisTypes: [],
      startDate: new Date().toISOString().split('T')[0],
      endDate: ''
    });
    setErrors({});
    setMode('selection');
    setAiPrompt('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // --- Sub-Renderers ---

  const renderSelectionMode = () => (
    <div className="p-8 overflow-y-auto h-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How would you like to start?</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => setMode('ai-input')}
          disabled={isMember}
          className={`group flex flex-col items-center justify-center p-8 border-2 transition-none ${
            isMember
              ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
              : 'border-gray-200 hover:border-purple-600 hover:bg-purple-50'
          }`}
        >
          <div className={`w-16 h-16 flex items-center justify-center mb-4 ${
            isMember ? 'bg-gray-200' : 'bg-purple-100 group-hover:bg-purple-200'
          }`}>
            <Sparkles className={`w-8 h-8 ${isMember ? 'text-gray-400' : 'text-purple-600'}`} />
          </div>
          <h3 className={`text-lg font-bold mb-2 ${isMember ? 'text-gray-500' : 'text-gray-900'}`}>AI Assistant</h3>
          <p className={`text-sm text-center ${isMember ? 'text-gray-400' : 'text-gray-600'}`}>
            Describe your project in a few words and let AI prefill the details for you.
          </p>
        </button>

        <button
          onClick={() => setMode('form')}
          className="group flex flex-col items-center justify-center p-8 border-2 border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-none"
        >
          <div className="w-16 h-16 bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200">
            <PenTool className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Manual Entry</h3>
          <p className="text-sm text-gray-600 text-center">
            Start from scratch and manually enter all project details yourself.
          </p>
        </button>
      </div>
      {isMember && (
          <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-none">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-blue-100 rounded-none flex-shrink-0">
                <Lock className="w-5 h-5 text-blue-700" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide mb-1">STANDARD ACCOUNT LIMITS</h3>
                <p className="text-sm text-blue-800 leading-relaxed mb-4">
                  As a standard research member, you are currently limited to creating <span className="font-bold">one project</span> and have restricted access to multi-user collaboration tools, including the <span className="font-bold">AI Assistant</span>. Upgrade to a premium plan to unlock unlimited project creation, advanced analytics, and the ability to collaborate with external research teams.
                </p>
                <button 
                  onClick={() => {
                    onClose();
                    navigate('/pricing');
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors rounded-none"
                >
                  Explore Premium Features
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );

  const renderAIInputMode = () => (
    <div className="p-8 overflow-y-auto h-full">
      <div className="flex items-center mb-6">
        <button onClick={() => setMode('selection')} className="mr-4 text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Describe your project</h2>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Project Description
        </label>
        <textarea
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none rounded-none"
          placeholder="e.g. A bioequivalence study comparing a new generic formulation of Atorvastatin to Lipitor in healthy volunteers..."
        />
        {errors.ai && (
          <p className="mt-2 text-sm text-red-600">{errors.ai}</p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={generateProjectDetails}
          disabled={isGenerating}
          className="flex items-center px-6 py-3 bg-purple-600 text-white hover:bg-purple-700 font-medium disabled:opacity-50 rounded-none"
        >
          {isGenerating ? (
            <>
              <span className="mr-2">Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              <span>Generate Details</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderFormMode = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-none flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center">
          <button onClick={() => setMode('selection')} className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Project Details</h2>
            <p className="text-sm text-gray-600 mt-1">Review and finalize your project information</p>
          </div>
        </div>
        <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 p-8 overflow-y-auto min-h-0">
        {errors.submit && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{errors.submit}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">Basic Information</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Project Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="e.g., Phase II Clinical Trial Analysis"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className={`w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Provide a brief description..."
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>
          </div>

          {/* Team Members */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Team Members <span className="text-xs font-normal text-gray-400 italic ml-2">(Optional)</span>
              </h3>
              {!canManageMembers && (
                <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-none shadow-sm">
                  <Lock className="w-3 h-3 text-amber-600" />
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-tight">Premium Only</span>
                </div>
              )}
            </div>
            
            <MultiSelect 
              disabled={!canManageMembers}
              options={allMembersList.map(m => ({ 
                id: String(m.id), 
                label: m.name, 
                subLabel: m.email,
                avatar: m.avatar,
                initials: m.initials
              }))}
              selectedIds={formData.selectedMembers}
              onChange={(newIds) => handleInputChange('selectedMembers', newIds)}
              placeholder={canManageMembers ? "Search team members..." : "Upgrade to add collaborators"}
              renderOption={(option) => (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
                    {option.avatar ? (
                      <img src={option.avatar} alt="" className="w-full h-full object-cover" />
                    ) : option.initials}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.subLabel}</div>
                  </div>
                </div>
              )}
            />
            {!canManageMembers && (
              <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                As a standard member, you can create projects for yourself. Only Project Owners and Administrators can invite other research collaborators to join a specific project.
              </p>
            )}
            {errors.members && <p className="text-sm text-red-600">{errors.members}</p>}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">Details</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Keywords</label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => handleInputChange('keywords', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="pharmacokinetics, bioavailability..."
              />
              <p className="text-xs text-gray-500 mt-1">Separate keywords with commas</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Analysis Types</label>
              <MultiSelect 
                options={availableAnalysisTypes.map(type => ({ id: type, label: type }))}
                selectedIds={formData.analysisTypes}
                onChange={(newIds) => handleInputChange('analysisTypes', newIds)}
                placeholder="Search analysis types..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className={`w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.startDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className={`w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.endDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
              </div>
            </div>
          </div>
        </form>
      </div>

      <div className="flex-none flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={handleClose}
          className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 font-medium disabled:opacity-50"
        >
          {saving ? 'Creating...' : 'Create Project'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClose} />
          <div className="relative bg-white shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {mode === 'selection' && renderSelectionMode()}
            {mode === 'ai-input' && renderAIInputMode()}
            {mode === 'form' && renderFormMode()}
          </div>
        </div>
      )}
    </>
  );
}
