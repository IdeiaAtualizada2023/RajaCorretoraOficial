// =====================================================
// AUTENTICAÇÃO SUPABASE - Wrapper Simplificado
// =====================================================

import { 
  supabase, 
  isAuthenticated as checkAuth,
  getCurrentUser,
  isAdmin as checkAdmin,
  login as supabaseLogin,
  logout as supabaseLogout
} from './supabase-client.js';

// Exportar funções de autenticação
export const auth = {
  /**
   * Verificar se usuário está autenticado
   */
  async isAuthenticated() {
    return await checkAuth();
  },

  /**
   * Obter sessão atual
   */
  async getSession() {
    const user = await getCurrentUser();
    if (!user) return null;
    
    return {
      userId: user.id,
      email: user.email,
      name: user.profile?.name || user.email,
      type: user.profile?.type || 'vendedor',
      loginTime: new Date().toISOString()
    };
  },

  /**
   * Verificar se é admin
   */
  async isAdmin() {
    return await checkAdmin();
  },

  /**
   * Fazer login
   */
  async login(email, password) {
    const result = await supabaseLogin(email, password);
    
    if (!result.success) {
      return { success: false, message: result.message };
    }
    
    // Buscar perfil do usuário
    const user = await getCurrentUser();
    
    return { 
      success: true, 
      message: 'Login realizado com sucesso!',
      user: {
        userId: user.id,
        email: user.email,
        name: user.profile?.name || user.email,
        type: user.profile?.type || 'vendedor'
      }
    };
  },

  /**
   * Fazer logout
   */
  async logout() {
    const result = await supabaseLogout();
    return result.success;
  }
};

// Log de inicialização
console.log('✅ Supabase Auth wrapper inicializado');
