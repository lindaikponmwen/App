import { supabase } from '../lib/supabase';
import type { Message } from '../lib/types';
import type { AgentRole } from '../lib/types';

export async function getMessages(sessionId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Message[];
}

export async function addMessage(
  sessionId: string,
  msg: { role: Message['role']; agent?: AgentRole; content: string; metadata?: Record<string, unknown> }
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ session_id: sessionId, ...msg })
    .select()
    .single();
  if (error) throw error;
  return data as Message;
}

export async function clearMessages(sessionId: string): Promise<void> {
  const { error } = await supabase.from('messages').delete().eq('session_id', sessionId);
  if (error) throw error;
}

