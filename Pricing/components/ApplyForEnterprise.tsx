import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building, User, Mail, Phone, Users, MessageSquare, ArrowLeft, CheckCircle, Shield, Lock, AlertCircle, Layers } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function ApplyForEnterprise() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedPlan = location.state?.plan || 'Enterprise';

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    companySize: '',
    message: '',
    package: 'Enterprise'
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field specific error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[\d\s-]{10,}$/;

    if (!formData.name.trim()) newErrors.name = 'Full Name is required';
    if (!formData.companyName.trim()) newErrors.companyName = 'Company Name is required';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.companySize) newErrors.companySize = 'Please select a company size';
    if (!formData.package) newErrors.package = 'Please select a package';

    if (!formData.message.trim()) {
      newErrors.message = 'Please provide some detail about your requirements.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [countdown, setCountdown] = useState(3);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to top error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      // PHP Backend Integration
      const response = await fetch('/php/send-enterprise-request.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit application');
      }
      
      setSubmitted(true);

      // Start countdown
      let timer = 3;
      const interval = setInterval(() => {
        timer -= 1;
        setCountdown(timer);
        if (timer <= 0) {
          clearInterval(interval);
          navigate('/');
        }
      }, 1000);

    } catch (error: any) {
      console.error('Submission error:', error);
      alert(error.message || 'There was an error submitting your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleDashboard = () => {
    navigate('/');
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-inter">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white max-w-md w-full p-8 shadow-xl border border-gray-200 text-center"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Application Received</h2>
          <p className="text-gray-600 mb-8">
            Thank you for your interest. Our sales team has received your detailed requirements and will review your application within 24 business hours.
          </p>
          
          <div className="py-4 px-6 bg-slate-50 border border-slate-100 rounded-sm mb-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Redirecting to pricing in {countdown}s...
            </p>
          </div>

          <button
            onClick={handleDashboard}
            className="w-full py-3 px-4 bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
          >
            Return to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-inter">
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Contact Sales</h1>
            <p className="text-lg text-gray-600">
              Tell us about your needs and we'll create a custom plan for your organization.
            </p>
          </div>

          <div className="bg-white shadow-xl border border-gray-200 overflow-hidden">
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`block w-full pl-10 pr-3 py-3 border ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all rounded-none`}
                        placeholder="John Doe"
                      />
                    </div>
                    {errors.name && <p className="mt-1 text-xs text-red-500 flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.name}</p>}
                  </div>

                  {/* Company Name */}
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-semibold text-gray-700 mb-2">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className={`block w-full pl-10 pr-3 py-3 border ${errors.companyName ? 'border-red-300 bg-red-50' : 'border-gray-300'} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all rounded-none`}
                        placeholder="Acme Inc."
                      />
                    </div>
                    {errors.companyName && <p className="mt-1 text-xs text-red-500 flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.companyName}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Work Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`block w-full pl-10 pr-3 py-3 border ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all rounded-none`}
                        placeholder="john@company.com"
                      />
                    </div>
                    {errors.email && <p className="mt-1 text-xs text-red-500 flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.email}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`block w-full pl-10 pr-3 py-3 border ${errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all rounded-none`}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    {errors.phone && <p className="mt-1 text-xs text-red-500 flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.phone}</p>}
                  </div>
                </div>

                {/* Company Size */}
                 <div>
                  <label htmlFor="companySize" className="block text-sm font-semibold text-gray-700 mb-2">
                    Company Size <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Users className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="companySize"
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-3 border ${errors.companySize ? 'border-red-300 bg-red-50' : 'border-gray-300'} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white rounded-none appearance-none`}
                    >
                      <option value="" disabled>Select number of employees</option>
                      <option value="1-50">1-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="501-1000">501-1000 employees</option>
                      <option value="1000+">1000+ employees</option>
                    </select>
                  </div>
                  {errors.companySize && <p className="mt-1 text-xs text-red-500 flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.companySize}</p>}
                </div>
                
                 {/* Package */}
                <div>
                  <label htmlFor="package" className="block text-sm font-semibold text-gray-700 mb-2">
                    Package <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Layers className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="package"
                      name="package"
                      required
                      value={formData.package}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-3 border ${errors.package ? 'border-red-300 bg-red-50' : 'border-gray-300'} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white rounded-none appearance-none`}
                    >
                      <option value="Enterprise">Enterprise</option>
                    </select>
                  </div>
                  {errors.package && <p className="mt-1 text-xs text-red-500 flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.package}</p>}
                </div>


                {/* Message */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700">
                      Usage Needs / Message <span className="text-red-500">*</span>
                    </label>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <MessageSquare className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-3 border ${errors.message ? 'border-red-300 bg-red-50' : 'border-gray-300'} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all rounded-none resize-none`}
                      placeholder={`Please describe your requirements in detail. Include information about:
- Your research goals
- Expected number of users
- Specific compliance requirements
- Timeline for implementation`}
                    />
                  </div>
                  
                  {errors.message ? (
                    <p className="mt-2 text-xs text-red-500 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1"/>
                      {errors.message}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-gray-500">
                      Detailed information helps us customize your enterprise environment effectively.
                    </p>
                  )}
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors uppercase tracking-wide rounded-none shadow-md hover:shadow-lg"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                </div>
              </form>
            </div>
            
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                <span>Enterprise-grade security</span>
              </div>
              <div className="flex items-center">
                <Lock className="w-4 h-4 mr-2" />
                <span>SOC 2 Type II Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
