import { supabase } from '../lib/supabase';
import type { Invocation, PromptEnvelope, EnvelopeResponse } from '../lib/types';
import type { AgentRole } from '../lib/types';

export async function getInvocations(sessionId: string): Promise<Invocation[]> {
  const { data, error } = await supabase
    .from('invocations')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Invocation[];
}

export async function createInvocation(
  sessionId: string,
  agentRole: AgentRole,
  checklistRef?: string,
  requestPayload?: PromptEnvelope
): Promise<Invocation> {
  const { data, error } = await supabase
    .from('invocations')
    .insert({
      session_id: sessionId,
      agent_role: agentRole,
      checklist_ref: checklistRef || null,
      status: 'running',
      request_payload: requestPayload || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Invocation;
}

export async function completeInvocation(
  id: string,
  response: EnvelopeResponse
): Promise<void> {
  const { error } = await supabase
    .from('invocations')
    .update({
      status: response.status,
      response_payload: response,
      task_summary: response.task_summary,
      completed_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

export async function clearInvocations(sessionId: string): Promise<void> {
  const { error } = await supabase.from('invocations').delete().eq('session_id', sessionId);
  if (error) throw error;
}
