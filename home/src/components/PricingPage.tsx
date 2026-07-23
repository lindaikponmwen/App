

import React, { useState } from 'react';
import { Check, Zap, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

interface PricingPageProps {
  onEnroll: (plan: string, billingCycle: 'monthly' | 'yearly') => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onEnroll }) => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [processing, setProcessing] = useState(false);

  const plans = [
    {
      name: 'Free',
      description: 'For anyone just getting started.',
      price: { monthly: 0, yearly: 0 },
      priceLabel: 'Free for you and your team',
      role: 'member',
      features: [
        { text: 'One project creation', included: true },
        { text: 'Access to project app', included: true },
        { text: 'Access to data app', included: true },
        { text: 'Access to model app', included: true },
        { text: 'AI agents', included: false },
        { text: 'Model execution', included: false },
        { text: 'Collaboration with colleagues', included: false },
        { text: 'Team creation', included: false }
      ],
      buttonClass: 'bg-white text-slate-900 border border-slate-300 hover:bg-slate-50',
      recommended: false
    },
    {
      name: 'Pro',
      description: 'For individuals or solo professionals.',
      price: { monthly: 19.99, yearly: 199.90 },
      priceLabel: '$19.99/month',
      role: 'owner',
      features: [
        { text: 'Everything in Free', included: true },
        { text: 'Unlimited project creation', included: true },
        { text: 'Access AI agents', included: true },
        { text: 'Access to model execution', included: true },
        { text: 'Minimal collaboration access', included: true },
        { text: 'Team creation', included: false }
      ],
      buttonClass: 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg',
      recommended: true
    },
    {
      name: 'Team',
      description: 'For Groups in academia or industry.',
      price: { monthly: 14.99, yearly: 149.90 },
      priceLabel: '$14.99/month per user',
      role: 'owner',
      features: [
        { text: 'Everything in Pro', included: true },
        { text: 'Unlimited access to collaboration', included: true },
        { text: 'Team creation for manager', included: true },
        { text: 'Minimum 10 users required', included: true }
      ],
      buttonClass: 'bg-slate-900 text-white hover:bg-slate-800',
      isCustom: false,
      recommended: false
    },
    {
      name: 'Enterprise',
      description: 'For Custom licensing in academia or industry.',
      price: { monthly: null, yearly: null },
      priceLabel: 'Custom pricing',
      role: 'owner',
      features: [
        { text: 'Everything in Team', included: true },
        { text: 'Advanced access controls', included: true },
        { text: 'Enterprise Packs', included: true },
        { text: 'Advanced user management', included: true },
        { text: 'Minimum 100 users required', included: true }
      ],
      buttonClass: 'bg-slate-900 text-white hover:bg-slate-800',
      isCustom: true,
      recommended: false
    }
  ];

  const handleEnroll = async (planName: string, role: string) => {
    console.log(`User selected plan: ${planName} (${billingCycle})`);
    
    if (planName === 'Free') {
      setProcessing(true);
      try {
        const result = await authService.updateUserToWaiting();
        if (result.success) {
          navigate('/');
        } else {
          console.error('Failed to update user status:', result.error);
          alert('An error occurred. Please try again.');
        }
      } catch (error) {
        console.error('Error updating user:', error);
      } finally {
        setProcessing(false);
      }
      return;
    }

    if (planName === 'Enterprise' || planName === 'Team') {
      navigate('/apply-enterprise', { state: { plan: planName } });
      return;
    }

    window.location.href = `/enroll?package=${planName.toLowerCase()}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-inter overflow-y-auto">
      {/* Redesigned Compact Professional Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo Aligned Left */}
          <div className="flex-shrink-0">
            <img 
              src="https://drlevy.ai/logo.png" 
              alt="DrLevy AI" 
              className="h-8 object-contain" 
            />
          </div>
          
          {/* Branding Badge Aligned Right */}
          <div className="hidden sm:block">
            <div className="bg-[#0f172a] text-white px-3.5 py-1.5 text-[9px] font-black uppercase tracking-[0.25em] rounded-none">
              #1 AI platform for pharmacometrics
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Plans & Pricing
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-10 font-normal leading-relaxed">
            Choose the perfect plan to accelerate your research and team collaboration.
          </p>

          <div className="flex items-center justify-center space-x-4">
            <span className={`text-[11px] font-black uppercase tracking-widest cursor-pointer ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`} onClick={() => setBillingCycle('monthly')}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative inline-flex h-6 w-11 items-center rounded-none transition-colors focus:outline-none ${
                billingCycle === 'yearly' ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-none bg-white shadow-md transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-[11px] font-black uppercase tracking-widest cursor-pointer ${billingCycle === 'yearly' ? 'text-slate-900' : 'text-slate-400'}`} onClick={() => setBillingCycle('yearly')}>
              Yearly
            </span>
            {billingCycle === 'yearly' && (
              <span className="inline-flex items-center rounded-none bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-700 uppercase tracking-widest ml-2">
                Save 15%
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col p-6 bg-white rounded-none border transition-all duration-300 ${
                plan.recommended 
                  ? 'border-4 border-blue-600 shadow-2xl z-10 scale-[1.05]' 
                  : 'border-gray-200 shadow-sm hover:shadow-md'
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-5 py-1 rounded-none text-[10px] font-black uppercase tracking-widest flex items-center shadow-lg">
                  <Zap className="w-3 h-3 mr-1.5 fill-current" />
                  Most Popular
                </div>
              )}

              <div className="mb-4">
                <h3 className={`text-xl font-black uppercase tracking-tight ${plan.recommended ? 'text-blue-600' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-tight h-10 line-clamp-2 font-medium">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6 pb-6 border-b border-slate-100">
                <div className="flex items-baseline">
                  {plan.isCustom ? (
                    <span className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Custom</span>
                  ) : (
                    <>
                      <span className="text-4xl font-black text-slate-900 tracking-tighter">
                        ${billingCycle === 'monthly' ? plan.price.monthly : Math.round(plan.price.yearly! / 12 * 100) / 100}
                      </span>
                      {plan.price.monthly !== 0 && (
                        <span className="text-slate-500 text-[10px] ml-2 font-black uppercase tracking-tighter">
                          /mo {plan.name === 'Team' ? 'per user' : ''}
                        </span>
                      )}
                    </>
                  )}
                </div>
                {!plan.isCustom && plan.price.monthly !== 0 && (
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Billed {billingCycle}
                  </p>
                )}
                {plan.price.monthly === 0 && !plan.isCustom && (
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Free Forever
                  </p>
                )}
              </div>

              <div className="flex-1 mb-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  Everything included
                </p>
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className={`flex items-start text-xs ${feature.included ? 'text-slate-700' : 'text-slate-400'}`}>
                      {feature.included ? (
                        <Check className={`w-4 h-4 mr-3 flex-shrink-0 ${plan.recommended ? 'text-blue-600' : 'text-slate-500'}`} />
                      ) : (
                        <XCircle className="w-4 h-4 mr-3 flex-shrink-0 text-red-300" />
                      )}
                      <span className={`leading-tight font-medium ${!feature.included ? 'line-through opacity-50' : ''}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleEnroll(plan.name, plan.role)}
                disabled={processing}
                className={`w-full py-4 px-4 rounded-none text-xs font-black uppercase tracking-[0.15em] transition-all duration-200 focus:outline-none ${plan.buttonClass} ${processing ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {processing && plan.name === 'Free' ? 'Processing...' : (plan.isCustom || plan.name === 'Team' ? 'Contact Sales' : `Choose ${plan.name}`)}
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-10 text-center">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
            24/7 Enterprise Support • SOC 2 Type II Compliant • Secure Global Infrastructure
          </p>
          <p className="text-slate-400 text-[10px] mt-2 uppercase tracking-widest">
            Custom regulatory requirements? <a href="mailto:support@drlevy.ai" className="text-blue-600 font-black underline decoration-2 underline-offset-4">Contact Our Security Team</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;