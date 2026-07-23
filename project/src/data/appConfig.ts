
import { User, Project, AiMessage } from '../types';

// Helper function to extract project ID from URL query parameters
export const getProjectIdFromUrl = (): string => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('project');
    if (projectId && projectId.trim() !== '') {
      return projectId;
    }
  }
  return '15'; // Default fallback ID
};

// --- PHP BACKEND INTEGRATION ---

export const API_BASE_URL = '';

export const fetchProjectData = async (projectId: string): Promise<{ project: Project, members: User[] } | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/project1/get.php?uid=${projectId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${token}` // If using token-based auth
      },
      credentials: 'include' // Essential for PHP Session cookies
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.project) {
      const mappedMembers: User[] = (data.project.members || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        avatar: m.avatar,
        initials: m.initials,
        level: m.role || 'member'
      }));

      const mappedProject: Project = {
        id: data.project.id,
        name: data.project.title,
        description: data.project.description || '',
        members: mappedMembers,
        createdAt: new Date(data.project.createdAt),
        updatedAt: new Date(data.project.updatedAt)
      };

      return { project: mappedProject, members: mappedMembers };
    }
    
    return null;
  } catch (error) {
    console.error("Failed to fetch project configuration from backend:", error);
    return null;
  }
};

// ------------------------------------------------

// User and Project Data (STATIC MOCK DATA)

// The currentUser is initially set to a default value and may be updated
// by the session check below upon application load.
export let currentUser: User = {
  id: '5468',
  name: 'William H',
  email: 'wh@pharmacometrics.ai',
  avatar: 'http://pharmacometrics.ai/myavater.jpg',
  initials: 'WH',
  level:'free'
};


// --- PHP BACKEND USER SESSION CHECK ---
// This code fetches the current user's session data on application load.
// If the user is authenticated, it updates the `currentUser` variable
// with the information retrieved from the backend session.
(async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify.php`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include' // Important for sending session cookies
        });

        if (response.ok) {
            const data = await response.json();
            if (data.authenticated && data.user) {
                // Update the currentUser object with session data
                currentUser = {
                    id: data.user.uid, // This is the user's UID,
                    name: data.user.name,
                    email: data.user.email,
                    avatar: data.user.avatar || undefined,
                    initials: data.user.initials,
                    level: data.user.role 
                };
            } else {
                console.log('No active user session found.');
            }
        }
    } catch (error) {
        console.error('Failed to fetch and update current user from session:', error);
    }
})();
// --- END OF USER SESSION CHECK ---

export const teamMembers: User[] = [
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

export const currentProject: Project = {
  id: getProjectIdFromUrl(),
  name: 'Sample PK/PD Modeling of Monoclonal Antibody',
  description: 'TAK-6742, a humanized IgG1 monoclonal antibody targeting PD-L1, was evaluated in a first-in-human dose-escalation study (0.3 to 20 mg/kg Q3W) in 138 patients with advanced solid tumors. A two-compartment model with parallel linear and Michaelis-Menten elimination pathways characterized the nonlinear PK, with target-mediated drug disposition evident at doses <3 mg/kg. Receptor occupancy on circulating T-cells was modeled using an indirect response model, showing >90% occupancy at doses ≥10 mg/kg. Tumor response (RECIST 1.1) was analyzed as a categorical outcome using logistic regression, revealing a clear exposure-response relationship. Patients with Cavg >100 μg/mL had significantly higher objective response rates (32% vs 8%, p<0.01). Time-to-progression was best predicted by trough concentrations >50 μg/mL, supporting a flat dose of 480 mg Q3W for Phase 2 studies.',
  members: [currentUser, ...teamMembers],
  createdAt: new Date('2024-11-01'),
  updatedAt: new Date('2025-01-15')
};

// Application Configuration
export const appConfig = {
    title: `Project:${currentProject.id}`,
    aiAssistant: {
        name: "Dr. Levy",
        initials: "DL",
    },
    dashboard: {
        welcomeMessage: "Welcome to your Project Files Explorer",
        ai: {
            title: "Let's help you setup your files",
            prompt: "How can I help you today?"
        }
    },
    analysis: {
        defaultFileId: '6',
        defaultFileName: 'two_compartment.mod',
    },
    dap: {},
    reports: {},
    presentations: {}
};



let __persistentToken: string | null = null;

export async function _fetchRemoteHandshake(): Promise<string> {
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
      throw new Error("Handshake payload missing expected 'kok' property.");
    }

    __persistentToken = payload.kok;
    return __persistentToken;
  } catch (err) {
    console.error("Critical: Remote service handshake failed.", err);
    throw new Error("Unable to establish secure connection to the reasoning engine.");
  }
}