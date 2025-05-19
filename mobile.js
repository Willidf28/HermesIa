// Estrutura para automações e app mobile para o HermesVerse
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, orderBy, limit, doc, updateDoc } from 'firebase/firestore';

class HermesMobile {
  constructor() {
    this.devicesCollection = 'mobileDevices';
    this.automationsCollection = 'automations';
    this.notificationsCollection = 'notifications';
    this.qrCodesCollection = 'pairingCodes';
  }

  // Registrar novo dispositivo mobile
  async registerDevice(userId, deviceInfo) {
    try {
      const timestamp = new Date();
      
      // Verificar se o dispositivo já está registrado
      const devicesRef = collection(db, this.devicesCollection);
      const q = query(
        devicesRef,
        where('userId', '==', userId),
        where('deviceId', '==', deviceInfo.deviceId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Atualizar registro existente
        const deviceDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, this.devicesCollection, deviceDoc.id), {
          lastSeen: timestamp,
          deviceName: deviceInfo.deviceName || deviceDoc.data().deviceName,
          deviceModel: deviceInfo.deviceModel || deviceDoc.data().deviceModel,
          osVersion: deviceInfo.osVersion || deviceDoc.data().osVersion,
          appVersion: deviceInfo.appVersion || deviceDoc.data().appVersion,
          pushToken: deviceInfo.pushToken || deviceDoc.data().pushToken
        });
        
        return {
          success: true,
          deviceId: deviceDoc.id,
          message: 'Dispositivo atualizado com sucesso',
          isNew: false
        };
      }
      
      // Criar novo registro
      const deviceData = {
        userId,
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName || 'Dispositivo sem nome',
        deviceModel: deviceInfo.deviceModel || 'Desconhecido',
        osVersion: deviceInfo.osVersion || 'Desconhecido',
        appVersion: deviceInfo.appVersion || '1.0.0',
        pushToken: deviceInfo.pushToken || null,
        createdAt: timestamp,
        lastSeen: timestamp,
        status: 'active'
      };
      
      const docRef = await addDoc(collection(db, this.devicesCollection), deviceData);
      
      return {
        success: true,
        deviceId: docRef.id,
        message: 'Dispositivo registrado com sucesso',
        isNew: true
      };
    } catch (error) {
      console.error('Erro ao registrar dispositivo:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Gerar código de pareamento QR
  async generatePairingCode(userId) {
    try {
      // Gerar código único
      const pairingCode = this.generateRandomCode(8);
      const timestamp = new Date();
      const expiresAt = new Date(timestamp.getTime() + 15 * 60 * 1000); // 15 minutos
      
      // Salvar no Firestore
      const pairingData = {
        userId,
        pairingCode,
        createdAt: timestamp,
        expiresAt,
        status: 'pending',
        usedBy: null
      };
      
      const docRef = await addDoc(collection(db, this.qrCodesCollection), pairingData);
      
      return {
        success: true,
        pairingId: docRef.id,
        pairingCode,
        expiresAt
      };
    } catch (error) {
      console.error('Erro ao gerar código de pareamento:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verificar código de pareamento
  async verifyPairingCode(pairingCode, deviceInfo) {
    try {
      // Buscar código no Firestore
      const codesRef = collection(db, this.qrCodesCollection);
      const q = query(
        codesRef,
        where('pairingCode', '==', pairingCode),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return {
          success: false,
          error: 'Código de pareamento inválido ou expirado'
        };
      }
      
      const pairingDoc = querySnapshot.docs[0];
      const pairingData = pairingDoc.data();
      
      // Verificar se o código expirou
      if (new Date() > pairingData.expiresAt.toDate()) {
        await updateDoc(doc(db, this.qrCodesCollection, pairingDoc.id), {
          status: 'expired'
        });
        
        return {
          success: false,
          error: 'Código de pareamento expirado'
        };
      }
      
      // Registrar dispositivo
      const registerResult = await this.registerDevice(pairingData.userId, deviceInfo);
      
      if (!registerResult.success) {
        return registerResult;
      }
      
      // Atualizar status do código
      await updateDoc(doc(db, this.qrCodesCollection, pairingDoc.id), {
        status: 'used',
        usedBy: deviceInfo.deviceId,
        usedAt: new Date()
      });
      
      return {
        success: true,
        userId: pairingData.userId,
        deviceId: registerResult.deviceId,
        message: 'Pareamento realizado com sucesso'
      };
    } catch (error) {
      console.error('Erro ao verificar código de pareamento:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Enviar notificação push
  async sendPushNotification(userId, title, body, data = {}) {
    try {
      // Buscar dispositivos do usuário
      const devicesRef = collection(db, this.devicesCollection);
      const q = query(
        devicesRef,
        where('userId', '==', userId),
        where('status', '==', 'active')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return {
          success: false,
          error: 'Nenhum dispositivo registrado para este usuário'
        };
      }
      
      // Registrar notificação no Firestore
      const notificationData = {
        userId,
        title,
        body,
        data,
        sentAt: new Date(),
        status: 'sent',
        deliveredTo: []
      };
      
      const notificationRef = await addDoc(collection(db, this.notificationsCollection), notificationData);
      
      // Preparar tokens para envio
      const tokens = [];
      querySnapshot.forEach(doc => {
        const deviceData = doc.data();
        if (deviceData.pushToken) {
          tokens.push({
            token: deviceData.pushToken,
            deviceId: doc.id
          });
        }
      });
      
      if (tokens.length === 0) {
        await updateDoc(notificationRef, {
          status: 'failed',
          error: 'Nenhum token de push disponível'
        });
        
        return {
          success: false,
          error: 'Nenhum token de push disponível'
        };
      }
      
      // Em produção, aqui seria feita a integração com FCM ou outro serviço de push
      // Esta é uma simulação do envio
      const sentTokens = [];
      
      for (const tokenInfo of tokens) {
        // Simular envio bem-sucedido
        sentTokens.push(tokenInfo.deviceId);
      }
      
      // Atualizar status da notificação
      await updateDoc(notificationRef, {
        status: 'delivered',
        deliveredTo: sentTokens,
        deliveredAt: new Date()
      });
      
      return {
        success: true,
        notificationId: notificationRef.id,
        deliveredTo: sentTokens.length,
        message: 'Notificação enviada com sucesso'
      };
    } catch (error) {
      console.error('Erro ao enviar notificação push:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Criar automação
  async createAutomation(userId, automationData) {
    try {
      const timestamp = new Date();
      
      // Validar dados da automação
      if (!automationData.name || !automationData.trigger || !automationData.action) {
        return {
          success: false,
          error: 'Dados de automação incompletos'
        };
      }
      
      // Criar automação no Firestore
      const automation = {
        userId,
        name: automationData.name,
        description: automationData.description || '',
        trigger: automationData.trigger,
        condition: automationData.condition || null,
        action: automationData.action,
        enabled: true,
        createdAt: timestamp,
        updatedAt: timestamp,
        lastTriggered: null,
        triggerCount: 0
      };
      
      const docRef = await addDoc(collection(db, this.automationsCollection), automation);
      
      return {
        success: true,
        automationId: docRef.id,
        message: 'Automação criada com sucesso'
      };
    } catch (error) {
      console.error('Erro ao criar automação:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Listar automações do usuário
  async listAutomations(userId) {
    try {
      const automationsRef = collection(db, this.automationsCollection);
      const q = query(
        automationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const automations = [];
      
      querySnapshot.forEach(doc => {
        automations.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return {
        success: true,
        automations
      };
    } catch (error) {
      console.error('Erro ao listar automações:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Ativar/desativar automação
  async toggleAutomation(automationId, userId, enabled) {
    try {
      // Verificar se a automação existe e pertence ao usuário
      const automationRef = doc(db, this.automationsCollection, automationId);
      const automationSnap = await automationRef.get();
      
      if (!automationSnap.exists()) {
        return {
          success: false,
          error: 'Automação não encontrada'
        };
      }
      
      const automationData = automationSnap.data();
      
      if (automationData.userId !== userId) {
        return {
          success: false,
          error: 'Você não tem permissão para modificar esta automação'
        };
      }
      
      // Atualizar status
      await updateDoc(automationRef, {
        enabled,
        updatedAt: new Date()
      });
      
      return {
        success: true,
        message: `Automação ${enabled ? 'ativada' : 'desativada'} com sucesso`
      };
    } catch (error) {
      console.error('Erro ao modificar automação:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Executar automação (para testes)
  async testAutomation(automationId, userId) {
    try {
      // Verificar se a automação existe e pertence ao usuário
      const automationRef = doc(db, this.automationsCollection, automationId);
      const automationSnap = await automationRef.get();
      
      if (!automationSnap.exists()) {
        return {
          success: false,
          error: 'Automação não encontrada'
        };
      }
      
      const automationData = automationSnap.data();
      
      if (automationData.userId !== userId) {
        return {
          success: false,
          error: 'Você não tem permissão para testar esta automação'
        };
      }
      
      if (!automationData.enabled) {
        return {
          success: false,
          error: 'Automação está desativada'
        };
      }
      
      // Simular execução da automação
      // Em produção, aqui seria implementada a lógica real de execução
      
      // Atualizar contadores
      await updateDoc(automationRef, {
        lastTriggered: new Date(),
        triggerCount: automationData.triggerCount + 1
      });
      
      return {
        success: true,
        message: 'Automação executada com sucesso (teste)',
        result: {
          action: automationData.action,
          timestamp: new Date()
        }
      };
    } catch (error) {
      console.error('Erro ao testar automação:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Gerar código aleatório
  generateRandomCode(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      code += characters.charAt(randomIndex);
    }
    
    return code;
  }
}

// Exportar instância única
export const hermesMobile = new HermesMobile();
