import { createClient } from '@supabase/supabase-js';

export const SUPABASE_CREDS_KEY = 'pmx_supabase_credentials';

function resolveCredentials(): { url: string; anonKey: string } {
  try {
    const raw = localStorage.getItem(SUPABASE_CREDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { url?: string; anonKey?: string };
      if (parsed.url && parsed.anonKey) return { url: parsed.url, anonKey: parsed.anonKey };
    }
  } catch { /* ignore */ }
  return {
    url: import.meta.env.VITE_SUPABASE_URL as string,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  };
}

const { url, anonKey } = resolveCredentials();
export const supabase = createClient(url, anonKey);

export function isUsingCustomCredentials(): boolean {
  try {
    const raw = localStorage.getItem(SUPABASE_CREDS_KEY);
    if (!raw) return false;
    const p = JSON.parse(raw) as { url?: string; anonKey?: string };
    return !!(p.url && p.anonKey);
  } catch { return false; }
}

export function getActiveUrl(): string {
  return resolveCredentials().url;
}

export async function testCredentials(
  url: string,
  anonKey: string
): Promise<{ valid: boolean; tablesExist: boolean; error?: string }> {
  const trimUrl = url.replace(/\/$/, '');
  try {
    const resp = await fetch(`${trimUrl}/rest/v1/sessions?limit=0`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Accept: 'application/json',
      },
    });

    if (resp.status === 200) return { valid: true, tablesExist: true };

    if (resp.status === 404 || resp.status === 400) {
      const body = await resp.json().catch(() => ({}));
      // PostgREST "relation does not exist" code
      if ((body as { code?: string }).code === '42P01') {
        return { valid: true, tablesExist: false };
      }
      return { valid: false, error: `HTTP ${resp.status}: ${JSON.stringify(body)}` };
    }

    if (resp.status === 401) return { valid: false, error: 'Invalid API key — check your anon key.' };
    if (resp.status === 0 || !resp.ok) return { valid: false, error: `Connection failed (HTTP ${resp.status})` };

    return { valid: false, error: `Unexpected status ${resp.status}` };
  } catch (err) {
    const msg = String(err);
    if (msg.includes('fetch')) return { valid: false, error: 'Could not reach the URL. Check it is correct and CORS is enabled.' };
    return { valid: false, error: msg };
  }
}

export function extractProjectRef(url: string): string | null {
  const m = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
  return m ? m[1] : null;
}

/** Run the migration SQL via Supabase Management API.
 *  Requires a personal access token from supabase.com/dashboard/account/tokens.
 *  Statements are executed individually; "already exists" errors are silently ignored. */
export async function runMigrationSQL(
  projectRef: string,
  managementToken: string
): Promise<{ success: boolean; error?: string }> {
  const statements = MIGRATION_SQL
    .split(/;\s*\n/)
    .map(s => s.trim().replace(/^--[^\n]*\n?/gm, '').trim())
    .filter(s => s.length > 2);

  for (const stmt of statements) {
    const sql = stmt.endsWith(';') ? stmt : `${stmt};`;
    try {
      const resp = await fetch(
        `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${managementToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: sql }),
        }
      );
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({})) as { message?: string; error?: string };
        const msg = body.message || body.error || `HTTP ${resp.status}`;
        if (!msg.toLowerCase().includes('already exists')) {
          return { success: false, error: msg };
        }
      }
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }
  return { success: true };
}

export const MIGRATION_SQL = `-- PMx Pharmacometrics Schema Migration
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  compound TEXT,
  software_stack TEXT,
  analysis_type TEXT,
  data_status TEXT DEFAULT 'unknown',
  hitl_enabled BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_sessions" ON sessions;
CREATE POLICY "select_sessions" ON sessions FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "insert_sessions" ON sessions;
CREATE POLICY "insert_sessions" ON sessions FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "update_sessions" ON sessions;
CREATE POLICY "update_sessions" ON sessions FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_sessions" ON sessions;
CREATE POLICY "delete_sessions" ON sessions FOR DELETE TO anon USING (true);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  agent TEXT,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_messages" ON messages;
CREATE POLICY "select_messages" ON messages FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "insert_messages" ON messages;
CREATE POLICY "insert_messages" ON messages FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "update_messages" ON messages;
CREATE POLICY "update_messages" ON messages FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_messages" ON messages;
CREATE POLICY "delete_messages" ON messages FOR DELETE TO anon USING (true);

-- Checklist items
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  section_number TEXT,
  section_title TEXT,
  item_ref TEXT,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  item_type TEXT DEFAULT 'task',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_checklist" ON checklist_items;
CREATE POLICY "select_checklist" ON checklist_items FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "insert_checklist" ON checklist_items;
CREATE POLICY "insert_checklist" ON checklist_items FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "update_checklist" ON checklist_items;
CREATE POLICY "update_checklist" ON checklist_items FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_checklist" ON checklist_items;
CREATE POLICY "delete_checklist" ON checklist_items FOR DELETE TO anon USING (true);

-- Invocations
CREATE TABLE IF NOT EXISTS invocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  envelope_id UUID DEFAULT gen_random_uuid(),
  agent_role TEXT NOT NULL,
  checklist_ref TEXT,
  status TEXT DEFAULT 'pending',
  request_payload JSONB,
  response_payload JSONB,
  task_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE invocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_invocations" ON invocations;
CREATE POLICY "select_invocations" ON invocations FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "insert_invocations" ON invocations;
CREATE POLICY "insert_invocations" ON invocations FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "update_invocations" ON invocations;
CREATE POLICY "update_invocations" ON invocations FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_invocations" ON invocations;
CREATE POLICY "delete_invocations" ON invocations FOR DELETE TO anon USING (true);

-- Artifacts (virtual file system)
CREATE TABLE IF NOT EXISTS artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  artifact_type TEXT NOT NULL,
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_artifacts" ON artifacts;
CREATE POLICY "select_artifacts" ON artifacts FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "insert_artifacts" ON artifacts;
CREATE POLICY "insert_artifacts" ON artifacts FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "update_artifacts" ON artifacts;
CREATE POLICY "update_artifacts" ON artifacts FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_artifacts" ON artifacts;
CREATE POLICY "delete_artifacts" ON artifacts FOR DELETE TO anon USING (true);
`;
