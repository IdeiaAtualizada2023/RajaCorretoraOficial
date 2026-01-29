-- =====================================================
-- INSTALAÇÃO COMPLETA DO BANCO DE DADOS - RAJA CRM
-- Execute este SQL no SQL Editor do Supabase
-- =====================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CRIAR TABELA DE PERFIS DE USUÁRIOS
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('admin', 'vendedor')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_type ON public.user_profiles(type);

-- 3. CRIAR TABELA DE LEADS (CRM)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Status da venda
  status TEXT DEFAULT 'col1' CHECK (status IN ('col1', 'col2', 'col3', 'col4', 'col5', 'col6', 'cancelados')),
  
  -- Dados da Venda
  data_venda DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  
  -- Dados do Titular
  titular_nome TEXT NOT NULL,
  titular_cpf TEXT,
  titular_nascimento DATE,
  titular_cidade TEXT,
  titular_telefone1 TEXT,
  titular_telefone2 TEXT,
  titular_plano TEXT,
  titular_valor DECIMAL(10,2),
  titular_desconto DECIMAL(10,2) DEFAULT 0,
  
  -- Dependentes (armazenado como JSON)
  dependentes JSONB DEFAULT '[]'::jsonb,
  
  -- Total geral
  total_geral DECIMAL(10,2),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_data_venda ON public.leads(data_venda);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- 4. FUNCTION PARA ATUALIZAR updated_at AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. HABILITAR ROW LEVEL SECURITY
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 6. REMOVER POLÍTICAS ANTIGAS (se existirem)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Vendedores can view own leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert own leads" ON public.leads;
DROP POLICY IF EXISTS "Vendedores can update own leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can update all leads" ON public.leads;
DROP POLICY IF EXISTS "Vendedores can delete own leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can delete all leads" ON public.leads;

-- 7. CRIAR POLÍTICAS PARA user_profiles
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND type = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles"
  ON public.user_profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND type = 'admin'
    )
  );

CREATE POLICY "Admins can update profiles"
  ON public.user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND type = 'admin'
    )
  );

CREATE POLICY "Admins can delete profiles"
  ON public.user_profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND type = 'admin'
    )
    AND id != auth.uid()
  );

-- 8. CRIAR POLÍTICAS PARA leads
CREATE POLICY "Vendedores can view own leads"
  ON public.leads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all leads"
  ON public.leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND type = 'admin'
    )
  );

CREATE POLICY "Users can insert own leads"
  ON public.leads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Vendedores can update own leads"
  ON public.leads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all leads"
  ON public.leads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND type = 'admin'
    )
  );

CREATE POLICY "Vendedores can delete own leads"
  ON public.leads FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete all leads"
  ON public.leads FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND type = 'admin'
    )
  );

-- 9. FUNCTION PARA CRIAR PERFIL AUTOMÁTICO APÓS SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'type', 'vendedor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar criação das tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'leads');

-- Verificar as políticas criadas
SELECT 
    tablename,
    policyname, 
    cmd
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'leads')
ORDER BY tablename, policyname;

-- =====================================================
-- INSTALAÇÃO CONCLUÍDA!
-- =====================================================
-- Próximo passo: Criar o usuário admin no painel do Supabase
-- Authentication -> Users -> Add user
-- Email: admin@raja.com
-- Password: admin@2026
-- User Metadata: { "name": "Administrador", "type": "admin" }
