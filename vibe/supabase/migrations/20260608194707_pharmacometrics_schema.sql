
-- Sessions table
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
CREATE POLICY "select_sessions" ON sessions FOR SELECT TO anon USING (true);
CREATE POLICY "insert_sessions" ON sessions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "update_sessions" ON sessions FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "delete_sessions" ON sessions FOR DELETE TO anon USING (true);

-- Messages table
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
CREATE POLICY "select_messages" ON messages FOR SELECT TO anon USING (true);
CREATE POLICY "insert_messages" ON messages FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "update_messages" ON messages FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "delete_messages" ON messages FOR DELETE TO anon USING (true);

-- Checklist items table
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
CREATE POLICY "select_checklist" ON checklist_items FOR SELECT TO anon USING (true);
CREATE POLICY "insert_checklist" ON checklist_items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "update_checklist" ON checklist_items FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "delete_checklist" ON checklist_items FOR DELETE TO anon USING (true);

-- Invocations table
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
CREATE POLICY "select_invocations" ON invocations FOR SELECT TO anon USING (true);
CREATE POLICY "insert_invocations" ON invocations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "update_invocations" ON invocations FOR UPDATE TO anon USING (true) WITH CHECK (true);
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
CREATE POLICY "select_artifacts" ON artifacts FOR SELECT TO anon USING (true);
CREATE POLICY "insert_artifacts" ON artifacts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "update_artifacts" ON artifacts FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "delete_artifacts" ON artifacts FOR DELETE TO anon USING (true);
