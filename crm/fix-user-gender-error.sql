-- =====================================================
-- FIX: Erro de user_gender ao cadastrar clientes
-- =====================================================

-- Este erro ocorre porque existem políticas RLS antigas ou inválidas
-- que referenciam uma coluna 'user_gender' que não existe.

-- PASSO 1: Listar todas as políticas da tabela leads
-- Execute isso primeiro para ver quais políticas existem
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'leads';

-- PASSO 2: Remover TODAS as políticas existentes da tabela leads
-- (Vamos recriá-las corretamente depois)
DROP POLICY IF EXISTS "Vendedores can view own leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert own leads" ON public.leads;
DROP POLICY IF EXISTS "Vendedores can update own leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can update all leads" ON public.leads;
DROP POLICY IF EXISTS "Vendedores can delete own leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can delete all leads" ON public.leads;

-- Remover outras políticas que possam existir (com nomes diferentes)
-- Se aparecerem outras no PASSO 1, adicione aqui

-- PASSO 3: Recriar as políticas corretas
-- Estas políticas NÃO usam user_gender ou qualquer outra coluna inexistente

-- SELECT: Vendedores vêem apenas seus próprios leads
CREATE POLICY "Vendedores can view own leads"
  ON public.leads FOR SELECT
  USING (auth.uid() = user_id);

-- SELECT: Admins vêem todos os leads
CREATE POLICY "Admins can view all leads"
  ON public.leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND type = 'admin'
    )
  );

-- INSERT: Usuários autenticados podem inserir leads com seu próprio user_id
CREATE POLICY "Users can insert own leads"
  ON public.leads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Vendedores podem atualizar apenas seus próprios leads
CREATE POLICY "Vendedores can update own leads"
  ON public.leads FOR UPDATE
  USING (auth.uid() = user_id);

-- UPDATE: Admins podem atualizar todos os leads
CREATE POLICY "Admins can update all leads"
  ON public.leads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND type = 'admin'
    )
  );

-- DELETE: Vendedores podem deletar apenas seus próprios leads
CREATE POLICY "Vendedores can delete own leads"
  ON public.leads FOR DELETE
  USING (auth.uid() = user_id);

-- DELETE: Admins podem deletar todos os leads
CREATE POLICY "Admins can delete all leads"
  ON public.leads FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND type = 'admin'
    )
  );

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se as políticas foram recriadas corretamente
SELECT 
    policyname, 
    cmd,
    qual::text as using_expression
FROM pg_policies 
WHERE tablename = 'leads'
ORDER BY policyname;

-- Se ainda houver erros, você pode desabilitar temporariamente o RLS:
-- ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
-- MAS ISSO NÃO É RECOMENDADO EM PRODUÇÃO!
