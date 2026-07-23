// Re-export everything from config.ts for backwards compatibility.
// New code should import directly from './config'.
export {
  OPENROUTER_API_URL as OPENROUTER_API,
  OPENROUTER_DEFAULT_API_KEY as DEFAULT_API_KEY,
  MODELS,
  AGENT_LABELS,
  AGENT_COLORS,
  AGENT_AVATAR_COLORS,
  AGENT_INITIALS,
  DEFAULT_CHECKLIST_SECTIONS,
  PROJECT_FOLDERS,
  detectFolder,
  ANALYSIS_SUGGESTIONS,
  SCOPE_KEYWORDS,
} from './config';
