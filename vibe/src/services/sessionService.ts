import { supabase } from '../lib/supabase';
import type { Session, ChecklistItem, Artifact } from '../lib/types';
import { DEFAULT_CHECKLIST_SECTIONS } from '../lib/config';

export async function createSession(params: {
  name: string;
  compound?: string;
  software_stack?: string;
  analysis_type?: string;
  hitl_enabled?: boolean;
}): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      name: params.name,
      compound: params.compound || null,
      software_stack: params.software_stack || null,
      analysis_type: params.analysis_type || null,
      hitl_enabled: params.hitl_enabled ?? true,
      status: 'active',
    })
    .select()
    .single();

  if (error) throw error;
  return data as Session;
}

export async function getSessions(): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Session[];
}

export async function updateSession(id: string, updates: Partial<Session>): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function getChecklist(sessionId: string): Promise<ChecklistItem[]> {
  const { data, error } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('session_id', sessionId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ChecklistItem[];
}

export async function createDefaultChecklist(sessionId: string): Promise<ChecklistItem[]> {
  const items: Omit<ChecklistItem, 'id' | 'created_at' | 'updated_at'>[] = [];
  let sortOrder = 0;

  for (const section of DEFAULT_CHECKLIST_SECTIONS) {
    items.push({
      session_id: sessionId,
      section_number: section.number,
      section_title: section.title,
      item_ref: section.number,
      description: section.title,
      status: 'pending',
      item_type: 'section',
      sort_order: sortOrder++,
    });
    for (const task of section.tasks) {
      items.push({
        session_id: sessionId,
        section_number: section.number,
        section_title: section.title,
        item_ref: task.ref,
        description: task.description,
        status: 'pending',
        item_type: 'task',
        sort_order: sortOrder++,
      });
    }
  }

  const { data, error } = await supabase
    .from('checklist_items')
    .insert(items)
    .select();
  if (error) throw error;
  return (data ?? []) as ChecklistItem[];
}

export async function updateChecklistItem(
  id: string,
  updates: Partial<ChecklistItem>
): Promise<void> {
  const { error } = await supabase
    .from('checklist_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function addChecklistItem(
  _sessionId: string,
  item: Omit<ChecklistItem, 'id' | 'created_at' | 'updated_at'>
): Promise<ChecklistItem> {
  const { data, error } = await supabase
    .from('checklist_items')
    .insert(item)
    .select()
    .single();
  if (error) throw error;
  return data as ChecklistItem;
}

export async function getNextPendingTask(sessionId: string): Promise<ChecklistItem | null> {
  const { data, error } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('session_id', sessionId)
    .eq('status', 'pending')
    .eq('item_type', 'task')
    .order('sort_order', { ascending: true })
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ? (data as ChecklistItem) : null;
}

export async function isChecklistComplete(sessionId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('checklist_items')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .eq('status', 'pending')
    .eq('item_type', 'task');
  if (error) throw error;
  return (count ?? 0) === 0;
}

export async function getArtifacts(sessionId: string): Promise<Artifact[]> {
  const { data, error } = await supabase
    .from('artifacts')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Artifact[];
}

export async function addArtifact(
  sessionId: string,
  artifact: { path: string; artifact_type: string; content?: string; metadata?: Record<string, unknown> }
): Promise<Artifact> {
  const { data, error } = await supabase
    .from('artifacts')
    .insert({ session_id: sessionId, ...artifact })
    .select()
    .single();
  if (error) throw error;
  return data as Artifact;
}

export async function isDefaultChecklist(sessionId: string): Promise<boolean> {
  const items = await getChecklist(sessionId);
  if (items.length === 0) return false;
  const hasCompletedTasks = items.some(i => i.item_type === 'task' && i.status === 'complete');
  if (hasCompletedTasks) return false;
  return true;
}

export async function deleteChecklistItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('checklist_items')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function deleteChecklistSection(sessionId: string, sectionNumber: string): Promise<void> {
  const { error } = await supabase
    .from('checklist_items')
    .delete()
    .eq('session_id', sessionId)
    .eq('section_number', sectionNumber);
  if (error) throw error;
}

export async function deleteSession(id: string): Promise<void> {
  // Delete in dependency order; FK cascades handle most, but be explicit
  const { error: msgErr } = await supabase.from('messages').delete().eq('session_id', id);
  if (msgErr) throw msgErr;
  const { error: clErr } = await supabase.from('checklist_items').delete().eq('session_id', id);
  if (clErr) throw clErr;
  const { error: artErr } = await supabase.from('artifacts').delete().eq('session_id', id);
  if (artErr) throw artErr;
  const { error } = await supabase.from('sessions').delete().eq('id', id);
  if (error) throw error;
}

export async function duplicateSession(source: Session): Promise<Session> {
  const { data: newSession, error: sessErr } = await supabase
    .from('sessions')
    .insert({
      name: `${source.name} (Copy)`,
      compound: source.compound ?? null,
      software_stack: source.software_stack ?? null,
      analysis_type: source.analysis_type ?? null,
      hitl_enabled: source.hitl_enabled,
      status: 'active',
    })
    .select()
    .single();
  if (sessErr) throw sessErr;

  // Copy checklist items
  const { data: items, error: clErr } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('session_id', source.id)
    .order('sort_order', { ascending: true });
  if (clErr) throw clErr;

  if (items && items.length > 0) {
    const cloned = items.map(({ id: _id, created_at: _ca, updated_at: _ua, session_id: _sid, ...rest }) => ({
      ...rest,
      session_id: (newSession as Session).id,
    }));
    const { error: insertErr } = await supabase.from('checklist_items').insert(cloned);
    if (insertErr) throw insertErr;
  }

  return newSession as Session;
}

