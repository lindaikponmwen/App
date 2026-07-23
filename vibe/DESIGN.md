# PharmaCo MultiAgent — Design & Architecture Reference

A production-ready web application for orchestrating AI-assisted pharmacometrics analyses. The system deploys a hierarchy of specialized LLM agents that plan, execute, and document a full population PK/PD modelling workflow — from raw data through final regulatory report — with a human-in-the-loop control mechanism at every decision point.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Technology Stack](#2-technology-stack)
3. [Repository Structure](#3-repository-structure)
4. [Database Schema](#4-database-schema)
5. [Core Data Types](#5-core-data-types)
6. [Agent Architecture](#6-agent-architecture)
7. [Orchestration Engine](#7-orchestration-engine)
8. [Human-in-the-Loop (HITL) Control](#8-human-in-the-loop-hitl-control)
9. [Autonomous Loop](#9-autonomous-loop)
10. [Virtual File System](#10-virtual-file-system)
11. [Default Checklist — 11-Section Workflow](#11-default-checklist--11-section-workflow)
12. [LLM Integration](#12-llm-integration)
13. [Component Reference](#13-component-reference)
14. [State Management](#14-state-management)
15. [Theme System](#15-theme-system)
16. [Configuration Reference](#16-configuration-reference)
17. [End-to-End Walkthrough: Starting a PopPK Project](#17-end-to-end-walkthrough-starting-a-poppk-project)
18. [JSON Contract — Orchestrator ↔ Sub-Agent](#18-json-contract--orchestrator--sub-agent)
19. [Checklist Update Operations](#19-checklist-update-operations)
20. [Artifact Path Conventions](#20-artifact-path-conventions)
21. [Responsive Layout](#21-responsive-layout)
22. [Key Design Decisions](#22-key-design-decisions)

---

## 1. Product Overview

PharmaCo MultiAgent is built around a single workflow: a pharmacometrician describes an analysis project (compound name, analysis type, software stack) and the system autonomously works through an 11-section pharmacometrics analysis checklist, producing full-content code files, analysis plans, NONMEM control streams, R scripts, diagnostic reports, and VPC documentation as it goes.

**Primary capabilities:**

- Create and manage multiple independent analysis sessions (one per study or compound)
- AI-assisted planning and execution of the full PopPK/PKPD workflow
- Six specialised AI sub-agents, each focused on a domain (modeling, data, QC, reporting…)
- HITL pause-and-review before any automated execution begins
- Toggle between interactive (HITL on) and fully autonomous (HITL off) modes mid-session
- A persistent virtual file system that accumulates every artifact an agent produces
- In-app viewer for all file types (scripts, markdown documents, NONMEM outputs)
- Session duplication, rename, and archive management

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| UI framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS (JIT) |
| Icons | Lucide React |
| Database | Supabase (PostgreSQL) |
| LLM inference | OpenRouter API (multi-model with automatic fallback) |
| Markdown rendering | react-markdown + remark-gfm + rehype-katex |
| Hosting | Bolt (Vite dev server in dev, static build for production) |

---

## 3. Repository Structure

```
project/
├── src/
│   ├── App.tsx                     # Root router — SessionList ↔ AnalysisWorkspace
│   ├── main.tsx                    # ReactDOM entry point
│   ├── index.css                   # Tailwind base + global resets
│   │
│   ├── lib/
│   │   ├── config.ts               # All constants, THEME tokens, MODELS, checklist data
│   │   ├── constants.ts            # Supplementary static values
│   │   ├── openrouter.ts           # LLM client (callLLM, setModel, getApiKey)
│   │   ├── supabase.ts             # Supabase client initialisation
│   │   └── types.ts                # All TypeScript interfaces and union types
│   │
│   ├── services/
│   │   ├── orchestrator.ts         # Core AI engine — Scientist II + sub-agent dispatch
│   │   ├── sessionService.ts       # CRUD for sessions, checklist, artifacts
│   │   ├── messageService.ts       # CRUD for chat messages
│   │   └── invocationService.ts    # CRUD for agent invocation records
│   │
│   └── components/
│       ├── AnalysisWorkspace.tsx   # Main workspace layout + orchestration hooks
│       ├── ChatPanel.tsx           # Chat UI, markdown rendering, message bubbles
│       ├── ChecklistPanel.tsx      # Collapsible 11-section checklist with progress
│       ├── AgentActivity.tsx       # Live agent status + invocation history
│       ├── FileTree.tsx            # Virtual file system tree view
│       ├── FileViewerModal.tsx     # Full-screen artifact viewer
│       ├── HITLBanner.tsx          # Pre-execution review and continue banner
│       ├── SessionList.tsx         # Session dashboard + create/edit/delete
│       └── SettingsPanel.tsx       # Model selector + API key override
│
├── supabase/
│   └── migrations/
│       └── 20260608194707_pharmacometrics_schema.sql
│
├── DESIGN.md                       # This file
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

---

## 4. Database Schema

Five tables, all with Row Level Security enabled (anon role for public access in this deployment).

### `sessions`

The top-level project container. One session = one pharmacometrics analysis study.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | auto-generated |
| `name` | TEXT | user-supplied display name |
| `compound` | TEXT | drug compound identifier (e.g. "XYZ-001") |
| `software_stack` | TEXT | e.g. "R 4.4 / NONMEM 7.5 / nlmixr2" |
| `analysis_type` | TEXT | PopPK, PKPD, NCA, VPC, PBPK, QSP, Other |
| `data_status` | TEXT | 'uploaded' \| 'to_be_created' \| 'unknown' |
| `hitl_enabled` | BOOLEAN | true = pauses before each autonomous run |
| `status` | TEXT | 'active' \| 'completed' \| 'archived' |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### `messages`

Every chat turn for a session (user and assistant). Used to provide conversation history to the orchestrator LLM.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `session_id` | UUID FK → sessions | cascade delete |
| `role` | TEXT | 'user' \| 'assistant' \| 'system' |
| `agent` | TEXT | `AgentRole` value when role = 'assistant' |
| `content` | TEXT | markdown body |
| `metadata` | JSONB | optional structured payload (e.g. dispatch info) |
| `created_at` | TIMESTAMPTZ | |

### `checklist_items`

The master task list for a session. Rows can be sections (headers), tasks (executable items), or notes.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `session_id` | UUID FK → sessions | cascade delete |
| `section_number` | TEXT | "1" through "11" (or custom) |
| `section_title` | TEXT | human-readable section heading |
| `item_ref` | TEXT | dotted reference like "3.2", "7.4a" |
| `description` | TEXT | full task description |
| `status` | TEXT | 'pending' \| 'complete' |
| `item_type` | TEXT | 'task' \| 'section' \| 'note' |
| `sort_order` | INTEGER | controls display ordering |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### `invocations`

An audit log of every LLM sub-agent call. Stores the full request and response payloads.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `session_id` | UUID FK → sessions | cascade delete |
| `envelope_id` | UUID | correlation ID linking request ↔ response |
| `agent_role` | TEXT | which sub-agent handled this |
| `checklist_ref` | TEXT | which task ref was being processed |
| `status` | TEXT | pending \| running \| success \| partial_success \| failure |
| `request_payload` | JSONB | the `PromptEnvelope` sent to the agent |
| `response_payload` | JSONB | the `EnvelopeResponse` received |
| `task_summary` | TEXT | one-line description for Activity panel |
| `created_at` | TIMESTAMPTZ | |
| `completed_at` | TIMESTAMPTZ | |

### `artifacts`

The virtual file system. Every file an agent produces is stored here as a row.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `session_id` | UUID FK → sessions | cascade delete |
| `path` | TEXT | relative path e.g. `Scripts/NONMEM/run001.ctl` |
| `artifact_type` | TEXT | script \| document \| data \| plot \| folder |
| `content` | TEXT | full file content (plain text) |
| `metadata` | JSONB | optional extra fields |
| `created_at` | TIMESTAMPTZ | |

---

## 5. Core Data Types

Defined in `src/lib/types.ts`.

```typescript
type AgentRole =
  | 'scientist_ii'
  | 'project_manager'
  | 'pharmacometrician'
  | 'data_manager'
  | 'medical_writer'
  | 'qc_manager';

type AnalysisType = 'PopPK' | 'PKPD' | 'NCA' | 'Covariate' | 'VPC' | 'PBPK' | 'QSP' | 'Other';
type ChecklistStatus = 'pending' | 'complete';
type ChecklistItemType = 'task' | 'section' | 'note';
type InvocationStatus = 'pending' | 'running' | 'success' | 'partial_success' | 'failure';
```

**`OrchestratorResult`** — returned by `runOrchestrator()` and `processOneTask()`:

```typescript
interface OrchestratorResult {
  message: string;                              // markdown to display in chat
  agentRole?: AgentRole;                        // which agent produced the response
  checklistUpdates?: EnvelopeResponse['checklist_updates'];
  artifacts?: EnvelopeResponse['artifacts_produced'];
  hitlPause?: boolean;                          // true → show HITLBanner
  hitlChecklistPreview?: ChecklistItem[];       // tasks to preview in banner
}
```

---

## 6. Agent Architecture

The system uses a two-tier agent hierarchy.

### Tier 1 — Scientist II (Orchestrator)

The sole entry point for all user messages. Scientist II is a senior pharmacometrician persona. Its responsibilities:

- Accept and validate user input against the pharmacometrics domain (scope gate)
- Decide whether to respond directly, delegate to a sub-agent, or trigger a HITL pause
- Maintain awareness of the current session context (compound, analysis type, checklist progress)
- Issue `checklist_updates` to mark tasks complete, add new tasks, or modify existing ones
- Optionally produce its own artifacts (e.g. analysis plan documents)

Scientist II always replies in structured JSON.

### Tier 2 — Specialised Sub-Agents

| Role | `AgentRole` key | Domain | Sections |
|---|---|---|---|
| Project Manager | `project_manager` | Project setup, checklist tailoring, workspace organisation | 1 |
| Data Manager | `data_manager` | CDISC SDTM/ADaM, R data processing, EDA | 2–3 |
| Pharmacometrician | `pharmacometrician` | NONMEM control streams, nlmixr2, PopPK/PD modeling, VPC | 4–10 |
| Medical Writer | `medical_writer` | Final reports, presentations, data analysis plans | 11 |
| QC Manager | `qc_manager` | Technical validation and quality control | Cross-section |

The mapping from checklist section number to agent role is handled by `agentForSection()`:

```
Section 1        → project_manager
Sections 2–3     → data_manager
Sections 4–10    → pharmacometrician
Section 11+      → medical_writer
```

Sub-agents also reply in structured JSON, producing `artifacts`, `findings`, and `checklist_recommendations`.

---

## 7. Orchestration Engine

`src/services/orchestrator.ts` contains two exported functions.

### `runOrchestrator()`

Called for every user message sent through the chat panel (interactive mode).

**Flow:**

```
User sends message
        │
        ▼
isInScope(message)?    ──No──▶  polite out-of-scope refusal
        │ Yes
        ▼
checklist empty?       ──Yes─▶  createDefaultChecklist()
        │
        ▼
Call Scientist II LLM (system prompt + last 10 messages of history)
        │
        ▼
extractJson(response)
        │
        ├─ action: "respond"     → return message directly
        │
        ├─ action: "hitl_pause"  → return { hitlPause: true, checklist }
        │
        ├─ action: "delegate"    → dispatch to sub-agent (see below)
        │
        └─ action: "complete"    → return message (analysis done)

Sub-agent dispatch:
        │
        ▼
buildSubAgentSystemPrompt(role, session, taskDesc, priorContext)
        │
        ▼
Call sub-agent LLM (2× token budget vs orchestrator)
        │
        ▼
extractJson(response) → save artifacts → apply checklist_recommendations
        │
        ▼
Mark next pending task complete (if sub-agent status ≠ failure)
        │
        ▼
Return combined message (Scientist II intro + sub-agent body)
```

### `processOneTask()`

Called by the autonomous loop for each pending checklist item. Skips Scientist II and calls the appropriate sub-agent directly.

**Flow:**

```
Receive pending ChecklistItem
        │
        ▼
agentForSection(task.section_number)  → determines agent role
        │
        ▼
Build priorContext from last 6 completed tasks
        │
        ▼
getArtifacts() → extract existing folder paths (so agent uses established structure)
        │
        ▼
buildSubAgentSystemPrompt(role, session, task.description, priorContext, existingFolders)
        │
        ▼
createInvocation() → call LLM → save artifacts → mark task complete → completeInvocation()
        │
        ▼
If task matches folder-structure pattern (ref "1.3" or matching description)
  → create .gitkeep markers for all 11 PROJECT_FOLDERS in the artifacts table
        │
        ▼
Return { agentRole, message, artifacts }
```

### JSON Repair Pipeline

LLM responses frequently include markdown code fences, reasoning `<think>` blocks, trailing commas, and unescaped newlines. `extractJson()` applies four progressive repair attempts before throwing:

1. Direct `JSON.parse()` after stripping fences and `<think>` tags
2. Fix trailing commas before `}` or `]`
3. Escape literal newlines/tabs inside string values
4. Both repairs combined

If all fail, `extractMessageFallback()` uses a regex to pull just the `message`/`message_to_user` field, ensuring a graceful fallback even on severely malformed output.

---

## 8. Human-in-the-Loop (HITL) Control

HITL mode is a per-session toggle stored in `sessions.hitl_enabled`. When enabled:

1. After Scientist II returns `action: "hitl_pause"`, `runOrchestrator()` sets `hitlPause: true` in the result.
2. `AnalysisWorkspace` renders `<HITLBanner>` above the chat input.
3. The banner shows a preview of pending tasks grouped by section (up to 5 sections, 3 tasks each).
4. The user can review, ask Scientist II to modify any tasks via chat, then click **Continue Analysis**.
5. Clicking Continue clears `hitlPaused` state — no autonomous loop is triggered in HITL mode. The user manually drives each step through chat.

When HITL is **disabled**, `AnalysisWorkspace` starts the autonomous loop immediately after Scientist II responds, or on mount if there are pending tasks.

The toggle button in the header writes the new value to the database immediately (`updateSession`) so it persists across page reloads.

---

## 9. Autonomous Loop

`runAutonomousLoop()` inside `AnalysisWorkspace` drives fully automated execution.

**Guard conditions:**

- `isLoopRunning.current` — prevents concurrent loop instances
- `stopLoop.current` — set to true by the Halt button or when HITL is turned back on
- `AUTONOMOUS_MAX_TASKS = 25` — hard cap per invocation of the loop
- `AbortController` — allows immediate cancellation of in-flight LLM requests

**Loop execution:**

```
1. Check getNextPendingTask() — exit if none
2. Set isLoopRunning = true, show loading state
3. Post "Autonomous Mode Active" message to chat
4. FOR i = 0..24:
     a. Stop if halt/HITL-toggle/abort
     b. Get next pending task
     c. processOneTask(session, pending, agentUpdate, onDispatch, signal)
        → onDispatch callback posts a "dispatch card" to chat
     d. Post result message to chat
     e. refreshAll() to sync checklist + files UI
5. Post "loop complete" message if all tasks done
6. Clean up loading/agent state
```

The loop re-checks `getNextPendingTask()` at every iteration, so checklist additions made by agents during execution are automatically picked up.

---

## 10. Virtual File System

Every file an agent produces is stored as an `artifacts` row. The `FileTree` component renders them as an interactive tree.

### Folder Routing Rules (`sanitizeArtifactPath`)

To enforce a clean project layout regardless of what the LLM returns:

| File extension | Enforced top folder |
|---|---|
| `.csv .tab .xls .xlsx .xpt .sas7bdat` | `Data/` |
| Any file placed in `Data/` that is not a dataset | `Reports/` |
| All others | unchanged (agent-specified path) |

### Standard Project Folder Structure

Created automatically when task `1.1` (or any folder-structure task) is processed:

```
Data/
Scripts/
  Models/
  R/
  NONMEM/
Results/
  Tables/
  Estimates/
Plots/
  GOF/
  VPC/
  Covariates/
Reports/
Config/
```

Folder existence is represented by `.gitkeep` artifacts with `artifact_type: "folder"`.

### File Type Detection

`FileTree` and `FileViewerModal` colour-code files by extension using `THEME.fileColors`:

| Extension(s) | Colour | Category |
|---|---|---|
| `.R .r` | emerald | R script |
| `.ctl .mod .lst` | green | NONMEM |
| `.csv .tab .xpt` | violet | Data |
| `.md .doc .docx .txt` | amber | Document |
| `.png .jpg .svg .pdf` | rose | Plot/image |
| directories | amber | Folder |

---

## 11. Default Checklist — 11-Section Workflow

The default checklist mirrors a regulatory-grade pharmacometrics analysis. Created on first user message if no checklist exists. 77 tasks across 11 sections.

| # | Section | Tasks | Primary Agent |
|---|---|---|---|
| 1 | Project Initialization & Software Specification | 6 | Project Manager |
| 2 | Data Preparation | 6 | Data Manager |
| 3 | Exploratory Data Analysis (EDA) | 7 | Data Manager |
| 4 | Non-Compartmental Analysis (NCA) | 5 | Pharmacometrician |
| 5 | Base Structural Model Selection | 8 | Pharmacometrician |
| 6 | Random Effects Model Development | 6 | Pharmacometrician |
| 7 | Covariate Analysis | 9 | Pharmacometrician |
| 8 | Final Model Refinement | 7 | Pharmacometrician |
| 9 | Model Diagnostics & Goodness-of-Fit | 7 | Pharmacometrician |
| 10 | Visual Predictive Check (VPC) & Model Qualification | 7 | Pharmacometrician |
| 11 | Reporting & Communication | 6 | Medical Writer |

Agents can add, modify, or complete checklist items at any point. The system dynamically adapts the plan as the analysis evolves.

---

## 12. LLM Integration

`src/lib/openrouter.ts` wraps the OpenRouter API with automatic model fallback.

### Model Roster

Seven free-tier models registered, tried in order until one succeeds:

```
google/gemma-4-31b-it:free          (Gemma)
moonshotai/kimi-k2.6:free           (Kimi K2.6)
deepseek/deepseek-v4-flash:free     (DeepSeek V4 Flash)
nvidia/nemotron-3-nano-omni-30b...  (Nemotron Nano 30B)
qwen/qwen3-next-80b-a3b-instruct... (Qwen3 80B)
openai/gpt-oss-120b:free            (GPT-OSS 120B)
nousresearch/hermes-3-llama-3.1...  (Hermes 3 405B)
```

### Token Budgets

| Caller | Max tokens |
|---|---|
| Scientist II (orchestrator) | 2048 |
| Sub-agents | 3000 |

### Context Window Management

Orchestrator receives the last **10** messages of conversation history. Prior context fed to sub-agents is the last **3** assistant messages, capped at **300 characters** each — enough for continuity without exhausting context.

### API Key

A default shared key is bundled in `config.ts`. Users can override it per-session in the Settings panel. Key is stored in module-level state in `openrouter.ts` (`currentApiKey`).

---

## 13. Component Reference

### `App` (`src/App.tsx`)

Top-level router. Either renders `<SessionList>` (no active session) or `<AnalysisWorkspace session={...}>` (active session). Manages the sessions array and handles create/rename/duplicate/delete operations.

### `SessionList` (`src/components/SessionList.tsx`)

Session dashboard. Shows a card grid of all sessions with compound, analysis type, HITL badge, task progress, and timestamps. Contains a "New Session" modal with fields for name, compound, software stack, analysis type, and HITL toggle.

### `AnalysisWorkspace` (`src/components/AnalysisWorkspace.tsx`)

The main workspace. A two-column layout:

- **Left column:** ChatPanel (fills available width) + optional HITLBanner + error display
- **Right column:** Draggable sidebar (320px default, 240–640px range) with four tabs: Checklist, Activity, Files, Settings

Orchestrates all session state: messages, checklist, invocations, artifacts, loading, agent activity. Contains both `runAutonomousLoop` and the `handleSendMessage` handler. On mobile (< lg breakpoint), the right panel becomes a slide-over drawer.

### `ChatPanel` (`src/components/ChatPanel.tsx`)

Full-featured chat interface. Key sub-components:

- **`WelcomeScreen`** — shown when no messages exist; displays six domain suggestion chips
- **`MessageBubble`** — renders user or assistant messages with agent avatar, role label, action buttons (copy, save-to-files), and a `MarkdownContent` body
- **`DispatchCard`** — special card shown when Scientist II delegates a task (shows agent role, task ref, expandable system/user prompt)
- **`TypingIndicator`** — animated three-dot indicator during loading
- **`SaveFileModal`** — allows manually saving any message content as a named artifact
- **`MarkdownContent`** — renders markdown with fenced code blocks (syntax-highlighted via CSS), tables, LaTeX (KaTeX), footnotes

### `ChecklistPanel` (`src/components/ChecklistPanel.tsx`)

Grouped by section, collapsible per section. Shows overall progress bar, per-task status checkboxes. Agents can be manually toggled complete/incomplete by clicking. Includes section-level delete and per-task delete controls.

### `AgentActivity` (`src/components/AgentActivity.tsx`)

Live view of the currently active agent (name, task description, animated pulse). History of all past invocations with status badges (success / partial_success / failure), timestamps, and elapsed time.

### `FileTree` (`src/components/FileTree.tsx`)

Renders the `artifacts` array as a nested folder tree. Clicking a file opens `FileViewerModal`. File icons and colours driven by extension type via `THEME.fileColors`.

### `FileViewerModal` (`src/components/FileViewerModal.tsx`)

Full-screen overlay for viewing an artifact. Shows file path, type badge, creation time. Content displayed in a monospace pre block or as rendered markdown for `.md` files. Copy-to-clipboard button.

### `HITLBanner` (`src/components/HITLBanner.tsx`)

Amber warning banner rendered between the chat messages and the input bar during a HITL pause. Shows a preview of pending checklist tasks and a "Continue Analysis" button.

### `SettingsPanel` (`src/components/SettingsPanel.tsx`)

Model selector (shows all MODELS from config with provider labels) and API key override field. Changes take effect immediately via `setModel()` / `setApiKey()` in openrouter.ts.

---

## 14. State Management

All state is local React (`useState`, `useRef`). There is no Redux, Zustand, or Context store — everything flows through props and callbacks. Supabase is the source of truth; local state is a cache that is refreshed via `refreshAll()` after every mutating operation.

### Key State in `AnalysisWorkspace`

| State variable | Type | Purpose |
|---|---|---|
| `messages` | `Message[]` | Chat history |
| `checklist` | `ChecklistItem[]` | Full checklist for progress display |
| `invocations` | `Invocation[]` | Agent call history for Activity tab |
| `artifacts` | `Artifact[]` | Virtual files for Files tab |
| `loading` | `boolean` | Any LLM call in flight |
| `activeAgent` | `AgentRole \| null` | Currently running agent |
| `activeAgentTask` | `string` | Current task label for Activity panel |
| `hitlPaused` | `boolean` | Whether HITLBanner is showing |
| `hitlEnabled` | `boolean` | Local mirror of `session.hitl_enabled` |
| `mobileRightOpen` | `boolean` | Mobile slide-over panel visibility |
| `rightPanelWidth` | `number` | Desktop sidebar width (drag-resizable) |
| `rightTab` | `RightPanelTab` | Active tab in right panel |

### Refs (not causing re-renders)

| Ref | Purpose |
|---|---|
| `isLoopRunning` | Prevents concurrent autonomous loop instances |
| `stopLoop` | Signal to halt the loop on next iteration |
| `abortController` | Cancel in-flight LLM fetch requests |
| `sessionRef` | Fresh reference to session inside async loop callbacks |
| `hitlEnabledRef` | Fresh reference to hitlEnabled inside async loop callbacks |
| `sendMessageRef` | Reference to handleSendMessage for auto-prompt on new sessions |

---

## 15. Theme System

All UI colours are declared once in `src/lib/config.ts` as the `THEME` constant and referenced by every component via template literals. No Tailwind colour class is hardcoded in component files.

### Theme Structure

```typescript
export const THEME = {
  brand: {        // green — primary actions, active states, badges
    bg, bgHover, bgActive, bgLight, bgMid, bgDark,
    text, textLight, textXLight, textOnBrand, textOnBrandDim,
    border, borderLight, borderFaint,
    progress, toggleOn, tabActive, ...
  },
  page: {         // neutral grays — backgrounds, borders, surfaces
    bg, surface, surfaceAlt, surfaceHover, border, borderFaint,
    divider, overlay, overlayDark, overlayDarker,
  },
  text: {         // text hierarchy (9 levels from primary → xfaint → onDark)
    primary, secondary, tertiary, muted, faint, xfaint,
    onDark, onDarkMuted, onDarkFaint,
  },
  input: {        // form element defaults },
  success: {      // emerald },
  warning: {      // amber — HITL banner, caution states },
  danger: {       // red — errors, halt button },
  accent: {       // cyan — selected model, session icon },
  chat: {         // bubble styles for user and assistant turns },
  fileColors: {   // per-extension text colours for FileTree },
  agentBorder: {  // per-agent left-border colours in message bubbles },
  severity: {     // finding severity bands (critical/major/minor/info) },
  code: {         // code block and syntax highlight colours },
} as const;
```

To change the brand colour from green to another hue, update the `brand` section. All buttons, badges, tab indicators, and active states update automatically.

---

## 16. Configuration Reference

Key constants in `src/lib/config.ts`:

| Constant | Default | Description |
|---|---|---|
| `AUTONOMOUS_MAX_TASKS` | 25 | Maximum tasks processed in one autonomous loop run |
| `LLM_MAX_TOKENS_ORCHESTRATOR` | 2048 | Token budget for Scientist II calls |
| `LLM_MAX_TOKENS_SUBAGENT` | 3000 | Token budget for sub-agent calls |
| `ORCHESTRATOR_HISTORY_WINDOW` | 10 | Number of past messages sent as history to Scientist II |
| `ORCHESTRATOR_PRIOR_CONTEXT_MESSAGES` | 3 | Number of prior assistant messages summarised for sub-agents |
| `ORCHESTRATOR_PRIOR_CONTEXT_CHARS` | 300 | Character limit per prior context message |
| `RIGHT_PANEL_DEFAULT_WIDTH` | 320 | Default right sidebar width in pixels |
| `RIGHT_PANEL_MIN_WIDTH` | 240 | Minimum sidebar width |
| `RIGHT_PANEL_MAX_WIDTH` | 640 | Maximum sidebar width |

---

## 17. End-to-End Walkthrough: Starting a PopPK Project

This section walks through the complete lifecycle of a new analysis project.

### Step 1 — Create a Session

On the Session List screen, click **New Analysis Session**.

Fill in the modal:
- **Session Name:** `XYZ-001 PopPK Analysis — Phase 2`
- **Compound:** `XYZ-001`
- **Software Stack:** `R 4.4.0 / NONMEM 7.5.1 / nlmixr2 2.1.0`
- **Analysis Type:** `PopPK`
- **Human in the Loop:** toggle ON (recommended for a first run)

Click **Create Session**. The app:
1. Inserts a row into `sessions`
2. Sets `isNewSession = true`
3. Navigates to `AnalysisWorkspace`
4. After the initial data load, fires `sendMessageRef.current?.('Proceed with the analysis')`

### Step 2 — Checklist Initialisation

On the first message (`'Proceed with the analysis'`), `runOrchestrator` detects an empty checklist and calls `createDefaultChecklist()`, writing all 77 tasks to `checklist_items`.

Scientist II receives the session context and the pending task list, then typically responds with `action: "hitl_pause"`, returning a structured plan for your review.

### Step 3 — HITL Review

The **HITLBanner** appears showing up to 5 sections and 3 tasks per section from the freshly created checklist. At this point you can:

- **Read** the planned tasks
- **Ask Scientist II** to add, modify, or remove tasks (e.g. "Skip the NCA section, we have NCA results already")
- Scientist II will update the checklist via `checklist_updates` in its JSON response

When satisfied, click **Continue Analysis** — this only dismisses the banner; it does not start automated execution in HITL mode.

### Step 4 — Interactive Execution (HITL On)

With HITL enabled, each step is triggered by a user message. Examples:

```
"Start with the project initialization tasks"
→ Scientist II delegates to Project Manager
→ Project Manager produces Reports/analysis_plan.md and Config/software_spec.md
→ Tasks [1.1] through [1.5] are marked complete

"Now prepare the data — we have a NONMEM-ready dataset already"
→ Scientist II modifies task [2.4] to reflect existing data
→ Data Manager produces Scripts/R/data_check.R and Results/Tables/data_summary.md

"Run the EDA"
→ Data Manager produces concentration-time plot scripts, summary statistics table
→ Tasks [3.1] through [3.6] marked complete
```

Switch to the **Checklist** tab to see progress, the **Activity** tab to see the invocation history, and the **Files** tab to browse produced artifacts.

### Step 5 — Switching to Autonomous Mode

Once comfortable with the plan, turn HITL **off** using the toggle in the header. The autonomous loop starts immediately:

- Scientist II's loop runs `processOneTask()` for each pending task in order
- A dispatch card appears in chat before each agent call
- Agent responses appear as message bubbles
- The Files tab fills with NONMEM control streams, R scripts, analysis reports

The **Halt** button (red, appears while loading) can stop the loop at any point.

### Step 6 — Review Outputs

Open the **Files** tab and browse the tree:

```
Scripts/
  NONMEM/
    run001_1cmt_fo.ctl          ← base 1-compartment model
    run002_2cmt_fo.ctl          ← base 2-compartment model
    run010_final_covariate.ctl  ← final model with covariates
  R/
    eda_plots.R                 ← EDA concentration-time plots
    gof_plots.R                 ← GOF diagnostic figures
    vpc_simulation.R            ← VPC generation script
Results/
  Tables/
    parameter_estimates.md      ← final parameter table
  Estimates/
    model_comparison.md         ← OFV/AIC/BIC comparison
Reports/
  analysis_plan.md              ← full analysis plan
  final_report.md               ← integrated final report
```

Click any file to open the full-screen viewer. Copy the content for use in your local NONMEM/R environment.

### Step 7 — Iterate and Refine

Chat with Scientist II at any time:

```
"The 2-compartment model had better OFV by 42 points — proceed with that as the base model"
"Add a task to test a non-linear absorption model (Michaelis-Menten)"
"The CWRES plots show a trend in early time points — what does this suggest?"
```

Scientist II updates the checklist and delegates new work as needed. The analysis adapts to emerging findings.

---

## 18. JSON Contract — Orchestrator ↔ Sub-Agent

### Scientist II Output Schema

```json
{
  "action": "respond | delegate | hitl_pause | complete",
  "message": "Markdown text for the chat panel",
  "agent_role": "pharmacometrician | data_manager | ...",
  "checklist_updates": [
    { "action": "complete", "ref": "3.2" },
    { "action": "add", "description": "Test transit absorption compartment", "section": "5", "item_type": "task" },
    { "action": "modify", "ref": "2.4", "description": "Updated task description" }
  ],
  "artifacts": [
    {
      "path": "Reports/analysis_plan.md",
      "type": "document",
      "content": "# Analysis Plan\n..."
    }
  ],
  "sub_agent_task": "Detailed instruction for the delegated sub-agent"
}
```

### Sub-Agent Output Schema

```json
{
  "status": "success | partial_success | failure",
  "task_summary": "Brief one-line summary",
  "message_to_user": "Detailed markdown response with scientific content",
  "artifacts": [
    {
      "path": "Scripts/NONMEM/run001_1cmt_fo.ctl",
      "type": "script",
      "content": "$PROBLEM 1-CMT first-order absorption\n$DATA..."
    }
  ],
  "findings": [
    {
      "type": "warning",
      "severity": "major",
      "message": "Condition number 1340 exceeds acceptable threshold",
      "suggested_action": "Reparameterise using log-normal transforms"
    }
  ],
  "checklist_recommendations": [
    {
      "action": "add",
      "description": "Investigate high condition number — consider reparameterisation",
      "section": "8"
    }
  ]
}
```

---

## 19. Checklist Update Operations

Three operations are supported, applied by `applyChecklistUpdates()`:

| Operation | Required fields | Effect |
|---|---|---|
| `complete` | `ref` | Sets `status = 'complete'` on the matching `item_ref` |
| `add` | `description`, optionally `section`, `item_type`, `ref` | Inserts a new row with `sort_order` appended after the section's last item |
| `modify` | `ref`, `description` | Updates the description of the matching item |

---

## 20. Artifact Path Conventions

Sub-agents are instructed to use these paths. `sanitizeArtifactPath()` enforces the critical rules (Data/ routing and non-dataset files evicted from Data/).

```
Reports/          ← .md, .docx, .doc, .txt — analysis plans, final reports, summaries
Data/             ← .csv, .tab, .xls, .xlsx, .xpt, .sas7bdat — datasets only
Scripts/R/        ← .R scripts — EDA, GOF, VPC, covariate plots
Scripts/Models/   ← .py, .cpp, .jl, .m — non-R model scripts
Scripts/NONMEM/   ← .ctl, .mod, .lst — NONMEM control streams and output
Results/Tables/   ← result tables (markdown or CSV)
Results/Estimates/← parameter estimate tables, OFV summaries
Plots/GOF/        ← GOF diagnostic plot scripts
Plots/VPC/        ← VPC simulation/plot scripts
Plots/Covariates/ ← covariate relationship plot scripts
Config/           ← .yaml, .json, .md — software specs, configuration files
```

---

## 21. Responsive Layout

The app is fully responsive using Tailwind breakpoint classes.

### Desktop (≥ lg, 1024px+)

- Two-column layout: chat on the left, sidebar on the right
- Sidebar width is drag-resizable (mouse drag on the 4px handle between columns)
- All header elements visible (HITL label, progress counter, compound/analysis badges)

### Mobile / Tablet (< lg)

- Single-column layout — chat fills the full width
- Right panel hidden; a **PanelRight** icon button in the header opens it as a slide-over drawer
- Drawer slides in from the right with a dark backdrop overlay; tapping the backdrop closes it
- Drawer width: `min(85vw, 360px)`
- Compound and analysis type badges hidden below `sm` (576px)
- HITL label text hidden below `md` (768px)
- Session name truncated to 140px below `sm`

---

## 22. Key Design Decisions

**Why OpenRouter instead of a direct API?**
Free-tier models on OpenRouter allow the application to run without per-user billing. The automatic fallback across 7 models makes it resilient to individual model outages or rate limits.

**Why no streaming?**
Agents return structured JSON that must be parsed in full before any action (checklist updates, artifact saves) can be applied. Streaming partial JSON is not reliably parseable. The typing indicator provides visual feedback during inference.

**Why store file content in PostgreSQL rather than object storage?**
All agent-produced content is text (R scripts, markdown, NONMEM control streams). Storing as TEXT columns in Supabase makes it trivial to query, display, and copy without presigned URLs or CORS configuration. For binary assets (actual plot images) a future migration to Supabase Storage would be appropriate.

**Why `processOneTask` bypasses Scientist II in autonomous mode?**
In autonomous mode the checklist is already planned. Routing every task through Scientist II would double the LLM calls with no benefit — the routing decision (`agentForSection`) is deterministic from the section number. Scientist II is still involved when the user sends a new chat message, which may redirect the analysis.

**Why `as const` on the THEME object?**
TypeScript infers string literal types (e.g. `'bg-green-700'` not `string`) from `as const`, which means IDE autocomplete works on THEME keys and values, and mistyped class names produce type errors.

**Why HITL defaults to enabled on new sessions?**
A pharmacometrics analyst reviewing the checklist before a multi-hour autonomous run is standard operating procedure in regulated environments. Defaulting to enabled prevents accidental unreviewed execution on first use.
