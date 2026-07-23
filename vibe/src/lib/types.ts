export type AgentRole =
  | 'scientist_ii'
  | 'project_manager'
  | 'pharmacometrician'
  | 'data_manager'
  | 'medical_writer'
  | 'qc_manager';

export type ChecklistStatus = 'pending' | 'complete';
export type ChecklistItemType = 'task' | 'section' | 'note';
export type InvocationStatus = 'pending' | 'running' | 'success' | 'partial_success' | 'failure';
export type SessionStatus = 'active' | 'completed' | 'archived';
export type AnalysisType = 'PopPK' | 'PKPD' | 'NCA' | 'Covariate' | 'VPC' | 'PBPK' | 'QSP' | 'Other';

export interface Session {
  id: string;
  name: string;
  compound?: string;
  software_stack?: string;
  analysis_type?: string;
  data_status: 'uploaded' | 'to_be_created' | 'unknown';
  hitl_enabled: boolean;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  agent?: AgentRole;
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  session_id: string;
  section_number?: string;
  section_title?: string;
  item_ref?: string;
  description: string;
  status: ChecklistStatus;
  item_type: ChecklistItemType;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PromptEnvelope {
  envelope_id: string;
  timestamp: string;
  agent_role: AgentRole;
  task: {
    checklist_ref: string;
    description: string;
    priority: 'critical' | 'high' | 'normal';
  };
  context: {
    compound?: string;
    software_stack?: string;
    analysis_type?: string;
    session_id: string;
    relevant_files?: { role: string; path: string }[];
    prior_results_summary?: string;
    scientist_ii_notes?: string;
  };
  parameters?: Record<string, unknown>;
  output: {
    expected_artifacts?: { type: string; path: string }[];
  };
}

export interface EnvelopeResponse {
  envelope_id: string;
  agent_role: AgentRole;
  status: InvocationStatus;
  task_summary: string;
  message_to_user: string;
  artifacts_produced?: { type: string; path: string; content: string }[];
  findings?: {
    type: 'observation' | 'warning' | 'error';
    severity: 'info' | 'minor' | 'major' | 'critical';
    message: string;
    suggested_action?: string;
  }[];
  checklist_updates?: {
    action: 'complete' | 'add' | 'modify';
    ref?: string;
    description?: string;
    section?: string;
    item_type?: ChecklistItemType;
  }[];
}

export interface Invocation {
  id: string;
  session_id: string;
  envelope_id: string;
  agent_role: AgentRole;
  checklist_ref?: string;
  status: InvocationStatus;
  request_payload?: PromptEnvelope;
  response_payload?: EnvelopeResponse;
  task_summary?: string;
  created_at: string;
  completed_at?: string;
}

export interface Artifact {
  id: string;
  session_id: string;
  path: string;
  artifact_type: string;
  content?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface OrchestratorResult {
  message: string;
  agentRole?: AgentRole;
  checklistUpdates?: EnvelopeResponse['checklist_updates'];
  artifacts?: EnvelopeResponse['artifacts_produced'];
  hitlPause?: boolean;
  hitlChecklistPreview?: ChecklistItem[];
}
