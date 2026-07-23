export interface HelpAgent {
  name: string;
  description: string;
}

export interface HelpFolder {
  name: string;
  description: string;
}

export interface HelpPage {
  name: string;
  path: string;
  description: string;
  folders?: HelpFolder[];
}

export interface HelpFeature {
  name: string;
  description: string;
}

export const helpAgents: HelpAgent[] = [
  {
    name: 'Dr. Levy',
    description: 'An AI assistant with expertise in pharmacometrics, pharmacokinetics, pharmacodynamics, and pharmacology. Your go-to for clear and concise answers to general questions in these domains.'
  },
  {
    name: 'Project Setup',
    description: 'An expert pharmacometrics project manager to help set up project files and folders. Proactively suggests best practices for file organization for NONMEM, Monolix, or R-based projects.'
  },
  {
    name: 'Coding Co-pilot',
    description: 'An expert programmer specializing in R, Python, NONMEM, and Monolix for pharmacometrics. Helps write, debug, and understand code by providing clear explanations and snippets.'
  },
  {
    name: 'Report and Presentation Expert',
    description: 'A senior pharmacometrician and statistician who can draft and update reports and presentations. Also advises on modeling strategies, statistical methods, and study design, explaining complex concepts clearly.'
  }
];

export const helpPages: HelpPage[] = [
  {
    name: 'Dashboard',
    path: '/',
    description: 'The main project overview page. It provides a summary of the project, lists contributors, and offers quick navigation to all other sections of the application.',
  },
  {
    name: 'Data Analysis Plan',
    path: '/dap',
    description: 'Manage and edit documents related to the Data Analysis Plan (DAP). This includes initial drafts and final, signed versions of the plan.',
    folders: [
      { name: 'Initial Plan', description: 'Contains draft versions of the DAP, typically in editable formats like Markdown (.md) or Word (.docx).' },
      { name: 'Final Plan', description: 'Stores the final, approved versions of the DAP, often in non-editable formats like PDF.' },
    ]
  },
  {
    name: 'Analysis Scripts & Data',
    path: '/analysis',
    description: 'The core workspace for conducting analysis. Here you can manage, edit, and run models, scripts, and view your data and results.',
    folders: [
      { name: 'Data', description: 'Contains raw and processed datasets, typically in CSV, XLS, or XPT format.' },
      { name: 'Models', description: 'Stores model control files, such as NONMEM (.mod, .ctl) or Monolix (.mlxtran) files.' },
      { name: 'Scripts', description: 'Holds analysis scripts written in languages like R (.R) or Python (.py) for data processing, model execution, and diagnostics.' },
      { name: 'Results', description: 'Contains the output from model runs, such as parameter estimates, diagnostic plots, and result tables.' },
    ]
  },
  {
    name: 'Reports',
    path: '/reports',
    description: 'A dedicated section for creating, viewing, and managing interim and final study reports.',
    folders: [
      { name: 'Initial Reports', description: 'For draft versions of reports and preliminary findings.' },
      { name: 'Final Reports', description: 'For the final, polished study reports and summaries intended for publication.' },
    ]
  },
  {
    name: 'Presentations',
    path: '/presentations',
    description: 'Organize and edit materials for conferences and meetings, including abstracts, posters, and slide decks.',
    folders: [
      { name: 'Abstracts', description: 'Contains abstracts for submission to conferences.' },
      { name: 'Posters', description: 'Stores scientific posters for presentations.' },
      { name: 'Talks', description: 'Holds slide decks for oral presentations and internal updates.' },
    ]
  },
  {
    name: 'Library',
    path: '/library',
    description: 'A personal space to manage your own files and saved research articles from literature searches. It also shows a breakdown of your project storage usage.'
  }
];

export const timeManagementFeatures: HelpFeature[] = [
    {
        name: 'Task & Time Manager',
        description: 'Access the manager by clicking the checkmark icon in the sidebar. This central hub lets you organize your to-do list and track time against specific tasks.',
    },
    {
        name: 'Adding Tasks',
        description: 'Simply type your task into the input field at the top of the modal and press Enter or click the "+" button to add it to your list.',
    },
    {
        name: 'Managing Tasks',
        description: 'Mark tasks as complete by clicking the checkbox. Hover over a task to reveal options to edit its text or delete it entirely.',
    },
    {
        name: 'Setting Timers',
        description: 'Click the clock icon next to any task to set a timer. This is great for time-boxing activities like "Review Model Output" for 30 minutes.',
    },
    {
        name: 'Timer Controls',
        description: 'Once a timer is set, you can start, pause, and reset it. The remaining time is always visible.',
    },
    {
        name: 'Notifications',
        description: 'When a timer finishes, you will receive a toast notification. The task icon in the sidebar will also show a red dot to indicate a completed timer you haven\'t seen yet.',
    },
];
