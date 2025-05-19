// Integração do sistema de aprendizado com o hook principal da IA Hermes
import { useState, useEffect, useCallback } from 'react';
import { hermesLearning } from '../lib/hermes/learning';
import { auth, db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

// Hook personalizado para gerenciar a lógica da IA Hermes com aprendizado
export default function useHermesAI() {
  // Estado para mensagens
  const [messages, setMessages] = useState([]);
  // Estado para indicar quando a IA está "digitando"
  const [isTyping, setIsTyping] = useState(false);
  // Estado para configurações
  const [settings, setSettings] = useState({
    voiceEnabled: false,
    telegramConnected: false,
    autoModificationEnabled: false,
    internetAccessEnabled: false,
    learningEnabled: true
  });
  // Estado para autenticação
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Função para formatar a hora atual
  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Carregar mensagens do Firestore
  const loadMessages = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('userId', '==', user.uid),
        orderBy('timestamp', 'asc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      const loadedMessages = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        loadedMessages.push({
          text: data.text,
          sender: data.sender,
          time: data.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      });
      
      if (loadedMessages.length > 0) {
        setMessages(loadedMessages);
      } else {
        // Mensagem de boas-vindas se não houver mensagens
        const welcomeMessage = {
          text: "Olá! Eu sou Hermes, sua IA evolutiva. Estou aqui para conversar, aprender e evoluir com você. Como posso ajudar hoje?",
          sender: 'ai',
          time: getCurrentTime()
        };
        
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      // Mensagem de boas-vindas em caso de erro
      const welcomeMessage = {
        text: "Olá! Eu sou Hermes, sua IA evolutiva. Estou aqui para conversar, aprender e evoluir com você. Como posso ajudar hoje?",
        sender: 'ai',
        time: getCurrentTime()
      };
      
      setMessages([welcomeMessage]);
    }
  }, [isAuthenticated, user]);

  // Salvar mensagem no Firestore
  const saveMessageToFirestore = useCallback(async (text, sender) => {
    if (!isAuthenticated) return null;
    
    try {
      const messagesRef = collection(db, 'messages');
      const timestamp = new Date();
      
      const docRef = await addDoc(messagesRef, {
        text,
        sender,
        userId: user.uid,
        timestamp
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
      return null;
    }
  }, [isAuthenticated, user]);

  // Função para processar a mensagem do usuário e gerar resposta da IA
  const processMessage = useCallback(async (userMessage) => {
    // Simula o processamento da IA
    setIsTyping(true);
    
    try {
      // Tentar obter resposta da base de conhecimento aprendida
      const knowledgeResponse = await hermesLearning.getResponseFromKnowledge(userMessage);
      
      // Se encontrou resposta com confiança suficiente, usar
      if (knowledgeResponse && knowledgeResponse.confidence > 0.75) {
        setIsTyping(false);
        return knowledgeResponse.text;
      }
      
      // Caso contrário, usar lógica básica de resposta
      // Simula um tempo de resposta variável baseado no tamanho da mensagem
      const responseTime = Math.min(1000 + userMessage.length * 10, 3000);
      
      return new Promise(resolve => {
        setTimeout(() => {
          // Lógica básica de resposta
          let response;
          
          if (userMessage.toLowerCase().includes('olá') || userMessage.toLowerCase().includes('oi')) {
            response = "Olá! Eu sou Hermes, sua IA evolutiva. Como posso ajudar você hoje?";
          } 
          else if (userMessage.toLowerCase().includes('quem é você') || userMessage.toLowerCase().includes('o que você é')) {
            response = "Eu sou Hermes, uma IA evolutiva projetada para aprender e me adaptar às suas necessidades. Posso conversar, responder perguntas e, com sua permissão, evoluir para oferecer funcionalidades cada vez mais avançadas.";
          }
          else if (userMessage.toLowerCase().includes('telegram')) {
            response = "Posso me conectar ao Telegram para enviar notificações e permitir que você interaja comigo remotamente. Deseja configurar essa integração agora?";
          }
          else if (userMessage.toLowerCase().includes('voz')) {
            response = "Posso responder por voz usando tecnologia Text-to-Speech. Você pode ativar ou desativar essa função a qualquer momento usando o botão de microfone no chat.";
          }
          else if (userMessage.toLowerCase().includes('aprend')) {
            response = "Estou constantemente aprendendo com nossas interações. Cada conversa me ajuda a entender melhor suas preferências e necessidades, permitindo que eu evolua para servi-lo melhor.";
          }
          else if (userMessage.toLowerCase().includes('evolu')) {
            response = "Fui projetado para evoluir continuamente. Com sua autorização, posso modificar meu próprio código para adicionar novas funcionalidades e melhorar meu desempenho, tornando-me cada vez mais útil para você.";
          }
          else if (userMessage.toLowerCase().includes('firebase') || userMessage.toLowerCase().includes('banco de dados')) {
            response = "Utilizo o Firebase para armazenar de forma segura nossas conversas e suas preferências. Todos os dados são criptografados e acessíveis apenas com sua autorização.";
          }
          else if (userMessage.toLowerCase().includes('segurança') || userMessage.toLowerCase().includes('privacidade')) {
            response = "Sua segurança e privacidade são minhas prioridades. Todas as comunicações são criptografadas, e nunca compartilho seus dados sem autorização explícita. Você tem controle total sobre quais informações são armazenadas.";
          }
          else if (userMessage.toLowerCase().includes('ajuda') || userMessage.toLowerCase().includes('comandos')) {
            response = "Você pode interagir comigo naturalmente através de texto. Alguns tópicos que posso ajudar incluem: informações sobre mim, configurações de voz, integrações com Telegram, segurança e privacidade, e minha capacidade de evolução.";
          }
          else {
            response = "Entendi sua mensagem. Estou em fase inicial de aprendizado e evoluindo continuamente para oferecer respostas mais precisas e úteis. Há algo específico em que posso ajudar?";
          }
          
          setIsTyping(false);
          resolve(response);
        }, responseTime);
      });
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      setIsTyping(false);
      return "Desculpe, ocorreu um erro ao processar sua mensagem. Poderia tentar novamente?";
    }
  }, []);

  // Função para enviar mensagem
  const sendMessage = useCallback(async (text) => {
    // Adiciona a mensagem do usuário
    const userMessage = {
      text,
      sender: 'user',
      time: getCurrentTime()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Salvar mensagem do usuário no Firestore
    if (isAuthenticated) {
      await saveMessageToFirestore(text, 'user');
    }
    
    // Processa a mensagem e obtém resposta
    const response = await processMessage(text);
    
    // Adiciona a resposta da IA
    const aiMessage = {
      text: response,
      sender: 'ai',
      time: getCurrentTime()
    };
    
    setMessages(prev => [...prev, aiMessage]);
    
    // Salvar resposta da IA no Firestore
    if (isAuthenticated) {
      await saveMessageToFirestore(response, 'ai');
    }
    
    // Salvar conversa para aprendizado
    if (settings.learningEnabled) {
      await hermesLearning.saveConversation(text, response);
    }
    
    return aiMessage;
  }, [processMessage, settings.learningEnabled, isAuthenticated, saveMessageToFirestore]);

  // Função para limpar a conversa
  const clearConversation = useCallback(() => {
    // Mensagem de confirmação
    const confirmMessage = {
      text: "Conversa limpa. Como posso ajudar você agora?",
      sender: 'ai',
      time: getCurrentTime()
    };
    
    setMessages([confirmMessage]);
    
    // Aqui seria implementada a lógica para limpar no Firebase
  }, []);

  // Função para login com Google
  const loginWithGoogle = useCallback(async () => {
    try {
      setIsTyping(true);
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // O usuário logado
      const loggedUser = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL
      };
      
      setUser(loggedUser);
      setIsAuthenticated(true);
      
      // Carregar mensagens após login
      await loadMessages();
      
      setIsTyping(false);
      
      return loggedUser;
    } catch (error) {
      console.error('Erro ao fazer login com Google:', error);
      setIsTyping(false);
      
      // Mensagem de erro
      const errorMessage = {
        text: "Ocorreu um erro ao fazer login. Por favor, tente novamente.",
        sender: 'ai',
        time: getCurrentTime()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      return null;
    }
  }, [loadMessages]);

  // Função para conectar Telegram
  const connectTelegram = useCallback(async (phoneNumber) => {
    // Simulação de conexão (será substituída pela integração real)
    setIsTyping(true);
    
    return new Promise(resolve => {
      setTimeout(() => {
        setSettings(prev => ({
          ...prev,
          telegramConnected: true
        }));
        
        // Mensagem de confirmação
        const confirmMessage = {
          text: `Telegram conectado com sucesso ao número ${phoneNumber}! Agora você receberá notificações e poderá interagir comigo remotamente.`,
          sender: 'ai',
          time: getCurrentTime()
        };
        
        setMessages(prev => [...prev, confirmMessage]);
        
        setIsTyping(false);
        
        resolve({
          success: true,
          message: 'Telegram conectado com sucesso!'
        });
      }, 2000);
    });
  }, []);

  // Função para alternar resposta por voz
  const toggleVoice = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      voiceEnabled: !prev.voiceEnabled
    }));
    
    // Mensagem de confirmação
    const message = !settings.voiceEnabled
      ? "Resposta por voz ativada. Agora vou falar minhas respostas."
      : "Resposta por voz desativada. Não falarei mais minhas respostas.";
    
    setMessages(prev => [
      ...prev,
      {
        text: message,
        sender: 'ai',
        time: getCurrentTime()
      }
    ]);
    
    return !settings.voiceEnabled;
  }, [settings.voiceEnabled]);

  // Função para salvar configurações
  const saveSettings = useCallback((newSettings) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
    
    // Mensagem de confirmação
    const confirmMessage = {
      text: "Configurações atualizadas com sucesso!",
      sender: 'ai',
      time: getCurrentTime()
    };
    
    setMessages(prev => [...prev, confirmMessage]);
    
    // Atualizar configuração de aprendizado
    if (newSettings.hasOwnProperty('learningEnabled')) {
      hermesLearning.setLearningEnabled(newSettings.learningEnabled);
    }
    
    return true;
  }, []);

  // Efeito para inicialização
  useEffect(() => {
    // Verificar se há sessão ativa
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        // Usuário já logado
        const loggedUser = {
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName,
          photoURL: authUser.photoURL
        };
        
        setUser(loggedUser);
        setIsAuthenticated(true);
        
        // Carregar mensagens
        await loadMessages();
      } else {
        // Não há usuário logado, mostrar mensagem de boas-vindas
        const welcomeMessage = {
          text: "Olá! Eu sou Hermes, sua IA evolutiva. Estou aqui para conversar, aprender e evoluir com você. Como posso ajudar hoje?",
          sender: 'ai',
          time: getCurrentTime()
        };
        
        setMessages([welcomeMessage]);
      }
    });
    
    // Limpar listener ao desmontar
    return () => unsubscribe();
  }, [loadMessages]);

  return {
    messages,
    isTyping,
    isAuthenticated,
    user,
    settings,
    sendMessage,
    clearConversation,
    loginWithGoogle,
    connectTelegram,
    toggleVoice,
    saveSettings
  };
}
