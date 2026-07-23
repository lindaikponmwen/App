
import React from 'react';
// [FIX] Added missing User and Check icons to the lucide-react imports
import { ArrowLeft, HelpCircle, Shield, Zap, FileText, Globe, Info, Lock, Users, User, BarChart3, Search, Folder, Sparkles, MessageSquare, ShieldCheck, Cpu, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface HelpPageProps {
  onBack: () => void;
}

export default function HelpPage({ onBack }: HelpPageProps) {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate('/');
  };

  const operationalGuides = [
    {
      icon: Folder,
      title: 'Project Lifecycle Management',
      details: [
        'Initiation: Create projects via "AI Assistant" for automated technical documentation or "Manual Entry" for custom setups.',
        'Metadata: Define clinical phases, analysis types (NCA, PopPK, etc.), and technical keywords for indexing.',
        'Collaborators: Assign specific research units to projects to enable shared data streams.',
        'Constraints: Standard Member accounts are restricted to one active project; upgrade for unlimited research clusters.'
      ]
    },
    {
      icon: Users,
      title: 'Team & Personnel Operations',
      details: [
        'Registry Search: Identify existing organizational researchers by name or email to add them to your specific team.',
        'External Invitations: Securely invite new collaborators outside the platform via email with assigned protocol roles.',
        'Role-Based Access: Assign PI, Scientist, Analyst, or Coordinator roles to control granular permissions.',
        'Communication: Utilize the "Broadcast Transmission" to send secure, prioritized updates to all team members simultaneously.'
      ]
    },
    {
      icon: User,
      title: 'Profile & Secure Communication',
      details: [
        'Identity: Maintain legal name, academic titles, and professional bios within your secure identification card.',
        'Direct Messaging: Initiate peer-to-peer secure data transmissions via the Messaging Terminal.',
        'Credentials: Manage professional affiliations, department mapping, and hire date tracking for institutional audits.',
        'Verification: All profile updates are logged in the system audit trail for security compliance.'
      ]
    }
  ];

  const features = [
    {
      icon: Cpu,
      title: 'AI Pharmacometric Assistant',
      description: 'Leverage LLM technology to generate technical project descriptions, identify relevant keywords, and select appropriate analysis methodologies based on short research abstracts.'
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Monitor platform-wide usage metrics, storage utilization, and team productivity through a centralized dashboard with growth trend tracking.'
    },
    {
      icon: Lock,
      title: 'Zero-Trust Architecture',
      description: 'Every data transmission and access request is verified. Inactivity auto-locks and 2FA protect sensitive research data at the protocol level.'
    },
    {
      icon: ShieldCheck,
      title: 'Regulatory Compliance',
      description: 'Native support for HIPAA and GDPR standards, featuring automated audit logging for all data modifications and user access events.'
    }
  ];

  const privacyPoints = [
    'Enterprise-grade AES-256 encryption for data at rest and in transit.',
    'Zero third-party data sharing; your research remains strictly internal to your organization.',
    'Granular permission layers prevent unauthorized horizontal data access across research teams.',
    'Persistent audit logs track all system activity, searchable by administrators for compliance reporting.',
    'Automated session management including secure lockouts and token-based CSRF protection.'
  ];

  return (
    <div className="flex-1 bg-gray-50 overflow-hidden font-inter">
      <div className="h-full overflow-y-auto">
        <div className="p-6">
          <div className="max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="mb-10">
              <button
                onClick={handleBackClick}
                className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 transition-colors mb-8 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-black uppercase tracking-widest">Back to Terminal</span>
              </button>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-slate-900 flex items-center justify-center rounded-none shadow-lg">
                  <HelpCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">System Documentation</h1>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Operational protocols for DrLevy.Ai v2.5</p>
                </div>
              </div>
            </div>

            <div className="space-y-10">
              
              {/* Core Application Info */}
              <div className="bg-white border border-slate-200 p-8 rounded-none shadow-sm">
                <div className="flex items-center space-x-3 mb-8 pb-4 border-b border-slate-100">
                  <Info className="w-5 h-5 text-blue-600" />
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">General Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Version Control</h3>
                    <p className="text-lg font-black text-slate-900">2.5 Enterprise</p>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Build Environment</h3>
                    <p className="text-sm font-bold text-slate-700">Stable Node Cluster</p>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Technical Docs</h3>
                    <a
                      href="https://docs.drlevy.ai/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors font-black text-sm uppercase tracking-tight"
                    >
                      <Globe className="w-4 h-4" />
                      <span>docs.drlevy.ai</span>
                    </a>
                  </div>
                </div>
                
                <div className="mt-8 pt-8 border-t border-slate-50">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">System Description</h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    DrLevy.Ai is an end-to-end pharmacometric integration platform. It centralizes pharmacokinetic modeling workflows, 
                    team communications, and regulatory data management into a single secure environment. Optimized for 
                    clinical research organizations (CROs) and academic pharmcometrics departments.
                  </p>
                </div>
              </div>

              {/* Operational Procedures - NEW SECTION */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-2">
                  <FileText className="w-5 h-5 text-slate-900" />
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Operational Procedures</h2>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  {operationalGuides.map((guide, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 p-8 rounded-none hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="p-3 bg-slate-50 border border-slate-100">
                          <guide.icon className="w-6 h-6 text-slate-900" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{guide.title}</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {guide.details.map((detail, dIdx) => (
                          <div key={dIdx} className="flex items-start space-x-3 p-3 bg-slate-50/50 border border-slate-50">
                            <div className="w-1.5 h-1.5 bg-blue-600 shrink-0 mt-1.5"></div>
                            <p className="text-xs text-slate-600 font-bold leading-relaxed">{detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Platform Features Grid */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-2">
                  <Zap className="w-5 h-5 text-slate-900" />
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Architecture Modules</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-6 p-6 bg-white border border-slate-200 rounded-none group hover:border-slate-400 transition-colors">
                      <div className="w-12 h-12 bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100 group-hover:bg-slate-900 transition-colors">
                        <feature.icon className="w-6 h-6 text-slate-900 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2">{feature.title}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed font-bold uppercase">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Protection Protocols */}
              <div className="bg-slate-900 p-10 rounded-none">
                <div className="flex items-center space-x-4 mb-8">
                  <Shield className="w-6 h-6 text-emerald-400" />
                  <h2 className="text-lg font-black text-white uppercase tracking-tighter">Security & Privacy Protocols</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  {privacyPoints.map((point, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="w-4 h-4 bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                      </div>
                      <p className="text-xs text-slate-300 font-bold uppercase leading-relaxed tracking-wide">{point}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-12 p-6 bg-emerald-500/5 border border-emerald-500/20 flex items-start space-x-4">
                  <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">Active Compliance Certification</h4>
                    <p className="text-xs text-slate-400 font-bold leading-relaxed uppercase">
                      DrLevy.Ai 2.5 is certified for SOC 2 Type II and HIPAA data processing. All research environments 
                      operate within isolated sandbox clusters to ensure maximum cryptographic integrity.
                    </p>
                  </div>
                </div>
              </div>

              {/* System Requirements */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 p-6 rounded-none">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Optimized Browser</h3>
                  <ul className="text-[10px] font-black text-slate-700 uppercase space-y-2">
                    <li className="flex justify-between"><span>Chrome</span> <span className="text-blue-600">v90+</span></li>
                    <li className="flex justify-between"><span>Firefox</span> <span className="text-blue-600">v88+</span></li>
                    <li className="flex justify-between"><span>Safari</span> <span className="text-blue-600">v14+</span></li>
                  </ul>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-none">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Hardware Specs</h3>
                  <ul className="text-[10px] font-black text-slate-700 uppercase space-y-2">
                    <li className="flex justify-between"><span>Memory</span> <span className="text-slate-900">8GB Min</span></li>
                    <li className="flex justify-between"><span>Display</span> <span className="text-slate-900">13" +</span></li>
                    <li className="flex justify-between"><span>Network</span> <span className="text-slate-900">Broadband</span></li>
                  </ul>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-none flex flex-col justify-center items-center text-center">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Protocol Status</h3>
                  <div className="flex items-center space-x-2 text-emerald-600 font-black text-xs uppercase tracking-tighter">
                    <div className="w-2 h-2 bg-emerald-500 animate-pulse"></div>
                    <span>All Systems Nominal</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
