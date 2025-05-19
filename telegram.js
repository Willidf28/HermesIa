// Integração com Telegram para o HermesVerse
import axios from 'axios';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';

class HermesTelegram {
  constructor() {
    this.botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || '';
    this.apiBaseUrl = 'https://api.telegram.org/bot';
    this.webhookUrl = '';
    this.isConfigured = false;
    this.connectedUsers = new Map(); // userId -> telegramChatId
  }

  // Configurar o bot do Telegram
  async configure(botToken = null) {
    if (botToken) {
      this.botToken = botToken;
    }

    if (!this.botToken) {
      throw new Error('Token do bot não configurado');
    }

    try {
      // Verificar se o bot está ativo
      const response = await this.makeRequest('getMe');
      
      if (response.ok) {
        this.isConfigured = true;
        console.log(`Bot configurado: ${response.result.first_name} (@${response.result.username})`);
        return {
          success: true,
          botInfo: response.result
        };
      } else {
        throw new Error('Falha ao verificar bot');
      }
    } catch (error) {
      console.error('Erro ao configurar bot do Telegram:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Configurar webhook para receber atualizações
  async setWebhook(url) {
    if (!this.isConfigured) {
      await this.configure();
    }

    try {
      const response = await this.makeRequest('setWebhook', {
        url: url,
        allowed_updates: ['message', 'callback_query']
      });

      if (response.ok) {
        this.webhookUrl = url;
        console.log('Webhook configurado com sucesso');
        return {
          success: true,
          message: 'Webhook configurado com sucesso'
        };
      } else {
        throw new Error('Falha ao configurar webhook');
      }
    } catch (error) {
      console.error('Erro ao configurar webhook:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Conectar usuário ao Telegram
  async connectUser(userId, phoneNumber) {
    if (!this.isConfigured) {
      await this.configure();
    }

    try {
      // Gerar código de verificação único
      const verificationCode = this.generateVerificationCode();
      
      // Salvar no Firestore para verificação posterior
      const telegramConnectionsRef = collection(db, 'telegramConnections');
      await addDoc(telegramConnectionsRef, {
        userId,
        phoneNumber,
        verificationCode,
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutos
      });

      return {
        success: true,
        verificationCode,
        expiresIn: 15 * 60 // 15 minutos em segundos
      };
    } catch (error) {
      console.error('Erro ao conectar usuário ao Telegram:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verificar código de conexão
  async verifyConnection(userId, verificationCode, telegramChatId) {
    try {
      // Buscar conexão pendente
      const connectionsRef = collection(db, 'telegramConnections');
      const q = query(
        connectionsRef,
        where('userId', '==', userId),
        where('verificationCode', '==', verificationCode),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return {
          success: false,
          error: 'Código de verificação inválido ou expirado'
        };
      }
      
      const connectionDoc = querySnapshot.docs[0];
      const connectionData = connectionDoc.data();
      
      // Verificar se o código expirou
      if (new Date() > connectionData.expiresAt.toDate()) {
        await updateDoc(doc(db, 'telegramConnections', connectionDoc.id), {
          status: 'expired'
        });
        
        return {
          success: false,
          error: 'Código de verificação expirado'
        };
      }
      
      // Atualizar status da conexão
      await updateDoc(doc(db, 'telegramConnections', connectionDoc.id), {
        status: 'connected',
        telegramChatId,
        connectedAt: new Date()
      });
      
      // Salvar na coleção de usuários do Telegram
      const telegramUsersRef = collection(db, 'telegramUsers');
      await addDoc(telegramUsersRef, {
        userId,
        telegramChatId,
        phoneNumber: connectionData.phoneNumber,
        notificationsEnabled: true,
        connectedAt: new Date()
      });
      
      // Adicionar ao mapa local
      this.connectedUsers.set(userId, telegramChatId);
      
      return {
        success: true,
        message: 'Telegram conectado com sucesso!'
      };
    } catch (error) {
      console.error('Erro ao verificar conexão do Telegram:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Enviar mensagem para usuário
  async sendMessage(userId, text, options = {}) {
    if (!this.isConfigured) {
      await this.configure();
    }

    try {
      // Buscar chatId do usuário
      let chatId = this.connectedUsers.get(userId);
      
      if (!chatId) {
        // Buscar do Firestore
        const telegramUsersRef = collection(db, 'telegramUsers');
        const q = query(
          telegramUsersRef,
          where('userId', '==', userId),
          where('notificationsEnabled', '==', true)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          return {
            success: false,
            error: 'Usuário não conectado ao Telegram'
          };
        }
        
        chatId = querySnapshot.docs[0].data().telegramChatId;
        
        // Adicionar ao mapa local para futuras consultas
        this.connectedUsers.set(userId, chatId);
      }
      
      // Preparar parâmetros da mensagem
      const params = {
        chat_id: chatId,
        text: text,
        parse_mode: options.parseMode || 'HTML'
      };
      
      // Adicionar botões se fornecidos
      if (options.buttons && options.buttons.length > 0) {
        params.reply_markup = {
          inline_keyboard: options.buttons.map(row => 
            row.map(button => ({
              text: button.text,
              callback_data: button.data
            }))
          )
        };
      }
      
      // Enviar mensagem
      const response = await this.makeRequest('sendMessage', params);
      
      if (response.ok) {
        // Registrar mensagem enviada
        await addDoc(collection(db, 'telegramMessages'), {
          userId,
          telegramChatId: chatId,
          text,
          direction: 'outbound',
          messageId: response.result.message_id,
          sentAt: new Date()
        });
        
        return {
          success: true,
          messageId: response.result.message_id
        };
      } else {
        throw new Error('Falha ao enviar mensagem');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem pelo Telegram:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Processar mensagem recebida
  async processIncomingMessage(message) {
    try {
      const chatId = message.chat.id;
      const text = message.text;
      const messageId = message.message_id;
      
      // Buscar usuário pelo chatId
      const telegramUsersRef = collection(db, 'telegramUsers');
      const q = query(
        telegramUsersRef,
        where('telegramChatId', '==', chatId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Usuário não conectado, enviar instruções
        await this.makeRequest('sendMessage', {
          chat_id: chatId,
          text: 'Para conectar sua conta HermesVerse, acesse o site e insira o código que aparecerá na tela.',
          parse_mode: 'HTML'
        });
        
        return {
          success: true,
          action: 'instructions_sent'
        };
      }
      
      const userData = querySnapshot.docs[0].data();
      const userId = userData.userId;
      
      // Registrar mensagem recebida
      await addDoc(collection(db, 'telegramMessages'), {
        userId,
        telegramChatId: chatId,
        text,
        direction: 'inbound',
        messageId,
        receivedAt: new Date()
      });
      
      // Verificar se é um comando
      if (text.startsWith('/')) {
        return this.processCommand(text, chatId, userId);
      }
      
      // Processar como mensagem normal
      // Adicionar à coleção de mensagens para processamento pela IA
      await addDoc(collection(db, 'messages'), {
        text,
        sender: 'user',
        userId,
        source: 'telegram',
        timestamp: new Date()
      });
      
      // Enviar confirmação de recebimento
      await this.makeRequest('sendMessage', {
        chat_id: chatId,
        text: '✓ Mensagem recebida. Processando...',
        parse_mode: 'HTML'
      });
      
      return {
        success: true,
        action: 'message_processed',
        userId
      };
    } catch (error) {
      console.error('Erro ao processar mensagem recebida:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Processar comando
  async processCommand(text, chatId, userId) {
    const command = text.split(' ')[0].substring(1).toLowerCase();
    
    try {
      switch (command) {
        case 'start':
          await this.makeRequest('sendMessage', {
            chat_id: chatId,
            text: 'Bem-vindo ao Hermes! Eu sou sua IA evolutiva. Você pode me enviar mensagens aqui e eu responderei como se estivesse no site HermesVerse.',
            parse_mode: 'HTML'
          });
          break;
          
        case 'help':
          await this.makeRequest('sendMessage', {
            chat_id: chatId,
            text: `<b>Comandos disponíveis:</b>
/start - Iniciar conversa
/help - Mostrar esta ajuda
/status - Verificar status da conexão
/mute - Pausar notificações
/unmute - Retomar notificações
/disconnect - Desconectar do Telegram`,
            parse_mode: 'HTML'
          });
          break;
          
        case 'status':
          // Buscar informações do usuário
          const telegramUsersRef = collection(db, 'telegramUsers');
          const q = query(
            telegramUsersRef,
            where('userId', '==', userId)
          );
          
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            
            await this.makeRequest('sendMessage', {
              chat_id: chatId,
              text: `<b>Status da Conexão:</b>
Conectado desde: ${userData.connectedAt.toDate().toLocaleString()}
Notificações: ${userData.notificationsEnabled ? 'Ativadas ✓' : 'Desativadas ✗'}
Telefone: ${userData.phoneNumber}`,
              parse_mode: 'HTML'
            });
          }
          break;
          
        case 'mute':
          // Desativar notificações
          const muteRef = collection(db, 'telegramUsers');
          const muteQuery = query(
            muteRef,
            where('userId', '==', userId),
            where('telegramChatId', '==', chatId)
          );
          
          const muteSnapshot = await getDocs(muteQuery);
          
          if (!muteSnapshot.empty) {
            await updateDoc(doc(db, 'telegramUsers', muteSnapshot.docs[0].id), {
              notificationsEnabled: false
            });
            
            await this.makeRequest('sendMessage', {
              chat_id: chatId,
              text: 'Notificações pausadas. Use /unmute para reativá-las.',
              parse_mode: 'HTML'
            });
          }
          break;
          
        case 'unmute':
          // Reativar notificações
          const unmuteRef = collection(db, 'telegramUsers');
          const unmuteQuery = query(
            unmuteRef,
            where('userId', '==', userId),
            where('telegramChatId', '==', chatId)
          );
          
          const unmuteSnapshot = await getDocs(unmuteQuery);
          
          if (!unmuteSnapshot.empty) {
            await updateDoc(doc(db, 'telegramUsers', unmuteSnapshot.docs[0].id), {
              notificationsEnabled: true
            });
            
            await this.makeRequest('sendMessage', {
              chat_id: chatId,
              text: 'Notificações reativadas! ✓',
              parse_mode: 'HTML'
            });
          }
          break;
          
        case 'disconnect':
          // Desconectar do Telegram
          const disconnectRef = collection(db, 'telegramUsers');
          const disconnectQuery = query(
            disconnectRef,
            where('userId', '==', userId),
            where('telegramChatId', '==', chatId)
          );
          
          const disconnectSnapshot = await getDocs(disconnectQuery);
          
          if (!disconnectSnapshot.empty) {
            await updateDoc(doc(db, 'telegramUsers', disconnectSnapshot.docs[0].id), {
              notificationsEnabled: false,
              disconnectedAt: new Date(),
              status: 'disconnected'
            });
            
            // Remover do mapa local
            this.connectedUsers.delete(userId);
            
            await this.makeRequest('sendMessage', {
              chat_id: chatId,
              text: 'Desconectado do HermesVerse. Para reconectar, acesse o site e configure novamente.',
              parse_mode: 'HTML'
            });
          }
          break;
          
        default:
          await this.makeRequest('sendMessage', {
            chat_id: chatId,
            text: 'Comando não reconhecido. Use /help para ver os comandos disponíveis.',
            parse_mode: 'HTML'
          });
      }
      
      return {
        success: true,
        action: `command_${command}_processed`
      };
    } catch (error) {
      console.error('Erro ao processar comando:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verificar se usuário está conectado
  async isUserConnected(userId) {
    try {
      // Verificar no mapa local primeiro
      if (this.connectedUsers.has(userId)) {
        return true;
      }
      
      // Verificar no Firestore
      const telegramUsersRef = collection(db, 'telegramUsers');
      const q = query(
        telegramUsersRef,
        where('userId', '==', userId),
        where('notificationsEnabled', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Adicionar ao mapa local para futuras consultas
        const chatId = querySnapshot.docs[0].data().telegramChatId;
        this.connectedUsers.set(userId, chatId);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao verificar conexão do usuário:', error);
      return false;
    }
  }

  // Gerar código de verificação
  generateVerificationCode() {
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      code += characters.charAt(randomIndex);
    }
    
    return code;
  }

  // Fazer requisição para a API do Telegram
  async makeRequest(method, params = {}) {
    try {
      const url = `${this.apiBaseUrl}${this.botToken}/${method}`;
      const response = await axios.post(url, params);
      return response.data;
    } catch (error) {
      console.error(`Erro na requisição para ${method}:`, error);
      throw error;
    }
  }
}

// Exportar instância única
export const hermesTelegram = new HermesTelegram();
