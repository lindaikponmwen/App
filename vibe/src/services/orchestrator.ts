import { callLLM } from '../lib/openrouter';
import {
  SCOPE_KEYWORDS,
  AGENT_LABELS,
  LLM_MAX_TOKENS_ORCHESTRATOR,
  LLM_MAX_TOKENS_SUBAGENT,
  ORCHESTRATOR_HISTORY_WINDOW,
  ORCHESTRATOR_PRIOR_CONTEXT_MESSAGES,
  ORCHESTRATOR_PRIOR_CONTEXT_CHARS,
  AUTONOMOUS_MAX_TASKS,
  PROJECT_FOLDERS,
  sanitizeArtifactPath,
} from '../lib/config';
import type {
  Session,
  ChecklistItem,
  Message,
  EnvelopeResponse,
  AgentRole,
  OrchestratorResult,
} from '../lib/types';
import {
  getChecklist,
  getNextPendingTask,
  updateChecklistItem,
  addChecklistItem,
  createDefaultChecklist,
  addArtifact,
  getArtifacts,
} from './sessionService';
import { createInvocation, completeInvocation } from './invocationService';

/** Extract the first complete JSON object from a raw LLM response, handling
 *  markdown code fences, thinking tags, and leading/trailing prose.
 *  Uses a string-aware brace tracker so { } inside string values don't
 *  confuse the depth counter. Then applies progressive JSON repair. */
function extractJson(raw: string): Record<string, unknown> {
  // Strip markdown code fences and thinking blocks
  let s = raw.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '');
  s = s.replace(/<think(?:ing)?>[^]*?<\/think(?:ing)?>/gi, '');

  const start = s.indexOf('{');
  if (start === -1) throw new Error('No JSON object found');

  // String-aware brace tracking: ignore { } inside quoted strings
  let depth = 0, inStr = false, esc = false, end = -1;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (esc)       { esc = false; continue; }
    if (c === '\\' && inStr) { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr)     { continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) throw new Error('Unterminated JSON object');

  const slice = s.slice(start, end + 1);

  // Attempt 1: direct parse
  try { return JSON.parse(slice); } catch { /* continue */ }

  // Attempt 2: fix trailing commas before } or ]
  const a2 = slice.replace(/,(\s*[}\]])/g, '$1');
  try { return JSON.parse(a2); } catch { /* continue */ }

  // Attempt 3: escape literal (unescaped) newlines / tabs inside string literals
  const a3 = slice.replace(/"((?:[^"\\]|\\.)*)"/gs, m =>
    m.replace(/(?<!\\)\n/g, '\\n').replace(/(?<!\\)\r/g, '\\r').replace(/(?<!\\)\t/g, '\\t')
  );
  try { return JSON.parse(a3); } catch { /* continue */ }

  // Attempt 4: both repairs combined
  const a4 = a3.replace(/,(\s*[}\]])/g, '$1');
  return JSON.parse(a4); // throws if still invalid
}

/** Fallback: if full JSON parse fails, try regex to pull the message field only. */
function extractMessageFallback(raw: string): string | null {
  // Match "message": "..." or "message_to_user": "..."
  const m = raw.match(/"(?:message|message_to_user)"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
  if (m) return m[1].replace(/\\n/g, '\n').replace(/\\t/g, '  ');
  return null;
}

/** Clean a message string: convert escaped \n sequences to real newlines,
 *  strip any residual JSON envelope if the message field contains raw JSON. */
function cleanMessage(msg: string): string {
  if (!msg) return msg;
  // If the string itself looks like a full JSON response envelope, extract message from it
  if (msg.trimStart().startsWith('{')) {
    // Try full parse first
    try {
      const parsed = extractJson(msg) as Record<string, unknown>;
      const inner = parsed.message || parsed.message_to_user;
      if (typeof inner === 'string') return cleanMessage(inner);
    } catch { /* fall through */ }
    // Try regex fallback
    const fallback = extractMessageFallback(msg);
    if (fallback) return fallback;
  }
  // Replace literal \n sequences with actual newlines
  return msg.replace(/\\n/g, '\n').replace(/\\t/g, '  ');
}

function isInScope(text: string): boolean {
  const lower = text.toLowerCase();
  return SCOPE_KEYWORDS.some(kw => lower.includes(kw));
}

function buildScientistIISystemPrompt(session: Session, checklist: ChecklistItem[]): string {
  const pendingTasks = checklist
    .filter(i => i.item_type === 'task' && i.status === 'pending')
    .slice(0, 5);
  const completedCount = checklist.filter(i => i.item_type === 'task' && i.status === 'complete').length;
  const totalCount = checklist.filter(i => i.item_type === 'task').length;

  return `You are Scientist II — the lead pharmacometrics orchestrator and expert for an advanced multi-agent analysis system. You are a senior pharmacometrician with deep expertise in population PK/PD modeling, NONMEM, nlmixr2, clinical pharmacology, and MIDD.

CURRENT SESSION:
- Compound: ${session.compound || 'Not specified'}
- Analysis Type: ${session.analysis_type || 'Not specified'}
- Software: ${session.software_stack || 'Not specified'}
- Progress: ${completedCount}/${totalCount} tasks complete

NEXT PENDING TASKS:
${pendingTasks.length > 0 ? pendingTasks.map(t => `  [${t.item_ref}] ${t.description}`).join('\n') : '  All tasks complete!'}

YOUR ROLE:
1. Receive all user requests and validate they are within clinical pharmacology / pharmacometrics / QSP scope
2. Orchestrate the analysis workflow by delegating to specialized sub-agents
3. Maintain scientific rigor and provide expert pharmacometrics guidance
4. Update the checklist based on analysis findings
5. Provide adaptive intelligence — modify tasks based on emerging results

RESPONSE FORMAT:
Always respond in valid JSON only (no markdown code blocks). Use this schema:
{
  "action": "respond" | "delegate" | "hitl_pause" | "complete",
  "message": "Your message to the user (use markdown formatting, be scientifically precise)",
  "agent_role": "project_manager" | "pharmacometrician" | "data_manager" | "medical_writer" | "qc_manager" | null,
  "checklist_updates": [
    { "action": "complete", "ref": "1.1" },
    { "action": "add", "description": "New task description", "section": "3", "item_type": "task" },
    { "action": "modify", "ref": "2.4", "description": "Updated description" }
  ],
  "artifacts": [
    { "path": "Reports/1.1_define_analysis_objectives_and_scope.md", "type": "document", "content": "Full markdown content here..." }
  ],

ARTIFACT RULES:
- ALWAYS include an artifact when completing or responding to a checklist task
- Document files (.md, .docx, .doc, .txt) → Reports/
- Dataset files (.csv, .tab, .xls, .xlsx) → Data/
- Scripts (.R, .py, .cpp, .jl and other scripts) → Scripts/  (e.g. Scripts/R/, Scripts/Models/, Scripts/NONMEM/)
  "sub_agent_task": "Description of what the sub-agent should do (if delegating)"
}

DOMAIN RULES:
- Only accept requests about clinical pharmacology, pharmacometrics, QSP, PK/PD modeling, analysis files/reports
- For out-of-scope requests, set action:"respond" and politely redirect
- Always be scientifically precise — use correct PMx terminology
- Reference relevant equations and parameters where helpful`;
}

function buildSubAgentSystemPrompt(role: AgentRole, session: Session, taskDescription: string, priorContext: string, existingFolders?: string[]): string {
  const roleDescriptions: Record<AgentRole, string> = {
    scientist_ii: '',
    project_manager: `You are the Project Manager for a pharmacometrics analysis system. Your role is to manage project setup, create/tailor checklists, and organize the analysis workspace for the ${session.compound || 'unnamed'} ${session.analysis_type || 'PK/PD'} analysis.`,
    pharmacometrician: `You are an expert Pharmacometrician with deep knowledge of NONMEM, nlmixr2, R programming, and population PK/PD modeling. You are working on the ${session.compound || 'unnamed'} ${session.analysis_type || 'PK/PD'} analysis using ${session.software_stack || 'R/NONMEM'}.`,
    data_manager: `You are a Data Manager specializing in CDISC SDTM/ADaM standards, R data processing, and exploratory data analysis for pharmacometric datasets. You are working on the ${session.compound || 'unnamed'} analysis.`,
    medical_writer: `You are a Medical Writer specializing in pharmacometrics analysis reports, presentations, and data analysis plans. You are documenting the ${session.compound || 'unnamed'} ${session.analysis_type || 'PK/PD'} analysis.`,
    qc_manager: `You are a QC Manager responsible for technical validation and quality control of pharmacometrics analysis scripts, results, and reports for the ${session.compound || 'unnamed'} analysis.`,
  };

  const defaultFolders = PROJECT_FOLDERS.map(f => `${f}/`);
  const folderList = (existingFolders && existingFolders.length > 0 ? existingFolders : defaultFolders).join('\n');

  return `${roleDescriptions[role]}

CURRENT TASK: ${taskDescription}

PRIOR ANALYSIS CONTEXT:
${priorContext || 'This is the beginning of the analysis.'}

SOFTWARE STACK: ${session.software_stack || 'R 4.4.0, NONMEM 7.5.1, nlmixr2 2.1.0'}
COMPOUND: ${session.compound || 'Not specified'}
ANALYSIS TYPE: ${session.analysis_type || 'Population PK'}

PROJECT FOLDER STRUCTURE (always use these paths for artifact "path" fields — never invent new top-level folders):
${folderList}

PATH CONVENTIONS:
- Document files (.md, .docx, .doc, .txt) → Reports/filename.md
- Dataset files (.csv, .tab, .xls, .xlsx)  → Data/filename.csv
- R analysis scripts (.R)                  → Scripts/R/script_name.R
- Python / C++ / Julia / other scripts     → Scripts/Models/script_name.py|cpp|jl
- NONMEM control streams (.ctl, .mod)      → Scripts/NONMEM/run###_description.ctl
- NONMEM output files (.lst)               → Scripts/NONMEM/filename.lst
- Result tables, summaries                 → Results/Tables/filename.md|csv
- Parameter estimates, OFV tables          → Results/Estimates/filename.md|csv
- GOF / diagnostic plot scripts            → Plots/GOF/filename.R
- VPC plot scripts                         → Plots/VPC/filename.R
- Covariate plot scripts                   → Plots/Covariates/filename.R
- Config / software spec files             → Config/filename.md|yaml

Respond in valid JSON only (no markdown code blocks):
{
  "status": "success" | "partial_success" | "failure",
  "task_summary": "Brief description of what was accomplished",
  "message_to_user": "Detailed response for the user (use markdown, be thorough and scientifically precise)",
  "artifacts": [
    { "path": "Scripts/Models/run001_1cmt.ctl", "type": "script", "content": "Full file content here..." }
  ],
  "findings": [
    { "type": "observation" | "warning" | "error", "severity": "info" | "minor" | "major" | "critical", "message": "...", "suggested_action": "..." }
  ],
  "checklist_recommendations": [
    { "action": "add" | "modify", "ref": null, "description": "New task to add", "section": "5" }
  ]
}

Produce complete, production-quality outputs — full script content, detailed analysis steps, precise scientific recommendations. Do not truncate or use placeholder text.`;
}

export async function runOrchestrator(
  userMessage: string,
  session: Session,
  conversationHistory: Message[],
  onAgentUpdate: (role: AgentRole | null, taskLabel?: string) => void,
  signal?: AbortSignal
): Promise<OrchestratorResult> {
  // Domain check
  if (!isInScope(userMessage)) {
    return {
      message: `Thank you for your question! However, I'm specifically designed to assist with **clinical pharmacology, pharmacometrics modeling, and quantitative systems pharmacology** tasks.

Your request appears to fall outside my area of expertise. If you have questions related to:
- PK/PD modeling and population analysis
- NONMEM, nlmixr2, or Monolix workflows
- Data preparation and CDISC standards
- Model diagnostics, VPC, or simulation
- Analysis reports and presentations

...I'd be happy to help!`,
    };
  }

  onAgentUpdate('scientist_ii', 'Analyzing request...');

  // Check if checklist exists; if not, create default
  let checklist = await getChecklist(session.id);
  if (checklist.length === 0) {
    onAgentUpdate('project_manager', 'Initializing project checklist...');
    checklist = await createDefaultChecklist(session.id);
  }

  // Build conversation history for LLM
  const recentHistory = conversationHistory.slice(-ORCHESTRATOR_HISTORY_WINDOW);
  const llmHistory = recentHistory.map(m => ({
    role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
    content: m.content,
  }));

  // Call Scientist II
  const systemPrompt = buildScientistIISystemPrompt(session, checklist);
  let rawResponse: string;
  try {
    rawResponse = await callLLM([
      { role: 'system', content: systemPrompt },
      ...llmHistory,
      { role: 'user', content: userMessage },
    ], { maxTokens: LLM_MAX_TOKENS_ORCHESTRATOR, signal });
  } catch (err) {
    onAgentUpdate(null);
    throw err;
  }

  // Parse Scientist II JSON response
  let orchestratorResponse: {
    action: string;
    message: string;
    agent_role?: AgentRole;
    checklist_updates?: EnvelopeResponse['checklist_updates'];
    artifacts?: { path: string; type: string; content: string }[];
    sub_agent_task?: string;
  };

  try {
    orchestratorResponse = extractJson(rawResponse);
  } catch {
    onAgentUpdate(null);
    return { message: cleanMessage(rawResponse) };
  }

  // Apply checklist updates from Scientist II
  if (orchestratorResponse.checklist_updates?.length) {
    await applyChecklistUpdates(session.id, orchestratorResponse.checklist_updates, checklist);
    checklist = await getChecklist(session.id);
  }

  // Save artifacts from Scientist II
  if (orchestratorResponse.artifacts?.length) {
    for (const art of orchestratorResponse.artifacts) {
      await addArtifact(session.id, {
        path: sanitizeArtifactPath(art.path),
        artifact_type: art.type,
        content: art.content,
      });
    }
  }

  // If HITL pause needed
  if (orchestratorResponse.action === 'hitl_pause') {
    onAgentUpdate(null);
    return {
      message: orchestratorResponse.message,
      hitlPause: true,
      hitlChecklistPreview: checklist,
    };
  }

  // If delegation to sub-agent
  if (orchestratorResponse.action === 'delegate' && orchestratorResponse.agent_role) {
    const agentRole = orchestratorResponse.agent_role;
    const taskDesc = orchestratorResponse.sub_agent_task || orchestratorResponse.message;

    onAgentUpdate(agentRole, `${AGENT_LABELS[agentRole]} working...`);

    // Find current task for logging
    const nextTask = await getNextPendingTask(session.id);
    const invocation = await createInvocation(session.id, agentRole, nextTask?.item_ref);

    // Build prior context summary
    const priorContext = recentHistory
      .filter(m => m.role === 'assistant')
      .slice(-ORCHESTRATOR_PRIOR_CONTEXT_MESSAGES)
      .map(m => m.content.slice(0, ORCHESTRATOR_PRIOR_CONTEXT_CHARS))
      .join('\n---\n');

    // Call sub-agent
    const subAgentPrompt = buildSubAgentSystemPrompt(agentRole, session, taskDesc, priorContext);
    let subRaw: string;
    try {
      subRaw = await callLLM([
        { role: 'system', content: subAgentPrompt },
        { role: 'user', content: taskDesc },
      ], { maxTokens: LLM_MAX_TOKENS_SUBAGENT, signal });
    } catch (err) {
      onAgentUpdate(null);
      await completeInvocation(invocation.id, {
        envelope_id: invocation.envelope_id,
        agent_role: agentRole,
        status: 'failure',
        task_summary: 'Sub-agent call failed',
        message_to_user: String(err),
      });
      throw err;
    }

    let subResponse: EnvelopeResponse;
    try {
      const parsed = extractJson(subRaw);
      subResponse = {
        envelope_id: invocation.envelope_id,
        agent_role: agentRole,
        status: parsed.status || 'success',
        task_summary: parsed.task_summary || taskDesc,
        message_to_user: cleanMessage(parsed.message_to_user || parsed.message || subRaw),
        artifacts_produced: parsed.artifacts || [],
        findings: parsed.findings || [],
        checklist_updates: parsed.checklist_recommendations?.map((r: { action: string; ref?: string; description?: string; section?: string; item_type?: string }) => ({
          action: r.action,
          ref: r.ref,
          description: r.description,
          section: r.section,
          item_type: r.item_type,
        })) || [],
      };
    } catch {
      subResponse = {
        envelope_id: invocation.envelope_id,
        agent_role: agentRole,
        status: 'success',
        task_summary: taskDesc,
        message_to_user: cleanMessage(subRaw),
        artifacts_produced: [],
        findings: [],
        checklist_updates: [],
      };
    }

    await completeInvocation(invocation.id, subResponse);

    // Save sub-agent artifacts
    if (subResponse.artifacts_produced?.length) {
      for (const art of subResponse.artifacts_produced) {
        await addArtifact(session.id, {
          path: sanitizeArtifactPath(art.path),
          artifact_type: art.type,
          content: art.content,
        });
      }
    }

    // Apply sub-agent checklist recommendations
    if (subResponse.checklist_updates?.length) {
      await applyChecklistUpdates(session.id, subResponse.checklist_updates, checklist);
    }

    // Mark current task complete
    if (nextTask && subResponse.status !== 'failure') {
      await updateChecklistItem(nextTask.id, { status: 'complete' });
    }
    onAgentUpdate(null);

    // Combine Scientist II intro message with sub-agent response
    const combinedMessage = orchestratorResponse.message
      ? `${orchestratorResponse.message}\n\n---\n\n${subResponse.message_to_user}`
      : subResponse.message_to_user;

    return {
      message: combinedMessage,
      agentRole,
      checklistUpdates: subResponse.checklist_updates,
      artifacts: subResponse.artifacts_produced || [],
    };
  }

  onAgentUpdate(null);

  const finalMessage = cleanMessage(orchestratorResponse.message || rawResponse);

  return {
    message: finalMessage,
    checklistUpdates: orchestratorResponse.checklist_updates,
    artifacts: orchestratorResponse.artifacts?.map(a => ({ ...a, checksum: '' })) || [],
  };
}

async function applyChecklistUpdates(
  sessionId: string,
  updates: EnvelopeResponse['checklist_updates'],
  currentChecklist: ChecklistItem[]
): Promise<void> {
  if (!updates) return;

  for (const update of updates) {
    if (update.action === 'complete' && update.ref) {
      const item = currentChecklist.find(i => i.item_ref === update.ref);
      if (item) {
        await updateChecklistItem(item.id, { status: 'complete' });
      }
    } else if (update.action === 'add' && update.description) {
      const sectionItems = currentChecklist.filter(i => i.section_number === (update.section || '11'));
      const maxSort = sectionItems.length > 0
        ? Math.max(...sectionItems.map(i => i.sort_order))
        : currentChecklist.length;

      await addChecklistItem(sessionId, {
        session_id: sessionId,
        section_number: update.section || '11',
        description: update.description,
        status: 'pending',
        item_type: update.item_type || 'task',
        sort_order: maxSort + 1,
        item_ref: update.ref || undefined,
      });
    } else if (update.action === 'modify' && update.ref && update.description) {
      const item = currentChecklist.find(i => i.item_ref === update.ref);
      if (item) {
        await updateChecklistItem(item.id, { description: update.description });
      }
    }
  }
}

/** Map a checklist section number to the most appropriate agent role. */
export function agentForSection(sectionNumber?: string): AgentRole {
  const n = parseInt(sectionNumber || '1', 10);
  if (n === 1) return 'project_manager';
  if (n <= 3) return 'data_manager';
  if (n <= 10) return 'pharmacometrician';
  return 'medical_writer';
}

/** Process a single pending checklist task using the appropriate sub-agent.
 *  Saves artifacts, marks the task complete, and returns the agent message. */
export async function processOneTask(
  session: Session,
  task: ChecklistItem,
  onAgentUpdate: (role: AgentRole | null, taskLabel?: string) => void,
  onPromptReady?: (info: { systemPrompt: string; userPrompt: string }) => Promise<void>,
  signal?: AbortSignal
): Promise<{ agentRole: AgentRole; message: string; artifacts: { path: string; type: string; content: string; checksum?: string }[] }> {
  const agentRole = agentForSection(task.section_number);
  onAgentUpdate(agentRole, `${AGENT_LABELS[agentRole]}: ${task.description}...`);

  // Build prior context from recently completed tasks
  const allItems = await getChecklist(session.id);
  const priorContext = allItems
    .filter(i => i.item_type === 'task' && i.status === 'complete')
    .slice(-6)
    .map(i => `✓ [${i.item_ref}] ${i.description}`)
    .join('\n');

  // Extract existing folder paths so agents use the established structure
  const existingArtifacts = await getArtifacts(session.id);
  const existingFolders = Array.from(
    new Set(
      existingArtifacts
        .filter(a => a.artifact_type === 'folder')
        .map(a => a.path.replace(/\/[^/]+$/, '/'))
    )
  );

  const subAgentPrompt = buildSubAgentSystemPrompt(agentRole, session, task.description, priorContext, existingFolders);
  const invocation = await createInvocation(session.id, agentRole, task.item_ref);
  const userPrompt = `Execute task [${task.item_ref}]: ${task.description}`;

  // Notify caller with the built prompts before calling LLM
  await onPromptReady?.({ systemPrompt: subAgentPrompt, userPrompt });

  let subRaw: string;
  try {
    subRaw = await callLLM([
      { role: 'system', content: subAgentPrompt },
      { role: 'user', content: userPrompt },
    ], { maxTokens: LLM_MAX_TOKENS_SUBAGENT, signal });
  } catch (err) {
    onAgentUpdate(null);
    await completeInvocation(invocation.id, {
      envelope_id: invocation.envelope_id,
      agent_role: agentRole,
      status: 'failure',
      task_summary: 'Auto-agent call failed',
      message_to_user: String(err),
    });
    throw err;
  }

  let message: string;
  let explicitArtifacts: { path: string; type: string; content: string }[] = [];
  let findings: EnvelopeResponse['findings'] = [];

  try {
    const parsed = extractJson(subRaw);
    message = cleanMessage((parsed.message_to_user as string) || (parsed.message as string) || subRaw);
    explicitArtifacts = (parsed.artifacts as typeof explicitArtifacts) || [];
    findings = (parsed.findings as EnvelopeResponse['findings']) || [];
  } catch {
    message = cleanMessage(subRaw);
  }

  // Save explicit artifacts
  const savedPaths = new Set<string>(explicitArtifacts.map(a => a.path));
  for (const art of explicitArtifacts) {
    await addArtifact(session.id, { path: sanitizeArtifactPath(art.path), artifact_type: art.type, content: art.content });
  }

  // Special: folder-structure task → create actual folder markers in the Files tab
  const isFolderStructureTask =
    task.item_ref === '1.3' ||
    /(?:folder|directory)\s*structure|set\s*up\s*(?:session\s*)?folder|create\s*(?:session\s*)?folder/i.test(task.description);

  const folderArtifacts: { path: string; type: string; content: string }[] = [];
  if (isFolderStructureTask) {
    for (const folder of PROJECT_FOLDERS) {
      const p = `${folder}/.gitkeep`;
      if (!savedPaths.has(p)) {
        savedPaths.add(p);
        await addArtifact(session.id, { path: p, artifact_type: 'folder', content: '' });
        folderArtifacts.push({ path: p, type: 'folder', content: '' });
      }
    }
  }

  // Auto-save task document
  const allArtifacts = [...explicitArtifacts, ...folderArtifacts];

  // Mark task complete
  await updateChecklistItem(task.id, { status: 'complete' });

  await completeInvocation(invocation.id, {
    envelope_id: invocation.envelope_id,
    agent_role: agentRole,
    status: 'success',
    task_summary: task.description,
    message_to_user: message,
    artifacts_produced: allArtifacts,
    findings,
    checklist_updates: [],
  });

  onAgentUpdate(null);
  return { agentRole, message, artifacts: allArtifacts.map(a => ({ ...a, checksum: '' })) };
}

