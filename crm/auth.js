// Sistema de Autenticação CRM - Raja Planos de Saúde
// Gerenciamento de usuários e sessões usando LocalStorage

class AuthSystem {
    constructor() {
        this.USERS_KEY = 'crm_users';
        this.SESSION_KEY = 'crm_session';
        this.initializeDefaultAdmin();
    }

    // Inicializa admin padrão se não existir
    initializeDefaultAdmin() {
        const users = this.getAllUsers();
        if (users.length === 0) {
            const defaultAdmin = {
                id: this.generateId(),
                email: 'admin@raja.com',
                password: btoa('admin@2026'), // Base64 encoding
                name: 'Administrador',
                type: 'admin',
                createdAt: new Date().toISOString()
            };
            this.saveUsers([defaultAdmin]);
        }
    }

    // Gera ID único
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Obtém todos os usuários
    getAllUsers() {
        const users = localStorage.getItem(this.USERS_KEY);
        return users ? JSON.parse(users) : [];
    }

    // Salva usuários
    saveUsers(users) {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    }

    // Registra novo usuário (apenas admin pode fazer)
    registerUser(email, password, name, type = 'vendedor') {
        const users = this.getAllUsers();
        
        // Verifica se email já existe
        if (users.find(u => u.email === email)) {
            return { success: false, message: 'Email já cadastrado!' };
        }

        const newUser = {
            id: this.generateId(),
            email: email.toLowerCase().trim(),
            password: btoa(password), // Base64 encoding
            name: name.trim(),
            type: type,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        this.saveUsers(users);
        return { success: true, message: 'Usuário cadastrado com sucesso!', user: newUser };
    }

    // Login
    login(email, password) {
        const users = this.getAllUsers();
        const user = users.find(u => 
            u.email === email.toLowerCase().trim() && 
            u.password === btoa(password)
        );

        if (user) {
            const session = {
                userId: user.id,
                email: user.email,
                name: user.name,
                type: user.type,
                loginTime: new Date().toISOString()
            };
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
            return { success: true, message: 'Login realizado com sucesso!', user: session };
        }

        return { success: false, message: 'Email ou senha incorretos!' };
    }

    // Verifica se está logado
    isAuthenticated() {
        const session = this.getSession();
        if (!session) return false;

        // Verifica se a sessão expirou (24 horas)
        const loginTime = new Date(session.loginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
            this.logout();
            return false;
        }

        return true;
    }

    // Obtém sessão atual
    getSession() {
        const session = localStorage.getItem(this.SESSION_KEY);
        return session ? JSON.parse(session) : null;
    }

    // Verifica se é admin
    isAdmin() {
        const session = this.getSession();
        return session && session.type === 'admin';
    }

    // Logout
    logout() {
        localStorage.removeItem(this.SESSION_KEY);
    }

    // Atualizar usuário
    updateUser(userId, updates) {
        const users = this.getAllUsers();
        const index = users.findIndex(u => u.id === userId);
        
        if (index === -1) {
            return { success: false, message: 'Usuário não encontrado!' };
        }

        // Não permite alterar o email do admin padrão
        if (users[index].email === 'admin@raja.com' && updates.email && updates.email !== 'admin@raja.com') {
            return { success: false, message: 'Não é possível alterar o email do administrador!' };
        }

        // Atualiza campos
        if (updates.name) users[index].name = updates.name.trim();
        if (updates.email) users[index].email = updates.email.toLowerCase().trim();
        if (updates.password) users[index].password = btoa(updates.password);
        if (updates.type) users[index].type = updates.type;

        this.saveUsers(users);
        return { success: true, message: 'Usuário atualizado com sucesso!' };
    }

    // Deletar usuário
    deleteUser(userId) {
        const users = this.getAllUsers();
        const user = users.find(u => u.id === userId);
        
        // Não permite deletar o admin padrão
        if (user && user.email === 'admin@raja.com') {
            return { success: false, message: 'Não é possível excluir o administrador principal!' };
        }

        const filtered = users.filter(u => u.id !== userId);
        this.saveUsers(filtered);
        return { success: true, message: 'Usuário excluído com sucesso!' };
    }

    // Obter usuário por ID
    getUserById(userId) {
        const users = this.getAllUsers();
        return users.find(u => u.id === userId);
    }
}

// Inicializa sistema global
const auth = new AuthSystem();
