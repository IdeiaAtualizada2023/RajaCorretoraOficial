@echo off
REM Script de Deploy Rápido - CRM Raja
REM Execute este script para fazer deploy das correções

echo 🚀 Iniciando deploy das correções do CRM...
echo.

REM Navegar para o diretório do projeto
cd /d e:\07_projetos\STICH_IDEIAATUALIZADA\01_Site_Raja_Oficial

echo 📋 Verificando status dos arquivos...
git status
echo.

echo ➕ Adicionando arquivos modificados...
git add crm/supabase-client.js
git add crm/test-supabase.html
git add crm/script.js
echo.

echo 💾 Criando commit...
git commit -m "Fix: Corrige chave Supabase e oculta colunas Venda Pendente/Finalizada"
echo.

echo 📤 Enviando para o repositório...
git push origin main
echo.

echo ✅ Deploy concluído!
echo.
echo 🔍 Próximos passos:
echo 1. Aguarde alguns minutos para o deploy automático
echo 2. Limpe o cache do navegador (Ctrl + Shift + R)
echo 3. Acesse: https://gigadendesaude.raka.com.br/crm/login.html
echo 4. Teste o login com: admin@raja.com / admin@2026
echo.

pause
