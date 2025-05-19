// Implementação do sistema de aprendizado e evolução automatizada para Hermes
import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, orderBy, limit, doc, updateDoc } from 'firebase/firestore';

class HermesLearning {
  constructor() {
    this.conversationsCollection = 'conversations';
    this.patternsCollection = 'patterns';
    this.knowledgeCollection = 'knowledge';
    this.learningEnabled = true;
    this.lastAnalysisTimestamp = null;
    this.analysisInterval = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
  }

  // Salvar mensagem para aprendizado
  async saveConversation(userMessage, aiResponse, context = {}) {
    if (!this.learningEnabled) return null;
    
    try {
      const timestamp = new Date();
      
      const conversationData = {
        userMessage: {
          text: userMessage,
          timestamp: timestamp
        },
        aiResponse: {
          text: aiResponse,
          timestamp: timestamp
        },
        context: context,
        analyzed: false,
        createdAt: timestamp
      };
      
      const docRef = await addDoc(collection(db, this.conversationsCollection), conversationData);
      
      // Verificar se é hora de analisar conversas para aprendizado
      await this.checkAndTriggerAnalysis();
      
      return docRef.id;
    } catch (error) {
      console.error('Erro ao salvar conversa para aprendizado:', error);
      return null;
    }
  }

  // Verificar se é hora de analisar conversas e extrair padrões
  async checkAndTriggerAnalysis() {
    const now = new Date();
    
    // Se nunca analisou ou se passou o intervalo desde a última análise
    if (!this.lastAnalysisTimestamp || 
        (now.getTime() - this.lastAnalysisTimestamp.getTime() > this.analysisInterval)) {
      
      await this.analyzeConversations();
      this.lastAnalysisTimestamp = now;
    }
  }

  // Analisar conversas para extrair padrões e conhecimento
  async analyzeConversations() {
    try {
      // Buscar conversas não analisadas
      const q = query(
        collection(db, this.conversationsCollection),
        where('analyzed', '==', false),
        orderBy('createdAt', 'asc'),
        limit(100)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('Nenhuma conversa nova para analisar');
        return;
      }
      
      // Agrupar mensagens por temas/padrões
      const conversations = [];
      const conversationRefs = [];
      
      querySnapshot.forEach(doc => {
        conversations.push(doc.data());
        conversationRefs.push(doc.ref);
      });
      
      // Extrair padrões (simplificado - em produção usaria algoritmos mais avançados)
      const patterns = this.extractPatterns(conversations);
      
      // Salvar padrões identificados
      for (const pattern of patterns) {
        await addDoc(collection(db, this.patternsCollection), {
          ...pattern,
          createdAt: new Date()
        });
      }
      
      // Marcar conversas como analisadas
      const updatePromises = conversationRefs.map(ref => 
        updateDoc(ref, { analyzed: true })
      );
      
      await Promise.all(updatePromises);
      
      console.log(`Analisadas ${conversations.length} conversas, extraídos ${patterns.length} padrões`);
      
      // Atualizar base de conhecimento
      await this.updateKnowledgeBase(patterns);
      
    } catch (error) {
      console.error('Erro ao analisar conversas:', error);
    }
  }

  // Extrair padrões das conversas (versão simplificada)
  extractPatterns(conversations) {
    const patterns = [];
    const topics = {};
    
    // Agrupar por tópicos baseados em palavras-chave
    for (const conv of conversations) {
      const userText = conv.userMessage.text.toLowerCase();
      const aiText = conv.aiResponse.text.toLowerCase();
      
      // Lista de tópicos possíveis (seria mais sofisticado em produção)
      const topicKeywords = {
        'saudação': ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'hey'],
        'identidade': ['quem é você', 'o que você é', 'sua função', 'seu nome'],
        'capacidades': ['o que pode fazer', 'suas habilidades', 'consegue', 'pode me ajudar'],
        'telegram': ['telegram', 'notificação', 'mensagem', 'celular'],
        'voz': ['voz', 'falar', 'audio', 'som'],
        'aprendizado': ['aprende', 'aprendizado', 'evolui', 'melhora'],
        'segurança': ['seguro', 'segurança', 'privacidade', 'dados']
      };
      
      // Identificar tópico
      let identifiedTopic = 'outros';
      
      for (const [topic, keywords] of Object.entries(topicKeywords)) {
        if (keywords.some(keyword => userText.includes(keyword))) {
          identifiedTopic = topic;
          break;
        }
      }
      
      // Agrupar por tópico
      if (!topics[identifiedTopic]) {
        topics[identifiedTopic] = [];
      }
      
      topics[identifiedTopic].push({
        userMessage: conv.userMessage.text,
        aiResponse: conv.aiResponse.text
      });
    }
    
    // Criar padrões a partir dos tópicos agrupados
    for (const [topic, examples] of Object.entries(topics)) {
      if (examples.length > 0) {
        patterns.push({
          topic: topic,
          examples: examples,
          frequency: examples.length,
          lastUpdated: new Date()
        });
      }
    }
    
    return patterns;
  }

  // Atualizar base de conhecimento com novos padrões
  async updateKnowledgeBase(patterns) {
    try {
      // Para cada tópico, atualizar ou criar entrada na base de conhecimento
      for (const pattern of patterns) {
        // Verificar se já existe conhecimento sobre este tópico
        const q = query(
          collection(db, this.knowledgeCollection),
          where('topic', '==', pattern.topic),
          limit(1)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          // Criar novo conhecimento
          await addDoc(collection(db, this.knowledgeCollection), {
            topic: pattern.topic,
            responses: this.generateResponses(pattern),
            examples: pattern.examples,
            confidence: 0.7, // Confiança inicial
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } else {
          // Atualizar conhecimento existente
          const docRef = querySnapshot.docs[0].ref;
          const existingData = querySnapshot.docs[0].data();
          
          // Mesclar exemplos existentes com novos
          const combinedExamples = [
            ...existingData.examples,
            ...pattern.examples
          ];
          
          // Limitar a 50 exemplos para não crescer indefinidamente
          const limitedExamples = combinedExamples.slice(0, 50);
          
          // Aumentar confiança com mais exemplos (até máximo de 0.95)
          const newConfidence = Math.min(0.95, existingData.confidence + 0.01);
          
          await updateDoc(docRef, {
            examples: limitedExamples,
            responses: this.generateResponses(pattern, existingData.responses),
            confidence: newConfidence,
            updatedAt: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar base de conhecimento:', error);
    }
  }

  // Gerar respostas baseadas em padrões
  generateResponses(pattern, existingResponses = []) {
    // Usar respostas existentes como base
    let responses = [...existingResponses];
    
    // Adicionar novas respostas baseadas nos exemplos
    if (pattern.examples.length > 0) {
      // Selecionar as melhores respostas dos exemplos (simplificado)
      const newResponses = pattern.examples
        .map(ex => ex.aiResponse)
        .filter(response => 
          // Evitar respostas muito curtas ou genéricas
          response.length > 50 &&
          !response.includes("Entendi sua mensagem") &&
          !response.includes("Estou em fase inicial")
        )
        .slice(0, 3); // Limitar a 3 novas respostas
      
      responses = [...responses, ...newResponses];
      
      // Limitar a 5 respostas por tópico
      if (responses.length > 5) {
        responses = responses.slice(0, 5);
      }
    }
    
    return responses;
  }

  // Buscar resposta da base de conhecimento
  async getResponseFromKnowledge(userMessage) {
    try {
      const userText = userMessage.toLowerCase();
      
      // Lista de tópicos possíveis (seria mais sofisticado em produção)
      const topicKeywords = {
        'saudação': ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'hey'],
        'identidade': ['quem é você', 'o que você é', 'sua função', 'seu nome'],
        'capacidades': ['o que pode fazer', 'suas habilidades', 'consegue', 'pode me ajudar'],
        'telegram': ['telegram', 'notificação', 'mensagem', 'celular'],
        'voz': ['voz', 'falar', 'audio', 'som'],
        'aprendizado': ['aprende', 'aprendizado', 'evolui', 'melhora'],
        'segurança': ['seguro', 'segurança', 'privacidade', 'dados']
      };
      
      // Identificar tópico
      let identifiedTopic = null;
      
      for (const [topic, keywords] of Object.entries(topicKeywords)) {
        if (keywords.some(keyword => userText.includes(keyword))) {
          identifiedTopic = topic;
          break;
        }
      }
      
      if (!identifiedTopic) {
        return null; // Nenhum tópico identificado
      }
      
      // Buscar conhecimento sobre o tópico
      const q = query(
        collection(db, this.knowledgeCollection),
        where('topic', '==', identifiedTopic),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null; // Nenhum conhecimento sobre o tópico
      }
      
      const knowledge = querySnapshot.docs[0].data();
      
      // Verificar se há respostas disponíveis
      if (!knowledge.responses || knowledge.responses.length === 0) {
        return null;
      }
      
      // Selecionar uma resposta aleatória
      const randomIndex = Math.floor(Math.random() * knowledge.responses.length);
      return {
        text: knowledge.responses[randomIndex],
        confidence: knowledge.confidence,
        topic: identifiedTopic
      };
      
    } catch (error) {
      console.error('Erro ao buscar resposta da base de conhecimento:', error);
      return null;
    }
  }

  // Ativar/desativar aprendizado
  setLearningEnabled(enabled) {
    this.learningEnabled = enabled;
    return this.learningEnabled;
  }

  // Verificar status do aprendizado
  isLearningEnabled() {
    return this.learningEnabled;
  }
}

// Exportar instância única
export const hermesLearning = new HermesLearning();
