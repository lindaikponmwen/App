
/**
 * Application Configuration
 * Centralized settings for theme, layout, and content.
 */

export const APP_CONFIG = {
  branding: {
    title: "Model",
    titleAccent: "Explorer",
    subTitle: "Pharmacometrics AI",
    footerText: "Processed via PMAI Engine v2.4",
  },
  
  layout: {
    sidebarWidth: 64, // px
    defaultPanelWidthPercent: 0.315, // 31.5%
    minPanelWidth: 200, // px
    maxPanelWidth: 800, // px
    aiPanelWidth: 320, // px
  },
  
  theme: {
    colors: {
      primary: "#2563eb", // Blue-600
      primaryDark: "#1d4ed8", // Blue-700
      primaryLight: "#dbeafe", // Blue-100
      accent: "#1a1f24", // Black/Gray
      bgMain: "#f8fafc", // Gray-50
      border: "#e2e8f0", // Gray-200
    },
    styles: {
      borderRadius: "0px", // Strict professional sharp edges
    }
  },

  defaults: {
    plot: {
      xAxis: 'TIME',
      yAxis: 'DV',
      title: 'New Analysis',
      xLabel: 'Time (hours)',
      yLabel: 'Observation (DV)',
      colorLabel: 'Treatment Group',
      theme: 'bw' as const,
      colorPalette: 'Set1',
      legendPosition: 'bottom' as const,
      facetBy: 'none',
      facetMode: 'none' as const,
      facetWrapVar: 'none',
      facetGridRow: 'none',
      facetGridCol: 'none',
      colorBy: 'GROUP',
      pointSize: 2,
      alpha: 0.7,
      axisTitleSize: 12,
      axisTextSize: 10,
      boxplotNotch: false,
      boxplotOverlayPoints: false,
      scatterShowLine: true,
      pairsVariables: [],
      lineShowPoints: true,
      histogramBins: 30,
      histogramFill: 'steelblue',
      histogramOutline: 'white',
      histogramShowDensity: true,
      histogramShowMeanLine: true,
      customRMutation: '',
    }
  }
};


// User and Project Data
export const currentUser = {
  id: '6',
  name: 'William Hane',
  email: 'wh@pharmacometrics.ai',
  avatar: 'http://pharmacometrics.ai/myavater.jpg',
  initials: 'WH',
  level:'owner'
};

export const teamMembers = [
  {
  id: '1',
  name: 'Dr. Sarah Chen',
  email: 'sarah.chen@research.com',
  avatar: 'https://images.pexels.com/photos/3823488/pexels-photo-3823488.jpeg?auto=compress&cs=tinysrgb&w=400',
  initials: 'SC',
  level:'administrator'
},
  {
    id: '2',
    name: 'Dr. Michael Rodriguez',
    email: 'michael.r@research.com',
    initials: 'MR',
    level:'owner'
  },
  {
    id: '3',
    name: 'Dr. Emily Watson',
    email: 'emily.watson@research.com',
    initials: 'EW',
    level:'member'
  },
  {
    id: '4',
    name: 'Dr. James Liu',
    email: 'james.liu@research.com',
    initials: 'JL',
    level:'member'
  }
];

export const currentProject = {
  id: '15',
  name: 'Nonlinear Mixed-Effects PK/PD Modeling of Monoclonal Antibody TAK-6742: Exposure-Response Analysis in Advanced Solid Tumors',
  description: 'TAK-6742, a humanized IgG1 monoclonal antibody targeting PD-L1, was evaluated in a first-in-human dose-escalation study (0.3 to 20 mg/kg Q3W) in 138 patients with advanced solid tumors. A two-compartment model with parallel linear and Michaelis-Menten elimination pathways characterized the nonlinear PK, with target-mediated drug disposition evident at doses <3 mg/kg. Receptor occupancy on circulating T-cells was modeled using an indirect response model, showing >90% occupancy at doses ≥10 mg/kg. Tumor response (RECIST 1.1) was analyzed as a categorical outcome using logistic regression, revealing a clear exposure-response relationship. Patients with Cavg >100 μg/mL had significantly higher objective response rates (32% vs 8%, p<0.01). Time-to-progression was best predicted by trough concentrations >50 μg/mL, supporting a flat dose of 480 mg Q3W for Phase 2 studies.',
  members: [currentUser, ...teamMembers],
  uniqueDataId: 'ggfd323rr422',
  createdAt: new Date('2024-11-01'),
  updatedAt: new Date('2025-01-15')
};