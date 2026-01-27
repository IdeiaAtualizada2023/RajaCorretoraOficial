// =====================================================
// CLIENTE SUPABASE - Configuração Centralizada
// =====================================================

// Importar biblioteca do Supabase via CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Configurações do projeto
const SUPABASE_URL = 'https://ebnpbecpckshavgnabqe.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_zBQAusjPzi68UItIFjeHMA_V3OoAW3D';

// Criar cliente Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Verificar se usuário está autenticado
 */
export async function isAuthenticated() {
  const { data: { session } } = await supabase.auth.getSession();
  return session !== null;
}

/**
 * Obter usuário atual
 */
export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) return null;
  
  // Buscar perfil do usuário
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  return {
    ...session.user,
    profile
  };
}

/**
 * Verificar se usuário é admin
 */
export async function isAdmin() {
  const user = await getCurrentUser();
  return user && user.profile && user.profile.type === 'admin';
}

/**
 * Fazer login
 */
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    return { success: false, message: error.message };
  }
  
  return { success: true, user: data.user, session: data.session };
}

/**
 * Fazer logout
 */
export async function logout() {
  const { error } = await supabase.auth.signOut();
  return { success: !error, error };
}

/**
 * Criar novo usuário (apenas admin)
 */
export async function createUser(email, password, name, type = 'vendedor') {
  try {
    // Criar usuário no auth.users
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          type
        }
      }
    });
    
    if (error) throw error;
    
    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Listar todos os usuários (apenas admin)
 */
export async function getAllUsers() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*, auth.users!inner(email)')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Atualizar perfil de usuário
 */
export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    return { success: false, message: error.message };
  }
  
  return { success: true, data };
}

/**
 * Deletar usuário (apenas admin)
 */
export async function deleteUser(userId) {
  // Primeiro deletar o perfil (cascade vai deletar o auth.user)
  const { error } = await supabase
    .from('user_profiles')
    .delete()
    .eq('id', userId);
  
  if (error) {
    return { success: false, message: error.message };
  }
  
  return { success: true };
}

// =====================================================
// LEADS FUNCTIONS
// =====================================================

/**
 * Criar novo lead
 */
export async function createLead(leadData) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return { success: false, message: 'Usuário não autenticado' };
  }
  
  const { data, error } = await supabase
    .from('leads')
    .insert({
      ...leadData,
      user_id: session.user.id
    })
    .select()
    .single();
  
  if (error) {
    return { success: false, message: error.message };
  }
  
  return { success: true, data };
}

/**
 * Obter todos os leads (vendedor vê só os seus, admin vê todos)
 */
export async function getAllLeads() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Erro ao buscar leads:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Atualizar lead
 */
export async function updateLead(leadId, updates) {
  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', leadId)
    .select()
    .single();
  
  if (error) {
    return { success: false, message: error.message };
  }
  
  return { success: true, data };
}

/**
 * Deletar lead
 */
export async function deleteLead(leadId) {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', leadId);
  
  if (error) {
    return { success: false, message: error.message };
  }
  
  return { success: true };
}

// Log de inicialização
console.log('✅ Supabase Client inicializado');
