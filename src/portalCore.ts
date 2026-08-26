import { createClient, type Session } from '@supabase/supabase-js';

const CORE_URL = 'https://uyqanhwurngoupmvzxrh.supabase.co';
const CORE_PUBLISHABLE_KEY = 'sb_publishable_SquKrj848EoO9NHZknVkSA_k8CKD7WQ';

export const forgeCore = createClient(CORE_URL, CORE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  global: { headers: { 'x-forge-module': 'portal' } }
});

export type PortalQuote = {
  id: string;
  quote_number?: string;
  status?: string;
  title?: string;
  current_revision?: number;
  currency?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
  quote_date?: string;
  expiry_date?: string;
  updated_at?: string;
};

export type PortalDelivery = {
  id: string;
  delivery_number?: string;
  status?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  direction?: string;
  address?: Record<string, unknown>;
  truck?: string;
  driver?: string;
  load_type?: string;
  notes?: string;
};

export type PortalDocument = {
  id: string;
  title?: string;
  original_filename?: string;
  document_type?: string;
  status?: string;
  mime_type?: string;
  file_size_bytes?: number;
  storage_bucket: string;
  storage_path: string;
  created_at?: string;
};

export type PortalProject = {
  id: string;
  organization_id: string;
  organization_name?: string;
  customer_id?: string;
  customer_name?: string;
  project_number?: string;
  name?: string;
  status?: string;
  description?: string;
  address?: Record<string, unknown>;
  updated_at?: string;
  permissions: { quotes: boolean; documents: boolean; deliveries: boolean; approve: boolean };
  quotes: PortalQuote[];
  deliveries: PortalDelivery[];
  documents: PortalDocument[];
};

export type PortalDashboard = {
  user_id?: string;
  grants: Array<Record<string, unknown>>;
  projects: PortalProject[];
};

export type PortalQuoteResponse = {
  id: string;
  organization_id: string;
  project_id?: string;
  quote_id: string;
  user_id: string;
  response: 'approved' | 'changes_requested' | 'declined';
  note?: string;
  created_at: string;
};

export async function getPortalSession(): Promise<Session | null> {
  const { data, error } = await forgeCore.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function sendPortalMagicLink(email: string) {
  const { error } = await forgeCore.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: window.location.origin }
  });
  if (error) throw error;
}

export async function signOutPortal() {
  const { error } = await forgeCore.auth.signOut();
  if (error) throw error;
}

export async function loadPortalDashboard(): Promise<PortalDashboard> {
  const { data, error } = await forgeCore.rpc('portal_dashboard_v1');
  if (error) throw error;
  const value = (data || {}) as PortalDashboard;
  return { grants: value.grants || [], projects: value.projects || [], user_id: value.user_id };
}

export async function loadPortalQuoteResponses(projectId: string): Promise<PortalQuoteResponse[]> {
  const { data, error } = await forgeCore
    .from('portal_quote_responses')
    .select('id,organization_id,project_id,quote_id,user_id,response,note,created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as PortalQuoteResponse[];
}

export async function submitPortalQuoteResponse(quoteId: string, response: PortalQuoteResponse['response'], note?: string) {
  const { data, error } = await forgeCore.rpc('submit_portal_quote_response_v1', {
    p_quote_id: quoteId,
    p_response: response,
    p_note: note || null
  });
  if (error) throw error;
  return data as string;
}

export async function createPortalDocumentUrl(document: PortalDocument) {
  const { data, error } = await forgeCore.storage
    .from(document.storage_bucket)
    .createSignedUrl(document.storage_path, 120);
  if (error) throw error;
  return data.signedUrl;
}
