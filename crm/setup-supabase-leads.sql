-- =====================================================
-- SCRIPT SQL PARA CRIAR TABELA LEADS NO SUPABASE
-- =====================================================
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Criar tabela leads
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('col1', 'col2', 'col3', 'col4', 'col5', 'col6', 'cancelados')),
  venda DATE NOT NULL,
  vencimento DATE NOT NULL,
  titular JSONB NOT NULL,
  dependentes JSONB DEFAULT '[]'::jsonb,
  total_geral DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_venda ON leads(venda);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- 3. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Habilitar Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 6. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Admins can view all leads" ON leads;
DROP POLICY IF EXISTS "Vendedores can view own leads" ON leads;
DROP POLICY IF EXISTS "Users can insert own leads" ON leads;
DROP POLICY IF EXISTS "Users can update own leads" ON leads;
DROP POLICY IF EXISTS "Users can delete own leads" ON leads;
DROP POLICY IF EXISTS "Admins can do everything" ON leads;

-- 7. Criar políticas RLS

-- Admins podem fazer tudo
CREATE POLICY "Admins can do everything"
  ON leads
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.type = 'admin'
    )
  );

-- Vendedores podem ver apenas seus próprios leads
CREATE POLICY "Vendedores can view own leads"
  ON leads
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.type = 'admin'
    )
  );

-- Vendedores podem inserir seus próprios leads
CREATE POLICY "Vendedores can insert own leads"
  ON leads
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Vendedores podem atualizar seus próprios leads
CREATE POLICY "Vendedores can update own leads"
  ON leads
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Vendedores podem deletar seus próprios leads
CREATE POLICY "Vendedores can delete own leads"
  ON leads
  FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar se a tabela foi criada corretamente
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies
WHERE tablename = 'leads';
