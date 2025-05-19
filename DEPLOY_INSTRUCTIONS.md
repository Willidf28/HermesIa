# Instruções para Deploy do HermesVerse

Este documento contém instruções detalhadas para realizar o deploy do HermesVerse na plataforma Vercel.

## Pré-requisitos

1. Uma conta na Vercel (pode criar gratuitamente em https://vercel.com)
2. Projeto Firebase já criado (conforme configurado anteriormente)
3. Bot do Telegram já criado (token: 7958179839:AAGmh6HuFVlIzoSA40cbueuYISt_qAWzKAk)

## Passos para Deploy

### 1. Preparação dos Arquivos

Os arquivos neste pacote já estão configurados com suas credenciais do Firebase e token do Telegram. Não é necessário modificar nenhum arquivo de configuração.

### 2. Deploy na Vercel

#### Opção 1: Deploy via Dashboard da Vercel (Recomendado)

1. Acesse https://vercel.com e faça login com sua conta
2. Clique em "Add New..." e selecione "Project"
3. Escolha "Upload" na seção "Import Git Repository"
4. Arraste e solte a pasta do projeto ou clique para selecionar os arquivos
5. Na página de configuração:
   - Nome do projeto: HermesVerse
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: (deixe o padrão)
   - Output Directory: (deixe o padrão)
6. Expanda a seção "Environment Variables" e verifique se as variáveis do arquivo .env.local estão presentes
7. Clique em "Deploy"

#### Opção 2: Deploy via Vercel CLI

1. Instale a Vercel CLI: `npm install -g vercel`
2. Navegue até a pasta do projeto: `cd caminho/para/HermesVerse`
3. Execute: `vercel login`
4. Após o login, execute: `vercel --prod`
5. Siga as instruções na tela para completar o deploy

### 3. Verificação do Deploy

1. Após o deploy ser concluído, a Vercel fornecerá um link para o seu site (geralmente https://hermesverse.vercel.app)
2. Acesse o link e verifique se o site está funcionando corretamente
3. Faça login com sua conta Google (willianarcos17@gmail.com)
4. Teste a interação com a IA Hermes

### 4. Configuração do Telegram (Opcional)

1. Abra o Telegram e pesquise pelo nome do seu bot
2. Inicie uma conversa com o bot enviando o comando `/start`
3. No site HermesVerse, acesse as configurações e vincule sua conta do Telegram

## Solução de Problemas

Se encontrar algum problema durante o deploy:

1. Verifique se todas as variáveis de ambiente estão configuradas corretamente
2. Confira os logs de build na Vercel para identificar possíveis erros
3. Certifique-se de que o Firebase está configurado corretamente e com as regras de segurança adequadas

## Próximos Passos

Após o deploy bem-sucedido:

1. Explore as funcionalidades da IA Hermes
2. Configure suas preferências de aprendizado e evolução
3. Experimente criar automações e integrações
4. Forneça feedback para melhorias futuras

Para qualquer dúvida ou suporte adicional, entre em contato através do próprio site HermesVerse.
