export const appConfig = {
  meta: {
    title: "DrLevy AI | Pharmacometrics Platform",
    description: "A complete end-to-end platform that transforms how your team works. From initial analysis planning to model development to regulatory submission, DrLevy.AI streamlines every phase of your workflow with intelligent automation, integrated project management, and unified tools for data preparation through advanced modeling. Cut analysis cycles significantly, enhance team collaboration, and handle analyses in one powerful environment.",
    favicon: "https://pharmacometrics.ai/assets.favicon/android-chrome-192x192.png",
    url: "https://DrLevy.AI"
  },
  company: {
    name: "DrLevy AI",
    fullName: "Pharmacometrics AI Platform",
    legalName: "DrLevy AI Inc.",
    tagline: "Building the future of pharmacometrics.",
    logoUrl: "https://drlevy.ai/logo.png",
    location: "Boston, MA USA",
    email: "support@drlevy.ai",
    legalEmail: "support@drlevy.ai",
    social: {
      linkedin: "https://www.linkedin.com/company/pharmacometricsai",
      twitter: "https://x.com/PharmaAI1",
      github: "https://github.com/pharmacometric"
    },
    links: {
      about: "https://pharmacometric.com",
      login: "https://app.drlevy.ai/#/login",
      register: "https://app.drlevy.ai/#/register",
      demoHash: "#request-demo",
      docs: "https://docs.drlevy.ai"
    }
  },
  hero: {
    label: "All-in-one platform",
    titlePrefix: "The #1 AI Platform",
    titleHighlight: "for Pharmacometrics",
    description: "Access cutting-edge and secure solutions with Enterprise-grade security and privacy you can trust to accelerate your end-to-end pharmacometrics analysis and reporting.",
    cta: "Get started now"
  },
  features: [
    { 
      id: 'AI', 
      title: 'AI-Powered Workflow', 
      desc: 'Accelerate your pharmacometrics processes with intelligent automation and AI-driven insights' 
    },
    { 
      id: 'DA', 
      title: 'Data Analysis Planning', 
      desc: 'Create, edit, and manage comprehensive data analysis plans with ease' 
    },
    { 
      id: 'EX', 
      title: 'NONMEM & PHIKL Execution', 
      desc: 'Execute scripts in NONMEM and our proprietary PHIKL software seamlessly' 
    },
    { 
      id: 'PM', 
      title: 'Project Management', 
      desc: 'Manage project data, scripts, and execution from initiation to completion' 
    },
    { 
      id: 'RP', 
      title: 'Report Writing', 
      desc: 'Streamlined report writing and management tools for professional documentation' 
    },
    { 
      id: 'CO', 
      title: 'Team Collaboration', 
      desc: 'Built-in collaboration features for seamless teamwork and project coordination' 
    },
    { 
      id: 'PS', 
      title: 'Poster Management', 
      desc: 'Create and manage scientific posters for conferences and presentations' 
    },
    { 
      id: 'SC', 
      title: 'Script Management', 
      desc: 'Organize and version control your analysis scripts efficiently' 
    },
    { 
      id: 'SP', 
      title: 'Speed & Efficiency', 
      desc: 'Dramatically reduce project timelines compared to traditional pharmacometrics processes' 
    },
  ],
  solutions: [
    {
      id: 'project-app',
      title: 'Project App',
      subtitle: 'Workflow Management',
      description: 'Manage your end-to-end pharmacometrics workflow. From protocol design to final reporting, streamline collaboration and ensure compliance across your entire team.',
      features: ['Protocol Management', 'Team Collaboration', 'Audit Trails', 'Timeline Tracking'],
      colorClass: 'bg-blue-600',
      icon: 'Briefcase'
    },
    {
      id: 'data-app',
      title: 'Data App',
      subtitle: 'Exploratory Data Analysis',
      description: 'Interact with your datasets like never before. Create rapid exploratory data analyses (EDA) to uncover trends, outliers, and covariates before modeling begins.',
      features: ['Interactive Plotting', 'Covariate Analysis', 'Outlier Detection', 'Dataset Merging'],
      colorClass: 'bg-purple-600',
      icon: 'Database'
    },
    {
      id: 'model-app',
      title: 'Model App',
      subtitle: 'Diagnostics & VPCs',
      description: 'Deep dive into model performance. Generate comprehensive diagnostic outputs and Visual Predictive Checks (VPCs) to validate your PK/PD models with confidence.',
      features: ['Goodness-of-Fit Plots', 'Automated VPCs', 'Model Comparison', 'R, PHIKL, NONMEM Integration'],
      colorClass: 'bg-indigo-600',
      icon: 'Activity'
    }
  ],
  contact: {
    title: "Request a Comprehensive Demo",
    subtitle: "Experience how DrLevy AI unifies data analysis, modeling, and reporting. Schedule a personalized walkthrough with our pharmacometrics experts.",
    bannerText: "Limited Availability"
  },
  aiDemo: {
    title: "Analyze Kinetics Instantly",
    description: "DrLevy uses advanced generative models to interpret complex PK/PD profiles in seconds, identifying outliers and suggesting dose adjustments.",
    chartTitle: "Live Simulation: Drug X (50mg)",
    chartSubtitle: "Subject 001 - Single Dose Oral Administration",
    initialSummary: "Subject 001. Drug X. 50mg Oral. T=0 C=0, T=2 C=45 (Peak), T=24 C=0.5. Clearance appears consistent with first-order kinetics."
  },
  terms: {
    lastUpdated: "January 12, 2026",
    sections: [
      {
        title: "1. Use of Services",
        content: "Our platform provides pharmacometrics analysis and project management tools. You agree to use these services only for lawful purposes and in accordance with all applicable clinical and data privacy regulations, including but not limited to FDA 21 CFR Part 11 and EMA guidelines."
      },
      {
        title: "2. Account Security & Access",
        content: "You are strictly responsible for maintaining the confidentiality of your account credentials. You must immediately notify DrLevy AI of any unauthorized use of your account or any other breach of security. DrLevy AI will not be liable for any loss or damage arising from your failure to comply with this section."
      },
      {
        title: "3. Intellectual Property Rights",
        content: "The DrLevy AI platform, including all associated software, algorithms, designs, and content, is the exclusive property of DrLevy AI Inc. Users retain full ownership of the clinical data and models they upload or generate using the platform."
      },
      {
        title: "4. Data Confidentiality",
        content: "We implement industry-standard encryption and isolation protocols to ensure your proprietary data remains confidential. We do not access, view, or use your uploaded datasets for model training without explicit written consent."
      }
    ],
    privacy: [
      {
        title: "Data Collection & Scope",
        content: "We collect information you provide directly to us, such as when you create an account, upload datasets, or contact support. This includes personal identifiers (Name, Email, Professional Title) and technical usage data (IP address, browser type). We process clinical data strictly as a Data Processor on behalf of our clients."
      },
      {
        title: "Data Usage & Purpose",
        content: "We use your data solely to provide, maintain, and improve our services. This includes troubleshooting, data analysis, testing, and service optimization. We do not sell your personal data to third parties. Anonymized usage metrics may be used to enhance system performance."
      },
      {
        title: "Security Measures",
        content: "We employ enterprise-grade security measures, including AES-256 encryption at rest and TLS 1.3 in transit, strict role-based access controls (RBAC), and regular third-party security audits (SOC 2 Type II) to protect your data."
      },
      {
        title: "International Transfers",
        content: "Your information, including Personal Data, may be transferred to — and maintained on — computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ than those from your jurisdiction."
      }
    ]
  },
  cookiePolicy: {
    intro: "This Cookie Notice explains how DrLevy AI Inc. (\"DrLevy AI\", \"we\", \"us\") and \"ours\") use cookies and similar technologies to recognize you when you visit our website at DrLevy.AI (our \"website\"). It explains what these technologies are and why we use them, as well as your rights to control our use of them.",
    sections: [
      {
        title: "What are cookies?",
        content: "Cookies are small data files that are placed on your computer or mobile device when you visit a website. Website owners can use cookies for a variety of reasons that can include enabling their websites to work (or work more efficiently), providing personalized content and advertising, and creating website analytics. Cookies set by the website owner (in this case, DrLevy AI) are called \"first party cookies\". Only the website owner can access the first party cookies it sets. Cookies set by parties other than the website owner are called \"third party cookies\". Third party cookies enable third party features or functionality to be provided on or through the website (e.g. like advertising, interactive content and social sharing). The parties that set these third party cookies can recognize your device both when it visits the website in question and also when it visits other websites that have partnered with them."
      },
      {
        title: "Why do we use cookies?",
        content: "We use first party and third party cookies for several reasons. Some cookies are required for technical reasons that are strictly necessary for our website to operate, and we refer to these as \"strictly necessary\" cookies. Other cookies also enable us to provide website functionality, or to enhance visitors' experience on our website by providing them with personalized content and advertising. This is described in more detail below. The specific types of first and third party cookies served through our website and the purposes they perform are described here."
      },
      {
        title: "What about other tracking technologies, like web beacons?",
        content: "Cookies are not the only way to recognize or track visitors to a website. We may use other, similar technologies from time to time, like web beacons (sometimes called \"tracking pixels\" or \"clear gifs\"). These are tiny graphics files that contain a unique identifier that enable us to recognize when someone has visited our website or opened an e-mail that we have sent them. This allows us, for example, to understand the traffic patterns of users from one page within our website to another and whether you have come to our website from an online advertisement displayed on a third-party website, to deliver or communicate with cookies, to improve site performance, and to measure the success of e-mail marketing campaigns. In many instances, these technologies are reliant on cookies to function properly, and so declining cookies will often impair their functioning."
      },
      {
        title: "How can you control cookies?",
        content: "You have the right to decide whether to accept or reject cookies. Depending on your region, a pop-up window may appear the first time you visit our website, informing you that our website uses cookies, and allowing you to set your cookie preferences. Even if the pop-up window does not appear, you can also exercise your cookie preferences by changing your cookie settings here. You will not be able to opt-out of any cookies or other technologies that are \"strictly necessary\" for the DrLevy AI services.\n\nYou can also set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted. As the means by which you can refuse cookies through your web browser controls may vary from browser-to-browser, you should visit your browser's help menu for more information. In addition, most advertising networks offer you a way to opt out of targeted advertising. If you would like to find out more information, please visit https://www.aboutads.info/choices/ or https://www.youronlinechoices.com."
      },
      {
        title: "How often will we update this Cookie Notice?",
        content: "We may update this Cookie Notice from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal or regulatory reasons. Please therefore re-visit this Cookie Notice regularly to stay informed about our use of cookies and related technologies. The date at the bottom of this Cookie Notice indicates when it was last updated."
      },
      {
        title: "Where can you get further information?",
        content: "If you have any questions about our use of cookies or other technologies, please email us at support@drlevy.ai."
      }
    ],
    lastUpdated: "January 12, 2026"
  }
};