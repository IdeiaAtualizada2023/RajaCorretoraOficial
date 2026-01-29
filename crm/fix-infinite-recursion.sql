-- =====================================================
-- FIX DEFINITIVO: Recursão Infinita nas Políticas RLS
-- =====================================================
-- Este script resolve o erro de recursão infinita que ocorre
-- quando as políticas tentam verificar user_profiles de dentro
-- das próprias políticas de user_profiles.

-- SOLUÇÃO: Usar uma função SECURITY DEFINER que bypassa RLS
-- para verificar o tipo de usuário de forma segura.

-- =====================================================
-- PASSO 1: Criar função auxiliar para verificar se usuário é admin
-- =====================================================

-- Remover a função se já existir
DROP FUNCTION IF EXISTS public.is_user_admin(uuid);

-- Criar função que verifica se um usuário é admin
-- SECURITY DEFINER = executa com privilégios do criador (bypassa RLS)
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_profiles
    WHERE id = user_id 
    AND type = 'admin'
  );
END;
$$;

-- Garantir que a função pode ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION public.is_user_admin(uuid) TO authenticated;

-- =====================================================
-- PASSO 2: Recriar todas as políticas de user_profiles
-- =====================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.user_profiles;

-- SELECT: Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

-- SELECT: Admins podem ver todos os perfis (usa função SECURITY DEFINER)
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (public.is_user_admin(auth.uid()));

-- INSERT: Admins podem inserir perfis (usa função SECURITY DEFINER)
CREATE POLICY "Admins can insert profiles"
  ON public.user_profiles FOR INSERT
  WITH CHECK (public.is_user_admin(auth.uid()));

-- UPDATE: Admins podem atualizar perfis (usa função SECURITY DEFINER)
CREATE POLICY "Admins can update profiles"
  ON public.user_profiles FOR UPDATE
  USING (public.is_user_admin(auth.uid()));

-- DELETE: Admins podem deletar outros perfis (mas não o próprio)
CREATE POLICY "Admins can delete profiles"
  ON public.user_profiles FOR DELETE
  USING (
    public.is_user_admin(auth.uid()) 
    AND id != auth.uid()
  );

-- =====================================================
-- PASSO 3: Recriar todas as políticas de leads
-- =====================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Vendedores can view own leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert own leads" ON public.leads;
DROP POLICY IF EXISTS "Vendedores can update own leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can update all leads" ON public.leads;
DROP POLICY IF EXISTS "Vendedores can delete own leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can delete all leads" ON public.leads;

-- SELECT: Vendedores vêem apenas seus próprios leads
CREATE POLICY "Vendedores can view own leads"
  ON public.leads FOR SELECT
  USING (auth.uid() = user_id);

-- SELECT: Admins vêem todos os leads (usa função SECURITY DEFINER)
CREATE POLICY "Admins can view all leads"
  ON public.leads FOR SELECT
  USING (public.is_user_admin(auth.uid()));

-- INSERT: Usuários autenticados podem inserir leads com seu próprio user_id
CREATE POLICY "Users can insert own leads"
  ON public.leads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Vendedores podem atualizar apenas seus próprios leads
CREATE POLICY "Vendedores can update own leads"
  ON public.leads FOR UPDATE
  USING (auth.uid() = user_id);

-- UPDATE: Admins podem atualizar todos os leads (usa função SECURITY DEFINER)
CREATE POLICY "Admins can update all leads"
  ON public.leads FOR UPDATE
  USING (public.is_user_admin(auth.uid()));

-- DELETE: Vendedores podem deletar apenas seus próprios leads
CREATE POLICY "Vendedores can delete own leads"
  ON public.leads FOR DELETE
  USING (auth.uid() = user_id);

-- DELETE: Admins podem deletar todos os leads (usa função SECURITY DEFINER)
CREATE POLICY "Admins can delete all leads"
  ON public.leads FOR DELETE
  USING (public.is_user_admin(auth.uid()));

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se a função foi criada
SELECT 
    proname as function_name,
    prosecdef as is_security_definer
FROM pg_proc
WHERE proname = 'is_user_admin';

-- Verificar políticas de user_profiles
SELECT 
    tablename,
    policyname, 
    cmd
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Verificar políticas de leads
SELECT 
    tablename,
    policyname, 
    cmd
FROM pg_policies 
WHERE tablename = 'leads'
ORDER BY policyname;

-- =====================================================
-- TESTE RÁPIDO (opcional)
-- =====================================================
-- Depois de executar este script, teste:
-- 1. Fazer login no CRM
-- 2. Tentar cadastrar um novo cliente
-- 3. Verificar se não há mais erro de recursão infinita
-- =====================================================
