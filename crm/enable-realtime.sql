-- Execute este script no SQL Editor do Supabase para habilitar a sincronização em tempo real na tabela leads
-- Caso receba uma mensagem dizendo que a tabela já existe na publicação, significa que já está ativo e você pode ignorar.

ALTER PUBLICATION supabase_realtime ADD TABLE leads;
